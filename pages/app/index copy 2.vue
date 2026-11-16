<template>
    <view class="home-page" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 顶部渐变毛玻璃状态栏 -->
        <glass-status-bar
            :is-scrolled="isScrolled"
            :theme="settingsStore.isDark ? 'dark' : 'light'"
        ></glass-status-bar>
        <view class="home-content" :style="{ paddingBottom: pagePaddingBottom }">
            <!-- 沉浸式 Hero 头部：头像问候、通知铃铛、灵动气泡、搜索栏、快捷入口胶囊 -->
            <home-hero-header
                :status-bar-height="statusBarHeight"
                @open-notifications="openNotificationSheet"
            />

            <!-- 搜索框下方快捷药丸胶囊入口 (参考截图设计：最热、最新、专题策划) -->
            <home-nav-tiles />

            

        </view>

        <!-- 半屏毛玻璃抽屉通知面板 -->
        <notification-sheet ref="notificationSheetRef"></notification-sheet>

        <!-- 回到顶部悬浮浮标 (超过阈值优雅滑出，自动避让底部 TabBar) -->
        <fab-back-top :show="showScrollTop" :embedded="true" @click="scrollToTop" />

        <!-- 自定义 TabBar 组件 (支持多语言实时切换与 Light/Dark 模式) -->
        <glass-tab-bar
            current-path="/pages/app/index"
            :theme="settingsStore.isDark ? 'dark' : 'light'"
            :placeholder="false"
            @tab-reclick="scrollToTop"
        ></glass-tab-bar>
    </view>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch, isRef } from 'vue';
import { onShareAppMessage, onShareTimeline, onPageScroll, onReachBottom, onPullDownRefresh, onTabItemTap, onShow } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { useTranslateParams } from '@/utils/i18n.js';
import {
    apiGetBanner,
    apiGetRandomDay,
    apiGetDailyFeatured,
    apiGetRandomRecommend,
    apiGetClassList,
    apiGetCheckUpdates,
    apiPostRecommend,
} from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { AD_CONFIG } from '@/common/config.js';
import { getStatusBarHeight, getTabBarHeight } from '@/utils/layout.js';
import { applyAppTheme } from '@/utils/theme.js';
import { useLibraryStore } from '@/stores/library.js';
import { useUserStore } from '@/stores/user.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useAppStore } from '@/stores/app.js';
import { useStatusStore } from '@/stores/status.js';

const { t, locale } = useI18n();
const { tp } = useTranslateParams();
const libraryStore = useLibraryStore();
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const appStore = useAppStore();
const statusStore = useStatusStore();

const isAdmin = computed(() => !!userStore.isAdmin);
const isEn = computed(() => locale.value === 'en');
const statusBarHeight = ref(getStatusBarHeight() || 0);

const pagePaddingBottom = computed(() => {
    const baseTabSpace = getTabBarHeight();
    return `${baseTabSpace + 20}px`;
});

const isScrolled = ref(false);
const showScrollTop = ref(false);
const notificationSheetRef = ref(null);

const openNotificationSheet = () => {
    notificationSheetRef.value?.open();
};

// ── 平滑回到顶部逻辑 ──
const scrollToTop = () => {
    showScrollTop.value = false;
    uni.pageScrollTo({
        scrollTop: 0,
        duration: 350,
    });
};

// ── 原生页面生命周期 ──
onPageScroll((e) => {
    const top = Number(e?.scrollTop || 0);
    isScrolled.value = top > 8;

    // 下滑超过 500rpx（或半屏以上）时平滑展示回到顶部悬浮按钮
    const windowHeight = (uni.getWindowInfo ? uni.getWindowInfo().windowHeight : 600) || 600;
    const nextShowTop = top > Math.max(windowHeight * 0.55, 450);
    if (showScrollTop.value !== nextShowTop) {
        showScrollTop.value = nextShowTop;
    }
});

// 点击当前首页 Tab，一键平滑回到顶部
onTabItemTap(() => {
    scrollToTop();
});

onReachBottom(() => {
    if (activeFeedTab.value === 'recommend') {
        loadMoreRecommend();
    }
});



const goSearchPage = () => {
    uni.navigateTo({
        url: '/pages/app/search'
    });
};

const refreshStatusBar = () => {
    const sb = getStatusBarHeight();
    if (sb > 0) {
        statusBarHeight.value = sb;
    }
    // applyAppTheme(settingsStore.options.theme);
};

onMounted(() => {
    refreshStatusBar();
    // ── 优化：分优先级延时加载，错峰发请求，减少首屏并发竞争 ──
    // P1 立即：首屏可见的关键数据
});

onShow(() => {
    refreshStatusBar();
});

// 分享给好友
onShareAppMessage(() => ({
    title: '本我壁纸 - 探索壁纸，亦探索自我',
    path: '/pages/app/index',
}));

