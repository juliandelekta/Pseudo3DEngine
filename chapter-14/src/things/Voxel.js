const Voxel = () => ({
    isVoxel: true,
    pos: v3(),
    w: 1, h: 1, d: 1,
	
    box: {
        w: 1, h: 1, d: 1,
        x: 0, y: 0, z: 0
    },

    ray: {
        T_MIN: 0, T_MAX: 100,
        t0: 0, t1: 100,
		
		boxIntersection(box) {
            const {invx, invy, invz} = this
            const {w, h, d, x, y, z} = box
                
			const txmin = (w * (invx <  0) - x) * invx,
				  txmax = (w * (invx >= 0) - x) * invx
				
			const tymin = (h * (invy <  0) - y) * invy,
				  tymax = (h * (invy >= 0) - y) * invy
				
			const tzmin = (d * (invz <  0) - z) * invz,
				  tzmax = (d * (invz >= 0) - z) * invz
				
			this.t0 = Math.max(this.T_MIN, txmin, tymin, tzmin) - 1e-5
			this.t1 = Math.min(this.T_MAX, txmax, tymax, tzmax) - 1e-5
			
			return  txmin <= tymax && tymin <= txmax &&
					txmin <= tzmax && tzmin <= txmax &&
					tymin <= tzmax && tzmin <= tymax &&
					this.t0 < this.T_MAX && this.t1 >= this.T_MIN
		}
    },

    init() {
        this.box.w = this.thing.h
        this.box.h = this.thing.w
        this.box.d = this.thing.d
		this.super = {updateShape: this.__proto__.updateShape.bind(this)}
        this.initRectangle()
    },
	
    updateShape() {
		const h = this.h, w = this.w
		this.h = this.h * this.box.h / 16
		this.w = this.w * this.box.w / 16
		
		this.super.updateShape()
		
		this.h = h
		this.w = w
		this.sw = 16 / this.w
		this.sh = 16 / this.h
		this.sd = 16 / this.d
    },

    project() {
        if(!this.projectPoints(true)) return false
        // Rotar la posición de la cámara alrededor del ángulo del vóxel
        const cos = Math.cos(this.angle), sin = Math.sin(this.angle)
        const dx = Camera.pos.x - this.pos.x,
              dy = Camera.pos.y - this.pos.y

        this.box.x = this.box.w * .5 + (dx * cos + dy * sin) * this.sw
        this.box.y = this.box.h * .5 + (dy * cos - dx * sin) * this.sh
        this.box.z = (Camera.pos.z - this.pos.z) * this.sd
        return true
    },

    draw(viewport) {
        if (this.x1 < viewport.x || this.x0 > viewport.x) return
		if (viewport.depth[viewport.x] > this.dmax) return
        const cos = Math.cos(this.angle), sin = Math.sin(this.angle)
        const deltaIndexZ = this.box.w * this.box.h, deltaIndexY = this.box.w

        // Cálculo de la dirección del rayo en plano XY
        const dirX0 = Camera.left.x + Camera.delta.x * viewport.x,
              dirY0 = Camera.left.y + Camera.delta.y * viewport.x
        // Rota la dirección del Rayo según el ángulo del vóxel
        const dirX = (dirX0 * cos + dirY0 * sin) * this.sw,
			  dirY = (dirY0 * cos - dirX0 * sin) * this.sh

        this.ray.invx = 1 / dirX
        this.ray.invy = 1 / dirY

        // Distancia de rayo desde un x-side o y-side hasta el siguiente x-side o y-side
        const deltaDistX = Math.abs(this.ray.invx),
			  deltaDistY = Math.abs(this.ray.invy)
			
		const dz = this.sd / Camera.dp
		let y = Math.max(viewport.top, this.y0),
			dirZ = (Camera.center - y) * dz

        const column = Renderer.column, data = this.texture.data
		for (let b = Math.min(viewport.bottom, this.y1); y <= b; y+=2, dirZ-=dz+dz) {
            this.ray.invz = 1 / dirZ
			const deltaDistZ = Math.abs(this.ray.invz)
			
            if (!this.ray.boxIntersection(this.box)) continue
			
			// En qué vóxel inicial estamos
            let map0X = Math.floor(this.box.x + dirX * this.ray.t0)|0
            let map0Y = Math.floor(this.box.y + dirY * this.ray.t0)|0
            let map0Z = Math.floor(this.box.z + dirZ * this.ray.t0)|0

            // Cuál vóxel es el último
            let map1X = Math.floor(this.box.x + dirX * this.ray.t1)|0
            let map1Y = Math.floor(this.box.y + dirY * this.ray.t1)|0
            let map1Z = Math.floor(this.box.z + dirZ * this.ray.t1)|0

            // Calcula el step y el sideDist inicial
            let stepX = Math.sign(dirX)|0, stepY = Math.sign(dirY)|0, stepZ = Math.sign(dirZ)|0

            let sideDistX = deltaDistX * ((map0X - this.box.x + .5) * stepX + .5),
                sideDistY = deltaDistY * ((map0Y - this.box.y + .5) * stepY + .5),
                sideDistZ = deltaDistZ * ((map0Z - this.box.z + .5) * stepZ + .5)

            
            stepY *= deltaIndexY
            stepZ *= deltaIndexZ

            let index       = map0Z * deltaIndexZ + map0Y * deltaIndexY + map0X
            const endIndex  = map1Z * deltaIndexZ + map1Y * deltaIndexY + map1X

            // Arregla un artifact producido cuando index === endIndex pero map0 != map1
            if (index === endIndex && map0Z === map1Z && map0Y === map1Y && map0X === map1X) continue

            // Realiza DDA
            // Al menos una vez para arreglar el artifact
            do {
                // Salta al siguiente vóxel, en dirección X, Y o Z
				if (sideDistX < sideDistY) {
                    if (sideDistX < sideDistZ) {
                        sideDistX += deltaDistX
                        index += stepX
                    } else {
                        sideDistZ += deltaDistZ
                        index += stepZ
                    }
                } else {
                    if (sideDistY < sideDistZ) {
                        sideDistY += deltaDistY
                        index += stepY
                    } else {
                        sideDistZ += deltaDistZ
                        index += stepZ
                    }
                }

                // Chequea si tocó un vóxel
                const i = index << 2
                const c = data[i + 3]
                if (c > 0) {
                    const Y = y << 2
                    column[Y]   = data[i]
                    column[Y+1] = data[i+1]
                    column[Y+2] = data[i+2]
                    column[Y+4] = data[i]
                    column[Y+5] = data[i+1]
                    column[Y+6] = data[i+2]
                    break
                }
            } while (index !== endIndex)
        }
    },

    __proto__: Rectangle
})
