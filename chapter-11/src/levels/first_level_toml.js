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
    v = [0,0, 6,2, 13,2, 20,2, 27,14, 16,14, 3,14, 9,8]
    walls = [
        {texture = "brick 2,2"},
        {texture = "stone 2,2"},
        {texture = "166", next = "slopes"},
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

    [[sectors.loops]]
    name = "inner2"
    v = [19,9, 19,11, 21,11, 21,9]
    walls = [
        {texture = "brick", next = "intslopes"},
        {texture = "brick", next = "intslopes"},
        {texture = "brick", next = "intslopes"},
        {texture = "brick", next = "intslopes"}
    ]

    [[sectors.things]]
    thing = "soldier"
    x = 20
    y = 6
    z = 1
    h = 2
    w = 2
    angle = 90

    [[sectors.things]]
    thing = "shadow"
    x = 20
    y = 6
    z = 0
    h = 1
    w = 1

    [[sectors.things]]
    thing = "statue"
    x = 18
    y = 5
    z = 1
    h = 2
    w = 2

    [[sectors.things]]
    thing = "statue"
    x = 22
    y = 8
    z = 1
    h = 2
    w = 2

    [[sectors.things]]
    thing = "alga"
    x = 16.5
    y = 2
    z = 1
    h = 2
    w = 7
    angle = -90

    [[sectors.things]]
    thing = "alga"
    x = 12
    y = 7.5
    z = 1
    h = 2
    w = 3

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
    name = "intslopes"

    slopeFloor = {z = [0.4, 0.4, 1, 1], sidewall = "brick", isRelative = true}
    slopeCeil  = {z = [0, 0, 1, 1], sidewall = "brick", isRelative = true}

    [sectors.floor]
    z = 0
    texture = "stone"

    [sectors.ceiling]
    z = 2
    texture = "96 2,2"

    [[sectors.loops]]
    name = "border"
    v = [19,11, 19,9, 21,9, 21,11]
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

    [sectors.ceiling]
    z = 3
    next = "top-other"

    [[sectors.loops]]
    name = "border"
    v = [3,14, 16,14, 16,25, 3,25]
    walls = [
        {texture = "122 2,2", next="main"},
        {texture = "122 2,2"},
        {texture = "122 2,2"},
        {texture = "122 2,2"}
    ]

    [[sectors.loops]]
    name = "inner"
    v = [16,18, 3,18, 3,20, 16,20]
    walls = [
        {walls = [
            {upper = "96 2,0.5", lower = "stone_o", next = "below", z = 2},
            {upper = "wood", lower = "mossy", next = "above"}
        ]},
        {texture = "stone"},
        {walls = [
            {upper = "96 2,0.5", lower = "stone_o", next = "below", z = 2},
            {upper = "wood", lower = "mossy", next = "above"}
        ]},
        {texture = "stone"}
    ]

    [[sectors.things]]
    thing = "iron_floor"
    x = 9
    y = 16
    z = 0
    h = 4
    w = 2


[[sectors]]
    name = "below"
    
    [sectors.floor]
    z = -1
    next = "other-bottom"

    [sectors.ceiling]
    z = 0.5
    texture = "96 2,2"

    [[sectors.loops]]
    name = "border"
    v = [16,20, 3,20, 3,18, 16,18]
    walls = [
        {texture = "stone", next = "other"},
        {texture = "122 2,2"},
        {texture = "stone", next = "other"},
        {texture = "122 2,2"}
    ]

[[sectors]]
    name = "above"
    
    [sectors.floor]
    z = 1
    texture = "96 2,2"

    [sectors.ceiling]
    z = 3
	#texture = "stone"
    next = "top-other"

    [[sectors.loops]]
    name = "border"
    v = [16,20, 3,20, 3,18, 16,18]
    walls = [
        {texture = "stone", next = "other"},
        {texture = "122 2,2"},
        {texture = "stone", next = "other"},
        {texture = "122 2,2"}
    ]

    [[sectors.things]]
    thing = "soldier"
    x = 4
    y = 19
    z = 2
    h = 2
    w = 2

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
	texture = "110"
	
	[[sectors.loops]]
	name = "border"
	v = [10,14, 12,14, 12,25, 10,25]
	walls = [
		{texture = "wood"},
		{texture = "wood", next = "top"},
		{texture = "wood"},
		{texture = "wood", next = "top"}
	]

[[sectors]]
    name = "bottom"

    [sectors.floor]
    z = -4
    texture = "33 2,2"

    [sectors.ceiling]
    z = -1
    next = "other-bottom"

    [[sectors.loops]]
    name = "border"
    v = [3,14, 16,14, 16,25, 3,25]
    walls = [
        {texture = "64 2,2"},
        {texture = "64 2,2"},
        {texture = "64 2,2"},
        {texture = "64 2,2"}
    ]

[[sectors]]
    name = "slopes"

    slopeFloor = {z = [0, 0, 0.7, 0.7], sidewall = "brick"}
    slopeCeil  = {z = [0, 0, 0.7, 0.7], sidewall = "wood"}

    [sectors.floor]
    z = 0
    texture = "stone_o"

    [sectors.ceiling]
    z = 2
    texture = "wood"

    [[sectors.loops]]
    name = "border"
    v = [20,2, 13,2, 13,-5, 20,-5]
    walls = [
        {texture = "64", next = "main"},
        {texture = "64"},
        {texture = "64"},
        {texture = "64"}
    ]


[player]
sector = "main"
x = 9.25
y = 7.6
z = 1.2
angle = -0.0245
`)
