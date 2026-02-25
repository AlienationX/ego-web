import { apiPostAccess } from '@/api/wallpaper.js';

const SYSTEM_INFO = uni.getSystemInfoSync();
const APP_INFO = uni.getAppBaseInfo();

export const getStatusBarHeight = () => {
    // 状态栏高度
    return SYSTEM_INFO.statusBarHeight || 0;
};

export const getTitleBarHeight = () => {
    // 小程序胶囊按钮高度
    if (uni.getMenuButtonBoundingClientRect) {
        let { top, height } = uni.getMenuButtonBoundingClientRect();
        return height + (top - getStatusBarHeight()) * 2;
    } else {
        return 48;
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
}

export const getLeftIconWidth = () => {
    // #ifdef MP-TOUTIAO
    // 抖音/头条 小程序头部左侧的按钮显示问题
    // 深度结构，两层
    let {
        leftIcon: { left, width }
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

    // 无法测试，只能打正式包时必须勾选 渠道包，才能通过 plus.runtime.channel 获取
    // console.log('runtime', plus.runtime.channel);
    // console.log('channel', plus.runtime.channel);
    let channel = '';
    // #ifdef APP
    channel = plus.runtime.channel;
    // #endif

    let data = {
        // 如果是app，用来区分 android 和 ios
        platform: SYSTEM_INFO.uniPlatform === 'app' ? SYSTEM_INFO.platform : SYSTEM_INFO.uniPlatform,
        channel: channel,
        remark: JSON.stringify(SYSTEM_INFO)
    };

    // console.log(data);
    // console.log(data.remark.toString().length);

    let res = await apiPostAccess((data = data));
    // console.log('app launch ==> ', res);
};
