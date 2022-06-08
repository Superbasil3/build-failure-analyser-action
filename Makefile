##
## Lint
##

.PHONY: build
build:
	ncc build index.js --license licenses.txt
	git add .
	git commit -m "Make build"
	git tag -f -a -m "Tag release" v0.3.3
	git push --follow-tags
