# **Capítulo 13**. Animation System
> *Código fuente*: [Source](./src)

En todo videojuego la acción suele centrarse en personajes. Estos deben moverse para darle vida a la escena. En nuestro Engine, los representamos con Sprites, al igual que en los 2D Engines. Para brindarles un movimiento natural a los personajes requerimos de un **Sistema de Animación** que modifique la textura del Sprite para reproducir una animación. A esta animación se la conoce como *Sprite Animation* donde la ilusión de movimiento se consigue mostrando una secuencia de imágenes estáticas llamadas **frames**. Estas se agrupan en una estructura de datos llamada **Clip** donde también se indica la cantidad de tiempo que dura cada frame.

## Definición

En `things` configuramos los clips para cada Thing al que se quiera animar.

```javascript
ResourceManager.loadThings(
   . . .
    {
        name: "soldier",
        clip: "idle",
        clips: {
            idle: {
                frames: ["idle"],
                directional: true
            },
            die: {
                frames: ["diea", "dieb", "diec", "died"],
                directional: false
            },
            shoot: {
                frames: ["shoota", "shootb", "shootc"],
                times: [1, 2, 1],
                directional: false
            },
            walk: {
                frames: ["walka", "walkb", "walkc", "walkd"],
                directional: true
            }
        }
    },

    . . .
)
```

Por cada clip vamos a tener un arreglo `frames` que indican el nombre de la textura a mostrarse. Siguiendo la convención del Doom en el nomenclatura de las texturas, primero va la familia "walk", luego el frame enumerados alfabéticamente con letras "a"/"b"/"c"/"d" y luego el número de rotación (si es direccional) "1"/"2"/..."8".

Luego podemos indicar la duración relativa de cada frame en particular, mediante la propiedad `times`. Podemos ver que el frame "shootb" se va mostrar el doble de tiempo que el frame "shoota". Por defecto, todos los frames tienen la misma duración.

Por último podemos indicar si el Clip es direccional.

Se puede indicar con qué clip inician los things que instancien la clase mediante la propiedad `clip`. Por defecto, selecciona el primer clip definido.

## Cargando Clips

Partimos del ResourceManager. En nuestra función `loadThings` procesamos los Clips de la definición. En particular, normalizamos el arreglo de times de forma acumulativa. Cada valor de times va a indicar en qué tiempo es necesario pasar del frame actual al siguiente, con el tiempo normalizado: 0 al inicio del clip, 1 el final:
```javascript
const ResourceManager = {
    . . .
    loadThings(...things) {
        for (const thing of things) {
            this.things[thing.name] = thing

            if (thing.clips) {
                for (const clip of Object.values(thing.clips)) {
                    clip.times = clip.times || clip.frames.map(() => 1)
                    const sum = clip.times.reduce((acc,x) => acc + x, 0)
                    for (let i = 0, acc = 0; i < clip.times.length; i++) {
                        acc += clip.times[i] / sum
                        clip.times[i] = acc
                    }
                }
            }
        }
        Linker.linkThings(this.things)
    }
}
```

Siguiendo con el llamado a función, debemos actualizar el Linker. Si existen clips para el thing, debemos cargar la referencia para el clip del thing y de la primera textura. Si es direccional, necesitamos la referencia al arreglo de texturas del primer frame. Adicionalmente, para cada frame de cada clip debemos solicitar la textura al TextureLoader. Una vez la tenemos, reemplazamos en el arreglo:
```javascript
const Linker = {
    . . .
    linkThings(things) {
        for (const name in things) {
            const thing = things[name]
            if (thing.clips) {
                thing.clip = thing.clips[thing.clip || Object.keys(thing.clips)[0]]
                thing.texture = thing.clip.directional ? thing.clip.frames[0] : thing.clip.frames[0]

                // Cargar la textura de cada frame de cada clip
                for (const clip of Object.values(thing.clips)) {
                    if (clip.directional) {
                        clip.frames = clip.frames.map(name => {
                            const textures = new Array(8)
                            for (let i = 0; i < 8; i++)
                                TextureLoader.getTextureWithFirst(name + (i+1), texture => {
                                    textures[i] = texture
                                })
                            return textures
                        })
                    } else {
                        for (let i = 0; i < clip.frames.length; i++)
                            TextureLoader.getTextureWithFirst(clip.frames[i], texture => {
                                clip.frames[i] = texture
                            })
                    }
                }
                
                if (thing.clip.directional) {
                    thing.textures = thing.clip.frames[0]
                    thing.directional = true
                } 
            } else {
                if (thing.directional) {
                    thing.textures = new Array(8)
                    for (let i = 0; i < 8; i++)
                        TextureLoader.getTextureWithFirst(thing.texture + (i+1), texture => {
                            thing.textures[i] = texture
                        })
                }
            }
        }
    },
    . . .
}
```

