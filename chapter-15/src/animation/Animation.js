const Animation = () => ({
    duration: 0,
    invDuration: 0,
    startTime: 0,
    clip: null,
    thing: null,
    frame: 0,
    isPlaying: false,

    play(clip, thing, T, options) {
        this.clip = clip
        this.thing = thing
        this.duration = T
        this.invDuration = 1/T
        this.options = options
        this.frame = 0
        this.startTime = AnimationManager.time
        this.isPlaying = true

        this.applyFrame()
    },

    applyFrame() {
        if (this.clip.directional) {
            this.thing.textures = this.clip.frames[this.frame]
        } else {
            this.thing.texture = this.clip.frames[this.frame]
        }
    },

    map(time) {
        const t = (time - this.startTime) * this.invDuration
        if (t > 1) {
            if (this.options & AnimationManager.LOOP) {
                this.frame = 0
                this.startTime += this.duration
                this.applyFrame()
            } else {
                this.isPlaying = false
            }
        } else if (t > this.clip.times[this.frame]) {
            this.frame++
            this.applyFrame()
        }
    },

    stop() {
        this.isPlaying = false
    }
})
