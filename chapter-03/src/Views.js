const Views = {
    scale: 10,
    init () {
        this.canvas = document.createElement("canvas")
        this.ctx = this.canvas.getContext("2d")
        this.canvas.width  = Screen.width
        this.canvas.height = Screen.height
    },

    clean() {
        this.ctx.fillStyle = "black"
        this.ctx.fillRect(0, 0, Screen.width, Screen.height)
        Screen.ctx.fillStyle = "black"
        Screen.ctx.fillRect(0, 0, Screen.width, Screen.height)
    },

    worldSpace() {
        this.clean()
        const ctx = this.ctx
        const l = this.scale

        // Dibujar segmento por segmento
        for (const s of mainViewport.sector.segments) {
            ctx.strokeStyle = s.color
            ctx.beginPath()
                ctx.moveTo(s.p0.x * l, s.p0.y * l)
                ctx.lineTo(s.p1.x * l, s.p1.y * l)
            ctx.stroke()
        }

        // Dibuja la cámara con una línea indicando la dirección
        const px = Camera.pos.x * l,
              py = Camera.pos.y * l;
        // Eje i
        ctx.strokeStyle = "#ddd"
        ctx.beginPath()
            ctx.moveTo(px, py)
            ctx.lineTo(px + Camera.dir.x * 10, py + Camera.dir.y * 10)
        ctx.stroke()
        // Eje j
        ctx.strokeStyle = "#0dd"
        ctx.beginPath()
            ctx.moveTo(px, py)
            ctx.lineTo(px - Camera.dir.y * 10, py + Camera.dir.x * 10)
        ctx.stroke()
        // Centro de la cámara
        ctx.fillStyle = "#fff"
        ctx.fillRect(px - 1, py - 1, 3, 3)

        // Dibuja los límites del FOV
        ctx.strokeStyle = "#e30"
        ctx.beginPath()
            ctx.moveTo(px, py)
            ctx.lineTo(px + Math.cos(Camera.angle - Camera.FOV * .5) * 1000, py + Math.sin(Camera.angle - Camera.FOV * .5) * 1000)
            ctx.moveTo(px, py)
            ctx.lineTo(px + Math.cos(Camera.angle + Camera.FOV * .5) * 1000, py + Math.sin(Camera.angle + Camera.FOV * .5) * 1000)
        ctx.stroke()
    },

    cameraSpace() {
        this.clean()
        const ctx = this.ctx
        const l = this.scale
        const px = Screen.width  / 2
        const py = Screen.height / 2 + 60

        // Dibujar segmento por segmento
        for (const s of mainViewport.sector.visibles) {
            ctx.strokeStyle = s.color
            ctx.beginPath()
                ctx.moveTo(s.p0.xp * l + px, s.p0.yp * l + py)
                ctx.lineTo(s.p1.xp * l + px, s.p1.yp * l + py)
            ctx.stroke()
        }

        // Dibuja la cámara con una línea indicando la dirección
        // Eje i'
        ctx.strokeStyle = "#ddd"
        ctx.beginPath()
            ctx.moveTo(px, py)
            ctx.lineTo(px, py - 10)
        ctx.stroke()
        // Eje j'
        ctx.strokeStyle = "#0dd"
        ctx.beginPath()
            ctx.moveTo(px, py)
            ctx.lineTo(px + 10, py)
        ctx.stroke()
        // Centro de la cámara
        ctx.fillStyle = "#fff"
        ctx.fillRect(px - 1, py - 1, 3, 3)

        // Dibuja los límites del FOV
        ctx.strokeStyle = "#e30"
        ctx.beginPath()
            ctx.moveTo(px, py)
            ctx.lineTo(px - 1000, py - 1000)
            ctx.moveTo(px, py)
            ctx.lineTo(px + 1000, py - 1000)
        ctx.stroke()
    },

    depthSpace() {
        this.clean()
        const ctx = this.ctx
        const l = 100
        const offset = 60

        // Dibujar segmento por segmento
        for (const s of mainViewport.sector.visibles) {
            ctx.strokeStyle = s.color
            ctx.beginPath()
                ctx.moveTo(s.p0.col, s.p0.depth * l + offset)
                ctx.lineTo(s.p1.col, s.p1.depth * l + offset)
            ctx.stroke()
        }
    },

    screenSpace() {
        this.clean()
        const ctx = Screen.ctx

        // Dibujar columna por columna
        for (let x = 0; x < Screen.width; x++) {
            const s = mainViewport.closest[x]
            if (!s) continue
            ctx.strokeStyle = s.color
            ctx.beginPath()
                ctx.moveTo(x, ~~(s.getTopAt(x)))
                ctx.lineTo(x, ~~(s.getBottomAt(x)))
            ctx.stroke()
        }
    }
}
