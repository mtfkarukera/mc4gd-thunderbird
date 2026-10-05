// src/background/background.js — Event Page MV3 central (mc4gd-tb)
// S'appuie sur la skill thunderbird-mv3-expert (v1.0.0)

// Les dépendances (McUtils, DriveClient) sont chargées via manifest.json.

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
    // Dans Thunderbird MV3, on utilise tabs.query pour supporter tous les types de fenêtres (3-pane et standalone)
    const tabs = await messenger.tabs.query({ active: true, currentWindow: true });
    const tabId = (tabs && tabs.length > 0) ? tabs[0].id : undefined;
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
 * Si le jeton est expiré mais qu'un jeton existait, tente un renouvellement silencieux
 * via les cookies de session Gecko sans ouvrir de fenêtre popup.
 */
async function handleCheckAuthStatus() {
  const { accessToken, expiresAt } = await browser.storage.local.get(['accessToken', 'expiresAt']);

  // Cas 1 : Jeton déjà valide en cache
  if (accessToken && expiresAt && expiresAt > Date.now()) {
    return { isAuthenticated: true, status: 'valid' };
  }

  // Cas 2 : Un jeton existait mais est expiré -> tentative de renouvellement silencieux non bloquante
  if (accessToken) {
    try {
      const silentToken = await DriveClient.getAccessToken(false);
      if (silentToken) {
        return { isAuthenticated: true, status: 'refreshed' };
      }
    } catch (e) {
      console.warn('[MC4GD-TB] Échec du rafraîchissement silencieux OAuth:', e);
    }
    return { isAuthenticated: false, status: 'expired' };
  }

  // Cas 3 : Aucun jeton n'a jamais été enregistré
  return { isAuthenticated: false, status: 'unauthenticated' };
}

/**
 * Traite et orchestre la demande de clipping (Mail PDF/MD + Pièces jointes).
 */
async function handleStartClipProcess(payload) {
  const { clipMail, clipFormat, selectedPartNames, userNote, customFolderName } = payload;

  const token = await DriveClient.getValidToken();
  const folderId = await DriveClient.getTargetFolderId(token, customFolderName || 'Imports Magic Clipper');

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
      // Génération PDF binaire valide via la bibliothèque jsPDF
      fileName = `${safeTitle}_${formattedDate}.pdf`;
      mimeType = 'application/pdf';
      blob = generatePdfBlob(emailInfo, bodyContent, userNote);
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

/**
 * Extrait le corps du message en gérant les types MIME complexes (ex: text/html; charset=utf-8).
 */
function extractEmailBody(parts) {
  if (!parts || !Array.isArray(parts)) return '';

  for (const part of parts) {
    const contentType = (part.contentType || '').toLowerCase();
    if (contentType.startsWith('text/html') && part.body) {
      // Nettoyer les balises HTML de base pour le rendu texte brut
      return part.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    if (contentType.startsWith('text/plain') && part.body) {
      return part.body;
    }
    if (part.parts) {
      const subBody = extractEmailBody(part.parts);
      if (subBody) return subBody;
    }
  }
  return '';
}

/**
 * Génère un document Markdown à partir des métadonnées et du corps de l'email.
 */
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

/**
 * Génère un vrai fichier PDF binaire valide via jsPDF.
 */
function generatePdfBlob(info, body, userNote) {
  const jsPDF = (globalThis.jspdf && globalThis.jspdf.jsPDF) || (window.jspdf && window.jspdf.jsPDF);
  if (!jsPDF) {
    throw new Error('La bibliothèque jsPDF n\'est pas disponible dans le contexte du background script.');
  }

  const doc = new jsPDF();
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxLineWidth = pageWidth - (margin * 2);
  let y = 20;

  // Titre / Sujet
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  const subjectLines = doc.splitTextToSize(`Sujet : ${info.subject}`, maxLineWidth);
  doc.text(subjectLines, margin, y);
  y += (subjectLines.length * 6) + 4;

  // Métadonnées
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`De : ${info.author}`, margin, y);
  y += 5;
  doc.text(`Date : ${new Date(info.date).toLocaleString('fr-FR')}`, margin, y);
  y += 7;

  // Note d'intention
  if (userNote && userNote.trim()) {
    doc.setFont('Helvetica', 'italic');
    const noteLines = doc.splitTextToSize(`Note : ${userNote.trim()}`, maxLineWidth);
    doc.text(noteLines, margin, y);
    y += (noteLines.length * 5) + 6;
  }

  // Ligne de séparation
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Corps de l'email avec gestion des saut de pages
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  const bodyLines = doc.splitTextToSize(body || '', maxLineWidth);

  const pageHeight = doc.internal.pageSize.getHeight();
  for (let i = 0; i < bodyLines.length; i++) {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(bodyLines[i], margin, y);
    y += 5;
  }

  return doc.output('blob');
}
