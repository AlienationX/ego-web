<template>
    <view class="home-page" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 顶部渐变毛玻璃状态栏 -->
        <glass-status-bar
            :is-scrolled="isScrolled"
            :theme="settingsStore.isDark ? 'dark' : 'light'"
        ></glass-status-bar>
        <view class="home-content">
            <!-- 沉浸式 Hero 头部：头像问候、通知铃铛、灵动气泡、搜索栏、快捷入口胶囊 -->
            <home-hero-header
                :status-bar-height="statusBarHeight"
                @open-notifications="openNotificationSheet"
            />

            <!-- 搜索框下方快捷药丸胶囊入口 (参考截图设计：最热、最新、专题策划) -->
            <home-nav-tiles />

            <!-- Banner -->
            <view class="banner">
                <!-- Banner 骨架屏 -->
                <view v-if="!bannerList.length" class="banner-swiper">
                    <view class="sk-banner">
                        <view class="sk-banner__img"></view>
                        <view class="sk-banner__content">
                            <view class="sk-banner__tag-row">
                                <view class="sk-bar sk-bar--tag"></view>
                                <view class="sk-bar sk-bar--tag sk-bar--short"></view>
                            </view>
                            <view class="sk-bar sk-bar--title"></view>
                            <view class="sk-bar sk-bar--title sk-bar--medium"></view>
                            <view class="sk-bar sk-bar--desc"></view>
                        </view>
                    </view>
                </view>
                <view v-else class="banner-carousel-wrap">
                    <swiper class="banner-swiper" :indicator-dots="false" autoplay circular :interval="4500" :duration="500" @change="onBannerChange">
                        <swiper-item class="banner-swiper-item" v-for="(item, bIdx) in bannerList" :key="item.id">
                            <navigator v-if="item.target == 'miniProgram'" :url="item.url" target="miniProgram"
                                :app-id="item.appid" :class="['banner-card', item.accentClass, { 'banner-card--active': currentBanner === bIdx }]">
                                <image class="banner-card__image" :src="item.mediumPicurl" mode="aspectFill" lazy-load fade-in></image>
                                <view class="banner-card__overlay"></view>
                                <view class="banner-card__content">
                                    <view class="banner-card__tag-row">
                                        <view class="banner-card__tag">{{ item.badge }}</view>
                                        <view class="banner-card__target">{{ item.targetLabel }}</view>
                                    </view>
                                    <view class="banner-card__title">{{ item.title }}</view>
                                    <view class="banner-card__desc">{{ item.desc }}</view>
                                    <view class="banner-card__meta">
                                        <view class="banner-card__meta-chip">{{ item.metaLabel }}</view>
                                    </view>
                                </view>
                            </navigator>

                            <view v-else :class="['banner-card', item.accentClass, { 'banner-card--active': currentBanner === bIdx }]" @click="goBannerPreview(item)">
                                <image class="banner-card__image" :src="item.mediumPicurl" mode="aspectFill" lazy-load fade-in></image>
                                <view class="banner-card__overlay"></view>
                                <view class="banner-card__content">
                                    <view class="banner-card__tag-row">
                                        <view class="banner-card__tag">{{ item.badge }}</view>
                                        <view class="banner-card__target">{{ item.targetLabel }}</view>
                                    </view>
                                    <view class="banner-card__title">{{ item.title }}</view>
                                    <view class="banner-card__desc">{{ item.desc }}</view>
                                    <view class="banner-card__meta">
                                        <view class="banner-card__meta-chip">{{ item.metaLabel }}</view>
                                    </view>
                                </view>
                            </view>
                        </swiper-item>
                    </swiper>

                    <!-- 高定长条动态胶囊指示器 (Active Pill Indicators) -->
                    <view class="banner-indicators" v-if="bannerList.length > 1">
                        <view
                            v-for="(dot, dotIdx) in bannerList"
                            :key="dotIdx"
                            class="banner-dot"
                            :class="{ 'banner-dot--active': currentBanner === dotIdx }"
                        ></view>
                    </view>
                </view>
            </view>

            <!-- Inspiration / Random Pick -->
            <view class="select">
                <view class="select-watermark">Inspire</view>
                <index-title>
                    <template #name>{{ $t('index.randomRecommend') }}</template>
                    <template #custom>
                        <view class="date">
                            <uni-icons type="calendar" size="20"
                                :color="settingsStore.isDark ? 'rgba(255, 255, 255, 0.9)' : '#334155'"></uni-icons>
                            <view class="text"> {{ todayDateStr }}{{ $t('common.day') }} </view>
                            <button class="button refresh-btn" size="mini" :class="{ 'is-loading': isRefreshing }"
                                @click="refreshRandom">
                                <uni-icons type="refreshempty" size="13" class="refresh-icon"
                                    :class="{ 'is-spinning': isRefreshing }"
                                    :color="settingsStore.isDark ? '#f1f5f9' : '#1e293b'"></uni-icons>
                                <text class="refresh-text">{{ $t('common.refresh') }}</text>
                            </button>
                        </view>
                    </template>
                </index-title>

                <view class="content">
                    <!-- Daily 骨架屏：1个大卡 + 4个小卡 -->
                    <view v-if="!randomDailyList.length" class="sk-scroll-row">
                        <view class="sk-card sk-card--hero"></view>
                        <view v-for="i in 4" :key="i" class="sk-card"></view>
                    </view>
                    <scroll-view v-else scroll-x class="home-scroll" show-scrollbar="false">
                        <view class="box" v-for="(item, idx) in randomDailyList" :key="item.id"
                            :class="{ 'is-hero': idx === 0 }" hover-class="box--active" :hover-stay-time="150"
                            @click="goPreview(item.id, randomDailyList)">
                            <image class="box-image"
                                :src="idx === 0 ? item.mediumPicurl || item.picurl : item.smallPicurl" mode="aspectFill"
                                lazy-load fade-in @load="idx === 0 ? (heroImageLoaded = true) : null"></image>
                            <block v-if="idx === 0">
                                <view class="box-hero-overlay" :class="{ 'is-visible': heroImageLoaded }"></view>
                                <view class="box-hero-content" :class="{ 'is-visible': heroImageLoaded }">
                                    <view class="day-tag">{{ todayDate }}</view>
                                    <view class="pick-text">PICK OF THE DAY</view>
                                </view>
                            </block>
                            <block v-else>
                                <view v-if="item._timeBadgeKey || item._timeBadge" class="box-badge box-badge--subtle">
                                    {{ item._timeBadgeKey ? $t(`index.${item._timeBadgeKey}`) : item._timeBadge }}
                                </view>
                            </block>
                        </view>
                    </scroll-view>
                </view>
            </view>

            <!-- Latest Release -->
            <view class="select">
                <view class="select-watermark">Latest</view>
                <index-title>
                    <template #name>{{ $t('index.latestRelease') }}</template>
                    <template #custom>
                        <button size="mini" class="btn is-default" @click="goTimeline">{{ $t('common.seeAll')
                            }}</button>
                    </template>
                </index-title>

                <view class="content">
                    <!-- Latest 骨架屏：5个小卡 -->
                    <view v-if="!latestList.length" class="sk-scroll-row">
                        <view v-for="i in 5" :key="i" class="sk-card"></view>
                    </view>
                    <scroll-view v-else scroll-x class="home-scroll" show-scrollbar="false">
                        <view class="box" v-for="(item, idx) in latestList" :key="item.id" hover-class="box--active"
                            :hover-stay-time="150" @click="goPreview(item.id, latestList)">
                            <image class="box-image" :src="item.smallPicurl" mode="aspectFill" lazy-load fade-in>
                            </image>
                            <view v-if="item._timeBadgeKey || item._timeBadge" class="box-badge box-badge--latest">
                                {{ item._timeBadgeKey ? $t(`index.${item._timeBadgeKey}`) : item._timeBadge }}
                            </view>
                        </view>
                    </scroll-view>
                </view>
            </view>

            <!-- Daily Benefits (每日福利专区) -->
            <view class="select daily-benefits-section">
                <view class="select-watermark">Benefit</view>
                <index-title>
                    <template #name>{{ $t('index.dailyBenefits') }}</template>
                    <template #custom>
                        <text class="benefit-text-tip">{{ $t('index.dailyBenefitsTip') }}</text>
                    </template>
                </index-title>

                <view class="content">
                    <!-- 每日福利 骨架屏：5个小卡 -->
                    <view v-if="!dailyFeaturedList.length" class="sk-scroll-row">
                        <view v-for="i in 5" :key="i" class="sk-card"></view>
                    </view>
                    <scroll-view v-else scroll-x class="home-scroll" show-scrollbar="false">
                        <view class="box" v-for="item in dailyFeaturedList" :key="item.id" hover-class="box--active"
                            :hover-stay-time="150" @click="goPreview(item.id, dailyFeaturedList)">
                            <image class="box-image" :src="item.smallPicurl" mode="aspectFill" lazy-load fade-in>
                            </image>
                            <view v-if="item.is_daily_free" class="box-badge box-badge--free">
                                {{ $t('index.todayFree') }}
                            </view>
                            <view v-else-if="item.is_daily_ad" class="box-badge box-badge--ad">
                                {{ $t('index.watchUnlock') }}
                            </view>
                            <view v-else-if="item._timeBadgeKey || item._timeBadge" class="box-badge box-badge--subtle">
                                {{ item._timeBadgeKey ? $t(`index.${item._timeBadgeKey}`) : item._timeBadge }}
                            </view>
                        </view>
                    </scroll-view>
                </view>
            </view>

            <!-- Subscription Signals -->
            <view v-if="isAdmin && hasSubscriptionSignals" class="signal-callout-new"
                :class="{ 'is-expanded': followingExpanded }">
                <view class="signal-callout-new__header" @click="toggleFollowingExpanded">
                    <view class="signal-callout-new__left">
                        <view class="signal-pulse-dot"></view>
                        <text class="signal-callout-new__eyebrow">{{ t('index.followingEyebrow') }}</text>
                    </view>
                    <view class="signal-callout-new__right">
                        <uni-icons :type="followingExpanded ? 'arrow-up' : 'arrow-down'" size="11"
                            color="var(--text-secondary)"></uni-icons>
                    </view>
                </view>

                <view class="signal-callout-new__body" @click="toggleFollowingExpanded">
                    <view class="signal-callout-new__title">{{ t('index.followingTitle') }}</view>
                    <view class="signal-callout-new__desc">{{ followingSummary }}</view>
                </view>

                <view v-if="followingExpanded" class="signal-callout-new__panel">
                    <view v-if="subscribedClassifyItems.length" class="signal-group-new">
                        <view class="signal-group-new__title">{{ t('subscriptionPage.classifyTitle') }}</view>
                        <view class="signal-group-new__chips">
                            <view v-for="item in subscribedClassifyItems" :key="item.id" class="signal-chip-new"
                                @click="goClassify(item)">
                                <uni-icons type="images" size="10" color="var(--text-secondary)"></uni-icons>
                                <text class="chip-text">{{ item.name }}</text>
                            </view>
                        </view>
                    </view>

                    <view v-if="libraryStore.subscriptions.tags.length" class="signal-group-new">
                        <view class="signal-group-new__title">{{ t('subscriptionPage.tagTitle') }}</view>
                        <view class="signal-group-new__chips">
                            <view v-for="tag in libraryStore.subscriptions.tags" :key="tag"
                                class="signal-chip-new signal-chip-new--tag" @click="goSearchByTag(tag)">
                                <text class="chip-text"># {{ tag }}</text>
                            </view>
                        </view>
                    </view>

                    <navigator url="/pages/user/subscriptions" class="signal-manage-new">
                        <text>{{ t('index.followingManage') }}</text>
                        <uni-icons type="right" size="10" color="var(--text-primary)"></uni-icons>
                    </navigator>
                </view>
            </view>

            <!-- Popular Tags Cloud -->
            <view class="tags-section">
                <view class="tags-header">
                    <uni-icons type="fire-filled" size="16" color="#ff4d4f"></uni-icons>
                    <text class="tags-title">{{ t('category.popularTags') }}</text>
                </view>
                <view class="tags-scroll-wrapper">
                    <!-- 左侧渐隐羽化蒙版 (滑动后浮现，提示左侧可回滑) -->
                    <view class="tags-fade tags-fade--left" :class="{ 'is-visible': tagsScrolledLeft }"></view>

                    <scroll-view
                        scroll-x
                        class="tags-scroll"
                        show-scrollbar="false"
                        :scroll-left="tagsScrollLeft"
                        @scroll="onTagsScroll"
                        @scrolltolower="onTagsScrollToLower"
                    >
                        <view class="tags-list">
                            <view class="tag-chip" v-for="(tag, index) in popularTags" :key="index" @click="searchTag(tag)">
                                <text class="tag-label">#{{ tag }}</text>
                            </view>
                            <!-- 尾部更多探索胶囊 -->
                            <view class="tag-chip tag-chip--more" @click="goSearchPage">
                                <text class="tag-label">{{ t('common.seeAll') }}</text>
                                <uni-icons type="right" size="10" color="var(--text-tertiary)"></uni-icons>
                            </view>
                        </view>
                    </scroll-view>

                    <!-- 右侧渐隐羽化蒙版 (常驻半透虚化边缘，消除未截断时的死板感) -->
                    <view
                        class="tags-fade tags-fade--right"
                        :class="{ 'is-hidden': tagsAtEnd }"
                    ></view>
                </view>
            </view>

            <!-- Feed Switcher (为你推荐 / 分类精选) -->
            <view class="feed-switcher-section">
                <view class="feed-switcher">
                    <view
                        class="feed-tab"
                        :class="{ 'is-active': activeFeedTab === 'recommend' }"
                        @click="switchFeedTab('recommend')"
                    >
                        <text class="feed-tab__icon" v-if="activeFeedTab === 'recommend'">✦</text>
                        <text class="feed-tab__text">{{ t('index.feedRecommend') }}</text>
                    </view>
                    <view
                        class="feed-tab"
                        :class="{ 'is-active': activeFeedTab === 'classify' }"
                        @click="switchFeedTab('classify')"
                    >
                        <text class="feed-tab__text">{{ t('index.feedClassify') }}</text>
                    </view>
                </view>
            </view>

            <!-- Mode 1: 为你推荐 (默认，无尽垂直双列瀑布流) -->
            <view v-show="activeFeedTab === 'recommend'" class="feed-recommend-container">
                <!-- 骨架屏：首屏加载时 -->
                <view v-if="recommendLoading && !recommendWallpapers.length" class="feed-skeleton">
                    <view class="sk-col">
                        <view class="sk-card" style="height: 520rpx"></view>
                        <view class="sk-card" style="height: 420rpx"></view>
                        <view class="sk-card" style="height: 480rpx"></view>
                    </view>
                    <view class="sk-col">
                        <view class="sk-card" style="height: 440rpx"></view>
                        <view class="sk-card" style="height: 520rpx"></view>
                        <view class="sk-card" style="height: 400rpx"></view>
                    </view>
                </view>

                <!-- 双列瀑布流布局 -->
                <view v-else class="feed-waterfall">
                    <!-- 左列 -->
                    <view class="waterfall-col">
                        <view
                            v-for="(item, idx) in recommendLeftCol"
                            :key="'l-' + item.id + '-' + idx"
                            class="waterfall-card"
                            hover-class="waterfall-card--active"
                            :hover-stay-time="120"
                            @click="goPreview(item.id, recommendWallpapers)"
                        >
                            <image
                                class="waterfall-card__img"
                                :src="item.smallPicurl || item.picurl"
                                mode="widthFix"
                                lazy-load
                                @load="item.loaded = true"
                                :class="{ 'is-loaded': item.loaded }"
                            ></image>
                            <view class="waterfall-card__overlay"></view>
                            <view class="waterfall-card__meta">
                                <text class="meta-title">{{ getWallTitle(item) }}</text>
                                <view class="meta-footer">
                                    <text class="meta-tag">{{ getWallTag(item) }}</text>
                                    <view class="meta-score" v-if="item.score">
                                        <mdi-icon path="/static/icons/star.svg" size="14px" color="#ffbf66"></mdi-icon>
                                        <text class="score-num">{{ item.score }}</text>
                                    </view>
                                </view>
                            </view>
                            <view class="waterfall-card__lock" v-if="item.is_locked">
                                <uni-icons
                                    v-if="item.effective_access_level === 2 || item.unlock_type === 'vip_only' || item.access_level === 2"
                                    type="vip-filled" size="16" color="#f9e9b5"></uni-icons>
                                <uni-icons v-else type="locked-filled" size="16" color="#f9e9b5"></uni-icons>
                            </view>
                        </view>
                    </view>

                    <!-- 右列 -->
                    <view class="waterfall-col">
                        <view
                            v-for="(item, idx) in recommendRightCol"
                            :key="'r-' + item.id + '-' + idx"
                            class="waterfall-card"
                            hover-class="waterfall-card--active"
                            :hover-stay-time="120"
                            @click="goPreview(item.id, recommendWallpapers)"
                        >
                            <image
                                class="waterfall-card__img"
                                :src="item.smallPicurl || item.picurl"
                                mode="widthFix"
                                lazy-load
                                @load="item.loaded = true"
                                :class="{ 'is-loaded': item.loaded }"
                            ></image>
                            <view class="waterfall-card__overlay"></view>
                            <view class="waterfall-card__meta">
                                <text class="meta-title">{{ getWallTitle(item) }}</text>
                                <view class="meta-footer">
                                    <text class="meta-tag">{{ getWallTag(item) }}</text>
                                    <view class="meta-score" v-if="item.score">
                                        <mdi-icon path="/static/icons/star.svg" size="14px" color="#ffbf66"></mdi-icon>
                                        <text class="score-num">{{ item.score }}</text>
                                    </view>
                                </view>
                            </view>
                            <view class="waterfall-card__lock" v-if="item.is_locked">
                                <uni-icons
                                    v-if="item.effective_access_level === 2 || item.unlock_type === 'vip_only' || item.access_level === 2"
                                    type="vip-filled" size="16" color="#f9e9b5"></uni-icons>
                                <uni-icons v-else type="locked-filled" size="16" color="#f9e9b5"></uni-icons>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- 触底加载状态指示器 -->
                <view class="feed-load-state" v-if="recommendWallpapers.length">
                    <view v-if="recommendLoading" class="feed-loading-pill">
                        <rotate-loading :size="24"></rotate-loading>
                        <text class="loading-text">{{ t('common.loading') }}</text>
                    </view>
                    <text v-else-if="recommendNoMore" class="no-more-text">{{ t('index.feedNoMore') }}</text>
                </view>
            </view>

            <!-- Mode 2: 分类精选 (原 Classify Sections 横滑卡片合辑) -->
            <view v-show="activeFeedTab === 'classify'" class="feed-classify-container">
                <view class="select" v-for="(classify, idx) in randomRecommendComputed" :key="classify.id">
                    <view class="select-watermark">{{ classify.name }}</view>
                    <index-title>
                        <template #name>{{ classify.name }}</template>
                        <template #custom>
                            <button size="mini" class="btn" :class="themeClasses[idx % themeClasses.length]"
                                @click="goClasslist(classify.id, classify.name)">
                                {{ $t('common.seeAll') }}
                            </button>
                        </template>
                    </index-title>

                    <view class="content">
                        <rotate-loading v-if="!classify.data?.length" style="height: 100%"></rotate-loading>
                        <scroll-view scroll-x class="home-scroll" show-scrollbar="false">
                            <view class="box" v-for="item in classify.data" :key="item.id" hover-class="box--active"
                                :hover-stay-time="150" @click="goPreview(item.id, classify.data)">
                                <image class="box-image" :src="item.smallPicurl" mode="aspectFill" lazy-load fade-in>
                                </image>
                                <view v-if="item._timeBadgeKey || item._timeBadge" class="box-badge box-badge--subtle">
                                    {{ item._timeBadgeKey ? $t(`index.${item._timeBadgeKey}`) : item._timeBadge }}
                                </view>
                            </view>
                        </scroll-view>
                    </view>
                </view>
            </view>

            <!-- 底部安全区与悬浮 TabBar 占位 -->
            <view class="tabbar-bottom-spacer"></view>
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
import { ref, computed, onMounted } from 'vue';
import { onShareAppMessage, onShareTimeline, onPageScroll, onReachBottom, onPullDownRefresh, onTabItemTap } from '@dcloudio/uni-app';
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
import { getStatusBarHeight } from '@/utils/layout.js';
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

