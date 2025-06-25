import { useUserStore } from '@/stores/user.js';

const API_BASE_URL = 'http://localhost:8000/wallpaper/api';
// const API_BASE_URL = 'https://49touviwp7.execute-api.eu-north-1.amazonaws.com/dev/wallpaper/api';

function request(config = {}) {
    let {
        url,
        data = {},
        method = 'GET',
        // timeout =  10000,  // 10秒
        header = {}
    } = config;

    const userStore = useUserStore();

    return new Promise(async (resolve, reject) => {
        const sendRequest = async () => {
            uni.request({
                url: API_BASE_URL + url,
                data,
                method,
                header: {
                    'Access-Key': 'secret-insecure-88hefbf6c!mrv5x(xa4swy-h3y41f()(8xh6syj(xi&m!!h$#b',
                    Authorization: userStore.accessToken ? `Bearer ${userStore.accessToken}` : '',
                    // 'Token': 'secret...xzcvsdfall;akdl;fasdfadsfgasd',
                    ...header
                },
                success: (res) => {
                    // uni.request在结果上自己封装了一层，返回结果是
                    // console.log('wallpaper request >>>', res);

                    if (res.data.code === 200) {
                        resolve(res.data); // 只有状态为200才是请求真正成功
                    } else {
                        // 白色模态框
                        uni.showModal({
                            title: '错误提示',
                            content: res.data.message || res.data || res,
                            showCancel: false
                        });
                        // 灰色透明框
                        // uni.showToast({
                        //     title: res.data.message,
                        //     icon: "none"
                        // })
                        reject(res.data); // 强制接口报错
                    }
                },
                fail: (err) => {
                    reject(err);
                }
            });
        };

        try {
            await sendRequest();
        } catch (error) {
            // Token 过期时自动刷新并重试
            if (error.statusCode === 401) {
                await refreshToken();
                await sendRequest();
            } else {
                reject(error);
            }
        }
    });
}

// 刷新 Token 函数
const refreshToken = async () => {
    const userStore = useUserStore();
    try {
        const res = await uni.request({
            url: API_BASE_URL + '/token/refresh/',
            method: 'POST',
            data: { refresh: userStore.refreshToken }
        });
        console.log('================ refresh token', res);
        let { access, refresh } = res;
        userStore.setToken(access, refresh);
    } catch (error) {
        // 刷新失败则跳转登录
        userStore.clearUserData();
        uni.navigateTo({ url: '/pages/login/login' });
        // throw new Error('Token 刷新失败')
    }
};

export const apiGetUserInfo = (id = '') => {
    return request({
        url: `/user/${id}`
    });
};

export const apiGetBanner = () => {
    return request({
        url: '/banner'
    });
};

export const apiGetDayRandom = () => {
    return request({
        url: '/wall/random'
    });
};

export const apiGetNotice = (data = {}) => {
    return request({
        url: '/notice',
        data
    });
};

export const apiGetNoticeDetail = (data = {}, id = '') => {
    return request({
        // 多一个id的判断，其实可以统一成一个接口
        url: id ? `/notice/${id}` : '/notice',
        data
    });
};

export const apiGetClassify = (data = {}) => {
    // 获取分类
    return request({
        url: '/classify',
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

export const apiPostLoginByWechat = (data = {}) => {
    // 图片评分接口，该接口根据ip验证是否已经打过分了
    return request({
        url: '/login/wechat/',
        data,
        method: 'POST'
    });
};

// test
export const apiGetSetupScore = (data = {}) => {
    // 图片评分接口，该接口根据ip验证是否已经打过分了
    return request({
        url: '/setupScore/',
        data
    });
};
