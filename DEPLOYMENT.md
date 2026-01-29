# Production Deployment Guide for Ollama API

This guide will help you set up a secure HTTPS endpoint for your Ollama API running on Azure VM.

## Prerequisites

- Azure VM with Ollama installed and running
- GoDaddy domain access (yatricloud.com)
- SSH access to Azure VM
- Email address for Let's Encrypt SSL certificate

## Step-by-Step Instructions

### Step 1: Get Your Azure VM Public IP

1. Log into Azure Portal
2. Navigate to your VM
3. Find the **Public IP address** (e.g., `20.1.2.3`)
4. Copy this IP address

### Step 2: Configure DNS in GoDaddy

1. Log into GoDaddy
2. Go to **My Products** → **DNS** → **Manage DNS** for `yatricloud.com`
3. Add a new A record:
   - **Type**: A
   - **Name**: ai
   - **Value**: [Paste your Azure VM Public IP]
   - **TTL**: 600 seconds (or default)
4. Save changes
5. Wait 5-10 minutes for DNS propagation

### Step 3: Run Setup Script on Azure VM

1. SSH into your Azure VM:
   ```bash
   ssh your-username@your-vm-ip
   ```

2. Upload the setup script:
   ```bash
   # On your local machine
   scp setup-ollama-production.sh your-username@your-vm-ip:~/
   ```

3. On the VM, make the script executable:
   ```bash
   chmod +x setup-ollama-production.sh
   ```

4. Edit the script to add your email:
   ```bash
   nano setup-ollama-production.sh
   # Change: EMAIL="your-email@example.com"
   # To: EMAIL="your-actual-email@domain.com"
   ```

5. Run the setup script as root:
   ```bash
   sudo ./setup-ollama-production.sh
   ```

6. When prompted, press Enter to proceed with SSL setup

### Step 4: Configure Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`certification.yatricloud.com`)
3. Go to **Settings** → **Environment Variables**
4. Add the following variable:
   - **Name**: `VITE_OLLAMA_API_URL`
   - **Value**: `https://ai.yatricloud.com/api/chat`
   - **Environment**: Production ✓

> **Note**: All other environment variables should already be configured from your `.env.production` file

### Step 5: Deploy to Vercel

Since your app is connected to GitHub, deployment is automatic:
1. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Configure production Ollama API endpoint"
   git push origin main
   ```

2. Vercel will automatically deploy the changes
3. Wait for deployment to complete (~2-3 minutes)

### Step 6: Test the Setup

1. **Test DNS Resolution**:
   ```bash
   nslookup ai.yatricloud.com
   # Should return your Azure VM IP
   ```

2. **Test SSL Certificate**:
   ```bash
   curl -I https://ai.yatricloud.com
   # Should return HTTP/2 200 OK
   ```

3. **Test Ollama API**:
   ```bash
   curl -X POST https://ai.yatricloud.com/api/generate \
     -H "Content-Type: application/json" \
     -d '{"model": "gemma3", "prompt": "Hello", "stream": false}'
   # Should return JSON response from Ollama
   ```

4. **Test Frontend Integration**:
   - Visit `https://certification.yatricloud.com`
   - Click the blue chat button (bottom-right)
   - Send a message: "Hello"
   - You should see a response from Yatri AI
   - Check browser console (F12) for any errors

## Troubleshooting

### DNS not resolving
- Wait 10-15 minutes for DNS propagation
- Clear your DNS cache: `sudo systemd-resolve --flush-caches`

### SSL certificate errors
- Ensure ports 80 and 443 are open in Azure NSG
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

### Ollama not responding
- Check if Ollama is running: `sudo systemctl status ollama`
- Restart Ollama: `sudo systemctl restart ollama`
- Check Ollama logs: `sudo journalctl -u ollama -f`

### CORS errors in browser
- The Nginx config includes CORS headers
- Verify Nginx config: `sudo nginx -t`
- Restart Nginx: `sudo systemctl restart nginx`

## Security Notes

- SSL certificates auto-renew via Certbot
- Ollama is NOT exposed directly (only via Nginx reverse proxy)
- HTTPS ensures encrypted communication
- CORS is configured to allow frontend access

## Maintenance

### Renew SSL Certificate (Automatic)
Certbot automatically renews certificates. To test renewal:
```bash
sudo certbot renew --dry-run
```

### Update Ollama
```bash
curl https://ollama.ai/install.sh | sh
sudo systemctl restart ollama
```

### View Logs
```bash
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Ollama logs
sudo journalctl -u ollama -f
```
