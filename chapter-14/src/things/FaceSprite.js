const FaceSprite = () => ({
    pos: v3(),
    h: 1, w: 1, // Dimensiones en unidades

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
        const {p0, p1} = this.segment
        if (
            p0.col > viewport.x || p1.col < viewport.x ||
            p0.depth < viewport.depth[viewport.x] || // Si hay una wall delante
            p0.bottom < viewport.top || p0.top > viewport.bottom
        ) return

        this.super.draw(
            (this.texture.w * (viewport.x - p0.col) / (p1.col - p0.col)) & (this.texture.w - 1),
            p0.top, p0.bottom, viewport
        )
    },

    __proto__: SegmentSprite
})
