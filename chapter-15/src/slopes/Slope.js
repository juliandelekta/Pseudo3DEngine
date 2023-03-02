const Slope = {
    project() {
        this.buffers = BufferPool.take()
        this.back.length = this.fore.length = this.lightmapList.length = 0
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
            
            // Lightmap U mapping
            s.p0.usl = .5 + (1 - s.p0.l) * (s.lightmap.w-2)
            s.p1.usl = .5 + (1 - s.p1.l) * (s.lightmap.w-2)
            this.lightmapList.push(s.lightmap)
        }

        // Clipping
        s.p0.z0 = s.p0.z + s.p0.l * (s.p1.z - s.p0.z)
        s.p0.u0 = s.p0.u + s.p0.l * (s.p1.u - s.p0.u)
        s.p0.v0 = s.p0.v + s.p0.l * (s.p1.v - s.p0.v)
        s.p1.z0 = s.p0.z + s.p1.l * (s.p1.z - s.p0.z)
        s.p1.u0 = s.p0.u + s.p1.l * (s.p1.u - s.p0.u)
        s.p1.v0 = s.p0.v + s.p1.l * (s.p1.v - s.p0.v)

        // Lightmap
        s.p0.ul0 = s.p0.ul + s.p0.l * (s.p1.ul - s.p0.ul)
        s.p0.vl0 = s.p0.vl + s.p0.l * (s.p1.vl - s.p0.vl)
        s.p1.ul0 = s.p0.ul + s.p1.l * (s.p1.ul - s.p0.ul)
        s.p1.vl0 = s.p0.vl + s.p1.l * (s.p1.vl - s.p0.vl)
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

        // Lightmap
        const dulinv = (p1.ul0 * p1.depth - p0.ul0 * p0.depth) * dx,
              dvlinv = (p1.vl0 * p1.depth - p0.vl0 * p0.depth) * dx

        let ulinv = (from - p0.col) * dulinv + p0.ul0 * p0.depth,
            vlinv = (from - p0.col) * dvlinv + p0.vl0 * p0.depth

        for (let c = from; c <= to; c++) {
            buffer.zinv[c] = zinv
            buffer.uinv[c] = uinv
            buffer.vinv[c] = vinv

            zinv += dzinv
            uinv += duinv
            vinv += dvinv

            // Lightmap
            buffer.ulinv[c] = ulinv
            buffer.vlinv[c] = vlinv
            ulinv += dulinv
            vlinv += dvlinv
        }
    },

    fillSide(segment, side, lightmap) {
        const {p0, p1} = segment

        const dx = 1 / (p1.col - p0.col)
        const dd = (p1.depth - p0.depth) * dx,
              du = (p1.us * p1.depth - p0.us * p0.depth) * dx,
             dul = (p1.usl * p1.depth - p0.usl * p0.depth) * dx,
              dz = (p1.z0 * p1.depth - p0.z0 * p0.depth) * dx
        let from = Math.max(0, ~~(p0.col + 1)),
            to   = Math.min(Renderer.width-1, ~~p1.col)

        let d = (from - p0.col) * dd + p0.depth,
            u = (from - p0.col) * du + p0.us * p0.depth,
            ul = (from - p0.col) * dul + p0.usl * p0.depth,
            z = (from - p0.col) * dz + p0.z0 * p0.depth

        for (let c = from; c <= to; c++, d+=dd, u+=du, z+=dz, ul+=dul) {
            lightmap.u[c] = ul / d
            lightmap.map[c] = segment.lightmap
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
    },

    drawLightmap(viewport) {
        const x = viewport.x,
              top = this.buffers.upper.y[x]

        const dyinv = 1 / (this.buffers.lower.y[x] - top)

        const zinv = this.buffers.upper.zinv[x],
              uinv = this.buffers.upper.ulinv[x],
              vinv = this.buffers.upper.vlinv[x]

        const deltaZinv = (this.buffers.lower.zinv[x] - zinv) * dyinv,
              deltaUinv = (this.buffers.lower.ulinv[x] - uinv) * dyinv,
              deltaVinv = (this.buffers.lower.vlinv[x] - vinv) * dyinv

        const lightmap = this.lightmap

        for (let y = Math.max(viewport.top, ~~top), b = Math.min(viewport.bottom, this.buffers.lower.y[x]); y <= b; y++) {
            const z = 1 / (zinv + deltaZinv * (y - top))
            const u = z * (uinv + deltaUinv * (y - top))
            const v = z * (vinv + deltaVinv * (y - top))
            const Y = y << 2

            const i0 = (~~u) * lightmap.h
            const gv = ~~v
            const Q11 = lightmap.data[i0 + gv],
                Q12 = lightmap.data[i0 + gv + 1],
                Q21 = lightmap.data[i0 + lightmap.h + gv],
                Q22 = lightmap.data[i0 + lightmap.h + gv + 1]
            Renderer.column[Y]   =
            Renderer.column[Y+1] =
            Renderer.column[Y+2] = Q11 + (u - ~~u) * (Q21 - Q11) + (v - gv) * (Q12 - Q11 + (u - ~~u) * (Q22 - Q12 - Q21 + Q11))
        }
    },

    drawSideLightmap(top, bottom, v0, v1, viewport) {
        const lightmap = this.buffers.lightmap.map[viewport.x]
        if (!lightmap) return
        const u = this.buffers.lightmap.u[viewport.x]
        v1 *= lightmap.size
        v0 *= lightmap.size
        const deltaV = (v1-v0) / (bottom - top)
        for (let y = Math.max(viewport.top, ~~top), b = Math.min(viewport.bottom, bottom); y <= b; y++) {
            const v = v0 + deltaV * (y - top) - .5
            const Y = y << 2

            const i0 = (~~u) * lightmap.h
            const gv = ~~v
            const Q11 = lightmap.data[i0 + gv],
                Q12 = lightmap.data[i0 + gv + 1],
                Q21 = lightmap.data[i0 + lightmap.h + gv],
                Q22 = lightmap.data[i0 + lightmap.h + gv + 1]
            Renderer.column[Y]   =
            Renderer.column[Y+1] =
            Renderer.column[Y+2] = Q11 + (u - ~~u) * (Q21 - Q11) + (v - gv) * (Q12 - Q11 + (u - ~~u) * (Q22 - Q12 - Q21 + Q11))
        }
    },

    drawWithLight(viewport) {
        const x = viewport.x,
              top = this.buffers.upper.y[x]

        const dyinv = 1 / (this.buffers.lower.y[x] - top)

        const zinv = this.buffers.upper.zinv[x],
              uinv = this.buffers.upper.uinv[x],
              vinv = this.buffers.upper.vinv[x],
              ulinv = this.buffers.upper.ulinv[x],
              vlinv = this.buffers.upper.vlinv[x]

        const deltaZinv = (this.buffers.lower.zinv[x] - zinv) * dyinv,
              deltaUinv = (this.buffers.lower.uinv[x] - uinv) * dyinv,
              deltaVinv = (this.buffers.lower.vinv[x] - vinv) * dyinv,
              deltaUlinv = (this.buffers.lower.ulinv[x] - ulinv) * dyinv,
              deltaVlinv = (this.buffers.lower.vlinv[x] - vlinv) * dyinv

        const texture = this.texture,
            lightmap = this.lightmap

        for (let y = Math.max(viewport.top, ~~top), b = Math.min(viewport.bottom, this.buffers.lower.y[x]); y <= b; y++) {
            const z = 1 / (zinv + deltaZinv * (y - top))
            const u = z * (uinv + deltaUinv * (y - top))
            const v = z * (vinv + deltaVinv * (y - top))
            const ul = z * (ulinv + deltaUlinv * (y - top))
            const vl = z * (vlinv + deltaVlinv * (y - top))
            const Y = y << 2
            const tindex = (texture.h * (u & (texture.w - 1)) + (v & (texture.h - 1))) << 2

            const i0l = (~~ul) * lightmap.h
            const gv = ~~vl
            const Q11 = lightmap.data[i0l + gv],
                Q12 = lightmap.data[i0l + gv + 1],
                Q21 = lightmap.data[i0l + lightmap.h + gv],
                Q22 = lightmap.data[i0l + lightmap.h + gv + 1]
            const l = Math.min((Q11 + (ul - ~~ul) * (Q21 - Q11) + (vl - gv) * (Q12 - Q11 + (ul - ~~ul) * (Q22 - Q12 - Q21 + Q11))) * .003921 + this.sector.light, 1)

            Renderer.column[Y]   = texture.data[tindex] * l
            Renderer.column[Y+1] = texture.data[tindex + 1] * l
            Renderer.column[Y+2] = texture.data[tindex + 2] * l
        }
    },

    drawSideWithLight(top, bottom, v0, v1, vl0, vl1, viewport) {
        const lightmap = this.buffers.lightmap.map[viewport.x],
            texture = this.sidewall
        if (!lightmap) return
        const ul = this.buffers.lightmap.u[viewport.x]
        const u = this.buffers.side.u[viewport.x]
        const deltaV = (v1 - v0) / (bottom - top)
        const deltaVl = (vl1-vl0) / (bottom - top)

        for (let y = Math.max(viewport.top, ~~top), b = Math.min(viewport.bottom, bottom); y <= b; y++) {
            const v = v0 + deltaV * (y - top)
            const vl = vl0 + deltaVl * (y - top) - .5
            const Y = y << 2
            const tindex = (texture.h * u + (v & (texture.h - 1))) << 2

            const i0 = (~~ul) * lightmap.h
            const gv = ~~vl
            const Q11 = lightmap.data[i0 + gv],
                Q12 = lightmap.data[i0 + gv + 1],
                Q21 = lightmap.data[i0 + lightmap.h + gv],
                Q22 = lightmap.data[i0 + lightmap.h + gv + 1]
            const l = Math.min((Q11 + (ul - ~~ul) * (Q21 - Q11) + (vl - gv) * (Q12 - Q11 + (ul - ~~ul) * (Q22 - Q12 - Q21 + Q11))) * .003921 + this.sector.light, 1)

            Renderer.column[Y]   = texture.data[tindex] * l
            Renderer.column[Y+1] = texture.data[tindex+1] * l
            Renderer.column[Y+2] = texture.data[tindex+2] * l
        }
    }
}
