# **Capítulo 12**. Voxel
> *Código fuente*: [Source](./src) 

Llegamos al último tipo de Thing del Engine, el [Voxel](https://es.wikipedia.org/wiki/Voxel). Este tipo de Thing no está presente en el Doom Engine y tuvo su aparción en el Build Engine, particularmente con el título [Blood](https://blood-wiki.org/index.php/Blood) quien fuera el primero en introducirlos, y puede que parte de su éxito se deba a esta innovación.

Aunque técnicamente, el término correcto es Mapa de Vóxeles, en el Engine nos vamos a referir como `Voxel` al Voxel Thing. Brevemente, un Voxel Thing no es más que una textura con tres dimensiones, donde cada "píxel" de la misma debe dibujarse como un cubo en pantalla.

## Estructura
La estructura del Voxel no difiere a los demás Things, con la salvedad de que ahora necesitamos una variable auxiliar para indicar su dimensión en otro eje (w, h, d). Aunque un cubo tiene ocho vértices, reutilizaremos nuestro objeto `Rectangle` introducido en el capítulo anterior y hacer que Voxel herede de él para aprovechar las proyecciones.


```javascript
const Voxel = () => ({
    isVoxel: true,
    pos: v3(),
    w: 1, h: 1, d: 1,

    init() {
    },

    project() {
		if(!this.projectPoints(true)) return false
    },

    draw(viewport) {
    },

    __proto__: Rectangle
})
```

Debemos introducir algunas modificaciones en Rectangle, para poder conocer el límite superior del cubo del Mapa de Vóxeles:
```javascript
const Rectangle = {
	. . .
	projectPoints(cube = false) {
        . . .		
		if (cube) {
			const z = this.pos.z + this.d
			dmin.toScreenSpace(z, z)
			dmax.toScreenSpace(z, z)
			this.top = ~~Math.max(0, Math.min(Renderer.height - 1, dmin.top, dmax.top))
		}

        this.y0 = ~~y0; this.y1 = ~~y1; this.x0 = x0; this.x1 = x1;
        this.dmin = dmin.depth; this.dmax = dmax.depth;
        return true
    },
	. . .
}
```

### Concepto

El mapa de vóxeles del Voxel Thing, es un cubo de dimensiones (w/16, h/16, d/16). Este cubo solo puede rotar sobre el eje Z. Dentro de este cubo, se ubican los vóxeles.

Las dimensiones del Thing se acceden mediante `this.w this.h this.d`. Las dimensiones del Mapa en vóxeles se acceden mediante: `this.box.w this.box.h this.box.d`

```javascript
const Voxel = () => ({
	. . .
	box: {
        w: 1, h: 1, d: 1
    },
	
	init() {
		// Se invierte W y H puesto que en la textura quedan rotados
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
		
		// Scaled Dimensions
		this.sw = 16 / this.w
		this.sh = 16 / this.h
		this.sd = 16 / this.d
    },
	. . .
})
```

##  Draw Before

El Voxel Thing al estar basado en Rectangle, evalúa el Draw Before de igual forma que el Flat Sprite. Lo único que debemos hacer es agregar en la condición si es Flat Sprite o Voxel Thing:

```javascript
const Rectangle = {
	. . .
	drawBefore(thing) {
        if (thing.isFlat || thing.isVoxel) {
        . . .
    }
}
```

## Viewport

En Viewport debemos considerar al Voxel Thing al momento de agregarlo a los buckets:

```javascript
const Viewport = (width) => ({
    . . .
    loadBuffers() {
        . . .
        for (const t of this.sector.visibleThings) {
            let from, to
            if (t.isFlat || t.isVoxel) {
                from = t.x0 >> 4
                to   = t.x1 >> 4
            } else {
               . . .
            }
            for (; from <= to; from++)
                this.buckets[from].push(t)
        }
    },
    . . .
})
```

## Diseño

### Things
Creamos una nueva clase de Thing, e identificamos su tipo como **voxel**. Adicionalmente debemos especificar las dimensiones del mapa de vóxeles: width, height y depth (w,h,d)
```javascript
ResourceManager.loadThings(
    . . .
    {
        name: "dog",
        texture: "dogvox",
        type: "voxel",
        w: 8, h: 16, d: 13 // Dimensiones del Mapa de Vóxeles
    }
)
```

### Nivel
Dentro del diseño del nivel, creamos una instancia del Voxel Thing.
```toml
[[sectors]]
    name = "internal"

    [[sectors.things]]
    thing = "dog"
    x = 13.5
    y = 7.5
    z = 0.5

```

### Parser
En el Parser, añadimos la entrada para el Voxel. Cargamos su ángulo inicial, al igual que aceptamos ahora la dimensión en el eje Z: **d**. 
```javascript
const Parser = {
    . . .
    parseThing(info) {
        . . .
        switch(definition.type) {
            . . .
            case "voxel":
                thing = Voxel()
                thing.angle = (info.angle || 0) * Math.PI / 180
                thing.d = info.d || 1
                break
            . . .
        }
    }
    . . .
}
```



## Renderización

La Renderización de cualquier Engine basado en vóxeles consiste en realizar Raytracing sobre cada píxel de pantalla y verificar si impactó con algún vóxel. Esencialmente se compone de cuatro partes: **Proyección**, **Ray Direction**, **Ray vs Cube intersection** y ** *DDA*, Digital Differential Analyzer**.
Basado en [Lodev Raycasting tutorial](https://lodev.org/cgtutor/raycasting.html)

### Pseudocódigo
El siguiente fragmento muestra en pseudocódigo el algoritmo utilizado para dibujar el Voxel Thing en pantalla
```
draw:
	Proyectar
	por cada x en pantalla:
		por cada y en pantalla:
			Obtener la dirección del Rayo
			Verificar si colisionó con el Voxel Thing
			Calcular vóxel inicial y vóxel final
			Ejecutar DDA
			Si el rayo colisionó con un vóxel no transparente: colorear
```

### Proyección

Primero proyectamos los cuatro puntos del Rectangle. Luego calculamos la posición relativa del Mapa de Vóxeles respecto a la posición de la cámara y la expresamos en unidades de vóxeles (recordar que 16 vóxeles = 1 unidad de mapa). A esta posición relativa, la almacenamos en `box`. Para tener en cuenta el ángulo del Voxel Thing, debemos rotar la posición relativa empleando la matriz de rotación:

```javascript
const Voxel = () => ({
    . . .	
    box: {
        w: 1, h: 1, d: 1,
        x: 0, y: 0, z: 0
    },
	. . .
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
	. . .
})
```

### Ray Direction

Para el algoritmo de ray tracing necesitamos un objeto que represente al Rayo emitido desde la cámara. Por cada píxel dentro del área de dibujo del Voxel Thing debemos calcular la dirección del Rayo. Para las componentes X Y de la dirección, usamos la misma fórmula que en `FlatSprite`:

```javascript
// Cálculo de la dirección del rayo en plano XY
const dirX0 = Camera.left.x + Camera.delta.x * viewport.x,
	  dirY0 = Camera.left.y + Camera.delta.y * viewport.x
	  
// Rota la dirección del Rayo según el ángulo del vóxel, empleando la matriz de rotación
const dirX = (dirX0 * cos + dirY0 * sin) * this.sw,
	  dirY = (dirY0 * cos - dirX0 * sin) * this.sh
```

La componente Z la obtenemos a partir de la coordenada vertical (*y*) de la pantalla. Si vemos cómo pasamos del Depth Space al Screen Space de un punto:

`Y = Camera.center - Z * Camera.dp`

Entonces despejamos Z:

`Z = (Camera.center - Y) / Camera.dp`

Y necesitamos escalarlo por nuestro Scaled Depth, para no deformar el Voxel Thing:

`dirZ = (Camera.center - y) * this.sd / Camera.dp`

### Ray vs Cube intersection

Una vez que ya tenemos la dirección de nuestro rayo, queda verificar si atraviesa el cubo y en qué puntos. Existen varios artículos que permiten identificar la intersección entre Rayos y Boxes, uno de ellos: https://tavianator.com/2022/ray_box_boundary.html.

Debemos crear un objeto Ray dentro de nuestro Thing. Este rayo tiene una función que verifica si existe intersección con un cubo:

```javascript
const Voxel = () => ({
    . . .
    ray: {
        T_MIN: 0, T_MAX: 100,
        t0: 0, t1: 100,
		
		boxIntersection(box) {
			const txmin = (box.w * (this.invx <  0) - box.x) * this.invx,
				  txmax = (box.w * (this.invx >= 0) - box.x) * this.invx
				
			const tymin = (box.h * (this.invy <  0) - box.y) * this.invy,
				  tymax = (box.h * (this.invy >= 0) - box.y) * this.invy
				
			const tzmin = (box.d * (this.invz <  0) - box.z) * this.invz,
				  tzmax = (box.d * (this.invz >= 0) - box.z) * this.invz
				
			// Restamos 1e-5 del los límites para que t0 quede fuera del cubo y t1 dentro
			this.t0 = Math.max(this.T_MIN, txmin, tymin, tzmin) - 1e-5
			this.t1 = Math.min(this.T_MAX, txmax, tymax, tzmax) - 1e-5
			
			return  txmin <= tymax && tymin <= txmax &&
					txmin <= tzmax && tzmin <= txmax &&
					tymin <= tzmax && tzmin <= tymax &&
					this.t0 < this.T_MAX && this.t1 >= this.T_MIN
		}
    },
	. . .
})
```

La función retorna true si hay intersección. En t0 y t1 almacena las distancias de intersección desde el rayo. De esta forma, las coordenadas de la primera intersección (donde el rayo ingresa al cubo) se obtienen: `dir * ray.t0`, y las coordenadas de la segunda intersección (donde el rayo sale del cubo) se obtienen: `dir * ray.t1`.

### Preliminar

Antes de ver cómo funciona el DDA, podemos dibujar el cubo que representa el Voxel Thing. En la función `draw`:

```javascript
const Voxel = () => ({
	. . .
	draw(viewport) {
        if (this.x1 < viewport.x || this.x0 > viewport.x) return
		if (viewport.depth[viewport.x] > this.dmax) return // Para evitar dibujar el Voxel Thing si hay una pared delante
        const cos = Math.cos(this.angle), sin = Math.sin(this.angle)

        // Cálculo de la dirección del rayo en plano XY
        const dirX0 = Camera.left.x + Camera.delta.x * viewport.x,
              dirY0 = Camera.left.y + Camera.delta.y * viewport.x
        // Rota la dirección del Rayo según el ángulo del vóxel
        const dirX = (dirX0 * cos + dirY0 * sin) * this.sw,
			  dirY = (dirY0 * cos - dirX0 * sin) * this.sh

        this.ray.invx = 1 / dirX
        this.ray.invy = 1 / dirY
			
		const dz = this.sd / Camera.dp
		let y = Math.max(viewport.top, this.y0),
			dirZ = (Camera.center - y) * dz

        const column = Renderer.column
		for (let b = Math.min(viewport.bottom, this.y1); y <= b; y++, dirZ-=dz) {
            this.ray.invz = 1 / dirZ
			
            if (!this.ray.boxIntersection(this.box)) continue
			
			const Y = y << 2
			column[Y]   = 255
			column[Y+1] = 128
			column[Y+2] = 0
        }
	}
	. . .
})
```

Notar que para calcular la dirección en Z, usamos una interpolación lineal: tras cada iteración desplazamos dirZ una cantidad dz. Adicionalmente, calculamos la inversa de la dirección y la guardamos dentro del Ray.

### **DDA**, Digital Differential Analyzer

DDA, *Digital Differential Analyzer* es un algoritmo rápido que consiste en que una línea atraviese una grilla cuadrada y obtener las celdas que cruza. En nuestro caso, la grilla es el mapa de vóxeles, así que usaremos las versión 3D del algoritmo. Además, vamos a expresar el mapa de vóxeles como un arreglo de una única dimensión y vamos a trabajar con el índice en vez de coordenadas 3D. Esto aumenta la performance general.

La implementación del algoritmo completo:

```javascript
const Voxel = () => ({
	. . .
	draw(viewport) {
        if (this.x1 < viewport.x || this.x0 > viewport.x) return
		if (viewport.depth[viewport.x] > this.dmax) return
        const texture = this.texture
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
		for (let b = Math.min(viewport.bottom, this.y1); y <= b; y++, dirZ-=dz) {
            this.ray.invz = 1 / dirZ
			const deltaDistZ = Math.abs(this.ray.invz)
			
            if (!this.ray.boxIntersection(this.box)) continue
			
			// En qué vóxel inicial estamos
            let map0X = Math.floor(this.box.x + dirX * this.ray.t0)
            let map0Y = Math.floor(this.box.y + dirY * this.ray.t0)
            let map0Z = Math.floor(this.box.z + dirZ * this.ray.t0)

            // Cuál vóxel es el último
            let map1X = Math.floor(this.box.x + dirX * this.ray.t1)
            let map1Y = Math.floor(this.box.y + dirY * this.ray.t1)
            let map1Z = Math.floor(this.box.z + dirZ * this.ray.t1)

            // Calcula el step y el sideDist inicial
            let stepX = Math.sign(dirX), stepY = Math.sign(dirY), stepZ = Math.sign(dirZ)

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
                    break
                }
            } while (index !== endIndex)
        }
	}
	. . .
})
```

## Conclusión

En este capítulo vimos la última clase de Thing: el **Voxel Thing**, cuya renderización se basa en Raytracing. Así que podríamos considerarla una técnica de renderización 3D. Si le interesa agregar Voxels a sus mapas le recomiendo la herramiento [Goxel](https://goxel.xyz/) la cual tiene una versión web desde la que se puede descargar las capas del vóxel. Luego se puede ingresar a las texturas del Engine.

