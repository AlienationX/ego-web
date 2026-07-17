<template>
    <view
        class="homeLayout"
        :class="['homeLayout--' + activeHomeTab, settingsStore.isDark ? 'theme-dark' : 'theme-light']"
        :style="{
            '--mask-color': pageBackgroundVar,
            backgroundColor: pageBackgroundVar,
            height: activeHomeTab !== 'home' ? '100vh' : 'auto',
            overflow: activeHomeTab !== 'home' ? 'hidden' : 'visible',
        }"
    >
        <!-- #ifndef WEB -->
        <view class="home-statusbar" :style="{ height: statusBarHeight + 'px', backgroundColor: pageBackgroundVar }"> </view>
        <!-- #endif -->

        <view
            class="home-titlebar"
            :class="{ 'is-hidden': !isTitleBarVisible }"
            :style="{
                paddingTop: statusBarHeight + 'px',
                height: navBarHeight + 'px',
                paddingRight: titlebarPaddingRight,
                backgroundColor: pageBackgroundVar,
            }"
        >
            <view class="home-titlebar__inner" :style="{ height: titleBarHeight + 'px' }">
                <view class="home-tabs-wrapper" :class="{ 'is-dark': settingsStore.isDark }">
                    <view class="home-tabs-scroll-area">
                        <scroll-view scroll-x class="home-tabs" show-scrollbar="false">
                            <view class="home-tabs__inner">
                                <view
                                    v-for="tab in homeTabList"
                                    :key="tab.key"
                                    class="home-tab"
                                    :class="{ 'is-active': activeHomeTab === tab.key }"
                                    @click="activeHomeTab = tab.key"
                                >
                                    {{ tab.label }}
                                </view>
                            </view>
                        </scroll-view>
                        <view class="home-tabs-mask"></view>
                    </view>

                    <!-- #ifdef MP-WEIXIN -->
                    <view class="home-search home-search--icon" @click="goSearch">
                        <uni-icons type="search" size="17" :color="searchIconColor"></uni-icons>
                    </view>
                    <!-- #endif -->

                    <!-- #ifndef MP-WEIXIN -->
                    <view class="home-search" @click="goSearch">
                        <uni-icons type="search" size="17" :color="searchIconColor"></uni-icons>
                        <text class="home-search__text">{{ $t('common.search') }}</text>
                    </view>
                    <!-- #endif -->
                </view>
            </view>
        </view>

        <!-- home tab：与其他 tab 一致，用 scroll-view 自管滚动，v-show 切换位置天然保留 -->
        <view v-show="activeHomeTab === 'home'" class="home-channel home-channel--home" :style="channelBottomStyle">
            <home-tab :nav-bar-height="navBarHeight" @scroll="handleEmbeddedScroll"></home-tab>
        </view>

        <!-- 其他 tab：首次激活后懒加载，之后用 v-show 保持状态，避免反复销毁重建 -->
        <view
            v-if="recommendLoaded"
            v-show="activeHomeTab === 'recommend'"
            class="home-channel home-channel--recommend"
            :style="channelBottomStyle"
        >
            <modern-pics-view
                :show-header="false"
                :tabs="[{ label: t('index.tabs.recommend') }]"
                api-type="recommend"
                layoutMode="waterfall"
                :show-card-meta="true"
                :header-height="navBarHeight"
                embedded
                @scroll="handleEmbeddedScroll"
            ></modern-pics-view>
        </view>

        <view
            v-if="latestLoaded"
            v-show="activeHomeTab === 'latest'"
            class="home-channel home-channel--latest"
            :style="channelBottomStyle"
        >
            <timeline-tab embedded :nav-bar-height="navBarHeight" @scroll="handleEmbeddedScroll"></timeline-tab>
        </view>

        <view
            v-if="hotLoaded"
            v-show="activeHomeTab === 'hot'"
            class="home-channel home-channel--hot"
            :style="channelBottomStyle"
        >
            <top-tab embedded :nav-bar-height="navBarHeight" @scroll="handleEmbeddedScroll"></top-tab>
        </view>

        <!-- 吸底全局广告 (在 tabBar 之上) -->
        <custom-ad-banner @height-change="onAdHeightChange" v-if="IS_INTERNATIONAL"></custom-ad-banner>
    </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { onLoad, onShow, onUnload, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { updateTabBarText } from '@/utils/i18n.js';
import { IS_INTERNATIONAL } from '@/utils/system.js';
import { getStatusBarHeight, getTitleBarHeight, getNavBarHeight } from '@/utils/layout.js';

const settingsStore = useSettingsStore();
const { t } = useI18n();

const homeTabList = computed(() => [
    {
        key: 'home',
        label: t('index.tabs.home'),
    },
    {
        key: 'recommend',
        label: t('index.tabs.recommend'),
    },
    {
        key: 'latest',
        label: t('index.tabs.latest'),
    },
    {
        key: 'hot',
        label: t('index.tabs.hot'),
    },
]);

const searchIconColor = computed(() => (settingsStore.isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b'));

const statusBarHeight = ref(getStatusBarHeight() || 0);
const navBarHeight = ref(getNavBarHeight() || 0);
const titleBarHeight = ref(getTitleBarHeight() || 0);
const isTitleBarVisible = ref(true);
let lastScrollTop = 0;

const activeHomeTab = ref('home');

/** 与 theme-variables.scss 的 --page-background 一致，依赖根节点 theme-light/theme-dark */
const pageBackgroundVar = 'var(--page-background)';

// ── 懒加载标志，首次切入对应 tab 才渲染，之后用 v-show 保持状态 ──
const recommendLoaded = ref(false);
const latestLoaded = ref(false);
const hotLoaded = ref(false);

watch(activeHomeTab, (tab) => {
    if (tab === 'recommend') recommendLoaded.value = true;
    if (tab === 'latest') latestLoaded.value = true;
    if (tab === 'hot') hotLoaded.value = true;
});

// ── 优化：titlebarPaddingRight 只在页面初始化时计算一次，无需 computed ──
const titlebarPaddingRight = (() => {
    // #ifdef MP-WEIXIN
    const menuButtonInfo = uni.getMenuButtonBoundingClientRect ? uni.getMenuButtonBoundingClientRect() : null;
    if (menuButtonInfo) {
        return uni.getWindowInfo().windowWidth - menuButtonInfo.left + 10 + 'px';
    }
    // #endif
    return '20rpx';
})();

const SCROLL_DEAD_ZONE = 5;

// ── 优化：RAF 节流，避免 onPageScroll 高频触发时重复计算 ──
let rafPending = false;
const updateTitleBarVisibleByScroll = (scrollTop) => {
    if (rafPending) return;
    rafPending = true;
    setTimeout(() => {
        rafPending = false;
        const currentScrollTop = Math.max(0, Number(scrollTop) || 0);
        const scrollDelta = currentScrollTop - lastScrollTop;
        if (Math.abs(scrollDelta) > SCROLL_DEAD_ZONE) {
            if (currentScrollTop > titleBarHeight.value) {
                isTitleBarVisible.value = scrollDelta <= 0;
            } else {
                isTitleBarVisible.value = true;
            }
            lastScrollTop = currentScrollTop;
        }
    }, 0);
};

const handleEmbeddedScroll = (e) => {
    updateTitleBarVisibleByScroll(e.scrollTop);
};

// ── 广告高度，控制底部留白 ──
const adHeight = ref(0);
const onAdHeightChange = (height) => {
    adHeight.value = Math.max(0, Number(height) || 0);
};
const channelBottomStyle = computed(() => (adHeight.value > 0 ? { paddingBottom: `${adHeight.value}px` } : {}));

// ── 优化：在 onLoad 中注册事件，避免模块顶层重复注册；传入函数引用精确移除 ──
onShow(() => {
    // #ifdef MP || APP-HARMONY
    updateTabBarText(t);
    // #endif
});

onLoad(() => {
    uni.$on('app-scroll', updateTitleBarVisibleByScroll);
});

const goSearch = () => {
    uni.navigateTo({
        url: '/pages/app/search',
    });
};

// ── 优化：$off 传入函数引用，只移除本页监听，不影响其他页面的同名监听 ──
onUnload(() => {
    uni.$off('app-scroll', updateTitleBarVisibleByScroll);
});

//分享给好友
onShareAppMessage(() => {
    return {
        title: '本我壁纸 - 探索壁纸，亦探索自我',
        path: '/pages/app/index',
    };
});

//分享朋友圈
onShareTimeline(() => {
    return {
        title: '本我壁纸 - 探索壁纸，亦探索自我',
    };
});
</script>

<style lang="scss" scoped>
// ── 优化：减少 CSS 选择器嵌套层级，BEM 类名直接作为顶层选择器 ──

.homeLayout {
    min-height: 100vh;
    box-sizing: border-box;
    transition: background-color 0.3s ease;
    background-color: var(--page-background);

    &.theme-dark {
        background-color: var(--page-background);
    }
}

.home-statusbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 51;
    pointer-events: none;
    transition: background-color 0.3s ease;
}

.home-titlebar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 50;
    padding: 0 20rpx;
    box-sizing: border-box;
    background: var(--page-background);
    transition:
        transform 0.3s cubic-bezier(0.25, 1, 0.5, 1),
        background-color 0.3s ease;

    &.is-hidden {
        transform: translateY(-100%);
    }
}

.home-titlebar__inner {
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18rpx;
}

.home-tabs-wrapper {
    flex: 1;
    min-width: 0;
    height: 100%;
    display: flex;
    align-items: center;
}

.home-tabs-scroll-area {
    flex: 1;
    min-width: 0;
    height: 100%;
    position: relative;
}

.home-tabs-mask {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 40rpx;
    background: linear-gradient(to right, transparent, var(--mask-color, var(--page-background)));
    pointer-events: none;
}

.home-tabs {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    height: 100%;
}

.home-tabs__inner {
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: 28rpx;
    padding: 0 24rpx 0 8rpx;
    height: 100%;
}

.home-tab {
    position: relative;
    height: 100%;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: rgba(15, 23, 42, 0.48);
    font-size: 35rpx;
    font-weight: 600;
    letter-spacing: 0;
    transition: all 0.24s ease;

    &.is-active {
        color: #111827;
        font-weight: 800;
    }

    &.is-active::after {
        content: '';
        position: absolute;
        left: 50%;
        bottom: 4rpx;
        width: 32rpx;
        height: 4rpx;
        border-radius: 999rpx;
        background: #111827;
        transform: translateX(-50%);
    }

    &:active {
        opacity: 0.7;
    }
}

// 暗色模式下 tab 颜色覆盖
.is-dark .home-tab {
    color: rgba(255, 255, 255, 0.6);

    &.is-active {
        color: #ffffff;
    }

    &.is-active::after {
        background: #ffffff;
    }
}

.home-search {
    flex-shrink: 0;
    min-width: 170rpx;
    height: 60rpx;
    padding: 0 18rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    background: rgba(255, 255, 255, 0.72);
    border: 1rpx solid rgba(203, 213, 225, 0.56);
    color: #64748b;

    &:active {
        transform: scale(0.97);
        background: rgba(226, 232, 240, 0.82);
    }
}

.home-search--icon {
    min-width: 60rpx;
    width: 60rpx;
    height: 60rpx;
    padding: 0;
    border-radius: 50%;
}

.home-search__text {
    font-size: 23rpx;
    font-weight: 700;
}

// 暗色模式下搜索框
.is-dark .home-search {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.8);

    &:active {
        background: rgba(255, 255, 255, 0.15);
    }
}

