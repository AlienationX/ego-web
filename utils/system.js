import { apiPostAccess } from '@/api/wallpaper.js';
import { CHANNEL } from '@/common/config.js';
import { useSettingsStore } from '@/stores/settings.js';

import { getCardDeepLink } from '@/uni_modules/ego-widget';

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
    console.log(app, 'app_info');
    console.log(device, 'device_info');
    console.log(uni.getWindowInfo(), 'window_info');

    // 开发环境下不统计访问日志
    if (IS_DEVELOPMENT) return;

    let data = {
        platform: device.platform,
        channel: CHANNEL,
        app_version: app.appVersion,
        device_id: device.deviceId,
        device_brand: device.deviceBrand,
        device_model: device.deviceModel,
        language: app.language,
        os_theme: device.osTheme || app.hostTheme || 'unknown',
        app_theme: app.theme,
        remark: JSON.stringify({ device: device, app: app }),
    };

    let res = await apiPostAccess(data);
    // console.log('app launch ==> ', res);
};

/**
 * 设置 Android 系统完全无边框沉浸式（Edge-to-Edge）
 * 专为 targetSdkVersion >= 35 (Android 15+) 设计：
 * 1. 顶部状态栏：全透明全屏沉浸穿透 (LAYOUT_FULLSCREEN + setStatusBarColor(0))
 * 2. 底部手势栏：全透明穿透 (LAYOUT_HIDE_NAVIGATION + setNavigationBarColor(0) + setDecorFitsSystemWindows(false))
 * 3. 所有页面（包括 preview、设置页、各 TabBar 频道）内容完全铺满屏幕至最物理底端，无任何黑边与安全区断层
 * 4. TabBar 避让由前端组件内部安全区 (safe-area-inset-bottom) 优雅处理
 * @param {boolean} isDark 是否为深色模式
 */
export function setAndroidImmersive(isDark = false) {
    // #ifdef APP-PLUS
    try {
        if (plus.os.name === 'Android') {
            const mainActivity = plus.android.runtimeMainActivity();
            if (!mainActivity) return;

            // 切换到 Android UI 主线程执行，确保窗口布局参数安全生效
            mainActivity.runOnUiThread(
                plus.android.implements('java.lang.Runnable', {
                    run: function () {
                        try {
                            plus.android.importClass('android.view.View');
                            plus.android.importClass('android.view.Window');
                            const Build = plus.android.importClass('android.os.Build');
                            const sdkInt = Build.VERSION.SDK_INT;
                            const window_android = mainActivity.getWindow();
                            if (!window_android) return;

                            // 1. 清除半透明标记，允许窗口完全绘制透明背景
                            window_android.clearFlags(0x04000000); // FLAG_TRANSLUCENT_NAVIGATION
                            window_android.clearFlags(0x08000000); // FLAG_TRANSLUCENT_STATUS
                            window_android.addFlags(0x80000000);   // FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS

                            // 2. 状态栏与导航栏全透明沉浸
                            plus.android.invoke(window_android, 'setStatusBarColor', 0);
                            plus.android.invoke(window_android, 'setNavigationBarColor', 0);

                            // 3. 禁用系统强制对比度蒙层 (Android 10+)
                            if (sdkInt >= 29) {
                                plus.android.invoke(window_android, 'setNavigationBarContrastEnforced', false);
                                plus.android.invoke(window_android, 'setStatusBarContrastEnforced', false);
                            }

                            // 4. 全屏延伸与刘海屏/打孔屏完整穿透 (Android 9+)
                            if (sdkInt >= 28) {
                                const lp = window_android.getAttributes();
                                if (lp) {
                                    const mode = sdkInt >= 30 ? 3 : 1; // LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
                                    plus.android.setAttribute(lp, 'layoutInDisplayCutoutMode', mode);
                                    window_android.setAttributes(lp);
                                }
                            }

                            // 5. 核心：穿透状态栏与导航手势栏 (Edge-to-Edge)
                            const decorView = window_android.getDecorView();
                            if (decorView) {
                                let flags = 256 | 512 | 1024; // LAYOUT_STABLE | LAYOUT_HIDE_NAVIGATION | LAYOUT_FULLSCREEN
                                if (!isDark && sdkInt >= 26) flags |= 16;   // SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
                                if (!isDark && sdkInt >= 23) flags |= 8192; // SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
                                plus.android.invoke(decorView, 'setSystemUiVisibility', flags);
                            }

                            // 6. 现代 API 控制 Window Insets 和系统栏图标深浅色 (API 30+)
                            if (sdkInt >= 30) {
                                plus.android.invoke(window_android, 'setDecorFitsSystemWindows', false);
                                const insetsController = plus.android.invoke(window_android, 'getInsetsController');
                                if (insetsController) {
                                    const mask = 8 | 16; // STATUS_BARS | NAVIGATION_BARS
                                    const appearance = isDark ? 0 : mask;
                                    plus.android.invoke(insetsController, 'setSystemBarsAppearance', appearance, mask);
                                }
                            }
                        } catch (innerErr) {
                            console.log('setAndroidImmersive inner error:', innerErr);
                        }
                    }
                })
            );
        }
    } catch (e) {
        console.log('setAndroidImmersive error:', e);
    }
    // #endif
}

