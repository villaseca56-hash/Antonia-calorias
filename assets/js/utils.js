/**
 * Contador de Calorías Antonia - Utilities & EventBus
 * Security (Web Crypto API), Math, Export/Import JSON & Helpers
 */

// EventBus for decoupled component communication
class EventBus {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => cb(data));
  }
}

window.appEvents = new EventBus();

// Web Crypto API Encryption Helper for Private User Data
class SecurityManager {
  static async generateKey() {
    let keyRaw = localStorage.getItem('antonia_sec_key');
    if (!keyRaw) {
      const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      const exported = await window.crypto.subtle.exportKey('raw', key);
      keyRaw = Array.from(new Uint8Array(exported)).map(b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem('antonia_sec_key', keyRaw);
    }
    const bytes = new Uint8Array(keyRaw.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    return await window.crypto.subtle.importKey(
      'raw', bytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
    );
  }

  static async encryptData(plainText) {
    try {
      const key = await this.generateKey();
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv }, key, encoder.encode(plainText)
      );
      const cipherArray = new Uint8Array(encrypted);
      const payload = {
        iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
        cipher: Array.from(cipherArray).map(b => b.toString(16).padStart(2, '0')).join('')
      };
      return JSON.stringify(payload);
    } catch (e) {
      console.warn('Crypto fallback:', e);
      return plainText; // Fallback if Web Crypto is unavailable
    }
  }

  static async decryptData(encryptedString) {
    try {
      if (!encryptedString || !encryptedString.includes('cipher')) return encryptedString;
      const payload = JSON.parse(encryptedString);
      const key = await this.generateKey();
      const iv = new Uint8Array(payload.iv.match(/.{1,2}/g).map(b => parseInt(b, 16)));
      const cipher = new Uint8Array(payload.cipher.match(/.{1,2}/g).map(b => parseInt(b, 16)));
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv }, key, cipher
      );
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (e) {
      console.warn('Decrypt fallback:', e);
      return encryptedString;
    }
  }
}

// Date & Math Helpers
const Utils = {
  getTodayString() {
    const d = new Date();
    return d.toISOString().split('T')[0];
  },

  formatDateSpan(dateStr) {
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', options);
  },

  round(num, decimals = 1) {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  },

  exportBackupJSON(data) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `antonia_calorias_backup_${Utils.getTodayString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  readJSONFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
};

window.SecurityManager = SecurityManager;
window.Utils = Utils;
