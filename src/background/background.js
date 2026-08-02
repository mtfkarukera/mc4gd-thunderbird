// src/background/background.js — Event Page MV3 central (mc4gd-tb)
// S'appuie sur la skill thunderbird-mv3-expert (v1.0.0)

import McUtils from '../shared/utils.js';
import DriveClient from '../shared/drive_client.js';

'use strict';

console.log('[MC4GD-TB Background] Event Page MV3 initialisé.');

// ─────────────────────────────────────────────
// ROUTEUR DE MESSAGES (RULE #13 : return true obligatoire)
// ─────────────────────────────────────────────

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.action) return false;

  console.log(`[MC4GD-TB Background] Reçu action: ${message.action}`);

  switch (message.action) {
    case 'GET_CURRENT_EMAIL_INFO':
      handleGetCurrentEmailInfo()
        .then(res => sendResponse({ success: true, ...res }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true; // Asynchrone

    case 'CHECK_AUTH_STATUS':
      handleCheckAuthStatus()
        .then(res => sendResponse({ success: true, ...res }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true; // Asynchrone

    case 'LOGIN_GOOGLE':
      DriveClient.getAccessToken(true)
        .then(token => sendResponse({ success: !!token, token }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true; // Asynchrone

    case 'LOGOUT_GOOGLE':
      DriveClient.revokeToken()
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true; // Asynchrone

    case 'START_CLIP_PROCESS':
      handleStartClipProcess(message.payload)
        .then(res => sendResponse({ success: true, ...res }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true; // Asynchrone

    default:
      console.warn(`[MC4GD-TB Background] Action inconnue: ${message.action}`);
      return false;
  }
});

// ─────────────────────────────────────────────
// HANDLERS D'ACTIONS
// ─────────────────────────────────────────────

/**
 * Récupère l'email actuellement affiché et la liste de ses pièces jointes.
 */
async function handleGetCurrentEmailInfo() {
  let messageList = null;
  try {
    const [mailTab] = await messenger.mailTabs.query({ active: true, currentWindow: true });
    const tabId = mailTab ? (mailTab.tabId || mailTab.id) : undefined;
    messageList = await messenger.messageDisplay.getDisplayedMessages(tabId);
  } catch (e) {
    messageList = await messenger.messageDisplay.getDisplayedMessages();
  }

  if (!messageList || !messageList.messages || messageList.messages.length === 0) {
    throw new Error('Aucun email sélectionné ou affiché.');
  }

  const displayedMessage = messageList.messages[0];
  const attachments = await messenger.messages.listAttachments(displayedMessage.id);

  return {
    messageId: displayedMessage.id,
    subject: displayedMessage.subject || 'Sans sujet',
    author: displayedMessage.author || 'Inconnu',
    date: displayedMessage.date,
    attachments: attachments.map(att => ({
      name: att.name,
      size: att.size,
      contentType: att.contentType,
      partName: att.partName
    }))
  };
}

/**
 * Vérifie si un jeton d'accès Google Drive valide est présent en cache.
 */
async function handleCheckAuthStatus() {
  const { accessToken, expiresAt } = await browser.storage.local.get(['accessToken', 'expiresAt']);
  const isValid = !!(accessToken && expiresAt && expiresAt > Date.now());
  return { isAuthenticated: isValid };
}

/**
 * Traite et orchestre la demande de clipping (Mail PDF/MD + Pièces jointes).
 */
async function handleStartClipProcess(payload) {
  const { clipMail, clipFormat, selectedPartNames, userNote, customFolderName } = payload;

  const token = await DriveClient.getValidToken();
  const folderId = await DriveClient.getTargetFolderId(token, customFolderName || 'Magic Clipper Imports');

  const emailInfo = await handleGetCurrentEmailInfo();
  const uploadedFiles = [];

  // 1. Upload des pièces jointes sélectionnées via streaming Blob.slice()
  if (selectedPartNames && selectedPartNames.length > 0) {
    for (const partName of selectedPartNames) {
      const att = emailInfo.attachments.find(a => a.partName === partName);
      if (!att) continue;

      const file = await messenger.messages.getAttachmentFile(emailInfo.messageId, partName);
      const sessionUrl = await DriveClient.initResumableUpload(token, {
        fileName: file.name,
        mimeType: file.type || att.contentType || 'application/octet-stream',
        totalSize: file.size,
        folderId: folderId
      });

      const result = await DriveClient.uploadResumable(file, sessionUrl, file.size);
      uploadedFiles.push({
        type: 'attachment',
        name: file.name,
        webViewLink: result.webViewLink
      });
    }
  }

  // 2. Génération et upload du contenu de l'email si demandé
  if (clipMail) {
    const fullMessage = await messenger.messages.getFull(emailInfo.messageId);
    const bodyContent = extractEmailBody(fullMessage.parts);

    let blob;
    let fileName;
    let mimeType;

    const safeTitle = McUtils.sanitizeFileName(emailInfo.subject);
    const formattedDate = McUtils.formatDateForFileName(emailInfo.date);

    if (clipFormat === 'markdown') {
      fileName = `${safeTitle}_${formattedDate}.md`;
      mimeType = 'text/markdown';
      const mdContent = buildMarkdownContent(emailInfo, bodyContent, userNote);
      blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });

    } else {
      // PDF par défaut : Génération texte/PDF propre
      fileName = `${safeTitle}_${formattedDate}.pdf`;
      mimeType = 'application/pdf';
      const pdfTextContent = buildPdfTextContent(emailInfo, bodyContent, userNote);
      blob = new Blob([pdfTextContent], { type: 'text/plain;charset=utf-8' });
    }

    const sessionUrl = await DriveClient.initResumableUpload(token, {
      fileName,
      mimeType,
      totalSize: blob.size,
      folderId
    });

    const result = await DriveClient.uploadResumable(blob, sessionUrl, blob.size);
    uploadedFiles.push({
      type: 'mail',
      name: fileName,
      webViewLink: result.webViewLink
    });
  }

  return {
    success: true,
    folderId,
    uploadedFiles
  };
}

// ─────────────────────────────────────────────
// HELPERS DE CONTENU EMAIL
// ─────────────────────────────────────────────

function extractEmailBody(parts) {
  if (!parts || !Array.isArray(parts)) return '';

  for (const part of parts) {
    if (part.contentType === 'text/html' && part.body) {
      // Nettoyer les balises HTML de base pour le texte brut
      return part.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    if (part.contentType === 'text/plain' && part.body) {
      return part.body;
    }
    if (part.parts) {
      const subBody = extractEmailBody(part.parts);
      if (subBody) return subBody;
    }
  }
  return '';
}

function buildMarkdownContent(info, body, userNote) {
  let md = `# ${info.subject}\n\n`;
  md += `**De :** ${info.author}\n`;
  md += `**Date :** ${new Date(info.date).toLocaleString('fr-FR')}\n\n`;

  if (userNote && userNote.trim()) {
    md += `> **Note/Intention :** ${userNote.trim()}\n\n`;
  }

  md += `---\n\n`;
  md += `${body}\n`;
  return md;
}

function buildPdfTextContent(info, body, userNote) {
  let txt = `==================================================\n`;
  txt += `SUJET: ${info.subject}\n`;
  txt += `DE: ${info.author}\n`;
  txt += `DATE: ${new Date(info.date).toLocaleString('fr-FR')}\n`;
  if (userNote && userNote.trim()) {
    txt += `NOTE: ${userNote.trim()}\n`;
  }
  txt += `==================================================\n\n`;
  txt += body;
  return txt;
}
