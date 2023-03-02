ResourceManager.loadThings(
    {
        name: "statue",
        texture: "statue"
    },

    {
        name: "soldier",
        clip: "idle",
        clips: {
            idle: {
                frames: ["idle"],
                directional: true
            },
            die: {
                frames: ["diea", "dieb", "diec", "died"],
                directional: false
            },
            shoot: {
                frames: ["shoota", "shootb", "shootc"],
                times: [1, 2, 1],
                directional: false
            },
            walk: {
                frames: ["walka", "walkb", "walkc", "walkd"],
                directional: true
            }
        }
    },

    {
        name: "alga",
        texture: "alga",
        type: "wall"
    },

    {
        name: "iron_floor",
        texture: "96",
        type: "flat"
    },

    {
        name: "shadow",
        texture: "shadow",
        type: "flat"
    },

    {
        name: "dog",
        texture: "dogvox",
        type: "voxel",
        w: 8, h: 16, d: 13 // Dimensiones del Mapa de Vóxeles
    },

    {
        name: "barrel",
        texture: "barrelslices",
        type: "voxel",
        w: 16, h: 16, d: 16
    }
)
