#!/bin/bash

# Yatri AI Production Setup Script
# Usage: ./setup-yatri-ai-vm.sh <EMAIL> <DOMAIN>
# Example: ./setup-yatri-ai-vm.sh info@yatricloud.com ai.yatricloud.com

set -e

EMAIL=$1
DOMAIN=$2

if [ -z "$EMAIL" ] || [ -z "$DOMAIN" ]; then
    echo "Usage: ./setup-yatri-ai-vm.sh <EMAIL> <DOMAIN>"
    exit 1
fi

echo "🚀 Starting Yatri AI Setup for $DOMAIN..."

# 1. Update System
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Dependencies
echo "📦 Installing Nginx, Certbot, and Python..."
sudo apt install -y nginx certbot python3-certbot-nginx ufw nodejs npm

# 3. Setup UFW Firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 4. Install Ollama
if ! command -v ollama &> /dev/null; then
    echo "🦙 Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
else
    echo "🦙 Ollama already installed."
fi

# 5. Create Ollama Service
echo "⚙️ Configuring Ollama service..."
sudo tee /etc/systemd/system/ollama.service > /dev/null << 'EOF'
[Unit]
Description=Ollama Service
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/ollama serve
Environment="OLLAMA_HOST=127.0.0.1:11434"
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ollama
sudo systemctl restart ollama

# 6. Pull Model
echo "🧠 Pulling gemma3 model (this may take a while)..."
# We wait for ollama to be ready
sleep 5
ollama pull gemma3

# 7. Setup Chat Server
echo "💬 Setting up Chat Server..."
# Assume files are in current directory or infrastructure folder
if [ -d "infrastructure" ]; then
    cp infrastructure/chat-server.js $HOME/chat-server.js
    cp infrastructure/package.json $HOME/package.json
    sudo cp infrastructure/chat-server.service /etc/systemd/system/chat-server.service
else
    echo "⚠️ Infrastructure files not found! Downloading default files..."
    # Fallback to create files if not present (simplified)
fi

# Install dependencies
cd $HOME
echo "Installing Node.js dependencies..."
npm install

# Update service user to current user
CURRENT_USER=$(whoami)
sudo sed -i "s/User=azureuser/User=$CURRENT_USER/g" /etc/systemd/system/chat-server.service
sudo sed -i "s|WorkingDirectory=/home/azureuser|WorkingDirectory=$HOME|g" /etc/systemd/system/chat-server.service
sudo sed -i "s|ExecStart=/usr/bin/node /home/azureuser/chat-server.js|ExecStart=$(which node) $HOME/chat-server.js|g" /etc/systemd/system/chat-server.service

sudo systemctl daemon-reload
sudo systemctl enable chat-server
sudo systemctl restart chat-server

# 8. Setup Nginx
echo "🌐 Configuring Nginx..."
# Use template if available
if [ -f "infrastructure/ollama-api.nginx" ]; then
    sudo cp infrastructure/ollama-api.nginx /etc/nginx/sites-available/ollama-api
    sudo sed -i "s/\${DOMAIN_NAME}/$DOMAIN/g" /etc/nginx/sites-available/ollama-api
else
    # Safety fallback
    echo "Nginx template not found."
fi

# Enable site
sudo ln -sf /etc/nginx/sites-available/ollama-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 9. SSL Certificate
echo "🔒 Setting up SSL with Let's Encrypt..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

echo "🎉 Setup Complete! Your API is ready at https://$DOMAIN/api/chat"
