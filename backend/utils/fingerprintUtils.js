const crypto = require('crypto');

// Encryption key and IV should be stored securely in environment variables
const ENCRYPTION_KEY = process.env.FINGERPRINT_ENCRYPTION_KEY; // 32 bytes key
const IV_LENGTH = 16; // For AES, this is always 16 bytes

const encryptFingerprint = (fingerprint) => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    
    let encrypted = cipher.update(fingerprint);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Return IV and encrypted data
    return Buffer.concat([iv, encrypted]);
  } catch (err) {
    console.error('Error encrypting fingerprint:', err);
    throw new Error('Fingerprint encryption failed');
  }
};

const decryptFingerprint = (encryptedData) => {
  try {
    const iv = encryptedData.slice(0, IV_LENGTH);
    const encryptedFingerprint = encryptedData.slice(IV_LENGTH);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    
    let decrypted = decipher.update(encryptedFingerprint);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  } catch (err) {
    console.error('Error decrypting fingerprint:', err);
    throw new Error('Fingerprint decryption failed');
  }
};

// Compare fingerprint with stored encrypted fingerprint
const compareFingerprints = (storedEncryptedData, newFingerprint) => {
  try {
    const decryptedStored = decryptFingerprint(storedEncryptedData);
    
    // Use a constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(decryptedStored, newFingerprint);
  } catch (err) {
    console.error('Error comparing fingerprints:', err);
    throw new Error('Fingerprint comparison failed');
  }
};

module.exports = {
  encryptFingerprint,
  decryptFingerprint,
  compareFingerprints
};