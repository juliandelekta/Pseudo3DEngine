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

        sector.subsectors = sector.subsectors.map(x => level.sectors[x])
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
        TextureLoader.getTexture(wall.upper.name, texture => {
            wall.upper.data = texture.data
            wall.upper.h    = texture.h
            wall.upper.w    = texture.w

            wall.upper.lengthU = wall.segment.length * 32
        })
        TextureLoader.getTexture(wall.lower.name, texture => {
            wall.lower.data = texture.data
            wall.lower.h    = texture.h
            wall.lower.w    = texture.w

            wall.lower.lengthU = wall.segment.length * 32
        })
    },

    linkPlayer(player, level) {
        player.sector = level.sectors[player.sector]
    },

    linkThings(things) {
        for (const name in things) {
            const thing = things[name]
            if (thing.directional) {
                thing.textures = new Array(8)
                for (let i = 0; i < 8; i++)
                    TextureLoader.getTextureWithFirst(thing.texture + (i+1), texture => {
                        thing.textures[i] = texture
                    })
            }
        }
    },

    linkThing(thing) {
        if (thing.thing.directional) {
            thing.textures = thing.thing.textures
            TextureLoader.getTextureWithFirst(thing.thing.texture + 1, texture => thing.texture = texture)
        } else {
            TextureLoader.getTextureWithFirst(thing.thing.texture, texture => {thing.texture = texture})
        }
    }
}
