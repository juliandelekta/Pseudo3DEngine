const Raytracer = {
    ray: segment_t(0,0,0, 0,0,0),
    t0: 0,
    light: null,

    // Información de colisió con Segments
    hitInfo: {
        t: Infinity,
        object: null,

        update(t, object) {
            if (t > Raytracer.t0 && t < this.t) {
                this.t = t
                this.object = object
            }
        },

        clear() {
            this.t = Infinity
            this.object = null
        }
    },

    // Información de colisió con Flats o Slopes
    hitFlat: {
        t: Infinity,
        next: null,
        object: null,

        update(t, object) {
            if (t > Raytracer.t0 && t < this.t) {
                this.t = t
                this.next = object.next ? Bakery.sectorsMap[object.next.name] : null
                this.object = object
            }
        },

        clear() {
            this.t = Infinity
            this.next = null
            this.object = null
        }
    },

    setTarget(x, y, z) {
        this.ray.x1 = x
        this.ray.y1 = y
        this.ray.z1 = z
    },

    setX(x) {
        this.ray.x1 = x
    },

    setY(y) {
        this.ray.y1 = y
    },

    setZ(z) {
        this.ray.z1 = z
    },

    /**
     * Recibe una lista de luces y una estructura objetivo.
     * Calcula cuánta intensidad de luz se consigue casteando el rayo desde la luz
     * */
    lightInObjective(lights, objective) {
        let l = 0
        for (const light of lights) {
            this.ray.x0 = light.x
            this.ray.y0 = light.y
            this.ray.z0 = light.z
            this.light = light
            this.ray.calculateDir()

            l += this.cast(objective, Bakery.sectorsMap[light.sector], 0)
                ? this.light.getLight(this.ray.length())
                : 0
        }

        return l
    },

    /**
     * Realiza la emisión de la luz
     * @param {LightedObject} objective Estructura objetivo
     * @param {LightedSector} sector Sector a evaluar actualmente
     * @param {Number} t0 Cota inferior del parámetro t. t > t0
     * @returns Si el rayo de luz incide sobre el objective o no
     */
    cast(objective, sector, t0) {
        this.t0 = t0
        this.hitFlat.clear()
        this.hitInfo.clear()

        this.castToFlatsAndSlopes(sector)
        this.castToSegments(sector.segments)

        // Colisiona primero con Segment
        if (this.hitInfo.t < this.hitFlat.t) {
            if (this.hitInfo.object === objective) return true

            const wall = this.hitInfo.object.segment.wall
            const z = this.ray.z0 + this.hitInfo.t * this.ray.dirz

            return wall.isPortal ? (this.castFromPortal(objective, wall, z))
                :  wall.isStack  ? (this.castFromStack(objective, wall, z, sector.floor.z, sector.ceil.z))
                :                  false

        } else
            // Si colisiona primero con el Flat o Slope
            return this.hitFlat.t === Infinity ? false
                :  this.hitFlat.object === objective ? true
                // Si es Portal, paso al siguiente sector
                :  this.hitFlat.next && this.cast(objective, this.hitFlat.next, this.hitFlat.t)
        
    },

    castFromPortal(objective, portal, z) {
        // Si no impacta en ningún Step, pasa el siguiente sector
        return (z > portal.next.floor.z && z < portal.next.ceiling.z) &&
            this.cast(objective, Bakery.sectorsMap[portal.next.name], this.hitInfo.t)
    },

    castFromStack(objective, stack, z, floor, ceil) {
        let z0 = 0

        for (const wall of stack.walls)
            if (z > floor + z0 && z < (floor + wall.z || ceil)) // Si está dentro de esta wall
                return wall.isPortal && this.castFromPortal(objective, wall, z)
    },

    castToSegments(segments) {
        for (const segment of segments)
            if (segment.type.isInFront(this.light.x, this.light.y))
                this.hitInfo.update(
                    Segment_Segment(this.ray, segment.type),
                    segment
                )
    },

    castToFlatsAndSlopes(sector) {
        if (sector.floor) {
            this.hitFlat.update(
                (sector.floor.z - this.ray.z0) / this.ray.dirz,
                sector.floor
            )
        } else if (sector.slopeFloor)
            this.castToSlope(sector.slopeFloor)

        if (sector.ceil) {
            this.hitFlat.update(
                (sector.ceil.z - this.ray.z0) / this.ray.dirz,
                sector.ceil
            )
        } else if (sector.slopeCeil)
            this.castToSlope(sector.slopeCeil)
    },

    castToSlope(slope) {
        this.hitFlat.update(
            Segment_Triangle(this.ray, slope.triangle1),
            slope
        )
        this.hitFlat.update(
            Segment_Triangle(this.ray, slope.triangle2),
            slope
        )

        for (const s of slope.segments)
            if (s.type.isInFront(this.light.x, this.light.y)) {
                // Sumamos 1e-4 a t debido a que los Sidewalls están sobre los Portals,
                // sino realizamos este defasaje, el rayo no los va a ver
                this.hitFlat.update(
                    Segment_Triangle(this.ray, s.triangle1) + 1e-4,
                    s
                )

                this.hitFlat.update(
                    Segment_Triangle(this.ray, s.triangle2) + 1e-4,
                    s
                )
            }
    }
}