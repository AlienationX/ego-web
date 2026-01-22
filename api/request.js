import { API_DOMAIN, API_BASE_URL } from '@/common/config';
import { useUserStore } from '@/stores/user.js';
import { decrypt } from '@/utils/encryption.js';

// 发送 request 请求函数，如果token过期，刷新后再次发送 request 请求
export const request = (config = {}) => {
    const userStore = useUserStore();

    return new Promise(async (resolve, reject) => {
        try {
            resolve(await sendRequest(config));
        } catch (error) {
            // 捕获到token过期的401错误，Token 过期时自动刷新并重试
            console.log('retry request ----------->', error);
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
                Authorization: userStore.accessToken ? `Bearer ${decrypt(userStore.accessToken)}` : '',
                ...config.header
            },
            success: (res) => {
                if (res.data.code === 200 || res.data.code === 201) {
                    resolve(res.data);
                } else if (res.data.code === 401) {
                    reject(res.data); // 这里的reject会被外层catch捕获
                } else {
                    if (res.data.code === undefined) {
                        uni.showModal({
                            title: '服务器错误提示',
                            content: 'Internal Server Error (500)',
                            showCancel: false
                        });
                    } else {
                        uni.showModal({
                            title: '错误提示' + res.data.code,
                            content: res.data.message || res.data || res,
                            showCancel: false
                        });
                    }
                    reject(res.data);
                }
            },
            fail: (err) => {
                uni.showToast({
                    title: 'Internal Server Error: ' + JSON.stringify(err),
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
            url: `${API_DOMAIN}/api/token/refresh/`,
            method: 'POST',
            data: { refresh: decrypt(userStore.refreshToken) }
        });
        console.log('================ refresh token', res);
        let { access, refresh } = res.data;
        userStore.setToken(access, refresh);
    } catch (error) {
        // 刷新失败则跳转登录页
        uni.showToast({
            title: '登录过期，请重新登录',
            icon: 'none'
        });
        userStore.clearUserData();
        uni.navigateTo({ url: '/pages/login/login' });
    }
};
