##
## Lint
##

.PHONY: build_on_branch
build_on_branch:
	export BRANCH=$(git rev-parse --abbrev-ref HEAD);
	echo "BRANCH: ${BRANCH}"
	ncc build src/index.js --license LICENSE -o dist/
	git add .
	git commit -m "[${BRANCH}] New version"
	npm version patch -m "v%s"
	node -p "require('./package.json').version" > VERSION.txt
	VERSION=$(cat VERSION.txt)
	rm VERSION.txt
	echo "VERSION ${VERSION}"

	sed -i -e "s/@v.*/@v${VERSION}/g"  .github/workflows/pr-validation.yml
	mv -f .github/workflows/pr-validation.yml-e .github/workflows/pr-validation.yml
	git tag -d "v${VERSION}"
	git push origin ":refs/tags/v${VERSION}"
	git tag -a -m "Tag release ${VERSION}" "v${VERSION}"
	git push --follow-tags