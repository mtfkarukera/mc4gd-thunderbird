# Magic Clipper for Google Drive (Thunderbird Edition)

**Magic Clipper for Google Drive** est une extension WebExtension Manifest V3 (MV3) pour Thunderbird 128+ ESR, permettant de sauvegarder directement vos emails et leurs pièces jointes vers votre espace **Google Drive** en 1 clic.

---

## 🚀 Fonctionnalités Principales

- 📄 **Export Email → PDF** : Rendu clair et mise en page optimisée pour la lecture et le stockage d'archivage.
- 📝 **Export Email → Markdown** : Conversion HTML vers Markdown enrichi (support des tableaux GFM).
- 📎 **Upload direct des Pièces Jointes** : Sélection et transfert streaming sans surcharge mémoire de vos pièces jointes (PDF, ZIP, images, documents).
- 🎯 **Organisation par Dossier Google Drive** : Sélection ou création automatique de votre dossier cible sur Google Drive (avec détection anti-doublon).
- 💬 **Grounding & Notes Personnalisées** : Possibilité d'ajouter une note ou une intention d'archivage directement en en-tête des documents capturés.

---

## 🔒 Confidentialité & Sécurité

- **100% Local & Direct** : Le transfert s'effectue directement entre votre client Thunderbird et les serveurs sécurisés de Google Drive via l'API officielle v3.
- **Zéro serveur intermédiaire** : Aucune donnée, aucun email ni aucun jeton ne transite par un serveur tiers.
- **Transparence des données** : L'extension utilise l'autorisation OAuth2 officielle Google pour garantir le contrôle total de vos accès.

---

## 📋 Prérequis

- **Thunderbird** : Version 128+ ESR (ou ultérieure).
- **Compte Google** : Un compte Google avec Google Drive actif.

---

## 🛠️ Compilation & Installation

```bash
# Télécharger les dépendances ou vérifier le projet
./build.sh
```

Le fichier compilé d'extension (`.xpi`) sera généré dans le dossier `dist/`.

---

*Développé par **MTF Karukera**. Découvre toutes les solutions logicielles et outils de productivité de la suite **magic-softs** sur [magic-clipper.mtfk.fr](https://magic-clipper.mtfk.fr/).*
