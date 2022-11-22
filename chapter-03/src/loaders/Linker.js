const Linker = {
    linkLevel(level) {
        for (const sector in level.sectors)
            this.linkSector(level.sectors[sector])

        this.linkPlayer(level.player, level)
    },

    linkSector(sector) {
        for (const segment of sector.segments)
            this.linkWall(segment.wall)
    },

    linkWall(wall) {
        TextureLoader.getTexture(wall.texture.name, texture => {
            wall.texture.data = texture.data
            wall.texture.h    = texture.h
            wall.texture.w    = texture.w
        })
    },

    linkPlayer(player, level) {
        player.sector = level.sectors[player.sector]
    }

}
