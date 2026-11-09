import { request, uploadRequest } from '@/api/request.js';

/**
 * 文本内容安全检测 (微信小程序等场景)
 * @param {Object} data - { content: string, openid?: string }
 */
export const apiCheckText = (data = {}) => {
    return request({
        url: '/security/check_text/',
        method: 'POST',
        data,
    });
};

/**
 * 图片内容安全检测 (微信小程序等场景)
 * @param {string} filePath - 本地图片临时路径
 */
export const apiCheckImage = (filePath) => {
    return uploadRequest({
        url: '/security/check_image/',
        filePath,
        name: 'media',
    }).then((res) => {
        if (typeof res === 'string') {
            try {
                return JSON.parse(res);
            } catch (e) {
                return { code: 500, message: '解析响应失败' };
            }
        }
        return res;
    });
};