onPullDownRefresh(async () => {
    await Promise.allSettled([
        getBanner(),
        getRandomDay(),
        getLatest(),
        getDailyFeatured(),
        getRandomRecommend(),
        getRecommendWallpapers(false),
    ]);
    uni.stopPullDownRefresh();
});

// ── 推荐流与分段切换器状态 ──
const activeFeedTab = ref('recommend'); // 'recommend' | 'classify'
const recommendWallpapers = ref([]);
const recommendLeftCol = ref([]);
const recommendRightCol = ref([]);
const recommendLeftHeight = ref(0);
const recommendRightHeight = ref(0);
const recommendPageNum = ref(1);
const recommendLoading = ref(false);
const recommendNoMore = ref(false);

const switchFeedTab = (tab) => {
    if (activeFeedTab.value === tab) return;
    activeFeedTab.value = tab;
};

// 瀑布流双列高度平衡分发算法
const distributeRecommendItems = (newItems = []) => {
    newItems.forEach((item) => {
        const h = Number(item.height) || 600;
        const w = Number(item.width) || 300;
        const virtualHeight = (h / w) * 100;
        if (recommendLeftHeight.value <= recommendRightHeight.value) {
            recommendLeftCol.value.push(item);
            recommendLeftHeight.value += virtualHeight;
        } else {
            recommendRightCol.value.push(item);
            recommendRightHeight.value += virtualHeight;
        }
        recommendWallpapers.value.push(item);
    });
};

