const ViewportsPool = {
    length: 0,

    init() {
        this.viewports = new Array(256).fill(0).map(_ => Viewport(Renderer.width))
    },
    
    take() {
        const viewport = this.viewports[this.length]
        this.length++
        return viewport
    },

    clear() {
        this.length = 0
    }
}
