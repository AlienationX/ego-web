import { apiPostAccess } from '@/api/wallpaper.js';

const SYSTEM_INFO = uni.getSystemInfoSync();
const APP_INFO = uni.getAppBaseInfo();

export const getStatusBarHeight = () => {
    // 状态栏高度
    // #ifdef WEB
    return 0;
    // #endif

    // #ifndef WEB
    // MP = 54px, APP = 22px
    return SYSTEM_INFO.statusBarHeight;
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
    return SYSTEM_INFO.windowBottom;
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
    console.log(SYSTEM_INFO, 'system_info');
    console.log(APP_INFO, 'app_info');

    // 不统计web，主要是用来测试
    if (SYSTEM_INFO.uniPlatform === 'web') return;
    // 微信小程序调试工具不统计
    if (SYSTEM_INFO.uniPlatform === 'mp-weixin' && SYSTEM_INFO.deviceBrand === 'devtools') return;
    // Android Studio 不统计, sdk_gphone64_arm64
    if (SYSTEM_INFO.deviceModel.startsWith('sdk')) return;

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
        platform: SYSTEM_INFO.uniPlatform === 'app' ? SYSTEM_INFO.platform : SYSTEM_INFO.uniPlatform,
        channel: channel,
        app_version: APP_INFO.appVersion,
        device_id: SYSTEM_INFO.deviceId,
        device_brand: SYSTEM_INFO.deviceBrand,
        device_model: SYSTEM_INFO.deviceModel,
        language: SYSTEM_INFO.language,
        remark: JSON.stringify(SYSTEM_INFO),
    };

    // console.log(data);
    // console.log(data.remark.toString().length);

    let res = await apiPostAccess(data);
    // console.log('app launch ==> ', res);
};
