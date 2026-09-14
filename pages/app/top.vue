<template>
    <view class="top10-page" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 沉浸式渐变毛玻璃状态栏 -->
        <glass-status-bar
            :is-scrolled="isScrolled"
            :theme="settingsStore.isDark ? 'dark' : 'light'"
        ></glass-status-bar>

        <view class="top10-wrap" :style="{ paddingTop: top10WrapPaddingTop, paddingBottom: top10WrapPaddingBottom }">
                <!-- 顶部标准返回栏 (对齐 timeline / subjects 规范) -->
                <view class="topbar">
                    <view class="topbar__back" @click="goBack">
                        <mdi-icon
                            path="/static/icons/arrow-left.svg"
                            size="20px"
                            :color="settingsStore.isDark ? '#f4f8ff' : '#1f2937'"
                        ></mdi-icon>
                    </view>
                </view>

                <!-- Editorial 杂志大标题区 (层次清晰：角标 -> 56rpx大标题 -> 说明文本) -->
                <view class="hero-header">
                    <view class="hero-header__badge">
                        <text class="badge-icon">🔥</text>
                        <text class="badge-text">{{ metricBadge }}</text>
                    </view>
                    <text class="hero-header__title">{{ $t('top10.title') }}</text>
                    <text class="hero-header__desc">{{ metricDescription }}</text>
                </view>

                <!-- 骨架屏 -->
                <view v-if="loading" class="skeleton-wrap">
                    <!-- 大卡骨架 -->
                    <view class="skeleton-hero-first"></view>
                    <!-- 两小卡骨架 -->
                    <view class="skeleton-hero-grid">
                        <view class="skeleton-hero-secondary"></view>
                        <view class="skeleton-hero-secondary"></view>
                    </view>
                    <!-- 列表项骨架 -->
                    <view class="skeleton-rank-list">
                        <view v-for="i in 4" :key="i" class="skeleton-rank-item">
                            <view class="skeleton-rank-thumb"></view>
                            <view class="skeleton-rank-body">
                                <view class="skeleton-rank-title"></view>
                                <view class="skeleton-rank-title skeleton-rank-title--short"></view>
                                <view class="skeleton-rank-meta"></view>
                            </view>
                        </view>
                    </view>
                </view>

                <template v-else-if="rankedList.length">
                    <view class="hero-section">
                        <view
                            class="hero-card hero-card--first"
                            :key="`${activeMetric}-${rankedList[0].id}`"
                            :style="{ animationDelay: '0.20s' }"
                            @click="goPreview(rankedList[0].id)"
                        >
                            <image
                                class="hero-card__image"
                                :src="rankedList[0].mediumPicurl || rankedList[0].picurl"
                                mode="aspectFill"
                            ></image>
                            <view class="hero-card__overlay"></view>
                            <view class="hero-card__rank hero-card__rank--first">1</view>
                            <view class="hero-card__content">
                                <view class="hero-card__tag">{{ $t('top10.heroTag') }}</view>
                                <view class="hero-card__title">{{
                                    getLocalizedItem(rankedList[0]).description ||
                                    getLocalizedItem(rankedList[0]).classify_name ||
                                    rankedList[0].id
                                }}</view>
                                <view class="hero-card__meta">
                                    <view class="hero-card__meta-item">
                                        <mdi-icon path="/static/icons/fire.svg" size="14" color="#cbd5e1"></mdi-icon>
                                        <text>{{ formatCount(rankedList[0].views) }}</text>
                                    </view>
                                    <view class="hero-card__meta-item">
                                        <mdi-icon path="/static/icons/download.svg" size="14" color="#cbd5e1"></mdi-icon>
                                        <text>{{ formatCount(rankedList[0].downloads) }}</text>
                                    </view>
                                </view>
                            </view>
                        </view>

                        <view class="hero-grid" v-if="rankedList.length > 1">
                            <view
                                v-for="(item, idx) in rankedList.slice(1, 3)"
                                :key="`${activeMetric}-${item.id}`"
                                class="hero-card hero-card--secondary"
                                :class="idx === 0 ? 'hero-card--second' : 'hero-card--third'"
                                :style="{ animationDelay: `${0.42 + idx * 0.20}s` }"
                                @click="goPreview(item.id)"
                            >
                                <image
                                    class="hero-card__image"
                                    :src="item.mediumPicurl || item.smallPicurl || item.picurl"
                                    mode="aspectFill"
                                ></image>
                                <view class="hero-card__overlay hero-card__overlay--soft"></view>
                                <view class="hero-card__rank" :class="idx === 0 ? 'hero-card__rank--second' : 'hero-card__rank--third'">{{
                                    idx + 2
                                }}</view>
                                <view class="hero-card__content hero-card__content--compact">
                                    <view class="hero-card__title hero-card__title--compact">
                                        {{
                                            getLocalizedItem(item).description ||
                                            getLocalizedItem(item).classify_name ||
                                            item.id
                                        }}
                                    </view>
                                    <view class="hero-card__sub">{{ formatMetric(item) }}</view>
                                </view>
                            </view>
                        </view>
                    </view>

                    <view class="rank-section" v-if="rankedList.length > 3">
                        <view class="rank-section__title">
                            {{ $t('top10.listTitle') }}
                            <view class="rank-section__line"></view>
                        </view>

                        <view class="rank-list">
                            <view
                                v-for="(item, idx) in rankedList.slice(3)"
                                :key="`${activeMetric}-${item.id}`"
                                class="rank-item"
                                :style="{ animationDelay: `${0.78 + idx * 0.14}s` }"
                                @click="goPreview(item.id)"
                            >
                                <view class="rank-item__media">
                                    <image
                                        class="rank-item__thumb"
                                        :src="item.smallPicurl || item.picurl"
                                        mode="aspectFill"
                                    ></image>
                                    <view class="rank-item__index">{{ idx + 4 }}</view>
                                </view>
                                <view class="rank-item__body">
                                    <view class="rank-item__title">{{
                                        getLocalizedItem(item).description || getLocalizedItem(item).classify_name || item.id
                                    }}</view>
                                    <view class="rank-item__meta">
                                        <text class="rank-item__category">{{
                                            getLocalizedItem(item).classify_name || $t('top10.wallpaper')
                                        }}</text>
                                        <text class="rank-item__metric">{{ formatMetric(item) }}</text>
                                    </view>
                                </view>
                                <view class="rank-item__action">
                                    <uni-icons type="right" size="16" color="#9fb4d1"></uni-icons>
                                </view>
                            </view>
                        </view>
                    </view>
                </template>

                <view v-else class="top10-empty">
                    <view class="top10-empty__title">{{ $t('top10.empty') }}</view>
                    <view class="top10-empty__desc">{{ $t('top10.emptyDesc') }}</view>
                </view>
            </view>

        <custom-ad-banner @height-change="onAdHeightChange"></custom-ad-banner>

        <!-- 底部毛玻璃悬浮灵动岛 (指标切换 + 条件回顶) -->
        <view class="floating-dock" :style="{ bottom: dockBottomStyle }">
            <view class="floating-capsule">
                <!-- 指标切换两按钮 -->
                <view class="floating-capsule__tabs">
                    <view
                        class="floating-capsule__tab"
                        :class="{ 'is-active': activeMetric === 'views' }"
                        @click="switchMetric('views')"
                    >
                        <mdi-icon
                            path="/static/icons/fire.svg"
                            size="14"
                            :color="activeMetric === 'views' ? '#ffffff' : (settingsStore.isDark ? '#94a3b8' : '#64748b')"
                        ></mdi-icon>
                        <text class="floating-capsule__label">{{ $t('top10.tabs.views') }}</text>
                    </view>
                    <view
                        class="floating-capsule__tab"
                        :class="{ 'is-active': activeMetric === 'downloads' }"
                        @click="switchMetric('downloads')"
                    >
                        <mdi-icon
                            path="/static/icons/download.svg"
                            size="14"
                            :color="activeMetric === 'downloads' ? '#ffffff' : (settingsStore.isDark ? '#94a3b8' : '#64748b')"
                        ></mdi-icon>
                        <text class="floating-capsule__label">{{ $t('top10.tabs.downloads') }}</text>
                    </view>
                </view>

                <!-- 回到顶部动态展开区 (下滑时优雅淡入展开) -->
                <view
                    class="floating-capsule__action"
                    :class="{ 'is-visible': showScrollTop }"
                    @click="scrollToTop"
                >
                    <view class="floating-capsule__divider"></view>
                    <view class="floating-capsule__btn-top">
                        <uni-icons
                            type="arrow-up"
                            size="16"
                            :color="settingsStore.isDark ? '#cbd5e1' : '#334155'"
                        ></uni-icons>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { onLoad, onShow, onPageScroll, onPullDownRefresh } from '@dcloudio/uni-app';
