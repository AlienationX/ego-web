import { API_DOMAIN, API_BASE_URL, ACCESS_KEY } from '@/common/config';
import { useUserStore } from '@/stores/user.js';
import { decrypt } from '@/utils/encryption.js';

// 发送 request 请求函数，如果token过期，刷新后再次发送 request 请求
export const request = (config = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            resolve(await sendRequest(config));
        } catch (err1) {
            const userStore = useUserStore();
            // 捕获到token过期的401错误，Token 过期时自动刷新并重试，不是token过期直接返回错误
            if (err1.code === 401 && userStore.refreshToken) {
                try {
                    console.log('retry request ----------->', err1);
                    // 两次异常捕获，第一次是捕获token过期，第二次是捕获真正异常
                    await refreshToken();
                    resolve(await sendRequest(config));
                } catch (err2) {
                    // 刷新token失败，跳转登录页
                    if (config.isRedirect) {
                        uni.navigateTo({ url: '/pages/login/login' });
                    }
                    reject(err2);
                }
            } else {
                reject(err1);
            }
        }
    });
};

const setHeader = (isAuth) => {
    const userStore = useUserStore();
    const rawToken = userStore.accessToken ? decrypt(userStore.accessToken) : '';
    const hasValidToken = rawToken && rawToken.trim().length > 0;

    const header = {
        'Access-Key': ACCESS_KEY,
    };
    // 仅当存在有效 token 时添加 Authorization，避免服务端报 "two space-delimited values"
    if (isAuth && hasValidToken) {
        header.Authorization = `Bearer ${rawToken.trim()}`;
    }
    return header;
};

// 发送 request 函数
const sendRequest = (config = {}) => {
    // let {
    //     url,
    //     data = {},
    //     method = 'GET',
    //     // timeout = 10000,  // 10秒
    //     header = {}
    //     isAuth = false/true/undefined (默认不需要认证)
    //     isRedirect = false/true/undefined (默认不需要跳转登录)
    // } = config;

    return new Promise((resolve, reject) => {
        uni.request({
            url: config.url.startsWith('http') ? config.url : API_BASE_URL + config.url,
            data: config.data || {},
            method: config.method || 'GET',
            // timeout: 10000,  // 10秒
            header: { ...setHeader(config.isAuth || false), ...config.header },
            success: (res) => {
                if (res.data.code === 200 || res.data.code === 201) {
                    resolve(res.data); // 成功返回数据
                } else if (res.data.code === 401) {
                    reject(res.data); // 这里的reject会被外层catch捕获
                } else {
                    if (res.data.code === undefined) {
                        uni.showModal({
                            title: '未知错误提示',
                            content: 'Internal Server Error (500)',
                            showCancel: false,
                        });
                    } else {
                        uni.showModal({
                            title: '服务器错误提示 - ' + res.data.code,
                            content: res.data.message || res.data || res,
                            showCancel: false,
                        });
                    }
                    reject(res.data);
                }
            },
            fail: (err) => {
                uni.showToast({
                    title: 'Request Failed',
                    content: JSON.stringify(err),
                    icon: 'none',
                });
                reject(err);
            },
        });
    });
};

// 处理 Token 过期
const handleRefreshToken = (title) => {
    const userStore = useUserStore();
    userStore.clearUserData();
    uni.showToast({
        title: title,
        icon: 'none',
    });
};

// 刷新 Token 函数
const refreshToken = async () => {
    const userStore = useUserStore();
    try {
        const res = await uni.request({
            url: `${API_DOMAIN}/api/token/refresh/`,
            method: 'POST',
            data: { refresh: decrypt(userStore.refreshToken) },
        });
        console.log('================ refresh token', res);

        if (res.statusCode === 200) {
            let { access, refresh } = res.data;
            userStore.setToken(access, refresh);
        } else {
            if (userStore.refreshToken) {
                handleRefreshToken('登录过期，请重新登录');
            }
        }
    } catch (error) {
        handleRefreshToken('Internal Server Error：刷新Token的接口报错');
    }
};

export const uploadRequest = (config = {}) => {
    // let {
    //     url,
    //     data = {},
    //     method = 'GET',
    //     // timeout = 10000,  // 10秒
    //     header = {}
    //     isAuth = false/true/undefined (默认不需要认证)
    //     isRedirect = false/true/undefined (默认不需要跳转登录)
    // } = config;

    return new Promise((resolve, reject) => {
        uni.uploadFile({
            url: config.url.startsWith('http') ? config.url : API_BASE_URL + config.url,
            filePath: config.filePath,
            name: config.name, // 关键：与后端约定的文件字段名
            header: { ...setHeader(config.isAuth || false), ...config.header },
            formData: config.data || {},
            success: (res) => {
                resolve(res.data); // 成功返回数据
            },
            fail: (err) => {
                uni.showToast({ title: `失败: {err}`, icon: 'none' });
                reject(err);
            },
        });
    });
};