// 分享朋友圈
onShareTimeline(() => ({
    title: '本我壁纸 - 探索壁纸，亦探索自我',
}));
</script>

<style lang="scss" scoped>
/* ─────────────────────────────────────────────────────────────
   0. 全局清除本页面所有容器及原生滚动条显示 (防止偶发横向滚动条)
───────────────────────────────────────────────────────────── */
::-webkit-scrollbar,
:deep(::-webkit-scrollbar) {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
    -webkit-appearance: none;
    background: transparent;
}

.home-page {
    position: relative;
    width: 100%;
    max-width: 100vw;
    min-height: 100vh;
    background-color: var(--page-background);
    box-sizing: border-box;
    overflow-x: hidden;

    &.theme-light {
        background: linear-gradient(180deg, #edf0e6 0%, var(--page-background) 360rpx, var(--page-background) 100%);
    }
}

@keyframes homeEntrance {
    0% {
        opacity: 0.15;
        transform: translateY(16rpx);
    }
    100% {
        opacity: 1;
        transform: none;
    }
}

.home-content {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
    animation: homeEntrance 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.banner {
    width: 100%;
    padding: 0 0 4rpx;
    box-sizing: border-box;
    overflow-x: hidden;

    .banner-carousel-wrap {
        position: relative;
        width: 100%;
        box-sizing: border-box;
    }

    .banner-swiper {
        width: 100%;
        height: 410rpx;
        margin: 0 0 12rpx;
        box-sizing: border-box;
    }

    // 统一左右安全边距为 20rpx，与搜索框、3个按钮卡片以及 select 板块完全对齐
    .banner-swiper-item {
        padding: 0 20rpx;
        box-sizing: border-box;
    }

    // 高定长条动态微光胶囊指示器 (Active Pill Indicators)
    .banner-indicators {
        position: absolute;
        bottom: 30rpx;
        right: 44rpx;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 8rpx;
        padding: 6rpx 14rpx;
        border-radius: 999rpx;
        background: rgba(0, 0, 0, 0.32);
        backdrop-filter: blur(12rpx);
        -webkit-backdrop-filter: blur(12rpx);
        border: 1rpx solid rgba(255, 255, 255, 0.16);
        pointer-events: none;

        .theme-dark & {
            border: none;
        }
    }

    .banner-dot {
        width: 8rpx;
        height: 8rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.45);
        transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);

        &--active {
            width: 28rpx;
            border-radius: 999rpx;
            background: #ffffff;
            box-shadow: 0 0 10rpx rgba(255, 255, 255, 0.75);
        }
    }

    .banner-card {
        width: 100%;
        height: 100%;
        display: block;
        position: relative;
        overflow: hidden;
        border-radius: 32rpx;
        border: none;
        box-sizing: border-box;
        box-shadow: 
            0 16rpx 40rpx -8rpx rgba(15, 23, 42, 0.16),
            0 4rpx 14rpx rgba(0, 0, 0, 0.06);
        @extend %sk-shimmer;

        .theme-dark & {
            border: none;
            box-shadow: 0 20rpx 48rpx rgba(0, 0, 0, 0.5);

            .banner-card__tag,
            .banner-card__target,
            .banner-card__meta-chip {
                border: none;
            }
        }

        .banner-card__image {
            width: 100%;
            height: 100%;
            transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .banner-card__overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg,
                    rgba(6, 12, 18, 0.06) 0%,
                    rgba(6, 12, 18, 0.18) 34%,
                    rgba(6, 12, 18, 0.78) 100%);
        }

        .banner-card__content {
            position: absolute;
            left: 28rpx;
            right: 28rpx;
            bottom: 26rpx;
            z-index: 1;
        }

        .banner-card__tag-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16rpx;
            margin-bottom: 14rpx;
        }

        .banner-card__tag,
        .banner-card__target {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 40rpx;
            padding: 0 16rpx;
            border-radius: 999rpx;
            font-size: 20rpx;
            font-weight: 700;
            letter-spacing: 0.03em;
        }

        .banner-card__tag {
            color: #7dd3fc;
            background: rgba(43, 140, 238, 0.18);
            border: 1rpx solid rgba(125, 211, 252, 0.22);
        }

        .banner-card__target {
            color: rgba(241, 245, 249, 0.92);
            background: rgba(15, 23, 42, 0.28);
            border: 1rpx solid rgba(255, 255, 255, 0.14);
        }

        .banner-card__title {
            font-size: 34rpx;
            line-height: 1.25;
            font-weight: 700;
            color: #f8fafc;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .banner-card__desc {
            margin-top: 8rpx;
            font-size: 22rpx;
            line-height: 1.45;
            color: rgba(226, 232, 240, 0.84);
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .banner-card__meta {
            margin-top: 18rpx;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .banner-card__meta-chip {
            display: inline-flex;
            align-items: center;
            min-height: 42rpx;
            padding: 0 16rpx;
            border-radius: 999rpx;
            font-size: 22rpx;
            color: #dbe7f5;
            background: rgba(15, 23, 42, 0.26);
            border: 1rpx solid rgba(255, 255, 255, 0.12);
        }


        &:active .banner-card__image {
            transform: scale(1.08);
        }

        @media (hover: hover) {
            &:hover .banner-card__image {
                transform: scale(1.08);
            }
        }

        &.is-collection {
            .banner-card__tag {
                color: #f3e8ff;
                background: rgba(126, 34, 206, 0.32);
                border-color: rgba(216, 180, 254, 0.34);
            }

            .banner-card__meta-chip {
                color: #f3e8ff;
                background: rgba(15, 23, 42, 0.38);
                border-color: rgba(192, 132, 252, 0.24);
            }
        }

        &.is-keyword {
            .banner-card__tag {
                color: #ecfccb;
                background: rgba(101, 163, 13, 0.28);
                border-color: rgba(190, 242, 100, 0.3);
            }

            .banner-card__meta-chip {
                color: #ecfccb;
                background: rgba(15, 23, 42, 0.34);
                border-color: rgba(163, 230, 53, 0.18);
            }
        }

        &.is-spotlight {
            .banner-card__tag {
                color: #fde68a;
                background: rgba(245, 158, 11, 0.18);
                border-color: rgba(253, 230, 138, 0.3);
            }

            .banner-card__meta-chip {
                color: #fef3c7;
            }
        }
    }
}

