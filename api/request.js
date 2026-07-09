import { API_DOMAIN, API_BASE_URL, API_SECRET_KEY } from '@/common/config';
import { useUserStore } from '@/stores/user.js';
import { decrypt } from '@/utils/encryption.js';

let refreshPromise = null;

// 获取或生成设备ID
const getDeviceId = () => {
    let deviceId = uni.getStorageSync('deviceId');
    if (!deviceId) {
        try {
            deviceId = uni.getDeviceInfo().deviceId || null;
            if (!deviceId) {
                deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
            }
            uni.setStorageSync('deviceId', deviceId);
        } catch (e) {
            deviceId = 'dev_unknown';
        }
    }
    return deviceId;
};

// 发送 request 请求函数，如果token过期，刷新后再次发送 request 请求
export const request = (config = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            resolve(await sendRequest(config));
        } catch (err1) {
            const userStore = useUserStore();
            // 捕获到token过期的401错误或token_not_valid，Token 过期时自动刷新并重试，不是token过期直接返回错误
            if (userStore.refreshToken && (err1.code === 401 || err1.code === 'token_not_valid')) {
                try {
                    await refreshToken();
                    resolve(await sendRequest(config));
                } catch (err2) {
                    userStore.clearUserData();
                    if (config.isRedirect) {
                        uni.navigateTo({ url: '/pages/auth/signin' });
                    }
                    showRequestFeedback(err2, config);
                    reject(err2);
                }
            } else {
                showRequestFeedback(err1, config);
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
        'Access-Key': API_SECRET_KEY,
        'Device-Id': getDeviceId(),
    };
    // 仅当存在有效 token 时添加 Authorization，避免服务端报 "two space-delimited values"
    if (isAuth && hasValidToken) {
        header.Authorization = `Bearer ${rawToken.trim()}`;
    }
    return header;
};

const getErrorPayload = (error = {}) => {
    if (typeof error === 'string') {
        return { title: '请求失败', message: error };
    }

    if (error.errMsg) {
        return { title: '网络异常', message: '当前网络不稳定，请稍后重试' };
    }

    if (error.code === 401 || error.code === 'token_not_valid') {
        return { title: '登录状态失效', message: '请重新登录后继续操作' };
    }

    if (error.code >= 500) {
        return { title: '服务异常', message: error.message || '服务器开小差了，请稍后再试' };
    }

    return {
        title: error.title || '操作失败',
        message: error.message || error.detail || '请稍后重试',
    };
};