import { apiGetTopWall } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { getStatusBarHeight } from '@/utils/layout.js';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { useAppStore } from '@/stores/app.js';

const statusBarHeight = ref(getStatusBarHeight() || 0);
const isScrolled = ref(false);
const adHeight = ref(0);
const onAdHeightChange = (height) => {
    adHeight.value = Math.max(0, Number(height) || 0);
};

const top10WrapPaddingTop = computed(() => `${statusBarHeight.value + 10}px`);
const top10WrapPaddingBottom = computed(() => `calc(${adHeight.value}px + 180rpx + env(safe-area-inset-bottom))`);
const dockBottomStyle = computed(() => `calc(${adHeight.value}px + max(20px, env(safe-area-inset-bottom))`);

const { t, locale } = useI18n();
const settingsStore = useSettingsStore();
const isEn = computed(() => locale.value === 'en');

const getLocalizedItem = (item) => {
    if (!item) return item;
    return {
        ...item,
        description: isEn.value && item.description_en ? item.description_en : item.description,
        classify_name: isEn.value && item.classify_name_en ? item.classify_name_en : item.classify_name,
    };
};

const showScrollTop = ref(false);
const currentScrollTop = ref(0);

onPageScroll((e) => {
    const top = Number(e?.scrollTop || 0);
    isScrolled.value = top > 8;
    currentScrollTop.value = top;
    const windowHeight = uni.getWindowInfo().windowHeight || 0;
    const nextVisible = top > windowHeight / 2;
    if (showScrollTop.value !== nextVisible) {
        showScrollTop.value = nextVisible;
    }
});

