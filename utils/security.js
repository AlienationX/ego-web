import { apiCheckText, apiCheckImage } from '@/api/security.js';

/**
 * 文本内容安全检测 (微信小程序专有前置过滤)
 * @param {string} text 待检测文本
 * @param {boolean} showModal 是否在违规时弹窗提示
 * @returns {Promise<boolean>} 是否安全合规
 */
export async function validateTextSecurity(text, showModal = true) {
    // #ifdef MP-WEIXIN
    if (!text || !String(text).trim()) return true;

    try {
        const res = await apiCheckText({ content: String(text).trim() });
        if (res && res.code === 200 && res.data?.pass) {
            return true;
        }

        const tip = res?.message || '内容包含敏感或违规信息，请修改后重试';
        if (showModal) {
            uni.showModal({
                title: '内容合规提示',
                content: tip,
                showCancel: false,
                confirmText: '我知道了',
            });
        }
        return false;
    } catch (e) {
        console.warn('[Security] 文本安全校验接口异常:', e);
        return true;
    }
    // #endif

    // 非微信小程序环境直接放行
    return true;
}

/**
 * 单张图片内容安全检测 (微信小程序专有前置过滤)
 * @param {string} filePath 图片本地文件路径 (如 wxfile:// 或 tempFilePath)
 * @param {boolean} showModal 是否在违规时弹窗提示
 * @returns {Promise<boolean>} 是否安全合规
 */
export async function validateImageSecurity(filePath, showModal = true) {
    // #ifdef MP-WEIXIN
    if (!filePath) return true;

    // 若为服务端已收录的壁纸图片（网络 URL），无需重复进行用户上传检测
    if (filePath.startsWith('https://') || filePath.startsWith('http://')) {
        // 但临时文件链接 (如 http://tmp/ 或 http://usr/) 除外
        if (!filePath.includes('/tmp/') && !filePath.includes('tmp_')) {
            return true;
        }
    }

    try {
        const res = await apiCheckImage(filePath);
        if (res && res.code === 200 && res.data?.pass) {
            return true;
        }

        const tip = res?.message || '所选图片包含违规信息，请重新选择';
        if (showModal) {
            uni.showModal({
                title: '图片合规提示',
                content: tip,
                showCancel: false,
                confirmText: '我知道了',
            });
        }
        return false;
    } catch (e) {
        console.warn('[Security] 图片安全检测接口异常:', e);
        return true;
    }
    // #endif

    return true;
}

/**
 * 批量图片内容安全检测
 * @param {string[]} filePaths 图片路径数组
 * @returns {Promise<{ pass: boolean, safePaths: string[] }>}
 */
export async function validateImagesSecurityBatch(filePaths = []) {
    // #ifdef MP-WEIXIN
    if (!filePaths || !filePaths.length) {
        return { pass: true, safePaths: [] };
    }

    uni.showLoading({ title: '安全校验中...', mask: true });
    const safePaths = [];

    for (let i = 0; i < filePaths.length; i++) {
        const path = filePaths[i];
        const isSafe = await validateImageSecurity(path, false);
        if (!isSafe) {
            uni.hideLoading();
            uni.showModal({
                title: '图片合规提示',
                content: '所选图片包含违规信息，请重新选择',
                showCancel: false,
                confirmText: '我知道了',
            });
            return { pass: false, safePaths };
        }
        safePaths.push(path);
    }

    uni.hideLoading();
    return { pass: true, safePaths };
    // #endif

    return { pass: true, safePaths: filePaths };
}

