const SlopeCeil = () => ({
    back: [],
    fore: [],

    projectBack() {
        for (const far of this.back) {
            far.fillBottom(this.buffers.lower.y)
            this.fillBuffer(far, this.buffers.lower)
        }
    },

    projectFore() {
        const segment = this.buffers.segment

        for (let i = 0, len = this.fore.length; i < len; i++) {
            segment.p1 = this.fore[i]
            segment.p0 = this.fore[(i+1) % len]

            segment.fillBottom(this.buffers.upper.y)
            segment.fillTop(this.buffers.side.y)

            this.fillBuffer(segment, this.buffers.upper)
            this.fillSide(segment, this.buffers.side)
        }
    },

    toScreenSpace(segment) {
        const z = this.sector.ceiling.z
        segment.p0.toScreenSpace(z, z - segment.p0.z0)
        segment.p1.toScreenSpace(z, z - segment.p1.z0)
    },

    draw(viewport) {
        const top = this.buffers.upper.y[viewport.x],
            bottom = this.buffers.lower.y[viewport.x]

        // Slope
        if (top <= bottom)
            this.drawSlope(viewport)

        // Sidewall
        if (~~top > viewport.top) {
            const z = this.buffers.side.z[viewport.x]
            const v0 = !this.isRelative ? 0 :  z * this.sidewall.h,
                  v1 =  this.isRelative ? 0 : -z * this.sidewall.h
            this.drawSidewall(this.buffers.side.y[viewport.x], top, v0, v1, viewport)
        }
        viewport.top = ~~Math.max(viewport.top, Math.max(0, top + 1, bottom + 1))
    },

    __proto__: Slope
})