const scrollToTop = () => {
    showScrollTop.value = false;
    currentScrollTop.value = 0;
    uni.pageScrollTo({
        scrollTop: 0,
        duration: 350,
    });
};

const activeMetric = ref('views');
const loading = ref(false);
const rankedList = ref([]);

const cache = {
    views: null,
    downloads: null,
};

const metricBadge = computed(() => (activeMetric.value === 'views' ? t('top10.badgeViews') : t('top10.badgeDownloads')));
const metricDescription = computed(() => (activeMetric.value === 'views' ? t('top10.descViews') : t('top10.descDownloads')));

const getTopList = async () => {
    const metric = activeMetric.value;

    if (cache[metric]) {
        rankedList.value = cache[metric];
        return;
    }

    loading.value = true;
    try {
        const res = await apiGetTopWall({
            type: metric === 'views' ? 'views' : 'downloads',
            n: 20,
        });
        const list = (res.data || [])
            .map((item) => handlePicUrl(item))
            .sort((a, b) => {
                const aValue = Number(metric === 'views' ? a.views : a.downloads) || 0;
                const bValue = Number(metric === 'views' ? b.views : b.downloads) || 0;
                return bValue - aValue;
            })
            .slice(0, 20);

        cache[metric] = list;
        rankedList.value = list;
    } catch (error) {
        rankedList.value = [];
    } finally {
        loading.value = false;
    }
};

const switchMetric = async (metric) => {
    if (activeMetric.value === metric) return;
    activeMetric.value = metric;
    uni.pageScrollTo({
        scrollTop: 0,
        duration: 250,
    });
    await getTopList();
};