const getRecommendWallpapers = async (isAppend = false) => {
    if (recommendLoading.value) return;
    if (!isAppend) {
        recommendPageNum.value = 1;
        recommendNoMore.value = false;
        recommendLeftCol.value = [];
        recommendRightCol.value = [];
        recommendLeftHeight.value = 0;
        recommendRightHeight.value = 0;
        recommendWallpapers.value = [];
    }
    try {
        recommendLoading.value = true;
        const params = {
            pageNum: recommendPageNum.value,
            pageSize: 12,
        };
        if (isAppend && recommendWallpapers.value.length > 0) {
            params.exclude_ids = recommendWallpapers.value.map((i) => i.id);
        }
        const res = await apiPostRecommend(params);
        if (res.code === 200 && res.data) {
            const mapped = res.data.map((item) => ({ ...handlePicUrl(item), loaded: false }));
            distributeRecommendItems(mapped);
            const totalPages = Number(res.pagination?.total_pages || 1);
            recommendNoMore.value = recommendPageNum.value >= totalPages || res.data.length === 0;
        }
    } catch (err) {
        console.error('Failed to load recommend wallpapers:', err);
    } finally {
        recommendLoading.value = false;
    }
};

const loadMoreRecommend = () => {
    if (recommendLoading.value || recommendNoMore.value) return;
    recommendPageNum.value += 1;
    getRecommendWallpapers(true);
};

