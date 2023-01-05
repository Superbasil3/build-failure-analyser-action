##
## Lint
##

.PHONY: build
build:
	ncc build index.js --license licenses.txt
	browserify docs/javascripts/index.js -o docs/javascripts/bundle.js


.PHONY: release
release:
	npm version patch -m "[RELEASE] Version %s"
	npm install
