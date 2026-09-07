<template>
    <view class="classLayout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'" :style="pageStyle">
        <scroll-view scroll-y class="page-scroll" show-scrollbar="false" :style="pageScrollStyle">
            <view class="page-scroll__content" :style="{ paddingBottom: pagePaddingBottom }">
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

                    <!-- 分类类型筛选胶囊条 -->
                    <view class="channel-filter-bar">
                        <view class="channel-pill" :class="{ 'is-active': activeType === 0 }"
                            @click="selectType(0)">
                            <text>{{ $t('common.recommend') }}</text>
                        </view>
                        <view class="channel-pill" :class="{ 'is-active': activeType === 1 }"
                            @click="selectType(1)">
                            <text>{{ $t('channels.mobile') }}</text>
                        </view>
                        <view class="channel-pill" :class="{ 'is-active': activeType === 4 }"
                            @click="selectType(4)">
                            <text>{{ $t('channels.avatar') }}</text>
                        </view>
                        <view class="channel-pill" :class="{ 'is-active': activeType === 2 }"
                            @click="selectType(2)">
                            <text>{{ $t('channels.desktop') }}</text>
                        </view>
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
                <view v-else-if="!classifyComputed.length" class="empty-container">
                    <view class="empty-title">{{ $t('category.empty') }}</view>
                    <view class="empty-desc">{{ $t('category.emptyDesc') }}</view>
                </view>

                <!-- 分类网格 -->
                <view v-else class="classify-grid-padding">
                    <classify-grid :items="classifyComputed" />
                </view>
            </view>
        </scroll-view>

        <!-- 自定义 TabBar 组件 -->
        <glass-tab-bar
            current-path="/pages/app/classify"
            :theme="settingsStore.isDark ? 'dark' : 'light'"
        ></glass-tab-bar>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { apiGetClassify } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { getStatusBarHeight, getTabBarHeight } from '@/utils/layout.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useAppStore } from '@/stores/app.js';

const pagePaddingBottom = computed(() => {
    const baseTabSpace = getTabBarHeight();
    return `${baseTabSpace + 12}px`;
});

const { t, locale } = useI18n();
const isEn = computed(() => locale.value === 'en');

const statusBarHeight = ref(getStatusBarHeight() || 0);
const heroTopPadding = computed(() => statusBarHeight.value + 12);
const appStore = useAppStore();
const classifyList = computed({
    get: () => appStore.classifyList,
    set: (val) => { appStore.classifyList = val; }
});
const isLoading = ref(true);
const settingsStore = useSettingsStore();
const activeType = ref(0); // 0: 全部, 1: 手机壁纸, 4: 头像, 2: 电脑壁纸

const selectType = (type) => {
    activeType.value = type;
};

const classifyComputed = computed(() => {
    let list = classifyList.value;
    if (activeType.value > 0) {
        list = list.filter((item) => {
            if (activeType.value === 1) {
                return !item.classify_type || item.classify_type === 1;
            }
            return item.classify_type === activeType.value;
        });
    }
    return list.map((item) => ({
        ...item,
        classify_name: isEn.value && item.classify_name_en ? item.classify_name_en : item.classify_name,
    }));
});

const pageStyle = computed(() => ({}));
const pageScrollStyle = computed(() => ({
    height: '100vh',
}));

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

onLoad(() => {
    getClassify();
});
</script>

<style lang="scss" scoped>
.classLayout {
    background: var(--page-background);
    position: relative;
    height: 100vh;
    overflow: hidden;
    overflow-x: hidden; // 防止任意子元素的水平溢出撑出横向滚动条
}

.page-scroll {
    width: 100%;
}

.page-scroll__content {
    min-height: 100%;
    padding-bottom: 2rpx;
}

.hero-section {
    position: relative;
    padding: 0rpx 20rpx;
    z-index: 10;
    overflow: hidden; // 防止内部子元素负 margin 撑出滚动条

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

    .channel-filter-bar {
        display: flex;
        align-items: center;
        gap: 14rpx;
        margin-top: 18rpx;
        margin-bottom: 8rpx;
        overflow-x: auto;
        white-space: nowrap;

        .channel-pill {
            padding: 10rpx 26rpx;
            border-radius: 30rpx;
            background: rgba(0, 0, 0, 0.04);
            font-size: 24rpx;
            font-weight: 600;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s ease;
            flex-shrink: 0;

            .theme-dark & {
                background: rgba(255, 255, 255, 0.06);
            }

            &.is-active {
                background: #4f46e5;
                color: #ffffff;
                box-shadow: 0 4rpx 14rpx rgba(79, 70, 229, 0.28);

                .theme-dark & {
                    background: #6366f1;
                    color: #ffffff;
                }
            }
        }
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
    padding: 20rpx 20rpx 10rpx 20rpx;
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
    background: linear-gradient(90deg,
            var(--panel-background) 25%,
            rgba(200, 200, 200, 0.12) 50%,
            var(--panel-background) 75%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.6s infinite linear;
}

.skeleton-label {
    width: 60%;
    height: 28rpx;
    border-radius: 8rpx;
    background: linear-gradient(90deg,
            var(--panel-background) 25%,
            rgba(200, 200, 200, 0.12) 50%,
            var(--panel-background) 75%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.6s infinite linear;
}

@keyframes skeleton-shimmer {
    0% {
        background-position: 200% 0;
    }

    100% {
        background-position: -200% 0;
    }
}
</style>
