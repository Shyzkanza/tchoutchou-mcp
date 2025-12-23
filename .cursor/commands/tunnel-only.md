---
description: 🌟 Lance ngrok (à laisser tourner pendant le dev)
---

Lance un tunnel ngrok sur le port 3000 (ou le port défini dans PORT).

**Workflow recommandé** : Lancer cette commande une fois et la laisser tourner. L'URL ngrok reste la même, pas besoin de reconfigurer ChatGPT !

Puis lancer `dev-server` dans un autre terminal.

```bash
cd $WORKSPACE && npm run tunnel
```

