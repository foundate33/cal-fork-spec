.PHONY: help install generate mock serve clean all

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm ci

generate: ## Compile TypeSpec to OpenAPI spec
	npm run generate

mock: generate ## Start Prism mock server
	npm run mock

serve: ## Serve Swagger UI locally (requires Python 3)
	python3 -m http.server 8080

clean: ## Remove generated output
	rm -rf tsp-output/

all: install generate ## Install deps and generate spec