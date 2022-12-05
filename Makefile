##
## Lint
##

.PHONY: build
build:
	ncc build index.js --license licenses.txt
	git add .
	git commit -m "Make build"
	git tag -d v0.3.3
	git push origin :refs/tags/v0.3.3
	git tag -a -m "Tag release" v0.3.3
	git push --follow-tags

.PHONY: release
release:
	ncc build index.js --license licenses.txt
	git add dist/
	git commit -m "[RELEASE] Update "
	pnpm version minor -m "[RELEASE] Version %s"
	git push --follow-tags