const formatCount = (value) => {
    const num = Number(value) || 0;

    if (typeof Intl !== 'undefined' && Intl?.NumberFormat) {
        return new Intl.NumberFormat(locale.value === 'zh-Hans' ? 'zh-CN' : 'en-US', {
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(num);
    }

    const isZh = locale.value === 'zh-Hans';
    if (isZh) {
        if (num >= 100000000) return `${(num / 100000000).toFixed(num >= 1000000000 ? 0 : 1).replace(/\.0$/, '')}亿`;
        if (num >= 10000) return `${(num / 10000).toFixed(num >= 100000 ? 0 : 1).replace(/\.0$/, '')}万`;
        return `${num}`;
    }

    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return `${num}`;
};

const formatMetric = (item) => {
    const count = activeMetric.value === 'views' ? item.views : item.downloads;
    return `${formatCount(count)} ${activeMetric.value === 'views' ? t('top10.metricViews') : t('top10.metricDownloads')}`;
};

const goPreview = (id) => {
    const appStore = useAppStore();
    appStore.wallList = rankedList.value;
    uni.navigateTo({
        url: `/pages/app/preview?id=${id}`,
    });
};

const goBack = () => {
    uni.navigateBack({
        fail: () => {
            uni.reLaunch({ url: '/pages/app/index' });
        },
    });
};

onPullDownRefresh(async () => {
    cache.views = null;
    cache.downloads = null;
    await getTopList();
    uni.stopPullDownRefresh();
});

onMounted(() => {
    if (!rankedList.value.length) {
        getTopList();
    }
});

onShow(() => {
    const windowHeight = uni.getWindowInfo().windowHeight || 0;
    if (currentScrollTop.value > windowHeight / 2) {
        showScrollTop.value = true;
    }
});
</script>

<style lang="scss" scoped>
.top10-page {
    min-height: 100vh;
    background: var(--page-background);
}

.top10-page.is-embedded {
    min-height: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.top10-status {
    width: 100%;
}

.top10-wrap {
    max-width: 860rpx;
    margin: 0 auto;
    padding: 20rpx;
}

// ── 顶部独立返回栏 (对齐 timeline / subjects) ──
.topbar {
    height: 80rpx;
    display: flex;
    align-items: center;
    margin-bottom: 12rpx;
}

.topbar__back {
    width: 74rpx;
    height: 74rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);

    .theme-light & {
        background: rgba(255, 255, 255, 0.82);
        border: 1rpx solid rgba(255, 255, 255, 0.7);
        box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.06);
        backdrop-filter: blur(20rpx);
        -webkit-backdrop-filter: blur(20rpx);

        &:active {
            background: #f1f5f9;
        }
    }

    .theme-dark & {
        background: rgba(255, 255, 255, 0.12);
        border: none;
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.25);
        backdrop-filter: blur(20rpx);
        -webkit-backdrop-filter: blur(20rpx);

        &:active {
            background: rgba(255, 255, 255, 0.22);
        }
    }

    &:active {
        transform: scale(0.92);
        opacity: 0.85;
    }
}

/* ── 底部毛玻璃悬浮灵动岛 ── */
.floating-dock {
    position: fixed;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 99;
    pointer-events: none;
    transition: bottom 0.28s ease;
}

.floating-capsule {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    padding: 8rpx 10rpx;
    border-radius: 999rpx;
    background: rgba(22, 32, 44, 0.85);
    border: 1rpx solid rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(24rpx);
    -webkit-backdrop-filter: blur(24rpx);
    box-shadow:
        0 16rpx 40rpx rgba(0, 0, 0, 0.38),
        0 2rpx 8rpx rgba(0, 0, 0, 0.16),
        inset 0 1rpx 0 rgba(255, 255, 255, 0.1);
    transition: all 0.32s cubic-bezier(0.16, 1, 0.3, 1);

    .theme-light & {
        background: rgba(255, 255, 255, 0.88);
        border: 1rpx solid rgba(0, 0, 0, 0.08);
        box-shadow:
            0 12rpx 36rpx rgba(15, 23, 42, 0.12),
            0 2rpx 6rpx rgba(15, 23, 42, 0.04),
            inset 0 1rpx 0 rgba(255, 255, 255, 0.9);
    }

    .theme-dark & {
        border: none;
    }
}

