import { apiPostAccess } from '@/api/wallpaper.js';
import { CHANNEL } from '@/common/config.js';

// 模块加载时评估一次，平台信息不会在运行时改变
const app = uni.getAppBaseInfo();
const device = uni.getDeviceInfo();

export const IS_DEVELOPMENT =
    import.meta.env.DEV ||
    app.uniPlatform === 'web' ||
    (app.uniPlatform === 'mp-weixin' && device.deviceBrand === 'devtools') ||
    device.deviceModel?.startsWith('sdk');

export const IS_INTERNATIONAL = typeof plus !== 'undefined' ? plus.runtime.channel === 'google' : false;

// ── 以下为系统级功能（布局测量请用 @/utils/layout.js）──

export const writeAccessLog = async () => {
    // 开发环境下不统计访问日志
    if (IS_DEVELOPMENT) return;

    console.log(app, 'app_info');
    console.log(device, 'device_info');
    console.log(uni.getWindowInfo(), 'window_info');

    let data = {
        platform: app.uniPlatform === 'app' ? app.platform : app.uniPlatform,
        channel: CHANNEL,
        app_version: app.appVersion,
        device_id: device.deviceId,
        device_brand: device.deviceBrand,
        device_model: device.deviceModel,
        language: app.language,
        remark: JSON.stringify({ device: device, app: app }),
    };

    let res = await apiPostAccess(data);
    // console.log('app launch ==> ', res);
};
