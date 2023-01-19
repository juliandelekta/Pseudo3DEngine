const Ceiling = () => ({
    isRelative: false,
    parallax: false,

    draw(to, viewport) {
        if (to < viewport.top) return
		this.y0 = viewport.top
        this.y1 = Math.min(~~to, viewport.bottom)

        if (this.next)
            this.drawNext(viewport)
        else if (this.parallax)
            this.drawParallax(viewport)
        else
            this.drawFlat(viewport)
    },

    __proto__: Flat
})