// 暗色模式下遮罩渐变
.is-dark .home-tabs-mask {
    background: linear-gradient(to right, transparent, var(--mask-color, var(--page-background)));
}

.home-channel {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    box-sizing: border-box;
}

.home-channel--recommend {
    height: 100vh;
    overflow: hidden;
    background: transparent;
}

.home-channel--home,
.home-channel--latest,
.home-channel--hot {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    background: transparent;
    height: 100vh;
}

.home-channel--latest,
.home-channel--hot {
    color: #eaf0fb;
}

.embedded-hero {
    padding: 22rpx 8rpx 32rpx;
}

.embedded-hero__eyebrow {
    font-size: 20rpx;
    font-weight: 900;
    letter-spacing: 6rpx;
    color: rgba(125, 211, 252, 0.88);
}

.embedded-hero__title {
    margin-top: 16rpx;
    font-size: 74rpx;
    line-height: 1.08;
    font-weight: 900;
    color: #f5f8ff;
    letter-spacing: -2rpx;
    white-space: pre-line;
}

.embedded-hero__desc {
    margin-top: 18rpx;
    font-size: 27rpx;
    line-height: 1.8;
    color: rgba(214, 223, 239, 0.86);
}

.embedded-loading {
    padding: 120rpx 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.embedded-empty {
    min-height: 360rpx;
    padding: 48rpx;
    border-radius: 32rpx;
    background: rgba(18, 28, 41, 0.72);
    border: 1rpx solid rgba(255, 255, 255, 0.05);
    color: rgba(226, 232, 240, 0.92);
    font-size: 28rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 12rpx;
}

.embedded-empty__desc {
    font-size: 23rpx;
    line-height: 1.6;
    color: rgba(148, 163, 184, 0.9);
}

.embedded-load-more {
    padding: 20rpx 0 0;
}

.home-month {
    margin-bottom: 56rpx;
}

.home-month__head {
    margin-bottom: 28rpx;
}

.home-month__ghost {
    font-size: 82rpx;
    line-height: 1;
    font-weight: 900;
    color: rgba(148, 163, 184, 0.42);
    letter-spacing: -2rpx;
}

.home-month__meta {
    margin-top: -20rpx;
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.home-month__year {
    font-size: 38rpx;
    font-weight: 800;
    color: #f5f8ff;
}

.home-month__line {
    flex: 1;
    height: 1rpx;
    background: rgba(115, 130, 154, 0.34);
}

.home-month__tag {
    font-size: 20rpx;
    font-weight: 800;
    letter-spacing: 3rpx;
    color: #619aef;
    text-transform: uppercase;
}

.home-day {
    margin-bottom: 56rpx;
}

.home-day__marker {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 20rpx;
}

.home-day__number {
    font-size: 54rpx;
    line-height: 1;
    font-weight: 900;
    color: #f5f8ff;
}

.home-day__divider {
    width: 4rpx;
    height: 52rpx;
    border-radius: 999rpx;
    background: linear-gradient(180deg, #79a8ff, rgba(121, 168, 255, 0.2));
}

.home-day__label {
    font-size: 20rpx;
    line-height: 1.5;
    font-weight: 700;
    letter-spacing: 2rpx;
    color: rgba(226, 232, 240, 0.88);
    text-transform: uppercase;
}

.home-timeline-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 28rpx;
}

.home-timeline-card {
    position: relative;
    overflow: hidden;
    height: 610rpx;
    border-radius: 28rpx;
    background: #18222f;
    box-shadow:
        0 18rpx 40rpx rgba(0, 0, 0, 0.24),
        inset 0 1rpx 0 rgba(255, 255, 255, 0.06);
}

.home-timeline-card--wide {
    grid-column: 1 / -1;
    height: 430rpx;
}

.home-timeline-card__image {
    width: 100%;
    height: 100%;
}

.home-timeline-card__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(8, 11, 18, 0) 0%, rgba(8, 11, 18, 0) 60%, rgba(8, 11, 18, 0.88) 100%);
}