.floating-capsule__tabs {
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.floating-capsule__tab {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
    height: 68rpx;
    padding: 0 28rpx;
    border-radius: 999rpx;
    color: #94a3b8;
    font-size: 24rpx;
    font-weight: 700;
    transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);

    &:active {
        transform: scale(0.96);
    }

    .theme-light & {
        color: #64748b;
    }

    &.is-active {
        color: #ffffff;
        background: linear-gradient(135deg, #2b8cee 0%, #1a6fd8 100%);
        box-shadow: 0 6rpx 20rpx rgba(43, 140, 238, 0.35);

        .theme-light & {
            color: #ffffff;
            background: linear-gradient(135deg, #2b8cee 0%, #1f6fd1 100%);
            box-shadow: 0 6rpx 18rpx rgba(43, 140, 238, 0.3);
        }
    }
}

.floating-capsule__label {
    line-height: 1;
}

/* 动态回顶按钮部分 */
.floating-capsule__action {
    display: flex;
    align-items: center;
    max-width: 0;
    opacity: 0;
    overflow: hidden;
    transform: scale(0.8) translateX(-12rpx);
    pointer-events: none;
    transition:
        max-width 0.36s cubic-bezier(0.16, 1, 0.3, 1),
        opacity 0.28s ease,
        transform 0.36s cubic-bezier(0.16, 1, 0.3, 1);

    &.is-visible {
        max-width: 100rpx;
        opacity: 1;
        transform: scale(1) translateX(0);
        pointer-events: auto;
    }
}

.floating-capsule__divider {
    width: 2rpx;
    height: 32rpx;
    background: rgba(148, 163, 184, 0.22);
    margin: 0 10rpx 0 6rpx;

    .theme-light & {
        background: rgba(0, 0, 0, 0.08);
    }
}

.floating-capsule__btn-top {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.06);
    transition: all 0.2s ease;

    &:active {
        transform: scale(0.9);
        background: rgba(255, 255, 255, 0.15);
    }

    .theme-light & {
        background: rgba(0, 0, 0, 0.04);

        &:active {
            background: rgba(0, 0, 0, 0.08);
        }
    }
}

// ── 杂志感大标题区 (Editorial Hero Header) ──
.hero-header {
    padding: 8rpx 4rpx 36rpx;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 14rpx;
    animation: heroReveal 1.06s cubic-bezier(0.16, 1, 0.3, 1) both;

    &__badge {
        display: inline-flex;
        align-items: center;
        gap: 8rpx;
        padding: 8rpx 22rpx;
        border-radius: 999rpx;
        font-size: 20rpx;
        font-weight: 800;
        letter-spacing: 1.5rpx;
        text-transform: uppercase;
        animation: badgeDropIn 0.92s cubic-bezier(0.34, 1.56, 0.64, 1) both;

        .badge-icon {
            font-size: 20rpx;
            line-height: 1;
        }

        .badge-text {
            line-height: 1;
        }

        .theme-light & {
            background: rgba(37, 99, 235, 0.08);
            border: 1rpx solid rgba(37, 99, 235, 0.20);
            color: #2563eb;
        }

        .theme-dark & {
            background: rgba(43, 140, 238, 0.16);
            border: none;
            color: #7dd3fc;
        }
    }

    &__title {
        font-size: 56rpx;
        font-weight: 900;
        line-height: 1.18;
        letter-spacing: -1.2rpx;
        color: var(--text-primary);

        .theme-dark & {
            color: #f8fafc;
            text-shadow: 0 4rpx 24rpx rgba(59, 130, 246, 0.25);
        }

        .theme-light & {
            color: #0f172a;
        }
    }

    &__desc {
        font-size: 26rpx;
        line-height: 1.65;
        color: var(--text-secondary);
        max-width: 640rpx;
        margin-top: 2rpx;
        animation: introDescFadeIn 0.92s cubic-bezier(0.16, 1, 0.3, 1) 0.16s both;
    }
}

@keyframes heroReveal {
    0% {
        opacity: 0;
        transform: translate3d(0, 28rpx, 0);
    }
    100% {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
}

.hero-section {
    margin-bottom: 40rpx;
}

.hero-card {
    position: relative;
    overflow: hidden;
    border-radius: 32rpx;
    background: #182431;
    box-shadow: 0 24rpx 56rpx rgba(0, 0, 0, 0.28);
    transition:
        transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.24s ease;
    cursor: pointer;

    .theme-light & {
        background: #f8fafc;
        box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.05);
    }
}

// ── 冠军第 1 名入场（领奖台中心聚光升起） ──
@keyframes heroFirstCardAscend {
    0% {
        opacity: 0;
        transform: translate3d(0, 56rpx, 0) scale(0.92);
        filter: brightness(0.85);
    }
    60% {
        opacity: 0.95;
    }
    100% {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
        filter: brightness(1);
    }
}

// ── 亚军第 2 名从左下方斜向拱卫升起 ──
@keyframes heroSecondFlank {
    0% {
        opacity: 0;
        transform: translate3d(-60rpx, 48rpx, 0) scale(0.93);
    }
    100% {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
    }
}

// ── 季军第 3 名从右下方斜向拱卫升起 ──
@keyframes heroThirdFlank {
    0% {
        opacity: 0;
        transform: translate3d(60rpx, 48rpx, 0) scale(0.93);
    }
    100% {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
    }
}

// ── 冠军金牌徽章 3D 旋转弹簧落座 ──
@keyframes crownMedalDrop {
    0% {
        opacity: 0;
        transform: scale(0) rotate(-20deg);
    }
    65% {
        opacity: 1;
        transform: scale(1.18) rotate(4deg);
    }
    100% {
        opacity: 1;
        transform: scale(1) rotate(0deg);
    }
}

.hero-card--first {
    aspect-ratio: 16 / 10;
    margin-bottom: 30rpx;
    animation: heroFirstCardAscend 1.08s cubic-bezier(0.16, 1, 0.3, 1) both;

    &:active {
        transform: scale(0.98);
        box-shadow: 0 12rpx 28rpx rgba(0, 0, 0, 0.32);
    }
}

.hero-grid {
    margin-top: 18rpx;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 30rpx;
}

.hero-card--secondary {
    aspect-ratio: 3 / 4;

    &:active {
        transform: scale(0.975);
    }
}

.hero-card--second {
    animation: heroSecondFlank 1.02s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.hero-card--third {
    animation: heroThirdFlank 1.02s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.hero-card__image {
    width: 100%;
    height: 100%;
    transition: transform 0.32s ease;
}

.hero-card__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(6, 12, 18, 0) 0%, rgba(6, 12, 18, 0.12) 42%, rgba(6, 12, 18, 0.82) 100%);

    .theme-light & {
        background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.08) 42%, rgba(0, 0, 0, 0.55) 100%);
    }
}

