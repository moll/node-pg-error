var PgError = require("..")

var Pg = require("pg")
Pg.Connection.prototype.parseE = PgError.parse
Pg.Connection.prototype.parseN = PgError.parse

var pg = new Pg.Client({host: "/tmp", database: "pg_error_test"})

pg.connection.on("PgError", function(err) {
  switch (err.severity) {
    case "ERROR":
    case "FATAL":
    case "PANIC": return this.emit("error", err)
    default: return this.emit("notice", err)
  }
})

describe("PgError", function() {
  describe("new", function() {
    it("must be an instance of PgError", function() {
      new PgError().must.be.an.instanceof(PgError)
    })

    it("must be an instance of Error", function() {
      new PgError().must.be.an.instanceof(Error)
    })

    it("must assign all fields to names", function() {
      var err = new PgError({
        M: "null value in column \"name\" violates not-null constraint",
        S: "ERROR",
        C: "23502",
        D: "Failing row contains (1, null).",
        H: "Don't put nulls, girl.",
        P: "3",
        p: "5",
        q: "INSERT INTO",
        W: "Here.\nAnd there.",
        s: "public",
        t: "models",
        c: "name",
        d: "NULL",
        n: "no_nulls_allowed",
        F: "execMain.c",
        L: "1611",
        R: "ExecConstraints"
      })

      var msg = "null value in column \"name\" violates not-null constraint"
      err.message.must.equal(msg)
      err.severity.must.equal("ERROR")
      err.code.must.equal("23502")
      err.detail.must.equal("Failing row contains (1, null).")
      err.hint.must.equal("Don't put nulls, girl.")
      err.position.must.equal(3)
      err.internalPosition.must.equal(5)
      err.internalQuery.must.equal("INSERT INTO")
      err.where.must.equal("Here.\nAnd there.")
      err.schema.must.equal("public")
      err.table.must.equal("models")
      err.column.must.equal("name")
      err.dataType.must.equal("NULL")
      err.constraint.must.equal("no_nulls_allowed")
      err.file.must.equal("execMain.c")
      err.line.must.equal(1611)
      err.routine.must.equal("ExecConstraints")
    })

    it("must set condition based on code", function() {
      new PgError({C: "23502"}).condition.must.equal("not_null_violation")
    })

    it("must parse code as string", function() {
      new PgError({C: "42P17"}).code.must.equal("42P17")
    })

    it("must parse line to number", function() {
      new PgError({L: "1337"}).line.must.equal(1337)
    })

    it("must leave line as undefined if not given", function() {
      new PgError().must.have.property("line", undefined)
    })

    it("must parse position to number", function() {
      new PgError({P: "1337"}).position.must.equal(1337)
    })

    it("must leave position as undefined if not given", function() {
      new PgError().must.have.property("position", undefined)
    })

    it("must parse internal position to number", function() {
      new PgError({p: "1337"}).internalPosition.must.equal(1337)
    })

    it("must leave internal position as undefined if not given", function() {
      new PgError().must.have.property("internalPosition", undefined)
    })
  })

  describe(".parse", function() {
    it("must parse a null separated buffer of fields", function() {
      var data = ""
      data += "Mnull value in column \"name\" violates not-null constraint\0"
      data += "SERROR\0"
      data += "C23502\0"
      data += "DFailing row contains (1, null).\0"
      data += "spublic\0"
      data += "tmodels\0"
      data += "cname\0"
      data += "FexecMain.c\0"
      data += "L1611\0"
      data += "RExecConstraints\0"

      var err = PgError.parse(new Buffer(data + "\0"))
      err.must.be.an.instanceof(PgError)

      var msg = "null value in column \"name\" violates not-null constraint"
      err.message.must.equal(msg)
      err.severity.must.equal("ERROR")
      err.code.must.equal("23502")
      err.detail.must.equal("Failing row contains (1, null).")
      err.schema.must.equal("public")
      err.table.must.equal("models")
      err.column.must.equal("name")
      err.file.must.equal("execMain.c")
      err.line.must.equal(1611)
      err.routine.must.equal("ExecConstraints")
    })
  })
})

describe("Pg.Connection", function() {
  before(function(done) { pg.connect(done) })
  before(function(done) { pg.query("SET client_min_messages TO DEBUG", done) })
  after(function() { pg.end() })

  beforeEach(function(done) { pg.query("BEGIN", done) })
  afterEach(function(done) { pg.query("ROLLBACK", done) })
  it("must emit query errors as PgError", function*() {
    yield pg.query.bind(pg, 'CREATE TABLE "models" (' +
                   '"serial" SERIAL,' +
                   '"name" TEXT NOT NULL' +
                   ')')

    var err
    try { yield pg.query.bind(pg, 'INSERT INTO "models" DEFAULT VALUES') }
    catch (ex) { err = ex }

    err.must.be.an.instanceof(PgError)
    err.severity.must.equal("ERROR")
    err.condition.must.equal("not_null_violation")
    err.table.must.equal("models")
    err.column.must.equal("name")
  })

  it("must emit EXCEPTION as an error", function*() {
    var err
    try {
    yield pg.query.bind(pg, "DO language plpgsql $$\n" +
                        "BEGIN\n" +
                        "RAISE EXCEPTION 'Pay attention!';\n" +
                        "END\n" +
                        "$$")
    } catch (ex) { err = ex }

    err.must.be.an.instanceof(PgError)
    err.message.must.equal("Pay attention!")
    err.severity.must.equal("ERROR")
  })

  ;["WARNING", "NOTICE", "INFO", "LOG", "DEBUG"].forEach(function(severity) {
    it("must emit " + severity + " as a notice", function*() {
      var notice; pg.once("notice", function(msg) { notice = msg })

      yield pg.query.bind(pg, "DO language plpgsql $$\n" +
                          "BEGIN\n" +
                          "RAISE " + severity + " 'Pay attention!';\n" +
                          "END\n" +
                          "$$")

      notice.must.be.an.instanceof(PgError)
      notice.message.must.equal("Pay attention!")
      notice.severity.must.equal(severity)
    })
  })
})
