##
## Lint
##


.PHONY: build_on_branch_alpha
build_on_branch_alpha:
	ncc build src/index.js --license LICENSE -o dist/
	git add .
	git commit -m "[alpha] New version"
	git tag -d "v0.1.0"
	git push origin ":refs/tags/v0.1.0"
	git tag -a -m "Tag release 0.1.0" "v0.1.0"
	git push --follow-tags