# CHANGELOG — Magic Clipper for Google Drive (Thunderbird)

Toutes les modifications notables apportées à ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2026-08-02

### Corrections
- Correction de l'apparition d'une double scrollbar (horizontale) due à la largeur fixe de la popup lorsque la scrollbar verticale système s'affichait.

## [1.0.0] - 2026-08-02

### Ajouts & Modifications
- Refonte ergonomique de la popup : sélecteur de format à pilules ("Ne pas importer", "PDF", "Markdown") fusionnant la sélection du format et l'activation du corps de l'email.
- Support natif des thèmes clair et sombre (`@media (prefers-color-scheme)`) s'adaptant automatiquement au système.
- Pièces jointes décochées par défaut à l'ouverture de la popup.
- Désactivation conditionnelle du champ de note/intention (uniquement actif si le corps de l'email est sélectionné).
- Export d'emails Thunderbird vers Google Drive (PDF/Markdown).
- Upload automatique des pièces jointes.
- Liens cliquables (fichiers et dossier) dans la popup post-upload (contournement via `browser.tabs.create`).
- Cache intelligent pour l'invalidation automatique du dossier cible `Imports Magic Clipper` sur Google Drive.
- Mode hors ligne simulé (pas de serveur intermédiaire), connexion directe via API Drive v3.

### Initialisation
- Initialisation du projet `mc4gd-tb` en WebExtension Manifest V3 pour Thunderbird 128+ ESR.
- Mise en place de la documentation et de la configuration de base (`README.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `.gitignore`).
- Configuration du script de packaging `./build.sh` ciblant l'archive `.xpi` natif dans `dist/`.
- Déclaration des permissions de sécurité ATN dont `sensitiveDataUpload`.
