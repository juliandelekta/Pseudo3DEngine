const Parser = {

    parseLevel(info) {
        const level = {sectors: {}}

        for (const name in info.sectors)
            level.sectors[name] = this.parseSector(name, info.sectors[name])

        level.player = this.parsePlayer(info.player)

        return level
    },

    parseSector(name, info) {
        const sector = Sector(name)

        sector.floor = this.parseFloor(info.floor)
        sector.ceiling = this.parseCeiling(info.ceiling)

        if (info.loops) {
            for (const loop in info.loops)
                sector.segments.push(...this.parseLoop(info.loops[loop]))
        }

        return sector
    },

    parseFloor(info) {
        const floor = Floor()

        floor.z = isNaN(info.z) ? 0 : info.z
        floor.texture = this.parseTexture(info.texture)
        floor.isRelative = !!info.isRelative
        floor.parallax = !!info.parallax

        return floor
    },

    parseCeiling(info) {
        const ceil = Ceiling()

        ceil.z = isNaN(info.z) ? 2 : info.z
        ceil.texture = this.parseTexture(info.texture)
        ceil.isRelative = !!info.isRelative
        ceil.parallax = !!info.parallax

        return ceil
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

        if (info.next) {
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
    }

}