.hero-card__overlay--soft {
    background: linear-gradient(180deg, rgba(6, 12, 18, 0) 0%, rgba(6, 12, 18, 0.15) 38%, rgba(6, 12, 18, 0.72) 100%);

    .theme-light & {
        background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.1) 38%, rgba(0, 0, 0, 0.5) 100%);
    }
}

.hero-card__rank {
    position: absolute;
    top: 20rpx;
    left: 20rpx;
    width: 64rpx;
    height: 64rpx;
    border-radius: 999rpx;
    background: rgba(30, 41, 59, 0.92);
    color: #fff;
    font-size: 28rpx;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.24);
}

.hero-card__rank--first {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 55%, #d97706 100%);
    color: #ffffff;
    font-weight: 900;
    border: 2rpx solid rgba(255, 255, 255, 0.45);
    box-shadow:
        0 8rpx 24rpx rgba(245, 158, 11, 0.45),
        0 2rpx 6rpx rgba(0, 0, 0, 0.25);
    text-shadow: 0 2rpx 4rpx rgba(120, 53, 15, 0.5);
    animation: crownMedalDrop 0.92s cubic-bezier(0.34, 1.56, 0.64, 1) 0.40s both;

    .theme-dark & {
        border: none;
    }
}

.hero-card__rank--second,
.hero-card__rank--third {
    background: rgba(13, 19, 30, 0.9);
    border: 1rpx solid rgba(191, 219, 254, 0.2);
    color: #f8fafc;
    box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.28);
    backdrop-filter: blur(8px);

    .theme-dark & {
        border: none;
    }
}

.hero-card__content {
    position: absolute;
    left: 24rpx;
    right: 24rpx;
    bottom: 24rpx;
    z-index: 1;
}

.hero-card__content--compact {
    left: 18rpx;
    right: 18rpx;
    bottom: 18rpx;
}

.hero-card__tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 34rpx;
    padding: 0 12rpx;
    border-radius: 999rpx;
    background: rgba(43, 140, 238, 0.188);
    border: 1rpx solid rgba(125, 211, 252, 0.22);
    color: #7dd3fc;
    font-size: 17rpx;
    font-weight: 700;
    margin-bottom: 10rpx;

    .theme-dark & {
        border: none;
    }
}

