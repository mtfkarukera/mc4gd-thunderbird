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
  const clipMailCheckbox = document.getElementById('clip-mail-checkbox');

  let currentEmailInfo = null;
  let isAuthenticated = false;

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

  clipBtn.addEventListener('click', async () => {
    if (!isAuthenticated) {
      showStatus('Veuillez vous connecter à Google Drive d\'abord.', 'error');
      return;
    }

    const clipMail = clipMailCheckbox.checked;
    const clipFormat = document.querySelector('input[name="clip-format"]:checked')?.value || 'pdf';
    const userNote = userNoteInput.value;

    const selectedPartNames = [];
    const attCheckboxes = attachmentsListEl.querySelectorAll('input[type="checkbox"]:checked');
    attCheckboxes.forEach(cb => selectedPartNames.push(cb.value));

    if (!clipMail && selectedPartNames.length === 0) {
      showStatus('Veuillez sélectionner au moins le corps de l\'email ou une pièce jointe.', 'error');
      return;
    }

    setLoadingState(true);
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
      cb.checked = true;

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
  }

  function setLoadingState(loading) {
    clipBtn.disabled = loading;
    authBtn.disabled = loading;
    clipBtn.style.opacity = loading ? '0.6' : '1';
  }
});
