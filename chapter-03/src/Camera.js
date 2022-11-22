const v2 = (x, y) => ({x, y})
const v3 = (x, y, z) => ({x, y, z})

const Camera = {
    pos: v3(0, 0, 2), // En Z tiene 2 => 2 metros de separación del suelo
    dir: v2(0, 0),
    nearPlane: -0.001,

    setAngle(angle) {
        this.angle = angle
        this.dir.x = Math.cos(angle)
        this.dir.y = Math.sin(angle)
    },

    setFOV(FOV) {
        this.FOV = FOV
        this.tanFOV = Math.tan(FOV / 2)
        this.FOVRelation = 1 / this.tanFOV
        this.dp = (Screen.width / 2) / this.tanFOV
    }
}
