# Privacy Policy — Magic Clipper for Google Drive (Thunderbird Edition)

**Last updated:** October 2026

**Magic Clipper for Google Drive** is a WebExtension designed to respect user privacy by operating entirely locally within the Thunderbird email client.

## 1. No Data Collection
We do **not** collect, track, store, or transmit any personal data, emails, attachments, usage statistics, or telemetry to external or third-party servers. All processing and network requests occur directly from your Thunderbird client.

## 2. Google Drive Access & Scope Justification
To upload your selected emails and attachments, the extension requests OAuth 2.0 access to your Google Drive using the `https://www.googleapis.com/auth/drive.file` scope.
* **Scope limitation**: Access is strictly limited to files and folders created or opened by Magic Clipper itself. The extension cannot view, access, modify, or delete any other files or folders in your Google Drive.
* **Purpose**: This permission is used solely to locate or create a dedicated folder named `"Imports Magic Clipper"` and upload your selected email PDFs, Markdown files, or attachments.

## 3. Serverless Architecture
The extension connects directly to official Google Drive API v3 endpoints (`https://www.googleapis.com/`). There are no intermediary or proxy servers. Your data is uploaded directly to your personal Google Drive space without passing through any third party.

## 4. Local Storage
The OAuth2 access token, expiration timestamp, and cached Google Drive folder ID are stored locally on your device via `browser.storage.local`. This data never leaves your device except to authenticate directly with Google APIs.

## 5. Official Privacy Policy Online
You can review our full online privacy policy and documentation at:
https://mtfk.fr/politique-confidentialite-magic-clipper/

## 6. Contact & Support
For any support, bug reports, or privacy inquiries, please contact our support group at **mtfkarukera@googlegroups.com** or email us at **contact@mtfk.fr**.

---

# Politique de Confidentialité — Magic Clipper for Google Drive (Édition Thunderbird)

**Dernière mise à jour :** Octobre 2026

**Magic Clipper for Google Drive** est une extension conçue pour respecter strictement la vie privée des utilisateurs en fonctionnant exclusivement en local dans le client de messagerie Thunderbird.

## 1. Aucune collecte de données
Nous ne collectons, ne traquons, ne stockons et ne transmettons aucune donnée personnelle, aucun e-mail, aucune pièce jointes, aucune statistique d'utilisation ni télémétrie vers des serveurs externes ou tiers. L'intégralité des traitements et des requêtes réseau s'effectue directement depuis votre client Thunderbird.

## 2. Accès à Google Drive & Justification du périmètre (Scope)
Pour téléverser vos e-mails sélectionnés et leurs pièces jointes, l'extension demande une autorisation OAuth 2.0 pour accéder à votre Google Drive via le périmètre `https://www.googleapis.com/auth/drive.file`.
* **Limitation du périmètre** : L'accès est strictement restreint aux fichiers et dossiers créés ou ouverts par Magic Clipper lui-même. L'extension ne peut ni voir, ni accéder, ni modifier, ni supprimer les autres fichiers ou dossiers de votre Google Drive.
* **Finalité** : Cette permission est uniquement utilisée pour localiser ou créer un dossier dédié nommé `"Imports Magic Clipper"` et y téléverser les e-mails convertis (PDF ou Markdown) et les pièces jointes sélectionnées.

## 3. Architecture sans serveur intermédiaire (Serverless)
L'extension se connecte directement aux points de terminaison officiels de l'API Google Drive v3 (`https://www.googleapis.com/`). Aucun serveur intermédiaire ou proxy n'est utilisé. Vos données sont transférées directement vers votre espace personnel Google Drive sans jamais transiter par un tiers.

## 4. Stockage local
Le jeton d'accès OAuth2, son horodatage d'expiration et l'identifiant en cache du dossier Google Drive sont stockés localement sur votre appareil via `browser.storage.local`. Ces données ne quittent jamais votre appareil, si ce n'est pour vous authentifier directement auprès des API Google.

## 5. Politique de confidentialité officielle en ligne
Vous pouvez consulter notre politique de confidentialité complète en ligne et la documentation à l'adresse suivante :
https://mtfk.fr/politique-confidentialite-magic-clipper/

## 6. Contact & Support
Pour tout support, signalement de bug ou question relative à la confidentialité, contactez notre groupe d'entraide à **mtfkarukera@googlegroups.com** ou écrivez-nous à **contact@mtfk.fr**.
