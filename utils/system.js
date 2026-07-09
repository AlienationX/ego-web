import { apiPostAccess } from '@/api/wallpaper.js';

// ── 替换废弃的 getSystemInfoSync，改用新版细粒度 API ──
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

export const getStatusBarHeight = () => {
    // 状态栏高度
    // #ifdef WEB
    return 0;
    // #endif

    // #ifndef WEB
    // MP = 54px, APP = 22px
    return getWindow().statusBarHeight;
    // #endif
};

export const getTitleBarHeight = () => {
    // 小程序胶囊按钮高度
    if (uni.getMenuButtonBoundingClientRect) {
        let { top, height } = uni.getMenuButtonBoundingClientRect();
        return height + (top - getStatusBarHeight()) * 2;
    } else {
        return 44;
    }
};

export const getNavBarHeight = () => getStatusBarHeight() + getTitleBarHeight();

export const getTabBarHeight = () => {
    // #ifdef WEB
    return 50;
    // #endif

    // #ifndef WEB
    return getWindow().windowBottom;
    // #endif
};

export const getLeftIconWidth = () => {
    // #ifdef MP-TOUTIAO
    // 抖音/头条 小程序头部左侧的按钮显示问题
    // 深度结构，两层
    let {
        leftIcon: { left, width },
    } = tt.getCustomButtonBoundingClientRect();
    return left + parseInt(width);
    // #endif

    // #ifndef MP-TOUTIAO
    return 0;
    // #endif
};

export const getRightIconWidth = () => {
    // #ifdef MP-WEIXIN
    // 微信小程序头部右侧的胶囊按钮显示问题
    // 深度结构，两层
    let { width } = uni.getMenuButtonBoundingClientRect();
    return parseInt(width);
    // #endif

    // #ifndef MP-WEIXIN
    return 0;
    // #endif
};

export const writeAccessLog = async () => {
    const windowInfo = getWindow();
    const appInfo = getAppBase();
    const deviceInfo = getDevice();

    console.log({ windowInfo, deviceInfo }, 'system_info');
    console.log(appInfo, 'app_info');

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
