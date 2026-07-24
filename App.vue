<script setup>
import permissionListener from '@/uni_modules/c-permission-listener';
import { writeAccessLog } from '@/utils/system.js';
import { permissionEnums } from '@/common/app_permission.js';
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useSettingsStore } from '@/stores/settings.js';

const settingsStore = useSettingsStore();

onLaunch(() => {
    console.log('App Launch');

    // 检查是否已看过引导页。
    // TODO 目前太慢，还没检查已经进入首页了，然后再跳转回来。且图片加载过慢，放到static中又影响打包大小
    // const hasSeenGuide = uni.getStorageSync('hasSeenGuide');
    // if (!hasSeenGuide) {
    //     // 未看过引导页，跳转到引导页
    //     uni.reLaunch({
    //         url: '/pages/guide/guide',
    //     });
    // }

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
        console.log('osTheme', settingsStore.osTheme);
        settingsStore.osTheme = theme;

        // #ifdef APP
        // 在 App 上需要先调用 plus.nativeUI.setUIStyle('auto') 开启跟随系统主题切换的功能，才能监听到主题切换事件，值为light或dark
        plus.nativeUI.setUIStyle(theme);
        // #endif
    });

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

    // uni.hideTabBar({ animation: false, fail: () => { } });

    // 从后台切回时 onThemeChange 可能未触发，重新同步系统主题
    if (settingsStore.options.theme === 'auto') {
        const currentOsTheme = uni.getDeviceInfo().osTheme || uni.getAppBaseInfo().hostTheme || 'light';
        if (settingsStore.osTheme !== currentOsTheme) {
            console.log('onShow sync osTheme:', settingsStore.osTheme, '->', currentOsTheme);
            // #ifdef APP
            plus.nativeUI.setUIStyle(currentOsTheme);
            // #endif
            settingsStore.osTheme = currentOsTheme;
        }
    }

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
