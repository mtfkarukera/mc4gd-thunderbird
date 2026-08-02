// src/popup/popup.js — Contrôleur UI de la popup (mc4gd-tb)

'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  McUtils.applyI18n();

  const authBtn = document.getElementById('auth-btn');
  const clipBtn = document.getElementById('clip-btn');
  const subjectEl = document.getElementById('email-subject');
  const authorEl = document.getElementById('email-author');
  const dateEl = document.getElementById('email-date');
  const attachmentsListEl = document.getElementById('attachments-list');
  const attachmentsCountEl = document.getElementById('attachments-count');
  const statusEl = document.getElementById('status-message');
  const userNoteInput = document.getElementById('user-note-input');
  const formatRadios = document.querySelectorAll('input[name="clip-format"]');

  let currentEmailInfo = null;
  let isAuthenticated = false;

  // Fonction pour gérer l'activation de la note
  function updateNoteState() {
    const selectedFormat = document.querySelector('input[name="clip-format"]:checked')?.value || 'none';
    if (selectedFormat === 'none') {
      userNoteInput.disabled = true;
      userNoteInput.value = ''; // Optionnel : réinitialiser ou laisser le texte ? Laisse grisé.
    } else {
      userNoteInput.disabled = false;
    }
  }

  formatRadios.forEach(radio => {
    radio.addEventListener('change', updateNoteState);
  });
  updateNoteState();

  // 1. Initialisation de l'état Auth et Email
  await updateAuthStatus();
  await loadCurrentEmailInfo();

  // 2. Écouteurs d'événements
  authBtn.addEventListener('click', async () => {
    if (isAuthenticated) {
      await browser.runtime.sendMessage({ action: 'LOGOUT_GOOGLE' });
    } else {
      showStatus('Connexion Google en cours...', 'info');
      await browser.runtime.sendMessage({ action: 'LOGIN_GOOGLE' });
    }
    await updateAuthStatus();
  });

  const driveResultActions = document.getElementById('drive-result-actions');
  const openFolderBtn = document.getElementById('open-folder-btn');
  const driveFileLinks = document.getElementById('drive-file-links');

  clipBtn.addEventListener('click', async () => {
    if (!isAuthenticated) {
      showStatus('Veuillez vous connecter à Google Drive d\'abord.', 'error');
      return;
    }

    const clipFormatSelection = document.querySelector('input[name="clip-format"]:checked')?.value || 'none';
    const clipMail = clipFormatSelection !== 'none';
    const clipFormat = clipMail ? clipFormatSelection : 'pdf';
    const userNote = clipMail ? userNoteInput.value : '';

    const selectedPartNames = [];
    const attCheckboxes = attachmentsListEl.querySelectorAll('input[type="checkbox"]:checked');
    attCheckboxes.forEach(cb => selectedPartNames.push(cb.value));

    if (!clipMail && selectedPartNames.length === 0) {
      showStatus('Veuillez sélectionner au moins un format pour l\'email ou une pièce jointe.', 'error');
      return;
    }

    setLoadingState(true);
    hideDriveActions();
    showStatus('Clipping vers Google Drive en cours...', 'info');

    try {
      const response = await browser.runtime.sendMessage({
        action: 'START_CLIP_PROCESS',
        payload: {
          clipMail,
          clipFormat,
          selectedPartNames,
          userNote
        }
      });

      if (response && response.success) {
        showStatus(`Succès ! ${response.uploadedFiles.length} fichier(s) envoyés sur Drive.`, 'success');
        displayDriveActions(response.folderId, response.uploadedFiles);
      } else {
        showStatus(`Erreur : ${response.error || 'Échec de l\'upload'}`, 'error');
      }
    } catch (err) {
      showStatus(`Erreur : ${err.message}`, 'error');
    } finally {
      setLoadingState(false);
    }
  });

  // ─────────────────────────────────────────────
  // HELPERS POPUP
  // ─────────────────────────────────────────────

  async function updateAuthStatus() {
    try {
      const res = await browser.runtime.sendMessage({ action: 'CHECK_AUTH_STATUS' });
      isAuthenticated = !!(res && res.isAuthenticated);
      authBtn.textContent = isAuthenticated ? 'Déconnexion' : 'Connexion Google';
      authBtn.classList.toggle('btn-secondary', isAuthenticated);
    } catch {
      isAuthenticated = false;
      authBtn.textContent = 'Connexion Google';
    }
  }

  async function loadCurrentEmailInfo() {
    try {
      const res = await browser.runtime.sendMessage({ action: 'GET_CURRENT_EMAIL_INFO' });
      if (res && res.success) {
        currentEmailInfo = res;
        subjectEl.textContent = res.subject;
        authorEl.textContent = `De : ${res.author}`;
        dateEl.textContent = `Date : ${new Date(res.date).toLocaleString('fr-FR')}`;

        renderAttachments(res.attachments);
      } else {
        subjectEl.textContent = 'Aucun email sélectionné';
      }
    } catch (err) {
      subjectEl.textContent = 'Erreur de lecture de l\'email';
      console.error(err);
    }
  }

  function renderAttachments(attachments) {
    attachmentsListEl.innerHTML = '';
    if (!attachments || attachments.length === 0) {
      attachmentsCountEl.textContent = '0';
      attachmentsListEl.innerHTML = '<p class="empty-hint">Aucune pièce jointe dans cet email.</p>';
      return;
    }

    attachmentsCountEl.textContent = attachments.length.toString();

    attachments.forEach(att => {
      const item = document.createElement('div');
      item.className = 'attachment-item';

      const label = document.createElement('label');
      label.className = 'checkbox-label';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = att.partName;
      cb.checked = false;

      const nameSpan = document.createElement('span');
      nameSpan.textContent = `${att.name} (${McUtils.formatBytes(att.size)})`;

      label.appendChild(cb);
      label.appendChild(nameSpan);
      item.appendChild(label);
      attachmentsListEl.appendChild(item);
    });
  }

  function showStatus(message, type = 'info') {
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.classList.remove('hidden');
    if (type !== 'success') {
      hideDriveActions();
    }
  }

  if (openFolderBtn) {
    openFolderBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const url = openFolderBtn.dataset.url || openFolderBtn.href;
      if (url && url !== '#') {
        browser.tabs.create({ url });
      }
    });
  }

  function displayDriveActions(folderId, uploadedFiles) {
    if (!driveResultActions) return;

    if (folderId && openFolderBtn) {
      const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
      openFolderBtn.href = folderUrl;
      openFolderBtn.dataset.url = folderUrl;
    }

    if (driveFileLinks) {
      driveFileLinks.innerHTML = '';
      if (uploadedFiles && uploadedFiles.length > 0) {
        uploadedFiles.forEach(file => {
          if (!file.webViewLink) return;
          const a = document.createElement('a');
          a.href = file.webViewLink;
          a.className = 'drive-file-link';
          const icon = file.type === 'mail' ? '📄' : '📎';
          a.textContent = `${icon} ${file.name} ↗`;
          a.addEventListener('click', (e) => {
            e.preventDefault();
            browser.tabs.create({ url: file.webViewLink });
          });
          driveFileLinks.appendChild(a);
        });
      }
    }

    driveResultActions.classList.remove('hidden');
  }

  function hideDriveActions() {
    if (driveResultActions) {
      driveResultActions.classList.add('hidden');
    }
  }

  function setLoadingState(loading) {
    clipBtn.disabled = loading;
    authBtn.disabled = loading;
    clipBtn.style.opacity = loading ? '0.6' : '1';
  }
});
