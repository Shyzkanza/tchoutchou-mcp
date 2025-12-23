---
description: Lance dev + ngrok ensemble (alternative)
---

Lance le serveur de développement ET ngrok en parallèle.

⚠️ **Note** : Cette commande relance ngrok à chaque fois, ce qui génère une nouvelle URL. Tu devras reconfigurer ChatGPT.

**Alternative recommandée** : Utiliser `tunnel-only` + `dev-server` séparément pour garder la même URL ngrok.

```bash
cd $WORKSPACE && npm run dev:tunnel
```

