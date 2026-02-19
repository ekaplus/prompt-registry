.PHONY: help build run stop restart logs shell db-init db-seed db-reset clean

help:
	@echo "Prompts.Chat Docker Commands"
	@echo "============================"
	@echo ""
	@echo "  make build      - Build Docker image"
	@echo "  make run        - Start application"
	@echo "  make stop       - Stop application"
	@echo "  make restart    - Restart application"
	@echo "  make logs       - View application logs"
	@echo "  make shell      - Open shell in container"
	@echo "  make db-init    - Initialize database (migrations)"
	@echo "  make db-seed    - Seed database with data"
	@echo "  make db-reset   - Reset admin password"
	@echo "  make clean      - Remove containers and volumes"
	@echo ""

build:
	@bash scripts/docker-build.sh

run:
	@bash scripts/docker-run.sh

stop:
	@docker-compose -f docker-custom/docker-compose.yml --env-file docker-custom/.env.docker down

restart:
	@docker-compose -f docker-custom/docker-compose.yml --env-file docker-custom/.env.docker restart app

logs:
	@docker-compose -f docker-custom/docker-compose.yml --env-file docker-custom/.env.docker logs -f app

shell:
	@docker-compose -f docker-custom/docker-compose.yml --env-file docker-custom/.env.docker exec app /bin/bash

db-init:
	@bash scripts/docker-db-init.sh

db-seed:
	@bash scripts/docker-db-seed.sh

db-reset:
	@docker-compose -f docker-custom/docker-compose.yml --env-file docker-custom/.env.docker run --rm app /bin/bash /app/scripts/db-reset-admin.sh

clean:
	@docker-compose -f docker-custom/docker-compose.yml --env-file docker-custom/.env.docker down -v
	@docker rmi prompts-chat:latest 2>/dev/null || true
	@echo "✅ Cleanup complete"
