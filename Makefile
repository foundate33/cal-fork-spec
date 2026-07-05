.PHONY: help install generate mock serve clean all \
	frontend-install frontend-dev frontend-build frontend-lint frontend-verify frontend-preview frontend-clean \
	backend-install backend-build backend-run backend-lint backend-test backend-clean \
	verify dev clean-all

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install root (TypeSpec) dependencies
	npm ci

generate: ## Compile TypeSpec to OpenAPI spec
	npm run generate

mock: generate ## Start Prism mock server
	npm run mock

serve: ## Serve Swagger UI locally (requires Python 3)
	python3 -m http.server 8080

clean: ## Remove generated TypeSpec output
	rm -rf tsp-output/

frontend-install: ## Install frontend dependencies
	cd frontend && npm install

frontend-dev: ## Start the frontend Vite dev server
	cd frontend && npm run dev

frontend-build: ## Type-check and build the frontend for production
	cd frontend && npm run build

frontend-lint: ## Lint the frontend with oxlint
	cd frontend && npm run lint

frontend-verify: frontend-lint frontend-build ## Lint, type-check and build the frontend

frontend-preview: ## Preview the frontend production build
	cd frontend && npm run preview

frontend-clean: ## Remove frontend build output
	rm -rf frontend/dist

dev: ## Run the mock server and frontend dev server together
	$(MAKE) -j2 mock frontend-dev

backend-install: ## Generate Gradle wrapper for the backend
	cd backend && gradle wrapper --gradle-version=8.12

backend-build: ## Build the backend
	cd backend && ./gradlew build

backend-run: ## Run the backend Spring Boot server
	cd backend && ./gradlew bootRun

backend-lint: ## Lint the backend with ktlint
	cd backend && ./gradlew ktlintCheck

backend-test: ## Run backend tests
	cd backend && ./gradlew test

backend-clean: ## Remove backend build output
	rm -rf backend/build backend/.gradle

clean-all: clean frontend-clean backend-clean ## Remove all generated output

verify: frontend-verify backend-lint backend-test ## Lint, type-check and build everything, run backend tests

all: install frontend-install generate ## Install all dependencies (root + frontend) and generate the spec
