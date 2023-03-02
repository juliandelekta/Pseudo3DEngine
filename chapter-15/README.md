# **Capítulo 15**. Lightmaps
> *Código fuente*: [Source](./src)

Referencias:
https://www.flipcode.com/archives/Light_Mapping_Theory_and_Implementation.shtml
http://www.cppblog.com/zmj/archive/2008/08/26/60039.html



Después del largo recorrido llegamos al *Final del Tutorial* sobre las técnicas gráficas del Engine. En este capítulo vamos a ver una forma de dar realismo y vida a las escenas a través de la iluminación. Hoy en día existen diversas técnicas que se aproximan a la iluminación realista. Una de ellas es la que vamos a explorar hoy: **Lightmaps**.

Los Lightmaps son texturas que contienen información sobre la cantidad de luz aplicada sobre un objeto. Se pueden simular los efectos de luz y sombra si se multiplica el Lightmap con la textura de color (denominada *Diffuse*). A cada píxel de una textura se lo denomina Texel, y de esta forma vamos a llamar a los píxeles del Lightmap cuyo valor se representa con 8 bits: 0 ausencia de luz, 255 totalmente iluminado.

El método del Lightmap se considera un *Método Estático* debido a que se calcula una única vez para objetos que no se mueven en el tiempo. Esto significa, que solo vamos a tener en cuenta los elementos estáticos de un nivel: Walls, Flats y Slopes. Adicionalmente, implica que existe una restricción sobre las luces presentes en el nivel: no se pueden mover y sus propiedades son fijas.