const showRequestFeedback = (error, config = {}) => {
    if (config.silent) return;

    const payload = getErrorPayload(error);
    if (config.errorMode === 'modal') {
        uni.showModal({
            title: payload.title,
            content: payload.message,
            showCancel: false,
        });
        return;
    }

    uni.showToast({
        title: payload.message,
        icon: 'none',
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
    //     isAuth = false/true/undefined (默认不需要认证)
    //     isRedirect = false/true/undefined (默认不需要跳转登录)
    // } = config;
    return new Promise((resolve, reject) => {
        uni.request({
            url: config.url.startsWith('http') ? config.url : API_BASE_URL + config.url,
            data: config.data || {},
            method: config.method || 'GET',
            timeout: config.timeout || 60000, // 默认1分钟
            header: { ...setHeader(config.isAuth || false), ...config.header },
            success: (res) => {
                if (res.data.code === 200 || res.data.code === 201) {
                    resolve(res.data); // 成功返回数据
                } else if (res.data.code === 401 || res.data.code === 'token_not_valid') {
                    reject(res.data); // 这里的reject会被外层catch捕获
                } else {
                    reject({
                        ...res.data,
                        title: res.data.code ? `服务器错误 - ${res.data.code}` : '未知错误',
                        message: res.data.message || '服务器暂时不可用，请稍后重试',
                    });
                }
            },
            fail: (err) => {
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
    if (refreshPromise) {
        return refreshPromise;
    }

    const userStore = useUserStore();
    refreshPromise = (async () => {
        try {
            const res = await new Promise((resolve, reject) => {
                uni.request({
                    url: `${API_DOMAIN}/api/token/refresh/`,
                    method: 'POST',
                    data: { refresh: decrypt(userStore.refreshToken) },
                    success: resolve,
                    fail: reject,
                });
            });

            if (res.statusCode === 200) {
                let { access, refresh } = res.data;
                userStore.setToken(access, refresh);
                return true;
            }
            if (userStore.refreshToken) {
                handleRefreshToken('登录过期，请重新登录');
            }
            throw { code: 401, message: '登录过期，请重新登录' };
        } catch (error) {
            handleRefreshToken('刷新登录状态失败，请重新登录');
            throw error;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
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
            files: config.files,  // 需要上传的文件列表。使用 files 时，filePath 和 name 不生效。
            filePath: config.filePath, // 要上传文件资源的路径。
            name: config.name, // 关键：与后端约定的文件字段名
            header: { ...setHeader(config.isAuth || false), ...config.header },
            formData: config.data || {},
            success: (res) => {
                resolve(res.data); // 成功返回数据
            },
            fail: (err) => {
                showRequestFeedback(err, config);
                reject(err);
            },
        });
    });
};

export const streamRequest = (config = {}) => {
    return new Promise((resolve, reject) => {
        const state = { buffer: '', fullText: '', done: false };
        let settled = false;
        const debug = !!config.debug;
        const log = (...args) => {
            if (debug) {
                console.log('[streamRequest]', ...args);
            }
            if (typeof config.onLog === 'function') {
                config.onLog(...args);
            }
        };

        const decodeChunkData = (data) => {
            if (!data) return '';
            if (typeof data === 'string') return data;
            try {
                if (typeof TextDecoder !== 'undefined') {
                    return new TextDecoder('utf-8').decode(data);
                }
                const buffer = new Uint8Array(data);
                let str = '';
                for (let i = 0; i < buffer.length; i++) {
                    str += String.fromCharCode(buffer[i]);
                }
                return decodeURIComponent(escape(str));
            } catch (e) {
                return String(data);
            }
        };

        const safeResolve = (payload) => {
            if (settled) return;
            settled = true;
            resolve(payload);
        };

        const safeReject = (error) => {
            if (settled) return;
            settled = true;
            reject(error);
        };

        const normalizeJson = (text) => {
            return String(text)
                .replace(/\bTrue\b/g, 'true')
                .replace(/\bFalse\b/g, 'false')
                .replace(/\bNone\b/g, 'null');
        };

        const handlePayload = (payloadText = '') => {
            let data = null;
            try {
                data = JSON.parse(payloadText);
                log('payload', data);
            } catch (error) {
                try {
                    data = JSON.parse(normalizeJson(payloadText));
                    log('payload.normalize', data);
                } catch (error2) {
                    return false;
                }
            }

            if (!data || typeof data !== 'object') return false;
            // 解析done为true，即为结束
            if (data.done === true || data.DONE === true) {
                state.done = true;
                log('done', { textLength: state.fullText.length });
                if (typeof config.onDone === 'function') {
                    config.onDone(state.fullText);
                }
                return true;
            }
            // 解析content内容
            log('content.type', typeof data.content);
            if (typeof data.content === 'string' && data.content) {
                state.fullText += data.content;
                log('content.append', { chunkLength: data.content.length, totalLength: state.fullText.length });
                if (typeof config.onMessage === 'function') {
                    config.onMessage(data.content, state.fullText);
                }
            }
            return true;
        };

        const parseChunk = (chunkText = '') => {
            if (!chunkText) return;
            const chunkString = String(chunkText);
            log('chunk', { size: chunkString.length, sample: chunkString.slice(0, 120) });
            state.buffer += chunkString;
            const lines = state.buffer.split(/\r?\n/);
            state.buffer = lines.pop() || '';

            let currentEventData = '';
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) {
                    if (currentEventData) {
                        handlePayload(currentEventData);
                        currentEventData = '';
                    }
                } else if (trimmedLine.startsWith('data:')) {
                    currentEventData += trimmedLine.slice(5).trim();
                }
            }

            if (currentEventData) {
                handlePayload(currentEventData);
            }
        };

        const requestUrl = config.url.startsWith('http') ? config.url : API_BASE_URL + config.url;
        const requestData = config.data || {};
        const requestMethod = config.method || 'POST';
        const requestHeader = {
            'Content-Type': 'application/json',
            ...setHeader(config.isAuth || false),
            ...config.header,
        };

        const finalize = (res = {}) => {
            if (state.buffer.trim()) {
                parseChunk(state.buffer);
                state.buffer = '';
            }
            if (!state.done && typeof res.data === 'string' && res.data.trim()) {
                parseChunk(res.data);
            }
            log('finalize', {
                text: state.fullText,
                data: res.data,
                statusCode: res.statusCode,
                done: state.done,
            });
            safeResolve({
                text: state.fullText,
                data: res.data,
                statusCode: res.statusCode,
                done: state.done,
            });
        };

        // #ifdef WEB
        (async () => {
            try {
                log('web.request', { url: requestUrl, method: requestMethod });
                const response = await fetch(requestUrl, {
                    method: requestMethod,
                    headers: requestHeader,
                    body: JSON.stringify(requestData),
                });
                log('web.response', { ok: response.ok, status: response.status });
                if (!response.ok) {
                    safeReject(response);
                    return;
                }
                const reader = response.body?.getReader();
                if (!reader) {
                    safeReject(new Error('ReadableStream not supported'));
                    return;
                }
                const decoder = new TextDecoder('utf-8');
                while (true) {
                    const { value, done } = await reader.read();
                    log('web.chunk', { done, size: value?.length || 0 });
                    if (done) break;
                    parseChunk(decoder.decode(value, { stream: true }));
                    if (state.done) break;
                }
                finalize({ statusCode: response.status, data: null });
            } catch (err) {
                safeReject(err);
            }
        })();
        // #endif

        // #ifdef APP-PLUS
        log('app.request', { url: requestUrl, method: requestMethod, mode: 'plus.net.XMLHttpRequest' });
        const xhr = new plus.net.XMLHttpRequest();
        let lastIndex = 0;

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 3 || xhr.readyState === 4) {
                const responseText = xhr.responseText || '';
                if (responseText.length > lastIndex) {
                    const chunk = responseText.slice(lastIndex);
                    lastIndex = responseText.length;
                    log('app.onChunkReceived', { size: chunk.length });
                    parseChunk(chunk);
                }
            }
            if (xhr.readyState === 4) {
                const statusCode = xhr.status || 0;
                if (statusCode < 200 || statusCode >= 300) {
                    safeReject({ statusCode, data: xhr.responseText });
                    return;
                }
                log('app.success', { statusCode, dataLength: String(xhr.responseText || '').length });
                finalize({ statusCode, data: xhr.responseText });
            }
        };

        xhr.onerror = (err) => {
            safeReject(err);
        };

        xhr.ontimeout = () => {
            safeReject(new Error('Request timeout'));
        };

        xhr.timeout = config.timeout || 180000;
        xhr.open(requestMethod, requestUrl);
        Object.keys(requestHeader || {}).forEach((key) => {
            try {
                xhr.setRequestHeader(key, requestHeader[key]);
            } catch (error) {
                log('app.header.error', { key });
            }
        });
        xhr.send(JSON.stringify(requestData));
        // #endif

        // #ifdef MP || APP-HARMONY
        log('app.request', { url: requestUrl, method: requestMethod, enableChunked: true });
        const appTask = uni.request({
            url: requestUrl,
            data: requestData,
            method: requestMethod,
            timeout: config.timeout || 180000,
            enableChunked: true,
            responseType: 'text',
            header: requestHeader,
            success: (res) => {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    safeReject(res.data || res);
                    return;
                }
                log('app.success', { statusCode: res.statusCode, dataLength: String(res.data || '').length });
                finalize(res);
            },
            fail: (err) => safeReject(err),
        });
        if (appTask && typeof appTask.onChunkReceived === 'function') {
            log('app.onChunkReceived.ready', true);
            appTask.onChunkReceived((res) => {
                log('app.onChunkReceived', { size: String(res?.data || '').length });
                parseChunk(decodeChunkData(res?.data));
            });
        } else {
            log('app.onChunkReceived.missing', true);
        }
        // #endif
    });
};
