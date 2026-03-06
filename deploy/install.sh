#!/bin/bash

#############################################################################
# WBUK AI Triage Platform - Ubuntu 24.04 Install Script
#
# Usage: curl -sSL https://raw.githubusercontent.com/<YOUR_REPO>/main/install.sh | bash
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
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="/opt/wbuk-triage"
REPO_URL="${WBUK_REPO_URL:-https://github.com/andrewdunn358-dev/wbuk-ai-triage.git}"

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          WBUK AI Triage Platform - Installation               ║"
echo "║              For Ubuntu 24.04 LTS                             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Error: This script must be run as root (use sudo)${NC}"
   exit 1
fi

# Check Ubuntu version
if ! grep -q "Ubuntu 24" /etc/os-release 2>/dev/null; then
    echo -e "${YELLOW}Warning: This script is designed for Ubuntu 24.04 LTS${NC}"
    read -p "Continue anyway? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}[1/6] Updating system packages...${NC}"
apt-get update -qq
apt-get upgrade -y -qq

echo -e "${GREEN}[2/6] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    # Install prerequisites
    apt-get install -y -qq \
        ca-certificates \
        curl \
        gnupg \
        lsb-release

    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Add Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Start and enable Docker
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
    echo -e "${YELLOW}Directory $INSTALL_DIR already exists${NC}"
    read -p "Remove and reinstall? (y/N): " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        rm -rf "$INSTALL_DIR"
    else
        echo "Exiting without changes"
        exit 0
    fi
fi

git clone "$REPO_URL" "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo -e "${GREEN}[5/6] Configuring environment...${NC}"

# Generate secrets
JWT_SECRET=$(openssl rand -hex 32)
MONGO_PASSWORD=$(openssl rand -hex 16)
MINIO_PASSWORD=$(openssl rand -hex 16)

# Prompt for required configuration
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                  Configuration Required                        ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Get domain/IP
read -p "Enter your domain name or public IP (e.g., wbuk.example.com or 123.45.67.89): " PUBLIC_URL
if [ -z "$PUBLIC_URL" ]; then
    PUBLIC_URL="localhost"
fi

# Get Emergent LLM Key
echo ""
echo -e "${YELLOW}The AI triage system requires an Emergent LLM Key for GPT-5.2 access.${NC}"
echo -e "Get one at: https://emergent.sh/profile/universal-key"
read -p "Enter your Emergent LLM Key: " EMERGENT_LLM_KEY

if [ -z "$EMERGENT_LLM_KEY" ]; then
    echo -e "${RED}Warning: No Emergent LLM Key provided. AI features will not work.${NC}"
fi

# Create environment file
cat > "$INSTALL_DIR/.env" <<EOF
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
EOF

# Secure the env file
chmod 600 "$INSTALL_DIR/.env"

echo -e "${GREEN}Environment configured${NC}"

echo -e "${GREEN}[6/6] Building and starting services...${NC}"

# Build and start with Docker Compose
cd "$INSTALL_DIR"
docker compose -f deploy/docker-compose.yml up -d --build

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}                  Installation Complete!                        ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Your WBUK AI Triage Platform is now running!"
echo ""
echo -e "  ${BLUE}Web Interface:${NC}   http://$PUBLIC_URL"
echo -e "  ${BLUE}MinIO Console:${NC}   http://$PUBLIC_URL:9001"
echo ""
echo -e "${YELLOW}Important:${NC}"
echo -e "  - Default admin credentials need to be created"
echo -e "  - Run: docker exec -it wbuk-backend python -c \"...\" to create admin"
echo ""
echo -e "${YELLOW}Service Management:${NC}"
echo -e "  Start:   cd $INSTALL_DIR && docker compose -f deploy/docker-compose.yml up -d"
echo -e "  Stop:    cd $INSTALL_DIR && docker compose -f deploy/docker-compose.yml down"
echo -e "  Logs:    cd $INSTALL_DIR && docker compose -f deploy/docker-compose.yml logs -f"
echo -e "  Status:  docker ps"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Environment file: $INSTALL_DIR/.env"
echo ""

# Create admin user script
cat > "$INSTALL_DIR/create-admin.sh" <<'ADMIN_SCRIPT'
#!/bin/bash
echo "Creating admin user for WBUK Triage Platform"
read -p "Admin email: " ADMIN_EMAIL
read -sp "Admin password (min 8 chars): " ADMIN_PASSWORD
echo ""
read -p "Admin name: " ADMIN_NAME

docker exec -it wbuk-backend python -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import os

async def create_admin():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client['wbuk_triage']
    
    password_hash = bcrypt.hashpw('$ADMIN_PASSWORD'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    await db.admin_users.update_one(
        {'email': '$ADMIN_EMAIL'},
        {'\$set': {
            'email': '$ADMIN_EMAIL',
            'name': '$ADMIN_NAME',
            'password_hash': password_hash,
            'role': 'super_admin',
            'is_active': True
        }},
        upsert=True
    )
    print('Admin user created successfully!')

asyncio.run(create_admin())
"
echo "Admin user created. You can now login at http://your-domain/admin"
ADMIN_SCRIPT

chmod +x "$INSTALL_DIR/create-admin.sh"

echo -e "${GREEN}To create an admin user, run: $INSTALL_DIR/create-admin.sh${NC}"
echo ""
