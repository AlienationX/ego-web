<script>
    import { writeAccessLog } from '@/utils/system.js';

    export default {
        onLaunch: function () {
            console.log('App Launch');

            // uni.getProvider({
            //     service: 'oauth',
            //     success: function (res) {
            //         console.log(res, 'getProvider'); // ['weixin', qq', 'univerify']
            //     }
            // });

            writeAccessLog();

            console.log(import.meta.env);
            console.log(import.meta.env.VITE_SOME_KEY); // "123"
            console.log(import.meta.env.VUE_APP_DEBUG_MODE); // TODO 未显示，如何加载

            // #ifndef MP
            console.log(process.env); // 小程序不支持
            console.log(process.env.VUE_APP_DEBUG_MODE);
            // #endif
        },

        onShow: function () {
            console.log('App Show');
        },

        onHide: function () {
            console.log('App Hide');
        }
    };
</script>

<style lang="scss">
    /*每个页面公共css */
    @import 'common/style/common-style.scss';
</style>
