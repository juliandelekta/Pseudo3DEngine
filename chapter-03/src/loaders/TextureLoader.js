const TextureLoader = {
    textures: {},
    queues: {}, // Colas de espera para las texturas
    canvas: document.createElement("canvas"),

    init() {
        this.ctx = this.canvas.getContext("2d", {willReadFrequently: true})
    },

    load(packageName, json) {
        console.log("Loaded package: " + packageName)

        const raws = JSON.parse(json)

        for (const raw of raws)
            this.addTexture(raw)
    },

    addTexture(raw) {
        const img = new Image()
        img.src = 'data:image/png;base64,' + raw.data

        img.width  = raw.h
        img.height = raw.w

        img.onload = () => {
            this.canvas.width  = raw.w
            this.canvas.height = raw.h

            this.ctx.drawImage(img, 0, 0)

            raw.data = this.ctx.getImageData(0, 0, raw.w, raw.h).data

            this.textures[raw.name] = raw

            // Atiende los pedidos
            if (this.queues[raw.name]) {
                for (const call of this.queues[raw.name])
                    call(raw)
                this.queues[raw.name] = null
            }
        }
    },

    getTexture(name, asyncCall) {
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
