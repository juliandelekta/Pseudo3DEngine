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
    v = [0,0, 6,2, 20,2, 27,14, 16,18, 3,14, 9,8]
    walls = [
        {texture = "brick 2,2"},
        {texture = "stone 2,2"},
        {texture = "mossy 2,2"},
        {texture = "brick 2,2"},
        {texture = "stone 2,2"},
        {texture = "mossy 2,2"},
        {texture = "mossy 2,2"}
    ]

    [[sectors.loops]]
    name = "inner"
    v = [12,6, 12,9, 15,9, 15,6]
    walls = [
        {texture = "stone 2,2"},
        {texture = "stone 2,2"},
        {texture = "stone 2,2"},
        {texture = "stone 2,2"}
    ]

[player]
sector = "main"
x = 13
y = 13
z = 1.2
angle = -1.55
`)
