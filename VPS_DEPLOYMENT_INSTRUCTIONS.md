# WBUK AI Triage - VPS Deployment Instructions

## Requirements
- Ubuntu 22.04 LTS VPS (minimum 4GB RAM, 2 vCPUs)
- Domain name pointing to VPS IP
- SSH access

---

## Step 1: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y curl wget git ufw fail2ban

# Create deploy user (optional)
sudo adduser wbuk
sudo usermod -aG sudo wbuk
```

---

## Step 2: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

---

## Step 3: Configure Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Step 4: Clone Repository

```bash
# Clone from your GitHub
git clone https://github.com/andrewdunn358-dev/wbuk-ai-triage.git
cd wbuk-ai-triage
```

---

## Step 5: Configure Environment Variables

### Backend (.env)
Create `/app/backend/.env`:
```bash
MONGO_URL="mongodb://mongodb:27017"
DB_NAME="wbuk_triage"
CORS_ORIGINS="https://yourdomain.com"
EMERGENT_LLM_KEY=sk-emergent-dD2650e666225B99f9
JWT_SECRET=your-secure-random-secret-here-change-this
```

### Frontend (.env)
Create `/app/frontend/.env`:
```bash
REACT_APP_BACKEND_URL=https://yourdomain.com
```

---

## Step 6: Create Docker Compose File

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

  frontend:
    build: ./frontend
    expose:
      - "3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  backend:
    build: ./backend
    expose:
      - "8001"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=wbuk_triage
    env_file:
      - ./backend/.env
    depends_on:
      - mongodb
    restart: unless-stopped

  mongodb:
    image: mongo:7.0
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

  certbot:
    image: certbot/certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot

volumes:
  mongodb_data:
```

---

## Step 7: Create Dockerfiles

### Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Frontend Dockerfile (`frontend/Dockerfile`)
```dockerfile
FROM node:20-alpine as build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
```

---

## Step 8: NGINX Configuration

Create `nginx/nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    
    upstream frontend {
        server frontend:3000;
    }
    
    upstream backend {
        server backend:8001;
    }
    
    server {
        listen 80;
        server_name yourdomain.com;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 301 https://$server_name$request_uri;
        }
    }
    
    server {
        listen 443 ssl;
        server_name yourdomain.com;
        
        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        location /api/ {
            proxy_pass http://backend/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_read_timeout 120s;
        }
        
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
        }
    }
}
```

---

## Step 9: SSL Certificate Setup

```bash
# Create directories
mkdir -p certbot/conf certbot/www

# Get initial certificate (replace with your domain)
docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot -d yourdomain.com
```

---

## Step 10: Deploy

```bash
# Build and start
docker-compose build
docker-compose up -d

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

---

## Step 11: Verify Deployment

1. Visit `https://yourdomain.com` - Landing page should load
2. Click "Start Confidential Chat" - Chat should work
3. Visit `https://yourdomain.com/admin` - Admin login should work

---

## Maintenance Commands

```bash
# Restart services
docker-compose restart

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Update deployment
git pull
docker-compose build
docker-compose up -d

# Backup MongoDB
docker exec -it wbuk-mongodb mongodump --out /backup

# Renew SSL (auto via certbot)
docker-compose run --rm certbot renew
```

---

## Admin Credentials

Initial admin account:
- Email: `andyd358@hotmail.com`
- Password: `WBUKAdmin2026!`

**IMPORTANT:** Change this password after first login!

---

## Security Checklist

- [ ] Change JWT_SECRET to a secure random value
- [ ] Change admin password
- [ ] Configure firewall (UFW)
- [ ] Enable fail2ban
- [ ] Set up SSL certificate auto-renewal
- [ ] Configure backup schedule
- [ ] Review CORS settings

---

## Support

For issues, contact WBUK technical team or refer to the comprehensive recommendations document: `WBUK_AI_TRIAGE_RECOMMENDATIONS.md`