.signal-callout-new {
    margin: 16rpx 20rpx 32rpx;
    padding: 28rpx 28rpx;
    border-radius: 36rpx;
    background: linear-gradient(135deg, rgba(40, 179, 137, 0.04) 0%, rgba(97, 154, 239, 0.04) 100%);
    border: 1rpx solid rgba(40, 179, 137, 0.12);
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    box-sizing: border-box;
    box-shadow: 0 10rpx 30rpx var(--shadow-color);
    transition: all 0.28s cubic-bezier(0.25, 1, 0.5, 1);

    .theme-dark & {
        background: linear-gradient(135deg, rgba(40, 179, 137, 0.12) 0%, rgba(30, 41, 59, 0.45) 100%);
        border: none;
    }

    &.is-expanded {
        background: var(--panel-background);
        border-color: var(--panel-border);
    }

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
    }

    &__left {
        display: flex;
        align-items: center;
        gap: 12rpx;
    }

    .signal-pulse-dot {
        width: 12rpx;
        height: 12rpx;
        background: #28b389;
        border-radius: 50%;
        position: relative;

        &::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: #28b389;
            animation: pulse-ring 1.8s infinite ease-in-out;
        }
    }

    &__eyebrow {
        font-size: 20rpx;
        font-weight: 900;
        letter-spacing: 2rpx;
        color: #28b389;
        text-transform: uppercase;
        line-height: 1;
    }

    &__right {
        display: flex;
        align-items: center;
    }

    &__body {
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 6rpx;
    }

    &__title {
        font-size: 32rpx;
        font-weight: 850;
        color: var(--text-primary);
        line-height: 1.2;
    }

    &__desc {
        font-size: 24rpx;
        line-height: 1.5;
        color: var(--text-secondary);
    }

    &__panel {
        padding-top: 24rpx;
        border-top: 1rpx solid var(--panel-border);
        display: flex;
        flex-direction: column;
        gap: 20rpx;
    }
}

@keyframes pulse-ring {
    0% {
        transform: scale(1);
        opacity: 0.8;
    }

    100% {
        transform: scale(2.8);
        opacity: 0;
    }
}

.signal-group-new {
    display: flex;
    flex-direction: column;
    gap: 12rpx;

    &__title {
        font-size: 18rpx;
        font-weight: 900;
        letter-spacing: 1rpx;
        color: var(--text-tertiary);
        text-transform: uppercase;
    }

    &__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 12rpx;
    }
}

.signal-chip-new {
    display: inline-flex;
    align-items: center;
    gap: 8rpx;
    padding: 8rpx 20rpx;
    background: var(--page-background-secondary);
    border: 1rpx solid var(--panel-border);
    border-radius: 100rpx;
    color: var(--text-primary);
    font-size: 22rpx;
    font-weight: 700;
    transition: transform 0.2s;

    .theme-dark & {
        border: none;
    }

    &:active {
        transform: scale(0.96);
    }

    .chip-text {
        line-height: 1;
    }

    &--tag {
        color: #28b389;
        background: rgba(40, 179, 137, 0.06);
        border-color: rgba(40, 179, 137, 0.16);

        .theme-dark & {
            background: rgba(40, 179, 137, 0.12);
            border: none;
        }
    }
}

