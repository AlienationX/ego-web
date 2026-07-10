// common/config.js

// export const API_DOMAIN = 'http://127.0.0.1:8000';
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
export const RIGHT_ICP = '粤ICP备15077732号-2';

// 渠道标识（避免在 system.js / wallpaper.js 间循环引用，统一放这里）
let _channel = '';
// #ifdef APP
_channel = plus.runtime.channel || '';
// #endif
// #ifdef APP-HARMONY
_channel = 'huawei';
// #endif
// #ifdef MP-WEIXIN
_channel = 'wechat';
// #endif
export const CHANNEL = _channel;

// 看一次视频广告奖励的能量点数
export const VIDEO_REWARD_ENERGY = 3;
