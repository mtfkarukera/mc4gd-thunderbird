# ARCHITECTURE.md — Magic Clipper for Google Drive (Thunderbird MV3)

## 1. Vue d'Ensemble

`mc4gd-tb` est une extension Thunderbird Manifest V3 (MV3) autonome qui permet d'extraire les emails et pièces jointes reçus dans Thunderbird et de les transférer directement vers Google Drive via l'API v3 Resumable Upload.

```
┌──────────────────────────────────────────────────────────────────┐
│  POPUP UI (src/popup/)                                           │
│  - Interface moderne Glassmorphism (HTML5/CSS3)                 │
│  - Sélection des pièces jointes & format d'export (PDF/MD)       │
│  - Saisie d'intention/note optionnelle                           │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ browser.runtime.sendMessage()
┌─────────────────────────────────▼────────────────────────────────┐
│  BACKGROUND EVENT PAGE (src/background/background.js)            │
│  - Machine à états MV3 Event Page (Gecko)                        │
│  - Gestionnaire d'identité OAuth2 (launchWebAuthFlow)            │
│  - Appels APIs Thunderbird (messenger.messageDisplay, messages)   │
│  - Drive API v3 Client (Resumable Upload, Anti-doublon)          │
└─────────────────────────────────┬────────────────────────────────┘
                                  ├──► messenger.messages.getAttachmentFile()
                                  └──► https://www.googleapis.com/upload/drive/v3
```

---

## 2. Arborescence du Projet

```
mc4gd-tb/
├── manifest.json              # Manifeste MV3 Thunderbird 128+ ESR
├── README.md                  # Documentation utilisateur & Présentation
├── ARCHITECTURE.md            # Spécification technique & flux de données
├── CHANGELOG.md               # Historique des modifications
├── AGENTS.md                  # Instructions privées (exclus de Git)
├── .gitignore                 # Exclusion des livrables et fichiers privés
├── build.sh                   # Script de packaging .xpi natif vers dist/
├── tasks.md                   # Carnet de suivi des tâches du sprint
├── _locales/                  # Traduction i18n
│   ├── en/messages.json       # Anglais (locale par défaut)
│   └── fr/messages.json       # Français
├── icons/                     # Icônes de l'extension
├── lib/                       # Bibliothèques isolées (jsPDF, Turndown, plugin GFM)
└── src/
    ├── background/
    │   └── background.js      # Event Page MV3 central (Drive client & Mail controller)
    ├── popup/
    │   ├── popup.html         # Contrôleur visuel
    │   ├── popup.css          # Styles glassmorphism
    │   └── popup.js           # Machine à états Popup UI
    ├── content/
    │   ├── pdf_generator.js   # Moteur de génération PDF client
    │   └── md_generator.js    # Moteur de conversion Markdown
    └── shared/
        ├── drive_client.js    # Client Google Drive API v3 (Resumable Upload & Folder)
        └── utils.js           # Utilitaires i18n & formatage de données
```

---

## 3. Justification des Permissions

| Permission | Usage Technique |
|---|---|
| `messagesRead` | Accéder aux métadonnées, au corps et aux pièces jointes de l'email affiché |
| `accountsRead` | Contexte d'affichage des comptes mail Thunderbird |
| `storage` | Conserver le jeton OAuth2 (`accessToken`, `expiresAt`) et l me dossier cible (`folderId`) |
| `cookies` | Lecture optionnelle du Cookie store Gecko pour la session Google |
| `downloads` | Sauvegarde locale optionnelle du fichier PDF/MD généré |
| `notifications` | Signalement de la fin d'upload ou des erreurs à l'utilisateur |
| `scripting` | Injection dynamique des scripts de rendu (`pdf_generator.js`, `jsPDF`) |
| `sensitiveDataUpload` | **Obligatoire pour ATN** : Déclaration de transfert de données d'email vers un service externe (Google Drive) |
