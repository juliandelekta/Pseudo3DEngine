// Iniciamos la Camera
Camera.setAngle(0)
Camera.setFOV(Math.PI / 2)

// Iniciamos el Canvas
Canvas.init(document.getElementById("canvas"))

// Iniciamos los Controles
Controls.init()

// Iniciamos los Loaders
TextureLoader.init()

// Creamos el Main Viewport
const mainViewport = Viewport()

// Controlamos el Range para el FOV
const range = document.getElementById("FOVRange")
range.addEventListener("input", () => {
    Camera.setFOV(range.value * Math.PI / 180)
    document.getElementById("FOVValue").innerText = range.value + "°"
});

// Cargamos el nivel
ResourceManager.setLevel("first_level")

let lastTime = 0;

// Main Loop
(function update(time) {
    const deltaTime = (time - lastTime) * 0.001;
    lastTime = time;

    Controls.update(deltaTime)

    mainViewport.sector.project()
    mainViewport.loadBuffers()
    Canvas.draw()

    requestAnimationFrame(update)
})(0)