El problema de aplicar el lightmap se compone de tres partes:
1. [Crear](#creación-del-lightmap) y asignar el Lightmap a todos los objetos del nivel
2. [Calcular](#cálculo-del-lightmap) para cada Texel del Lightmap la cantidad de luz que incide sobre él
3. [Dibujar](#renderización) el objeto aplicando el Lightmap y Diffuse

## Creación del Lightmap

Cada Texel del Ligthmap corresponde con un cuadrado en el espacio geométrico cuya dimensión es fija (LIGHTMAP_SIZE). De esta forma para calcular cuántos texels entran en una longitud: `length / LIGHTMAP_SIZE`, como queremos que el Lightmap sea más grande que la longitud: `ceil(lengt / LIGHTMAP_SIZE)`.

En [Renderización](#renderización) veremos que existe un problema en los bordes del lightmap que se soluciona expandiendo el mismo un Texel en cada lado. Entonces a los cálculos de las dimensiones del Lightmap (width y height) debemos sumarle 2 (uno por cada lado).

Definimos un Objeto encargado de crear los Lightmaps para cada objeto estático del nivel, `lightmaps/Lightmap.js`. Inicialmente, vamos a ver cómo funciona el proceso para las Solid Walls y luego lo expandimos para las demás estructuras:

### Solid

```javascript
const Lightmap = {
    LIGHTMAP_SIZE: 1/8, // En una unidad de espacio, caben 8 Texels

    addLightmapToSegment(segment) {
        (
            segment.wall.isPortal ? this.addLightmapToPortal
        :   segment.wall.isStack  ? this.addLightmapToStack
        :                           this.addLightmapToSolid
        ).bind(this)(
            segment.wall,
            Math.ceil(segment.length / this.LIGHTMAP_SIZE) + 2,
            segment.sector.floor.z,
            segment.sector.ceiling.z
        )
    },

    newLightmap(w, h) {
        return {
            data: new Uint8ClampedArray(w * h),
            w, h
        }
    },

    addLightmapToSolid(solid, width, floor, ceil) {
        solid.lightmap = this.newLightmap(
            width,
            Math.ceil((ceil - floor) / this.LIGHTMAP_SIZE) + 2
        )
    }
}
```

Como puede verse en el código, para las dimensiones width y height se le adiciona un 2. El lightmap es una estructura similar a una textura con sus dimensiones y su arreglo de datos. Como solo necesitamos un valor entre 0 y 255 para representar la intensidad de la luz, los datos están almacenados en un Uint8ClampedArray (Campled por si sobrepasa 255, lo fija en 255).

La función `addLightmapToSegment` multiplexa la función según el tipo de Wall (Portal, Stack o Solid).

### Portals

Para los Portals, de igual forma que sus texturas, vamos a guardar un lightmap en cada Step: `lowerLightmap` para el Step Up y `upperLightmap` para el Step Down:

```javascript
const Lightmap = {
    . . . 
    addLightmapToPortal(portal, width, floor, ceil) {
        const upperH = Math.ceil((ceil - portal.next.ceiling.z) / this.LIGHTMAP_SIZE) + 2,
              lowerH = Math.ceil((portal.next.floor.z - floor)  / this.LIGHTMAP_SIZE) + 2

        portal.upperLightmap = upperH > 0 ? this.newLightmap(width, upperH) : {}
        portal.lowerLightmap = lowerH > 0 ? this.newLightmap(width, lowerH) : {}
    },
    . . .
}
```

### Stacks

Para los Stacks, iteramos sobre las Subwalls desplazandonos en Z:

```javascript
const Lightmap = {
    . . . 
    addLightmapToStack(stack, width, floor, ceil) {
        let z = 0

        for (const wall of stack.walls) {
            const top = floor + wall.z || ceil,
                bottom = floor + z

            if (wall.isPortal)
                this.addLightmapToPortal(wall, width, bottom, top)
            else
                this.addLightmapToSolid(wall, width, bottom, top)

            z = wall.z
        }
    },
    . . .
}
```

### Flats

La forma de un Sector se considera poligonal y se encuentra definida por los Segments que lo componen. De igual manera, un Flat sigue esta forma poligonal, pero el Lightmap es rectangular. Por ello, debemos definir un Lightmap que abarque la totalidad del polígono.

![Flat Lightmap](/img/flat-lightmap.png)

Como puede verse en la figura, debemos tomar los extremos verticales y horizontales.

```javascript
const Lightmap = {
    . . . 
    addLightmapToFlats(sector) {
        let x0 = sector.segments.reduce((acc, s) => Math.min(acc, s.p0.x, s.p1.x), Infinity),
            y0 = sector.segments.reduce((acc, s) => Math.min(acc, s.p0.y, s.p1.y), Infinity),
            x1 = sector.segments.reduce((acc, s) => Math.max(acc, s.p0.x, s.p1.x), -Infinity),
            y1 = sector.segments.reduce((acc, s) => Math.max(acc, s.p0.y, s.p1.y), -Infinity)

        const width = Math.ceil((x1 - x0) / this.LIGHTMAP_SIZE) + 2,
            height = Math.ceil((y1 - y0) / this.LIGHTMAP_SIZE) + 2,
            flatLightmap = {
                size: 1 / this.LIGHTMAP_SIZE,
                origin: {
                    u: x0,
                    v: y0
                }
            }

        if (!sector.slopeFloor && !sector.floor.next && !sector.floor.parallax)
            sector.floor.lightmap = Object.assign(
                this.newLightmap(width, height),
                flatLightmap
            )

        if (!sector.slopeCeil && !sector.ceiling.next && !sector.ceiling.parallax)
            sector.ceiling.lightmap = Object.assign(
                this.newLightmap(width, height),
                flatLightmap
            )
    },

    . . .
}
```

En el segmento previo calculamos los extremos haciendo uso de la función `reduce` y extrayendo el máximo o mínimo en ambos ejes. Luego aplicamos el lightmap al Flat solo si no hay un Slope, no es Flat Portal y no tiene Parallax. Adicionalmente, indicamos las coordenadas globales del origen del Lightmap con el objeto `origin`.

### Slopes

Recordando lo visto en el [Capítulo 9](../chapter-09/) los Slopes están conformados por los Sidewalls y el Slope propiamente dicho. Debemos asignarles un Lightmap a cada uno de estas estructuras.

```javascript
const Lightmap = {
    . . . 
    addLightmapToSlope(slope, isSlopeFloor, z0) {
        for (const segment of slope.segments) {
            const max = Math.max(segment.p0.z, segment.p1.z)

            this.addLightmapToSolid(
                segment,
                Math.ceil(segment.length / this.LIGHTMAP_SIZE) + 2,
                isSlopeFloor ? z0 : max,
                isSlopeFloor ? max : z0
            )
            segment.lightmap.size = 1 / this.LIGHTMAP_SIZE
        }

        const S0 = slope.segments[0],
            S1 = slope.segments[1],
            S2 = slope.segments[2],
            S3 = slope.segments[3]

        let dx = S1.p0.x - S0.p0.x,
            dy = S1.p0.y - S0.p0.y,
            dz = S1.p0.z - S0.p0.z
        const width = Math.ceil(Math.sqrt(dx * dx + dy * dy + dz * dz) / this.LIGHTMAP_SIZE) + 2

        dx = S2.p0.x - S1.p0.x
        dy = S2.p0.y - S1.p0.y
        dz = S2.p0.z - S1.p0.z
        const height = Math.ceil(Math.sqrt(dx * dx + dy * dy + dz * dz) / this.LIGHTMAP_SIZE) + 2

        slope.lightmap = this.newLightmap(width, height)
        slope.lightmap.size = 1 / this.LIGHTMAP_SIZE
    },

    addLightmapToSlopes(sector) {
        if (sector.slopeFloor)
            this.addLightmapToSlope(sector.slopeFloor, true, sector.floor.z)
        if (sector.slopeCeil)
            this.addLightmapToSlope(sector.slopeCeil, false, sector.ceiling.z)
    }
}
```

Los Sidewalls pueden tener una forma no rectangular, por ello debemos indicar los límites sobre los máximos en Z. Luego se les aplica un Lightmap como si fueran una Solid Wall.

Para calcular las dimensiones del Lightmap en el Slope se toma la distancia entre puntos consecutivos, uno correspondiente al eje U y el otro al V.

### Sectors

Por último, agregamos una función para asignarle Lightmaps a todos los elementos dentro de un sector:

```javascript
const Lightmap = {
    LIGHTMAP_SIZE: 1/8,

    addLightmapToSector(sector) {
        for (const segment of sector.segments)
            this.addLightmapToSegment(segment)

        this.addLightmapToFlats(sector)
        this.addLightmapToSlopes(sector)
    },
    . . .
}
```

## Cálculo del Lightmap

Una de las ventajas de los Lightmaps es que solo se deben calcular una única vez (considerando un nivel estático), librando a la CPU de cálculos complejos en tiempo de ejecución. Generalmente, se calculan una vez cargado el nivel en una etapa denominada **Baking**. Como me gustan los juegos de palabra, llamaremos al objeto encargado de "Hornear" (*Bake*) los Lightmaps, **Bakery**. Adicionalmente, este objeto tendrá una lista con todas las luces definidas del nivel.

```javascript
const Bakery = {
    lights: [],

    load(lights) {
        for (const light of lights) {
            light.falloff = light.falloff || 0
            if (!light.getLight)
                light.getLight = function(distance) {
                    return 255 / (distance * this.falloff + 1)
                }
            this.lights.push(light)
        }
    },

    bake(level) {
        // Hornear Lightmaps del nivel
    }
}
```

Las **Lights** son objetos que definen dónde se deben ubicar las luces dentro del nivel. Sus propiedades son:
- posición (es estática)
- sector en el que se encuentran
- falloff, caída en la intensidad de luz
- getLight, es un método encargado de definir la intensidad de luz (entre 0 y 255) en función de la distancia hacia el objetivo

Un archivo de diseño de lights se ve como:

```javascript
Bakery.load([
    {
        x: 16, y: 7, z: 1,
        sector: "main",
        falloff: 0.2,
        getLight: distance => (distance < 2) * 255
    },
    {
        x: 5, y: 19, z: 1.3,
        sector: "above",
        falloff: 0.02
    },
])
```

### Lighted Sectors

El algoritmo es una versión simplificada del *Raytracing* donde lanzamos rayos desde la fuente de luz hacia los *Objetos Físicos*. Estos objetos están vinculados con las estructuras del nivel y los vamos a encontrar de tres formas distintas:
- Rectángulo paralelo al eje Z: Para las Walls
- Plano paralelo al plano XY: Para los Flats
- Polígono 3D: Para los Slopes

También vamos a tener una versión alterna del Sector denominada *Lighted Sector* que contiene estos Objetos. Accederemos a ellos mediante un Map indexado por nombre de sector.

```javascript
const Bakery = {
    lights: [],
    sectorsMap: null,

    . . .

    bake(level) {
        const sectorsMap = {}
        this.sectorsMap = sectorsMap

        for (const sectorName in level.sectors) {
            const sector = level.sectors[sectorName]

            Lightmap.addLightmapToSector(sector)

            sectorsMap[sectorName] = this.createLightedSector(sector)
        }

        this.bakeSectors(sectorsMap)
    }
}
```

En el fragmento primero creamos el Map(Nombre de sector => Lighted Sector). Luego agregamos los Lightmaps a todos los sectores del nivel y construimos el Lighted Sector correspondiente. Una vez todo los Lighted Sectors están cargados, aplicamos el Baking sobre ellos.

Primero debemos definir las estructuras de datos que representan los objetos físicos. Creamos el archivo `lightmaps/intersections.js`.

```javascript
const segment_t = (x0, y0, z0, x1, y1, z1) => ({
    x0, y0, z0,
    x1, y1, z1,
    dirx: x1 - x0, diry: y1 - y0, dirz: z1 - z0,

    calculateDir() {
        this.dirx = this.x1 - this.x0
        this.diry = this.y1 - this.y0
        this.dirz = this.z1 - this.z0
    },

    // Determina si el punto dado por las coordenadas se encuentra a la derecha de este segment
    isInFront(x, y) {
        const dx = x - this.x0,
            dy = y - this.y0
        return this.dirx * dy - this.diry * dx > 0
    },

    length() {
        return Math.sqrt(this.dirx * this.dirx + this.diry * this.diry + this.dirz * this.dirz)
    }
})

const triangle_t = (p0, p1, p2) => {
    const x0 = p0.x, y0 = p0.y, z0 = p0.z,
          x1 = p1.x, y1 = p1.y, z1 = p1.z,
          x2 = p2.x, y2 = p2.y, z2 = p2.z
    const ux = x1 - x0,
          uy = y1 - y0,
          uz = z1 - z0
    const vx = x2 - x0,
          vy = y2 - y0,
          vz = z2 - z0
    const nx = uy * vz - uz * vy,
          ny = uz * vx - ux * vz,
          nz = ux * vy - uy * vx
    return {
        x0, y0, z0, // V0
        x1, y1, z1, // V1
        x2, y2, z2, // V2
        ux, uy, uz, // u
        vx, vy, vz, // v
        nx, ny, nz, // n = u x v

        isInFront(x, y, z) {
            return this.nx * (x - this.x0) + this.ny * (y - this.y0) + this.nz * (z - this.z0) > 0 // dot product
        },

        invertN() {
            this.nx = -this.nx
            this.ny = -this.ny
            this.nz = -this.nz
            return this
        }
    }
}
```

`segment_t` es un constructor de un segmento tridimensional desde un punto inicial (x0,y0,z0) hasta un punto final (x1,y1,z1). Su dirección (dirx,diry,dirz) no está normalizada.

`triangle_t` es un triángulo 3D también denominado polígono que se construye a partir de tres puntos (p0,p1,p2). La siguinte imagen ilustra cómo se eligen los vectores U y V

![Triangle](/img/triangle.png)

Ahora podemos crear la función `createLightedSector`:

```javascript
const Bakery = {
    . . .
    createLightedSector(sector) {
        const lightedSector = {
            segments: sector.segments.map(segment => ({
                type: segment_t(segment.p0.x, segment.p0.y, 0, segment.p1.x, segment.p1.y, 0),
                segment
            })),
            sector
        }

        if (sector.slopeFloor)
            lightedSector.slopeFloor =
                this.createLightedSlope(sector.slopeFloor, sector.floor.z, true)
        else
            lightedSector.floor = this.createLightedFlat(sector.floor, true)

        if (sector.slopeCeil)
            lightedSector.slopeCeil =
                this.createLightedSlope(sector.slopeCeil, sector.ceiling.z, false)
        else
            lightedSector.ceil = this.createLightedFlat(sector.ceiling, false)
        
        return lightedSector
    },

    createLightedFlat(flat, isFloor) {
        return {
            z: flat.parallax ? (isFloor ? -Infinity : Infinity) : flat.z,
            next: flat.next || null,
            flat
        }
    },

    createLightedSlope(slope, z, isFloor) {
        let s0 = slope.segments[0].p0,
            s1 = slope.segments[1].p0,
            s2 = slope.segments[2].p0,
            s3 = slope.segments[3].p0

        const p0 = v3(s0.x, s0.y, isFloor ? s0.z : z - s0.z),
            p1 = v3(s1.x, s1.y, isFloor ? s1.z : z - s1.z),
            p2 = v3(s2.x, s2.y, isFloor ? s2.z : z - s2.z),
            p3 = v3(s3.x, s3.y, isFloor ? s3.z : z - s3.z)

        return {
            triangle1: isFloor
                ? triangle_t(p0, p1, p3)
                : triangle_t(p0, p1, p3).invertN(),
            triangle2: isFloor
                ? triangle_t(p1, p3, p2)
                : triangle_t(p1, p2, p3).invertN(),
            slope,
            segments: slope.segments.map(segment => this.segmentTriangulation(
                segment,
                isFloor ? z : z - segment.p1.z, 
                isFloor ? z : z - segment.p0.z,
                isFloor ? z + segment.p0.z : z,
                isFloor ? z + segment.p1.z : z
            ))
        }
    },

    segmentTriangulation(segment, p0z, p1z, p2z, p3z) {
        const p0 = v3(segment.p1.x, segment.p1.y, p0z),
              p1 = v3(segment.p0.x, segment.p0.y, p1z),
              p2 = v3(segment.p0.x, segment.p0.y, p2z),
              p3 = v3(segment.p1.x, segment.p1.y, p3z)
        return {
            segment,
            type: segment_t(segment.p1.x, segment.p1.y, 0, segment.p0.x, segment.p0.y, 0),
            triangle1: triangle_t(p0, p1, p3),
            triangle2: triangle_t(p1, p2, p3)
        }
    }
}
```

Como puede verse en el framento de código, las Slopes se componen dos triángulos que forman un rectángulo. Mientras que las sidewalls, tienen también dos triángulos, que se adaptan a la forma particular de las mismas. Adicionalmente, las sidewalls requieren un segmento como las Walls.

### Texture Mapping

Antes de pasar al cálculo del Lightmap, debemos entender cómo la textura del Lightmap mapea a una posición 3D. Cada vez que nos refiramos a píxel (o texel) del Lightmap, estamos refiriéndonos al centro del píxel.

![Centro del Píxel](/img/pixel-center.png)

### Baking - Algoritmo

Básicamente el procesos de "Horneado" (*Baking*) consiste en que por cada Sector, enviar a Bake a cada Wall, Flat y Slope. El pseudocódigo del algoritmo se compone de los siguientes pasos:

```
[Baking]:
Por cada Segment, Flat y Slope (Objetivo)
    Por cada texel en el Lightmap del Objetivo (x1,y1,z1)
        Por cada Luz en el nivel que esté en frente del objetivo (x0,y0,z0)
            Se tiene el Rayo parametrizado: P(t) = <x0+(x1-x0)t, y0+(y1-y0)t, z0+(z1-z0)t>
            Lanzar el Rayo (Cast)
            Si colisiona con un objeto:
                Pintar Texel de negro
            Si colisiona con el objetivo:
                Pintar el Texel en función de su distancia
            

[Cast Ray]
  Sea Sector Actual el Sector de la Luz
->Del Sector actual, eliminar los Segments que no están orientados hacia la luz
| Obtener Tf: t para el que colisiona con algún Flat o Slope
| Llamamos hit, si la luz impacta el objetivo
| Verificar qué Segment atraviesa, obtiene Ts:
|     Si el Segment es el Objetivo: hit=true
|     Si Tf < Ts, golpea primero el Flat o Slope:
|         Si el Flat o Slope es el Objetivo: hit=true
|         Sino:
|----------<< Si es Portal, cambio a Siguiente Sector
|             Sino: hit=false
|     Si es Solid: hit=false
|     Si es Portal:
|         Si golpea en un Step: hit=false
|------<< Sino, cambio al Siguiente Sector
      Si es Stack, por cada subwall,
        repetir Solid y Portal
```

### Raytracer

Para hacer el código más legible vamos a modularizar la solución. Creamos un objeto que nos va a ayudar con el manejo de Rayos de Luz y su verificación de colisión.

```javascript
const Raytracer = {
    ray: segment_t(0,0,0, 0,0,0),
    t0: 0,
    light: null, // Luz que se está procesando actualmente

    setTarget(x, y, z) {
        this.ray.x1 = x
        this.ray.y1 = y
        this.ray.z1 = z
    },

    setX(x) {
        this.ray.x1 = x
    },

    setY(y) {
        this.ray.y1 = y
    },

    setZ(z) {
        this.ray.z1 = z
    },

    /**
     * Recibe una lista de luces y una estructura objetivo.
     * Calcula cuánta intensidad de luz se consigue casteando el rayo desde la luz
     * */
    lightInObjective(lights, objective) {
        let l = 0
        for (const light of lights) {
            this.ray.x0 = light.x
            this.ray.y0 = light.y
            this.ray.z0 = light.z
            this.light = light
            this.ray.calculateDir()

            l += this.cast(objective, Bakery.sectorsMap[light.sector], 0)
                ? this.light.getLight(this.ray.length())
                : 0
        }

        return l
    },

    /**
     * Realiza la emisión de la luz
     * @param {LightedObject} objective Estructura objetivo
     * @param {LightedSector} sector Sector a evaluar actualmente
     * @param {Number} t0 Cota inferior del parámetro t. t > t0
     * @returns Si el rayo de luz incide sobre el objective o no
     */
    cast(objective, sector, t0) {
        /***/
    }
}
```

`Raytracer` depende de `Bakery` para el Mapa de Sectors y así obtener el Lighted Sector a partir del nombre. La magia del **Raytracing** ocurre en la función `cast` del Raytracer. Como se mencionó en el Pseudocódigo, debemos identificar si colisionamos con un Flat o Slope antes que un Segment. Creamos dos objetos auxiliares que simplifican la tarea, `hitInfo` y `hitFlat`. Adicionalmente, completamos la función cast.

```javascript
const Raytracer = {
    . . .
    // Información de colisió con Segments
    hitInfo: {
        t: Infinity,
        object: null,

        update(t, object) {
            if (t > Raytracer.t0 && t < this.t) {
                this.t = t
                this.object = object
            }
        },

        clear() {
            this.t = Infinity
            this.object = null
        }
    },

    // Información de colisió con Flats o Slopes
    hitFlat: {
        t: Infinity,
        next: null,
        object: null,

        update(t, object) {
            if (t > Raytracer.t0 && t < this.t) {
                this.t = t
                this.next = object.next ? Bakery.sectorsMap[object.next.name] : null
                this.object = object
            }
        },

        clear() {
            this.t = Infinity
            this.next = null
            this.object = null
        }
    },

    . . .

    cast(objective, sector, t0) {
        this.t0 = t0
        this.hitFlat.clear()
        this.hitInfo.clear()

        this.castToFlatsAndSlopes(sector)
        this.castToSegments(sector.segments)

        // Colisiona primero con Segment
        if (this.hitInfo.t < this.hitFlat.t) {
            if (this.hitInfo.object === objective) return true

            const wall = this.hitInfo.object.segment.wall
            const z = this.ray.z0 + this.hitInfo.t * this.ray.dirz

            return wall.isPortal ? (this.castFromPortal(objective, wall, z))
                :  wall.isStack  ? (this.castFromStack(objective, wall, z, sector.floor.z, sector.ceil.z))
                :                  false

        } else
            // Si colisiona primero con el Flat o Slope
            return this.hitFlat.t === Infinity ? false
                :  this.hitFlat.object === objective ? true
                // Si es Portal, paso al siguiente sector
                :  this.hitFlat.next && this.cast(objective, this.hitFlat.next, this.hitFlat.t)
        
    }
}
```

Como puede verse en el fragmento, la función `cast` sigue el Pseudocódigo mostrado.

Las funciones `castToFlatsAndSlopes` y `castToSegments` requieren verificar colisiones de Segmento con Planos y Polígonos. En el archivo adjunto [Intersección de Segmentos](/Intersecci%C3%B3n%20de%20Segmentos.pdf) hay una descripción matemática de cómo se derivan dichas funciones. El material es una traducción de la página ya obsoleta: https://web.archive.org/web/20090618111606/http://www.cppblog.com:80/zmj/archive/2008/08/26/60039.html. El código correspondiente se encuentra implementado en [intersections.js](/src/lightmaps/intersections.js) y exporta las funciones `Segment_Segment` y `Segment_Triangle`. Estas funciones retorna un valor del parámetro **t** si colisionan con el objeto. Si no existe colisión, retornan -1.

Si colisiona primero en un Segment y su Wall es un Portal, debemos volver a castear el Rayo a partir de la colisión (modificamos `t0` con el `t` de la colisiónpara ignorar lo que está detrás). Esta tarea es llevada a cabo por las funciones `castFromPortal` y `castFromStack`.

Finalmente, completamos el Raytracer:

```javascript
const Raytracer = {
    . . .
    castFromPortal(objective, portal, z) {
        // Si no impacta en ningún Step, pasa el siguiente sector
        return (z > portal.next.floor.z && z < portal.next.ceiling.z) &&
            this.cast(objective, Bakery.sectorsMap[portal.next.name], this.hitInfo.t)
    },

    castFromStack(objective, stack, z, floor, ceil) {
        let z0 = 0

        for (const wall of stack.walls)
            if (z > floor + z0 && z < (floor + wall.z || ceil)) // Si está dentro de esta wall
                return wall.isPortal && this.castFromPortal(objective, wall, z)
    },

    castToSegments(segments) {
        for (const segment of segments)
            if (segment.type.isInFront(this.light.x, this.light.y))
                this.hitInfo.update(
                    Segment_Segment(this.ray, segment.type),
                    segment
                )
    },

    castToFlatsAndSlopes(sector) {
        if (sector.floor) {
            this.hitFlat.update(
                (sector.floor.z - this.ray.z0) / this.ray.dirz,
                sector.floor
            )
        } else if (sector.slopeFloor)
            this.castToSlope(sector.slopeFloor)

        if (sector.ceil) {
            this.hitFlat.update(
                (sector.ceil.z - this.ray.z0) / this.ray.dirz,
                sector.ceil
            )
        } else if (sector.slopeCeil)
            this.castToSlope(sector.slopeCeil)
    },

    castToSlope(slope) {
        this.hitFlat.update(
            Segment_Triangle(this.ray, slope.triangle1),
            slope
        )
        this.hitFlat.update(
            Segment_Triangle(this.ray, slope.triangle2),
            slope
        )

        for (const s of slope.segments)
            if (s.type.isInFront(this.light.x, this.light.y)) {
                // Sumamos 1e-4 a t debido a que los Sidewalls están sobre los Portals,
                // sino realizamos este defasaje, el rayo no los va a ver
                this.hitFlat.update(
                    Segment_Triangle(this.ray, s.triangle1) + 1e-4,
                    s
                )

                this.hitFlat.update(
                    Segment_Triangle(this.ray, s.triangle2) + 1e-4,
                    s
                )
            }
    }
}
```

### Baking - Implementación

El proceso de Baking debe llamar al Raytracer por cada Texel a evaluar. Para comprender el algoritmo, primero analizaremos cómo "hornear" una Solid Wall. El resto de las funciones son en general bastante similares.

```javascript
const Bakery = {
    . . .
    bakeSolid(segment, lightmap, z0, dirz) {
        const du = 1 / (lightmap.w-2),
            dv = 1 / (lightmap.h-2)
            
        const lights = this.lights.filter(light => segment.type.isInFront(light.x, light.y))
        if (!lights.length) return

        for (let u = 1; u < lightmap.w-1; u++) {
            Raytracer.setX(segment.type.x0 + (u - .5) * du * segment.type.dirx)
            Raytracer.setY(segment.type.y0 + (u - .5) * du * segment.type.diry)
            
            for (let v = 1; v < lightmap.h-1; v++) {
                Raytracer.setZ(z0 + (v - .5) * dv * dirz)

                lightmap.data[u * lightmap.h + v] += Raytracer.lightInObjective(lights, segment)
            }
        }

        this.fillBorderPixels(lightmap)
    }
}
```

Esta función itera sobre cada texel visible, dejando de lado los de borde. Recordando la definción del centro de píxel nosotros debemos empezar en la mitad del mismo, y teniendo en cuenta que U y V empiezan desde `1`, le debemos restar `0.5` a U y V, para que la parametrización sea correcta. El eje U coincide con la dirección del Segment, mientras que el eje V comienza desde el techo del Sector y desciende `dirz = -(ceil - floor) = floor - ceil`. Una vez calculadas las coordenadas espaciales del Texel (x1,y1,z1) se las transferimos al Raytracer para que actualice el Rayo, el cual está representado como un segmento parametrizado. Luego evaluamos la cantidad de luz que incide sobre el Texel, teniendo en cuenta todas las luces que estén por enfrente del Segment y lo pintamos en el Lightmap.

Como al borde de los lightmaps no lo tenemos en cuenta durante el Baking, su valor es inválido. Para garantizar que su valor sea consistente copiamos el del vecino más próximo. La función que se encarga de este proceso se llama `fillBorderPixels` y la invocamos al finalizar cada Baking.

```javascript
const Bakery = {
    . . .
    fillBorderPixels(lightmap) {
        const {data, w, h} = lightmap
        // Márgenes horizontales
        for (let i = 0; i < w; i++) {
            data[i * h] = data[i * h + 1]
            data[(i+1) * h - 1] = data[(i+1) * h - 2]
        }
        // Márgenes laterales
        for (let i = 0; i < h; i++) {
            data[i] = data[i + h]
            data[(w - 1) * h + i] = data[(w - 2) * h + i]
        }
        // Esquina superior izquierda
        data[0] = data[h + 1]
        // Esquina inferior izquierda
        data[h - 1] = data[2 * h - 2]
        // Esquina superior derecha
        data[w * (h - 1) + 1] = data[w * (h - 2) + 2]
        // Esquina inferior derecha
        data[w * h - 1] = data[w * (h - 1) - 1]
    }
}
```

La función `bakeSolid` también se puede aprovechar para los Steps de un Portal. Unicamente, debemos cambiar la posición `z` desde la que comienza, y su dirección:

```javascript
// Step UP
if (wall.next.floor.z > floor)
    this.bakeSolid(segment, wall.lowerLightmap, wall.next.floor.z, floor - wall.next.floor.z)

// Step DOWN
if (wall.next.ceiling.z < ceil)
    this.bakeSolid(segment, wall.upperLightmap, wall.next.ceiling.z, wall.next.ceiling.z - ceil)
```

Para los Stacks, calculamos el Z y la dirección en Z y aplicamos `bakeSolid` a cada una de las subwalls.

Los Flats calculan la posición U y V globalmente, multiplicando por el tamaño de Texel del Lightmap: `Lightmap.LIGHTMAP_SIZE`.

Por último, los Slopes primero calculan para cada Sidewall, aplicando `bakeSolid` y luego hace el Bake sobre el Slope. Para el cálculo de U y V, hace uso de los lados `U = p1 - p0` y `V = p2 - p0`, definidos por su primer triángulo `Slope.triangle1`.

Completamos entonces el cuerpo de Bakery:

```javascript
const Bakery = {
    . . .
    bakeSectors(sectorsMap) {
        for (const sector of Object.values(sectorsMap)) {
            const floor = sector.sector.floor.z,
                  ceil  = sector.sector.ceiling.z

            for (const segment of sector.segments) {
                const wall = segment.segment.wall

                if (wall.isPortal) {
                    // Step UP
                    if (wall.next.floor.z > floor)
                        this.bakeSolid(
                            segment,
                            wall.lowerLightmap,
                            wall.next.floor.z,
                            floor - wall.next.floor.z
                        )

                    // Step DOWN
                    if (wall.next.ceiling.z < ceil)
                        this.bakeSolid(
                            segment,
                            wall.upperLightmap,
                            wall.next.ceiling.z,
                            wall.next.ceiling.z - ceil
                        )

                } else if (wall.isStack)
                    this.bakeStack(segment, wall, floor, ceil)
                else
                    this.bakeSolid(segment, wall.lightmap, ceil, floor - ceil)
            }

            if (sector.slopeFloor)
                this.bakeSlope(sector.slopeFloor, true)
            else if (!sector.floor.next && !sector.floor.flat.parallax)
                this.bakeFlat(sector.floor, true)

            if (sector.slopeCeil)
                this.bakeSlope(sector.slopeCeil, false)
            else if (!sector.ceil.next && !sector.ceil.flat.parallax)
                this.bakeFlat(sector.ceil, false)
        }
    },

    . . .

    bakeStack(segment, stack, floor, ceil) {
        let z = 0
        for (const wall of stack.walls) {
            if (wall.isPortal) {
                // Step UP
                if (wall.next.floor.z > floor + z) {
                    this.bakeSolid(
                        segment,
                        wall.lowerLightmap,
                        wall.next.floor.z,
                        wall.next.floor.z - floor + z
                    )
                }
                // Step DOWN
                if (wall.next.ceiling.z < (floor + wall.z || ceil)) {
                    this.bakeSolid(
                        segment,
                        wall.upperLightmap,
                        wall.next.ceiling.z,
                        wall.next.ceiling.z - (floor + wall.z || ceil)
                    )
                }
            } else {
                this.bakeSolid(segment, wall.lightmap, ceil, floor - ceil)
            }
            z = wall.z
        }
    },
    
    bakeFlat(flat, isFloor) {
        const lightmap = flat.flat.lightmap
        Raytracer.setZ(flat.flat.z)

        const lights = this.lights.filter(light => isFloor ? (light.z >= flat.flat.z) : (light.z <= flat.flat.z))
        if (!lights.length) return

        for (let u = 1; u < lightmap.w-1; u++) {
            Raytracer.setX(lightmap.origin.u + (u-.5) * Lightmap.LIGHTMAP_SIZE)

            for (let v = 1; v < lightmap.h-1; v++) {
                Raytracer.setY(lightmap.origin.v + (v-.5) * Lightmap.LIGHTMAP_SIZE)

                lightmap.data[u * lightmap.h + v] += Raytracer.lightInObjective(lights, flat)
            }
        }

        this.fillBorderPixels(lightmap)
    },

    bakeSlope(slope, isFloor) {
        // Sidewalls
        for (const segment of slope.segments) {
            const max = Math.max(segment.segment.p0.z, segment.segment.p1.z)
            this.bakeSolid(
                segment,
                segment.segment.lightmap,
                isFloor ? slope.slope.sector.floor.z : slope.slope.sector.ceiling.z,
                isFloor ? max : -max
            )
        }

        // Slopes
        const lightmap = slope.slope.lightmap,
            T = slope.triangle1

        const du = 1 / (lightmap.w-2),
            dv = 1 / (lightmap.h-2)
            
        const lights = this.lights.filter(light => T.isInFront(light.x, light.y, light.z))
        if (!lights.length) return

        for (let u = 1; u < lightmap.w-1; u++) {
            const u0 = (u - .5) * du
            for (let v = 1; v < lightmap.h-1; v++) {
                const v0 = (v - .5) * dv

                Raytracer.setTarget(
                    T.x0 + u0 * T.ux + v0 * T.vx,
                    T.y0 + u0 * T.uy + v0 * T.vy,
                    T.z0 + u0 * T.uz + v0 * T.vz
                )

                lightmap.data[u * lightmap.h + v] += Raytracer.lightInObjective(lights, slope)
            }
        }
        this.fillBorderPixels(lightmap)
    },
    . . .
```

## Renderización

Si pretendemos renderizar el lightmap como hacíamos con la textura vamos a visualizar un patrón cuadrado poco atractivo y para nada realista. La solución consiste en aplicar un filtro al mismo en el momento de renderizarlo, que consiste en calcular la información a nivel de subpíxel interpolando entre los valores más próximos. Existen varias técnicas de interpolación para imágenes, la más sencilla y la que aplicaremos en este capítulo es: **Bilinear Interpolation**.

La siguiente figura muestra cómo funciona la interpolación:

![Bilinear Interpolation](/img/bilinear_interpolation.png)

Supongamos que nosotros queremos saber qué valor corresponde en el punto P cuyas coordenadas son U y V reales. Q11, Q12, Q21 y Q22 representan los valores en el centro del Texel de los vecinos más cercanos. Para acceder a las coordenadas de estos valores aplicamos la función `floor` en U y V. De esta forma:

```
U1 = floor(U)   U2 = U1 + 1
V1 = floor(V)
P = R1 + (V - v1) * (R2 - R1)
R1 = Q11 * (U2 - U) + Q21 * (U - U1)
R2 = Q12 * (U2 - U) + Q22 * (U - U1)
```

Simplificando:

```
P = Q11 + (U - U1) * (Q21 - Q11) + (V - V1) * (Q12 - Q11 + (U - U1) * (Q22 - Q12 - Q21 + Q11))
```

Con esta ecuación, P tiene un valor entre 0 y 255. Si queremos graficar el lightmap, debemos aplicar P en las componentes RGB del píxel.

Para empezar, modificamos la función `draw` en `Wall` para visualizar el Lightmap:

```javascript
const Wall = () => ({
    clipping() {
        . . .
        this.lightmap.u0 = .5 + this.segment.p0.l * (this.lightmap.w-2)
        this.lightmap.u1 = .5 + this.segment.p1.l * (this.lightmap.w-2)
    },

    draw(viewport) {
        const s = this.segment,
            lightmap = this.lightmap;

        const dx = (viewport.x - s.p0.col) / (s.p1.col - s.p0.col)
        
        // Cálculo U
        const depth  = s.p0.depth  + (s.p1.depth  - s.p0.depth)  * dx
        const uinv = lightmap.u0 * s.p0.depth + (lightmap.u1 * s.p1.depth - lightmap.u0 * s.p0.depth) * dx
        const u = uinv / depth
        const i0 = (~~u) * lightmap.h

        // Cálculo V
        const top    = s.p0.top    + (s.p1.top    - s.p0.top)    * dx
        const bottom = s.p0.bottom + (s.p1.bottom - s.p0.bottom) * dx
        const dv = (lightmap.h-2) / (bottom - top)

        const b = Math.min(bottom, viewport.bottom) * 4
        let y = Math.max(~~top, viewport.top)

        if (b < 0 || y > Renderer.height) return

        let v = (y - top) * dv + .5

        for (y *= 4; y < b; y+=4, v+=dv) {
            const gv = ~~v
            const Q11 = lightmap.data[i0 + gv],
                Q12 = lightmap.data[i0 + gv + 1],
                Q21 = lightmap.data[i0 + lightmap.h + gv],
                Q22 = lightmap.data[i0 + lightmap.h + gv + 1]

            Renderer.column[y]   =
            Renderer.column[y+1] =
            Renderer.column[y+2] = Q11 + (u - ~~u) * (Q21 - Q11) + (v - gv) * (Q12 - Q11 + (u - ~~u) * (Q22 - Q12 - Q21 + Q11))
        }
    }
})
```

Notar que para que el mapeo sea correcto, debemos especificar las coordenadas u0 y v0 del lightmap en la función `clipping`.

Si queremos aplicar la Textura de la wall (diffuse) junto con el Lightmap, debemos fusionar las funciones.

```javascript
const Wall = () => ({
    . . .
    draw(viewport) {
        const s = this.segment,
            lightmap = this.lightmap,
            texture = this.texture

        const dx = (viewport.x - s.p0.col) / (s.p1.col - s.p0.col)
        
        // Cálculo U
        const depth  = s.p0.depth  + (s.p1.depth  - s.p0.depth)  * dx
        const uinv = texture.u0 * s.p0.depth + (texture.u1 * s.p1.depth - texture.u0 * s.p0.depth) * dx
        const i0 = ((uinv / depth) & (texture.w - 1)) * texture.h
        const ulinv = lightmap.u0 * s.p0.depth + (lightmap.u1 * s.p1.depth - lightmap.u0 * s.p0.depth) * dx
        const ul = ulinv / depth
        const i0l = (~~ul) * lightmap.h

        // Cálculo V
        const top    = s.p0.top    + (s.p1.top    - s.p0.top)    * dx
        const bottom = s.p0.bottom + (s.p1.bottom - s.p0.bottom) * dx
        const dv = s.height * texture.h / ((bottom - top) * texture.scaleV)
        const dvl = (lightmap.h-2) / (bottom - top)

        const b = Math.min(bottom, viewport.bottom) * 4
        let y = Math.max(~~top, viewport.top)

        if (b < 0 || y > Renderer.height) return

        let v = texture.offV + (y - top) * dv,
            vl = (y - top) * dvl + .5

        for (y *= 4; y < b; y+=4, v+=dv, vl+=dvl) {
            const i = (i0 + (v & (texture.h - 1))) << 2
            const gv = ~~vl
            const Q11 = lightmap.data[i0l + gv],
                Q12 = lightmap.data[i0l + gv + 1],
                Q21 = lightmap.data[i0l + lightmap.h + gv],
                Q22 = lightmap.data[i0l + lightmap.h + gv + 1]

            const l = Math.min((Q11 + (ul - ~~ul) * (Q21 - Q11) + (vl - gv) * (Q12 - Q11 + (ul - ~~ul) * (Q22 - Q12 - Q21 + Q11))) / 255 + this.segment.sector.light, 1)

            Renderer.column[y]   = texture.data[i] * l
            Renderer.column[y+1] = texture.data[i+1] * l
            Renderer.column[y+2] = texture.data[i+2] * l
        }
    }
})
```

Las demás estructuras (excepto los Slopes) realizan exactamente la misma operación y carece de sentido mostrarlas en este capítulo. Los archivos modificados son: [Wall.js](/src/walls/Wall.js), [Portal.js](/src/walls/Portal.js), [Flat.js](/src/flats/Flat.js), [Floor.js](/src/flats/Floor.js), [Ceiling.js](/src/flats/Ceiling.js)

### Slopes

Agregar la renderización de Lightmaps a los Slopes fue un desafío, así que vamos por partes.

Recordando los mapeos que hacíamos para los Slopes con el BufferPool, agregamos las coordenadas en el Upper Bound y en el Lower Bound. Para el Lightmap de las Sidewalls, creamos un nuevo buffer, `lightmap`:

```javascript
const BufferPool = {
    length: 0,

    init() {
        this.buffers = new Array(32).fill(0).map(_ => ({
            . . .
            upper: {
                . . .
                // Lightmap
                ulinv: new Float64Array(Renderer.width),
                vlinv: new Float64Array(Renderer.width)
            },

            lower: {
                . . .
                // Lightmap
                ulinv: new Float64Array(Renderer.width),
                vlinv: new Float64Array(Renderer.width)
            },

            lightmap: {
                u: new Float64Array(Renderer.width),

                // Contiene puntero al lightmap correspondiente en cada columna
                map: new Array(Renderer.width).fill(null)
            },

            segment: Segment(0,0,0,0)
        }))
    },
    . . .
}
```

Cada punto de cada segmento que rodea el Slope tiene las coordenadas U y V de la textura Diffuse. Adicionalmente, ahora necesitamos las coordenadas U y V del Lightmap. Modificamos la función `addLightmapToSlope` en `Lightmap.js`:

```javascript
const Lightmap = {
    . . . 
    addLightmapToSlope(slope, isSlopeFloor, z0) {
        . . .
        const height = Math.ceil(Math.sqrt(dx * dx + dy * dy + dz * dz) / this.LIGHTMAP_SIZE) + 2

        const u0 = .5, u1 = width-2 + .5,
            v0 = .5, v1 = height-2 + .5

        S0.p0.ul = u0
        S0.p0.vl = v0
        S0.p1.ul = u1
        S0.p1.vl = v0

        S1.p0.ul = u1
        S1.p0.vl = v0
        S1.p1.ul = u1
        S1.p1.vl = v1

        S2.p0.ul = u1
        S2.p0.vl = v1
        S2.p1.ul = u0
        S2.p1.vl = v1

        S3.p0.ul = u0
        S3.p0.vl = v1
        S3.p1.ul = u0
        S3.p1.vl = v0

        slope.lightmap = this.newLightmap(width, height)
        slope.lightmap.size = 1 / this.LIGHTMAP_SIZE
    },
    . . .
}
```

Dividimos el problema en tres partes **UV Mapping**, **Lightmap Map** y **Render**

#### UV Mapping

Así como mapeamos las coordenadas en los puntos aplicando clipping, debemos hacer lo mismo para el Lightmap del Slope y los del Sidewall:

```javascript
const Slope = {
    . . .
    projectSegment(s) {
        if (s.p0.col <= s.p1.col) {
            . . .
        } else {
            . . .
            // Sidewall Lightmap
            s.p0.usl = .5 + (1 - s.p0.l) * (s.lightmap.w-2)
            s.p1.usl = .5 + (1 - s.p1.l) * (s.lightmap.w-2)
        }
        . . .
        // Slope Lightmap
        s.p0.ul0 = s.p0.ul + s.p0.l * (s.p1.ul - s.p0.ul)
        s.p0.vl0 = s.p0.vl + s.p0.l * (s.p1.vl - s.p0.vl)
        s.p1.ul0 = s.p0.ul + s.p1.l * (s.p1.ul - s.p0.ul)
        s.p1.vl0 = s.p0.vl + s.p1.l * (s.p1.vl - s.p0.vl)
    }
    . . .
}
```

Luego podemos completar los buffers empleando esta información:

```javascript
const Slope = {
    . . .
    fillBuffer(segment, buffer) {
        . . .
        const dulinv = (p1.ul0 * p1.depth - p0.ul0 * p0.depth) * dx,
              dvlinv = (p1.vl0 * p1.depth - p0.vl0 * p0.depth) * dx

        let ulinv = (from - p0.col) * dulinv + p0.ul0 * p0.depth,
            vlinv = (from - p0.col) * dvlinv + p0.vl0 * p0.depth

        for (let c = from; c <= to; c++) {
            . . .
            buffer.ulinv[c] = ulinv
            buffer.vlinv[c] = vlinv
            ulinv += dulinv
            vlinv += dvlinv
        }
    },

    fillSide(segment, side, lightmap) {
        . . .
        const . . .
             dul = (p1.usl * p1.depth - p0.usl * p0.depth) * dx,
              dz = (p1.z0 * p1.depth - p0.z0 * p0.depth) * dx
        . . .
        let . . .
            ul = (from - p0.col) * dul + p0.usl * p0.depth,
            z = (from - p0.col) * dz + p0.z0 * p0.depth

        for (let c = from; c <= to; c++, d+=dd, u+=du, z+=dz, ul+=dul) {
            lightmap.u[c] = ul / d
            . . .
        }
    },
    . . .
}
```

#### Lightmap Map

Al momento de dibujar un Sidewall, perdemos la noción de qué segment se está renderizando lo cual nos ocasiona que sea imposible saber qué lightmap es el correcto. La solución es guardar qué lightmap corresponde a cada columna, información que la almacenamos en el BufferPool dentro de `lightmap`. Lo que nos queda es llenar este buffer.

Partimos de una lista dinámica de los lightmaps de los segments del sidewall visible en el Fore.

```javascript
const SlopeFloor/SlopeCeil = {
    . . .
    lightmapList: [],
    . . .
}
```

Cuando proyectamos los Segments y escogemos los candidatos del Fore, agregamos el lightmap del Segment a esta lista:

```javascript
const Slope = {
    . . .
    projectSegment(s) {
        if (s.p0.col <= s.p1.col) {
            . . .
        } else {
            . . .
            this.lightmapList.push(s.lightmap)
        }
        . . .
    },
    . . .
}
```

Quedaría recuperar el lightmap en la función `fillSide`, pero el segment que empleamos ahí es del Buffer Pool y desconoce esta información. Entonces, primero debemos enlazarlos:

```javascript
const SlopeFloor/SlopeCeil = {
    . . .
    projectFore() {
        const segment = this.buffers.segment

        for (let i = 0, len = this.fore.length; i < len; i++) {
            . . .
            segment.lightmap = this.lightmapList[Math.floor(i / 2)]
            . . .
            this.fillSide(segment, this.buffers.side, this.buffers.lightmap)
        }
    },
    . . .
}
```

De esta forma podemos completar `fillSide` con la información completa del Lightmap:

```javascript
const Slope = {
    . . .
    fillSide(segment, side, lightmap) {
        . . .
        for (let c = from; c <= to; c++, d+=dd, u+=du, z+=dz, ul+=dul) {
            lightmap.u[c] = ul / d
            lightmap.map[c] = segment.lightmap
            . . .
        }
    },
    . . .
}
```

#### Render

Por último, el renderizado consiste en duplicar las variables para considerar el Lightmap, tanto en el Slope como en las Sidewalls:

```javascript
const Slope = {
    . . .
    drawWithLight(viewport) {
        const x = viewport.x,
              top = this.buffers.upper.y[x]

        const dyinv = 1 / (this.buffers.lower.y[x] - top)

        const zinv = this.buffers.upper.zinv[x],
              uinv = this.buffers.upper.uinv[x],
              vinv = this.buffers.upper.vinv[x],
              ulinv = this.buffers.upper.ulinv[x],
              vlinv = this.buffers.upper.vlinv[x]

        const deltaZinv = (this.buffers.lower.zinv[x] - zinv) * dyinv,
              deltaUinv = (this.buffers.lower.uinv[x] - uinv) * dyinv,
              deltaVinv = (this.buffers.lower.vinv[x] - vinv) * dyinv,
              deltaUlinv = (this.buffers.lower.ulinv[x] - ulinv) * dyinv,
              deltaVlinv = (this.buffers.lower.vlinv[x] - vlinv) * dyinv

        const texture = this.texture,
            lightmap = this.lightmap

        for (let y = Math.max(viewport.top, ~~top), b = Math.min(viewport.bottom, this.buffers.lower.y[x]); y <= b; y++) {
            const z = 1 / (zinv + deltaZinv * (y - top))
            const u = z * (uinv + deltaUinv * (y - top))
            const v = z * (vinv + deltaVinv * (y - top))
            const ul = z * (ulinv + deltaUlinv * (y - top))
            const vl = z * (vlinv + deltaVlinv * (y - top))
            const Y = y << 2
            const tindex = (texture.h * (u & (texture.w - 1)) + (v & (texture.h - 1))) << 2

            const i0l = (~~ul) * lightmap.h
            const gv = ~~vl
            const Q11 = lightmap.data[i0l + gv],
                Q12 = lightmap.data[i0l + gv + 1],
                Q21 = lightmap.data[i0l + lightmap.h + gv],
                Q22 = lightmap.data[i0l + lightmap.h + gv + 1]
            const l = Math.min((Q11 + (ul - ~~ul) * (Q21 - Q11) + (vl - gv) * (Q12 - Q11 + (ul - ~~ul) * (Q22 - Q12 - Q21 + Q11))) / 255, 1)

            Renderer.column[Y]   = texture.data[tindex] * l
            Renderer.column[Y+1] = texture.data[tindex + 1] * l
            Renderer.column[Y+2] = texture.data[tindex + 2] * l
        }
    },

    drawSideWithLight(top, bottom, v0, v1, vl0, vl1, viewport) {
        const lightmap = this.buffers.lightmap.map[viewport.x],
            texture = this.sidewall
        if (!lightmap) return
        const ul = this.buffers.lightmap.u[viewport.x]
        const u = this.buffers.side.u[viewport.x]
        const deltaV = (v1 - v0) / (bottom - top)
        const deltaVl = (vl1-vl0) / (bottom - top)

        for (let y = Math.max(viewport.top, ~~top), b = Math.min(viewport.bottom, bottom); y <= b; y++) {
            const v = v0 + deltaV * (y - top)
            const vl = vl0 + deltaVl * (y - top) - .5
            const Y = y << 2
            const tindex = (texture.h * u + (v & (texture.h - 1))) << 2

            const i0 = (~~ul) * lightmap.h
            const gv = ~~vl
            const Q11 = lightmap.data[i0 + gv],
                Q12 = lightmap.data[i0 + gv + 1],
                Q21 = lightmap.data[i0 + lightmap.h + gv],
                Q22 = lightmap.data[i0 + lightmap.h + gv + 1]
            const l = Math.min((Q11 + (ul - ~~ul) * (Q21 - Q11) + (vl - gv) * (Q12 - Q11 + (ul - ~~ul) * (Q22 - Q12 - Q21 + Q11))) / 255, 1)

            Renderer.column[Y]   = texture.data[tindex] * l
            Renderer.column[Y+1] = texture.data[tindex+1] * l
            Renderer.column[Y+2] = texture.data[tindex+2] * l
        }
    }
}
```

Por último, al dibujar el Sidewall, debemos conocer los valores límites de V para calcular el delta V. Estos deben brindarse tanto para el Diffuse (v0 v1) como para el lightmap (vl0 vl1).

Actualizamos:

```javascript
const SlopeFloor = () => ({
    . . .
    draw(viewport) {
        const top = this.buffers.upper.y[viewport.x],
            bottom = this.buffers.lower.y[viewport.x]

        // Slope
        if (top <= bottom)
            this.drawWithLight(viewport)
        
        // Sidewall
        if (bottom < viewport.bottom) {
            const z = this.buffers.side.z[viewport.x]
            const v0 =  this.isRelative ? 0 :  z * this.sidewall.h,
                  v1 = !this.isRelative ? 0 : -z * this.sidewall.h
            this.drawSideWithLight(bottom, this.buffers.side.y[viewport.x], v0, v1, z * this.lightmap.size, 0, viewport)
        }
        viewport.bottom = Math.min(viewport.bottom, Math.min(top, bottom))
    },
    . . .
})

const SlopeCeil = () => ({
    . . .
    draw(viewport) {
        const top = this.buffers.upper.y[viewport.x],
            bottom = this.buffers.lower.y[viewport.x]

        // Slope
        if (top <= bottom)
            this.drawWithLight(viewport)

        // Sidewall
        if (~~top > viewport.top) {
            const z = this.buffers.side.z[viewport.x]
            const v0 = !this.isRelative ? 0 :  z * this.sidewall.h,
                  v1 =  this.isRelative ? 0 : -z * this.sidewall.h
            this.drawSideWithLight(this.buffers.side.y[viewport.x], top, v0, v1, 0, z * this.lightmap.size, viewport)
        }
        viewport.top = ~~Math.max(viewport.top, Math.max(0, top + 1, bottom + 1))
    },
    . . .
})
```

## Global Illumination

Un efecto interesante que se puede agregar al efecto de luz es la **Iluminación Global**. Este efecto simula los reflejos de la luz sobre las superficies que rebotan e iluminan de informa *indirecta* a los objetos. La implementación más básica es establecer un piso a la luz de las superficies para que no sea 0 (negro absoluto), sino que tenga un poco de claridad. Este valor se puede establecer globalmente, pero una mejor implementación consiste en hacerlo por Sector.

Ahora todo Sector va a tener una propiedad `light` con valor de 0 a 1 que indica la intensidad de luz en el mismo sin fuentes de luz. Para tenerla en cuenta en la renderización, simplemente la sumamos a la luz calculada en el filtro Bilineal:

```javascript
const l = Math.min((Q11 + (ul - ~~ul) * (Q21 - Q11) + (vl - gv) * (Q12 - Q11 + (ul - ~~ul) * (Q22 - Q12 - Q21 + Q11))) / 255 + this.segment.sector.light, 1)
```

Para completar la solución, queda habilitar la lectura en el Parser para que se pueda indicar en el archivo de diseño:

```javascript
const Parser = {
    . . .
    parseSector(name, info) {
        . . .
        sector.ceiling = this.parseCeiling(info.ceiling)
        sector.light = info.light || 0
    }
    . . .
}
```

## Conclusión

Luego del largo recorrido, el resultado obtenido es el siguiente:

![Captua 1](/img/captura1.png)

![Captua 2](/img/captura2.png)

![Captua 3](/img/captura3.png)

Si se reduce el tamaño de Texel del Lightmap, se mejora la definición de las sombras, a costa de: mayor consumo de memoria y mayor tiempo de Baking. Afortunadamente, no causa un detrimento en la performance en tiempo de ejecución.

Otra alternativa al Baking, es realizarlo con otro programa e ingresarlo a este por medio de un archivo, de forma similar a cómo cargamos las texturas.

El lightmap presentado en este capítulo solo es un indicador de cantidad de luz. De forma muy similar se puede expandir el efecto para permitir luces de distintos colores.

Existen diversos efectos visuales que se pueden seguir aplicando al Graphics Engine, como el Post-Processing. De ser agregados, expandiré esta serie de tutoriales. Por ahora, cierro el Módulo de Graphics Engine, para dedicarme a abarcar las siguientes etapas. Espero que haya sido gratifiante el viaje hasta acá y lo hayan disfrutado tanto como a mí escribirlo.