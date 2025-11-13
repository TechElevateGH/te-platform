# Clean up generated files and directories
clean:
	@echo "Cleaning up..."
	find . -type d -name "__pycache__" -exec rm -rf {} +

format:
	@echo "Fixing imports..."
	ruff . --fix
	isort .

pyre:
	@echo "Running Pyre..."
	watchman watch .
	pyre

# Start frontend only
frontend:
	@echo "Starting frontend server..."
	cd te-frontend && npm start

# Switch frontend to use local backend
frontend-local:
	@echo "Switching frontend to LOCAL backend (http://localhost:8000/v1/)..."
	@if [ -f te-frontend/.env.local.backup ]; then \
		mv te-frontend/.env.local.backup te-frontend/.env.local; \
		echo "✅ Switched to LOCAL backend"; \
	else \
		echo "✅ Already using LOCAL backend"; \
	fi

# Switch frontend to use production backend
frontend-prod:
	@echo "Switching frontend to PRODUCTION backend (https://te-platform.onrender.com/v1/)..."
	@if [ -f te-frontend/.env.local ]; then \
		mv te-frontend/.env.local te-frontend/.env.local.backup; \
		echo "✅ Switched to PRODUCTION backend"; \
	else \
		echo "✅ Already using PRODUCTION backend"; \
	fi

# Check current frontend backend configuration
frontend-status:
	@if [ -f te-frontend/.env.local ]; then \
		echo "📍 Current: LOCAL backend (http://localhost:8000/v1/)"; \
	else \
		echo "📍 Current: PRODUCTION backend (https://te-platform.onrender.com/v1/)"; \
	fi

# Start backend only (in venv)
backend:
	@echo "Starting backend server in virtual environment..."
	cd te-backend && . venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Start both frontend and backend
start:
	@echo "Starting both frontend and backend..."
	@$(MAKE) backend & $(MAKE) frontend

# Legacy aliases
local-frontend: frontend
local-backend: backend

build:
	@echo "Building Docker containers..."
	docker-compose build --no-cache

run:
	@echo "Running Docker containers..."
	docker-compose up

container:
	@echo "Building Docker containers..."
	docker-compose build --no-cache

	@echo "Running Docker containers..."
	docker-compose up


# Phony targets
.PHONY: install api clean fix-imports pyre server build run format all frontend backend start local-frontend local-backend frontend-local frontend-prod frontend-status

# Default target
all: install api
