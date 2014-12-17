var StandardError = require("standard-error")
var ERRORS = require("./errors")
var indexOf = Array.prototype.indexOf
module.exports = PgError

function PgError(fields) {
  if (fields == null) fields = Object

  StandardError.call(this, fields.M, {
    // Perhaps severity should be lowercased at one point to be consistent with
    // condition. But that would differ from node-pg's default behavior.
    severity: fields.S,
    code: fields.C,
    condition: ERRORS[fields.C],
    detail: fields.D,
    hint: fields.H,
    position: fields.P && Number(fields.P),
    internalPosition: fields.p && Number(fields.p),
    internalQuery: fields.q,
    where: fields.W,
    schema: fields.s,
    table: fields.t,
    column: fields.c,
    dataType: fields.d,
    constraint: fields.n,
    file: fields.F,
    line: fields.L && Number(fields.L),
    routine: fields.R
  })
}

PgError.prototype = Object.create(StandardError.prototype, {
  constructor: {value: PgError, configurable: true, writeable: true}
})

PgError.parse = function(buffer) {
  return new PgError(parse(buffer))
}

// http://www.postgresql.org/docs/9.3/static/protocol-message-types.html
// http://www.postgresql.org/docs/9.3/static/protocol-message-formats.html
// Not yet sure of the encoding of those strings...
function parse(buffer) {
  var p = 0, type, fields = {}

  // This could've been written with String.prototype.split as well.
  // I wonder which is faster. Does it really matter though? Who has that many
  // errors anyway.
  while ((type = String.fromCharCode(buffer[p++])) != "\0") {
    fields[type] = buffer.toString("utf8", p, p = indexOf.call(buffer, 0, p))
    ;++p
  }

  return fields
}