.home-timeline-card__content {
    position: absolute;
    left: 22rpx;
    right: 22rpx;
    bottom: 22rpx;
    z-index: 1;
}

.home-timeline-card__classify {
    display: inline-flex;
    align-items: center;
    min-height: 34rpx;
    padding: 0 12rpx;
    margin-bottom: 12rpx;
    border-radius: 999rpx;
    background: rgba(97, 154, 239, 0.16);
    border: 1rpx solid rgba(97, 154, 239, 0.2);
    color: #c7dbff;
    font-size: 18rpx;
    font-weight: 800;
}

.home-timeline-card__title {
    font-size: 30rpx;
    line-height: 1.36;
    font-weight: 800;
    color: #f8fafc;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.home-timeline-card__footer {
    margin-top: 14rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: rgba(226, 232, 240, 0.82);
    font-size: 22rpx;
}

.home-timeline-card__score {
    display: flex;
    align-items: center;
    gap: 6rpx;
}

.hot-switch {
    margin: 12rpx auto 24rpx;
    padding: 8rpx;
    width: fit-content;
    display: flex;
    align-items: center;
    gap: 10rpx;
    border-radius: 999rpx;
    background: rgba(17, 25, 34, 0.9);
    border: 1rpx solid rgba(148, 163, 184, 0.14);
}