## Animation Manager

Una vez definidos y cargados los clips requerimos una forma de reproducirlos en una Thing en particular. Creamos entonces un nuevo objeto `Animation` y un administrador que controle varias animaciones que se están reproduciendo en el momento, `AnimationManager`.

```javascript
const AnimationManager = {

    // Enumerativos para configurar la animación
    // Indican qué bit se tiene que setear en los flags de opciones
    LOOP: 1,
    PING_PONG: 2,
    REVERSER: 4,

    animations: new Array(128).fill(0).map(Animation), // Puede manejar hasta 128 animaciones simultáneas
    length: 0, // Cantidad de animaciones activas

    time: 0, // Tiempo global

    update(deltaTime) {
        this.time += deltaTime
        for (let i = 0; i < this.length; i++) {
            const animation = this.animations[i]
            animation.map(this.time)

            // Si la animación ya no está en reproducción, la elimino
            if (!animation.isPlaying) {
                const tmp = this.animations[--this.length]
                this.animations[this.length] = animation
                this.animations[i] = tmp
                i-- // Repetir esta posición
            }
        }
    },

    // Reproduce en "thing" el "clip" con duración "T" segundos, con el flag de "options"
    play(clip, thing, T, options = 0) {
        const animation = this.animations[this.length++]
        animation.play(clip, thing, T, options)
        return animation
    },
}
```

```javascript
const Animation = () => ({
    duration: 0,        // Duración de la animación en segundos
    invDuration: 0,     // Inversa de la duración
    startTime: 0,       // Tiempo global en el que se inició
    clip: null,         // Clip que se está reproduciendo
    thing: null,        // Thing al cual se le aplica el Clip
    frame: 0,           // Frame actual del clip
    isPlaying: false,   // Si se encuentra en reproducción

    play(clip, thing, T, options) {
        this.clip = clip
        this.thing = thing
        this.duration = T
        this.invDuration = 1/T
        this.options = options
        this.frame = 0
        this.startTime = AnimationManager.time
        this.isPlaying = true

        this.applyFrame()
    },

    applyFrame() {
        if (this.clip.directional) {
            this.thing.textures = this.clip.frames[this.frame]
        } else {
            this.thing.texture = this.clip.frames[this.frame]
        }
    },

    // Mapea del tiempo global "time" al tiempo normalizado "t"
    map(time) {
        const t = (time - this.startTime) * this.invDuration
        if (t > 1) {
            // De esta forma se verifica si un flag está seteado en las opciones
            if (this.options & AnimationManager.LOOP) { 
                this.frame = 0
                this.startTime += this.duration
                this.applyFrame()
            } else {
                this.isPlaying = false
            }
        } else if (t > this.clip.times[this.frame]) {
            this.frame++
            this.applyFrame()
        }
    },

    stop() {
        this.isPlaying = false
    }
})
```

Luego en main debemos actualizar el AnimationManager para que reproduzca las animaciones.

```javascript

function update(time) {
    const deltaTime = (time - lastTime) * 0.001
    lastTime = time
    FPS.update(1 / deltaTime)

    Player.update(deltaTime)

    Renderer.draw()

    AnimationManager.update(deltaTime)

    requestAnimationFrame(update)
}

```

## Reproducir la animación

Y así podemos activar una animación:

```javascript
var thing = Player.sector.things[0]
var animation = AnimationManager.play(
    ResourceManager.things.soldier.clips.walk,  // Clip walk
    thing,                  // Thing al que se aplica el clip
    1,                      // 1 segundo de duración
    AnimationManager.LOOP   // Repetir en bucle por siempre
)


// Detener luego de aproximadamente 10s
setTimeout(() =>{
    animation.stop()
}, 10000)
```

## Conclusión

Las herramientas presentadas en este capítulo ofrecen una base para animar a los Face Sprites. Estas mismas pueden extenderse a los otros tipos de Thing sin demasiado esfuerzo.

Como ejercicio para el lector queda implementar las demás opciones de reproducción de la animación "PING_PONG" y "REVERSE".

