# Privacy Policy

**Magic Clipper for Google Drive** is a WebExtension designed to respect user privacy by operating entirely locally within the Thunderbird email client.

## Data Collection
We do **not** collect, store, or transmit any personal data, usage statistics, or telemetry.

## Network Activity
The extension communicates exclusively and directly with the **Google Drive API** (`https://www.googleapis.com/`) to upload your selected emails and attachments. No intermediate servers are involved.

## Permissions Usage
- `identity`: Required to authenticate securely via OAuth2 with Google without exposing your credentials.
- `messagesRead` & `accountsRead`: Required to access the content and attachments of the emails you explicitly choose to upload.
- `storage`: Required to cache your OAuth2 token and folder preferences locally for performance.
- `sensitiveDataUpload`: Required to authorize the upload of your email contents and attachments to your personal Google Drive space.

## Security
Authentication is handled via the official Mozilla and Google OAuth2 flows. The extension does not see your password. You have full control over your data and can revoke access at any time from your Google account settings.
