# Duke Nukem 3D Like Engine Tutorial for Game Developers - by Julián Delekta

## Prefacio
Bienvenido a *Duke Nukem 3D Like Engine Tutorial*. Este proyecto apunta a desarrollar un *Game Engine* sencillo con el fin de explorar la forma más simplificada de desarrollar los componentes que conforman un motor comercial clásico manteniendo un buen nivel de calidad. En líneas generales nos enfocaremos en las tecnologías, los algoritmos y las estructuras de datos que conforman cada uno de los subsistemas y cómo estos interactúan entre sí.
La implementación del código va a ser sobre JavaScript plano, sin ninguna librería extra. El estilo de programación puede resultar un tanto particular, basándose principalmente en el paradigma Imperativo (muy al estilo C) sin profundizar sobre Orientación a Objetos.
La arquitectura del motor se compone principalmente del *Rendering Engine*, el *Physics Engine* y la capa de *Gameplay*. Esta última, contiene el modelo de los objetos del juego, el editor del mapa, el sistema de evento y el sistema de scripting.
En la sección *Graphics Engine* se exploran los fundamentos teóricos de diversas técnicas de Renderización por Software para lograr un motor gráfico que simule gráficos 3D como los encontrados en el juego Duke Nukem 3D. En general, el tutorial trata de acercar al lector los conceptos matemáticos y su implementación sencilla en *JavaScript*.
En la sección *Physics Engine* se exploran los sistemas de detección de colisiones y la simulación de físicas.
En la sección *Gameplay* se exploran conceptos relacionados con las mecánicas del juego, las mecánicas del jugador, IA, *World Editor*, cámaras y la arquitectura guiada por eventos.

## Tabla de Contenidos
### I. Graphics Engine
**Capítulo 1.** Introducción<br>
**Capítulo 2.** Proyección de Paredes<br>
**Capítulo 3.** Archivo de datos (YAML format). Texturas<br>
**Capítulo 4.** Texturas en paredes<br>
**Capítulo 5.** Texturas en suelo y techo. Paralaxing<br>
**Capítulo 6.** Player se mueve en eje Z, y puede mirar un poco arriba y un poco abajo<br>
**Capítulo 7.** Sectors. Portals. Viewport Occlusion Buffers. Cross Portal detection<br>
**Capítulo 8.** Stack. Sector over Sector<br>
**Capítulo 9.** Slopes<br>
**Capítulo 10.** Thing. Sprite Wall y Sprite Face<br>
**Capítulo 11.** Sprite Floor<br>
**Capítulo 12.** Sprite Voxel<br>
**Capítulo 13.** Animation System<br>
**Capítulo 14.** Particle System<br>
**Capítulo 15.** Light Maps<br>
### III. Physics Engine
**Capítulo 16.** Model<br>
**Capítulo 17.** Collision Detection<br>
### III. Gameplay
**Capítulo 18.** World Editor<br>
**Capítulo 19.** Event Driven Architecture<br>
**Capítulo 20.** Artificial Intelligence<br>
### IV. Network Connection
**Capítulo 21.** Arquitectura Cliente Servidor<br>
