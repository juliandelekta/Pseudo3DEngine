const Renderer = {
    width: 320,
    height: 200,

    renderId: 0,

    init(canvas) {
        // DOM Elements
        this.canvas = canvas
        this.buffer = document.createElement("canvas") // Doble buffering

        // Resolutions
		canvas.width  = this.buffer.width  = this.width
        canvas.height = this.buffer.height = this.height
		canvas.style.width  = this.width * 2 + "px"
        canvas.style.height = this.height * 2 + "px"

        // Contexts
        this.ctx  = this.canvas.getContext("2d")
        this.bctx = this.buffer.getContext("2d")

        // Pixel Data
        this.pixelsLength = this.width * this.height * 4 // 4 porque cada píxel es RGBA
        this.pixels = new Uint8ClampedArray(new ArrayBuffer(this.pixelsLength)).fill(255)
        this.imageData = new ImageData(this.pixels, this.width, this.height)
        this.column = new Uint8ClampedArray(this.height * 4).fill(255)

        // Viewport
        this.MainViewport = Viewport(this.width)
    },

    draw() {
        this.MainViewport.project()

        this.MainViewport.x = 0

        while (this.MainViewport.x < this.width) {
            this.column.fill(255)
            this.MainViewport.top = 0
            this.MainViewport.bottom = this.height
            this.MainViewport.draw()

            this.drawColumn(this.MainViewport.x)
            this.MainViewport.x++
        }

        this.bctx.putImageData(this.imageData, 0, 0)
        this.ctx.drawImage(this.buffer, 0, 0)
        this.renderId++

        ViewportsPool.clear()
        BufferPool.clear()
    },

    drawColumn(col) {
        let i = col << 2
        for (let y = 0; y < this.column.length; y+=4) {
            this.pixels[i]   = this.column[y]
            this.pixels[i+1] = this.column[y+1]
            this.pixels[i+2] = this.column[y+2]
            i += this.width << 2
        }
    }
}
