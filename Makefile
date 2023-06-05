.DEFAULT_GOAL := help
.PHONY: help
help: ## Show this help
	@echo "Usage: make [target], target(s) are:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-38s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: build
build: ## Build the project
	ncc build src/index.js --license licenses.txt
	browserify docs/javascripts/index.js -o docs/javascripts/bundle.js

.PHONY: release
release: ## Run install
	npm install

.PHONY: tag
tag: ## Tag the current version
	npm version patch -m "[RELEASE] Version %s"

# Action that will run the build, release and tag
.PHONY: release-all
release-all: tag build release ## Run the build, release and tag, then add and push the tag
	git add .
	git commit -m "[RELEASE][skip ci] Version $(shell cat package.json | jq -r '.version')" || true
	git push --tags
