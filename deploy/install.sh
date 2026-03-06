#!/bin/bash

#############################################################################
# WBUK AI Triage Platform - Ubuntu 24.04 Install Script
#
# Usage: curl -sSL https://raw.githubusercontent.com/andrewdunn358-dev/wbuk-ai-triage/main/deploy/install.sh | bash
#
# This script will:
# 1. Install Docker and Docker Compose
# 2. Clone the repository
# 3. Configure environment variables
# 4. Build and start all services
#############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
INSTALL_DIR="/opt/wbuk-triage"
REPO_URL="https://github.com/andrewdunn358-dev/wbuk-ai-triage.git"

echo -e "${BLUE}"
echo "============================================================="
echo "     WBUK AI Triage Platform - Installation"
echo "           For Ubuntu 24.04 LTS"
echo "============================================================="
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
   echo -e "${RED}Error: This script must be run as root (use sudo)${NC}"
   exit 1
fi

echo -e "${GREEN}[1/6] Updating system packages...${NC}"
apt-get update -qq
apt-get upgrade -y -qq

echo -e "${GREEN}[2/6] Installing Docker...${NC}"
if ! command -v docker > /dev/null 2>&1; then
    apt-get install -y -qq ca-certificates curl gnupg lsb-release

    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    systemctl start docker
    systemctl enable docker

    echo -e "${GREEN}Docker installed successfully${NC}"
else
    echo -e "${YELLOW}Docker already installed${NC}"
fi

echo -e "${GREEN}[3/6] Installing Git and other dependencies...${NC}"
apt-get install -y -qq git curl openssl

echo -e "${GREEN}[4/6] Cloning repository...${NC}"
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Directory $INSTALL_DIR already exists. Removing...${NC}"
    rm -rf "$INSTALL_DIR"
fi

git clone "$REPO_URL" "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo -e "${GREEN}[5/6] Configuring environment...${NC}"

# Generate secrets
JWT_SECRET=$(openssl rand -hex 32)
MONGO_PASSWORD=$(openssl rand -hex 16)
MINIO_PASSWORD=$(openssl rand -hex 16)

echo ""
echo -e "${BLUE}=============================================================${NC}"
echo -e "${BLUE}                Configuration Required${NC}"
echo -e "${BLUE}=============================================================${NC}"
echo ""

# Get domain/IP
echo -n "Enter your domain name or public IP: "
read PUBLIC_URL
if [ -z "$PUBLIC_URL" ]; then
    PUBLIC_URL="localhost"
fi

# Get Emergent LLM Key
echo ""
echo -e "${YELLOW}The AI triage system requires an Emergent LLM Key for GPT-5.2 access.${NC}"
echo "Get one at: https://app.emergent.sh -> Profile -> Universal Key"
echo ""
echo -n "Enter your Emergent LLM Key: "
read EMERGENT_LLM_KEY

if [ -z "$EMERGENT_LLM_KEY" ]; then
    echo -e "${RED}Warning: No Emergent LLM Key provided. AI features will not work.${NC}"
fi

# Create environment file
cat > "$INSTALL_DIR/.env" << ENVEOF
# WBUK AI Triage Platform - Environment Configuration
# Generated on $(date)

# Public URL (your domain or IP)
PUBLIC_URL=http://$PUBLIC_URL

# MongoDB Configuration
MONGO_USER=wbukadmin
MONGO_PASSWORD=$MONGO_PASSWORD

# MinIO (S3-compatible storage) Configuration
MINIO_USER=minioadmin
MINIO_PASSWORD=$MINIO_PASSWORD

# Security
JWT_SECRET=$JWT_SECRET

# Emergent LLM Key (for AI features)
EMERGENT_LLM_KEY=$EMERGENT_LLM_KEY
ENVEOF

chmod 600 "$INSTALL_DIR/.env"

echo -e "${GREEN}Environment configured${NC}"

echo -e "${GREEN}[6/6] Building and starting services...${NC}"

cd "$INSTALL_DIR"
docker compose -f deploy/docker-compose.yml up -d --build

echo ""
echo -e "${GREEN}=============================================================${NC}"
echo -e "${GREEN}            Installation Complete!${NC}"
echo -e "${GREEN}=============================================================${NC}"
echo ""
echo "Your WBUK AI Triage Platform is now running!"
echo ""
echo "  Web Interface:   http://$PUBLIC_URL"
echo "  MinIO Console:   http://$PUBLIC_URL:9001"
echo ""
echo "Service Management:"
echo "  Start:   cd $INSTALL_DIR && docker compose -f deploy/docker-compose.yml up -d"
echo "  Stop:    cd $INSTALL_DIR && docker compose -f deploy/docker-compose.yml down"
echo "  Logs:    cd $INSTALL_DIR && docker compose -f deploy/docker-compose.yml logs -f"
echo "  Status:  docker ps"
echo ""
echo "Configuration: $INSTALL_DIR/.env"
echo ""
echo -e "${GREEN}To create an admin user, run: $INSTALL_DIR/create-admin.sh${NC}"
echo ""

# Create admin user script
cat > "$INSTALL_DIR/create-admin.sh" << 'ADMINEOF'
#!/bin/bash
echo "Creating admin user for WBUK Triage Platform"
echo -n "Admin email: "
read ADMIN_EMAIL
echo -n "Admin password (min 8 chars): "
read -s ADMIN_PASSWORD
echo ""
echo -n "Admin name: "
read ADMIN_NAME

docker exec -it wbuk-backend python3 << PYEOF
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import os

async def create_admin():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client['wbuk_triage']
    
    password_hash = bcrypt.hashpw('${ADMIN_PASSWORD}'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    await db.admin_users.update_one(
        {'email': '${ADMIN_EMAIL}'},
        {'\$set': {
            'email': '${ADMIN_EMAIL}',
            'name': '${ADMIN_NAME}',
            'password_hash': password_hash,
            'role': 'super_admin',
            'is_active': True
        }},
        upsert=True
    )
    print('Admin user created successfully!')

asyncio.run(create_admin())
PYEOF
echo "Admin user created. You can now login at http://your-domain/admin"
ADMINEOF

chmod +x "$INSTALL_DIR/create-admin.sh"
