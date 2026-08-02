# CHANGELOG — Magic Clipper for Google Drive (Thunderbird)

Toutes les modifications notables apportées à ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Initialisation
- Initialisation du projet `mc4gd-tb` en WebExtension Manifest V3 pour Thunderbird 128+ ESR.
- Mise en place des 5 fichiers de gouvernance (`README.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `AGENTS.md`, `.gitignore`).
- Configuration du script de packaging `./build.sh` ciblant l'archive `.xpi` natif dans `dist/`.
- Déclaration des permissions de sécurité ATN dont `sensitiveDataUpload`.