.signal-manage-new {
    min-height: 72rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    background: var(--panel-background-strong);
    border: 1rpx solid var(--panel-border);
    color: var(--text-primary);
    font-size: 24rpx;
    font-weight: 800;
    transition: background 0.2s;

    .theme-dark & {
        border: none;
    }

    &:active {
        background: var(--page-background-secondary);
    }
}

.select {
    position: relative;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;

    .select-watermark {
        position: absolute;
        top: -32rpx;
        right: 0;
        max-width: 100%;
        font-size: 144rpx;
        font-weight: 900;
        color: var(--text-primary);
        opacity: 0.05;
        text-transform: uppercase;
        letter-spacing: -2rpx;
        pointer-events: none;
        z-index: 0;
        white-space: nowrap;
        user-select: none;
        -webkit-mask-image: linear-gradient(to left, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 0) 100%);
        mask-image: linear-gradient(to left, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 0) 100%);
        transition: opacity 0.3s ease;

        .theme-dark & {
            opacity: 0.04;
        }
    }

    .index-title {
        position: relative;
        z-index: 1;
        margin-bottom: 24rpx;
    }

    .date {
        display: flex;
        align-items: center;
        gap: 14rpx;

        .text {
            font-size: 24rpx;
            font-weight: 600;
            color: var(--text-primary);
            letter-spacing: 0.02em;
        }
    }

    .benefit-text-tip {
        font-size: 24rpx;
        font-weight: 600;
        color: var(--text-secondary, #94a3b8);
        letter-spacing: 0.4rpx;
        padding-right: 4rpx;
    }

    // 扁平+箭头 更多按钮 (大小粗细与 VIP Exclusive 保持一致)
    .more-btn {
        display: inline-flex;
        align-items: center;
        gap: 2rpx;
        padding: 6rpx 0 6rpx 16rpx;
        cursor: pointer;
        line-height: 1;
        box-sizing: border-box;
        transition: opacity 0.15s ease;

        &__text {
            font-size: 24rpx;
            font-weight: 600;
            color: var(--text-secondary, #94a3b8);
            letter-spacing: 0.4rpx;
            line-height: 1;
        }

        &__icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            line-height: 1;
            transition: transform 0.15s cubic-bezier(0.2, 0.9, 0.3, 1);
        }

        &:active,
        &--active {
            opacity: 0.65;

            .more-btn__icon {
                transform: translateX(4rpx);
            }
        }
    }

    .btn,
    .date .button,
    .refresh-btn {
        margin: 0;
        padding: 0 20rpx;
        height: 48rpx;
        line-height: 48rpx;
        font-size: 21rpx;
        font-weight: 600;
        border-radius: 999rpx;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8rpx;
        letter-spacing: 0rpx;
        box-sizing: border-box;
        transition: transform 0.12s cubic-bezier(0.2, 0.9, 0.3, 1), background 0.15s, color 0.15s;

        &::after {
            border: none;
        }

        // 浅色模式：实体纯白微浮岛胶囊，无边框
        .theme-light & {
            background-color: #ffffff;
            color: #1e293b;
            font-weight: 650;
            border: none;
            box-shadow: 0 4rpx 14rpx rgba(15, 23, 42, 0.08);

            &:active {
                background-color: #f8fafc;
                transform: scale(0.95);
            }
        }

        // 深色模式：高质感暗夜卡片微胶囊，无边框
        .theme-dark & {
            background-color: #242a38;
            color: #f1f5f9;
            font-weight: 650;
            border: none;
            box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.25);

            &:active {
                background-color: #2e3546;
                transform: scale(0.95);
            }
        }

        .refresh-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);

            &.is-spinning {
                animation: refreshSpin 0.7s linear infinite;
            }
        }

        &.is-default,
        &.is-collection,
        &.is-keyword,
        &.is-spotlight {
            // 继承次级胶囊样式，保持统一
        }
    }

    .content {
        height: 580rpx;
        position: relative;
        z-index: 1;

        .home-scroll {
            width: 100%;
            white-space: nowrap;
            height: 100%;
            box-sizing: border-box;
            overflow-y: hidden;

            &::-webkit-scrollbar {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
                background: transparent;
            }

            .box {
                width: 280rpx;
                height: calc(100% - 50rpx);
                display: inline-flex;
                justify-content: center;
                align-items: flex-start;
                margin: 20rpx 20rpx 50rpx 0rpx;
                transition: transform 0.12s cubic-bezier(0.2, 0.9, 0.3, 1), filter 0.12s ease, opacity 0.12s ease, box-shadow 0.3s ease;
                will-change: transform, filter;
                position: relative;
                overflow: hidden;
                border-radius: 28rpx;
                box-sizing: border-box;
                // box-shadow: 0 6rpx 15rpx rgba(0, 0, 0, 0.34);
                box-shadow: none;

                &:first-child {
                    margin-left: 20rpx;
                }

                &--active,
                &:active {
                    transform: scale(0.94) !important;
                    filter: brightness(0.92);
                }

                &::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border-radius: 28rpx;
                    background: linear-gradient(90deg,
                            rgba(200, 200, 200, 0.08) 25%,
                            rgba(200, 200, 200, 0.18) 50%,
                            rgba(200, 200, 200, 0.08) 75%);
                    background-size: 200% 100%;
                    animation: skeleton-shimmer 1.6s infinite linear;
                    z-index: 0;
                    pointer-events: none;
                }

                .box-image {
                    width: 100%;
                    height: 100%;
                    border-radius: 28rpx;
                    display: block;
                    position: absolute;
                    inset: 0;
                    object-fit: cover;
                    transition: opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1), transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
                }

                .box-badge {
                    position: absolute;
                    top: 14rpx;
                    left: 14rpx;
                    right: auto;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 6rpx 14rpx;
                    background: rgba(0, 0, 0, 0.6);
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 18rpx;
                    font-weight: 500;
                    line-height: 1;
                    border-radius: 9999rpx;
                    backdrop-filter: blur(4px);
                    -webkit-backdrop-filter: blur(4px);
                    border: none;
                    box-shadow: none;
                    z-index: 2;
                    animation: badgeFadeIn 0.3s ease-out;
                    will-change: transform, opacity;
                }

                .box-badge--subtle,
                .box-badge--free,
                .box-badge--ad,
                .box-badge--latest,
                .box-badge--vip {
                    background: rgba(0, 0, 0, 0.6);
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 18rpx;
                    font-weight: 500;
                    line-height: 1;
                    border: none;
                    box-shadow: none;
                }

                &--active,
                &:active {
                    transform: scale(0.97) !important;
                    filter: brightness(0.9) !important;
                }

                // Hero mode
                &.is-hero {
                    width: 460rpx;
                    height: calc(100% - 50rpx);
                    padding-bottom: 0;

                    &::before {
                        bottom: 0;
                    }

                    .box-hero-overlay {
                        position: absolute;
                        inset: 0;
                        border-radius: 28rpx;
                        background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.65) 100%);
                        pointer-events: none;
                        z-index: 2;
                        opacity: 0;
                        transition: opacity 0.4s ease-in-out;

                        &.is-visible {
                            opacity: 1;
                        }
                    }

                    .box-hero-shimmer {
                        position: absolute;
                        top: -50%;
                        left: -50%;
                        width: 60%;
                        height: 200%;
                        background: linear-gradient(90deg,
                                rgba(255, 255, 255, 0) 0%,
                                rgba(255, 255, 255, 0.18) 50%,
                                rgba(255, 255, 255, 0) 100%);
                        pointer-events: none;
                        z-index: 2;
                        opacity: 0;
                        animation: heroShimmerSweep 7s ease-in-out infinite;

                        &.is-visible {
                            opacity: 1;
                        }
                    }

                    .box-hero-content {
                        position: absolute;
                        left: 24rpx;
                        bottom: 30rpx;
                        right: 24rpx;
                        z-index: 3;
                        opacity: 0;
                        transition: opacity 0.4s ease-in-out, transform 0.3s ease;

                        &.is-visible {
                            opacity: 1;
                        }

                        .day-tag {
                            font-size: 64rpx;
                            font-weight: 900;
                            color: rgba(255, 255, 255, 0.98);
                            line-height: 1;
                            margin-bottom: 8rpx;
                            text-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.4);
                        }

                        .pick-text {
                            font-size: 20rpx;
                            font-weight: 850;
                            color: #fde68a;
                            text-transform: uppercase;
                            letter-spacing: 4rpx;
                            text-shadow: 0 2rpx 10rpx rgba(253, 230, 138, 0.35);
                        }
                    }
                }
            }

            @media (hover: hover) {
                .box:hover {
                    box-shadow: 0 12rpx 28rpx rgba(0, 0, 0, 0.45);

                    .box-image {
                        transform: scale(1.08);
                    }
                }
            }

        }
    }
}

