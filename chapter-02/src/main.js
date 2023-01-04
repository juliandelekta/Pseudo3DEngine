// Iniciamos la Camera
Camera.setAngle(0)
Camera.setFOV(Math.PI / 2)
Camera.pos.x = 13
Camera.pos.y = 13

// Iniciamos el Renderer
Renderer.init(document.getElementById("canvas"))

// Iniciamos los Controles
Controls.init()

// Iniciamos un "Mapa Sencillo"
const mainSector = Sector()
mainSector.segments.push(
    Segment( 6,  2, 20,  2),
    Segment(20,  2, 27, 14),
    Segment(27, 14, 16, 18),
    Segment(16, 18,  3, 14),
    Segment( 3, 14,  9,  8),
    Segment( 9,  8,  6,  2)
)

Renderer.MainViewport.sector = mainSector

// Controlamos el Range para el FOV
const range = document.getElementById("FOVRange")
range.addEventListener("input", () => {
    Camera.setFOV(range.value * Math.PI / 180)
    document.getElementById("FOVValue").innerText = range.value + "°"
});

let lastTime = 0;

// Main Loop
(function update(time) {
    const deltaTime = (time - lastTime) * 0.001;
    lastTime = time;

    Controls.update(deltaTime)

    Renderer.draw()

    requestAnimationFrame(update)
})(0)
