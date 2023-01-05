##
## Lint
##

.PHONY: build
build:
	ncc build index.js --license licenses.txt
	browserify docs/javascripts/index.js -o docs/javascripts/bundle.js


.PHONY: release
release:
	npm install ncc
	npm install
	git add .
	git commit -m "Npm build for release"
	pnpm version patch -m "[RELEASE] Version %s"
	git push --follow-tags

