const ParticleSystem = {
    activeEmitters: [],
    emitters: {},           // Storage the definition of the emitters

    load(emitters) {
        for (const name in emitters)
            this.emitters[name] = Emitter.parse(emitters[name])
    },

    update(dt) {
        for (let i = 0; i < this.activeEmitters.length; i++) {
            const emitter = this.activeEmitters[i]
            emitter.update(dt)
            if (!emitter.active) {
                emitter.sector.things = emitter.sector.things.filter(x => x !== emitter)
                this.activeEmitters[i] = this.activeEmitters[this.activeEmitters.length - 1]
                this.activeEmitters.length--
            }
        }
    },

    addEmitter(emitter, sector) {
        emitter.sector = sector
        sector.things.push(emitter)
        this.activeEmitters.push(emitter)
    }
}
