# 𝚅𝚛𝚞𝚜𝚑 𝙼𝚊𝚛𝚒𝚊 𝚟𝟸 - Bot WhatsApp

## Vue d'ensemble
Bot WhatsApp multifonctionnel avec de nombreuses fonctionnalités, créé par **𝕽𝖆𝖛𝖊𝖓-𝓗𝓲𝓼𝓸𝓴𝓪** (+2250104610403).

## Modifications récentes (07/09/2025)
- ✅ Nom du bot changé en "𝚅𝚛𝚞𝚜𝚑 𝙼𝚊𝚛𝚒𝚊 𝚟𝟸"
- ✅ Propriétaire mis à jour : **𝕽𝖆𝖛𝖊𝖓-𝓗𝓲𝓼𝓸𝓴𝓪** (+2250104610403)
- ✅ Suppression complète du menu panel et commandes liées
- ✅ Traduction de l'indonésien vers l'anglais
- ✅ Fuseau horaire configuré pour la Côte d'Ivoire (Africa/Abidjan)
- ✅ Suppression des mots indonésiens du code
- ✅ Configuration des workflows

## Architecture du projet
```
├── index.js              # Point d'entrée principal
├── config.js             # Configuration globale du bot
├── menu.js               # Définitions des menus
├── Zion.js               # Logique de traitement principal
├── lib/                  # Bibliothèques et utilitaires
│   ├── function.js       # Fonctions utilitaires
│   ├── handler.js        # Gestionnaire de plugins
│   ├── database/         # Fichiers de données JSON
│   └── ...
├── command/              # Commandes individuelles
├── plugin/               # Plugins modulaires
└── package.json          # Dépendances Node.js
```

## Préférences utilisateur
- **Langue**: Anglais (traduit depuis l'indonésien)
- **Fuseau horaire**: Côte d'Ivoire (Africa/Abidjan)
- **Fonctionnalités supprimées**: Panel, Linode
- **Commentaires en français** pour la compréhension

## Démarrage
Le bot se lance automatiquement avec la commande `node index.js` via le workflow configuré.

## Caractéristiques principales
- Bot WhatsApp multi-device utilisant Baileys
- Système de plugins modulaire
- Commandes diverses : AI, download, convert, games, etc.
- Gestion des groupes et utilisateurs
- Support multiple formats média

---
Créé et maintenu par **𝕽𝖆𝖛𝖊𝖓-𝓗𝓲𝓼𝓸𝓴𝓪**