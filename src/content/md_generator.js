// src/content/md_generator.js — Générateur Markdown pour mc4gd-tb

'use strict';

const MdGenerator = {
  /**
   * Génère du Markdown structuré depuis les métadonnées email et la note d'intention.
   * @param {Object} emailInfo - Métadonnées email
   * @param {string} bodyText - Corps de l'email
   * @param {string} [userNote] - Note personnalisée
   * @returns {Blob} Le fichier Markdown sous forme de Blob
   */
  generateMdBlob(emailInfo, bodyText, userNote) {
    let md = `# ${emailInfo.subject || 'Sans sujet'}\n\n`;
    md += `**De :** ${emailInfo.author || 'Inconnu'}\n`;
    md += `**Date :** ${new Date(emailInfo.date).toLocaleString('fr-FR')}\n\n`;

    if (userNote && userNote.trim()) {
      md += `> **Note / Intention :** ${userNote.trim()}\n\n`;
    }

    md += `---\n\n`;
    md += `${bodyText || ''}\n`;

    return new Blob([md], { type: 'text/markdown;charset=utf-8' });
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MdGenerator;
} else if (typeof window !== 'undefined') {
  window.MdGenerator = MdGenerator;
}
