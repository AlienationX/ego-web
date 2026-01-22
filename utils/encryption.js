import CryptoJS from 'crypto-js';

// 从环境变量中获取加密密钥
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'wallpaper-app-secret-key';
const SECRET_IV = process.env.ENCRYPTION_IV || 'wallpaper-app-secret-iv';

// 创建加密解密实例
const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
const iv = CryptoJS.enc.Utf8.parse(SECRET_IV);

/**
 * 加密函数
 * @param {string} data - 要加密的数据
 * @returns {string} - 加密后的字符串
 */
export const encrypt = (data) => {
    if (typeof data === 'object') {
        data = JSON.stringify(data);
    }
    const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
};

/**
 * 解密函数
 * @param {string} ciphertext - 要解密的字符串
 * @returns {string|object|null} - 解密后的数据，如果输入为空则返回空字符串
 */
export const decrypt = (ciphertext) => {
    try {
        // 添加空值检查
        if (!ciphertext) {
            return '';
        }
        
        const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
            iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
        // 尝试解析为JSON对象
        try {
            return JSON.parse(plaintext);
        } catch (e) {
            return plaintext;
        }
    } catch (error) {
        console.error('解密失败:', error);
        return null;
    }
};