const getWallTitle = (item) => {
    if (!item) return '';
    if (isEn.value && item.description_en) return item.description_en;
    return item.description || item.classify_name || `Wall #${item.id}`;
};

const getWallTag = (item) => {
    if (!item) return '';
    if (isEn.value && item.classify_name_en) return item.classify_name_en;
    return item.classify_name || t('top10.wallpaper') || '壁纸';
};

const currentBanner = ref(0);
const onBannerChange = (e) => {
    currentBanner.value = Number(e?.detail?.current || 0);
};

// ── 优化4：today 只构造一次，避免模板重渲染时反复 new Date() ──
const _today = new Date();
const todayDate = _today.getDate();
const todayDateStr = todayDate.toString().padStart(2, '0');

// --- Data ---
const rawBannerList = ref([]);
const bannerList = computed(() => {
    return rawBannerList.value.map((item) => {
        const normalized = handlePicUrl(item);
        return { ...normalized, ...getBannerTextMeta(normalized) };
    });
});

const randomDailyList = ref([]);
const dailyFeaturedList = ref([]);
const heroImageLoaded = ref(false);
const randomRecommendList = ref([]);
const latestList = ref([]);
const classifyList = ref([]);
const followingExpanded = ref(false);
const themeClasses = ['is-collection', 'is-keyword', 'is-spotlight', 'is-default'];

