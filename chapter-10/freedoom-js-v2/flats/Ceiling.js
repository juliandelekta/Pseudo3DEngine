const Ceiling = () => ({
    isRelative: false,
    parallax: false,

    draw(to, viewport) {
        if (to < viewport.top) return
		this.y0 = viewport.top
        this.y1 = Math.min(~~to, viewport.bottom)
        if (viewport.top < 0 || viewport.bottom > Screen.h) console.error("Exceeded", viewport)

        if (this.parallax)
            this.drawParallax(viewport)
        else
            this.drawFlat(viewport)
    },

    __proto__: Flat
})
