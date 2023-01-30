const WallSprite = () => ({
    isWall: true,
    pos: v3(),
    angle: 0,
    h: 1, w: 1, // Dimensiones en unidades

    init() {
        this.segment = Segment(0,0,0,0)
        this.setAngle(this.angle)
        this.super = {
            project: this.__proto__.project.bind(this),
            draw: this.__proto__.draw.bind(this)
        }
    },

    setAngle(angle) {
        const s = this.segment
        this.angle = angle
        const cos = Math.cos(angle) * this.w * .5,
              sin = Math.sin(angle) * this.w * .5
        s.p0.x = this.pos.x + sin
        s.p0.y = this.pos.y - cos
        s.p1.x = this.pos.x - sin
        s.p1.y = this.pos.y + cos
    },

    project() {
        if (this.super.project()) {
            if (this.doubleSide) {
                if (this.segment.p0.col > this.segment.p1.col) {
                    let tmp = this.segment.p0
                    this.segment.p0 = this.segment.p1
                    this.segment.p1 = tmp
                    this.inv = !this.inv
                }
                if (this.inv) {
                    this.u0 *= -1
                    this.u1 *= -1
                }
            }
            return true
        }
        return false
    },

    draw(viewport) {
        const s = this.segment,
              texture = this.texture
        if (s.p0.col > viewport.x || s.p1.col < viewport.x) return

        const dx = (viewport.x - s.p0.col) / (s.p1.col - s.p0.col)
        const depth  = s.p0.depth  + (s.p1.depth  - s.p0.depth)  * dx

        if (depth + 0.001 < viewport.depth[viewport.x]) return // Si hay una Wall delante

        const top =    s.p0.top    + (s.p1.top    - s.p0.top)    * dx
        const bottom = s.p0.bottom + (s.p1.bottom - s.p0.bottom) * dx
        if (bottom < viewport.top) return
        const uinv = this.u0 * s.p0.depth + (this.u1 * s.p1.depth - this.u0 * s.p0.depth) * dx

        const u = (uinv / depth) & (texture.w - 1)
        this.super.draw(u, top, bottom, viewport)
    },

    __proto__: SegmentSprite
})
