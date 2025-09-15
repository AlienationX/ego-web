import { request } from '@/api/request.js';

export const apiPostAccess = (data = {}) => {
    return request({
        url: '/access/',
        data,
        method: 'POST'
    });
};

export const apiGetBanner = () => {
    return request({
        url: '/banner/'
    });
};

export const apiGetDayRandom = () => {
    return request({
        url: '/wall/random/'
    });
};

export const apiGetNotice = (data = {}, id = '') => {
    return request({
        url: id ? `/notice/${id}/` : '/notice/',
        data
    });
};

export const apiGetClassify = (data = {}) => {
    // 获取分类
    return request({
        url: '/classify/',
        data
    });
};

export const apiGetClassList = (data = {}) => {
    // 获取分类列表，也就是分类下的所有图片
    return request({
        url: '/wall/',
        data
    });
};

export const apiSearchData = (data = {}) => {
    // 获取搜索数据
    return request({
        url: '/wall/search/',
        data
    });
};

export const apiPostIncrementViews = (id = '') => {
    return request({
        url: `/wall/${id}/increment_views/`,
        method: 'POST'
    });
};

export const apiPostIncrementDownloads = (id = '') => {
    return request({
        url: `/wall/${id}/increment_downloads/`,
        method: 'POST'
    });
};

export const apiPostLoginByWechat = (data = {}) => {
    return request({
        url: '/login/wechat/',
        data,
        method: 'POST'
    });
};

// 不使用，暂时注释
// export const apiGetUserInfo = (id = '') => {
//     return request({
//         url: `/user/${id}/`
//     });
// };

export const apiGetProfile = () => {
    return request({
        url: '/user/me/'
    });
};

// demo
export const apiGetSetupScore = (data = {}) => {
    // 图片评分接口，该接口根据ip验证是否已经打过分了
    return request({
        url: '/setupScore/',
        data
    });
};
