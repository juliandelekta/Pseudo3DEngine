ParticleSystem.load({
test: {
    startSpeed: Curve(0, 1),
    gravityMultiplier: 3,
    lifetime: 2,

    startColor: [1, "t", 0, 1],

    emission: {
        rate: 3,
        bursts: [
            {count: 1}
        ]
    },

    shape: ConeShape({
        angle: 25,
        
    })
},

snow: {
    startSpeed: 3,
    gravityMultiplier: .1,
    startScale: Curve(.2, .7),

    shape: BoxShape({
    }),

    emission: {
        rate: 20,
        /*bursts: [
            {time: 2, count: 20, cycles: 4, interval: 1}
        ]*/
    },

    color: {
        bySpeed: {
            gradient: [
                [0, color(1, 0, 0, 1)],
                [1, color(1, 1, 0, 1)]
            ],
            range: [0, 12]
        }
    }
},

noise: {
    lifetime: 1000,
    startSpeed: 0,
    startScale: 0.1,
    shape: BoxShape({
    }),
    noise: {
        frequency: 3,
        strength: .5,
        octaves: 1,
        damping: true,
        morph: .1
    },
    color: {
        bySpeed: {
            gradient: [
                [ 0, color(0,0,0,255)],
                [0.35, color(255,0,0,255)],
                [0.65, color(255,255,0,255)],
                [1, color(255,255,255,255)]
            ],
            range: [0, 1]
        }
    },
    emission: {
        rate: 100
    },
particleTexture: "particle"
},

rotation: {
    lifetime: 10,
    startSpeed: 5,
    gravityMultiplier: 1,
    shape: ConeShape({
        angle: 25
    }),
    forces: {
        drag: 2,
        multiplyDragByParticleVelocity: true
    },
    color: {
        byLife: [
            [0, color(255,255,255,255)],
            [0.9, color(255,0,0,0.03)],
            [1, color(255,0,0,0)]
        ]
    },
    rotation: {
        byLife: "t * Math.PI"
    },
    emission: {
        rate: 3
    },
    particleTexture: "star",
    collision: {
        bounce: 1,
        radiusScale: .8,
        minSpeed: 2
    }
},

fireworks: {
    lifetime: 0.4,
    startSpeed: 10,
    startScale: 0.1,
    forces: {
        drag: 50
    },
    shape: ConeShape({
        angle: 25
    }),
    emission: {
        rate: 3
    },
    subEmitters: [
        {
            stage: "death",
            subEmitter: "firework_boom",
            duration: 10
        },
        {
            stage: "birth",
            subEmitter: "firework_splash"
        },
    ]
},

firework_boom: {
    startSpeed: 5,
    gravityMultiplier: 1,
    startScale: 0.3,
    startColor: [255, Curve(0, 255), 0],
    emission: {
        rate: 0,
        bursts: [
            {
                time: 0,
                count: 20
            }
        ]
    },
    _collision: { // Borrar "_" para ver el efecto con colisión
        lifeLoss: 0.5
    },
    subEmitters: [
        {
            stage: "collision",
            subEmitter: "firework_star"
        }
    ]
},

firework_splash: {
    startSpeed: 2,
    lifetime: 1,
    startScale: 0.1,
    startColor: [0, Curve(0, 255), 255],
    emission: {
        rate: 0,
        bursts: [
            {
                time: 0,
                count: 6
            }
        ]
    }
},

firework_star: {
    startSpeed: 0,
    lifetime: 1,
    startScale: 0.1,
    startColor: [0, Curve(0, 255), 255],
    emission: {
        rate: 0,
        bursts: [
            {
                time: 0,
                count: 1
            }
        ]
    },
    particleTexture: "star"
},
})
