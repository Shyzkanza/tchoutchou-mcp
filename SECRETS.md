# 🔐 GitHub Secrets Configuration

This file explains the secrets to configure in GitHub for automatic deployment via Portainer.

## 📍 Where to Configure Secrets

1. Go to your GitHub repo: `https://github.com/YOUR_USERNAME/tchoutchou-mcp`
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click on **New repository secret**

---

## 🔑 Required Secrets

### For npm Publication

#### `NPM_TOKEN`
**Description**: npm access token to publish the package  
**How to get it**:
1. Go to https://www.npmjs.com/settings/YOUR_NPM_USERNAME/tokens
2. Click on "Generate New Token" → "Classic Token"
3. Select "Automation" (for CI/CD)
4. Copy the generated token

**Format**: `npm_xxxxxxxxxxxxxxxxxxxxxxxxxx`

⚠️ **Important**: This token allows publishing to npm. Keep it secure!

---

### For VPS Deployment (Portainer API)

### 1. `PORTAINER_URL`
**Description**: Your Portainer instance URL  
**Example**: `https://portainer.your-domain.com`
**How to get it**: This is the URL you use to access Portainer

---

### 2. `PORTAINER_USERNAME`
**Description**: Portainer admin username  
**Example**: `admin` or your Portainer username  
**How to get it**: The username you use to log into Portainer

---

### 3. `PORTAINER_PASSWORD`
**Description**: Your Portainer account password  
**How to get it**: The password you use to log into Portainer

⚠️ **Important**: Make sure this account has admin rights on Portainer

---

### 4. `PORTAINER_STACK_ID`
**Description**: ID of the tchoutchou stack in Portainer  
**Example**: `6`  
**How to get it**: 
1. Go to Portainer → Stacks → your stack
2. Look at the URL: `https://portainer.your-domain.com/#!/[ENDPOINT_ID]/docker/stacks/[STACK_NAME]?id=[STACK_ID]`
3. The `id=` parameter contains the STACK_ID

---

### 5. `PORTAINER_ENDPOINT_ID`
**Description**: Docker endpoint ID in Portainer  
**Example**: `3`  
**How to get it**: 
1. In the same stack URL
2. The number after `#!/` is the endpoint ID
3. Example: `https://portainer.your-domain.com/#!/3/...` → endpoint ID = `3`

---

## ⚙️ Obsolete Configuration (Old SSH Method)

The following secrets are **no longer needed** since switching to Portainer API:
- ~~`VPS_HOST`~~ (replaced by PORTAINER_URL)
- ~~`VPS_USER`~~ (replaced by PORTAINER_USERNAME)  
- ~~`VPS_SSH_KEY`~~ (no longer needed)

You can delete them if you had configured them.

---

## ✅ Verification
```bash
# On your local machine
cat ~/.ssh/id_rsa
```

Copy ALL the content (including `-----BEGIN` and `-----END`)

#### Option B: Create a new dedicated key (recommended)
```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-tchoutchou" -f ~/.ssh/github_actions_tchoutchou

# Display the private key (to put in GitHub Secret)
cat ~/.ssh/github_actions_tchoutchou

# Display the public key (to add on the VPS)
cat ~/.ssh/github_actions_tchoutchou.pub
```

Then, add the public key on the VPS:
```bash
# Connect to the VPS
ssh your_user@your-domain.com

# Add the public key
echo "THE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**Format in GitHub Secret**:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...
(all the content)
...
-----END OPENSSH PRIVATE KEY-----
```

---

## ✅ Verification

Once the 5 Portainer secrets are configured, you can:

1. **Manually test** the GitHub action:
   - Go to **Actions** → **Deploy TchouTchou MCP to VPS**
   - Click on **Run workflow**

2. **Or simply push** to the `main` branch:
   ```bash
   git add .
   git commit -m "feat: update deployment"
   git push origin main
   ```

The workflow will:
- ✅ Authenticate to Portainer
- ✅ Ask Portainer to redeploy from Git  
- ✅ Wait 30 seconds
- ✅ Test the healthcheck

All in **~1 minute**! 🚀

---

## 🛡️ Security

- ✅ **NEVER** commit these secrets in the code
- ✅ Use a dedicated Portainer account if possible (with limited rights)
- ✅ Keep this `SECRETS.md` file in the repo (it doesn't contain the real values)
- ✅ Regularly renew passwords

---

## 🔧 Prior Portainer Configuration

Before launching automatic deployment, make sure that in Portainer:

### 1. The stack exists
- Created from a Git repository
- Repository URL: `https://github.com/YOUR_USERNAME/tchoutchou-mcp`
- Branch: `main`
- Compose path: `docker-compose.yml`

### 2. The Docker network exists
- Name: The one defined in your docker-compose (ex: `web`, `traefik`)
- Type: External
- Used by Traefik

### 3. Traefik is running and configured
- With Let's Encrypt (resolver: `myresolver`)
- HTTPS redirect middleware: `traefik-redirect-to-https@docker`

---

## 📞 In Case of Problems

### Error "Permission denied (publickey)"
→ The SSH key is not correctly configured. Check:
- That the private key is in `VPS_SSH_KEY`
- That the corresponding public key is in `~/.ssh/authorized_keys` on the VPS

### Error "docker: command not found"
→ Docker is not installed on the VPS or the user doesn't have rights

### Error "network traefik not found"
→ Create the network: `docker network create traefik`

---

**Last update**: 2025-11-05

