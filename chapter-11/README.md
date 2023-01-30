# **Capítulo 11**. Flat Sprite
> *Código fuente*: [Source](./src) 

En este capítulo veremos los **Flat Sprites**, un tipo de Sprite paralelo al suelo. Se puede utilizar para crear ventanas en el techo, manchas en el piso, sombras, y otros tantos usos. En esencia es una textura rectangular que se proyecta de igual forma que un Flat.


Viewport ahora necesita contemplar a los Flat para agregarlos a los buckets

## Estructura
La estructura es similar a la de los demás Sprites
```javascript
const FlatSprite = () => ({
    isFlat: true, // Para distinguir el tipo
    pos: v3(),
    h: 1, w: 1,

    init() {
    },

    project() {
    },

    draw(viewport) {
    }
})
```

## Diseño
### Things
En Things creamos una nueva y para indicar que se trata de un Flat Sprite, simplemente asignamos el valor "flat" al type:
```javascript
ResourceManager.loadThings(
    . . .
    {
        name: "iron_floor",
        texture: "96",
        type: "flat"
    }
)
```
### Level
Un Flat Sprite es un plano con dos caras. Si vemos su cara superior debemos renderizarlo como un Floor y si vemos su cara inferior, como un ceiling. Para indicar qué cara del Sprite es visible, indicamos `floor:true` para ver la cara superior y `ceiling:true` para ver la cara inferior. Por defecto, ambas caras son visibles.

En el diseño del nivel, agregamos el Sprite:
```toml
[[sectors]]
    name = "other"

    [[sectors.things]]
    thing = "iron_floor"
    x = 9
    y = 16
    z = 0
    h = 4
    w = 2
```

### Parser
En el parser agregamos el case "flat":
```javascript
const Parser = {
    . . .
    parseThing(info) {
        . . .
        switch(definition.type) {
            . . .
            case "flat":
                thing = FlatSprite()
                thing.angle = (info.angle || 0) * Math.PI / 180
                thing.floor = !(info.floor === false)
                thing.ceiling = !(info.ceiling === false)
                break
            . . .
        }
        . . .
    }
}
```

## Configuración Inicial

El Flat Sprite requiere cuatro puntos que indican cada una de las esquinas. Creamos un objeto que represente esta proyección: `Rectangle`.  En la función `updateShape`, rotamos los cuatro puntos según la matriz de rotación para el ángulo ingresado teniendo como centro la posición del Sprite. Esta función se debe llamar cada vez que modificamos el ángulo, la posición o las dimensiones del Sprite, para que la proyección sea correcta:

```javascript
const Rectangle = {
    initRectangle() {
        [this.p0, this.p1, this.p2, this.p3] = new Array(4).fill(0).map(Point)
        this.updateShape()
    },

    updateShape() {
        const cosh2 = Math.cos(this.angle) * this.h * .5, sinh2 = Math.sin(this.angle) * this.h * .5,
              cosw2 = Math.cos(this.angle) * this.w * .5, sinw2 = Math.sin(this.angle) * this.w * .5
        const sx = this.pos.x, sy = this.pos.y
        this.p0.x = sx + cosw2 - sinh2; this.p0.y = sy + sinw2 + cosh2;
        this.p1.x = sx + cosw2 + sinh2; this.p1.y = sy + sinw2 - cosh2;
        this.p2.x = sx - cosw2 - sinh2; this.p2.y = sy - sinw2 + cosh2;
        this.p3.x = sx - cosw2 + sinh2; this.p3.y = sy - sinw2 - cosh2;
    }
}
```

FlatSprite debe heredar de Rectangle:


