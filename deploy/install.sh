#!/bin/bash
#############################################################################
# WBUK AI Triage Platform - Install Script for Ubuntu 24.04
# Server: 185.230.216.83
# Domain: radiocheck.org.uk
#############################################################################

set -e

echo "=========================================="
echo "  WBUK AI Triage Platform Installation"
echo "=========================================="

# Check root
if [ "$EUID" -ne 0 ]; then
   echo "Please run as root"
   exit 1
fi

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "[1/5] Installing Docker..."
    apt-get update -qq
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -qq
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl start docker
    systemctl enable docker
else
    echo "[1/5] Docker already installed"
fi

# Install git
echo "[2/5] Installing dependencies..."
apt-get install -y git curl openssl

# Stop Apache if running
systemctl stop apache2 2>/dev/null || true
systemctl disable apache2 2>/dev/null || true

# Clone repo
echo "[3/5] Cloning repository..."
rm -rf /opt/wbuk-triage
git clone https://github.com/andrewdunn358-dev/wbuk-ai-triage.git /opt/wbuk-triage

# Create .env file
echo "[4/5] Creating configuration..."
cat > /opt/wbuk-triage/deploy/.env << 'ENVFILE'
PUBLIC_URL=http://radiocheck.org.uk
MONGO_USER=wbukadmin
MONGO_PASSWORD=wbuk2024mongopass
MINIO_USER=minioadmin
MINIO_PASSWORD=minio2024pass
JWT_SECRET=wbuk2024jwtsecretkey
EMERGENT_LLM_KEY=sk-emergent-dD2650e666225B99f9
ENVFILE

# Set up firewall
echo "[5/5] Configuring firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

# Build and start
echo "Building and starting services..."
cd /opt/wbuk-triage/deploy
docker compose up -d --build

echo ""
echo "=========================================="
echo "  Installation Complete!"
echo "=========================================="
echo ""
echo "  Website: http://radiocheck.org.uk"
echo "  or: http://185.230.216.83"
echo ""
echo "  Admin Login: /admin"
echo ""
echo "  To create admin user:"
echo "  /opt/wbuk-triage/create-admin.sh"
echo ""
