import { apiPostAccess } from '@/api/wallpaper.js';
import { getCardDeepLink } from '@/uni_modules/ego-widget';
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
/**
 * 处理 URL Scheme 及桌面小组件深度链接唤起 (支持 HarmonyOS, Android, iOS, H5, 小程序)
 */
let lastTargetKey = '';
let lastTargetTimestamp = 0;
let isNavigating = false;
let isColdLaunchHandled = false;

export const handleDeepLink = (showRes = null) => {
    let uri = '';
    let targetPage = '';
    let wallId = '';

    // 0. 从 Preferences 读取鸿蒙卡片深度链接参数（内部读后即清除）
    // #ifdef APP
    try {
        const harmonyLink = getCardDeepLink?.();
        if (harmonyLink && harmonyLink.length > 0) {
            let parsed = {};
            try {
                parsed = JSON.parse(harmonyLink);
            } catch (e) {}
            if (parsed.wallId) wallId = String(parsed.wallId);
            if (parsed.targetPage) targetPage = parsed.targetPage;
            if (parsed.uri) uri = parsed.uri;
            console.log('[handleDeepLink] getCardDeepLink =>', { wallId, targetPage, uri });
        }
    } catch (e) {
        console.error('[handleDeepLink] getCardDeepLink error:', e);
    }
    // #endif

    // 1. 尝试从 5+ App (Android / iOS) 原生运行时提取最新 Intent 参数（单次消费，读取后立即清空）
    // #ifdef APP-PLUS
    if (!uri && !wallId && !targetPage && typeof plus !== 'undefined' && plus.runtime && plus.runtime.arguments) {
        uri = plus.runtime.arguments;
        plus.runtime.arguments = ''; // 消费后立刻清空原生参数，防止下次切前台重复触发
    }
    // #endif

    // 2. 尝试从生命周期参数提取 (showRes)
    let query = showRes?.query || {};
    // 如果 showRes 未带参数且是首次冷启动，安全尝试读取一次冷启动参数
    if (!uri && !wallId && !targetPage && (!query || Object.keys(query).length === 0)) {
        if (!isColdLaunchHandled) {
            try {
                const launchOpts = (typeof uni.getLaunchOptionsSync === 'function' ? uni.getLaunchOptionsSync() : null) || {};
                query = launchOpts?.query || {};
            } catch (e) {
                query = {};
            }
            isColdLaunchHandled = true;
        }
    } else {
        isColdLaunchHandled = true;
    }

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

    // 若无任何深度链接参数，直接静默退出（普通切前台流程）
    if (!uri && !wallId && !targetPage) return;

    // 解析壁纸 ID
    const idMatch = uri ? uri.match(/[?&]id=(\d+)/) : null;
    const finalId = wallId || (idMatch ? idMatch[1] : '');

    // 确定目标跳转路径
    let targetUrl = '';
    let targetKey = '';
    if (targetPage === '/pages/app/preview' || uri.includes('preview') || finalId) {
        if (finalId) {
            targetUrl = `/pages/app/preview?id=${finalId}`;
            targetKey = `preview:${finalId}`;
        }
    } else if (targetPage === '/pages/app/search' || uri.includes('search')) {
        targetUrl = '/pages/app/search';
        targetKey = 'page:/pages/app/search';
    } else if (targetPage === '/pages/app/favorite' || uri.includes('favorite')) {
        targetUrl = '/pages/app/favorite';
        targetKey = 'page:/pages/app/favorite';
    }

    if (!targetUrl || !targetKey) return;

    // 3. 全局频控与防抖（针对完整 targetKey，2000ms 窗口内禁止重复触发相同目标）
    const now = Date.now();
    if (targetKey === lastTargetKey && now - lastTargetTimestamp < 2000) {
        console.log('[handleDeepLink] 频控拦截重复深度链接:', targetKey);
        return;
    }

    // 4. 路由并发锁：若前一次跳转尚未完成，禁止并发压栈（防白屏）
    if (isNavigating) {
        console.warn('[handleDeepLink] 导航锁生效中，拦截并发跳转:', targetKey);
        return;
    }

    // 5. 检查当前页面栈顶：若已经在目标页面，直接无需跳转
    try {
        const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
        if (pages && pages.length > 0) {
            const curPage = pages[pages.length - 1];
            const curRoute = '/' + (curPage.route || '').replace(/^\//, '');
            const curOptions = curPage.options || curPage.$page?.options || {};

            if (curRoute === '/pages/app/preview' && targetUrl.includes('/pages/app/preview')) {
                const curId = String(curOptions.id || '');
                if (curId && curId === String(finalId)) {
                    console.log('[handleDeepLink] 当前已在目标预览页，忽略重复跳转');
                    lastTargetKey = targetKey;
                    lastTargetTimestamp = now;
                    return;
                }
            } else if (targetPage && curRoute === targetPage) {
                console.log('[handleDeepLink] 当前已在目标页面，忽略重复跳转:', targetPage);
                lastTargetKey = targetKey;
                lastTargetTimestamp = now;
                return;
            }
        }
    } catch (err) {
        console.warn('[handleDeepLink] 检测页面栈异常:', err);
    }

    // 标记跳转开始与防抖记录
    lastTargetKey = targetKey;
    lastTargetTimestamp = now;
    isNavigating = true;

    console.log('[handleDeepLink] 安全调度页面跳转:', targetUrl);

    setTimeout(() => {
        uni.navigateTo({
            url: targetUrl,
            fail: (err) => {
                console.error('[handleDeepLink] 跳转失败:', err);
            },
            complete: () => {
                // 等待页面转场动画完全结束（约400ms）后释放导航锁
                setTimeout(() => {
                    isNavigating = false;
                }, 400);
            }
        });
    }, 200);
};
