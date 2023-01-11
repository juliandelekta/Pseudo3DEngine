const Linker = {
    linkLevel(level) {
        for (const sector in level.sectors)
            this.linkSector(level.sectors[sector], level)

        this.linkPlayer(level.player, level)
    },

    linkSector(sector, level) {
        for (const segment of sector.segments) {
            if (segment.wall.isPortal)
                this.linkPortal(segment.wall, level)
            else if (segment.wall.isStack)
                this.linkStack(segment.wall, level)
            else
                this.linkWall(segment.wall)
            segment.sector = sector
        }

        sector.reference = sector.segments[0].p0
		
		this.linkFlat(sector.floor,   level, false)
        this.linkFlat(sector.ceiling, level, true)

        sector.floor.sector = sector.ceiling.sector = sector
    },

    linkTexture(t) {
        TextureLoader.getTexture(t.name, texture => {
            t.data = texture.data
            t.h    = texture.h
            t.w    = texture.w
        })
    },

    linkFlat(flat, level, ceiling = true) {
        if (flat.next) {
            if (!level.interfaces[flat.next])
				level.interfaces[flat.next] = Interface(...flat.next.split("-").map(s => level.sectors[s]))
			
			const interface = level.interfaces[flat.next]
			interface[ceiling ? "addDown" : "addUp"](flat)
			flat.interface = interface
			flat.next = ceiling ? interface.upSector : interface.downSector
        } else
            this.linkTexture(flat.texture)
    },

    linkWall(wall) {
        TextureLoader.getTexture(wall.texture.name, texture => {
            wall.texture.data = texture.data
            wall.texture.h    = texture.h
            wall.texture.w    = texture.w

            wall.texture.lengthU = texture.w * wall.segment.length / wall.texture.scaleU
        })
    },

    linkPortal(wall, level) {
        TextureLoader.getTexture(wall.upper.name, texture => {
            wall.upper.data = texture.data
            wall.upper.h    = texture.h
            wall.upper.w    = texture.w

            wall.upper.lengthU = texture.w * wall.segment.length / wall.upper.scaleU
        })
        TextureLoader.getTexture(wall.lower.name, texture => {
            wall.lower.data = texture.data
            wall.lower.h    = texture.h
            wall.lower.w    = texture.w

            wall.lower.lengthU = texture.w * wall.segment.length / wall.lower.scaleU
        })
        wall.next = level.sectors[wall.next]
    },

    linkStack(wall, level) {
        for (const subwall of wall.walls) {
            if (subwall.isPortal)
                this.linkPortal(subwall, level)
            else
                this.linkWall(subwall)

            subwall.segment = wall.segment
        }
    },

    linkPlayer(player, level) {
        player.sector = level.sectors[player.sector]
    }

}
