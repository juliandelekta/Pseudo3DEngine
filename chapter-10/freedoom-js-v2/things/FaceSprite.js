const FaceSprite = () => ({
    pos: v3(),

    init() {
        const s = Segment(this.pos.x, this.pos.y, 0, 0)
        s.toCameraSpace = () => {
            s.p0.toCameraSpace()
            const off = this.w * .5 * Camera.FOVRelation
            s.p1.xp = s.p0.xp + off
            s.p1.yp = s.p0.yp
            s.p0.xp -= off
        }

        this.segment = s
        this.super = {
            draw: this.__proto__.draw.bind(this),
            project: this.__proto__.project.bind(this)
        }
    },

    project() {
        if (this.super.project()) {
            if (this.directional) {
                const dx = Camera.pos.x - this.pos.x
                const dy = Camera.pos.y - this.pos.y
                const angle = (20 * Math.PI + Math.atan2(dy, dx) + this.angle - Math.PI * .125) % (2 * Math.PI)
                this.texture = this.textures[7 - ~~(4 * angle / Math.PI)]
            }
            return true
        }
        return false
    },

    draw(viewport) {
        const s = this.segment,
              texture = this.texture
        if (s.p0.col > viewport.x || s.p1.col < viewport.x) return

        const depth = s.p0.depth

        if (depth < viewport.depth[viewport.x] && (
            !viewport.closest[viewport.x].wall.isPortal ||
            depth < viewport.closest[viewport.x].wall.viewport.depth[viewport.x]
        )) // Si hay una Wall delante
            return
        const dx = (viewport.x - s.p0.col) / (s.p1.col - s.p0.col)
        const top =    s.p0.top    + (s.p1.top    - s.p0.top)    * dx
        const bottom = s.p0.bottom + (s.p1.bottom - s.p0.bottom) * dx
        if (bottom < viewport.top) return

        const u = (this.u0  + (this.u1 - this.u0) * dx) & (texture.w - 1)

        this.super.draw(u, top, bottom, viewport)
    },

    __proto__: SegmentSprite
})
