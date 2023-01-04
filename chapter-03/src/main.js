// Iniciamos la Camera
Camera.setAngle(0)
Camera.setFOV(Math.PI / 2)

// Iniciamos el Canvas
Renderer.init(document.getElementById("canvas"))

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

// Controlamos el Range para el FOV
const range = document.getElementById("FOVRange")
range.addEventListener("input", () => {
    Camera.setFOV(range.value * Math.PI / 180)
    document.getElementById("FOVValue").innerText = range.value + "°"
});

let lastTime = 0;

// Main Loop
function update(time) {
    const deltaTime = (time - lastTime) * 0.001;
    lastTime = time;

    Controls.update(deltaTime)

    Renderer.draw()

    requestAnimationFrame(update)
}
