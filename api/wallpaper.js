import { request, uploadRequest, streamRequest } from '@/api/request.js';

// 访问接口
export const apiPostAccess = (data = {}) => {
    return request({
        url: '/access/',
        data,
        method: 'POST',
    });
};

// 获取banner接口
export const apiGetBanner = () => {
    return request({
        url: '/banner/',
    });
};

// 获取随机推荐图片接口
export const apiGetRandomDay = () => {
    return request({
        url: '/wall/random_daily/',
    });
};

// 获取随机推荐图片接口
export const apiGetRandomRecommend = (data = {}) => {
    return request({
        url: '/wall/random_recommend/',
        data,
    });
};

// 获取通知接口
export const apiGetNotice = (data = {}, id = '') => {
    return request({
        url: id ? `/notice/${id}/` : '/notice/',
        data,
    });
};

// 获取分类接口
export const apiGetClassify = (data = {}) => {
    return request({
        url: '/classify/',
        data,
    });
};

// 获取分类列表，也就是分类下的所有图片接口
export const apiGetClassList = (data = {}) => {
    return request({
        url: '/wall/',
        data,
    });
};

// 获取搜索数据接口
export const apiGetSearchData = (data = {}) => {
    return request({
        url: '/wall/search/',
        data,
    });
};

// 增加图片访问量接口
export const apiPostIncrementViews = (id = '') => {
    return request({
        url: `/wall/${id}/increment_views/`,
        method: 'POST',
    });
};

// 增加图片下载量接口
export const apiPostIncrementDownloads = (id = '') => {
    return request({
        url: `/wall/${id}/increment_downloads/`,
        method: 'POST',
    });
};

// 微信登录接口
export const apiPostLoginByWechat = (data = {}) => {
    return request({
        url: '/login/wechat/',
        data,
        method: 'POST',
    });
};

// 登录接口
export const apiPostLogin = (data = {}) => {
    return request({
        url: '/login/',
        data,
        method: 'POST',
    });
};

// 注册接口
export const apiPostRegister = (data = {}) => {
    return request({
        url: '/register/',
        data,
        method: 'POST',
    });
};

// 不使用，暂时注释
// export const apiGetUserInfo = (id = '') => {
//     return request({
//         url: `/user/${id}/`
//     });
// };

// 获取用户个人信息接口
export const apiGetProfile = () => {
    return request({
        url: '/user/me/',
        isAuth: true,
    });
};

// 反馈接口
export const apiPostFeedback = (data = {}) => {
    return request({
        url: '/feedback/',
        data,
        method: 'POST',
    });
};

// 用户操作接口
export const apiPostActions = (data = {}) => {
    return request({
        url: '/actions/',
        data,
        method: 'POST',
        isAuth: true,
    });
};

// 获取用户操作数据接口
export const apiGetActions = (data = {}) => {
    return request({
        url: '/actions/',
        data,
        isAuth: true,
    });
};

// 更新用户个人信息的头像
export const apiUploadProfile = (data = {}) => {
    return uploadRequest({
        url: '/user/update_profile/',
        filePath: data.avatar,
        name: 'avatar',
        data,
        isAuth: true,
    });
};

// 更新用户个人信息接口
export const apiPostProfile = (data = {}) => {
    return request({
        url: '/user/update_profile/',
        data,
        method: 'POST',
        isAuth: true,
    });
};

// 修改用户密码
export const apiPostChangePassword = (data = {}) => {
    return request({
        url: '/user/change_password/',
        data,
        method: 'POST',
        isAuth: true,
    });
};

// 重置密码接口
export const apiPostResetPassword = (data = {}) => {
    return request({
        url: '/verify/reset_password/',
        data,
        method: 'POST',
    });
};

// 注销用户接口
export const apiPostDeactivateUser = () => {
    return request({
        url: '/user/deactivate/',
        method: 'POST',
        isAuth: true,
    });
};

// 发送邮件验证码接口
export const apiPostSendEmailCode = (data = {}) => {
    return request({
        url: '/verify/send_email_verification_code/',
        data,
        method: 'POST',
    });
};

// 校验验证码接口
export const apiPostVerifyCode = (data = {}) => {
    return request({
        url: '/verify/',
        data,
        method: 'POST',
    });
};

// 编辑壁纸接口
export const apiPostUpdateWall = (data = {}) => {
    return request({
        url: '/wall/',
        data,
        method: 'POST',
        isAuth: true,
    });
};

// 更新分类图片接口
export const apiPostClassifyPicUrl = (data = {}) => {
    return request({
        url: '/classify/update_picurl/',
        data,
        method: 'POST',
        isAuth: true,
    });
};

// 奖励用户接口
export const apiPostRewards = (data = {}) => {
    return request({
        url: '/rewards/',
        data,
        method: 'POST',
    });
};

// 获取相似壁纸接口
export const apiGetSimilarWall = (id = '') => {
    return request({
        url: `/similar/${id}/precomputed/`,
        method: 'GET',
    });
};

// 发现分析接口
export const apiPostDiscoverAnalyze = (data = {}) => {
    return request({
        url: '/discover/',
        data,
        method: 'POST',
        timeout: 180000, // 180秒超时
    });
};

// 发现分析流式接口
export const apiPostDiscoverStream = (data = {}, options = {}) => {
    return streamRequest({
        url: '/discover/stream/',
        data,
        method: 'POST',
        timeout: 180000, // 180秒超时
        ...options,
    });
};
