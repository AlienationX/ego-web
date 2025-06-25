import { ref, reactive, computed } from 'vue';
import { defineStore } from 'pinia'; 

export const useUserStore = defineStore(
    'user',
    () => {
        const accessToken = ref('');
        const refreshToken = ref('');
        const userinfo = reactive({});

        const showAd = ref(true);

        const setToken = (access, refresh) => {
            accessToken.value = access;
            refreshToken.value = refresh;
        };

        const setUserInfo = (data) => {
            userinfo.value = data;
        };

        const clearUserData = () => {
            accessToken.value = '';
            refreshToken.value = '';
            userinfo.value = null;
        };

        // 记录本次使用的下载次数
        const downloadCnt = ref(0);
        const downloadCntAdd = () => {
            downloadCnt.value++;
            console.log('已下载次数', downloadCnt.value);
        };

        return { accessToken, refreshToken, userinfo, showAd, setToken, setUserInfo, clearUserData, downloadCntAdd };
    },
    // {
    //     persist: {
    //         // 存储的 key， 默认是 defineStore 的第一个参数
    //         // key: "A",
    //         // 存储位置，默认 localStorage，还支持sessionStorage，cookie比较复杂
    //         // storage: localStorage,
    //         // 指定存储的内容
    //         paths: ['token'],
    //     },
    // }
    {
        persist: true
    }
);
