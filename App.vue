<script>
import permissionListener from '@/uni_modules/c-permission-listener';
import { writeAccessLog } from '@/utils/system.js';
import { permissionEnums } from '@/common/app_permission.js';

export default {
    onLaunch: function () {
        console.log('App Launch');

        // 检查是否已看过引导页
        const hasSeenGuide = uni.getStorageSync('hasSeenGuide');
        if (!hasSeenGuide) {
            // 未看过引导页，跳转到引导页
            uni.reLaunch({
                url: '/pages/guide/guide',
            });
        }

        // uni.getProvider({
        //     service: 'oauth',
        //     success: function (res) {
        //         console.log(res, 'getProvider'); // ['weixin', qq', 'univerify']
        //     }
        // });
        
        // 监控主题变化。如果是浏览器或小程序使用了暗黑模式，就会触发该监控
        // 除了APP平台可以手动设置，其他平台都只能跟随系统的主题变化
        uni.onThemeChange(({ theme }) => {
            // 默认传参的是对象{theme: 'dark'}, 所以需要解构赋值
            console.log('onThemeChange', theme);
            
            // #ifdef APP
            // APP端触发主题切换，WEB跟随浏览器的默认设置，小程序跟随小程序的默认设置
            plus.nativeUI.setUIStyle(theme);
            // #endif
        });

        writeAccessLog();

        console.log(import.meta.env, 'env');
        console.log(import.meta.env.VITE_SOME_KEY, 'test'); // "123"
        console.log(import.meta.env.VUE_APP_DEBUG_MODE, 'debug'); // TODO 未显示，如何加载

        // #ifndef MP
        console.log(process.env, 'process.env'); // 小程序不支持
        console.log(process.env.VUE_APP_DEBUG_MODE, 'debug');
        // #endif
    },

    onShow: function () {
        console.log('App Show');

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
    },

    onHide: function () {
        console.log('App Hide');
        permissionListener && permissionListener.stopFunc();
    },
};
</script>

<style lang="scss">
/*每个页面公共css */
@import '@/static/styles/common-style.scss';
</style>
