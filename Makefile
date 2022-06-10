##
## Lint
##

.PHONY: build
build:
	ncc build src/index.js --license LICENSE -o dist/
	git add .
	git commit -m "Make build"
	git tag -d v0.3.3
	git push origin :refs/tags/v0.3.3
	git tag -a -m "Tag release" v0.3.3
	git push --follow-tags
