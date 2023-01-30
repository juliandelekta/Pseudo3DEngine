const Slope = {
    project() {
        this.buffers = BufferPool.take()
        this.back.length = this.fore.length = 0
        for (const s of this.segments) {
            if (s.toDepthSpace(true)) {
                this.projectSegment(s)
                this.toScreenSpace(s)
            }
        }

        this.projectBack()
        this.projectFore()
    },

    projectSegment(s) {
        if (s.p0.col <= s.p1.col) {
            this.back.push(s)
            s.p0.l > 0 && this.fore.push(s.p0)
            s.p1.l < 1 && this.fore.push(s.p1)
        } else {
            this.fore.push(s.p0, s.p1)
            // Sidewall U mapping
            const lengthU = s.length * this.sidewall.w / this.sidewall.scaleU
            s.p0.us = this.sidewall.offU + s.p0.l * lengthU
            s.p1.us = this.sidewall.offU + s.p1.l * lengthU
        }

        // Clipping
        s.p0.z0 = s.p0.z + s.p0.l * (s.p1.z - s.p0.z)
        s.p0.u0 = s.p0.u + s.p0.l * (s.p1.u - s.p0.u)
        s.p0.v0 = s.p0.v + s.p0.l * (s.p1.v - s.p0.v)
        s.p1.z0 = s.p0.z + s.p1.l * (s.p1.z - s.p0.z)
        s.p1.u0 = s.p0.u + s.p1.l * (s.p1.u - s.p0.u)
        s.p1.v0 = s.p0.v + s.p1.l * (s.p1.v - s.p0.v)
    },

    fillBuffer(segment, buffer) {
        const {p0, p1} = segment

        const dx = 1 / (p1.col - p0.col)
        const dzinv = (p1.depth - p0.depth) * dx,
              duinv = (p1.u0 * p1.depth - p0.u0 * p0.depth) * dx,
              dvinv = (p1.v0 * p1.depth - p0.v0 * p0.depth) * dx
        let from = Math.max(0, ~~(p0.col + 1)),
            to   = Math.min(Renderer.width-1, ~~p1.col)

        let zinv = (from - p0.col) * dzinv + p0.depth,
            uinv = (from - p0.col) * duinv + p0.u0 * p0.depth,
            vinv = (from - p0.col) * dvinv + p0.v0 * p0.depth

        for (let c = from; c <= to; c++) {
            buffer.zinv[c] = zinv
            buffer.uinv[c] = uinv
            buffer.vinv[c] = vinv

            zinv += dzinv
            uinv += duinv
            vinv += dvinv
        }
    },

    fillSide(segment, side) {
        const {p0, p1} = segment

        const dx = 1 / (p1.col - p0.col)
        const dd = (p1.depth - p0.depth) * dx,
              du = (p1.us * p1.depth - p0.us * p0.depth) * dx,
              dz = (p1.z0 * p1.depth - p0.z0 * p0.depth) * dx
        let from = Math.max(0, ~~(p0.col + 1)),
            to   = Math.min(Renderer.width-1, ~~p1.col)

        let d = (from - p0.col) * dd + p0.depth,
            u = (from - p0.col) * du + p0.us * p0.depth,
            z = (from - p0.col) * dz + p0.z0 * p0.depth

        for (let c = from; c <= to; c++, d+=dd, u+=du, z+=dz) {
            side.u[c] = (u / d) & (this.sidewall.w - 1)
            side.z[c] = z / d
        }
    },

    drawSlope(viewport) {
        const x = viewport.x,
              top = this.buffers.upper.y[x]

        const dyinv = 1 / (this.buffers.lower.y[x] - top)

        const zinv = this.buffers.upper.zinv[x],
              uinv = this.buffers.upper.uinv[x],
              vinv = this.buffers.upper.vinv[x]

        const deltaZinv = (this.buffers.lower.zinv[x] - zinv) * dyinv,
              deltaUinv = (this.buffers.lower.uinv[x] - uinv) * dyinv,
              deltaVinv = (this.buffers.lower.vinv[x] - vinv) * dyinv

        const texture = this.texture

        for (let y = Math.max(viewport.top, ~~top), b = Math.min(viewport.bottom, this.buffers.lower.y[x]); y <= b; y++) {
            const z = 1 / (zinv + deltaZinv * (y - top))
            const u = z * (uinv + deltaUinv * (y - top))
            const v = z * (vinv + deltaVinv * (y - top))
            const Y = y << 2
            const tindex = (texture.h * (u & (texture.w - 1)) + (v & (texture.h - 1))) << 2

            Renderer.column[Y]   = texture.data[tindex]
            Renderer.column[Y+1] = texture.data[tindex + 1]
            Renderer.column[Y+2] = texture.data[tindex + 2]
        }
    },

    drawSidewall(top, bottom, v0, v1, viewport) {
        const texture = this.sidewall
        const u = this.buffers.side.u[viewport.x]
        const deltaV = (v1 - v0) / (bottom - top)
        for (let y = Math.max(viewport.top, ~~top), b = Math.min(viewport.bottom, bottom); y <= b; y++) {
            const v = v0 + deltaV * (y - top)
            const Y = y << 2
            const tindex = (texture.h * u + (v & (texture.h - 1))) << 2

            Renderer.column[Y]   = texture.data[tindex]
            Renderer.column[Y+1] = texture.data[tindex+1]
            Renderer.column[Y+2] = texture.data[tindex+2]
        }
    }
}
