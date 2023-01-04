ResourceManager.loadTOML(`name = "first_level"
[[sectors]]
    name = "main"

    [sectors.floor]
    texture = "stone_o"
    isRelative = true

    [sectors.ceiling]
    z = 2
    texture = "wood"

    [[sectors.loops]]
    name = "border"
    v = [0,0, 6,2, 20,2, 27,14, 16,14, 3,14, 9,8]
    walls = [
        {texture = "brick 2,2"},
        {texture = "stone 2,2"},
        {texture = "mossy 2,2"},
        {texture = "brick 2,2"},
        {texture = "wood 2,2", next="other"},
        {texture = "mossy 2,2"},
        {texture = "mossy 2,2"}
    ]

    [[sectors.loops]]
    name = "inner"
    v = [12,6, 12,9, 15,9, 15,6]
    walls = [
        {lower = "brick", upper = "mossy", next = "internal"},
        {lower = "brick", upper = "mossy", next = "internal"},
        {lower = "brick", upper = "mossy", next = "internal"},
        {lower = "brick", upper = "mossy", next = "internal"}
    ]

[[sectors]]
    name = "internal"

    [sectors.floor]
    z = 0.5
    texture = "stone_o"

    [sectors.ceiling]
    z = 1.7
    texture = "wood"

    [[sectors.loops]]
    name = "border"
    v = [15,6, 15,9, 12,9, 12,6]
    walls = [
        {texture = "stone", next = "main"},
        {texture = "stone", next = "main"},
        {texture = "stone", next = "main"},
        {texture = "stone", next = "main"}
    ]

[[sectors]]
    name = "other"

    [sectors.floor]
    z = -1
    texture = "stone_o"
    isRelative = true

    [sectors.ceiling]
    z = 4
    parallax = true
    texture = "sky"

    [[sectors.loops]]
    name = "border"
    v = [3,14, 16,14, 16,28, 3,28]
    walls = [
        {texture = "wood 2,2", next="main"},
        {texture = "stone 2,2"},
        {texture = "stone 2,2"},
        {texture = "stone 2,2"}
    ]

[player]
sector = "main"
x = 9.25
y = 7.6
z = 1.2
angle = -0.0245
`)
