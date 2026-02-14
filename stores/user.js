import { ref, reactive, computed } from 'vue';
import { defineStore } from 'pinia';
import { apiGetProfile } from '@/api/wallpaper';
import { encrypt } from '@/utils/encryption.js';
import { PICS_BASE_URL } from '@/common/config.js';

export const useUserStore = defineStore(
    'user',
    () => {
        const accessToken = ref('');
        const refreshToken = ref('');
        const userinfo = ref({}); // const 声明的变量不能被整体重新赋值userinfo=res.data，只能修改其属性。Object.assign(userinfo, res.data);
        const preferences = reactive({
            language: 'zh-CN',
            fontSize: 14,
        });

        const showAd = ref(true); // 全局控制
        const isVip = computed(() => userinfo.value.profile.is_vip || false); // 用户级别控制
        const isLogin = computed(() => userinfo.value.id || false); // 登录状态控制

        const setToken = (access, refresh) => {
            accessToken.value = encrypt(access);
            refreshToken.value = encrypt(refresh);
        };

        // const setUserInfo = () => {
        //     (async () => {
        //         let res = await apiGetProfile();
        //         userinfo.value = res.data;
        //     })();

        const setUserInfo = async () => {
            let res = await apiGetProfile();
            userinfo.value = res.data;

            // 如果avatar字段不为空，则拼接，不存在则使用随机头像
            if (userinfo.value.profile.avatar) {
                userinfo.value.profile.avatar &&= `${PICS_BASE_URL}/${userinfo.value.profile.avatar}`;
            } else {
                // /static/images/pics/default_avatar.svg
                userinfo.value.profile.avatar = `https://api.dicebear.com/9.x/bottts/svg?seed=${userinfo.value.id}`;
            }
        };

        const clearUserData = () => {
            accessToken.value = '';
            refreshToken.value = '';
            userinfo.value = {};

            // Object.assign(info, {});  // 该方式只能覆盖已有key的value，主要用于对象的合并

            // for (const k in info) {
            //     delete info[k];
            // }
            // Object.keys(userinfo).forEach((key) => delete userinfo[key]);

            // menuRoutes = reactive([]);  // 无效
            // menuRoutes.splice(0);  // 清空数组
            // menuRoutes.length = 0;  // 清空数组
            // routes.push(...routes)  // 列表追加列表
        };

        // 记录本次使用的下载次数
        const downloadCnt = ref(0);
        const downloadCntAdd = () => {
            downloadCnt.value++;
            console.log('已下载次数', downloadCnt.value);
        };

        return {
            accessToken,
            refreshToken,
            userinfo,
            showAd,
            isVip,
            isLogin,
            setToken,
            setUserInfo,
            clearUserData,
            downloadCnt,
            downloadCntAdd,
        };
    },
    {
        persist: {
            // 存储的 key， 默认是 defineStore 的第一个参数
            // key: "A",
            // 存储位置，默认 localStorage，还支持sessionStorage，cookie比较复杂
            // storage: localStorage,
            // 指定存储的内容
            paths: ['accessToken', 'refreshToken'],
        },
    }
);
