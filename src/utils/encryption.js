import CryptoJS from 'crypto-js';
import { readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const SECRET_KEY = process.env.AUTODEPLOY_SECRET || 'autodeploy-default-key-change-this';

export function encrypt(text) {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

export function decrypt(ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

export function encryptObject(obj) {
    return encrypt(JSON.stringify(obj));
}

export function decryptObject(ciphertext) {
    return JSON.parse(decrypt(ciphertext));
}