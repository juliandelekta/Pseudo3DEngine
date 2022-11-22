const Screen = {
    width:  320, // px
    height: 200, // px
    ctx: null,   // Sobre este context vamos a dibujar lo que ve el jugador
}

const Canvas = {
    init(canvas) {
        // DOM Elements
        this.canvas = canvas
        this.buffer = document.createElement("canvas")

        // Resolutions
        const w = Screen.width  * 2
        const h = Screen.height * 2
        this.w = w
        this.h = h
		this.canvas.width  = w
        this.canvas.height = h
		canvas.style.width  = w + "px"
        canvas.style.height = h + "px"
        this.buffer.width  = Screen.width
		this.buffer.height = Screen.height

        // Contexts
        this.ctx   = this.canvas.getContext("2d")
        Screen.ctx = this.buffer.getContext("2d")

        Views.init()
    },

    drawLimits() {
        this.ctx.strokeStyle = "#0ff"
        this.ctx.beginPath()
            this.ctx.moveTo(Screen.width, 0)
            this.ctx.lineTo(Screen.width, this.h)
            this.ctx.moveTo(0, Screen.height)
            this.ctx.lineTo(this.w, Screen.height)
        this.ctx.stroke()
    },

    draw() {
        // World Space
        Views.worldSpace()
        this.ctx.drawImage(Views.canvas, 0, 0)

        // Camera Space
        Views.cameraSpace()
        this.ctx.drawImage(Views.canvas, 0, Screen.height)

        // Depth Space
        Views.depthSpace()
        this.ctx.drawImage(Views.canvas, Screen.width, 0)

        // Screen Space
        Views.screenSpace()
        this.ctx.drawImage(this.buffer, Screen.width, Screen.height)

        this.drawLimits()
    }
}
