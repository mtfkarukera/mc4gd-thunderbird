// src/shared/drive_client.js — Client Google Drive API v3 (Thunderbird MV3)
// S'appuie sur la skill google-drive-api-v3-expert (v1.0.0)

'use strict';

const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
const CLIENT_ID = '270035285728-p7ssnc4jqitu5d12j5kuouinirf7vfnf.apps.googleusercontent.com'; // Public Web App Client ID
const CHUNK_SIZE = 8 * 1024 * 1024; // 8 Mo = 32 × 256 KiB
const MAX_RETRIES = 5;

const DriveClient = {
  /**
   * Obtient un jeton d'accès OAuth2 auprès des serveurs Google.
   * @param {boolean} interactive - true pour ouvrir la popup de connexion si besoin
   * @returns {Promise<string|null>} Token d'accès ou null
   */
  async getAccessToken(interactive = false) {
    const redirectUri = browser.identity.getRedirectURL();
    const scopes = encodeURIComponent(GOOGLE_DRIVE_SCOPE);

    const authUrl = [
      'https://accounts.google.com/o/oauth2/auth',
      `?client_id=${CLIENT_ID}`,
      `&response_type=token`,
      `&redirect_uri=${encodeURIComponent(redirectUri)}`,
      `&scope=${scopes}`
    ].join('');

    try {
      const responseUrl = await browser.identity.launchWebAuthFlow({ interactive, url: authUrl });
      const urlParams = new URL(responseUrl.replace('#', '?')).searchParams;
      const token = urlParams.get('access_token');
      const expiresIn = parseInt(urlParams.get('expires_in'), 10) || 3599;

      if (!token) return null;

      // Persister le jeton avec une marge de sécurité de 2 minutes (120 000 ms)
      const expiresAt = Date.now() + (expiresIn * 1000) - 120_000;
      await browser.storage.local.set({ accessToken: token, expiresAt });

      return token;
    } catch (err) {
      if (interactive) throw err;
      return null;
    }
  },

  /**
   * Récupère un token valide (depuis le cache, par rafraîchissement silencieux, ou par popup interactive).
   * @returns {Promise<string>} Token OAuth2 valide
   */
  async getValidToken() {
    const { accessToken, expiresAt } = await browser.storage.local.get(['accessToken', 'expiresAt']);

    if (accessToken && expiresAt && expiresAt > Date.now()) {
      return accessToken;
    }

    // Essayer le renouvellement silencieux en premier
    const silentToken = await this.getAccessToken(false);
    if (silentToken) return silentToken;

    // Fallback interactif
    const interactiveToken = await this.getAccessToken(true);
    if (!interactiveToken) throw new Error('DRIVE_AUTH_FAILED');
    
    return interactiveToken;
  },

  /**
   * Révoche le jeton auprès de Google et purge le stockage local.
   */
  async revokeToken() {
    const { accessToken } = await browser.storage.local.get('accessToken');
    if (accessToken) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
      } catch {
        // Ignorer les erreurs réseau lors de la révocation
      }
    }
    await browser.storage.local.remove(['accessToken', 'expiresAt', 'folderId']);
  },

  /**
   * Cherche un dossier par son nom dans Google Drive (Anti-doublon).
   */
  async findFolder(token, folderName) {
    const safeName = folderName.replace(/'/g, "\\'");
    const q = `name='${safeName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', q);
    url.searchParams.set('fields', 'files(id)');
    url.searchParams.set('orderBy', 'createdTime desc');
    url.searchParams.set('spaces', 'drive');

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    await this.throwIfDriveError(response);
    const data = await response.json();

    return data.files?.length > 0 ? data.files[0].id : null;
  },

  /**
   * Crée un nouveau dossier sur Google Drive.
   */
  async createFolder(token, folderName) {
    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      })
    });

    await this.throwIfDriveError(response);
    const data = await response.json();
    return data.id;
  },

  /**
   * Obtient l'identifiant du dossier cible (utilise le cache local ou effectue la recherche/création).
   */
  async getTargetFolderId(token, folderName = 'Magic Clipper Imports') {
    const { folderId: cached } = await browser.storage.local.get('folderId');
    if (cached) return cached;

    let folderId = await this.findFolder(token, folderName);
    if (!folderId) {
      folderId = await this.createFolder(token, folderName);
    }

    await browser.storage.local.set({ folderId });
    return folderId;
  },

  /**
   * Invalide le cache local du dossier cible en cas d'erreur 404.
   */
  async invalidateFolderCache() {
    await browser.storage.local.remove('folderId');
  },

  /**
   * Initialise une session d'upload résumable sur Google Drive.
   */
  async initResumableUpload(token, metadata) {
    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': metadata.mimeType,
        'X-Upload-Content-Length': metadata.totalSize.toString()
      },
      body: JSON.stringify({
        name: metadata.fileName,
        mimeType: metadata.mimeType,
        parents: [metadata.folderId]
      })
    });

    await this.throwIfDriveError(response);
    const sessionUrl = response.headers.get('Location');
    if (!sessionUrl) throw new Error('DRIVE_NO_SESSION_URL');

    return sessionUrl;
  },

  /**
   * Exécute l'upload d'un Blob/File par morceaux (chunks) vers l'URL de session résumable.
   */
  async uploadResumable(blob, sessionUrl, totalSize, onProgress) {
    let bytesSent = 0;

    while (bytesSent < totalSize) {
      const chunkEnd = Math.min(bytesSent + CHUNK_SIZE, totalSize);
      const chunk = blob.slice(bytesSent, chunkEnd, blob.type);

      let lastError;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const response = await fetch(sessionUrl, {
            method: 'PUT',
            headers: {
              'Content-Length': chunk.size.toString(),
              'Content-Range': `bytes ${bytesSent}-${chunkEnd - 1}/${totalSize}`
            },
            body: chunk
          });

          if (response.status === 308) {
            const rangeHeader = response.headers.get('Range');
            if (rangeHeader) {
              const match = rangeHeader.match(/bytes=0-(\d+)/);
              bytesSent = match ? parseInt(match[1], 10) + 1 : chunkEnd;
            } else {
              bytesSent = 0;
            }
            onProgress?.(bytesSent, totalSize);
            break;

          } else if (response.ok) {
            return await response.json(); // { id, name, webViewLink }

          } else if (response.status === 401) {
            const newToken = await this.getValidToken();
            throw Object.assign(new Error('TOKEN_REFRESHED'), { isRetryable: true });

          } else if ([429, 500, 502, 503, 504].includes(response.status)) {
            throw Object.assign(new Error(`DRIVE_HTTP_${response.status}`), { isRetryable: true });

          } else if (response.status === 404) {
            throw new Error('DRIVE_SESSION_EXPIRED');

          } else {
            throw new Error(`DRIVE_HTTP_${response.status}`);
          }
        } catch (error) {
          if (!error.isRetryable || attempt >= MAX_RETRIES) throw error;
          lastError = error;

          const delay = Math.pow(2, attempt) * 1000 * (0.5 + Math.random() * 0.5);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  },

  /**
   * Helper pour attraper et structurer les erreurs de réponse de l'API Google Drive.
   */
  async throwIfDriveError(response) {
    if (response.ok) return;

    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      if (body.error?.message) {
        message = `${body.error.code}: ${body.error.message} (${body.error.status})`;
      }
    } catch { /* Ignorer non-JSON */ }

    const error = new Error(message);
    error.httpStatus = response.status;
    throw error;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DriveClient;
} else if (typeof window !== 'undefined') {
  window.DriveClient = DriveClient;
}
