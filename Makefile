##
## Lint
##

.PHONY: build
build:
	ncc build index.js --license licenses.txt

.PHONY: release
release:
	npm install
	git add .
	git commit -m "Npm build for release"
	pnpm version patch -m "[RELEASE] Version %s"
	git push --follow-tags
