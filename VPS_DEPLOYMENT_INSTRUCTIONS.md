# WBUK AI Triage Platform - VPS Deployment Instructions

## Requirements
- **Ubuntu 24.04 LTS** (fresh install recommended)
- **Minimum specs:** 2 CPU, 4GB RAM, 20GB storage
- **Root/sudo access**
- **Domain name** (optional but recommended for SSL)

---

## Option 1: Interactive Installation Wizard (Recommended)

Run this single command as root:

```bash
curl -sSL https://raw.githubusercontent.com/andrewdunn358-dev/wbuk-ai-triage/main/deploy/install-wizard.sh | sudo bash
```

### The wizard will ask you for:

1. **Domain or IP address**
   - Enter your domain (e.g., `whistleblower.example.com`)
   - Or just press Enter to use your server's IP

2. **SSL Certificate** (if using a domain)
   - Choose Yes to set up HTTPS with Let's Encrypt
   - Your domain must already point to the server's IP

3. **Admin Account**
   - Name (e.g., `Anthony`)
   - Email (e.g., `anthony@wbuk.org`)
   - Password (minimum 8 characters)

4. **AI Provider** - Choose one:
   | Option | Provider | Notes |
   |--------|----------|-------|
   | 1 | Emergent Universal Key | Recommended - access to GPT-5.2, Claude, Gemini |
   | 2 | OpenAI Direct | Requires OpenAI API key |
   | 3 | Anthropic Claude | Requires Anthropic API key |
   | 4 | Google Gemini | Requires Google AI API key |
   | 5 | Ollama (Local) | Free, runs on server, needs 8GB+ RAM |

5. **Site Access Password**
   - Password to protect the site from casual visitors
   - Default: `WBUK2026`

### After installation completes:

Your credentials will be saved to:
```
/opt/wbuk-triage/CREDENTIALS.txt
```

**IMPORTANT:** Note down the credentials and delete this file for security!

---

## Option 2: Manual Installation

```bash
# 1. Install Docker (if not already installed)
curl -fsSL https://get.docker.com | sudo sh

# 2. Clone the repository
sudo git clone https://github.com/andrewdunn358-dev/wbuk-ai-triage.git /opt/wbuk-triage

# 3. Navigate to deploy folder
cd /opt/wbuk-triage/deploy

# 4. Copy and edit the environment file
sudo cp .env.template .env
sudo nano .env

# 5. Build and start
sudo docker compose up -d --build
```

### Environment Variables (.env file)

```env
PUBLIC_URL=https://your-domain.com
MONGO_USER=wbukadmin
MONGO_PASSWORD=your-secure-password
MINIO_USER=minioadmin
MINIO_PASSWORD=your-secure-password
JWT_SECRET=your-32-char-secret-key
AI_PROVIDER=emergent
AI_API_KEY=your-api-key
EMERGENT_LLM_KEY=your-emergent-key
SITE_PASSWORD=WBUK2026
```

---

## Accessing the Platform

| What | URL |
|------|-----|
| Main Site | `https://your-domain.com` |
| Admin Dashboard | `https://your-domain.com/admin` |
| MinIO Console | `https://your-domain.com:9001` |

### First Login:
1. Go to the main site
2. Enter the **Site Access Password** (default: `WBUK2026`)
3. For admin access, go to `/admin` and use your admin credentials

---

## Useful Commands

```bash
# Navigate to the deploy folder first
cd /opt/wbuk-triage/deploy

# Check status of all services
docker ps

# View live logs
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# Restart all services
docker compose restart

# Restart just the backend
docker compose restart backend

# Stop everything
docker compose down

# Start everything
docker compose up -d

# Rebuild after code changes
docker compose up -d --build
```

---

## SSL Certificate Setup (If Not Done During Install)

```bash
# Install certbot
sudo apt install certbot -y

# Get certificate (stop services first)
cd /opt/wbuk-triage/deploy
docker compose down
sudo certbot certonly --standalone -d your-domain.com

# Update .env to use https
sudo nano .env
# Change: PUBLIC_URL=https://your-domain.com

# Restart services
docker compose up -d
```

---

## Troubleshooting

### Services not starting?
```bash
# Check Docker logs
docker compose logs

# Check if ports are in use
sudo lsof -i :80
sudo lsof -i :443
```

### Database connection issues?
```bash
# Check MongoDB is running
docker ps | grep mongodb

# View MongoDB logs
docker compose logs mongodb
```

### AI not responding?
```bash
# Check backend logs for API errors
docker compose logs backend | grep -i error

# Verify API key is set
docker compose exec backend env | grep AI
```

### Need to reset admin password?
```bash
# Connect to the backend container and run Python
docker compose exec backend python3 << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import hashlib
import os

async def reset_admin():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client['wbuk_triage']
    
    new_password = "NewPassword123!"  # Change this
    email = "your-admin@email.com"    # Change this
    
    email_hash = hashlib.sha256(email.lower().encode()).hexdigest()
    password_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    
    await db.admin_users.update_one(
        {"email_hash": email_hash},
        {"$set": {"password_hash": password_hash}}
    )
    print(f"Password reset for {email}")

asyncio.run(reset_admin())
EOF
```

---

## Firewall Configuration

The installer automatically configures UFW, but if needed:

```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 9001  # MinIO Console (optional)
sudo ufw enable
```

---

## Backup

### Database backup:
```bash
docker compose exec mongodb mongodump --out /data/backup
docker cp wbuk-mongodb:/data/backup ./mongodb-backup-$(date +%Y%m%d)
```

### Full backup:
```bash
sudo tar -czvf wbuk-backup-$(date +%Y%m%d).tar.gz /opt/wbuk-triage
```

---

## Support

For issues or questions:
- Check the logs first: `docker compose logs -f`
- GitHub Issues: https://github.com/andrewdunn358-dev/wbuk-ai-triage/issues

---

**Last Updated:** March 2026