.hero-card__title {
    font-size: 32rpx;
    line-height: 1.28;
    font-weight: 700;
    color: rgba(248, 250, 252, 0.94);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.35);
}

.hero-card__title--compact {
    font-size: 24rpx;
    line-height: 1.32;
    font-weight: 600;
    color: rgba(248, 250, 252, 0.92);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.4);
}

.hero-card__meta {
    margin-top: 12rpx;
    display: flex;
    align-items: center;
    gap: 20rpx;
}

.hero-card__meta-item,
.hero-card__sub {
    display: flex;
    align-items: center;
    gap: 8rpx;
    color: rgba(203, 213, 225, 0.78);
    font-size: 20rpx;
}

.hero-card:active {
    transform: scale(1.03);
    box-shadow:
        0 18rpx 36rpx rgba(0, 0, 0, 0.26),
        0 32rpx 64rpx rgba(0, 0, 0, 0.22);
}

.hero-card:active .hero-card__image {
    transform: scale(1.08);
}

.rank-section__title {
    margin-bottom: 18rpx;
    display: flex;
    align-items: center;
    gap: 14rpx;
    color: #94a3b8;
    font-size: 18rpx;
    font-weight: 800;
    letter-spacing: 4rpx;
    text-transform: uppercase;

    .theme-light & {
        color: var(--text-tertiary);
    }
}

.rank-section__line {
    flex: 1;
    height: 1rpx;
    background: rgba(51, 65, 85, 0.8);

    .theme-light & {
        background: rgba(0, 0, 0, 0.08);
    }
}

.rank-list {
    display: flex;
    flex-direction: column;
    gap: 30rpx;
}

// ── 竞争者列表瀑布微透视阶梯翻折展开 ──
@keyframes rankItemCascadeFold {
    0% {
        opacity: 0;
        transform: perspective(600px) rotateX(10deg) translate3d(0, 48rpx, 0);
    }
    100% {
        opacity: 1;
        transform: perspective(600px) rotateX(0deg) translate3d(0, 0, 0);
    }
}

.rank-item {
    height: 280rpx;
    border-radius: 28rpx;
    background: rgba(24, 36, 49, 0.92);
    display: flex;
    align-items: stretch;
    gap: 0;
    overflow: hidden;
    box-shadow:
        0 10rpx 24rpx rgba(0, 0, 0, 0.2),
        0 24rpx 48rpx rgba(0, 0, 0, 0.16);
    transition:
        transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.22s ease,
        border-color 0.22s ease;
    animation: rankItemCascadeFold 1.02s cubic-bezier(0.16, 1, 0.3, 1) both;
    cursor: pointer;

    &:active {
        transform: scale(0.982);
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.22);

        .rank-item__action {
            transform: translateX(6rpx);
            background: rgba(43, 140, 238, 0.2);
        }
    }

    .theme-light & {
        background: #f8fafc;
        box-shadow: 0 6rpx 18rpx rgba(15, 23, 42, 0.05);
    }
}

.rank-item__media {
    position: relative;
    width: 214rpx;
    height: 280rpx;
    flex-shrink: 0;
}

.rank-item__thumb {
    width: 214rpx;
    height: 280rpx;
    display: block;
}

.rank-item__index {
    position: absolute;
    top: 14rpx;
    left: 14rpx;
    width: 56rpx;
    height: 56rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(13, 19, 30, 0.9);
    border: 1rpx solid rgba(191, 219, 254, 0.18);
    color: #f8fafc;
    font-size: 24rpx;
    font-weight: 800;
    box-shadow: 0 12rpx 24rpx rgba(0, 0, 0, 0.24);

    .theme-dark & {
        border: none;
    }
}

