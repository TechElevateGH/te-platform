# TechElevate Backend

FastAPI backend for the TechElevate platform.

## Database & Storage

- **Database**: MongoDB Atlas (cloud-hosted)
- **File Storage**: Google Drive for resume files
- **Connection**: Managed via environment variables

## Quick Start

### Prerequisites

- Python 3.10+
- MongoDB Atlas account (connection string in `.env`)
- Google Drive API credentials (for file storage)

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

# Google Drive (for resume storage)
GDRIVE_RESUMES = your-folder-id
GDRIVE_OTHER_FILES = your-folder-id
GDRIVE_LESSONS = your-folder-id
```

### Database Collections

MongoDB automatically creates collections on first insert:

- `users` - User accounts and profiles
- `companies` - Company information
- `applications` - Job applications
- `referrals` - Referral requests
- `files` - File metadata (actual files in Google Drive)
- `lessons` - Learning materials

## Notes

📦 **MongoDB**: Data persists across server restarts in MongoDB Atlas

📁 **File Storage**: Resume files stored in Google Drive, metadata in MongoDB

🧹 **Clean Setup**: No SQLAlchemy, Alembic, or Docker - simple MongoDB integration


