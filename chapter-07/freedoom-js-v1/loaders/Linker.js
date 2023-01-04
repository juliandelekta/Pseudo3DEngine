const Linker = {
    linkLevel(level) {
        for (const sector in level.sectors)
            this.linkSector(level.sectors[sector], level)

        this.linkPlayer(level.player, level)
    },

    linkSector(sector, level) {
        for (const segment of sector.segments) {
            segment.sector = sector
            if (segment.wall.isPortal)
                this.linkPortal(segment.wall, level)
            else
                this.linkWall(segment.wall)
        }

        sector.reference = sector.segments[0].p0

        this.linkTexture(sector.floor.texture)
        this.linkTexture(sector.ceiling.texture)

        sector.floor.sector = sector.ceiling.sector = sector
    },

    linkTexture(t) {
        TextureLoader.getTexture(t.name, texture => {
            t.data = texture.data
            t.h    = texture.h
            t.w    = texture.w
        })
    },

    linkWall(wall) {
        TextureLoader.getTexture(wall.texture.name, texture => {
            wall.texture.data = texture.data
            wall.texture.h    = texture.h
            wall.texture.w    = texture.w

            wall.texture.lengthU =  wall.segment.length * 32
        })
    },

    linkPortal(wall, level) {
        wall.next = level.sectors[wall.next]
        TextureLoader.getTexture(wall.up.name, texture => {
            wall.up.data = texture.data
            wall.up.h    = texture.h
            wall.up.w    = texture.w

            wall.up.lengthU = wall.segment.length * 32
        })
        TextureLoader.getTexture(wall.down.name, texture => {
            wall.down.data = texture.data
            wall.down.h    = texture.h
            wall.down.w    = texture.w

            wall.down.lengthU = wall.segment.length * 32
        })
    },

    linkPlayer(player, level) {
        player.sector = level.sectors[player.sector]
    }

}
