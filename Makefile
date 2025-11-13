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

# Start frontend with local backend (development mode)
frontend-dev:
	@echo "🚀 Starting DEVELOPMENT mode..."
	@echo "   - Frontend: http://localhost:3000"
	@echo "   - Backend: http://localhost:8000"
	@if [ ! -f te-frontend/.env.local ]; then \
		if [ -f te-frontend/.env.local.backup ]; then \
			mv te-frontend/.env.local.backup te-frontend/.env.local; \
		else \
			cp te-frontend/.env te-frontend/.env.local; \
			echo "REACT_APP_API_URL=http://localhost:8000/v1/" >> te-frontend/.env.local; \
		fi; \
	fi
	@echo "✅ Configured to use LOCAL backend"
	@cd te-frontend && npm start

# Start frontend with production backend (testing mode)
frontend-prod:
	@echo "🌐 Starting PRODUCTION mode..."
	@echo "   - Frontend: http://localhost:3000"
	@echo "   - Backend: https://te-platform.onrender.com"
	@if [ -f te-frontend/.env.local ]; then \
		mv te-frontend/.env.local te-frontend/.env.local.backup; \
	fi
	@echo "✅ Configured to use PRODUCTION backend"
	@cd te-frontend && npm start

# Start frontend only (uses current configuration)
frontend:
	@echo "Starting frontend server..."
	@$(MAKE) frontend-status
	@cd te-frontend && npm start

# Switch frontend to use local backend (without starting server)
frontend-use-local:
	@echo "Switching frontend to LOCAL backend (http://localhost:8000/v1/)..."
	@if [ -f te-frontend/.env.local.backup ]; then \
		mv te-frontend/.env.local.backup te-frontend/.env.local; \
		echo "✅ Switched to LOCAL backend"; \
	else \
		echo "✅ Already using LOCAL backend"; \
	fi

# Switch frontend to use production backend (without starting server)
frontend-use-prod:
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

# Start both frontend and backend in development mode
dev:
	@echo "🚀 Starting FULL DEVELOPMENT environment..."
	@echo ""
	@echo "Starting backend server on http://localhost:8000"
	@echo "Starting frontend server on http://localhost:3000"
	@echo ""
	@echo "Press Ctrl+C to stop all services"
	@echo ""
	@$(MAKE) backend & $(MAKE) frontend-dev

# Start both frontend and backend (legacy alias)
start:
	@$(MAKE) dev

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


# Help command to show all available commands
help:
	@echo "📚 TechElevate Platform - Available Commands"
	@echo ""
	@echo "🚀 Development Commands:"
	@echo "  make dev              - Start backend + frontend (local backend)"
	@echo "  make backend          - Start backend server only (port 8000)"
	@echo "  make frontend-dev     - Start frontend with local backend"
	@echo "  make frontend-prod    - Start frontend with production backend"
	@echo ""
	@echo "🔧 Configuration Commands:"
	@echo "  make frontend-status     - Check current backend configuration"
	@echo "  make frontend-use-local  - Switch to local backend (no server start)"
	@echo "  make frontend-use-prod   - Switch to production backend (no server start)"
	@echo ""
	@echo "🧹 Utility Commands:"
	@echo "  make clean            - Remove Python cache files"
	@echo "  make format           - Format code with ruff and isort"
	@echo ""
	@echo "🐳 Docker Commands:"
	@echo "  make build            - Build Docker containers"
	@echo "  make run              - Run Docker containers"
	@echo ""
	@echo "💡 Quick Start:"
	@echo "  Local dev:   make dev"
	@echo "  Frontend only: make frontend-dev"
	@echo "  Backend only:  make backend"

# Phony targets
.PHONY: install api clean fix-imports pyre server build run format all frontend frontend-dev frontend-prod frontend-use-local frontend-use-prod backend start dev local-frontend local-backend frontend-status help

# Default target shows help
.DEFAULT_GOAL := help