.tags-section {
    margin: 0 0 20rpx;
    padding: 0;
    position: relative;

    .tags-header {
        display: flex;
        align-items: center;
        gap: 8rpx;
        margin: 0 20rpx 10rpx;

        .tags-title {
            font-size: 26rpx;
            font-weight: 700;
            color: var(--text-secondary);
            letter-spacing: 0.5rpx;
        }
    }

    .tags-scroll-wrapper {
        position: relative;
        width: 100%;
        overflow: hidden;
    }

    .tags-fade {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 64rpx;
        z-index: 5;
        pointer-events: none;
        transition: opacity 0.25s ease;

        &--left {
            left: 0;
            background: linear-gradient(to right, var(--page-background) 20%, rgba(243, 244, 239, 0) 100%);
            opacity: 0;

            .theme-dark & {
                background: linear-gradient(to right, var(--page-background) 20%, rgba(24, 24, 24, 0) 100%);
            }

            &.is-visible {
                opacity: 1;
            }
        }

        &--right {
            right: 0;
            background: linear-gradient(to left, var(--page-background) 25%, rgba(243, 244, 239, 0) 100%);
            opacity: 1;

            .theme-dark & {
                background: linear-gradient(to left, var(--page-background) 25%, rgba(24, 24, 24, 0) 100%);
            }

            &.is-hidden {
                opacity: 0;
                pointer-events: none;
            }
        }
    }

    .tags-scroll {
        width: 100%;
        white-space: nowrap;
        box-sizing: border-box;

        &::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            background: transparent;
        }
    }

    .tags-list {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        align-items: center;
        gap: 16rpx;
        padding: 10rpx 20rpx;
        box-sizing: border-box;

        &::after {
            content: '';
            width: 10rpx;
            flex-shrink: 0;
        }
    }

    .tag-chip {
        height: 56rpx;
        box-sizing: border-box;
        padding: 0 24rpx;
        border-radius: 100rpx;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--panel-background);
        border: 1rpx solid var(--panel-border);
        box-shadow: 0 4rpx 10rpx var(--shadow-color);
        transition: transform 0.2s, opacity 0.2s;
        white-space: nowrap;
        flex-shrink: 0;

        .theme-dark & {
            border: none;
        }

        &:active {
            transform: scale(0.95);
            opacity: 0.85;
        }

        .tag-label {
            font-size: 24rpx;
            font-weight: 600;
            line-height: 1;
            color: var(--text-primary);
        }

        &--more {
            display: inline-flex;
            align-items: center;
            gap: 6rpx;
            background: rgba(0, 0, 0, 0.03);
            border: 1rpx dashed var(--panel-border);

            .theme-dark & {
                background: rgba(255, 255, 255, 0.04);
                border: none;
            }

            .tag-label {
                font-size: 22rpx;
                color: var(--text-tertiary);
            }
        }
    }
}

