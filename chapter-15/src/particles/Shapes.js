const PointShape = `particle.x = this.pos.x
particle.y = this.pos.y
particle.z = this.pos.z
const theta = (Math.random() * 2 - 1) * Math.PI * 2,
      phi   = (Math.random() * 2 - 1) * Math.PI * 2
particle.vx = Math.cos(theta) * Math.cos(phi)
particle.vy = Math.sin(theta) * Math.cos(phi)
particle.vz = Math.sin(phi)
`

const ConeShape = config => {
    const radius = Default(config.radius, 1),
        radiusThickness = Default(config.radiusThickness, 1),
        length = Default(config.length, 1),
        angle = toRad(Default(config.angle, 25)),
        theta = toRad(Default(config.theta, 0)),
        phi = toRad(Default(config.phi, 0))
    return `
    const theta = Math.random() * Math.PI * 2 + ${theta}
    const r = ${radius} - Math.random() * ${radiusThickness * radius}
    const phi = Math.atan(r / ${radius / Math.tan(angle)}) + ${phi}

    particle.vx = Math.cos(theta) * Math.sin(phi)
    particle.vy = Math.sin(theta) * Math.sin(phi)
    particle.vz = Math.cos(phi)

    ${(!!config.emitFromVolume) ? `const l = Math.random() * ${length}
    particle.x = this.pos.x + Math.cos(theta) * r + particle.vx * l
    particle.y = this.pos.y + Math.sin(theta) * r + particle.vy * l
    particle.z = this.pos.z + particle.vz * l
    ` :
    `particle.x = this.pos.x + Math.cos(theta) * r
    particle.y = this.pos.y + Math.sin(theta) * r
    particle.z = this.pos.z
    `}
    `
}

function BoxShape(config) {
    const angle = toRad(Default(config.angle, 0)),
        theta = toRad(Default(config.theta, 0)),
        phi = toRad(Default(config.phi, 90))
    return `
    const cos = Math.cos(${angle}), sin = Math.sin(${angle})
    const x = ${Default(config.w,1)} * (Math.random() - .5) + this.pos.x
    const y = ${Default(config.h,1)} * (Math.random() - .5) + this.pos.y
    particle.x = cos * x + sin * y
    particle.y = cos * y - sin * x
    particle.z = ${Default(config.d,1)} * (Math.random() - .5) + this.pos.z

    particle.vx = ${Math.cos(theta) * Math.cos(phi)}
    particle.vy = ${Math.sin(theta) * Math.cos(phi)}
    particle.vz = ${Math.sin(phi)}
    `
}