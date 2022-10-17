# *Parte I. Graphics Engine*
# **Capítulo 1.** Introducción
En esta parte se exploran los fundamentos teóricos de diversas técnicas de Renderización por Software para lograr un motor gráfico que simule gráficos 3D. En general, el tutorial trata de acercar al lector los conceptos matemáticos y su implementación sencilla en JavaScript.

A diferencia de muchos motores gráficos actuales, nuestro *engine* emplea técnicas de Renderización por Software que generan una gran carga en el CPU, es decir, que no utilizaremos la GPU, ni OpenGL. Para lograr efectos tridimensionales emplearemos técnicas Pseudo-3D, es decir, que aproximan al resultado sin ser específicamente 3D y tendremos que colocar manualmente píxel por píxel en pantalla.

A lo largo de los capítulos iremos implementando los diversos componentes del motor utilizando JavaScript plano, sin librerías (excepto quizás para procesar texto YAML) y sin frameworks. El objetivo del código es que sea lo más ligero posible en líneas de código, simplicidad de estructuras (evitaremos crear grandes jerarquías y dependencias de clases), buscaremos que la renderización sea lo más rápida posible, apuntando a 60FPS y que nos permita un margen en la CPU para procesamiento del resto del juego.

Si está interesado en qué  resultados se pueden obtener, basta con observar algunos de los videojuegos FPS de los 90's, títulos como *Doom*, *Duke Nukem 3D*, *Hexen*, *Blood*, entre otros.<br>
La siguiente lista detalla algunas de las características relacionadas a los gráficos de alguno de los videojuegos previos:<br>
    - **Wolfenstein 3D**: Técnica de Raycasting<br>
    - **Doom Engine**: BSP para los mapas. Rasterization que permite dibujar distintos niveles de alturas.<br>
    - **Build Engine**: Motor gráfico del Duke Nukem 3D, Blood y Shadow Warrior. Es un *Portal Engine*.<br>
    - **Quake Engine**: Gráficos reales 3D. Light Maps.<br>
Nuestro objetivo es hacer algo entre el Build Engine y el Quake Engine. Tomando como inspiración a los gráficos logrados por otros motores como el de TESII: Arena, Ultima Underworld y System Shock.<br>
Tener en cuenta que aunque el motor esté centrado en videojuegos FPS, se pueden realizar trabajos interesante que incluyan gráficos 3D y Sprites. Ejemplo de esto serían remakes de videojuegos de la Game Boy (Color y Advance) aprovechando los gráficos retro pero añadiéndole una dimensión más.<br>
Por último, se espera que el lector sea capaz de comprender algunos conceptos matemáticos de proyección, resultándole trivial una implementación similar a la del *Mode 7* de la SNES.

## Recursos de referencia
- [Lodev Raycasting Series](https://lodev.org/cgtutor/index.html)
- [Fabien Sanglard Website](https://fabiensanglard.net/duke3d/index.php)
	- En Particular su [Parte 2](https://fabiensanglard.net/duke3d/build_engine_internals.php) de Build Engine 
- [*Ray-Casting Tutorial For Game Development And Other Purposes*](https://permadi.com/1996/05/ray-casting-tutorial-table-of-contents/)
by F. Permadi
- Videos de Bisqwit (YouTube):
  - [Creating a Doom-style 3D engine in C](https://www.youtube.com/watch?v=HQYsFshbkYw)
  - [Texture Mapping & Polygon Rasterizing Tutorial (para las *slopes*)](https://www.youtube.com/watch?v=PahbNFypubE)

