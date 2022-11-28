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

        if (info.floor) {
            sector.floor.z = info.floor.z || 0
        }

        if (info.ceiling) {
            sector.ceiling.z = info.ceiling.z || 0
        }

        if (info.loops) {
            for (const loop in info.loops)
                sector.segments.push(...this.parseLoop(info.loops[loop]))
        }

        return sector
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
        const wall = Wall()

        wall.texture = this.parseTexture(info.texture)

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
