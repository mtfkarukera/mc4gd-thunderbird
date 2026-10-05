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