```javascript
const FlatSprite = () => ({
    . . .
    init() {
        this.initRectangle()
    },
    
    . . .
    __proto__: Rectangle
})
```
## Proyección
Durante su proyección, el Sprite proyecta los cuatros puntos en el Camera Space, luego aplica Near Plane Culling y los proyecta en el Depth Space. Luego calcula sus márgenes horizontales (x0,x1) y verticales (y0,y1), y almacena el valor del Depth del punto más próximo a la cámara y del más lejano.
```javascript
const Rectangle = {
    . . .
    projectPoints() {
        const {p0, p1, p2, p3} = this

        // Camera Space
        p0.toCameraSpace(); p1.toCameraSpace(); p2.toCameraSpace(); p3.toCameraSpace();

        // Near Plane Culling y Depth Space
        if (p0.yp > Camera.nearPlane && p1.yp > Camera.nearPlane &&
            p2.yp > Camera.nearPlane && p3.yp > Camera.nearPlane) return false

        p0.yp = Math.min(Camera.nearPlane, p0.yp); p0.toDepthSpace()
        p1.yp = Math.min(Camera.nearPlane, p1.yp); p1.toDepthSpace()
        p2.yp = Math.min(Camera.nearPlane, p2.yp); p2.toDepthSpace()
        p3.yp = Math.min(Camera.nearPlane, p3.yp); p3.toDepthSpace()

        // Márgenes horizontales
        const x0 = Math.max(0,                Math.min(p0.col, p1.col, p2.col, p3.col)),
              x1 = Math.min(Renderer.width-1, Math.max(p0.col, p1.col, p2.col, p3.col))

        // ¿Se encuentra dentro de la pantalla?
        if (x0 >= Renderer.width || x1 < 0) return false

        // Búsqueda del punto más próximo a la pantalla dmax, y del más lejano dmin
        let dmin = p0, dmax = p0;
        if (p1.depth > dmax.depth) dmax = p1; if (p1.depth < dmin.depth) dmin = p1;
        if (p2.depth > dmax.depth) dmax = p2; if (p2.depth < dmin.depth) dmin = p2;
        if (p3.depth > dmax.depth) dmax = p3; if (p3.depth < dmin.depth) dmin = p3;

        // Screen Space de estos puntos
        dmin.toScreenSpace(this.pos.z, this.pos.z); dmax.toScreenSpace(this.pos.z, this.pos.z);

        // Límites verticales
        const y0 = Math.max(0,                   Math.min(dmin.top, dmax.top)),
              y1 = Math.min(Renderer.height - 1, Math.max(dmin.top, dmax.top))
        
        // ¿Se encuentra dentro de la pantalla?
        if (y0 >= Renderer.height || y1 < 0) return false

        // Almaceno todos los resultados en el Sprite
        this.y0 = ~~y0; this.y1 = ~~y1; this.x0 = x0; this.x1 = x1;
        this.dmin = dmin.depth; this.dmax = dmax.depth;
        return true

    },
    . . .
}
```
```javascript
const FlatSprite = () => ({
    . . .
    project() {
        // Verifica si la cara es visible
        if (this.pos.z > Camera.pos.z && !this.ceiling ||
            this.pos.z <= Camera.pos.z && !this.floor) return false

        if (!this.projectPoints()) return false

        if (this.y0 >= Renderer.height || this.y1 < 0) return false
		return true
    },
    . . .
})
```
## Renderización
### Draw Before
Para saber qué Sprite se debería dibujar primero, emplemos la función `drawBefore` que comparaba información del Segment de cada Sprite. Nuestros Flat Sprites no contienen Segments, lo que significa que debemos verificar contra qué tipo de Thing estamos comparando.

- **Flat vs. Flat**: verificamos primero quién está delante comparando los límites guardados en *dmin* y *dmax*. Si están superpuestos, debemos dibujar primero el que esté más lejos de la cámara, midiendo la distancia en el eje Z.
- **Flat vs. Segment**: similar al anterior, pero comparamos *dmin* y *dmax* contra el valor de Depth del segment, evaluado en el centro del Flat.

De esta forma completamos en Rectangle:
```javascript
const Rectangle = {
    . . .
    drawBefore(thing) {
        if (thing.isFlat) {
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
    . . .
}
```

