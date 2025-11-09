# TechElevate Backend

FastAPI backend for the TechElevate platform.

## Quick Start

The backend uses **SQLite in-memory database** for quick testing. No external database setup required!

### Running the Server

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --port 8000

# Or use the prestart script
./prestart.sh
```

The server will:

- ✓ Create all database tables automatically on startup
- ✓ Seed initial admin user from `.env` settings
- ✓ Be available at `http://localhost:8000`
- ✓ API docs at `http://localhost:8000/docs`

### Default Admin User

From `.env` file:

- Email: `info@techelevate.org`
- Password: `corn`
- Role: Admin

### Configuration

Edit `te-backend/.env` to change settings:

- Database: SQLite in-memory (configured in `app/core/settings.py`)
- CORS: Configured for `http://localhost:3000`
- JWT tokens: 8-day expiration

## Notes

⚠️ **In-memory database**: All data is lost when the server restarts. This is intentional for quick testing and development.

🧹 **Cleaned up**: PostgreSQL, Docker, and Alembic migration files have been removed. The app uses a simple in-memory database for rapid development.

