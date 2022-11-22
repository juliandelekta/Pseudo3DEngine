ResourceManager.loadTOML(`name = "first_level"
[[sectors]]
    name = "main"

    [[sectors.loops]]
    name = "border"
    v = [0,0, 6,2, 20,2, 27,14, 16,18, 3,14, 9,8]
    walls = [
        {texture = "brick"},
        {texture = "stone"},
        {texture = "mossy"},
        {texture = "brick"},
        {texture = "stone"},
        {texture = "mossy"},
        {texture = "mossy"}
    ]

[player]
sector = "main"
x = 13
y = 13
z = 2
`)
