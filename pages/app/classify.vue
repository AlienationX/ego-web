<template>
    <view class="classLayout" :class="isDark ? 'theme-dark' : 'theme-light'">
        <!-- #ifndef WEB -->
        <view class="status-bar-bg" :style="{ height: `${statusBarHeight}px` }"></view>
        <!-- #endif -->

        <!-- 沉浸式头部区域 -->
        <view class="hero-section" :style="{ paddingTop: `${heroTopPadding}px` }">
            <view class="hero-header">
                <view class="title-group">
                    <view class="hero-title">{{ $t('category.title') }}</view>
                    <view class="hero-desc">{{ $t('category.desc') }}</view>
                </view>
            </view>

            <view class="search-container">
                <search-bar></search-bar>
            </view>

            <!-- 广告位 -->
            <view v-if="heroAdVisible" class="hero-ad">
                <custom-ad-banner @load="heroAdLoaded = true" @error="heroAdLoaded = false"></custom-ad-banner>
            </view>
        </view>

        <!-- 加载状态 -->
        <view v-if="isLoading" class="loading-container">
            <rotate-loading :size="100"></rotate-loading>
            <view class="loading-text">{{ $t('message.loading') }}</view>
        </view>

        <!-- 空状态 -->
        <view v-else-if="!classifyList.length" class="empty-container">
            <view class="empty-text">{{ $t('category.empty') }}</view>
        </view>

        <!-- 分类网格 -->
        <view class="classify-grid-padding">
            <classify-grid v-if="classifyList.length" :items="classifyComputed" />
        </view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { apiGetClassify } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { useUserStore } from '@/stores/user.js';
import { getStatusBarHeight } from '@/utils/system.js';
import { useSettingsStore } from '@/stores/settings.js';

const statusBarHeight = ref(getStatusBarHeight() || 0);
const heroTopPadding = computed(() => statusBarHeight.value + 10);
const classifyList = ref([]);
const isLoading = ref(true);
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const isDark = computed(() => settingsStore.isDark);
const heroAdLoaded = ref(false);
const heroAdVisible = computed(() => adEnabled.value && heroAdLoaded.value);

const classifyComputed = computed(() => {
    return classifyList.value.map((item) => ({
        ...item,
        name: uni.getLocale() === 'en' ? item.name_en : item.name,
    }));
});
const adEnabled = computed(() => !userStore.isVip && userStore.showAd);

const getClassify = async () => {
    try {
        isLoading.value = true;
        let res = await apiGetClassify();
        classifyList.value = (res.data || []).map((item) => handlePicUrl(item));
        uni.setStorageSync('classifyList', classifyList.value);
    } catch (error) {
        console.error('获取分类数据失败:', error);
    } finally {
        isLoading.value = false;
    }
};

onLoad(() => {
    getClassify();
});
</script>

<style lang="scss" scoped>
@import '@/static/styles/theme-variables.scss';

.classLayout {
    background: var(--page-background);
    min-height: 100vh;
    position: relative;
}

.status-bar-bg {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    background: var(--page-background);
    overflow: hidden;
    pointer-events: none;
    z-index: 9999;
}

.hero-section {
    position: relative;
    padding: 0rpx 30rpx;
    z-index: 10;

    .hero-title {
        font-size: 68rpx;
        font-weight: 900;
        color: var(--text-primary);
        letter-spacing: -2rpx;
        line-height: 1.1;
        // 针对 Web 端增强投影
        filter: drop-shadow(0 4rpx 8rpx rgba(0, 0, 0, 0.1));
    }

    .hero-desc {
        font-size: 28rpx;
        color: var(--text-secondary);
        margin-top: 15rpx;
        font-weight: 500;
        letter-spacing: 1rpx;
    }

    .search-container {
        margin: 10rpx -30rpx 0;
    }

    .hero-ad {
        margin-top: 20rpx;
        padding-bottom: 30rpx;
    }
}

.loading-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 50vh;
    z-index: 10;
    position: relative;

    .loading-text {
        margin-top: 20rpx;
        font-size: 24rpx;
        color: #999;
    }
}

.classify-grid-padding {
    padding: 30rpx;
}
</style>
