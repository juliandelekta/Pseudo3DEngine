# **Capítulo 3.** Archivo de datos (YAML format). Texturas
**TextureData**: Pixel Data + Dimensión
**Texture**: TextureData + Offset + Scale + (u,v)
**TextureRaw**: Base64 + Dimensión
**Archivo de Texturas**: Nombre del Paquete + Lista de TextureRaw
**TextureLoader**: Los archivo de Texturas se pasan por acá. Pasa del TextureRaw a TextureData
Las texturas en un .png están ordenadas en columnas. Las del archivo de texturas están en filas.

**Archivo de Nivel**: Nombre + info en YAML
**LevelLoader**: parse del YAML, obtiene los objetos de configuración. Ahora cada componente que se crea, lo hace con las opciones de los objetos de configuración.

Especificación de la herramienta de tratamiento de imágenes