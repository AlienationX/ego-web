import { apiPostAccess } from '@/api/wallpaper.js';

// ── 替换废弃的 getSystemInfoSync ，改用新版细粒度 API ──
const getWindow = () => uni.getWindowInfo();
const getAppBase = () => uni.getAppBaseInfo();
const getDevice = () => uni.getDeviceInfo();

export const isDevelopment = () => {
    if (import.meta.env.DEV) return true;

    const app = getAppBase();
    const device = getDevice();
    // 不统计web，主要是用来测试
    if (app.uniPlatform === 'web') return true;
    // 微信小程序调试工具不统计
    if (app.uniPlatform === 'mp-weixin' && device.deviceBrand === 'devtools') return true;
    // Android Studio 不统计, sdk_gphone64_arm64
    if (device.deviceModel?.startsWith('sdk')) return true;

    return false;
};

export const isInternational = () => {
    // #ifdef APP
    return plus.runtime.channel === 'google';
    // #endif

    return false;
};

// ── 以下为系统级功能（布局测量请用 @/utils/layout.js）──

export const writeAccessLog = async () => {
    const windowInfo = getWindow();
    const appInfo = getAppBase();
    const deviceInfo = getDevice();

    // console.log(uni.getSystemInfoSync(), 'system_info');
    console.log(appInfo, 'app_info');
    console.log(deviceInfo, 'device_info');
    console.log(windowInfo, 'window_info');

    // 开发环境下不统计访问日志
    if (isDevelopment()) return;

    // 无法测试，只能打正式包时必须勾选 渠道包，才能通过 plus.runtime.channel 获取
    // console.log('runtime', plus.runtime.channel);
    // console.log('channel', plus.runtime.channel);
    let channel = '';

    // #ifdef APP
    channel = plus.runtime.channel;
    // #endif

    // #ifdef APP-HARMONY
    channel = 'huawei';
    // #endif

    // #ifdef MP-WEIXIN
    channel = 'wechat';
    // #endif

    let data = {
        // 如果是app，用来区分 android 和 ios
        platform: appInfo.uniPlatform === 'app' ? appInfo.platform : appInfo.uniPlatform,
        channel: channel,
        app_version: appInfo.appVersion,
        device_id: deviceInfo.deviceId,
        device_brand: deviceInfo.deviceBrand,
        device_model: deviceInfo.deviceModel,
        language: appInfo.language,
        remark: JSON.stringify({ window: windowInfo, device: deviceInfo, app: appInfo }),
    };

    // console.log(data);
    // console.log(data.remark.toString().length);

    let res = await apiPostAccess(data);
    // console.log('app launch ==> ', res);
};
