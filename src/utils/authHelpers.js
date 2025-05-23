import CryptoJS from 'crypto-js';

export function getSecretHash(username, clientId, clientSecret) {
  return CryptoJS.HmacSHA256(username + clientId, clientSecret).toString(CryptoJS.enc.Base64);
}
