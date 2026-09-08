/**
 * 新用户专享福利管理模块
 * 提供前 3 次免费免广告极速下载等新手特权
 */

export const NEW_USER_FREE_DOWNLOADS_MAX = 3;
export const STORAGE_KEY_FREE_DOWNLOADS = 'new_user_free_downloads_used';

/**
 * 获取新人剩余免广告下载次数
 * @returns {number} 0 ~ 3
 */
export function getNewUserFreeDownloadRemaining() {
    try {
        const used = Number(uni.getStorageSync(STORAGE_KEY_FREE_DOWNLOADS) || 0);
        return Math.max(0, NEW_USER_FREE_DOWNLOADS_MAX - used);
    } catch (e) {
        return 0;
    }
}

/**
 * 检查当前是否享有新人免广告下载特权
 * @returns {boolean}
 */
export function isNewUserFreeBenefitAvailable() {
    return getNewUserFreeDownloadRemaining() > 0;
}

/**
 * 消耗一次新人免广告下载特权
 * @returns {number} 消耗后剩余次数
 */
export function consumeNewUserFreeDownload() {
    try {
        const used = Number(uni.getStorageSync(STORAGE_KEY_FREE_DOWNLOADS) || 0);
        const newUsed = used + 1;
        uni.setStorageSync(STORAGE_KEY_FREE_DOWNLOADS, newUsed);
        return Math.max(0, NEW_USER_FREE_DOWNLOADS_MAX - newUsed);
    } catch (e) {
        return 0;
    }
}