// --- Latest pagination ---
const latestLoading = ref(false);
const latestNoMore = ref(false);
const latestQuery = ref({
    pageNum: 1,
    pageSize: 12, // ── 优化6：与 latestPreviewList 截取数对齐，避免多拉无用数据 ──
    ordering: '-created_at',
});

// --- Computed ---
const subscribedClassifyIds = computed(() => libraryStore.subscriptions.classifyIds || []);
const hasSubscriptionSignals = computed(
    () => subscribedClassifyIds.value.length > 0 || libraryStore.subscriptions.tags.length > 0,
);

const subscribedClassifyItems = computed(() =>
    classifyComputed.value.filter((item) => subscribedClassifyIds.value.includes(item.id)),
);

const followingSummary = computed(() => {
    const classifyCount = subscribedClassifyIds.value.length;
    const tagCount = libraryStore.subscriptions.tags.length;
    return tp('index.followingDesc', { classifyCount, tagCount });
});

// ── 优化3：使用响应式 locale ref，语言切换时 computed 会正确重算 ──
const randomRecommendComputed = computed(() => {
    return randomRecommendList.value.map((item) => ({
        ...item,
        name: isEn.value && item.name_en ? item.name_en : item.name,
    }));
});

const classifyComputed = computed(() => {
    return classifyList.value.map((item) => ({
        ...item,
        name: isEn.value && item.name_en ? item.name_en : item.name,
    }));
});

