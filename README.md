PgError.js
==========
[![NPM version][npm-badge]](http://badge.fury.io/js/pg-error)
[npm-badge]: https://badge.fury.io/js/pg-error.png

**PgError.js** is an error class for Node.js that parses [PostgreSQL's
ErrorResponse format][pg-formats] and names its fields with **human readable
properties**.  It's most useful when combined with [Brian Carlson][brianc]'s
[Node.js PostgreSQL client library][node-pg] to get **structured** and
**identifiable** PostgreSQL errors.  Supports all fields returned by PostgreSQL
up to v9.4.

The PostgreSQL client library does return an `Error` object with some fields
set, but it's not a dedicated object for easy `instanceof` identification nor
does it yet support all field types.  I've found it immensely useful to be
strict and classify errors beforehand when building fault tolerant systems. That
helps programmatically decide whether to wrap, escalate or handle a particular
error.

[pg-formats]: http://www.postgresql.org/docs/9.3/static/protocol-message-formats.html
[pg-fields]: http://www.postgresql.org/docs/9.3/static/protocol-error-fields.html
[brianc]: https://github.com/brianc
[node-pg]: https://github.com/brianc/node-postgres


Installing
----------
```
npm install pg-error
```

PgError.js follows [semantic versioning](http://semver.org/), so feel free to
depend on its major version with something like `>= 1.0.0 < 2` (a.k.a `^1.0.0`).


Using
-----
```javascript
var PgError = require("pg-error")

var error = new PgError({
  M: "null value in column \"name\" violates not-null constraint",
  S: "ERROR",
  C: "23502"
})

error instanceof PgError // => true
error instanceof Error // => true

error.message // => "null value in column \"name\" violates not-null constraint"
error.severity // => "ERROR"
error.code // => 23502
```

### Parsing [PostgreSQL's ErrorResponse][pg-formats]
```javascript
var msg = new Buffer("MWash your teeth!\0SWARNING\0\0")
var error = PgError.parse(msg)
error.message // => "Wash your teeth!"
error.severity // => "WARNING"
```

### Using with [Node.js PostgreSQL client library][node-pg]
The client does its error and notice parsing on the `Pg.Connection` object.
You can get an active instance of it after connecting from `Pg.Client`:

```javascript
var Pg = require("pg")
var pg = new Pg.Client({host: "/tmp", database: "pg_error_test"})
var connection = pg.connection
```

You'll have to swap out two functions, `Pg.Connection.prototype.parseE` and
`Pg.Connection.prototype.parseN`, for parsing errors and notices respectively:

```javascript
connection.parseE = PgError.parse
connection.parseN = PgError.parse
```

If you want every connection instance to parse errors to `PgError`, set them on the `Pg.Connection` prototype:

```javascript
Pg.Connection.prototype.parseE = PgError.parse
Pg.Connection.prototype.parseN = PgError.parse
```

However, the way the client is built, it will start emitting those errors and
notices under the `PgError` event name. Until that's improved in the
`Pg.Connection` class, you'll need to re-emit those under the correct `error`
and `notice` events:

```javascript
function emitPgError(err) {
  switch (err.severity) {
    case "ERROR":
    case "FATAL":
    case "PANIC": return this.emit("error", err)
    default: return this.emit("notice", err)
  }
}

connection.on("PgError", emitPgError)
```

That's it. Your Pg query errors should now be instances of `PgError` and with
all the human readable field names.

### Properties on an instance of PgError
For descriptions of the properties, please see [PostgreSQL's Error and Notice
Message Fields][pg-fields].

Property         | Field | Description
-----------------|---|----------------
severity         | S |
code             | C |
condition        |   | Code name in lowercase according to [errcodes.txt][].
detail           | D |
hint             | H |
position         | P | Position parsed to a `Number`.
internalPosition | p | Internal position parsed to a `Number`.
internalQuery    | q |
where            | W |
schema           | s |
table            | t |
column           | c |
dataType         | d |
constraint       | n |
file             | F |
line             | L |  Line parsed to a `Number`.
routine          | R |

[errcodes.txt]: https://github.com/postgres/postgres/blob/master/src/backend/utils/errcodes.txt


License
-------
PgError.js is released under a *Lesser GNU Affero General Public License*, which
in summary means:

- You **can** use this program for **no cost**.
- You **can** use this program for **both personal and commercial reasons**.
- You **do not have to share your own program's code** which uses this program.
- You **have to share modifications** (e.g. bug-fixes) you've made to this
  program.

For more convoluted language, see the `LICENSE` file.


About
-----
**[Andri Möll][moll]** typed this and the code.  
[Monday Calendar][monday] supported the engineering work.

If you find PgError.js needs improving, please don't hesitate to type to me now
at [andri@dot.ee][email] or [create an issue online][issues].

[email]: mailto:andri@dot.ee
[issues]: https://github.com/moll/node-pg-error/issues
[moll]: http://themoll.com
[monday]: https://mondayapp.com
