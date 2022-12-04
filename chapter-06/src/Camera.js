const v2 = (x, y) => ({x, y})
const v3 = (x, y, z) => ({x, y, z})

const Camera = {
    pos: v3(0, 0, 2), // En Z tiene 2 => 2 metros de separación del suelo
    dir: v2(0, 0),
    nearPlane: -0.001,
    center: Renderer.height / 2,
    left:  v2(), delta: v2(),

    setAngle(angle) {
        this.angle = angle
        this.dir.x = Math.cos(angle)
        this.dir.y = Math.sin(angle)
        this.updateVectors()
    },

    setFOV(FOV) {
        this.FOV = FOV
        this.tanFOV = Math.tan(FOV / 2)
        this.FOVRelation = 1 / this.tanFOV
        this.dp = (Renderer.width / 2) / this.tanFOV
        this.updateVectors()
    },

    updateVectors() {
        const planeX = -this.dir.y * this.tanFOV,
              planeY =  this.dir.x * this.tanFOV;

        this.left.x  = this.dir.x - planeX
        this.left.y  = this.dir.y - planeY

        this.delta.x = 2 * planeX / Renderer.width
        this.delta.y = 2 * planeY / Renderer.width
	}
}
