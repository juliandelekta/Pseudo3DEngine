const Screen = ((width, height) => ({
    width, height, // px
    pixelsLength: width * height * 4,
    pixels: new Uint8ClampedArray(new ArrayBuffer(this.pixelsLength)).fill(255),
    imageData: new ImageData(this.pixels, width, height)
}))(320, 200) // width: 320px, height: 200px
