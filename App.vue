<script>
    export default {
        onLaunch: function () {
            console.log('App Launch');

            uni.getProvider({
                service: 'oauth',
                success: function (res) {
                    console.log(res, 'getProvider'); // ['weixin', qq', 'univerify']
                }
            });

            // #ifndef MP
            console.log(process.env); // 小程序不支持
            console.log(process.env.VUE_APP_API_BASE);
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
