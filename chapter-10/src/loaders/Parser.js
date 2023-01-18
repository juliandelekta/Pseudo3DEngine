const Parser = {

    parseLevel(info) {
        const level = {sectors: {}, interfaces: {}}

        for (const name in info.sectors)
            level.sectors[name] = this.parseSector(name, info.sectors[name])

        level.player = this.parsePlayer(info.player)

        return level
    },

    parseSector(name, info) {
        const sector = Sector(name)

        sector.floor = this.parseFloor(info.floor)
        sector.ceiling = this.parseCeiling(info.ceiling)

        for (const loop in info.loops)
            sector.segments.push(...this.parseLoop(info.loops[loop]))

        if (info.slopeFloor) sector.slopeFloor = this.parseSlope(info.slopeFloor, info.loops.border.v, sector.floor.texture, true)
        if (info.slopeCeil)  sector.slopeCeil  = this.parseSlope(info.slopeCeil,  info.loops.border.v, sector.ceiling.texture)

        if (info.things)
            for (const thing of info.things)
                sector.things.push(this.parseThing(thing))

        return sector
    },

    parseFloor(info) {
        const floor = Floor()

        this.parseFlat(floor, info)

        return floor
    },

    parseCeiling(info) {
        const ceil = Ceiling()

        this.parseFlat(ceil, info)

        return ceil
    },

    parseFlat(flat, info) {
        flat.z = isNaN(info.z) ? 0 : info.z

        if (info.texture) {
            flat.texture = this.parseTexture(info.texture)
            flat.isRelative = !!info.isRelative
            flat.parallax = !!info.parallax
        }

        if (info.next) flat.next = info.next
    },

    parseLoop(info) {
        return info.walls.map((wall, i) => this.parseSegment(
            wall,
            info.v[i * 2], info.v[i * 2 + 1],
            info.v[(i * 2 + 2) % info.v.length], info.v[(i * 2 + 3) % info.v.length]
        ))
    },

    parseSegment(info, x0, y0, x1, y1) {
        const segment = Segment(x0, y0, x1, y1)
        const wall = this.parseWall(info)

        segment.wall = wall
        wall.segment = segment

        return segment
    },

    parseWall(info) {
        let wall;

        if (info.walls) {
            wall = Stack()

            for (const subinfo of info.walls) {
                const subwall = this.parseWall(subinfo)
                wall.walls.push(subwall)
                subwall.z = subinfo.z
            }
        } else if (info.next) {
            wall = Portal()

            if (info.texture) {
                wall.lower = wall.upper = this.parseTexture(info.texture)
            } else {
                wall.upper = this.parseTexture(info.upper)
                wall.lower = this.parseTexture(info.lower)
            }

            wall.next = info.next
        } else {
            wall = Wall()

            wall.texture = this.parseTexture(info.texture)
        }

        return wall
    },

    parseTexture(info) {
        info = (""+info).split(" ")
        const scale  = (info[1] || "1,1").split(",").map(x => parseFloat(x))
        const offset = (info[2] || "0,0").split(",").map(x => parseFloat(x))

        return {
            name: info[0],
            offU:   -offset[0], offV:   -offset[1],
            scaleU: scale[0],  scaleV: scale[1]
        }
    },

    parsePlayer(info) {
        return {
            sector: info.sector || "main",
            pos: {
                x: info.x || 0,
                y: info.y || 0,
                z: info.z || 0
            },
            angle: info.angle
        }
    },

    parseSlope(info, vertices, texture, isFloor = false) {
        const slope = isFloor ? SlopeFloor() : SlopeCeil()

        slope.texture = texture
        slope.sidewall = this.parseTexture(info.sidewall)
        slope.isRelative = !!info.isRelative

        slope.segments = info.z.map((z, i) => {
            const segment = Segment(
                vertices[i * 2], vertices[i * 2 + 1],
                vertices[(i * 2 + 2) % vertices.length], vertices[(i * 2 + 3) % vertices.length]
            )
            segment.p0.z = z
            segment.p1.z = info.z[(i + 1) % info.z.length]

            return segment
        })

        return slope
    },

    parseThing(info) {
        const definition = ResourceManager.things[info.thing]
        let thing
        switch(definition.type) {
            case "wall":
                thing = WallSprite()
                thing.angle = (info.angle || 0) * Math.PI / 180
                thing.doubleSide = !!info.doubleSide
                break
            default:
                thing = FaceSprite()
                if (definition.directional)
                    thing.angle = (info.angle || 0) * Math.PI / 180
                break
        }
        thing.thing = definition
        thing.pos.x = info.x
        thing.pos.y = info.y
        thing.pos.z = info.z
        thing.h = info.h || 1
        thing.w = info.w || 1

        thing.init()

        return thing
    }

}
