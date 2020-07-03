NODE_OPTS = --harmony
TEST_OPTS =
ERRORS_URL = https://raw.githubusercontent.com/postgres/postgres/master/src/backend/utils/errcodes.txt

love:
	@echo "Feel like makin' love."

test:
	@node $(NODE_OPTS) ./node_modules/.bin/_mocha -R dot $(TEST_OPTS)

spec:
	@node $(NODE_OPTS) ./node_modules/.bin/_mocha -R spec $(TEST_OPTS)

autotest:
	@node $(NODE_OPTS) ./node_modules/.bin/_mocha -R dot --watch $(TEST_OPTS)

autospec:
	@node $(NODE_OPTS) ./node_modules/.bin/_mocha -R spec --watch $(TEST_OPTS)

pack:
	npm pack

publish:
	npm publish

tag:
	git tag "v$$(node -e 'console.log(require("./package").version)')"

errors.json:
	wget $(ERRORS_URL) -O- | sed -Ef errors_to_json.sed > "$@"

db/create:
	createdb -E utf8 -T template0 pg_error_test

db/drop:
	dropdb pg_error_test

clean:
	rm -f *.tgz
	npm prune --production

.PHONY: love
.PHONY: test spec autotest autospec
.PHONY: pack publish tag
.PHONY: errors.json
.PHONY: db/create db/drop
.PHONY: clean
