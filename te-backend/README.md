# TechElevate Backend

FastAPI backend for the TechElevate platform.

## Database & Storage

- **Database**: MongoDB Atlas (cloud-hosted)
- **File Storage**: MongoDB GridFS (resumes and other uploads live in the database)
- **Connection**: Managed via environment variables

## Quick Start

### Prerequisites

- Python 3.10+
- MongoDB Atlas account (connection string in `.env`)

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

- ✓ Connect to MongoDB Atlas
- ✓ Seed initial admin user if not exists
- ✓ Be available at `http://localhost:8000`
- ✓ API docs at `http://localhost:8000/docs`

### Default Admin User

From `.env` file:

- Email: `info@techelevate.org`
- Password: `corn`
- Role: Admin (can view all referrals)

### Configuration

Edit `te-backend/.env`:

```env
# MongoDB
MONGODB_URI = mongodb+srv://te_platform_admin:!ElevatingTech!@te-platform.v91qs4k.mongodb.net/?appName=TE-Platform
MONGODB_DB_NAME = te_platform
```

### Database Collections

MongoDB automatically creates collections on first insert:

- `users` - User accounts and profiles
- `companies` - Company information
- `applications` - Job applications
- `referrals` - Referral requests
- `files.files` / `files.chunks` - GridFS collections holding uploaded files
- `lessons` - Learning materials

## Notes

📦 **MongoDB**: Data persists across server restarts in MongoDB Atlas

📁 **File Storage**: Uploaded files (resumes, lesson material) are stored in MongoDB
via GridFS. They are served by the API at `GET {API_STR}/files/{file_id}` (add
`/download` to force a download).

🧹 **Clean Setup**: No SQLAlchemy, Alembic, or Docker - simple MongoDB integration