const DAY_MS = 24 * 60 * 60 * 1000;

const getWallDate = (item) => {
    const raw = item?.created_at || item?.updated_at || null;
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
};

const timeCache = {
    todayStart: 0,
    tomorrowStart: 0,
    yesterdayStart: 0,
    lastUpdate: 0,
};

const updateTimeCache = () => {
    const now = Date.now();
    if (now - timeCache.lastUpdate < 60000) return; // 每分钟刷新一次即可
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    timeCache.todayStart = today.getTime();
    timeCache.tomorrowStart = timeCache.todayStart + 86400000;
    timeCache.yesterdayStart = timeCache.todayStart - 86400000;
    timeCache.lastUpdate = now;
};

const isUpdatedToday = (item) => {
    const date = getWallDate(item);
    if (!date) return false;
    updateTimeCache();
    const t = date.getTime();
    return t >= timeCache.todayStart && t < timeCache.tomorrowStart;
};

const isUpdatedYesterday = (item) => {
    const date = getWallDate(item);
    if (!date) return false;
    updateTimeCache();
    const t = date.getTime();
    return t >= timeCache.yesterdayStart && t < timeCache.todayStart;
};

const isUpdatedWithinDays = (item, days = 5) => {
    const date = getWallDate(item);
    if (!date) return false;
    const diff = Date.now() - date.getTime();
    return diff >= 0 && diff <= days * DAY_MS;
};

const getTimeBadgeKey = (item) =>
    isUpdatedToday(item)
        ? 'justIn'
        : isUpdatedYesterday(item)
            ? 'new'
            : isUpdatedWithinDays(item, 5)
                ? 'latest'
                : '';

const addTimeBadge = (item) => {
    item._timeBadgeKey = getTimeBadgeKey(item);
    return item;
};

const toTimelineDate = (item) => {
    const raw = item?.created_at || item?.updated_at || Date.now();
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? new Date() : date;
};

const getBannerTextMeta = (item) => {
    const url = String(item.url || '');
    const decodedUrl = decodeURIComponent(url);

    const nameMatch = decodedUrl.match(/name=([^&]+)/);
    const nameEnMatch = decodedUrl.match(/name_en=([^&]+)/);
    const keywordMatch = decodedUrl.match(/keyword=([^&]+)/);
    const rawTitle = nameMatch?.[1] || (keywordMatch?.[1] ? `#${keywordMatch[1]}` : '');
    const rawTitleEn = nameEnMatch?.[1] || rawTitle;

    const type = (() => {
        if (url.includes('/pages/app/classlist')) return 'classify';
        if (url.includes('/wall/search/')) return 'search';
        if (url.includes('/preview')) return 'preview';
        if (item.target === 'miniProgram') return 'miniProgram';
        return 'default';
    })();

    const configMap = {
        classify: {
            desc: t('index.banner.classifyDesc'),
            badge: t('index.banner.badge.classify'),
            meta: t('index.banner.meta.classify'),
            accent: 'is-collection',
        },
        search: {
            desc: t('index.banner.searchDesc'),
            badge: t('index.banner.badge.search'),
            meta: t('index.banner.meta.search'),
            accent: 'is-keyword',
        },
        preview: {
            desc: t('index.banner.previewDesc'),
            badge: t('index.banner.badge.spotlight'),
            meta: t('index.banner.meta.preview'),
            accent: 'is-spotlight',
        },
        miniProgram: {
            desc: t('index.banner.defaultDesc'),
            badge: t('index.banner.badge.miniProgram'),
            meta: t('index.banner.meta.default'),
            accent: 'is-default',
        },
        default: {
            desc: t('index.banner.defaultDesc'),
            badge: t('index.banner.badge.default'),
            meta: t('index.banner.meta.default'),
            accent: 'is-default',
        },
    };

    const targetMap = {
        self: t('index.banner.target.self'),
        miniProgram: t('index.banner.target.miniProgram'),
        external: t('index.banner.target.external'),
    };

    const config = configMap[type];

    return {
        title:
            (isEn.value && rawTitleEn ? rawTitleEn : rawTitle) ||
            (type === 'miniProgram' ? t('index.banner.discoverMore') : t('index.banner.defaultTitle')),
        desc:
            (isEn.value && item.description_en ? item.description_en : item.description) ||
            (item && item.title && item.title.includes('必应') ? t('index.banner.bingDesc') : config.desc),
        badge: config.badge,
        targetLabel: targetMap[item.target] || targetMap.external,
        metaLabel: config.meta,
        accentClass: config.accent,
    };
};

