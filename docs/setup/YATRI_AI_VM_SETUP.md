# YatriAI Azure VM Setup Guide

This guide details the steps to set up a production-ready YatriAI environment on a fresh Azure VM (Ubuntu 22.04/24.04).

## Prerequisites

1.  **Azure VM**: Ubuntu Server (Standard B2s or larger recommended for AI models).
2.  **Domain Name**: A DNS A-Record pointing to the VM's Public IP (e.g., `ai.yatricloud.com` -> `X.X.X.X`).
3.  **SSH Access**: You must be able to SSH into the VM.

## Quick Setup (Recommended)

We have automated the process with a script. This script installs Ollama, Nginx, Node.js, configures SSL, and sets up the chat server.

1.  **Upload the Infrastructure Files**
    Copy the `infrastructure` folder from this repository to your VM:
    ```bash
    scp -r infrastructure/ username@your-vm-ip:~/infrastructure
    ```

2.  **SSH into your VM**
    ```bash
    ssh username@your-vm-ip
    ```

3.  **Run the Setup Script**
    ```bash
    chmod +x infrastructure/setup-yatri-ai-vm.sh
    ./infrastructure/setup-yatri-ai-vm.sh info@your-email.com ai.your-domain.com
    ```
    *Replace with your email and domain.*

## Manual Setup Steps

If you prefer to configure manually, follow these steps.

### 1. Update & Install Dependencies

Update system packages and install required tools:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx certbot python3-certbot-nginx ufw nodejs npm
```

### 2. Configure Firewall

Allow web traffic:

```bash
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw enable
```

### 3. Install & Configure Ollama

1.  **Install Ollama**:
    ```bash
    curl -fsSL https://ollama.com/install.sh | sh
    ```

2.  **Configure Service**:
    Create `/etc/systemd/system/ollama.service`:
    ```ini
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
    ```

3.  **Start Service & Pull Model**:
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl enable ollama
    sudo systemctl start ollama
    ollama pull gemma3
    ```

### 4. Setup Chat Server (Node.js)

1.  **Create Server Files**:
    Create `~/chat-server.js` and `~/package.json` (see `infrastructure/` folder for content).

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Service**:
    Create `/etc/systemd/system/chat-server.service`:
    ```ini
    [Unit]
    Description=Chat Server for Yatri AI
    After=network.target ollama.service

    [Service]
    Type=simple
    User=YOUR_USERNAME_HERE
    WorkingDirectory=/home/YOUR_USERNAME_HERE
    ExecStart=/usr/bin/node /home/YOUR_USERNAME_HERE/chat-server.js
    Environment="OLLAMA_API_URL=http://localhost:11434"
    Restart=always
    RestartSec=3

    [Install]
    WantedBy=multi-user.target
    ```
    *Replace `YOUR_USERNAME_HERE` with your actual username.*

4.  **Start Server**:
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl enable chat-server
    sudo systemctl start chat-server
    ```

### 5. Configure Nginx Reverse Proxy

1.  **Create Config**:
    Create `/etc/nginx/sites-available/ollama-api`:
    *Refer to `infrastructure/ollama-api.nginx` for the configuration.*
    Remember to update `server_name` to your domain.

2.  **Enable Site**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/ollama-api /etc/nginx/sites-enabled/
    sudo rm /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl reload nginx
    ```

### 6. Setup SSL (HTTPS)

Secure your API with Let's Encrypt:

```bash
sudo certbot --nginx -d ai.your-domain.com
```

### 7. Verification

Test your setup:

```bash
curl -X POST https://ai.your-domain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

---

## Troubleshooting

*   **Logs**:
    *   Ollama: `sudo journalctl -u ollama -f`
    *   Chat Server: `sudo journalctl -u chat-server -f`
    *   Nginx: `sudo tail -f /var/log/nginx/error.log`
*   **Permissions**: Ensure `chat-server.service` user has access to the files.
*   **Firewall**: Ensure Azure Network Security Group (NSG) also allows ports 80 and 443.
