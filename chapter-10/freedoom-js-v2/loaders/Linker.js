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
    },

    linkThings(things) {
        for (const name in things) {
            const thing = things[name]
            if (thing.directional) {
                thing.textures = new Array(8).fill(0).map((_, i) => ({name: thing.texture + (i+1)}))
                thing.textures.forEach(this.linkThingTexture)
            } else {
                thing.texture = {name: thing.texture}
                this.linkThingTexture(thing.texture)
            }
        }
    },

    linkThingTexture(texture) {
        TextureLoader.getTexture(texture.name, info => {
            texture.data = info.data
            texture.h    = info.h
            texture.w    = info.w

            // Completa el arreglo que indica el primer píxel no transparente
            texture.first = new Uint8Array(texture.w)
            for (let x = 0; x < info.w; x++) {
                let y = 0

                while (y < info.h && info.data[(x * info.h + y) * 4 + 3] === 0)
                    y++

                texture.first[x] = y
            }
        })
    },

    linkThing(thing) {
        if (thing.thing.directional) {
            thing.textures = thing.thing.textures
            thing.texture = thing.textures[0]
        } else
            thing.texture = thing.thing.texture
    }
}
