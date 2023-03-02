const Emitter = {
    parse(info) {
        return new Function(`const _new = {isEmitter: true,
            pos: v3(0,0,0),
            duration: 0,
            elapsed: 0,
            active: true,
            emitCounter: 0,

            ${info.emission && info.emission.bursts ? `burstsLastCycle: new Array(${info.emission.bursts.length}).fill(0),` : ""}

            particles: new Array(${info.totalParticles || 1000}).fill(0).map(() => ({
                x: 0, y: 0, z: 0,
                vx: 0, vy: 0, vz: 0,
                life: 0,
                x0: 0, y0: 0,
                x1: 0, y1: 0,
                depth: 0,
                blend: 0,
                scale: 1,
                color: [1,1,1,1]
                ${(info.startRotation || info.rotation) ? `, rotation: 0` : ""}
            })),
            length: 0,

            addParticle() {
                if (this.length >= ${info.totalParticles || 1000})
                    return false

                this.initParticle(this.particles[this.length++])
                return true
            },

            removeParticle(index) {
                const tmp = this.particles[--this.length]
                this.particles[this.length] = this.particles[index]
                this.particles[index] = tmp
            },

            ${info.noise ? `noise: Noise.createNoise({
                frequency: ${Default(info.noise.frequency, 1)},
                octaves: ${Default(info.noise.octaves, 1)},
                lacunarity: ${Default(info.noise.lacunarity, 2)},
                persistence: ${Default(info.noise.persistence, 0.5)},
                withDerivative: true,
                method: Noise.${Default(info.noise.method, "value2D")}
            }),
            noiseSample: Noise.createSample(),
            ${info.noise.morph ? "morphOffset: 0," : ""}
            ` : ""}

            ${info.color ? `color: {
                rgba: color(0,0,0,1),
                ${info.color.byLife ? `byLife: Gradient(${info.color.byLife.map(x => `[${x[0]},{r:${x[1].r/255},g:${x[1].g/255},b:${x[1].b/255}${ifDefined(x[1].a, `,a:${x[1].a/255}`, "")}}]`)}),` : ""}
            ${info.color.bySpeed ? `bySpeed: Gradient(${info.color.bySpeed.gradient.map(x => `[${x[0]},{r:${x[1].r/255},g:${x[1].g/255},b:${x[1].b/255}${ifDefined(x[1].a, `,a:${x[1].a/255}`, "")}}]`)})` : ""}
            },` : ""}

            ${this.parseInitParticle(info)},

            ${this.parseUpdateParticle(info)},

            ${this.parseUpdate(info)},

            ${(info.startRotation || info.rotation) ? `hasRotation: true,` : ""}

            __proto__: Emitter.Template
        }
        TextureLoader.getTextureWithFirst("${info.particleTexture || "particle"}", texture => _new.texture = texture)
        return _new`)
    },

    parseInitParticle(info) {
        return `initParticle(particle) {
        const t = this.elapsed / this.duration
        ${info.shape ? info.shape : PointShape}
        ${ifDefined(info.startSpeed, `const speed = ${info.startSpeed}
        particle.vx *= speed
        particle.vy *= speed
        particle.vz *= speed`, "")}
        particle.life = ${info.lifetime ? info.lifetime : "this.duration"}
        ${isDefined(info.startColor) ? `particle.color = [${info.startColor.map(x => `(${x})/255`).join() + (info.startColor.length === 3 ? ",1" : "")}]` : ""}
        ${ifDefined(info.startScale, `particle.scale = ${info.startScale}`, "")}
        ${ifDefined(info.startRotation, `particle.angle = ${info.startRotation}`, "")}
        ${
            info.subEmitters && info.subEmitters.filter(x => x.stage === "birth") ?
            "let e\n" + info.subEmitters.filter(x => x.stage === "birth").map(se => `e = ParticleSystem.emitters.${se.subEmitter}()
            e.pos.x = particle.x
            e.pos.y = particle.y
            e.pos.z = particle.z
            e.duration = ${Default(se.duration, 1)}
            e.loop = ${Default(se.loop, false)}
            e.sector = this.sector
            ParticleSystem.addEmitter(e, this.sector)`).join("\n")
            : ""
        }
    }`
    },

    parseUpdateParticle(info) {
        return `updateParticle(particle, dt) {
        const t = 1 - particle.life * ${ ifDefined(info.lifetime, 1 / info.lifetime, "this.duration")}
        ${info.forces ? `
        let fx = 0, fy = 0, fz = ${info.gravityMultiplier ? `-(${info.gravityMultiplier}) * 9.8` : "0"}
        ${info.forces.linear ? `fx += ${info.forces.linear[0]}
        fy += ${info.forces.linear[1]}
        fz += ${info.forces.linear[2]}` : ""}
        ${(info.forces.radial || info.forces.tangential) ? `
        let rx = particle.x - this.pos.x,
            ry = particle.y - this.pos.y,
            rz = particle.z - this.pos.z
        const l = 1 / Math.sqrt(rx * rx + ry * ry + rz * rz)
        rx *= l
        ry *= l
        rz *= l
        ${info.forces.tangential ? `
        fx -= ry * (${info.forces.tangential})
        fy += rx * (${info.forces.tangential})
        fz += rz * (${info.forces.tangential})
        ` : ""}
        ${info.forces.radial ? `
        fx += rx * (${info.forces.radial})
        fy += ry * (${info.forces.radial})
        fz += rz * (${info.forces.radial})
        ` : ""}
        ` : ""}
        ${info.forces.drag ? `
        const m = 0.5 * (${info.forces.drag})${info.forces.multiplyDragByParticleSize ?
            ` * particle.scale` : ""}
        fx -= m * Math.sign(particle.vx)${info.forces.multiplyDragByParticleVelocity ? ` * particle.vx * particle.vx` : ""}
        fy -= m * Math.sign(particle.vy)${info.forces.multiplyDragByParticleVelocity ? ` * particle.vy * particle.vy` : ""}
        fz -= m * Math.sign(particle.vz)${info.forces.multiplyDragByParticleVelocity ? ` * particle.vz * particle.vz` : ""}
        ` : ""}
        particle.vx += fx * dt
        particle.vy += fy * dt
        particle.vz += fz * dt
        ` : `
        ${info.gravityMultiplier ? `particle.vz -= (${info.gravityMultiplier}) * 9.8 * dt` : ""}
        `}

        ${info.velocity ? `
        let vx = particle.vx,
            vy = particle.vy,
            vz = particle.vz
        ${info.velocity.linear ? `
        vx += ${info.velocity.linear[0]}
        vy += ${info.velocity.linear[1]}
        vz += ${info.velocity.linear[2]}` : ""}
        ${info.velocity.limit ? `
        const reduction = 1 - (vx * vx + vy * vy + vz * vz > ${info.velocity.limit * info.velocity.limit}) ${
            info.velocity.dampen ? `* (${info.velocity.dampen})` : ""}
        vx *= reduction
        vy *= reduction
        vz *= reduction
        ` : ""}
        particle.vx = vx
        particle.vy = vy
        particle.vz = vz
        ` : ""}

        ${info.noise ? `
        ${info.noise.morph ? `this.morphOffset += dt * ${info.noise.morph * .001}
        if (this.morphOffset > 256) this.morphOffset -= 256` : ""}
        const px = particle.x, py = particle.y, pz = particle.z
        particle.x = pz${info.noise.morph ? " + this.morphOffset" : ""}
        particle.z = px
        this.noise(particle, this.noiseSample)
        const sampleXdx = this.noiseSample.derivative.x,
            sampleXdy = this.noiseSample.derivative.y
        particle.x = px + 100${info.noise.morph ? " + this.morphOffset" : ""}
        particle.y = pz
        particle.z = py
        this.noise(particle, this.noiseSample)
        const sampleYdy = this.noiseSample.derivative.y,
            sampleYdx = this.noiseSample.derivative.x
        particle.x = py${info.noise.morph ? " + this.morphOffset" : ""}
        particle.y = px + 100
        particle.z = pz
        this.noise(particle, this.noiseSample)
        const sampleZdy = this.noiseSample.derivative.y,
            sampleZdx = this.noiseSample.derivative.x
        const amplitude = ${info.noise.damping ? info.noise.strength / info.noise.frequency : info.noise.strength}
        particle.vx = (sampleZdx - sampleYdy) * amplitude
        particle.vy = (sampleXdx - sampleZdy) * amplitude
        particle.vz = (sampleYdx - sampleXdy) * amplitude
        particle.x = px
        particle.y = py
        particle.z = pz
        ` : ""}

        particle.x += particle.vx * dt
        particle.y += particle.vy * dt
        particle.z += particle.vz * dt

        ${(info.color && info.color.bySpeed ||
          info.size && info.size.bySpeed ||
          info.rotation && info.rotation.bySpeed) ?
          "const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy + particle.vz * particle.vz)"
        : ""}

        ${info.collision ? `
        const s = particle.scale * ${ifDefined(info.collision.radiusScale, info.collision.radiusScale * .5, ".5")}
        if (particle.z - s < this.sector.floor.z) {
            particle.vz = -particle.vz${Default(info.collision.bounce, 1) !== 1 ? ` * ${info.collision.bounce}` : ""}
            particle.z = this.sector.floor.z + s + particle.vz * dt${
            ifDefined(info.collision.lifeLoss, `
            particle.life = particle.life * ${info.collision.lifeLoss}`, "")}${
            (isDefined(info.collision.minSpeed) || isDefined(info.collision.maxSpeed)) ? `
            const speedSqr = Math.abs(particle.vx * particle.vx + particle.vy * particle.vy + particle.vz * particle.vz)` : ""}${
            ifDefined(info.collision.minSpeed, `
            if (speedSqr < ${info.collision.minSpeed**2}) particle.life = 0`, "")}${
            ifDefined(info.collision.maxSpeed, `
            if (speedSqr > ${info.collision.maxSpeed**2}) particle.life = 0`, "")}
            ${
                info.subEmitters && info.subEmitters.filter(x => x.stage === "collision") ?
                "let e\n" + info.subEmitters.filter(x => x.stage === "collision").map(se => `e = ParticleSystem.emitters.${se.subEmitter}()
                e.pos.x = particle.x
                e.pos.y = particle.y
                e.pos.z = particle.z
                e.duration = ${Default(se.duration, 1)}
                e.loop = ${Default(se.loop, false)}
                e.sector = this.sector
                ParticleSystem.addEmitter(e, this.sector)`).join("\n")
                : ""
            }
        } else if (particle.z + s > this.sector.ceiling.z) {
            particle.vz = -particle.vz${Default(info.collision.bounce, 1) !== 1 ? ` * ${info.collision.bounce}` : ""}
            particle.z = this.sector.ceiling.z - s + particle.vz * dt${
                ifDefined(info.collision.lifeLoss, `
                particle.life = particle.life * ${info.collision.lifeLoss}`, "")}${
            (isDefined(info.collision.minSpeed) || isDefined(info.collision.maxSpeed)) ? `
            const speedSqr = Math.abs(particle.vx * particle.vx + particle.vy * particle.vy + particle.vz * particle.vz)` : ""}${
            ifDefined(info.collision.minSpeed, `
            if (speedSqr < ${info.collision.minSpeed**2}) particle.life = 0`, "")}${
            ifDefined(info.collision.maxSpeed, `
            if (speedSqr > ${info.collision.maxSpeed**2}) particle.life = 0`, "")}
            ${
                info.subEmitters && info.subEmitters.filter(x => x.stage === "collision") ?
                "let e\n" + info.subEmitters.filter(x => x.stage === "collision").map(se => `e = ParticleSystem.emitters.${se.subEmitter}()
                e.pos.x = particle.x
                e.pos.y = particle.y
                e.pos.z = particle.z
                e.duration = ${Default(se.duration, 1)}
                e.loop = ${Default(se.loop, false)}
                e.sector = this.sector
                ParticleSystem.addEmitter(e, this.sector)`).join("\n")
                : ""
            }        
        }
        ` : ""}
        
        ${info.color ? `
        particle.color.fill(0)
        ${info.color.byLife ? `
        this.color.byLife(t, this.color.rgba)
        particle.color[0] = this.color.rgba.r
        particle.color[1] = this.color.rgba.g
        particle.color[2] = this.color.rgba.b
        particle.color[3] = this.color.rgba.a
        ` : ""}
        ${info.color.bySpeed ? `{
            const t = Math.max(0, Math.min(1, ${info.color.bySpeed.range ? `(speed - ${info.color.bySpeed.range[0]}) * ${1 / (info.color.bySpeed.range[1] - info.color.bySpeed.range[0])}` : "speed"}))
            this.color.bySpeed(t, this.color.rgba)
            particle.color[0] += this.color.rgba.r
            particle.color[1] += this.color.rgba.g
            particle.color[2] += this.color.rgba.b
            particle.color[3] += this.color.rgba.a
        }` : ""}
        ` : ""}

        ${info.size ? `
        particle.size = 0
        ${info.size.byLife ? `
        particle.size = ${info.size.byLife}
        ` : ""}
        ${info.size.bySpeed ? `{
            const t = Math.max(0, Math.min(1, ${info.size.bySpeed.range ? `(speed - ${info.size.bySpeed.range[0]}) * ${1 / (info.size.bySpeed.range[1] - info.size.bySpeed.range[0])}` : "speed"}))
            particle.size += ${info.size.bySpeed.size}
        }` : ""}
        ` : ""}

        ${info.rotation ? `
        particle.angle = 0
        ${info.rotation.byLife ? `
        particle.angle = ${info.rotation.byLife}
        ` : ""}
        ${info.rotation.bySpeed ? `{
            const t = Math.max(0, Math.min(1, ${info.rotation.bySpeed.range ? `(speed - ${info.rotation.bySpeed.range[0]}) * ${1 / (info.rotation.bySpeed.range[1] - info.rotation.bySpeed.range[0])}` : "speed"}))
            particle.angle += ${info.rotation.bySpeed.angle}
        }` : ""}
        ` : ""}

        particle.life -= dt
        }`
    },

    parseUpdate(info) {
        info.emission = info.emission || {}
        return `update(dt) {
        this.elapsed += dt

        if (this.elapsed >= this.duration) {
            if (this.loop) {
                this.elapsed = 0
            } else {
                this.active = false
                return
            }
        }

        const t = this.elapsed / this.duration

        ${info.emission.rate !== 0 ? `const rate = 1 / (${info.emission.rate || 10})
        this.emitCounter += dt

        while (this.emitCounter > rate) {
            this.addParticle()
            this.emitCounter -= rate
        }
        ` : ""}

        ${info.emission.bursts ? info.emission.bursts.map((burst, i) => `
        if (this.elapsed >= ${Default(burst.time, 0)} && this.elapsed < ${Default(burst.time, 0) + Default(burst.interval, 1) * Default(burst.cycles, 1)}) {
            this.burstsLastCycle[${i}] -= dt
            
            const emit = this.burstsLastCycle[${i}] <= 0
            for (let i = 0; i < (${burst.count}) * emit; i++)
                this.addParticle()
            
            this.burstsLastCycle[${i}] = this.burstsLastCycle[${i}] * (!emit) + ${Default(burst.interval, 1)} * emit
        }
        `).join("") : ""}

        for (let i = 0; i < this.length; i++) {
            const p = this.particles[i]
            if (p.life > 0)
                this.updateParticle(p, dt)
            else {${
                info.subEmitters && info.subEmitters.filter(x => x.stage === "death") ?
                "let e\n" + info.subEmitters.filter(x => x.stage === "death").map(se => `e = ParticleSystem.emitters.${se.subEmitter}()
                e.pos.x = p.x
                e.pos.y = p.y
                e.pos.z = p.z
                e.duration = ${Default(se.duration, 1)}
                e.loop = ${Default(se.loop, false)}
                e.sector = this.sector
                ParticleSystem.addEmitter(e, this.sector)`).join("\n")
                : ""
            }
                this.removeParticle(i)
                i--
            }
        }
        }`
    },

    Template: {
        project() {
            this.x0 = Infinity
            this.x1 = -1
            this.dmin = Infinity
            this.dmax = -1
            let visible = false
            const dirX = Camera.dir.x,
                dirY = Camera.dir.y,
                FOVRelation = Camera.FOVRelation
            const hW = Renderer.width * .5
            for (let i = 0; i < this.length; i++) {
                const p = this.particles[i]
                const dx = p.x - Camera.pos.x,
                    dy = p.y - Camera.pos.y;
                const yp = dx * Camera.dir.x + dy * Camera.dir.y
                if (yp < -Camera.nearPlane) continue

                const xp = (dy * dirX - dx * dirY) * FOVRelation
                p.depth =  1 / yp
                const X = hW * (1 + xp * p.depth)
                const Y = Camera.center - (p.z - Camera.pos.z) * Camera.dp * p.depth
                const s = p.scale * .5 * p.depth
                const w = hW * s * FOVRelation,
                    h = Camera.dp * s
                p.x0 = X - w
                p.x1 = X + w
                p.y0 = Y - h
                p.y1 = Y + h
                if (p.x0 > Renderer.width || p.x1 < 0) continue
                this.x0 = Math.max(Math.min(this.x0, p.x0), 0)
                this.x1 = Math.min(Math.max(this.x1, p.x1), Renderer.width - 1)
                this.dmin = Math.min(this.dmin, p.depth)
                this.dmax = Math.max(this.dmax, p.depth)
                visible = true
            }
            return visible
        },

        sort() {
            const A = this.particles
            for (let i = 1; i < this.length; i++) {
                let j = i
                while (j > 0 && A[j].depth < A[j-1].depth) {
                    // Swap
                    const temp = A[j]
                    A[j] = A[j-1]
                    A[j-1] = temp
                    j--
                }
            }
        },

        drawBefore(thing) {
            if (thing.isFlat || thing.isVoxel || thing.isEmitter) {
                if (this.dmax < thing.dmin) return true
                if (this.dmin > thing.dmax) return false
            } else {
                if (this.x0 > thing.segment.p1.col || this.x1 < thing.segment.p0.col) return true
                const depth = thing.segment.getDepthAt((this.x0 + this.x1) * .5)
                if (this.dmax < depth) return true
                if (this.dmin > depth) return false
            }
            return Math.abs(this.pos.z - Camera.pos.z) > Math.abs(thing.pos.z - Camera.pos.z)
        },

        draw(viewport) {
            this.draw = this.hasRotation
                ? this.drawWithRotation
                : this.drawSimple
            this.draw(viewport)
        },

        drawSimple(viewport) {
            const column = Renderer.column
            const texture = this.texture,
                data = texture.data
            for (let i = 0; i < this.length; i++) {
                const p = this.particles[i]
                if (
                    p.x0 > viewport.x || p.x1 < viewport.x ||
                    p.y0 > viewport.bottom || p.y1 < viewport.top ||
                    p.depth < viewport.depth[viewport.x]
                ) continue

                const u = (texture.w * (viewport.x - p.x0) / (p.x1 - p.x0)) & (texture.w - 1)
                const dv = texture.h / (p.y1 - p.y0)

                let clippingBottom = viewport.bottom
                if (viewport.segment && ~~viewport.segment.getBottomAt(viewport.x) === viewport.bottom) {
                    // El Portal impone el bottom
                    if (viewport.segment.wall.hasStepUp)
                        clippingBottom = Renderer.height
                }
                const b = Math.min(p.y1, clippingBottom) * 4

                let y = Math.max(~~p.y0, viewport.top)
                // let y = Math.max(~~(p.y0 + texture.first[u] / dv), viewport.top)

                if (b < 0 || y > Renderer.height || y << 2 > b) return

                let v = (y - p.y0) * dv
                const i0 = u * texture.h
                const [red, green, blue, alfa] = p.color

                for (y *= 4; y < b; y+=4, v+=dv) {
                    const i = (i0 + (v & (texture.h - 1))) << 2
                    const alpha = data[i + 3] * 0.0039 * alfa, // 1/255 =~ 0.0039
                        beta = 1 - alpha * p.blend

                    column[y]   = beta * column[y]   + alpha * data[i]   * red
                    column[y+1] = beta * column[y+1] + alpha * data[i+1] * green
                    column[y+2] = beta * column[y+2] + alpha * data[i+2] * blue
                }
            }
        },

        drawWithRotation(viewport) {
            const column = Renderer.column
            const texture = this.texture,
                data = texture.data
            for (let i = 0; i < this.length; i++) {
                const p = this.particles[i]
                if (
                    p.x0 > viewport.x || p.x1 < viewport.x ||
                    p.y0 > viewport.bottom || p.y1 < viewport.top ||
                    p.depth < viewport.depth[viewport.x]
                ) continue

                const u0 = (viewport.x - p.x0) / (p.x1 - p.x0) * 2 - 1
                const dv = 1 / (p.y1 - p.y0)

                let clippingBottom = viewport.bottom
                if (viewport.segment && ~~viewport.segment.getBottomAt(viewport.x) === viewport.bottom) {
                    // El Portal impone el bottom
                    if (viewport.segment.wall.hasStepUp)
                        clippingBottom = Renderer.height
                }
                const b = Math.min(p.y1, clippingBottom)

                let y = Math.max(~~p.y0, viewport.top)
                // let y = Math.max(~~(p.y0 + texture.first[u] / dv), viewport.top)

                if (b < 0 || y > Renderer.height || y > b) return

                
                const cos = Math.cos(p.angle), sin = Math.sin(p.angle)
                const [red, green, blue, alfa] = p.color

                for (; y < b; y++) {
                    const v0 = 2 * (y - p.y0) * dv - 1
                    const u = texture.w * (.5 + (u0 * cos + v0 * sin) * .5),
                        v = texture.h * (.5 + (v0 * cos - u0 * sin) * .5)
                    if (u < 0 || u > texture.w || v < 0 || v > texture.h) continue
                    const i = ((u & (texture.w  - 1)) * texture.h  + (v & (texture.h - 1))) << 2
                    const alpha = data[i + 3] * 0.0039 * alfa, // 1/255 =~ 0.0039
                        beta = 1 - alpha * p.blend

                    const Y = y << 2

                    column[Y]   = beta * column[Y]   + alpha * data[i]   * red
                    column[Y+1] = beta * column[Y+1] + alpha * data[i+1] * green
                    column[Y+2] = beta * column[Y+2] + alpha * data[i+2] * blue
                }
            }
        }
    }
}
