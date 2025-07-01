<template>
    <view>
        <button @click="loginByWechat">微信登录</button>
        <button @click="">邮箱登录</button>
        <button @click="">手机号登录</button>
        <button @click="">Google</button>
        <button @click="">Apple</button>
    </view>
</template>

<script setup>
    import { apiPostLoginByWechat } from '@/api/wallpaper.js';
    import { useUserStore } from '@/stores/user';

    const userStore = useUserStore();

    const loginByWechat = () => {
        let avatarUrl = '';
        let nickName = '';
        let code = '';

        uni.getUserInfo({
            // provider: 'weixin',
            success: (userRes) => {
                console.log(userRes, 'getUserInfo');
                ({ avatarUrl, nickName } = userRes.userInfo);
                // avatarUrl = userRes.userInfo.avatarUrl;
                // nickName = userRes.userInfo.nickName;
                console.log(avatarUrl, nickName);
            }
        });

        // 和 getUserInfo 的返回基本一样
        // uni.getUserProfile({
        //     desc: '描述信息xxx',
        //     success: (userRes) => {
        //         console.log(userRes, 'getUserProfile');
        //     }
        // });

        uni.login({
            // provider: 'weixin', //使用微信登录
            // success: async function (loginRes) {
            success: function (loginRes) {
                console.log(loginRes, 'login');

                const { code } = loginRes;
                // //客户端成功获取授权临时票据（code）,向业务服务器发起登录请求。
                // uni.request({
                //     url: 'https://www.example.com/loginByWeixin', //仅为示例，并非真实接口地址。
                //     data: {
                //         code: event.code
                //     },
                //     success: (res) => {
                //         //获得token完成登录
                //         uni.setStorageSync('token',res.token)
                //     }
                // });

                (async () => {
                    // 模拟异步操作
                    let res = await apiPostLoginByWechat({
                        code
                    });
                    console.log("api result data >>>", res);
                    let { access, refresh } = res.data;
                    userStore.setToken(access, refresh);
                    userStore.setUserInfo();
                })();
            }
        });
    };
</script>

<style lang="scss" scoped></style>
