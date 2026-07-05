const CryptoJS = require('crypto-js');

if (!process.env.ENCRYPT_KEY) {
  console.warn('[WARN] ENCRYPT_KEY 未设置，请在 .env 文件中配置');
}

const ENCRYPT_KEY = process.env.ENCRYPT_KEY;

function encrypt(text) {
  if (!text) return text;
  return CryptoJS.AES.encrypt(text, ENCRYPT_KEY).toString();
}

function decrypt(ciphertext) {
  if (!ciphertext) return ciphertext;
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPT_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

module.exports = { encrypt, decrypt };
