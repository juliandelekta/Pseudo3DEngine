# **Capítulo 3.** Texturas. Archivos de diseño
> *Código fuente*: [Source](./src) 

En el capítulo anterior logramos dibujar paredes pero de un único color sólido. En muchos casos puede llegar a ser suficiente pero para el engine nos interesa darle una textura con una imagen. Otra limitación existente hasta ahora es que las paredes tienen una posición definida en el código. Realmente resultaría cómodo que exista un archivo de diseño donde se indiquen detalles de interés de un nivel. De esta forma, un diseñador de niveles solo tendría que configurar este archivo sin tener que involucrarse en el código. Otro beneficio de tener archivos de diseño es su portabilidad: el día de mañana el engine puede estar ejecutándose en otra plataforma con otro lenguaje pero el archivo de diseño sigue siendo el mismo.\
En este capítulo introduciremos las *Texturas*, cómo cargarlas y usarlas dentro del engine. También vamos a ver una herramienta que nos permite crear paquetes de texturas. Por último, explicaremos el formato a utilizar en los archivos de diseño.
## Texturas
Uno de los aspectos a tener en cuenta en la renderización por software es el rendimiento. Este parámetro se mejora reduciendo el tiempo de CPU y minimizando el costo de acceso a memoria. Teniendo esto en cuenta nos interesa que los datos que vamos a manipular siempre se encuentren en la caché. Recordando que vamos a dibujar líneas verticales texturizadas, debemos asegurarnos que la columna esté presente en la caché.\
Cuando abrimos una imagen con HTML (.png, .jpg, .bmp) se guardan ordenadas por fila en la memoria. Nosotros necesitamos hacer una transpuesta y guardarlas en columnas.
```
Filas:
---------
0 1 2 3
4 5 6 7  --> 0123456789ABCDEF
8 9 A B
C D E F

Columnas:
--------
0 4 8 C
1 5 9 D  --> 048C159D26AE37BF
2 6 A E
3 7 B F
```
### Herramienta: Image2Texture
Esta [herramienta](./src/Image2Texture.html) permite agregar imágenes y agruparlas en paquetes. Un paquete está conformado por una estructura de datos llamada raw. Un **raw** tiene la información de la textura codificada en base64, un nombre y las dimensiones de la misma. La infomación de los píxeles se encuentra ordenada por columna para su uso dentro del engine.\
De forma resumida, la herramienta obtiene la información de los píxeles de una imagen. Obtiene la transpuesta de la matriz de píxeles a partir del [Data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs) y la guarda en el raw.\
La herramienta permite exportar el paquete como un archivo JS que se puede importar en el engine.
### Cargando las texturas en el Engine
Para cargar las texturas en el engine necesitamos un *loader* que almacene todas las texturas cargadas a partir de estos archivos y facilite el acceso a ellas. `TextureLoader`
```javascript
const TextureLoader = {
    textures: {
        "-": {data: [255, 0, 255, 255], w: 1, h: 1}, // Textura por defecto
    },
    packages: [],
    queues: {}, // Colas de espera para las texturas
    canvas: document.createElement("canvas"),
    loading: 0,
    onReady: () => {console.log("TextureLoader: Ready")},
    textureSet: new Set(["-"]),

    init() {
        this.ctx = this.canvas.getContext("2d", {willReadFrequently: true})
        this.textureSet.add("-")
    },

    load(packageName, json) {
        const raws = JSON.parse(json)
        raws.forEach(r => this.textureSet.add(r.name))
        this.packages.push({name: packageName, raws: JSON.parse(json)})
    },

    makeTextures() {
        for (const pkg of this.packages) {
            for (const raw of pkg.raws)
                this.addTexture(raw)

            console.log("Loaded package: " + pkg.name)
        }
    },

    addTexture(raw) {
        const img = new Image()
        img.src = 'data:image/png;base64,' + raw.data

        img.width  = raw.h
        img.height = raw.w
        this.loading++


        img.onload = () => {
            this.canvas.width  = raw.h
            this.canvas.height = raw.w

            this.ctx.drawImage(img, 0, 0)

            raw.data = this.ctx.getImageData(0, 0, raw.h, raw.w).data

            this.textures[raw.name] = raw

            // Atiende los pedidos
            if (this.queues[raw.name]) {
                for (const call of this.queues[raw.name])
                    call(raw)
                this.queues[raw.name] = null
            }
            this.loading--
            if (!this.loading) this.onReady()
        }

    },

    getTexture(name, asyncCall) {
        if (!this.textureSet.has(name)) console.error("Texture not loaded: " + name)
        if (this.textures[name]) {
            asyncCall(this.textures[name])
        } else {
            const queue = this.queues[name]
            if (queue) {
                queue.push(asyncCall)
            } else {
                this.queues[name] = [asyncCall]
            }
        }
    }

}
```
Ahora en el `index.html` se importa el Loader y el paquete de texturas generado con la herramienta:
```html
<script src="loaders/TextureLoader.js"></script>

<!-- Texture packages -->
<script src="assets/walls.js"></script>
```
En el `main.js` debemos inicializar el TextureLoader.
```javascript
// Iniciamos los Controles
Controls.init()

// Iniciamos los Loaders
TextureLoader.init()
TextureLoader.onReady = () => {
    // Cargamos el nivel
    if(ResourceManager.setLevel("first_level"))
        update(0)
}

window.onload = () => TextureLoader.makeTextures()
. . .
```
Cuando abra la aplicación puede verificar que TextureLoader.textures tiene la información cargada de las texturas.
## Archivo de Diseño
Estos archivos tienen el propósito de presentar información específica del juego de manera legible para los humanos. En su contenido definen los valores de los parámetros de todas las estructuras de datos que sean dependientes del diseño del juego. En ellos, vamos a definir las características del nivel (posición de las paredes, sus texturas, posición inicial del jugador, etc), características de los objetos del juego (enemigos, *pick-ups*, puertas, etc), definición de animaciones, entre otras.\
No existe un único formato para definir estos archivos pero se recomienda que sean legibles por el humano, por ejemplo, JSON, YAML y TOML. En particular, estos formatos poseen *parsers* en JavaScript (nativo y lilbrerías) que tranforman el texto plano en un objeto interno de JS.
Parser de YAML: [JS-YAML](https://github.com/nodeca/js-yaml)
El de TOML está implementado por mí, así que puede estar sujeto a errores.
### Archivo de Nivel
El siguiente código es un ejemplo del contenido de un nivel. Usted puede darle la estructura que más desee. Para el engine emplearemos la siguiente:
```yaml
// YAML Format
ResourceManager.loadYAML(`name: level_name
sectors:
	main:
    	loops:
        	border:
                v: [x0,y0, x1,y1, ... xn,yn]
                walls:
                    - texture: texture
                    - texture: texture
                    . . .
                    - texture: texture
            loop1: ...
            . . .
            loopn: ...
	sector1: ...
    . . .
    sectorn: ...
player:
	sector: main
    x: 0
    y: 0
`)
```
En la sección `sectors` están agrupados cada uno de los sectores del nivel. Cada sector va a estar conformado por `loops` que son polígonos formados por Segments. Un loop está definido por sus vértices: `v` que es una lista de pares **X** **Y**. Se crean un Segment entre cada par de puntos, incluyendo entre el último y el primero, para formar un lazo cerrado. Si hay definidos n puntos, habrá n segments. La información de estos segments está agrupada en la sección `walls`. Cada segment tendrá una componente llamada Wall que contiene información adicional, entre ellas la textura. La textura se indica con el nombre con el que se encuentra en los paquetes de texturas cargados.\
Por último, en la sección `player` se indica el sector inicial del jugador junto con su posición. Tener en cuenta que esta posición debería estar dentro de los límites del sector.\
En la carpeta [levels](https://github.com/juliandelekta/Pseudo3DEngine/tree/main/chapter-03/src/levels) se encuentra la definición del mismo nivel en formatos YAML, TOML y JSON.
El administrador de cargar los niveles es el `ResourceManager`. Permite cargar niveles a partir de los formatos vistos. Luego el engine puede cargar un nivel particular de los cargados. Adicionalmente, se requieren dos tareas adicionales `Parser` y `Linker`.\
El Parser se encargar de tomar el objeto de descripción del nivel y crear los objetos internos necesarios: `Wall`, `Segment`, `Sector`, etc.\
Por otro lado, el Linker se encarga de resolver las referencias entre objetos. Como ejemplo, tenemos que el "player" define en qué sector iniciar referenciándolo por nombre. El linker cambia esta referencia por nombre por una referencia en memoria. Lo mismo ocurre con las texturas.\
Todos estos archivos se encuentran en la carpeta [loaders](https://github.com/juliandelekta/Pseudo3DEngine/tree/main/chapter-03/src/loaders)
## Conclusión
En este capítulo vimos cómo traer información de diseño y datos desde afuera del programa para evitar "hardcodearlos". Note que como estamos trabajando con archivos estáticos es necesario encapsular la información dentro de un archivo `.js`.\
En el siguiente capítulo usaremos estos archivos para dibujar efectivamente una pared con textura.\

A continuación le dejo una lista de términos que es necesario que queden bien definidos para evitar confusiones.
### Términos
**TextureData**: Pixel Data + Dimensión
**Texture**: TextureData + Offset + Scale + (u,v)
**Raw**: name + Base64 Data URL + Dimensión
**Archivo de Texturas**: Nombre del Paquete + Lista de Raw
**TextureLoader**: Carga los archivo de Texturas. Convierte del Raw a TextureData


**Archivo de Nivel**: información en formato YAML, TOML o JSON
**ResourceManager**: carga los niveles junto al Parser y al Linker.
