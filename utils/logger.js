export const isDev = () => {
    if (import.meta.env.DEV) return true;
    
    const SYSTEM_INFO = uni.getSystemInfoSync();
    // 不统计web，主要是用来测试
    if (SYSTEM_INFO.uniPlatform === 'web') return true;
    // 微信小程序调试工具不统计
    if (SYSTEM_INFO.uniPlatform === 'mp-weixin' && SYSTEM_INFO.deviceBrand === 'devtools') return true;
    // Android Studio 不统计, sdk_gphone64_arm64
    if (SYSTEM_INFO.deviceModel.startsWith('sdk')) return true;
    
    return false;
};

/**
 * 获取调用者的文件路径和行号
 */
const getCallerInfo = () => {
    const error = new Error();
    const stack = error.stack?.split('\n') || [];
    // stack 格式: at xxx (file:///path/to/file.js:123:45) 或 at file:///path/to/file.vue:123:45
    // 跳过 logger 自身的调用，从第 2 层开始找第一个非 logger.js 的调用
    for (let i = 2; i < stack.length; i++) {
        const line = stack[i];
        if (line.includes('logger.js')) continue;

        // 提取文件名和行号
        const match = line.match(/\((.+?):(\d+):(\d+)\)/) || line.match(/at\s+(.+?):(\d+):(\d+)/) || line.match(/@(.+?):(\d+):(\d+)/);
        if (match) {
            const filePath = match[1];
            const lineNum = match[2];
            // 去掉 HMR 时间戳 (?t=xxx) 和查询参数，只保留文件名
            const cleanPath = filePath.split('?')[0];
            const fileName = cleanPath.split('/').pop() || cleanPath;
            return `[${fileName}:${lineNum}]`;
        }
    }
    return '';
};

const createLogger = (level) => {
    return (...args) => {
        if (!isDev()) return;
        const callerInfo = getCallerInfo();
        const prefix = callerInfo ? `${callerInfo}` : '[LOG]';
        console[level](prefix, ...args);
    };
};

export const logger = {
    log: createLogger('log'),
    warn: createLogger('warn'),
    error: createLogger('error'),
    info: createLogger('info'),
};

