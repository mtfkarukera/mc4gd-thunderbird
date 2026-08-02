// src/shared/utils.js — Module d'utilitaires partagés pour mc4gd-tb

'use strict';

const McUtils = {
  /**
   * Helper d'internationalisation i18n.
   * @param {string} key - Clé de message dans messages.json
   * @param {string|Array<string>} [substitutions] - Substitutions éventuelles
   * @returns {string} Le message traduit ou la clé si absente
   */
  t(key, substitutions) {
    if (typeof browser !== 'undefined' && browser.i18n && browser.i18n.getMessage) {
      const msg = browser.i18n.getMessage(key, substitutions);
      if (msg) return msg;
    }
    return key;
  },

  /**
   * Applique automatiquement data-i18n à tous les éléments HTML du document.
   * @param {Document|HTMLElement} [root=document] - Racine du DOM à traduire
   */
  applyI18n(root = document) {
    const elements = root.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.t(key);
      }
    });

    const placeholders = root.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.setAttribute('placeholder', this.t(key));
      }
    });

    const titles = root.querySelectorAll('[data-i18n-title]');
    titles.forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.setAttribute('title', this.t(key));
      }
    });
  },

  /**
   * Nettoie un nom de fichier pour éliminer les caractères interdits sur les OS/SGBD.
   * @param {string} name - Nom brut du fichier ou du sujet d'email
   * @param {string} [fallback="clamped_document"] - Nom par défaut si vide
   * @returns {string} Nom de fichier propre et sécurisé
   */
  sanitizeFileName(name, fallback = 'clamped_document') {
    if (!name || typeof name !== 'string') return fallback;
    
    // Supprimer les caractères de contrôle et réservés : \ / : * ? " < > |
    let safe = name.replace(/[\x00-\x1f\x7f\\/:*?"<>|]/g, '_').trim();
    
    // Réduire les espaces multiples
    safe = safe.replace(/\s+/g, ' ');
    
    // Éviter les noms réservés Windows (CON, PRN, AUX, NUL, COM1, etc.)
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(safe)) {
      safe = `${safe}_doc`;
    }
    
    // Tronquer à 150 caractères maximum pour éviter d'excéder MAX_PATH
    if (safe.length > 150) {
      safe = safe.substring(0, 150).trim();
    }
    
    return safe || fallback;
  },

  /**
   * Formate une date en chaîne ISO lisible (AAAA-MM-JJ_HHmm).
   * @param {Date|string|number} dateInput - Date à formater
   * @returns {string} Date formatée pour le nom de fichier
   */
  formatDateForFileName(dateInput) {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}_${hours}${minutes}`;
  },

  /**
   * Formate une taille en octets de manière lisible (Ko, Mo, Go).
   * @param {number} bytes - Taille en octets
   * @returns {string} Taille lisible
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = McUtils;
} else if (typeof window !== 'undefined') {
  window.McUtils = McUtils;
}
