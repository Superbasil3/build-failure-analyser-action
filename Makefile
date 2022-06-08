##
## Lint
##

.PHONY: build
build:
	ncc build index.js --license licenses.txt
