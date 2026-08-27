import { request } from '@/api/request.js';

/**
 * VIP 自动更换壁纸 - 获取用户配置
 */
export const apiGetRotateConfig = (data = {}) => {
    return request({
        url: '/rotate/config/',
        data,
        method: 'GET',
        isAuth: true,
    });
};

/**
 * VIP 自动更换壁纸 - 保存用户配置
 */
export const apiSaveRotateConfig = (data = {}) => {
    return request({
        url: '/rotate/save_config/',
        data,
        method: 'POST',
        isAuth: true,
    });
};

/**
 * VIP 自动更换壁纸 - 快捷指令/自动化 Feed 拉取接口
 */
export const apiGetRotateFeed = (data = {}) => {
    return request({
        url: '/rotate/feed/',
        data,
        method: 'GET',
        isAuth: true,
    });
};