.hot-switch__item {
    min-width: 220rpx;
    height: 74rpx;
    padding: 0 26rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    font-size: 24rpx;
    font-weight: 700;

    &.is-active {
        color: #fff;
        background: linear-gradient(135deg, #2b8cee, #1f6fd1);
        box-shadow: 0 10rpx 24rpx rgba(43, 140, 238, 0.24);
    }
}

.hot-intro {
    margin-bottom: 28rpx;
}

.hot-intro__badge {
    display: inline-flex;
    height: 40rpx;
    padding: 0 14rpx;
    align-items: center;
    border-radius: 999rpx;
    background: rgba(43, 140, 238, 0.16);
    color: #7dd3fc;
    font-size: 18rpx;
    font-weight: 800;
    letter-spacing: 2rpx;
    margin-bottom: 16rpx;
}

.hot-intro__desc {
    font-size: 24rpx;
    line-height: 1.8;
    color: #94a3b8;
}

.hot-hero-section {
    margin-bottom: 40rpx;
}

.hot-hero-card {
    position: relative;
    overflow: hidden;
    border-radius: 32rpx;
    background: #182431;
    box-shadow: 0 24rpx 56rpx rgba(0, 0, 0, 0.28);
}

.hot-hero-card--first {
    height: 430rpx;
    margin-bottom: 30rpx;
}

.hot-hero-grid {
    margin-top: 18rpx;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 30rpx;
}

.hot-hero-card--secondary {
    height: 440rpx;
}

.hot-hero-card__image {
    width: 100%;
    height: 100%;
}

.hot-hero-card__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(6, 12, 18, 0) 0%, rgba(6, 12, 18, 0) 48%, rgba(6, 12, 18, 0.9) 100%);
}