// ── 信息流模式分段选择器 (Segmented Pill Switcher) ──
.feed-switcher-section {
    padding: 16rpx 32rpx 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.feed-switcher {
    display: inline-flex;
    align-items: center;
    padding: 8rpx;
    border-radius: 999rpx;
    position: relative;
    user-select: none;
    transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);

    .theme-light & {
        background: rgba(0, 0, 0, 0.05);
        border: 1rpx solid rgba(0, 0, 0, 0.06);
    }

    .theme-dark & {
        background: rgba(255, 255, 255, 0.08);
        border: none;
    }
}

.feed-tab {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    height: 60rpx;
    padding: 0 36rpx;
    border-radius: 999rpx;
    cursor: pointer;
    transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    z-index: 1;

    &__icon {
        font-size: 20rpx;
        line-height: 1;
        color: inherit;
    }

    &__text {
        font-size: 26rpx;
        font-weight: 600;
        line-height: 1;
        color: var(--text-secondary);
        transition: color 0.25s ease;
    }

    &:active {
        transform: scale(0.96);
    }

    &.is-active {
        // 参考最热、最新按钮：统一高级石墨炭灰胶囊，摆脱死黑
        .theme-light & {
            background: #333b48;
            box-shadow: 0 3rpx 10rpx rgba(15, 23, 42, 0.08);

            .feed-tab__text {
                color: #ffffff;
                font-weight: 650;
            }

            .feed-tab__icon {
                color: #818cf8;
            }
        }

        // 深色模式：与最热/最新保持一致的暗夜黑蓝底 + 无边框 + 白字
        .theme-dark & {
            background: #252b38;
            border: none;
            box-shadow: 0 4rpx 14rpx rgba(0, 0, 0, 0.25);

            .feed-tab__text {
                color: #f8fafc;
                font-weight: 650;
            }

            .feed-tab__icon {
                color: #818cf8;
            }
        }
    }
}

// ── 为你推荐 (瀑布流布局) ──
.feed-recommend-container {
    width: 100%;
    padding: 0 20rpx;
    box-sizing: border-box;
}

.feed-waterfall {
    display: flex;
    justify-content: space-between;
    gap: 20rpx;
    align-items: flex-start;
    width: 100%;
    box-sizing: border-box;

    .waterfall-col {
        flex: 1;
        width: calc(50% - 10rpx);
        min-width: 0;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 20rpx;
    }
}

