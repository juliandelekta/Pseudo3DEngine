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
    next = "other-bottom"
    #texture = "stone_o"

    [sectors.ceiling]
    z = 3
    next = "top-other"

    [[sectors.loops]]
    name = "border"
    v = [3,14, 16,14, 16,25, 3,25]
    walls = [
        {texture = "wood", next="main"},
        {texture = "stone"},
        {texture = "stone"},
        {texture = "stone"}
    ]

    [[sectors.loops]]
    name = "inner"
    v = [16,18, 3,18, 3,20, 16,20]
    walls = [
        {walls = [
            {upper = "stone", lower = "stone_o", next = "below", z = 2},
            {upper = "wood", lower = "mossy", next = "above"}
        ]},
        {texture = "stone"},
        {walls = [
            {upper = "stone", lower = "stone_o", next = "below", z = 2},
            {upper = "wood", lower = "mossy", next = "above"}
        ]},
        {texture = "stone"}
    ]

[[sectors]]
    name = "below"
    
    [sectors.floor]
    z = -1
    next = "other-bottom"
    #texture = "stone_o"

    [sectors.ceiling]
    z = 0.5
    texture = "stone"

    [[sectors.loops]]
    name = "border"
    v = [16,20, 3,20, 3,18, 16,18]
    walls = [
        {texture = "stone", next = "other"},
        {texture = "stone"},
        {texture = "stone", next = "other"},
        {texture = "stone"}
    ]

[[sectors]]
    name = "above"
    
    [sectors.floor]
    z = 1
    texture = "mossy"

    [sectors.ceiling]
    z = 3
	#texture = "stone"
    next = "top-other"

    [[sectors.loops]]
    name = "border"
    v = [16,20, 3,20, 3,18, 16,18]
    walls = [
        {texture = "stone", next = "other"},
        {texture = "stone"},
        {texture = "stone", next = "other"},
        {texture = "stone"}
    ]

[[sectors]]
    name = "top"

    [sectors.floor]
    z = 3
    next = "top-other"

    [sectors.ceiling]
    z = 5
    texture = "sky"
    parallax = true

    [[sectors.loops]]
    name = "border"
    v = [3,14, 16,14, 16,25, 3,25]
    walls = [
        {texture = "wood"},
        {texture = "wood"},
        {texture = "wood"},
        {texture = "wood"}
    ]
	
	[[sectors.loops]]
	name = "internal"
	v = [10,25, 12,25, 12,14, 10,14]
	walls = [
		{texture = "wood", next = "beam"},
		{texture = "wood", next = "beam"},
		{texture = "wood", next = "beam"},
		{texture = "wood", next = "beam"}
	]
	
[[sectors]]
	name = "beam"
	
	[sectors.floor]
	z = 3
	next = "top-other"
	
	[sectors.ceiling]
	z = 4.5
	texture = "wood"
	
	[[sectors.loops]]
	name = "border"
	v = [10,14, 12,14, 12,25, 10,25]
	walls = [
		{texture = "mossy"},
		{texture = "mossy", next = "top"},
		{texture = "mossy"},
		{texture = "mossy", next = "top"}
	]

[[sectors]]
    name = "bottom"

    [sectors.floor]
    z = -4
    texture = "stone_o"

    [sectors.ceiling]
    z = -1
    next = "other-bottom"

    [[sectors.loops]]
    name = "border"
    v = [3,14, 16,14, 16,25, 3,25]
    walls = [
        {texture = "wood"},
        {texture = "wood"},
        {texture = "wood"},
        {texture = "wood"}
    ]

[player]
sector = "main"
x = 9.25
y = 7.6
z = 1.2
angle = -0.0245
`)
