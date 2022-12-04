const Floor = () => ({
    isRelative: false,
    parallax: false,

    draw(from, viewport) {
        if (from > viewport.bottom) return
		this.y0 = Math.max(viewport.top, ~~from)
        this.y1 = viewport.bottom
        
        if (this.parallax)
            this.drawParallax(viewport)
        else
            this.drawFlat(viewport)
    },

    __proto__: Flat
})
