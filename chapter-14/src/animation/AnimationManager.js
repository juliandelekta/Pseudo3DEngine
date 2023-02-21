const AnimationManager = {
    LOOP: 1,
    PING_PONG: 2,

    animations: new Array(128).fill(0).map(Animation),
    length: 0,

    time: 0,

    update(deltaTime) {
        this.time += deltaTime
        for (let i = 0; i < this.length; i++) {
            const animation = this.animations[i]
            animation.map(this.time)

            // Si la animación ya no está en reproducción, la elimino
            if (!animation.isPlaying) {
                const tmp = this.animations[--this.length]
                this.animations[this.length] = animation
                this.animations[i] = tmp
                i-- // Repetir esta posición
            }
        }
    },

    play(clip, thing, T, options = 0) {
        const animation = this.animations[this.length++]
        animation.play(clip, thing, T, options)
        return animation
    },
}
