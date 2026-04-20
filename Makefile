.PHONY: up down test logs

up:
	@echo "Configure this command for your project (e.g., docker-compose up -d)"

down:
	@echo "Configure this command for your project (e.g., docker-compose down)"

test:
	npm test

logs:
	@echo "Configure this command for your project (e.g., docker-compose logs -f)"
