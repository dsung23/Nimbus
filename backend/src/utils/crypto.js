const crypto = require('crypto');

class CryptoService {
  constructor() {
    // Use environment variable for encryption key, fallback to a default for development
    this.algorithm = 'aes-256-gcm';
    this.key = Buffer.from(
      process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32', 
      'utf8'
    ).slice(0, 32); // Ensure 32 bytes for AES-256
  }

  /**
   * Encrypt a string (like access tokens)
   */
  encrypt(text) {
    try {
      if (!text) return null;
      
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.key);
      cipher.setAAD(Buffer.from('teller-token', 'utf8'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combine iv, authTag, and encrypted data
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('❌ Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt a string (like access tokens)
   */
  decrypt(encryptedData) {
    try {
      if (!encryptedData) return null;
      
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipher(this.algorithm, this.key);
      decipher.setAAD(Buffer.from('teller-token', 'utf8'));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('❌ Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Generate a random encryption key (for setup purposes)
   */
  generateKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash a string (for non-reversible hashing)
   */
  hash(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}

module.exports = new CryptoService();