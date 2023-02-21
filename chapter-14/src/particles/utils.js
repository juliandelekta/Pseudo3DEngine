const Default = (val, def) => val === undefined ? def : val
const isDefined = val => val !== undefined
const ifDefined = (val, ifDefined, ifUndefined) => val !== undefined ? ifDefined : ifUndefined


const toRad = deg => deg * Math.PI / 180

const Curve = (a, b, c) => c === undefined ? (
    b === undefined
    ? a
    : `(__a=${a},__b=${b},Math.random()*(__b-__a)+__a)`
) : `(__a=${b},__b=${c},Math.random()*(__b-__a)+__a)*${a}`

const Spline = (...points) => eval(`(() => {
const ts = [${points.map(x => x[0])},${points[points.length-1][0]}],
    dif = [${points.map((x, i) => 1 / (Default(points[i+1], points[i])[0] - x[0]))}],
    values = [${points[0][1]},${points.map(x => x[1])},${points[points.length-1][1]},${points[points.length-1][1]}]
return t => {
    let i = ${points.slice(1,-2).map((_, i) => `${i+1} * (ts[${i+1}] <= t && t < ts[${i+2}])`).join(" + ")} + ${points.length-2} * (ts[${points.length-2}] <= t)
    let p = (t - ts[i]) * dif[i] + i + 1
    i = Math.floor(p)

    return CatmullRom(p - i, values[i - 1], values[i], values[i + 1], values[i + 2])
}
})()`)

const Gradient = (...points) => eval(`(() => {
const ts = [${points.map(x => x[0])},${points[points.length-1][0]}],
    dif = [${points.map((x, i) => 1 / (Default(points[i+1], points[i])[0] - x[0]))}],
    r = [${points.map(x => x[1].r)},${points[points.length-1][1].r}],
    g = [${points.map(x => x[1].g)},${points[points.length-1][1].g}],
    b = [${points.map(x => x[1].b)},${points[points.length-1][1].b}]
    ${points[0][1].a !== undefined ? `,a = [${points.map(x => x[1].a)},${points[points.length-1][1].a}]` : ""}
    return (t, color) => {
        let i = ${points.slice(1,-2).map((_, i) => `${i+1} * (ts[${i+1}] <= t && t < ts[${i+2}])`).join(" + ")} + ${points.length-2} * (ts[${points.length-2}] <= t)
        let p = (t - ts[i]) * dif[i] + i
        i = Math.floor(p)

        color.r = r[i] + (r[i+1] - r[i]) * (p - i)
        color.g = g[i] + (g[i+1] - g[i]) * (p - i)
        color.b = b[i] + (b[i+1] - b[i]) * (p - i)
        ${points[0][1].a !== undefined ? "color.a = a[i] + (a[i+1] - a[i]) * (p - i)" : ""}
        return color
    }
})()`)

const color = (r,g,b,a) => a !== undefined ? ({r,g,b,a}) : ({r,g,b})

function CatmullRom( t, p0, p1, p2, p3 ) {
	const v0 = ( p2 - p0 ) * 0.5
	const v1 = ( p3 - p1 ) * 0.5
	const t2 = t * t
	const t3 = t * t2
	return ( 2 * p1 - 2 * p2 + v0 + v1 ) * t3 + ( - 3 * p1 + 3 * p2 - 2 * v0 - v1 ) * t2 + v0 * t + p1
}
