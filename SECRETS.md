# 🔐 Configuration des Secrets GitHub

Ce fichier explique les secrets à configurer dans GitHub pour le déploiement automatique via Portainer.

## 📍 Où Configurer les Secrets

1. Va sur ton repo GitHub : `https://github.com/YOUR_USERNAME/tchoutchou-mcp`
2. Clique sur **Settings** → **Secrets and variables** → **Actions**
3. Clique sur **New repository secret**

---

## 🔑 Secrets Requis

### Pour Publication npm

#### `NPM_TOKEN`
**Description**: Token d'accès npm pour publier le package  
**Comment l'obtenir**:
1. Va sur https://www.npmjs.com/settings/YOUR_NPM_USERNAME/tokens
2. Clique sur "Generate New Token" → "Classic Token"
3. Sélectionne "Automation" (pour CI/CD)
4. Copie le token généré

**Format**: `npm_xxxxxxxxxxxxxxxxxxxxxxxxxx`

⚠️ **Important**: Ce token permet de publier sur npm. Garde-le sécurisé !

---

### Pour Déploiement VPS (Portainer API)

### 1. `PORTAINER_URL`
**Description**: URL de ton instance Portainer  
**Exemple**: `https://portainer.your-domain.com`
**Comment l'obtenir**: C'est l'URL que tu utilises pour accéder à Portainer

---

### 2. `PORTAINER_USERNAME`
**Description**: Nom d'utilisateur admin Portainer  
**Exemple**: `admin` ou ton username Portainer  
**Comment l'obtenir**: Le username que tu utilises pour te connecter à Portainer

---

### 3. `PORTAINER_PASSWORD`
**Description**: Mot de passe de ton compte Portainer  
**Comment l'obtenir**: Le password que tu utilises pour te connecter à Portainer

⚠️ **Important** : Assure-toi que ce compte a les droits admin sur Portainer

---

### 4. `PORTAINER_STACK_ID`
**Description**: ID de la stack tchoutchou dans Portainer  
**Exemple**: `6`  
**Comment l'obtenir**: 
1. Va dans Portainer → Stacks → ta stack
2. Regarde l'URL : `https://portainer.your-domain.com/#!/[ENDPOINT_ID]/docker/stacks/[STACK_NAME]?id=[STACK_ID]`
3. Le paramètre `id=` contient le STACK_ID

---

### 5. `PORTAINER_ENDPOINT_ID`
**Description**: ID de l'endpoint Docker dans Portainer  
**Exemple**: `3`  
**Comment l'obtenir**: 
1. Dans la même URL de la stack
2. Le numéro après `#!/` est l'endpoint ID
3. Exemple : `https://portainer.your-domain.com/#!/3/...` → endpoint ID = `3`

---

## ⚙️ Configuration Obsolète (Ancienne Méthode SSH)

Les secrets suivants ne sont **plus nécessaires** depuis le passage à Portainer API :
- ~~`VPS_HOST`~~ (remplacé par PORTAINER_URL)
- ~~`VPS_USER`~~ (remplacé par PORTAINER_USERNAME)  
- ~~`VPS_SSH_KEY`~~ (plus nécessaire)

Tu peux les supprimer si tu les avais configurés.

---

## ✅ Vérification
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

Une fois les 5 secrets Portainer configurés, tu peux:

1. **Tester manuellement** l'action GitHub:
   - Va dans **Actions** → **Deploy TchouTchou MCP to VPS**
   - Clique sur **Run workflow**

2. **Ou simplement push** sur la branche `main`:
   ```bash
   git add .
   git commit -m "feat: update deployment"
   git push origin main
   ```

Le workflow va :
- ✅ S'authentifier à Portainer
- ✅ Demander à Portainer de redéployer depuis Git  
- ✅ Attendre 30 secondes
- ✅ Tester le healthcheck

Le tout en **~1 minute** ! 🚀

---

## 🛡️ Sécurité

- ✅ **NE JAMAIS** commit ces secrets dans le code
- ✅ Utiliser un compte Portainer dédié si possible (avec droits limités)
- ✅ Garder ce fichier `SECRETS.md` dans le repo (il ne contient pas les vraies valeurs)
- ✅ Renouveler régulièrement les mots de passe

---

## 🔧 Configuration Portainer Préalable

Avant de lancer le déploiement automatique, assure-toi que dans Portainer:

### 1. La stack existe
- Créée depuis un repository Git
- Repository URL : `https://github.com/YOUR_USERNAME/tchoutchou-mcp`
- Branch : `main`
- Compose path : `docker-compose.yml`

### 2. Le réseau Docker existe
- Nom : Celui défini dans ton docker-compose (ex: `web`, `traefik`)
- Type : External
- Utilisé par Traefik

### 3. Traefik tourne et est configuré
- Avec Let's Encrypt (resolver: `myresolver`)
- Middleware redirect HTTPS : `traefik-redirect-to-https@docker`

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

**Dernière mise à jour**: 2025-11-05

