import { useUserStore } from '@/stores/user.js';

const API_BASE_URL = 'http://localhost:8000/wallpaper/api';
// const API_BASE_URL = 'https://49touviwp7.execute-api.eu-north-1.amazonaws.com/dev/wallpaper/api';

// 发送 request 请求函数，如果token过期，刷新后再次发送 request 请求
export const request = (config = {}) => {
    const userStore = useUserStore();

    return new Promise(async (resolve, reject) => {
        try {
            resolve(await sendRequest(config));
        } catch (error) {
            // 捕获到token过期的401错误，Token 过期时自动刷新并重试
            console.log('-----------', error);
            if (error.code === 401 || error.statusCode === 401) {
                await refreshToken();
                try {
                    // 两次异常捕获，第一次是捕获token过期，第二次是捕获真正异常
                    resolve(await sendRequest(config));
                } catch (err) {
                    reject(err);
                }
            } else {
                reject(error);
            }
        }
    });
};

// 发送 request 函数
const sendRequest = (config = {}) => {
    // let {
    //     url,
    //     data = {},
    //     method = 'GET',
    //     // timeout = 10000,  // 10秒
    //     header = {}
    // } = config;

    const userStore = useUserStore();

    return new Promise((resolve, reject) => {
        uni.request({
            url: config.url.startsWith('http') ? config.url : API_BASE_URL + config.url,
            data: config.data || {},
            method: config.method || 'GET',
            // timeout: 10000,  // 10秒
            header: {
                'Access-Key': 'secret-insecure-88hefbf6c!mrv5x(xa4swy-h3y41f()(8xh6syj(xi&m!!h$#b',
                Authorization: userStore.accessToken ? `Bearer ${userStore.accessToken}` : '',
                ...config.header
            },
            success: (res) => {
                if (res.data.code === 200) {
                    resolve(res.data);
                } else if (res.data.code === 401) {
                    reject(res.data); // 这里的reject会被外层catch捕获
                } else {
                    uni.showModal({
                        title: '错误提示',
                        content: res.data.message || res.data || res,
                        showCancel: false
                    });
                    reject(res.data);
                }
            },
            fail: (err) => {
                uni.showToast({
                    title: JSON.stringify(err),
                    icon: 'none'
                });
                reject(err);
            }
        });
    });
};

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