.rank-item__body {
    flex: 1;
    min-width: 0;
    padding: 22rpx 18rpx;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.rank-item__title {
    color: rgba(220, 228, 238, 0.92);
    font-size: 26rpx;
    font-weight: 600;
    line-height: 1.36;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;

    .theme-light & {
        color: var(--text-primary);
    }
}

.rank-item__meta {
    margin-top: 8rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    color: #94a3b8;
    font-size: 22rpx;

    .theme-light & {
        color: var(--text-tertiary);
    }
}

.rank-item__category {
    color: #9fb4d1;
    min-width: 0;
    flex: 1;

    .theme-light & {
        color: var(--text-secondary);
    }
}

.rank-item__metric {
    flex-shrink: 0;
}

.rank-item__action {
    width: 48rpx;
    height: 48rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(159, 180, 209, 0.08);
    align-self: center;
    margin-right: 10rpx;
    transition:
        transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
        background 0.2s ease;

    .theme-light & {
        background: rgba(0, 0, 0, 0.04);
    }
}

.rank-item__thumb {
    transition: transform 0.32s ease;
}

@media (hover: hover) and (pointer: fine) {
    .hero-card:hover {
        transform: scale(1.012);
        box-shadow:
            0 18rpx 36rpx rgba(0, 0, 0, 0.26),
            0 32rpx 64rpx rgba(0, 0, 0, 0.22);
    }

    .hero-card:hover .hero-card__image {
        transform: scale(1.08);
    }

    .rank-item:hover {
        transform: scale(1.03);
        box-shadow:
            0 18rpx 36rpx rgba(0, 0, 0, 0.26),
            0 32rpx 64rpx rgba(0, 0, 0, 0.22);
        border-color: rgba(125, 211, 252, 0.28);
    }

    .rank-item:hover .rank-item__thumb {
        transform: scale(1.08);
    }
}

.top10-empty {
    padding: 140rpx 30rpx;
    text-align: center;
}

.top10-empty__title {
    font-size: 34rpx;
    color: #f8fafc;
    font-weight: 700;

    .theme-light & {
        color: var(--text-primary);
    }
}

.top10-empty__desc {
    margin-top: 14rpx;
    font-size: 24rpx;
    line-height: 1.8;
    color: #94a3b8;

    .theme-light & {
        color: var(--text-secondary);
    }
}

// ── 骨架屏 ──
@mixin shimmer {
    background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.06) 25%,
        rgba(255, 255, 255, 0.12) 50%,
        rgba(255, 255, 255, 0.06) 75%
    );
    background-size: 200% 100%;
    animation: top10-shimmer 1.6s infinite linear;

    .theme-light & {
        background: linear-gradient(90deg, rgba(0, 0, 0, 0.06) 25%, rgba(0, 0, 0, 0.1) 50%, rgba(0, 0, 0, 0.06) 75%);
        background-size: 200% 100%;
        animation: top10-shimmer 1.6s infinite linear;
    }
}

.skeleton-wrap {
    padding: 0;
}

.skeleton-hero-first {
    width: 100%;
    aspect-ratio: 16 / 10;
    border-radius: 32rpx;
    margin-bottom: 30rpx;
    @include shimmer;
}

.skeleton-hero-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30rpx;
    margin-bottom: 40rpx;
}

.skeleton-hero-secondary {
    aspect-ratio: 3 / 4;
    border-radius: 32rpx;
    @include shimmer;
}

.skeleton-rank-list {
    display: flex;
    flex-direction: column;
    gap: 30rpx;
}

.skeleton-rank-item {
    height: 280rpx;
    border-radius: 28rpx;
    overflow: hidden;
    display: flex;
    gap: 0;
    @include shimmer;
}

.skeleton-rank-thumb {
    width: 214rpx;
    height: 100%;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.04);

    .theme-light & {
        background: rgba(0, 0, 0, 0.04);
    }
}

.skeleton-rank-body {
    flex: 1;
    padding: 28rpx 22rpx;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 16rpx;
}

.skeleton-rank-title {
    height: 28rpx;
    border-radius: 8rpx;
    width: 85%;
    background: rgba(255, 255, 255, 0.08);

    .theme-light & {
        background: rgba(0, 0, 0, 0.07);
    }

    &--short {
        width: 55%;
    }
}

.skeleton-rank-meta {
    height: 22rpx;
    width: 40%;
    border-radius: 6rpx;
    background: rgba(255, 255, 255, 0.05);

    .theme-light & {
        background: rgba(0, 0, 0, 0.05);
    }
}

@keyframes top10-shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}
</style>
