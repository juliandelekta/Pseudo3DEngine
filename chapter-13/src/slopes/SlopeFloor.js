const SlopeFloor = () => ({
    back: [],
    fore: [],

    projectBack() {
        for (const far of this.back) {
            far.fillTop(this.buffers.upper.y)
            this.fillBuffer(far, this.buffers.upper)
        }
    },

    projectFore() {
        const segment = this.buffers.segment

        for (let i = 0, len = this.fore.length; i < len; i++) {
            segment.p1 = this.fore[i]
            segment.p0 = this.fore[(i+1) % len]

            segment.fillTop(this.buffers.lower.y)
            segment.fillBottom(this.buffers.side.y)

            this.fillBuffer(segment, this.buffers.lower)
            this.fillSide(segment, this.buffers.side)
        }
    },

    toScreenSpace(segment) {
        const z = this.sector.floor.z
        segment.p0.toScreenSpace(z + segment.p0.z0, z)
        segment.p1.toScreenSpace(z + segment.p1.z0, z)
    },

    draw(viewport) {
        const top = this.buffers.upper.y[viewport.x],
            bottom = this.buffers.lower.y[viewport.x]

        // Slope
        if (top <= bottom)
            this.drawSlope(viewport)
        
        // Sidewall
        if (bottom < viewport.bottom) {
            const z = this.buffers.side.z[viewport.x]
            const v0 =  this.isRelative ? 0 :  z * this.sidewall.h,
                  v1 = !this.isRelative ? 0 : -z * this.sidewall.h
            this.drawSidewall(bottom, this.buffers.side.y[viewport.x], v0, v1, viewport)
        }
        viewport.bottom = Math.min(viewport.bottom, Math.min(top, bottom))
    },

    __proto__: Slope
})