.waterfall-card {
    position: relative;
    width: 100%;
    border-radius: 28rpx;
    overflow: hidden;
    background: var(--panel-background);
    box-shadow: 0 6rpx 20rpx var(--shadow-color);
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
    cursor: pointer;

    &--active,
    &:active {
        transform: scale(0.95) !important;
        filter: brightness(0.92);
    }

    &.is-loading {
        @extend %sk-shimmer;
    }

    &.is-ad-card {
        aspect-ratio: auto !important;
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
        overflow: hidden;
        cursor: default;

        // 广告加载失败：隐藏并脱离文档流（唯一需要折叠的场景，加载中/成功都占位避免抖动）
        &.is-ad-error {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 0 !important;
            height: 0 !important;
            min-height: 0 !important;
            max-height: 0 !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            opacity: 0 !important;
            pointer-events: none !important;
            visibility: hidden !important;
        }

        // 加载中与加载成功都占位：加载中内部显示骨架，成功后替换为广告，高度一致
        &.is-ad-loaded {
            position: relative;
            opacity: 1;
            transition: opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .ad-custom-card {
            position: relative;
            width: 100%;
            border-radius: 28rpx;
            overflow: hidden;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
        }

        // 广告加载中/未填充时的居中文字占位
        .ad-placeholder {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            z-index: 1;

            &__text {
                font-size: 24rpx;
                font-weight: 600;
                letter-spacing: 6rpx;
                color: var(--text-tertiary);
                opacity: 0.7;
            }
        }
    }

    &--active,
    &:active {
        transform: scale(0.97);
        box-shadow: 0 2rpx 8rpx var(--shadow-color);
    }

    &__img {
        width: 100%;
        height: 100%;
        display: block;
        opacity: 0;
        transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);

        &.is-loaded {
            opacity: 1;
        }
    }

    &__err {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.04);
        z-index: 1;
        pointer-events: none;

        .theme-dark & {
            background: rgba(255, 255, 255, 0.04);
        }
    }

    &__overlay {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 180rpx;
        // 贴底极简柔和渐变：覆盖底部2行文字及footer保护区，上方完全通透无阴影
        background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.22) 60%, rgba(0, 0, 0, 0) 100%);
        pointer-events: none;

        .theme-light & {
            background: linear-gradient(to top, rgba(0, 0, 0, 0.48) 0%, rgba(0, 0, 0, 0.15) 60%, rgba(0, 0, 0, 0) 100%);
        }
    }

    &__meta {
        position: absolute;
        left: 16rpx;
        right: 16rpx;
        bottom: 16rpx;
        z-index: 2;
        display: flex;
        flex-direction: column;
        gap: 8rpx;

        .meta-title {
            font-size: 24rpx;
            font-weight: 700;
            color: #ffffff;
            line-height: 1.34;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            word-break: break-word;
            text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.6);
        }

        .meta-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .meta-tag {
            font-size: 18rpx;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.85);
            background: rgba(0, 0, 0, 0.35);
            padding: 2rpx 10rpx;
            border-radius: 999rpx;
            backdrop-filter: blur(8rpx);
            -webkit-backdrop-filter: blur(8rpx);
            border: 1rpx solid rgba(255, 255, 255, 0.15);

            .theme-dark & {
                border: none;
            }
        }

        .meta-score {
            display: inline-flex;
            align-items: center;
            gap: 6rpx;

            .score-num {
                font-size: 20rpx;
                color: rgba(203, 213, 225, 0.76);
            }
        }
    }

    &__lock {
        position: absolute;
        top: 14rpx;
        right: 14rpx;
        z-index: 3;
        width: 44rpx;
        height: 44rpx;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10rpx);
        -webkit-backdrop-filter: blur(10rpx);
        border: 1rpx solid rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;

        .theme-dark & {
            border: none;
        }
    }
}

// 骨架屏
.feed-skeleton {
    display: flex;
    justify-content: space-between;
    gap: 20rpx;
    width: 100%;

    .sk-col {
        flex: 1;
        width: calc(50% - 10rpx);
        display: flex;
        flex-direction: column;
        gap: 20rpx;
    }

    .sk-card {
        width: 100%;
        border-radius: 28rpx;
        @extend %sk-shimmer;
    }
}

// 触底状态
.feed-load-state {
    padding: 40rpx 0 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .feed-loading-pill {
        display: inline-flex;
        align-items: center;
        gap: 12rpx;
        padding: 8rpx 24rpx;
        border-radius: 999rpx;
        background: rgba(0, 0, 0, 0.04);

        .theme-dark & {
            background: rgba(255, 255, 255, 0.08);
        }

        .loading-text {
            font-size: 22rpx;
            color: var(--text-tertiary);
        }
    }

    .no-more-text {
        font-size: 22rpx;
        color: var(--text-tertiary);
        letter-spacing: 1rpx;
        opacity: 0.7;
    }
}

.feed-classify-container {
    width: 100%;
}

