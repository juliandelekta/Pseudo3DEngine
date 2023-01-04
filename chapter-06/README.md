# **Capítulo 6.** Movimiento en Z. Movimiento vertical de cámara
> *Código fuente*: [Source](./src) 

Este capítulo es menos denso que los demás ya que no involucra demasiada matemática. Es una introducción sencilla al control tipo espectador que se suele ver en videojuegos.

## Movimiento en Z
De manera sencilla, el movimiento en el eje Z implica alterar la componente Z del campo `pos` de la cámara. Este control se realiza dentro de `Controls` y funciona de forma similar a los movimientos anteriores:
```javascript
const Controls = {
    inkey: {
        . . .
        Space: 0, KeyC: 0
    },

    update (deltaTime) {
        const crouchSpeed = deltaTime * 1.5 * (this.inkey.Space - this.inkey.KeyC);

        Camera.pos.z += crouchSpeed
    }
}
```
Ahora en el Engine debería poder moverse hacia arriba con `Espacio` y bajar con `C`.
## Mejor movimiento
Aunque funcionalmente el movimiento está controlado correctamente, existe forma que lo hace sentir más "natural". Este efecto se logra realizando una intepolación lineal entre el valor actual de la posición y el valor deseado con un **t** que dependa del *deltaTime*.\
Primero refactorizaremos el código colocando la lógica de movimiento dentro de un objeto llamado `Player`. En su función `update` colocaremos el movimiento:
```javascript
const Player = {
    pos: v3(0,0,0),

    moveSpeed: 4.5,
    strafeSpeed: 4.5,
    crouchSpeed: 1.5,

    update(deltaTime) {
        const keys = Controls.inkey
        const moveVelocity = deltaTime * this.moveSpeed   * (keys.KeyW - keys.KeyS),
            strafeVelocity = deltaTime * this.strafeSpeed * (keys.KeyD - keys.KeyA),
            crouchVelocity = deltaTime * this.crouchSpeed * (keys.Space - keys.KeyC);

        this.pos.x += Camera.dir.x * moveVelocity - Camera.dir.y * strafeVelocity
        this.pos.y += Camera.dir.y * moveVelocity + Camera.dir.x * strafeVelocity
        this.pos.z += crouchVelocity

        Camera.pos.x += (this.pos.x - Camera.pos.x) * deltaTime * 10
        Camera.pos.y += (this.pos.y - Camera.pos.y) * deltaTime * 10
        Camera.pos.z += (this.pos.z - Camera.pos.z) * deltaTime * 10
    }
}
```
Note que reemplazamos la `rotationalSpeed`por `strafeSpeed` que ahora permite movimientos laterales.\
Ahora en `main` llamamos al update del Player:
```javascript
function update(time) {
    . . .

    Player.update(deltaTime)

    Renderer.draw()

    requestAnimationFrame(update)
}
```
## Movimiento vertical de cámara
Para el movimiento vertical de la cámara podríamos configurar dos teclas para ver hacia arriba o abajo, pero es mucho más cómodo para el usuario que sea controlado con el mouse. Para ello, vamos a hacer uso de la [Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API). Esta API nos permite bloquear el mouse dentro de un elemento del DOM, lo cual es particularmente útil para cámaras en primera persona.\
Primero creamos la propiedad `theta` en Controls que nos indica el ángulo entre el el plano XY y el eje Z. Luego configuramos el Pointer Lock dentro de la inicialización de Controls. Por último en el update interpolamos el movimiento:
```javascript
const Controls = {
    theta: 0,
    thetaSpeed: 100,
    . . .

    // element: pointerLockElement
    init(element) {
        document.addEventListener("keydown", e => {this.inkey[e.code] = true})
        document.addEventListener("keyup",   e => {this.inkey[e.code] = false})

        this.theta = Camera.center
        const upperLimit = Renderer.height * .5 - 100
        const lowerLimit = Renderer.height * .5 + 100
        const onMouseMove = e => {
            this.theta -= this.thetaSpeed * e.movementY / Renderer.height
            this.theta = Math.max(upperLimit, Math.min(lowerLimit, this.theta)) // Clamp
        }

        const enterPointerLock = () => (document.pointerLockElement !== element) && element.requestPointerLock()

        element.onclick = enterPointerLock
        document.addEventListener("pointerlockchange", () => {
            if (document.pointerLockElement === element) {
				element.addEventListener("mousemove", onMouseMove, false)
            } else {
				element.removeEventListener("mousemove", onMouseMove, false)
                element.onclick = enterPointerLock
            }
        }, false)
    },

    update (deltaTime) {
        . . .
        Camera.center += (this.theta - Camera.center) * deltaTime * 15
    }
}
```
En Player actualizamos el movimiento:
```javascript
const Player = {
    update(deltaTime) {
        . . .
        Camera.center += (Controls.theta - Camera.center) * deltaTime * 15
    }
}
```
En `main` debemos pasarle el Canvas como parámetro en la inicialización de Controls:
```javascript
// Iniciamos los Controles
Controls.init(document.getElementById("canvas"))
```
Para que la modificación tenga el efecto correcto debemos cambiar cómo se renderizan las walls. Para ello es necesario modificar la fórmula en Point de toScreenSpace:
```javascript
const Point = (x, y) => ({
    . . .
    toScreenSpace(topZ, bottomZ) {
        this.top    = Camera.center - (topZ    - Camera.pos.z) * Camera.dp * this.depth
        this.bottom = Camera.center - (bottomZ - Camera.pos.z) * Camera.dp * this.depth
    
```
Con esto ya debería ser capaz de ver hacia arriba y abajo.
## Movimiento horizontal
Por último, queremos cambiar el ángulo de la cámara con el mouse. Esto es particularmente sencillo debido a que solo hay que agregar pocas líneas de código en `Controls` y `Player`:
```javascript
const Controls = {
    . . .
    phi: 0,
    phiSpeed: 0.5,
    . . .
    init(element) {
        . . .
        this.phi = Camera.angle
        const onMouseMove = e => {
            . . .
            this.phi += this.phiSpeed * e.movementX / Renderer.width
        }
        . . .
    }
}
```
En Player actualizamos el movimiento:
```javascript
const Player = {
    update(deltaTime) {
        . . .
        Camera.setAngle(Camera.angle + (this.phi - Camera.angle) * deltaTime * 15)
    }
}
```
## Resource Manager
Para evitar ciertos errores visuales al cargar el nivel, en `ResourceManager` debemos inicializar los controles y al Player:
```javascript
const ResourceManager = {
    . . .
    setLevel(name) {
        . . .
        Player.sector = Renderer.MainViewport.sector = level.player.sector
        Player.pos.x = Camera.pos.x = level.player.pos.x
        Player.pos.y = Camera.pos.y = level.player.pos.y
        Player.pos.z = Camera.pos.z = level.player.pos.z
        Controls.phi = level.player.angle
        Camera.setAngle(level.player.angle)
    }
}
```
## Conclusión
Puede ajustar los parámetros a valores que le resulten más cómodos, al igual que el mapeo de las teclas para el movimiento. También es un ejercicio interesante lograr que el movimiento en Z dependa del ángulo vertical de la cámara. Otro ejercicio para realizar sería implementar un laberinto ;)