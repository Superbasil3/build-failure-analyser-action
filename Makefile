##
## Lint
##

.PHONY: build_on_branch
build_on_branch:
	ncc build src/index.js --license LICENSE -o dist/
	git add .
	git commit -m "[$BRANCH] New version"
	npm version patch -m "v%s"
	node -p "require('./package.json').version"
	VERSION=
	BRANCH="$(git rev-parse --abbrev-ref HEAD)"
	sed -i -e "s/@v.*/@v${VERSION}/g"  .github/workflows/pr-validation.yml
	mv -f .github/workflows/pr-validation.yml-e .github/workflows/pr-validation.yml
	git tag -d "v${VERSION}"
	git push origin ":refs/tags/v${VERSION}"
	git tag -a -m "Tag release ${VERSION}" "v${VERSION}"
	git push --follow-tags