@keyframes refreshSpin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@keyframes badgeFadeIn {
    from {
        opacity: 0;
        transform: translateY(-4rpx);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes skeleton-shimmer {
    0% {
        background-position: 200% 0;
    }

    100% {
        background-position: -200% 0;
    }
}

// ── 骨架屏公共 mixin ──
$sk-base: rgba(148, 163, 184, 0.12);
$sk-shine: rgba(148, 163, 184, 0.22);

%sk-shimmer {
    background: linear-gradient(90deg, $sk-base 25%, $sk-shine 50%, $sk-base 75%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.6s infinite linear;
}

// ── Banner 骨架 ──
.sk-banner {
    margin: 0 20rpx;
    width: calc(100% - 40rpx);
    height: 100%;
    border-radius: 28rpx;
    overflow: hidden;
    position: relative;
    @extend %sk-shimmer;

    .sk-banner__img {
        width: 100%;
        height: 100%;
        position: absolute;
        inset: 0;
    }

    .sk-banner__content {
        position: absolute;
        left: 28rpx;
        right: 28rpx;
        bottom: 26rpx;
        z-index: 1;
        display: flex;
        flex-direction: column;
        gap: 14rpx;
    }

    .sk-banner__tag-row {
        display: flex;
        gap: 16rpx;
    }
}

// ── 通用骨架条 ──
.sk-bar {
    @extend %sk-shimmer;
    border-radius: 8rpx;
    opacity: 0.5;

    &--tag {
        height: 40rpx;
        width: 120rpx;
        border-radius: 999rpx;
    }

    &--short {
        width: 80rpx;
    }

    &--title {
        height: 32rpx;
        width: 90%;
    }

    &--medium {
        width: 60%;
    }

    &--desc {
        height: 24rpx;
        width: 75%;
    }
}

// ── 横向卡片骨架（Daily/Latest）──
.sk-scroll-row {
    display: inline-flex;
    align-items: flex-start;
    height: calc(100% - 66rpx);
    padding: 20rpx 20rpx 50rpx;
    gap: 24rpx;
    white-space: nowrap;
    width: 100%;
    box-sizing: border-box;
}

.sk-card {
    width: 280rpx;
    height: 514rpx;
    flex-shrink: 0;
    border-radius: 28rpx;
    @extend %sk-shimmer;

    &--hero {
        width: 440rpx;
    }

    // 头像圆形骨架
    &--avatar {
        width: 180rpx;
        height: 180rpx;
        border-radius: 50%;
    }

    // 桌面横版骨架
    &--desktop {
        width: 560rpx;
        height: 315rpx;
    }
}

// ── 首页横版原生信息流广告卡片 ──
.home-flow-ad-wrap {
    padding: 0 20rpx;
    margin: -4rpx 0 26rpx;
    box-sizing: border-box;
    width: 100%;

    &:not(.is-loaded) {
        opacity: 0;
        pointer-events: none;
    }

    &.is-error {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
    }

    .home-flow-ad-card {
        width: 100%;
        border-radius: 28rpx;
        overflow: hidden;
        background: var(--bg-card, rgba(255, 255, 255, 0.8));
        box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.04);
        transform: translateZ(0);
        -webkit-mask-image: -webkit-radial-gradient(white, black);
        display: flex;
        justify-content: center;

        :deep(ad-custom) {
            width: 100% !important;
            display: block !important;
        }
    }
}

// ── 头像专区（圆形卡片） ──
.avatar-section {
    .avatar-content {
        height: 240rpx;
    }

    .home-scroll {
        .avatar-box {
            width: 180rpx;
            height: 180rpx;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin: 20rpx 24rpx 40rpx 0;
            border-radius: 50%;
            position: relative;
            overflow: visible;
            box-sizing: border-box;
            transition: transform 0.12s cubic-bezier(0.2, 0.9, 0.3, 1), filter 0.12s ease;
            will-change: transform, filter;
            // 外圈描边，让圆形头像在浅色背景上有明确边界
            box-shadow: 0 0 0 6rpx var(--page-background), 0 0 0 8rpx var(--panel-border);

            &:first-child {
                margin-left: 20rpx;
            }

            &--active,
            &:active {
                transform: scale(0.92) !important;
                filter: brightness(0.92);
            }

            .avatar-image {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                display: block;
                object-fit: cover;
            }
        }
    }
}

// ── 桌面壁纸专区（横版卡片） ──
.desktop-section {
    .desktop-content {
        height: 380rpx;
    }

    .home-scroll {
        .desktop-box {
            width: 560rpx;
            height: 315rpx;
            display: inline-flex;
            justify-content: center;
            align-items: flex-start;
            margin: 20rpx 20rpx 45rpx 0;
            position: relative;
            overflow: hidden;
            border-radius: 28rpx;
            box-sizing: border-box;
            box-shadow: none;
            transition: transform 0.12s cubic-bezier(0.2, 0.9, 0.3, 1), filter 0.12s ease;
            will-change: transform, filter;

            &:first-child {
                margin-left: 20rpx;
            }

            &--active,
            &:active {
                transform: scale(0.96) !important;
                filter: brightness(0.92);
            }

            .desktop-image {
                width: 100%;
                height: 100%;
                border-radius: 28rpx;
                display: block;
                object-fit: cover;
            }
        }
    }
}
</style>
