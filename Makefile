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