.hot-hero-card__overlay--soft {
    background: linear-gradient(180deg, rgba(6, 12, 18, 0) 0%, rgba(6, 12, 18, 0) 50%, rgba(6, 12, 18, 0.74) 100%);
}

.hot-hero-card__rank {
    position: absolute;
    top: 22rpx;
    left: 22rpx;
    width: 72rpx;
    height: 72rpx;
    border-radius: 999rpx;
    background: rgba(30, 41, 59, 0.92);
    color: #fff;
    font-size: 30rpx;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 14rpx 30rpx rgba(0, 0, 0, 0.24);
}

.hot-hero-card__rank--first {
    background: linear-gradient(135deg, #2b8cee, #60a5fa);
}

.hot-hero-card__rank--second {
    background: linear-gradient(135deg, #38bdf8, #0ea5e9);
}

.hot-hero-card__content {
    position: absolute;
    left: 28rpx;
    right: 28rpx;
    bottom: 28rpx;
    z-index: 1;
}

.hot-hero-card__content--compact {
    left: 20rpx;
    right: 20rpx;
    bottom: 20rpx;
}

.hot-hero-card__tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 36rpx;
    padding: 0 14rpx;
    border-radius: 999rpx;
    background: rgba(43, 140, 238, 0.18);
    border: 1rpx solid rgba(125, 211, 252, 0.22);
    color: #7dd3fc;
    font-size: 18rpx;
    font-weight: 800;
    margin-bottom: 14rpx;
}

.hot-hero-card__title {
    font-size: 42rpx;
    line-height: 1.2;
    font-weight: 800;
    color: #e2e8f0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.hot-hero-card__title--compact {
    font-size: 28rpx;
    line-height: 1.38;
}

.hot-hero-card__meta {
    margin-top: 16rpx;
    display: flex;
    align-items: center;
    gap: 24rpx;
}

.hot-hero-card__meta-item,
.hot-hero-card__sub {
    display: flex;
    align-items: center;
    gap: 8rpx;
    color: #cbd5e1;
    font-size: 22rpx;
}

.hot-rank-section__title {
    margin-bottom: 18rpx;
    display: flex;
    align-items: center;
    gap: 14rpx;
    color: #94a3b8;
    font-size: 18rpx;
    font-weight: 800;
    letter-spacing: 4rpx;
    text-transform: uppercase;
}

.hot-rank-section__line {
    flex: 1;
    height: 1rpx;
    background: rgba(51, 65, 85, 0.8);
}

.hot-rank-list {
    display: flex;
    flex-direction: column;
    gap: 30rpx;
}

.hot-rank-item {
    height: 280rpx;
    border-radius: 28rpx;
    background: rgba(24, 36, 49, 0.92);
    border: 1rpx solid rgba(51, 65, 85, 0.56);
    display: flex;
    align-items: stretch;
    overflow: hidden;
    box-shadow:
        0 10rpx 24rpx rgba(0, 0, 0, 0.2),
        0 24rpx 48rpx rgba(0, 0, 0, 0.16);
}

.hot-rank-item__media {
    position: relative;
    width: 190rpx;
    flex-shrink: 0;
}

.hot-rank-item__thumb {
    width: 100%;
    height: 100%;
}

.hot-rank-item__index {
    position: absolute;
    left: 16rpx;
    top: 16rpx;
    width: 50rpx;
    height: 50rpx;
    border-radius: 999rpx;
    background: rgba(15, 23, 42, 0.84);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22rpx;
    font-weight: 800;
}

.hot-rank-item__body {
    min-width: 0;
    flex: 1;
    padding: 28rpx 22rpx;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.hot-rank-item__title {
    font-size: 28rpx;
    line-height: 1.45;
    font-weight: 800;
    color: #e2e8f0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.hot-rank-item__meta {
    margin-top: 18rpx;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    color: #94a3b8;
    font-size: 22rpx;
}

.hot-rank-item__metric {
    color: #7dd3fc;
    font-weight: 800;
}

.hot-rank-item__action {
    width: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
