const Bakery = {
    lights: [],
    sectorsMap: null,

    load(lights) {
        for (const light of lights) {
            light.falloff = light.falloff || 0
            if (!light.getLight)
                light.getLight = function(distance) {
                    return 255 / (distance * this.falloff + 1)
                }
            this.lights.push(light)
        }
    },

    bake(level) {
        const sectorsMap = {}
        this.sectorsMap = sectorsMap

        for (const sectorName in level.sectors) {
            const sector = level.sectors[sectorName]

            Lightmap.addLightmapToSector(sector)

            sectorsMap[sectorName] = this.createLightedSector(sector)
        }

        this.bakeSectors(sectorsMap)
    },

    createLightedSector(sector) {
        const lightedSector = {
            segments: sector.segments.map(segment => ({
                type: segment_t(segment.p0.x, segment.p0.y, 0, segment.p1.x, segment.p1.y, 0),
                segment
            })),
            sector
        }

        if (sector.slopeFloor)
            lightedSector.slopeFloor =
                this.createLightedSlope(sector.slopeFloor, sector.floor.z, true)
        else
            lightedSector.floor = this.createLightedFlat(sector.floor, true)

        if (sector.slopeCeil)
            lightedSector.slopeCeil =
                this.createLightedSlope(sector.slopeCeil, sector.ceiling.z, false)
        else
            lightedSector.ceil = this.createLightedFlat(sector.ceiling, false)
        
        return lightedSector
    },

    createLightedFlat(flat, isFloor) {
        return {
            z: flat.parallax ? (isFloor ? -Infinity : Infinity) : flat.z,
            next: flat.next || null,
            flat
        }
    },

    createLightedSlope(slope, z, isFloor) {
        let s0 = slope.segments[0].p0,
            s1 = slope.segments[1].p0,
            s2 = slope.segments[2].p0,
            s3 = slope.segments[3].p0

        const p0 = v3(s0.x, s0.y, isFloor ? s0.z : z - s0.z),
            p1 = v3(s1.x, s1.y, isFloor ? s1.z : z - s1.z),
            p2 = v3(s2.x, s2.y, isFloor ? s2.z : z - s2.z),
            p3 = v3(s3.x, s3.y, isFloor ? s3.z : z - s3.z)

        return {
            triangle1: isFloor
                ? triangle_t(p0, p1, p3)
                : triangle_t(p0, p1, p3).invertN(),
            triangle2: isFloor
                ? triangle_t(p1, p3, p2)
                : triangle_t(p1, p2, p3).invertN(),
            slope,
            segments: slope.segments.map(segment => this.segmentTriangulation(
                segment,
                isFloor ? z : z - segment.p1.z, 
                isFloor ? z : z - segment.p0.z,
                isFloor ? z + segment.p0.z : z,
                isFloor ? z + segment.p1.z : z
            ))
        }
    },

    segmentTriangulation(segment, p0z, p1z, p2z, p3z) {
        const p0 = v3(segment.p1.x, segment.p1.y, p0z),
              p1 = v3(segment.p0.x, segment.p0.y, p1z),
              p2 = v3(segment.p0.x, segment.p0.y, p2z),
              p3 = v3(segment.p1.x, segment.p1.y, p3z)
        return {
            segment,
            type: segment_t(segment.p1.x, segment.p1.y, 0, segment.p0.x, segment.p0.y, 0),
            triangle1: triangle_t(p0, p1, p3),
            triangle2: triangle_t(p1, p2, p3)
        }
    },

    bakeSectors(sectorsMap) {
        for (const sector of Object.values(sectorsMap)) {
            const floor = sector.sector.floor.z,
                  ceil  = sector.sector.ceiling.z

            for (const segment of sector.segments) {
                const wall = segment.segment.wall

                if (wall.isPortal) {
                    // Step UP
                    if (wall.next.floor.z > floor)
                        this.bakeSolid(
                            segment,
                            wall.lowerLightmap,
                            wall.next.floor.z,
                            floor - wall.next.floor.z
                        )

                    // Step DOWN
                    if (wall.next.ceiling.z < ceil)
                        this.bakeSolid(
                            segment,
                            wall.upperLightmap,
                            wall.next.ceiling.z,
                            wall.next.ceiling.z - ceil
                        )

                } else if (wall.isStack)
                    this.bakeStack(segment, wall, floor, ceil)
                else
                    this.bakeSolid(segment, wall.lightmap, ceil, floor - ceil)
            }

            if (sector.slopeFloor)
                this.bakeSlope(sector.slopeFloor, true)
            else if (!sector.floor.next && !sector.floor.flat.parallax)
                this.bakeFlat(sector.floor, true)

            if (sector.slopeCeil)
                this.bakeSlope(sector.slopeCeil, false)
            else if (!sector.ceil.next && !sector.ceil.flat.parallax)
                this.bakeFlat(sector.ceil, false)
        }
    },

    bakeSolid(segment, lightmap, z0, dirz) {
        const du = 1 / (lightmap.w-2),
            dv = 1 / (lightmap.h-2)
            
        const lights = this.lights.filter(light => segment.type.isInFront(light.x, light.y))
        if (!lights.length) return

        for (let u = 1; u < lightmap.w-1; u++) {
            Raytracer.setX(segment.type.x0 + (u - .5) * du * segment.type.dirx)
            Raytracer.setY(segment.type.y0 + (u - .5) * du * segment.type.diry)
            
            for (let v = 1; v < lightmap.h-1; v++) {
                Raytracer.setZ(z0 + (v - .5) * dv * dirz)

                lightmap.data[u * lightmap.h + v] += Raytracer.lightInObjective(lights, segment)
            }
        }

        this.fillBorderPixels(lightmap)
    },

    bakeStack(segment, stack, floor, ceil) {
        let z = 0
        for (const wall of stack.walls) {
            if (wall.isPortal) {
                // Step UP
                if (wall.next.floor.z > floor + z) {
                    this.bakeSolid(
                        segment,
                        wall.lowerLightmap,
                        wall.next.floor.z,
                        wall.next.floor.z - floor + z
                    )
                }
                // Step DOWN
                if (wall.next.ceiling.z < (floor + wall.z || ceil)) {
                    this.bakeSolid(
                        segment,
                        wall.upperLightmap,
                        wall.next.ceiling.z,
                        wall.next.ceiling.z - (floor + wall.z || ceil)
                    )
                }
            } else {
                this.bakeSolid(segment, wall.lightmap, ceil, floor - ceil)
            }
            z = wall.z
        }
    },
    
    bakeFlat(flat, isFloor) {
        const lightmap = flat.flat.lightmap
        Raytracer.setZ(flat.flat.z)

        const lights = this.lights.filter(light => isFloor ? (light.z >= flat.flat.z) : (light.z <= flat.flat.z))
        if (!lights.length) return

        for (let u = 1; u < lightmap.w-1; u++) {
            Raytracer.setX(lightmap.origin.u + (u-.5) * Lightmap.LIGHTMAP_SIZE)

            for (let v = 1; v < lightmap.h-1; v++) {
                Raytracer.setY(lightmap.origin.v + (v-.5) * Lightmap.LIGHTMAP_SIZE)

                lightmap.data[u * lightmap.h + v] += Raytracer.lightInObjective(lights, flat)
            }
        }

        this.fillBorderPixels(lightmap)
    },

    bakeSlope(slope, isFloor) {
        // Sidewalls
        for (const segment of slope.segments) {
            const max = Math.max(segment.segment.p0.z, segment.segment.p1.z)
            this.bakeSolid(
                segment,
                segment.segment.lightmap,
                isFloor ? slope.slope.sector.floor.z : slope.slope.sector.ceiling.z,
                isFloor ? max : -max
            )
        }

        // Slopes
        const lightmap = slope.slope.lightmap,
            T = slope.triangle1

        const du = 1 / (lightmap.w-2),
            dv = 1 / (lightmap.h-2)
            
        const lights = this.lights.filter(light => T.isInFront(light.x, light.y, light.z))
        if (!lights.length) return

        for (let u = 1; u < lightmap.w-1; u++) {
            const u0 = (u - .5) * du
            for (let v = 1; v < lightmap.h-1; v++) {
                const v0 = (v - .5) * dv

                Raytracer.setTarget(
                    T.x0 + u0 * T.ux + v0 * T.vx,
                    T.y0 + u0 * T.uy + v0 * T.vy,
                    T.z0 + u0 * T.uz + v0 * T.vz
                )

                lightmap.data[u * lightmap.h + v] += Raytracer.lightInObjective(lights, slope)
            }
        }
        this.fillBorderPixels(lightmap)
    },

    fillBorderPixels(lightmap) {
        const {data, w, h} = lightmap
        // Márgenes horizontales
        for (let i = 0; i < w; i++) {
            data[i * h] = data[i * h + 1]
            data[(i+1) * h - 1] = data[(i+1) * h - 2]
        }
        // Márgenes laterales
        for (let i = 0; i < h; i++) {
            data[i] = data[i + h]
            data[(w - 1) * h + i] = data[(w - 2) * h + i]
        }
        // Esquina superior izquierda
        data[0] = data[h + 1]
        // Esquina inferior izquierda
        data[h - 1] = data[2 * h - 2]
        // Esquina superior derecha
        data[w * (h - 1) + 1] = data[w * (h - 2) + 2]
        // Esquina inferior derecha
        data[w * h - 1] = data[w * (h - 1) - 1]
    }
}