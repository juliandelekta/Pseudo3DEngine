const TextureLoader = {
    textures: {
        "-": {data: [255, 0, 255, 255], w: 1, h: 1}, // Textura por defecto
    },
    packages: [],
    queues: {}, // Colas de espera para las texturas
    canvas: document.createElement("canvas"),
    loading: 0,
    onReady: () => {console.log("TextureLoader: Ready")},
    textureSet: new Set(["-"]),

    init() {
        this.ctx = this.canvas.getContext("2d", {willReadFrequently: true})
    },

    load(packageName, json) {
        const raws = JSON.parse(json)
        raws.forEach(r => this.textureSet.add(r.name))
        this.packages.push({name: packageName, raws: JSON.parse(json)})
    },

    makeTextures() {
        for (const pkg of this.packages) {
            for (const raw of pkg.raws)
                this.addTexture(raw)

            console.log("Loaded package: " + pkg.name)
        }
    },

    addTexture(raw) {
        const img = new Image()
        img.src = 'data:image/png;base64,' + raw.data

        img.width  = raw.h
        img.height = raw.w
        this.loading++

        img.onload = () => {
            this.canvas.width  = raw.h
            this.canvas.height = raw.w

            this.ctx.drawImage(img, 0, 0)

            raw.data = this.ctx.getImageData(0, 0, raw.h, raw.w).data

            this.textures[raw.name] = raw

            // Atiende los pedidos
            if (this.queues[raw.name]) {
                for (const call of this.queues[raw.name])
                    call(raw)
                this.queues[raw.name] = null
            }
            this.loading--
            if (!this.loading) this.onReady()
        }
    },

    getTexture(name, asyncCall) {
        if (!this.textureSet.has(name)) console.error("Texture not loaded: " + name)
        if (this.textures[name]) {
            asyncCall(this.textures[name])
        } else {
            const queue = this.queues[name]
            if (queue) {
                queue.push(asyncCall)
            } else {
                this.queues[name] = [asyncCall]
            }
        }
    }
}
