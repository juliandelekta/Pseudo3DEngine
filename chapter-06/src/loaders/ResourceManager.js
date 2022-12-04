const ResourceManager = {
    levels: {},

    loadLevel(obj) {
        const level = Parser.parseLevel(obj)

        Linker.linkLevel(level)

        this.levels[obj.name] = level
        console.log("Loaded Level: " + obj.name)
    },

    loadYAML(yaml) {
        this.loadLevel(
            jsyaml.load(yaml)
        )
    },

    loadTOML(toml) {
        const obj = jstoml.parse(toml)
        // Convertir los arreglos de TOML en hash-tables
        obj.sectors = obj.sectors.reduce((sectors, s) => {
            
            s.loops = s.loops.reduce((loops, l) => {
                loops[l.name] = l
                return loops
            }, {})
            
            sectors[s.name] = s
            return sectors
        }, {})

        this.loadLevel(obj)
    },

    loadJSON(json) {
        this.loadLevel(
            JSON.parse(json)
        )
    },

    setLevel(name) {
        console.log("Setting level: " + name)
        const level = this.levels[name]
        if (!level) return

        Renderer.MainViewport.sector = level.player.sector
        Controls.pos.x = Camera.pos.x = level.player.pos.x
        Controls.pos.y = Camera.pos.y = level.player.pos.y
        Controls.pos.z = Camera.pos.z = level.player.pos.z
        Controls.phi = level.player.angle
        Camera.setAngle(level.player.angle)
    }
}
