const ViewportsPool = {
    length: 0,

    init() {
        this.viewports = new Array(256).fill(0).map(_ => Viewport(Renderer.width))
    },
    
    take() {
        const viewport = this.viewports[this.length]
		viewport.drawed = -1
        this.length++
        return viewport
    },

    free(viewport) {
        const i = this.viewports.indexOf(viewport)
        this.length--
        this.viewports[i] = this.viewports[this.length]
        this.viewports[this.length] = viewport
    },
	
	freeAll() {
		this.length = 0
	}
}