// --- Data fetching ---
const getBanner = async () => {
    let res = await apiGetBanner();
    rawBannerList.value = res.data;
};

const getRandomDay = async () => {
    let res = await apiGetRandomDay();
    randomDailyList.value = res.data.map((item) => addTimeBadge(handlePicUrl(item)));
};

const getDailyFeatured = async () => {
    try {
        let res = await apiGetDailyFeatured();
        if (res && res.data) {
            dailyFeaturedList.value = res.data.map((item) => addTimeBadge(handlePicUrl(item)));
        }
    } catch (e) {
        console.warn('apiGetDailyFeatured failed:', e);
    }
};

const getRandomRecommend = async () => {
    let res = await apiGetRandomRecommend({ classify_ids: '30,62,2,12,10,11,6,9' });
    randomRecommendList.value = res.data.map((classify) => ({
        ...classify,
        data: classify.data.map((item) => addTimeBadge(handlePicUrl(item))),
    }));
};

const getLatest = async (isAppend = false) => {
    if (latestLoading.value || (isAppend && latestNoMore.value)) return;
    try {
        latestLoading.value = true;
        if (!isAppend) {
            latestQuery.value.pageNum = 1;
            latestNoMore.value = false;
        }
        const res = await apiGetClassList(latestQuery.value);
        // ── 优化5：追加时只排新数据再 merge，不对整个列表重排 ──
        const nextList = (res.data || [])
            .map((item) => addTimeBadge(handlePicUrl(item)))
            .sort((a, b) => toTimelineDate(b).getTime() - toTimelineDate(a).getTime());

        latestList.value = isAppend ? [...latestList.value, ...nextList] : nextList;
        const totalPages = Number(res?.pagination?.total_pages || 1);
        latestNoMore.value = latestQuery.value.pageNum >= totalPages || nextList.length === 0;
    } finally {
        latestLoading.value = false;
    }
};

const checkUpdates = async () => {
    let lastTime = statusStore.appStatus.lastViewedWallpaperTime;
    if (!lastTime) {
        // 首次若无记录，以24小时前为基准，让初次使用的用户能感知今日上新
        lastTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        statusStore.setLastViewedWallpaperTime(lastTime);
    }
    try {
        const res = await apiGetCheckUpdates({ since: lastTime });
        if (res.data?.new_count > 0) {
            statusStore.newWallpapersCount = res.data.new_count;
        }
    } catch (e) {
        console.error('Check updates failed', e);
    }
};

const goTimeline = () => {
    const unread = statusStore.newWallpapersCount;
    // 隐藏横幅
    statusStore.newWallpapersCount = 0;
    uni.navigateTo({ url: `/pages/app/timeline?unreadCount=${unread}` });
};

// --- Navigation ---
const goBannerPreview = (data) => {
    if (data.wall) {
        const wallList = handlePicUrl(data.wall);
        appStore.wallList = [wallList];
    }
    uni.navigateTo({ url: data.url });
};

const goPreview = (id, data) => {
    appStore.wallList = data;
    uni.navigateTo({ url: '/pages/app/preview?id=' + id });
};

const goSearchByTag = (tag) => {
    if (isAdmin.value) {
        libraryStore.bumpPreferredTag(tag);
    }
    uni.navigateTo({ url: `/pages/app/search?keyword=${encodeURIComponent(tag)}` });
};

const goClassify = (item) => {
    if (!item?.id) return;
    uni.navigateTo({ url: `/pages/app/classlist?id=${item.id}&name=${encodeURIComponent(item.name || '')}` });
};

const toggleFollowingExpanded = () => {
    followingExpanded.value = !followingExpanded.value;
};

const goClasslist = (id, name) => {
    uni.navigateTo({ url: `/pages/app/classlist?id=${id}&name=${name}` });
};

const isRefreshing = ref(false);

const refreshRandom = async () => {
    if (isRefreshing.value) return;
    isRefreshing.value = true;
    heroImageLoaded.value = false;
    try {
        await Promise.all([getRandomDay(), getRandomRecommend()]);
    } catch (e) {
        console.error('Refresh random error:', e);
    } finally {
        setTimeout(() => {
            isRefreshing.value = false;
        }, 600);
    }
};

const popularTags = computed(() => {
    const rawTags = t('category.tagList') || '';
    return rawTags.split(',').map((tag) => tag.trim()).filter(Boolean);
});

