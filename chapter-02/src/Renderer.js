const Renderer = {
    width:  320, // px
    height: 200, // px
    
    init(canvas) {
        // DOM Elements
        this.canvas = canvas
        this.buffer = document.createElement("canvas") // Doble buffering

        // Resolutions
		canvas.width  = this.width  * 2
        canvas.height = this.height * 2
		canvas.style.width  = canvas.width  + "px"
        canvas.style.height = canvas.height + "px"
        
        this.buffer.width  = this.width
        this.buffer.height = this.height

        // Contexts
        this.ctx  = this.canvas.getContext("2d")
        this.bctx = this.buffer.getContext("2d")

        // Viewport
        this.MainViewport = Viewport(this.width)
        
        Views.init()
    },
    
    drawLimits() {
        this.ctx.strokeStyle = "#0ff"
        this.ctx.beginPath()
            this.ctx.moveTo(this.width, 0)
            this.ctx.lineTo(this.width, this.height * 2)
            this.ctx.moveTo(0, this.height)
            this.ctx.lineTo(this.width * 2, this.height)
        this.ctx.stroke()
    },

    draw() {
        this.MainViewport.project()
    
        // World Space
        Views.worldSpace()
        this.ctx.drawImage(Views.canvas, 0, 0)

        // Camera Space
        Views.cameraSpace()
        this.ctx.drawImage(Views.canvas, 0, this.height)

        // Depth Space
        Views.depthSpace()
        this.ctx.drawImage(Views.canvas, this.width, 0)

        // Screen Space
        this.MainViewport.x = 0
        while(this.MainViewport.x < this.width) {
            this.MainViewport.draw(this.bctx)
            this.MainViewport.x++
        }
        this.ctx.drawImage(this.buffer, this.width, this.height)

        this.drawLimits()
    }
}
