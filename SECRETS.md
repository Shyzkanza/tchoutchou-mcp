# 🔐 Configuration des Secrets GitHub

Ce fichier explique les secrets à configurer dans GitHub pour le déploiement automatique.

## 📍 Où Configurer les Secrets

1. Va sur ton repo GitHub : `https://github.com/TON_USERNAME/tchoutchou-mcp`
2. Clique sur **Settings** → **Secrets and variables** → **Actions**
3. Clique sur **New repository secret**

---

## 🔑 Secrets Requis

### 1. `VPS_HOST`
**Description**: Adresse IP ou domaine de ton VPS  
**Exemple**: `rankorr.red` ou `123.45.67.89`  
**Comment l'obtenir**: C'est l'adresse de ton serveur Debian

---

### 2. `VPS_USER`
**Description**: Nom d'utilisateur SSH pour se connecter au VPS  
**Exemple**: `root` ou `deploy` ou ton nom d'utilisateur  
**Comment l'obtenir**: C'est l'utilisateur que tu utilises pour te connecter en SSH

---

### 3. `VPS_SSH_KEY`
**Description**: Clé privée SSH pour se connecter au VPS  
**Comment l'obtenir**:

#### Option A: Utiliser une clé existante
```bash
# Sur ta machine locale
cat ~/.ssh/id_rsa
```

Copie TOUT le contenu (y compris `-----BEGIN` et `-----END`)

#### Option B: Créer une nouvelle clé dédiée (recommandé)
```bash
# Sur ta machine locale
ssh-keygen -t ed25519 -C "github-actions-tchoutchou" -f ~/.ssh/github_actions_tchoutchou

# Afficher la clé privée (à mettre dans GitHub Secret)
cat ~/.ssh/github_actions_tchoutchou

# Afficher la clé publique (à ajouter sur le VPS)
cat ~/.ssh/github_actions_tchoutchou.pub
```

Ensuite, ajoute la clé publique sur le VPS:
```bash
# Se connecter au VPS
ssh ton_user@rankorr.red

# Ajouter la clé publique
echo "LA_CLE_PUBLIQUE_ICI" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**Format dans GitHub Secret**:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...
(tout le contenu)
...
-----END OPENSSH PRIVATE KEY-----
```

---

## ✅ Vérification

Une fois les 3 secrets configurés, tu peux:

1. **Tester manuellement** l'action GitHub:
   - Va dans **Actions** → **Build and Deploy to VPS**
   - Clique sur **Run workflow**

2. **Ou simplement push** sur la branche `main`:
   ```bash
   git add .
   git commit -m "feat: setup deployment"
   git push origin main
   ```

Le workflow se lancera automatiquement ! 🚀

---

## 🛡️ Sécurité

- ✅ **NE JAMAIS** commit ces secrets dans le code
- ✅ Utiliser une clé SSH dédiée pour GitHub Actions
- ✅ Limiter les permissions de l'utilisateur SSH si possible
- ✅ Garder ce fichier `SECRETS.md` dans le repo (il ne contient pas les vraies valeurs)

---

## 🔧 Configuration VPS Préalable

Avant de lancer le déploiement, assure-toi que sur ton VPS:

### 1. Docker et Docker Compose sont installés
```bash
docker --version
docker-compose --version
```

### 2. Le réseau Traefik existe
```bash
docker network ls | grep traefik
```

Si pas présent:
```bash
docker network create traefik
```

### 3. Traefik tourne avec Let's Encrypt configuré
```bash
docker ps | grep traefik
```

### 4. Le DNS est configuré
```bash
# Vérifier que le domaine pointe vers le VPS
nslookup tchoutchou-mcp.rankorr.red
```

---

## 📞 En Cas de Problème

### Erreur "Permission denied (publickey)"
→ La clé SSH n'est pas correctement configurée. Vérifie:
- Que la clé privée est bien dans `VPS_SSH_KEY`
- Que la clé publique correspondante est dans `~/.ssh/authorized_keys` sur le VPS

### Erreur "docker: command not found"
→ Docker n'est pas installé sur le VPS ou l'utilisateur n'a pas les droits

### Erreur "network traefik not found"
→ Crée le réseau: `docker network create traefik`

---

**Maintenu par**: Jessy Bonnotte  
**Dernière mise à jour**: 2025-11-02

