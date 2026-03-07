#!/bin/bash
#############################################################################
# WBUK AI Triage Platform - Interactive Installation Wizard
# For Ubuntu 24.04 LTS
#
# Usage: curl -sSL https://raw.githubusercontent.com/andrewdunn358-dev/wbuk-ai-triage/main/deploy/install-wizard.sh | sudo bash
#############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Config
INSTALL_DIR="/opt/wbuk-triage"
REPO_URL="https://github.com/andrewdunn358-dev/wbuk-ai-triage.git"

clear
echo -e "${BLUE}${BOLD}"
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                       ║"
echo "║              WBUK AI Triage Platform - Installation Wizard            ║"
echo "║                                                                       ║"
echo "║                         For Ubuntu 24.04 LTS                          ║"
echo "║                                                                       ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Check root
if [ "$EUID" -ne 0 ]; then
   echo -e "${RED}Error: Please run as root (use sudo)${NC}"
   exit 1
fi

# Check Ubuntu
if ! grep -q "Ubuntu" /etc/os-release 2>/dev/null; then
    echo -e "${YELLOW}Warning: This script is designed for Ubuntu. Continue anyway? (y/N)${NC}"
    read -r confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 1: Domain Configuration${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Enter your domain name (e.g., whistleblower.example.com)"
echo "Or enter your server's IP address if you don't have a domain."
echo ""
read -p "Domain or IP: " DOMAIN

if [ -z "$DOMAIN" ]; then
    DOMAIN=$(curl -s ifconfig.me)
    echo -e "${YELLOW}No domain entered. Using server IP: $DOMAIN${NC}"
fi

# Check if using IP or domain
if [[ $DOMAIN =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    USE_SSL="no"
    PROTOCOL="http"
    echo -e "${YELLOW}IP address detected. SSL will not be configured.${NC}"
else
    echo ""
    echo "Do you want to set up SSL (HTTPS) with Let's Encrypt?"
    echo "Requirements: Domain must already point to this server's IP"
    read -p "Set up SSL? (Y/n): " SSL_CHOICE
    if [[ "$SSL_CHOICE" =~ ^[Nn]$ ]]; then
        USE_SSL="no"
        PROTOCOL="http"
    else
        USE_SSL="yes"
        PROTOCOL="https"
    fi
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 2: Admin Account${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Create the admin account for accessing the advisor dashboard."
echo ""

read -p "Admin name: " ADMIN_NAME
read -p "Admin email: " ADMIN_EMAIL

while true; do
    read -s -p "Admin password (min 8 characters): " ADMIN_PASSWORD
    echo ""
    if [ ${#ADMIN_PASSWORD} -ge 8 ]; then
        break
    else
        echo -e "${RED}Password must be at least 8 characters.${NC}"
    fi
done

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 3: AI Provider${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Choose which AI will power the triage conversations:"
echo ""
echo -e "  ${GREEN}1${NC}) Emergent Universal Key ${YELLOW}(Recommended)${NC}"
echo "     - Access to GPT-5.2, Claude, Gemini"
echo "     - Get key at: https://app.emergent.sh"
echo ""
echo -e "  ${GREEN}2${NC}) OpenAI Direct"
echo "     - GPT-4, GPT-4 Turbo"
echo "     - Get key at: https://platform.openai.com"
echo ""
echo -e "  ${GREEN}3${NC}) Anthropic Claude"
echo "     - Claude 3 Opus, Sonnet, Haiku"
echo "     - Get key at: https://console.anthropic.com"
echo ""
echo -e "  ${GREEN}4${NC}) Google Gemini"
echo "     - Gemini Pro, Gemini Ultra"
echo "     - Get key at: https://makersuite.google.com"
echo ""
echo -e "  ${GREEN}5${NC}) Ollama (Local AI) ${CYAN}[Free, No API Key]${NC}"
echo "     - Runs on your server"
echo "     - Requires 8GB+ RAM"
echo "     - Fully private, no external calls"
echo ""

read -p "Enter choice [1-5]: " AI_CHOICE

case $AI_CHOICE in
    1)
        AI_PROVIDER="emergent"
        read -p "Enter your Emergent Universal Key: " AI_KEY
        ;;
    2)
        AI_PROVIDER="openai"
        read -p "Enter your OpenAI API Key: " AI_KEY
        ;;
    3)
        AI_PROVIDER="anthropic"
        read -p "Enter your Anthropic API Key: " AI_KEY
        ;;
    4)
        AI_PROVIDER="google"
        read -p "Enter your Google AI API Key: " AI_KEY
        ;;
    5)
        AI_PROVIDER="ollama"
        AI_KEY="local"
        echo -e "${CYAN}Ollama will be installed and configured automatically.${NC}"
        ;;
    *)
        AI_PROVIDER="emergent"
        read -p "Enter your Emergent Universal Key: " AI_KEY
        ;;
esac

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 4: Site Access Password${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Set a password to protect the site from casual visitors."
echo "Share this password with people who need access."
echo ""
read -p "Site access password: " SITE_PASSWORD

if [ -z "$SITE_PASSWORD" ]; then
    SITE_PASSWORD="WBUK2026"
    echo -e "${YELLOW}Using default: WBUK2026${NC}"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Configuration Summary${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Domain:          ${GREEN}$DOMAIN${NC}"
echo -e "  SSL:             ${GREEN}$USE_SSL${NC}"
echo -e "  Admin Name:      ${GREEN}$ADMIN_NAME${NC}"
echo -e "  Admin Email:     ${GREEN}$ADMIN_EMAIL${NC}"
echo -e "  AI Provider:     ${GREEN}$AI_PROVIDER${NC}"
echo -e "  Site Password:   ${GREEN}$SITE_PASSWORD${NC}"
echo ""
read -p "Proceed with installation? (Y/n): " PROCEED

if [[ "$PROCEED" =~ ^[Nn]$ ]]; then
    echo "Installation cancelled."
    exit 0
fi

echo ""
echo -e "${GREEN}Starting installation...${NC}"
echo ""

# ============================================================================
# INSTALLATION
# ============================================================================

echo -e "${BLUE}[1/8]${NC} Updating system..."
apt-get update -qq
apt-get upgrade -y -qq

echo -e "${BLUE}[2/8]${NC} Installing Docker..."
if ! command -v docker &> /dev/null; then
    apt-get install -y -qq ca-certificates curl gnupg lsb-release
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl start docker
    systemctl enable docker
fi

echo -e "${BLUE}[3/8]${NC} Installing dependencies..."
apt-get install -y -qq git curl openssl

# Stop Apache if running
systemctl stop apache2 2>/dev/null || true
systemctl disable apache2 2>/dev/null || true

echo -e "${BLUE}[4/8]${NC} Cloning repository..."
rm -rf "$INSTALL_DIR"
git clone "$REPO_URL" "$INSTALL_DIR"

echo -e "${BLUE}[5/8]${NC} Creating configuration..."

# Generate secrets
MONGO_PASSWORD=$(openssl rand -hex 16)
MINIO_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)

# Create .env
cat > "$INSTALL_DIR/deploy/.env" << ENVEOF
PUBLIC_URL=${PROTOCOL}://${DOMAIN}
MONGO_USER=wbukadmin
MONGO_PASSWORD=${MONGO_PASSWORD}
MINIO_USER=minioadmin
MINIO_PASSWORD=${MINIO_PASSWORD}
JWT_SECRET=${JWT_SECRET}
AI_PROVIDER=${AI_PROVIDER}
AI_API_KEY=${AI_KEY}
EMERGENT_LLM_KEY=${AI_KEY}
SITE_PASSWORD=${SITE_PASSWORD}
ENVEOF

chmod 600 "$INSTALL_DIR/deploy/.env"

# Update site password in frontend
sed -i "s/const SITE_PASSWORD = \"WBUK2026\";/const SITE_PASSWORD = \"${SITE_PASSWORD}\";/" "$INSTALL_DIR/frontend/src/components/PasswordGate.jsx"

echo -e "${BLUE}[6/8]${NC} Setting up firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

# SSL Setup
if [ "$USE_SSL" = "yes" ]; then
    echo -e "${BLUE}[7/8]${NC} Obtaining SSL certificate..."
    apt-get install -y -qq certbot
    certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos --email "$ADMIN_EMAIL" || {
        echo -e "${YELLOW}SSL certificate failed. Continuing without SSL.${NC}"
        USE_SSL="no"
        PROTOCOL="http"
        sed -i "s|PUBLIC_URL=https://|PUBLIC_URL=http://|" "$INSTALL_DIR/deploy/.env"
    }
else
    echo -e "${BLUE}[7/8]${NC} Skipping SSL setup..."
fi

# Install Ollama if selected
if [ "$AI_PROVIDER" = "ollama" ]; then
    echo -e "${BLUE}[7b/8]${NC} Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
    systemctl enable ollama
    systemctl start ollama
    sleep 5
    ollama pull llama3.1 || ollama pull llama2
fi

echo -e "${BLUE}[8/8]${NC} Building and starting services..."
cd "$INSTALL_DIR/deploy"
docker compose up -d --build

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 20

# Create admin user
echo "Creating admin user..."
docker exec wbuk-backend python3 << PYEOF
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import hashlib
import os
import uuid

async def create_admin():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client['wbuk_triage']
    
    email = "${ADMIN_EMAIL}"
    password = "${ADMIN_PASSWORD}"
    name = "${ADMIN_NAME}"
    
    email_hash = hashlib.sha256(email.lower().encode()).hexdigest()
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user_id = str(uuid.uuid4())
    
    await db.admin_users.delete_many({})
    await db.admin_users.insert_one({
        'user_id': user_id,
        'email_hash': email_hash,
        'name': name,
        'password_hash': password_hash,
        'role': 'super_admin',
        'is_active': True,
        'failed_login_attempts': 0
    })
    print('Admin user created!')

asyncio.run(create_admin())
PYEOF

# Save credentials
cat > "$INSTALL_DIR/CREDENTIALS.txt" << CREDEOF
═══════════════════════════════════════════════════════════════════════════════
                    WBUK AI Triage - Installation Credentials
                    Generated: $(date)
═══════════════════════════════════════════════════════════════════════════════

WEBSITE ACCESS
─────────────────────────────────────────────────────────────────────────────
  URL:              ${PROTOCOL}://${DOMAIN}
  Site Password:    ${SITE_PASSWORD}

ADMIN LOGIN
─────────────────────────────────────────────────────────────────────────────
  Admin URL:        ${PROTOCOL}://${DOMAIN}/admin
  Email:            ${ADMIN_EMAIL}
  Password:         ${ADMIN_PASSWORD}

DATABASE (MongoDB)
─────────────────────────────────────────────────────────────────────────────
  User:             wbukadmin
  Password:         ${MONGO_PASSWORD}

MINIO (File Storage)
─────────────────────────────────────────────────────────────────────────────
  Console:          ${PROTOCOL}://${DOMAIN}:9001
  User:             minioadmin
  Password:         ${MINIO_PASSWORD}

AI PROVIDER
─────────────────────────────────────────────────────────────────────────────
  Provider:         ${AI_PROVIDER}
  
═══════════════════════════════════════════════════════════════════════════════
                    KEEP THIS FILE SECURE - DELETE AFTER NOTING DETAILS
═══════════════════════════════════════════════════════════════════════════════
CREDEOF

chmod 600 "$INSTALL_DIR/CREDENTIALS.txt"

# Done!
clear
echo -e "${GREEN}${BOLD}"
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                       ║"
echo "║                    Installation Complete!                             ║"
echo "║                                                                       ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "  ${BOLD}Website:${NC}        ${GREEN}${PROTOCOL}://${DOMAIN}${NC}"
echo -e "  ${BOLD}Site Password:${NC}  ${GREEN}${SITE_PASSWORD}${NC}"
echo ""
echo -e "  ${BOLD}Admin Login:${NC}    ${GREEN}${PROTOCOL}://${DOMAIN}/admin${NC}"
echo -e "  ${BOLD}Admin Email:${NC}    ${GREEN}${ADMIN_EMAIL}${NC}"
echo -e "  ${BOLD}Admin Password:${NC} ${GREEN}${ADMIN_PASSWORD}${NC}"
echo ""
echo -e "${YELLOW}Credentials saved to: ${INSTALL_DIR}/CREDENTIALS.txt${NC}"
echo -e "${YELLOW}Delete this file after noting down the details.${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Service Commands:${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Start:    cd $INSTALL_DIR/deploy && docker compose up -d"
echo "  Stop:     cd $INSTALL_DIR/deploy && docker compose down"
echo "  Logs:     cd $INSTALL_DIR/deploy && docker compose logs -f"
echo "  Status:   docker ps"
echo ""
