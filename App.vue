<script setup>
import permissionListener from '@/uni_modules/c-permission-listener';
import { writeAccessLog } from '@/utils/system.js';
import { permissionEnums } from '@/common/app_permission.js';
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useSettingsStore } from '@/stores/settings.js';
import { useAppStore } from '@/stores/app.js';
import { getCardDeepLink } from '@/uni_modules/ego-widget';
import { initAutoRotate } from '@/uni_modules/ego-wallpaper-manager';

const settingsStore = useSettingsStore();
const appStore = useAppStore();

import { applyLanguagePreference, getLanguagePreference, LANGUAGE_PREF_AUTO } from '@/utils/i18n.js';

onLaunch(() => {
    console.log('App Launch');
    appStore.fetchVersionConfig();

    // #ifdef APP
    initAutoRotate();
    // #endif

    // 检查是否已看过引导页。
    // TODO 目前太慢，还没检查已经进入首页了，然后再跳转回来。且图片加载过慢，放到static中又影响打包大小
    // const hasSeenGuide = uni.getStorageSync('hasSeenGuide');
    // if (!hasSeenGuide) {
    //     // 未看过引导页，跳转到引导页
    //     uni.reLaunch({
    //         url: '/pages/guide/guide',
    //     });
    // }

    // 初始化应用主题
    // #ifdef APP
    const savedTheme = uni.getStorageSync('theme') || 'auto';
    settingsStore.options.theme = savedTheme;
    plus.nativeUI.setUIStyle(savedTheme);
    // #endif

    // #ifndef APP
    settingsStore.options.theme = 'auto';
    // #endif

    // 监控系统主题变化
    uni.onThemeChange(({ theme }) => {
        console.log('onThemeChange', theme);
        settingsStore.osTheme = uni.getDeviceInfo().osTheme || uni.getAppBaseInfo().hostTheme || 'light';

        // #ifdef APP
        // auto 模式下保持原生 UI 跟随系统（必须传 'auto'，传具体主题会锁死原生 UI，导致后续主题事件停止派发）
        if (settingsStore.options.theme === 'auto') {
            plus.nativeUI.setUIStyle('auto');
        }
        // #endif
    });

    // 初始化应用语言（Android 修改系统语言会重启 App，这里负责正确初始化）
    applyLanguagePreference(getLanguagePreference());

    // 写入启动日志
    writeAccessLog();

    // 处理深度链接（如桌面小组件点击）
    handleDeepLink();

    // 监听应用切前台全局事件
    if (typeof uni.onAppShow === 'function') {
        uni.onAppShow((res) => {
            handleDeepLink(res);
        });
    }

    // #ifdef APP-PLUS
    plus.globalEvent.addEventListener('newintent', () => {
        handleDeepLink();
    });
    // #endif
});

// 处理 URL Scheme 及桌面小组件深度链接唤起 (支持 HarmonyOS, Android, iOS, H5)
let lastDeepLinkTimestamp = 0;
let lastDeepLinkId = '';
const handleDeepLink = (showRes = null) => {
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
            console.log('[App.vue] getCardDeepLink =>', { wallId, targetPage, uri });
        }
    } catch (e) {
        console.error('[App.vue] getCardDeepLink error:', e);
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

onShow((res) => {
    console.log('App Show', res);
    handleDeepLink(res);
    // 鸿蒙热启动：onNewWant 写 Preferences 后 onShow 会立刻触发，但 Preferences 可能还未 flush 完
    // 延迟 400ms 再读一次，确保数据已经落盘
    setTimeout(() => {
        handleDeepLink();
    }, 400);

    // iOS/鸿蒙修改系统语言不重启 App，切回前台时通过 onShow 重新检测系统语言
    // 注：uni.onLocaleChange 只监听 uni.setLocale() 调用，无法感知系统设置变化
    const latestOsLang = uni.getDeviceInfo().osLanguage || uni.getAppBaseInfo().hostLanguage || 'en';
    settingsStore.osLanguage = latestOsLang;
    if (getLanguagePreference() === LANGUAGE_PREF_AUTO) {
        applyLanguagePreference(LANGUAGE_PREF_AUTO);
    }

    // uni.hideTabBar({ animation: false, fail: () => { } });

    // permissionEnums枚举建议单独一个js文件，然后引入
    // const permissionEnums = {
    //     // 取android.permission.ACCESS_COARSE_LOCATION后面那个
    //     "ACCESS_COARSE_LOCATION": {
    //         name: "定位", // 当前权限的名称
    //         explain: "展示附近店铺、填写收货地址等相关功能"       // 权限说明
    //     },
    //     "CALL_PHONE,READ_PHONE_STATE": {
    //         name: "电话", // 当前权限的名称
    //         explain: "拨打电话"     // 权限说明
    //     },
    //     "WRITE_EXTERNAL_STORAGE,READ_EXTERNAL_STORAGE,READ_MEDIA_IMAGES": {
    //         name: "存储", // 当前权限的名称
    //         explain: "上传头像完善个人信息"       // 权限说明
    //     }
    // }
    // 唤起权限会触发onHide，所以listenerFunc须在onShow生命周期调用
    permissionListener && permissionListener.listenerFunc(permissionEnums);
});

onHide(() => {
    console.log('App Hide');
    permissionListener && permissionListener.stopFunc();
});

// export default {
//     onLaunch: function () {
//         console.log('App Launch');
//     },

//     onShow: function () {
//         console.log('App Show');
//     },

//     onHide: function () {
//         console.log('App Hide');
//     },
// };
</script>

<style lang="scss">
/*每个页面公共css */
@import '@/static/styles/common-style.scss';
@import '@/static/iconfont/appicons.css';
</style>
