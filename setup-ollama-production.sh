#!/bin/bash

# Production Ollama Setup Script for Azure VM
# This script configures Nginx reverse proxy with SSL for Ollama API

set -e

echo "🚀 Starting Ollama Production Setup..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo "❌ Please run as root (sudo)"
   exit 1
fi

# Variables
DOMAIN="ai.yatricloud.com"
EMAIL="info@yatricloud.com"  # Change this to your email
OLLAMA_PORT=11434

echo "📦 Installing required packages..."
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx ufw

echo "🔥 Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "📝 Creating Nginx configuration..."
cat > /etc/nginx/sites-available/ollama-api << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name ai.yatricloud.com;

    # Redirect HTTP to HTTPS (will be uncommented after SSL setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:11434;
        proxy_http_version 1.1;
        
        # WebSocket support for streaming
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Headers for proper proxying
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeouts for long-running requests
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
EOF

echo "🔗 Enabling site..."
ln -sf /etc/nginx/sites-available/ollama-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "✅ Testing Nginx configuration..."
nginx -t

echo "🔄 Restarting Nginx..."
systemctl restart nginx

echo "📜 Setting up SSL with Let's Encrypt..."
echo "⚠️  Make sure DNS is pointed to this server before proceeding!"
read -p "Press Enter to continue with SSL setup, or Ctrl+C to abort..."

certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

echo "🔄 Updating Nginx config for HTTPS..."
# The certbot command above automatically updates the config with SSL

echo "🤖 Creating Ollama systemd service..."
cat > /etc/systemd/system/ollama.service << 'EOF'
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

echo "🔄 Enabling Ollama service..."
systemctl daemon-reload
systemctl enable ollama
systemctl restart ollama

echo "✅ Setup complete!"
echo ""
echo "🌐 Your Ollama API is now available at: https://$DOMAIN"
echo ""
echo "🧪 Test with:"
echo "curl -X POST https://$DOMAIN/api/generate \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"model\": \"gemma3\", \"prompt\": \"Hello\", \"stream\": false}'"
echo ""
echo "📋 Next steps:"
echo "1. Add DNS A record in GoDaddy: ai -> [Your VM IP]"
echo "2. Update Vercel environment variables"
echo "3. Deploy frontend to production"
