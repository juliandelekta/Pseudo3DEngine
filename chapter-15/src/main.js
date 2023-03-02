// Iniciamos la Camera
Camera.setAngle(0)
Camera.setFOV(Math.PI / 3)

// Iniciamos el Canvas
Renderer.init(document.getElementById("canvas"))

ViewportsPool.init()
BufferPool.init()

// Iniciamos los Controles
Controls.init(document.getElementById("canvas"))

// Iniciamos los Loaders
var e
var textureViewer
var slope,l,T
const set = (x,y,z) => {Player.pos.x = x; Player.pos.y = y; Player.pos.z = z}
TextureLoader.init()
TextureLoader.onReady = () => {
    // Cargamos el nivel
    if (ResourceManager.setLevel("first_level")) {
        Bakery.bake(ResourceManager.levels.first_level)
        slope = ResourceManager.levels.first_level.sectors.intslopes.slopeFloor
        T = Bakery.sectorsMap.intslopes.slopeFloor.segments[1]
        l = Player.sector.segments[12].wall.upperLightmap
        // l = slope.segments[1].lightmap
        l.data[0] = 255
        l.data[l.h-1] = 255
        l.data[(l.w-1)*l.h]= 255
        l.data[l.w * l.h - 1] = 255
        update(0)
        textureViewer = FaceSprite()
        textureViewer.pos.x = 15
        textureViewer.pos.y = 3.5
        textureViewer.pos.z = 1
        textureViewer.init()
        textureViewer.w = 2
        textureViewer.h = 2
        textureViewer.texture = CreateTexture(256)
        Player.sector.things.push(textureViewer)

        // Tests
        // var s0 = segment_t(0,0,0,1,1,0),
        //     s1 = segment_t(0,1,0,1,0,0)
        // const T = triangle_t(0.5,0,0, 0.5,0,1, 0.5,1,0)
        // console.log("Intersección: ", Segment_Segment(s0, s1), Segment_Segment(s1, s0))
        // console.log("S vs T:", Segment_Triangle(s0, T))
        //
        // var s0 = segment_t(17,-3.7,1.3,19.97,1.73,0.03)
        var s0 = segment_t(17,-3.7,1.3,19.97,1.97,0.00)
        // console.log("En el lado derecho: (0,1)="+s0.isInFront(0,1)+", (1,0)="+s0.isInFront(1,0))
        // var s0 = segment_t(20,6,1, 20,12.5,0)
        // const T1 = triangle_t(
        //     v3(19, 9, 0),
        //     v3(19, 9, .4),
        //     v3(21, 9, 0)
        // )
        // const T2 = triangle_t(
        //     v3(21, 9, 0),
        //     v3(19, 9, 0.4),
        //     v3(21, 9, 1)
        // )
        // const T1 = Bakery.sectorsMap.slopes.slopeFloor.triangle1
        // const T2 = Bakery.sectorsMap.slopes.slopeFloor.triangle2
        // const t = Segment_Triangle(s0, T2)
        // console.log(Segment_Triangle(s0, T1), Segment_Triangle(s0, T2), s0.x0 + t * s0.dirx, s0.y0 + t * s0.diry, s0.z0 + t * s0.dirz)
        // console.log(T1.isInFront(18.822, 7, 1), T2.isInFront(18.822, 7, 1), T1.isInFront(20, 13, 0.5), T2.isInFront(20, 13, 0.5))
    }
}

window.onload = () => TextureLoader.makeTextures()

// Controlamos el Range para el FOV
const range = document.getElementById("FOVRange")
range.addEventListener("input", () => {
    Camera.setFOV(range.value * Math.PI / 180)
    document.getElementById("FOVValue").innerText = range.value + "°"
})

const xpos = document.getElementById("x")
const ypos = document.getElementById("y")


const FPS = {
    values: [60, 60, 60, 60],
    i: 0,
    element: document.getElementById("fps"),

    update(val) {
        this.values[this.i] = val
        this.i = (this.i + 1) & 3
        this.element.innerText = ( (
            this.values[0] +
            this.values[1] +
            this.values[2] +
            this.values[3]
        ) * .25 ).toFixed(2) + "FPS"
    }
}

let lastTime = 0

// Main Loop
function update(time) {
    const deltaTime = (time - lastTime) * 0.001
    lastTime = time
    FPS.update(1 / deltaTime)

    Player.update(deltaTime)

    ParticleSystem.update(deltaTime)
    Renderer.draw()

    AnimationManager.update(deltaTime)

    requestAnimationFrame(update)
}

