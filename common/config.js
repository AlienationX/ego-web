// common/config.js

// export const API_DOMAIN = 'http://127.0.0.1:8000';
// export const API_DOMAIN = 'http://10.0.2.2:8000';  // 鸿蒙模拟器联调本地接口
// export const API_DOMAIN = 'https://49touviwp7.execute-api.eu-north-1.amazonaws.com/dev';
export const API_DOMAIN = 'https://api.wp.ego8.space';

export const API_BASE_URL = `${API_DOMAIN}/wallpaper/api`;
export const API_SECRET_KEY = 'secret-insecure-88hefbf6c!mrv5x(xa4swy-h3y41f()(8xh6syj(xi&m!!h$#b';

export const MAX_PAGE_SIZE = 12;

// uniapp dcloud 云存储图片地址
// export const PICS_BASE_URL = 'https://mp-36059119-7390-44c6-8190-cc3527d1e745.cdn.bspapp.com/wallpaper';
// aws s3 url 图片地址
// export const PICS_BASE_URL = 'https://wallpaper-kpze6c.s3.eu-north-1.amazonaws.com';
// Ten Cloud bucket 图片地址
// export const PICS_BASE_URL = 'https://wp-1328701250.cos.ap-beijing.myqcloud.com';
// local 图片地址
export const PICS_BASE_URL = 'https://api.wp.ego8.space/static/wallpaper/media';

// 备案信息
export const RIGHT_ICP = '京ICP备2025123451号-2A';

// 客服邮箱
export const SERVICE_EMAIL = "le7yi_ss@163.com";

// 看一次视频广告奖励的能量点数
export const VIDEO_REWARD_ENERGY = 3;

// ─────────────────────────────────────────────────────────────
// 渠道标识（避免在 system.js / wallpaper.js 间循环引用，统一放这里）
let _channel = 'unknown';
// #ifdef APP
_channel = plus.runtime.channel || 'app';
// #endif
// #ifdef APP-HARMONY
_channel = 'huawei';
// #endif
// #ifdef MP-WEIXIN
_channel = 'wechat';
// #endif
export const CHANNEL = _channel;
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// 广告位配置（微信小程序广告主 & App 端 uni-AD 统一管理）
// ─────────────────────────────────────────────────────────────
export const AD_CONFIG = {
    // 微信小程序广告位
    weixin: {
        rewardedVideoUnitId: 'adunit-5bc8686f391d8f66', // 激励视频
        interstitialUnitId: 'adunit-3ac8c1de4df22d9e',   // 插屏广告
        bannerUnitId: 'adunit-73a2b212e6dbda91',         // Banner 广告
        customHorizontalUnitId: 'adunit-f3aa3a1ce4b9dc32', // 横版卡片广告（网格通栏）
        customVerticalUnitId: 'adunit-a5e6555b54bcb492',   // 竖屏卡片广告（瀑布流单列）
    },
    // App 端 uni-AD 广告位
    app: {
        rewardedVideoAdpid: '1892019135',
        interstitialAdpid: '1129226586',
        feedAdpid: '1325478186',        // 信息流广告（文字悬浮，新配置）
        feedAdpidBackup: '1760125998',   // 信息流广告（上下图，备用/已全渠道审核通过）
        bannerAdpid: '1760125998',
    },
};

