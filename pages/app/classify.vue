<template>
    <view class="classLayout" :class="isDark ? 'theme-dark' : 'theme-light'" :style="pageStyle">
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

        </view>

        <!-- 加载骨架屏 -->
        <view v-if="isLoading" class="classify-grid-padding">
            <view class="skeleton-grid">
                <view v-for="i in 8" :key="i" class="skeleton-item">
                    <view class="skeleton-pic"></view>
                    <view class="skeleton-label"></view>
                </view>
            </view>
        </view>

        <!-- 空状态 -->
        <view v-else-if="!classifyList.length" class="empty-container">
            <view class="empty-title">{{ $t('category.empty') }}</view>
            <view class="empty-desc">{{ $t('category.emptyDesc') }}</view>
        </view>

        <!-- 分类网格 -->
        <view v-else class="classify-grid-padding">
            <classify-grid :items="classifyComputed" />
        </view>

        <!-- 吸底全局广告 (在 tabBar 之上) -->
        <custom-ad-banner @height-change="onAdHeightChange"></custom-ad-banner>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { updateTabBarText } from '@/utils/i18n.js';
import { apiGetClassify } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { getStatusBarHeight } from '@/utils/system.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useAppStore } from '@/stores/app.js';

const { t, locale } = useI18n();
const isEn = computed(() => locale.value === 'en');

const statusBarHeight = ref(getStatusBarHeight() || 0);
const heroTopPadding = computed(() => statusBarHeight.value + 10);
const appStore = useAppStore();
const classifyList = computed({
    get: () => appStore.classifyList,
    set: (val) => { appStore.classifyList = val; }
});
const isLoading = ref(true);
const settingsStore = useSettingsStore();
const isDark = computed(() => settingsStore.isDark);

const classifyComputed = computed(() => {
    return classifyList.value.map((item) => ({
        ...item,
        name: isEn.value ? item.name_en || item.name : item.name,
    }));
});

// ── 广告高度，控制底部留白 ──
const adHeight = ref(0);
const onAdHeightChange = (height) => {
    adHeight.value = Math.max(0, Number(height) || 0);
};
const pageStyle = computed(() => (adHeight.value > 0 ? { paddingBottom: `${adHeight.value}px` } : {}));

const getClassify = async () => {
    try {
        isLoading.value = true;
        let res = await apiGetClassify();
        classifyList.value = (res.data || []).map((item) => handlePicUrl(item));
    } catch (error) {
        console.error('获取分类数据失败:', error);
    } finally {
        isLoading.value = false;
    }
};

onShow(() => {
    // #ifdef MP || APP-HARMONY
    updateTabBarText(t);
    // #endif
});

onLoad(() => {
    getClassify();
});
</script>

<style lang="scss" scoped>
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
    padding: 0rpx 20rpx;
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

.empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 120rpx 60rpx;
    text-align: center;
}

.empty-icon {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background: var(--panel-background);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 36rpx;
}

.empty-title {
    font-size: 34rpx;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 16rpx;
}

.empty-desc {
    font-size: 26rpx;
    line-height: 1.7;
    color: var(--text-tertiary);
    max-width: 520rpx;
}

.classify-grid-padding {
    padding: 20rpx;
}

// ── 骨架屏 ──
.skeleton-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24rpx;
}

.skeleton-item {
    display: flex;
    flex-direction: column;
    gap: 14rpx;
}

.skeleton-pic {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 24rpx;
    background: linear-gradient(
        90deg,
        var(--panel-background) 25%,
        rgba(200, 200, 200, 0.12) 50%,
        var(--panel-background) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.6s infinite linear;
}

.skeleton-label {
    width: 60%;
    height: 28rpx;
    border-radius: 8rpx;
    background: linear-gradient(
        90deg,
        var(--panel-background) 25%,
        rgba(200, 200, 200, 0.12) 50%,
        var(--panel-background) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.6s infinite linear;
}

@keyframes skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
</style>
