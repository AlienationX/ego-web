import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiGetVersionConfig } from '@/api/wallpaper.js';
import { CHANNEL } from '@/common/config.js';

export const useAppStore = defineStore('app', () => {
    // 跨页面共享的壁纸列表，替代原来的 uni.setStorageSync('wallList', list)
    const wallList = ref([]);

    // 跨页面共享的分类列表，替代原来的 uni.setStorageSync('classifyList', list)
    const classifyList = ref([]);

    // 版本与渠道功能配置（支持广告开关 ad_enabled、支付开关 pay_enabled）
    const versionConfig = ref(
        uni.getStorageSync('version_config') || {
            ad_enabled: true,
            pay_enabled: true,
            set_wallpaper_enabled: true,
        },
    );

    // 拉取版本配置
    const fetchVersionConfig = async () => {
        try {
            let platform = uni.getDeviceInfo().platform;
            if (platform === 'devtools') {
                platform = 'wechat';
            }
            // console.log('platform:', platform);
            // console.log('channel:', CHANNEL);
            // const res = await apiGetVersionConfig({ platform: platform, channel: CHANNEL });
            const res = await apiGetVersionConfig({ channel: CHANNEL });
            // console.log('fetchVersionConfig:', res);
            versionConfig.value = res.data;
            uni.setStorageSync('version_config', versionConfig.value);
        } catch (e) {
            console.warn('Fetch version config failed, keep cached/default config:', e);
        }
    };

    return {
        wallList,
        classifyList,
        versionConfig,
        fetchVersionConfig,
    };
});