Actualizamos el de Segment Sprite:
```javascript
const SegmentSprite = {
    . . .
    drawBefore(thing) {
        if (thing.isFlat) {
            if (thing.x0 > this.segment.p1.col || thing.x1 < this.segment.p0.col) return true
            const depth = this.segment.getDepthAt((thing.x0 + thing.x1) * .5)
            if (thing.dmax < depth) return false
            if (thing.dmin > depth) return true
            return Math.abs(this.pos.z - Camera.pos.z) > Math.abs(thing.pos.z - Camera.pos.z)
        } else {
            const s0 = this.segment.p0.col, s1 = this.segment.p1.col,
                t0 = thing.segment.p0.col, t1 = thing.segment.p1.col
            if (s0 > t1 || t0 > s1) return true // No hay superposición
            const col = Math.max(0, s0, t0)
            return thing.segment.getDepthAt(col) > this.segment.getDepthAt(col)
        }
    },
    . . .
}
```
### Viewport
En el Viewport ahora debemos considerar a los Flat Sprites a la hora de agregar las Things a los Buckets. En la proyección ya calculamos sus extremos, solo queda iterar entre ellos:
```javascript
const Viewport = (width) => ({
    . . .
    loadBuffers() {
        . . .
        for (const t of this.sector.visibleThings) {
            let from, to
            if (t.isFlat) {
                from = t.x0 >> 4
                to   = t.x1 >> 4
            } else {
                // Si está fuera de los límites del boundary
                if (this.segment && t.segment.p0.depth > Math.max(this.segment.p0.depth, this.segment.p1.depth)) continue
                from = Math.max(t.segment.p0.col >> 4, 0) // floor(col / 16)
                to = Math.min(t.segment.p1.col >> 4, this.buckets.length - 1)
            }
            for (; from <= to; from++)
                this.buckets[from].push(t)
        }
    },
    . . .
})
```
### Dibujo
Para el dibujo nos basamos en el código de Flat.
```javascript
const FlatSprite = () => ({
    . . .
    draw(viewport) {
        // Si el Sprite está en esta columna
        if (this.x1 < viewport.x || this.x0 > viewport.x) return

        const texture = this.texture
        const w = texture.w / this.w
		const h = texture.h / this.h
        const w_2 = texture.w * .5, h_2 = texture.h * .5
        const cos = Math.cos(this.angle), sin = Math.sin(this.angle)

        const distanceRelation = (Camera.pos.z - this.pos.z) * Camera.dp

        // El Offset de la textura lo da la posición relativa de la cámara respecto del Sprite
        const offU = Camera.pos.x - this.pos.x,
              offV = Camera.pos.y - this.pos.y

        const dirX = Camera.left.x + Camera.delta.x * viewport.x,
              dirY = Camera.left.y + Camera.delta.y * viewport.x

        const column = Renderer.column, data = texture.data, depth = 1/viewport.depth[viewport.x]
        for (let y = Math.max(viewport.top, this.y0), b = Math.min(viewport.bottom, this.y1); y <= b; y++) {
		    const rowDistance = distanceRelation / (y - Camera.center)

            // Clipping. Si esta fila está por detrás de un segmento, no se dibuja
            if (rowDistance > depth) continue

            // u0 y v0 son los valores que calcularía el Flat
            // Para obtener U y V, rotamos por la matriz de rotación del Sprite
            // escalamos y luego lo centramos
            const u0 = offU + dirX * rowDistance,
                  v0 = offV + dirY * rowDistance
            const u = w_2 + (cos * u0 + sin * v0) * w,
                  v = h_2 + (cos * v0 - sin * u0) * h

            // Garantiza dibujar el rectángulo correspondiente al Sprite
            if (u < 0 || u > texture.w || v < 0 || v > texture.h) continue

            const Y = y << 2
            const i = (~~u * texture.h + ~~v) << 2

            const alpha = data[i + 3] / 255,
                  beta = 1 - alpha

            column[Y]   = beta * column[Y]   + alpha * data[i]
            column[Y+1] = beta * column[Y+1] + alpha * data[i+1]
            column[Y+2] = beta * column[Y+2] + alpha * data[i+2]
            column[Y+3] = beta * column[Y+3] + alpha * data[i+3]
        }
    }
})
```

## Conclusión
En este capítulo vimos cómo introducir Sprites alineados con el suelo. No vimos ninguna técnica nueva sino que repasamos con conceptos previos, lo que espero que haya hecho más ameno el camino.

En el próximo capítulo veremos el último tipo de Thing, el **Voxel**. Luego concluiremos con el Motor Gráfico viendo unas últimas técnicas que enriquecen los elementos visuales.