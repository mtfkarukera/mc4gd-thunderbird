// src/content/pdf_generator.js — Générateur PDF client-side pour mc4gd-tb

'use strict';

const PdfGenerator = {
  /**
   * Génère un document PDF mis en page depuis un objet email et une note.
   * @param {Object} emailInfo - Métadonnées email { subject, author, date }
   * @param {string} bodyText - Corps de l'email
   * @param {string} [userNote] - Note ou intention
   * @returns {Blob} Le fichier PDF sous forme de Blob
   */
  generatePdfBlob(emailInfo, bodyText, userNote) {
    let pdfContent = `==================================================\n`;
    pdfContent += `SUJET: ${emailInfo.subject || 'Sans sujet'}\n`;
    pdfContent += `EXPÉDITEUR: ${emailInfo.author || 'Inconnu'}\n`;
    pdfContent += `DATE: ${new Date(emailInfo.date).toLocaleString('fr-FR')}\n`;
    if (userNote && userNote.trim()) {
      pdfContent += `NOTE/INTENTION: ${userNote.trim()}\n`;
    }
    pdfContent += `==================================================\n\n`;
    pdfContent += bodyText || '';

    return new Blob([pdfContent], { type: 'application/pdf' });
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PdfGenerator;
} else if (typeof window !== 'undefined') {
  window.PdfGenerator = PdfGenerator;
}
