# CHANGELOG — Magic Clipper for Google Drive (Thunderbird)

Toutes les modifications notables apportées à ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.2] - 2026-08-03

### Corrections & Améliorations Post-Audit
- **Génération PDF Native Binaire** : Intégration de la bibliothèque client `jsPDF` dans l'Event Page pour générer de vrais fichiers PDF binaires valides (`%PDF-`) au lieu de simples conteneurs texte brut.
- **Robustesse Drive API & Mutex** : Implémentation d'un verrou asynchrone (Mutex) sur la recherche/création du dossier `Imports Magic Clipper` pour empêcher la génération de dossiers en doublons lors des uploads simultanés.
- **Gestion des Erreurs OAuth** : Rafraîchissement sécurisé des jetons et gestion propre de l'expiration des sessions résumables d'upload sur erreur 401.
- **Accessibilité WCAG 2.1 AA** : Masquage visuel accessible des radio boutons (`.sr-only`), ajout du focus-visible au clavier (`TAB`), structure HTML sémantique (`fieldset`, `legend`) et région dynamique `aria-live` pour l'annonce vocale des statuts.
- **Polishing UI / UX** : Animation de montage fluide (`fadeSlideUp`), ombres composées de glassmorphism et retour tactile sur le bouton principal.
- **Affichage des Icônes** : Déclaration de la clé racine `icons` dans `manifest.json` afin de pouvoir afficher correctement l'icône officielle de l'application dans `about:addons`.

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
