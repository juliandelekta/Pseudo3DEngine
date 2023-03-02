const Lightmap = {
    LIGHTMAP_SIZE: 1/32,

    addLightmapToSector(sector) {
        for (const segment of sector.segments)
            this.addLightmapToSegment(segment)

        this.addLightmapToFlats(sector)
        this.addLightmapToSlopes(sector)
    },

    addLightmapToSegment(segment) {
        (
            segment.wall.isPortal ? this.addLightmapToPortal
        :   segment.wall.isStack  ? this.addLightmapToStack
        :                           this.addLightmapToSolid
        ).bind(this)(
            segment.wall,
            Math.ceil(segment.length / this.LIGHTMAP_SIZE) + 2,
            segment.sector.floor.z,
            segment.sector.ceiling.z
        )
    },

    newLightmap(w, h) {
        return {
            data: new Uint8ClampedArray(w * h),
            w, h
        }
    },

    addLightmapToPortal(portal, width, floor, ceil) {
        const upperH = Math.ceil((ceil - portal.next.ceiling.z) / this.LIGHTMAP_SIZE) + 2,
              lowerH = Math.ceil((portal.next.floor.z - floor)  / this.LIGHTMAP_SIZE) + 2

        portal.upperLightmap = upperH > 0 ? this.newLightmap(width, upperH) : {}
        portal.lowerLightmap = lowerH > 0 ? this.newLightmap(width, lowerH) : {}
    },

    addLightmapToStack(stack, width, floor, ceil) {
        let z = 0
        for (const wall of stack.walls) {
            const top = floor + wall.z || ceil,
                bottom = floor + z
            if (wall.isPortal)
                this.addLightmapToPortal(wall, width, bottom, top)
            else
                this.addLightmapToSolid(wall, width, bottom, top)

            z = wall.z
        }
    },

    addLightmapToSolid(solid, width, floor, ceil) {
        solid.lightmap = this.newLightmap(
            width,
            Math.ceil((ceil - floor) / this.LIGHTMAP_SIZE) + 2
        )
    },

    addLightmapToFlats(sector) {
        let x0 = sector.segments.reduce((acc, s) => Math.min(acc, s.p0.x, s.p1.x), Infinity),
            y0 = sector.segments.reduce((acc, s) => Math.min(acc, s.p0.y, s.p1.y), Infinity),
            x1 = sector.segments.reduce((acc, s) => Math.max(acc, s.p0.x, s.p1.x), -Infinity),
            y1 = sector.segments.reduce((acc, s) => Math.max(acc, s.p0.y, s.p1.y), -Infinity)

        const width = Math.ceil((x1 - x0) / this.LIGHTMAP_SIZE) + 2,
            height = Math.ceil((y1 - y0) / this.LIGHTMAP_SIZE) + 2,
            flatLightmap = {
                size: 1 / this.LIGHTMAP_SIZE,
                origin: {
                    u: x0,
                    v: y0
                }
            }

        if (!sector.slopeFloor && !sector.floor.next && !sector.floor.parallax)
            sector.floor.lightmap = Object.assign(
                this.newLightmap(width, height),
                flatLightmap
            )

        if (!sector.slopeCeil && !sector.ceiling.next && !sector.ceiling.parallax)
            sector.ceiling.lightmap = Object.assign(
                this.newLightmap(width, height),
                flatLightmap
            )
    },

    addLightmapToSlope(slope, isSlopeFloor, z0) {
        for (const segment of slope.segments) {
            const max = Math.max(segment.p0.z, segment.p1.z)

            this.addLightmapToSolid(
                segment,
                Math.ceil(segment.length / this.LIGHTMAP_SIZE) + 2,
                isSlopeFloor ? z0 : max,
                isSlopeFloor ? max : z0
            )
            segment.lightmap.size = 1 / this.LIGHTMAP_SIZE
        }

        const S0 = slope.segments[0],
            S1 = slope.segments[1],
            S2 = slope.segments[2],
            S3 = slope.segments[3]

        let dx = S1.p0.x - S0.p0.x,
            dy = S1.p0.y - S0.p0.y,
            dz = S1.p0.z - S0.p0.z
        const width = Math.ceil(Math.sqrt(dx * dx + dy * dy + dz * dz) / this.LIGHTMAP_SIZE) + 2

        dx = S2.p0.x - S1.p0.x
        dy = S2.p0.y - S1.p0.y
        dz = S2.p0.z - S1.p0.z
        const height = Math.ceil(Math.sqrt(dx * dx + dy * dy + dz * dz) / this.LIGHTMAP_SIZE) + 2

        const u0 = .5, u1 = width-2 + .5,
            v0 = .5, v1 = height-2 + .5

        S0.p0.ul = u0
        S0.p0.vl = v0
        S0.p1.ul = u1
        S0.p1.vl = v0

        S1.p0.ul = u1
        S1.p0.vl = v0
        S1.p1.ul = u1
        S1.p1.vl = v1

        S2.p0.ul = u1
        S2.p0.vl = v1
        S2.p1.ul = u0
        S2.p1.vl = v1

        S3.p0.ul = u0
        S3.p0.vl = v1
        S3.p1.ul = u0
        S3.p1.vl = v0

        slope.lightmap = this.newLightmap(width, height)
        slope.lightmap.size = 1 / this.LIGHTMAP_SIZE
    },

    addLightmapToSlopes(sector) {
        if (sector.slopeFloor)
            this.addLightmapToSlope(sector.slopeFloor, true, sector.floor.z)
        if (sector.slopeCeil)
            this.addLightmapToSlope(sector.slopeCeil, false, sector.ceiling.z)
    }
}