 const jstoml = (() => {

    // args: str, index
    // return: Result index object | Null
    //
    // require fn => fn() ? Result : Error Msg
    
    const ArrayTable = name => ({
        type: "ArrayTable",
        name,
        tables: [],

        eval() {
            return this.tables.map(t => t.eval())
        }
    })

    const KeyVal = (key, val) => ({
        type: "KeyVal",
        key,
        val,

        eval() {
            return this.val.eval()
        }
    })

    const BasicString = text => ({
        type: "String",
        value: text,

        eval() {
            return this.value
        }
    })

    const Float = val => ({
        type: "Float",
        value: parseFloat(val),

        eval() {
            return this.value
        }
    })

    const Integer = (val, base) => ({
        type: "Integer",
        value: parseInt(val, base),

        eval() {
            return this.value
        }
    })

    const BasicBoolean = bool => ({
        type: "Boolean",
        value: bool === "true",

        eval() {
            return this.value
        }
    })

    const BasicDate = date => ({
        type: "Date",
        value: new Date(date),

        eval() {
            return this.value
        }
    })

    const BasicArray = vals => ({
        type: "Array",
        value: vals,

        eval() {
            return Array.isArray(this.value) ? this.value.map(v => v.eval()) : [ this.value.eval() ]
        }
    })

    const Table = name => ({
        type: "Table",
        name,
        pairs: {},

        eval() {
            for (const k in this.pairs)
                this.pairs[k] = this.pairs[k].eval()
            return this.pairs
        }
    })

    const InlineTable = obj => ({
        type: "InlineTable",
        pairs: obj ? obj.reduce((o, keyval) => {
            o[keyval.key] = keyval.val
            return o
        }, {}) : {},

        eval() {
            for (const k in this.pairs)
                this.pairs[k] = this.pairs[k].eval()
            return this.pairs
        }

    })

    const F_concat = op => fn(op, a => a.join(""))
    const F_second = op => fn(op, a => a[1])

    // -- OPERADORES --
    // Alternativas
    const alt = (...ops) => (str, i) => {
        for (const o of ops) {
            const res = o(str, i)
            if (res)
                return res
        }
        return null
    }

    // Alternativa Inversa. Debid a que ABNF no define el orden, con esta se puede invertir
    const ialt = (...ops) => (str, i) => {
        for (let j = ops.length - 1; j >= 0; j--) {
            const res = ops[j](str, i)
            if (res)
                return res
        }
        return null
    }

    // Secuencia
    const seq = (...ops) => (str, i) => {
        const result = []
        
        for (const o of ops) {
            const r = o(str, i)
            if (r) {
                i = r.i
                result[result.length] = r.result
            } else
                return null
        }

        return { result, i }
    }
    
    // Igual a Secuencia pero concatena resultados que son Strings
    const concat = (...ops) => (str, i) => {
        let result = ""
        
        for (const o of ops) {
            const r = o(str, i)
            if (r) {
                i = r.i
                result += r.result ? r.result : ""
            } else
                return null
        }

        return { result, i }
    }

    // Ninguna o varias ocurrencias
    const zeroOrMore = op => (str, i) => {
        const result = []

        let r = op(str, i)
        while (r) {
            result[result.length] = r.result
            i = r.i
            r = op(str, i)
        }

        return { result, i }
    }

    // Al menos una ocurrencia
    const oneOrMore = op => (str, i) => {
        const result = []

        let r = op(str, i)
        while (r) {
            result[result.length] = r.result
            i = r.i
            r = op(str, i)
        }

        return result.length ? { result, i } : null
    }

    // Exactamente n ocurrencias
    const n = (n, op) => (str, i) => {
        let m = n
        const result = []

        while (m--) {
            const r = op(str, i)
            if (r) {
                result[result.length] = r.result
                i = r.i
            } else
                return null
        }

        return { result, i }
    }

    // Ninguna o varias ocurrencias
    const zeroOrMoreconcat = op => (str, i) => {
        let result = ""

        let r = op(str, i)
        while (r) {
            result += r.result ? r.result : ""
            i = r.i
            r = op(str, i)
        }

        return { result, i }
    }

    // Al menos una ocurrencia
    const oneOrMoreconcat = op => (str, i) => {
        let result = ""

        let r = op(str, i)
        while (r) {
            result += r.result ? r.result : ""
            i = r.i
            r = op(str, i)
        }

        return result.length ? { result, i } : null
    }

    // Exactamente n ocurrencias
    const nconcat = (n, op) => (str, i) => {
        let result = ""
        let m = n

        while (m--) {
            const r = op(str, i)
            if (r) {
                result += r.result ? r.result : ""
                i = r.i
            } else
                return null
        }

        return { result, i }
    }

    // Opcional
    const op = op => (str, i) => {
        const r = op(str, i)
        return r ? { result: r.result, i: r.i } : { result: null, i }
    }

    // Expresión Regular
    const regexp = rexp => (str, i) => ( str[i] && rexp.test(str[i]) )
        ? { result: str[i], i: i + 1}
        : null;

    // Aplica función al resultado, solo si fue exitoso
    const fn = (op, f) => (str, i) => {
        const r = op(str, i)
        return r ? { result: f(r.result), i: r.i } : null
    }

    const char = c => (str, i) => str[i] === c
        ? { result: c, i: i + 1 }
        : null;

    const lit = s => (str, i) => str.slice(i, i + s.length) === s
        ? { result: s, i: i + s.length }
        : null;

    // Deja pasar solo si el result de la operación no es nulo
    const nonull = op => (str, i) => {
        const r = op(str, i)
        return r ? (r.result ? r : null) : null
    }

    const second = (...ops) => F_second( seq(...ops) )
    
    // TOML Parser
    
    const ALPHA = regexp(/^[A-Z|a-z]/)
    const DIGIT = regexp(/^[0-9]/)
    const HEXDIG = regexp(/^[0-9|A-F|a-f]/)

    // Whitespace
    const wschar = regexp(/^(\ |\t)/)
    const ws = zeroOrMore(wschar)

    // New line
    const newline = regexp(/^(\n|\r)/)

    // Comment
    const comment_start_symbol = regexp(/^#/)
    const non_ascii = regexp(/^[\x80-\xD7FF|\xE00-\xFFF]/)
    const non_eol = alt( regexp(/^[\x09|\x20-\x7F]/), non_ascii )

    const comment = concat( comment_start_symbol, zeroOrMoreconcat(non_eol) )
    
    // Basic String
    
    const quotation_mark = char('"')

    const escape = char("\\")
    const escape_seq_char = alt(
        regexp(/^("|\\|b|f|n|r|t)/),
        seq( char("u"), n(4, HEXDIG) ),
        seq( char("U"), n(8, HEXDIG) )
    )
    
    const basic_unescaped = alt( wschar, regexp(/^(!|[#-\[]|[\]-~])/), non_ascii )
    const escaped = seq( escape, escape_seq_char )
    const basic_char = alt( basic_unescaped, escaped )
    
    const basic_string =  second( quotation_mark, zeroOrMoreconcat(basic_char), quotation_mark )

    // Multiline Basic String
    const mlb_escaped_nl = seq( escape, ws, newline, zeroOrMore(alt( wschar, newline )) )
    const mlb_unescaped = basic_unescaped
    const mlb_char = alt( mlb_unescaped, escaped )
    const mlb_quotes = (str, i) => {
        const r = str.slice(i, i + 3).match(/^(("[^"])|(""[^"]))/)
        if (r)
            return { result: r[0].slice(0, -1), i: i + r[0].length - 1 }
        return null
    }
    const mlb_content = alt( mlb_char, newline, mlb_escaped_nl )

    const ml_basic_string_delim = lit('"""')
    const ml_basic_body = concat(
        zeroOrMoreconcat( mlb_content ),
        zeroOrMoreconcat( concat( mlb_quotes, oneOrMoreconcat(mlb_content) ) ),
        op( mlb_quotes )
    )
    const ml_basic_string = fn(  seq( ml_basic_string_delim, op( newline ), ml_basic_body, ml_basic_string_delim ), a => a[2]  )

    // Literal String
    const apostrophe = char("'")
    const literal_char = alt( regexp(/^(\t|[ -&]|[\(-~])/), non_ascii )
    const literal_string = second( apostrophe, zeroOrMoreconcat(literal_char), apostrophe )

    // Multline Literal String
    const mll_char = literal_char
    const mll_quotes = (str, i) => {
        const r = str.slice(i, i + 3).match(/^(('[^'])|(''[^']))/)
        if (r)
            return { result: r[0].slice(0, -1), i: i + r[0].length - 1 }
        return null
    }
    const mll_content = alt( mll_char, newline )

    const ml_literal_string_delim = lit("'''")
    const ml_literal_body = concat(
        zeroOrMoreconcat(mll_content),
        zeroOrMoreconcat( concat( mll_quotes, oneOrMoreconcat(mll_content) ) ),
        op( mll_quotes )
    )
    const ml_literal_string = fn(  seq( ml_literal_string_delim, op(newline), ml_literal_body, ml_literal_string_delim ),  a => a[2]  )

    // String

    const string = fn(  alt( ml_basic_string, basic_string, ml_literal_string, literal_string ),  BasicString  )

    // Integer
    const minus = char("-")
    const plus = char("+")
    const underscore = char("_")
    const digit1_9 = regexp(/^[1-9]/)
    const digit0_7 = regexp(/^[0-7]/)
    const digit0_1 = regexp(/^[0-1]/)

    const hex_prefix = lit("0x")
    const oct_prefix = lit("0o")
    const bin_prefix = lit("0b")

    const unsigned_dec_int = ialt( DIGIT, concat( digit1_9, oneOrMoreconcat( alt( DIGIT, second( underscore, DIGIT) ) ) )  )
    const dec_int = concat( op(alt( minus, plus )), unsigned_dec_int )

    const hex_int = concat( hex_prefix, HEXDIG, zeroOrMoreconcat( alt( HEXDIG, second( underscore, HEXDIG) ) ) )
    const oct_int = concat( oct_prefix, digit0_7, zeroOrMoreconcat( alt( digit0_7, second( underscore, digit0_7) ) ) )
    const bin_int = concat( bin_prefix, digit0_1, zeroOrMoreconcat( alt( digit0_1, second( underscore, digit0_1) ) ) )

    const integer = ialt(
        fn(dec_int, Integer),
        fn(hex_int, Integer),
        fn(oct_int, a => Integer(a.slice(2), 8)),
        fn(bin_int, a => Integer(a.slice(2), 2))
    )

    // Float

    const float_int_part = dec_int
    const decimal__point = char(".")
    const zero_prefixable_int = concat( DIGIT, zeroOrMoreconcat( alt( DIGIT, second( underscore, DIGIT )  ) )  )
    const frac = concat( decimal__point, zero_prefixable_int )

    const float_exp_part = concat( op(alt( minus, plus)), zero_prefixable_int )
    const exp = concat( regexp(/^(e|E)/), float_exp_part )

    const inf = fn(  lit("inf"),  () => "Infinity"  )
    const nan = fn(  lit("nan"),  () => "NaN"  )
    const special_float = concat( op(alt( minus, plus )), alt( inf, nan ) )

    const float = fn(  alt(
        concat( float_int_part, alt( exp, concat( frac, op(exp) )  ) ),
        special_float
    ), Float )

    // Boolean
    const boolean = fn(  alt( lit("true"), lit("false") ), BasicBoolean )


    // Date and Time (as defined in RFC 3339)
    
    const date_fullyear = nconcat(4, DIGIT)
    const date_month    = nconcat(2, DIGIT) // 01-12
    const date_mday     = nconcat(2, DIGIT) // 01-28, 01-29, 01-30, 01-31 based on month/year
    const time_delim = regexp(/^(T|t| )/)
    const time_hour   = nconcat(2, DIGIT)     // 00-23
    const time_minute = nconcat(2, DIGIT)     // 00-59
    const time_second = nconcat(2, DIGIT)     // 00-58, 00-59, 00-60 based on leap second rules
    const time_secfrac = concat( char("."), oneOrMoreconcat(DIGIT) )
    const time_numoffset = concat( regexp(/^(\-|\+)/), time_hour, char(":"), time_minute )
    const time_offset = alt(char("z"), char("Z"), time_numoffset)

    const partial_time = concat( time_hour, char(":"), time_minute, char(":"), time_second, op(time_secfrac) )
    const full_date = concat( date_fullyear, char("-"), date_month, char("-"), date_mday )
    const full_time = concat( partial_time, time_offset )

    // Offset Date-Time
    const offset_date_time = concat( full_date, time_delim, full_time )

    // Local Date-Time
    const local_date_time = concat( full_date, time_delim, partial_time )

    // Local Date
    const local_date = full_date

    // Local Time
    const local_time = fn(  partial_time, a => "1995-12-17T" + a  )

    const date_time = fn(  alt( offset_date_time, local_date_time, local_date, local_time ), BasicDate  )


    // Array
    const array_open = char("[")
    const array_close = char("]")
    const array_sep = char(",")
    const ws_comment_newline = zeroOrMore(alt(wschar, seq(op(comment), newline)))

    const array_values = (str, i) => alt(
        fn(  seq( ws_comment_newline, val, ws_comment_newline, array_sep, array_values ), a => Array.isArray(a[4]) ? ([a[1], ...a[4]]) : ([a[1], a[4]])  ),
        second( ws_comment_newline, val, ws_comment_newline, op( array_sep ) )
    )(str, i)
    const array = fn(  second( array_open, op( array_values ), ws_comment_newline, array_close ), BasicArray  )
    
    // Standard Table
    const std_table_open = seq(char("["), ws)
    const std_table_close = seq(ws, char("]"))
    const std_table = (str, i) => fn(  second(std_table_open, key, std_table_close), Table  )(str, i)

    // Inline Table
    const inline_table_open = seq(char("{"), ws)
    const inline_table_close = seq(ws, char("}"))
    const inline_table_sep = seq(ws, char(","), ws)

    const inline_table_keyvals = (str, i) => fn(  seq(keyval, op(second(inline_table_sep, inline_table_keyvals))), a => a[1] ? (Array.isArray(a[1]) ? [a[0], ...a[1]] : [a[0], a[1]]) : [a[0]]  )(str, i)

    const inline_table = fn(  second(inline_table_open, op(inline_table_keyvals), inline_table_close), InlineTable  )

    // Array Table
    const array_table_open = seq(lit("[["), ws)
    const array_table_close = seq(ws, lit("]]"))
    const array_table = (str, i) => fn(  seq( array_table_open, key, array_table_close ), a => ArrayTable(a[1])  )(str, i)

    // Table
    const table = alt(std_table, array_table)

    // Key-Value pairs
    
    const dot_sep    = seq(ws, char("."), ws)
    const keyval_sep = seq(ws, char("="), ws)
    
    const unquoted_key = oneOrMoreconcat( alt ( ALPHA, DIGIT, regexp(/^(-|_)/) ) )
    const quoted_key   = alt ( basic_string, literal_string )

    const simple_key = alt( quoted_key, unquoted_key )
    const dotted_key = fn(  seq( simple_key, oneOrMore( second( dot_sep, simple_key ) ) ), a => [a[0], ...a[1]]  )
    const key = ialt( simple_key, dotted_key )

    const val = alt ( string, boolean, array, inline_table, date_time, float, integer )

    const keyval = fn(  seq( key, keyval_sep, val ), a => KeyVal(a[0], a[2])  )

    // Overall Structure
    const expression = ialt(
        second(ws, op(comment)),
        second( ws, keyval, ws, op(comment)  ),
        second( ws, table,  ws, op(comment)  )
    )

    const toml = str => fn(  seq(expression, zeroOrMore( second(newline, expression)  )), a => [a[0], ...a[1]].filter(x => x && typeof x !== "string")  )(str, 0).result

    function access(table, keys) {
        for (const k of keys) {
            if (table.pairs[k]) {
                const t = table.pairs[k]
                if (t.type === "Table" || t.type === "InlineTable") {
                    table = t
                } else if (t.type === "ArrayTable") {
                    table = t.tables[t.tables.length - 1]
                } else {
                    throw `${k} is non table`
                }
            } else {
                table.pairs[k] = Table(k)
                table = table.pairs[k]
            }
        }
        return table
    }

    function evaluate(tl) {
        const root = Table("root")
        let table = root

        for (const e of tl) {
            if (e.type === "KeyVal") {
                if (Array.isArray(e.key)) {
                    const myTable = access(table, e.key.slice(0, -1))
                    myTable.pairs[e.key[e.key.length - 1]] = e.val
                } else {
                    table.pairs[e.key] = e.val
                }
            } else if (e.type === "Table") {
                let parent = root

                // Busca al parent si es dotted key
                if (Array.isArray(e.name)) {
                    parent = access(root, e.name.slice(0, -1))
                    e.name = e.name[e.name.length - 1]
                }

                if (parent.pairs[e.name]) {
                    console.error(`Can't redefine key ${e.name}`)
                    return
                }

                parent.pairs[e.name] = e
                table = e
            } else if (e.type === "ArrayTable") {
                let parent = root

                // Busca al parent si es dotted key
                if (Array.isArray(e.name)) {
                    parent = access(root, e.name.slice(0, -1))
                    e.name = e.name[e.name.length - 1]
                }

                let me = e
                if (parent.pairs[e.name]) {
                    if (parent.pairs[e.name].type !== "ArrayTable") {
                        console.error(`Can't redefine key ${e.name}`)
                        return
                    } else {
                        me = parent.pairs[e.name]
                    }
                } else {
                    parent.pairs[e.name] = e
                }
                table = Table("")
                me.tables.push(table)
            } else {
                console.error("Unexpected:", e)
            }
        }

        return root.eval()
    }

    return {
        parse: e => evaluate(toml(e))
    }

 })()