const searchTag = (tag) => {
    uni.navigateTo({
        url: '/pages/app/search?keyword=' + encodeURIComponent(tag)
    });
};

const tagsScrolledLeft = ref(false);
const tagsAtEnd = ref(false);
const tagsScrollLeft = ref(0);
let tagsCurrentScroll = 0;

const onTagsScroll = (e) => {
    const { scrollLeft } = e.detail;
    tagsCurrentScroll = scrollLeft;
    tagsScrolledLeft.value = scrollLeft > 15;
    tagsAtEnd.value = false;
};

const onTagsScrollToLower = () => {
    tagsAtEnd.value = true;
};

const goSearchPage = () => {
    uni.navigateTo({
        url: '/pages/app/search'
    });
};

onMounted(() => {
    // ── 优化：分优先级延时加载，错峰发请求，减少首屏并发竞争 ──
    // P1 立即：首屏可见的关键数据
    getBanner();
    getRandomDay();
    getLatest();
    checkUpdates(); // 静默检查更新

    // P2 延时 300ms：首屏次要数据，让 P1 的渲染先跑起来
    setTimeout(() => {
        getDailyFeatured();
    }, 300);

    // P3 延时 800ms：需要滚动才能看到，完全错峰
    setTimeout(() => {
        getRandomRecommend();
        getRecommendWallpapers(false);
    }, 800);
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
.home-page {
    position: relative;
    width: 100%;
    min-height: 100vh;
    background-color: var(--page-background);
    box-sizing: border-box;

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
    box-sizing: border-box;
    animation: homeEntrance 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.banner {
    width: 750rpx;
    padding: 0 0 4rpx;

    .banner-carousel-wrap {
        position: relative;
        width: 750rpx;
    }

    .banner-swiper {
        width: 750rpx;
        height: 410rpx;
        margin: 0 0 12rpx;
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
        box-sizing: border-box;
        box-shadow: 
            0 16rpx 40rpx -8rpx rgba(15, 23, 42, 0.16),
            0 4rpx 14rpx rgba(0, 0, 0, 0.06);
        @extend %sk-shimmer;

        .theme-dark & {
            border: 1rpx solid rgba(255, 255, 255, 0.12);
            box-shadow: 0 20rpx 48rpx rgba(0, 0, 0, 0.5);
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
        border: 1rpx solid rgba(40, 179, 137, 0.22);
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
            border-color: rgba(40, 179, 137, 0.25);
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

    &:active {
        background: var(--page-background-secondary);
    }
}

.select {
    position: relative;
    overflow: hidden;

    .select-watermark {
        position: absolute;
        top: -32rpx;
        right: -10rpx;
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
        letter-spacing: 0.4rpx;
        box-sizing: border-box;
        transition: transform 0.12s cubic-bezier(0.2, 0.9, 0.3, 1), background 0.15s, color 0.15s;

        &::after {
            border: none;
        }

        // 浅色模式：实体纯白微浮岛胶囊，质感扎实、轮廓清晰，不轻飘，与顶部深色药丸形成黑白反差层次
        .theme-light & {
            background-color: #ffffff;
            color: #1e293b;
            font-weight: 650;
            border: 1rpx solid rgba(15, 23, 42, 0.09);
            box-shadow: 0 3rpx 10rpx rgba(15, 23, 42, 0.06);

            &:active {
                background-color: #f8fafc;
                transform: scale(0.95);
            }
        }

        // 深色模式：高质感暗夜卡片微胶囊
        .theme-dark & {
            background-color: #242a38;
            color: #f1f5f9;
            font-weight: 650;
            border: 1rpx solid rgba(255, 255, 255, 0.12);
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
            white-space: nowrap;
            height: 100%;
            box-sizing: border-box;

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
        border: 1rpx solid rgba(255, 255, 255, 0.1);
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

        // 深色模式：与最热/最新保持一致的暗夜黑蓝底 + 细腻微光描边 + 白字
        .theme-dark & {
            background: #252b38;
            border: 1rpx solid rgba(255, 255, 255, 0.14);
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

    .waterfall-col {
        flex: 1;
        width: calc(50% - 10rpx);
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
        transform: scale(0.97);
        box-shadow: 0 2rpx 8rpx var(--shadow-color);
    }

    &__img {
        width: 100%;
        display: block;
        opacity: 0;
        transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);

        &.is-loaded {
            opacity: 1;
        }
    }

    &__overlay {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 160rpx;
        // 贴底极简柔和渐变：仅覆盖底部2行文字保护区，上方完全通透无阴影
        background: linear-gradient(to top, rgba(0, 0, 0, 0.58) 0%, rgba(0, 0, 0, 0.18) 55%, rgba(0, 0, 0, 0) 100%);
        pointer-events: none;

        .theme-light & {
            background: linear-gradient(to top, rgba(0, 0, 0, 0.46) 0%, rgba(0, 0, 0, 0.12) 55%, rgba(0, 0, 0, 0) 100%);
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
            line-height: 1.25;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
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
}

.tabbar-bottom-spacer {
    width: 100%;
    height: calc(96px + env(safe-area-inset-bottom));
}
</style>
