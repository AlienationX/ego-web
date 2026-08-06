<script setup>
import permissionListener from '@/uni_modules/c-permission-listener';
import { writeAccessLog } from '@/utils/system.js';
import { permissionEnums } from '@/common/app_permission.js';
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useSettingsStore } from '@/stores/settings.js';
import { useAppStore } from '@/stores/app.js';

const settingsStore = useSettingsStore();
const appStore = useAppStore();

import { applyLanguagePreference, getLanguagePreference, LANGUAGE_PREF_AUTO } from '@/utils/i18n.js';

onLaunch(() => {
    console.log('App Launch');
    appStore.fetchVersionConfig();

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
        settingsStore.osTheme = theme;

        // #ifdef APP
        // auto 模式下保持原生 UI 跟随系统（必须传 'auto'，传具体主题会锁死原生 UI，导致后续主题事件停止派发）
        if (settingsStore.options.theme === 'auto') {
            plus.nativeUI.setUIStyle('auto');
        }
        // #endif
    });

    // 初始化应用语言（Android 修改系统语言会重启 App，这里负责正确初始化）
    applyLanguagePreference(getLanguagePreference());

    // 不再需要，因为 onLaunch、onShow、settings 中有调用 applyLanguagePreference 进行设置
    // 监听应用内语言切换（uni.setLocale 触发，非系统语言）
    // uni.onLocaleChange(() => {
    //     console.log('onLocaleChange', uni.getLocale());
    //     if (getLanguagePreference() === LANGUAGE_PREF_AUTO) {
    //         applyLanguagePreference(LANGUAGE_PREF_AUTO);
    //     }
    // });

    // 写入启动日志
    writeAccessLog();

    // console.log(import.meta.env, 'env');
    // console.log(import.meta.env.VITE_SOME_KEY, 'test'); // "123"
    // console.log(import.meta.env.VUE_APP_DEBUG_MODE, 'debug'); // TODO 未显示，如何加载

    // #ifndef MP
    // console.log(process.env, 'process.env'); // 小程序不支持
    // console.log(process.env.VUE_APP_DEBUG_MODE, 'debug');
    // #endif

    // 全局隐藏原生 TabBar（适用于 App 和 H5 端）
    // uni.hideTabBar({ animation: false, fail: () => { } });
});

onShow(() => {
    console.log('App Show');

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