/**
 * 处理 URL Scheme 及桌面小组件深度链接唤起 (支持 HarmonyOS, Android, iOS, H5)
 */
let lastDeepLinkTimestamp = 0;
let lastDeepLinkId = '';
export const handleDeepLink = (showRes = null) => {
    let uri = '';
    let targetPage = '';
    let wallId = '';

    // 0. 从 Preferences 读取鸿蒙卡片深度链接参数（由 EntryAbility.onCreate/onNewWant 写入）
    // #ifdef APP
    try {
        const harmonyLink = getCardDeepLink?.();
        if (harmonyLink && harmonyLink.length > 0) {
            let parsed = {};
            try {
                parsed = JSON.parse(harmonyLink);
            } catch (e) {}
            if (parsed.wallId) wallId = parsed.wallId;
            if (parsed.targetPage) targetPage = parsed.targetPage;
            if (parsed.uri) uri = parsed.uri;
            console.log('[handleDeepLink] getCardDeepLink =>', { wallId, targetPage, uri });
        }
    } catch (e) {
        console.error('[handleDeepLink] getCardDeepLink error:', e);
    }
    // #endif

    // 1. 尝试从 uni-app 标准生命周期参数提取 (适用于 HarmonyOS / 小程序 / App)
    let options = showRes;
    if (!options || (!options.query && !options.path)) {
        try {
            options = (typeof uni.getEnterOptionsSync === 'function' ? uni.getEnterOptionsSync() : null) ||
                      (typeof uni.getLaunchOptionsSync === 'function' ? uni.getLaunchOptionsSync() : null) || {};
        } catch (e) {
            options = {};
        }
    }

    const query = options?.query || {};
    if (query.uri) uri = query.uri;
    if (query.targetPage) targetPage = query.targetPage;
    if (query.wallId || query.id) wallId = String(query.wallId || query.id);

    // 如果 params 作为一个整体字段或 JSON 字符串传入
    if (query.params) {
        try {
            const parsed = typeof query.params === 'string' ? JSON.parse(query.params) : query.params;
            if (parsed.uri) uri = parsed.uri;
            if (parsed.targetPage) targetPage = parsed.targetPage;
            if (parsed.wallId || parsed.id) wallId = String(parsed.wallId || parsed.id);
        } catch (e) {}
    }

    // 2. 尝试从 5+ App (Android / iOS) 原生运行时提取
    // #ifdef APP-PLUS
    if (!uri && !wallId && !targetPage && typeof plus !== 'undefined' && plus.runtime && plus.runtime.arguments) {
        uri = plus.runtime.arguments;
        plus.runtime.arguments = '';
    }
    // #endif

    if (!uri && !wallId && !targetPage) return;

    // 解析壁纸 ID
    const idMatch = uri ? uri.match(/[?&]id=(\d+)/) : null;
    const finalId = wallId || (idMatch ? idMatch[1] : '');

    // 防抖去重：防止短时间内对同一壁纸重复跳转
    const now = Date.now();
    if (finalId && finalId === lastDeepLinkId && now - lastDeepLinkTimestamp < 1500) {
        return;
    }
    if (finalId) {
        lastDeepLinkId = finalId;
        lastDeepLinkTimestamp = now;
    }

    console.log('handleDeepLink navigating:', { uri, targetPage, finalId });

    if (targetPage === '/pages/app/preview' || uri.includes('preview') || finalId) {
        if (finalId) {
            setTimeout(() => {
                uni.navigateTo({
                    url: `/pages/app/preview?id=${finalId}`,
                    fail: (err) => {
                        console.error('Failed to navigate to preview from deep link', err);
                    }
                });
            }, 350);
        }
    } else if (targetPage === '/pages/app/search' || uri.includes('search')) {
        setTimeout(() => {
            uni.navigateTo({
                url: '/pages/app/search',
                fail: (err) => {
                    console.error('Failed to navigate to search from deep link', err);
                }
            });
        }, 350);
    } else if (targetPage === '/pages/app/favorite' || uri.includes('favorite')) {
        setTimeout(() => {
            uni.navigateTo({
                url: '/pages/app/favorite',
                fail: (err) => {
                    console.error('Failed to navigate to favorite from deep link', err);
                }
            });
        }, 350);
    }
};
