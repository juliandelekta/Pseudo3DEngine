// Iniciamos la Camera
Camera.setAngle(0)
Camera.setFOV(Math.PI / 3)

// Iniciamos el Canvas
Renderer.init(document.getElementById("canvas"))

ViewportsPool.init()

// Iniciamos los Controles
Controls.init(document.getElementById("canvas"))

// Iniciamos los Loaders
TextureLoader.init()

// Controlamos el Range para el FOV
const range = document.getElementById("FOVRange")
range.addEventListener("input", () => {
    Camera.setFOV(range.value * Math.PI / 180)
    document.getElementById("FOVValue").innerText = range.value + "°"
});


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

function segmentsAt(col) {
	const vps = []
	let actual = Renderer.MainViewport
	
	while (actual && !vps.includes(actual.closest[col])) {
		const seg = actual.closest[col]
		vps.push(seg)
		actual = seg.wall.isPortal ? seg.wall.viewport : null
	}
	
	return vps
}

let lastTime = 0

// Main Loop
function update(time) {
    const deltaTime = (time - lastTime) * 0.001
    lastTime = time
    FPS.update(1 / deltaTime)

    Player.update(deltaTime)

    Renderer.draw()

    requestAnimationFrame(update)
}

TextureLoader.onReady = () => {
    // Cargamos el nivel
    if(ResourceManager.setLevel("E1M1")) {
        addThings()
        update(0)
    }
}

window.onload = () => TextureLoader.makeTextures()

function createWebWorker(workerOnMessage, mainOnMessage) {
    const worker = new Worker(URL.createObjectURL(
        new Blob([
            `onmessage=e=>{${workerOnMessage}}`
        ], {type: 'application/javascript'})
    ))

    worker.onmessage = mainOnMessage

    return worker
}

function test() {
    const worker = createWebWorker(
        `postMessage("Worker: " + e.data)`,
        e => {
            alert("Response: " + e.data)
        }
    )
    worker.postMessage("test")
}

function addThings() {
    for (const info of thingsToAdd) {
        const definition = ResourceManager.things[info.thing]
        if (!definition) console.log(info.thing)
        let thing = FaceSprite()
        if (definition.directional) {
            thing.angle = (info.angle || 0) * Math.PI / 180
            thing.directional = true
        }
        thing.thing = definition
        thing.pos.x = info.x
        thing.pos.y = info.y
        thing.pos.z = 1

        thing.init()
        addThing(thing)
    }
}

function addThing(thing) {
    // Buscar a que Sector pertenece
    // Pushearlo
    let sector = findSector(thing.pos.x, thing.pos.y, Object.values(ResourceManager.currentLevel.sectors))
    if (!sector) sector = ResourceManager.currentLevel.sectors.s90 
    sector.things.push(thing)
    if (thing.thing.directional) {
        thing.textures = thing.thing.textures
        TextureLoader.getTextureWithFirst(thing.thing.texture + 1, texture => thing.texture = texture)
    } else {
        TextureLoader.getTextureWithFirst(thing.thing.texture, texture => {thing.texture = texture})
    }
    thing.w = thing.texture.w / 32
    thing.h = thing.texture.h / 32
    thing.pos.z = sector.floor.z + thing.h / 2
}

function findSector(x, y, sectors) {
    for (const s of sectors)
        if (s.inside(x, y)) {
            if (s.subsectors) {
                if (s.subsectors.filter(x => x.subsectors.includes(s)).length)
                    console.log("Loop", s)
                const subsector = findSector(x, y, s.subsectors)
                if (subsector) return subsector
            }
            return s
        }
}