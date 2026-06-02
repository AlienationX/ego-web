<template>
    <view
        class="homeLayout"
        :class="['homeLayout--' + activeHomeTab, isDark ? 'theme-dark' : 'theme-light']"
        :style="{
            '--mask-color': pageBackgroundVar,
            backgroundColor: pageBackgroundVar,
            height: activeHomeTab !== 'home' ? '100vh' : 'auto',
            overflow: activeHomeTab !== 'home' ? 'hidden' : 'visible',
        }"
    >
        <!-- #ifndef WEB -->
        <view class="home-statusbar" :style="{ height: statusBarHeight + 'px', backgroundColor: pageBackgroundVar }"></view>
        <!-- #endif -->

        <view
            class="home-titlebar"
            :class="{ 'is-hidden': !isTitleBarVisible, 'is-dark': isDarkTab }"
            :style="{
                paddingTop: statusBarHeight + 'px',
                height: navBarHeight + 'px',
                paddingRight: titlebarPaddingRight,
                backgroundColor: pageBackgroundVar,
            }"
        >
            <view class="home-titlebar__inner" :style="{ height: titleBarHeight + 'px' }">
                <view class="home-tabs-wrapper">
                    <scroll-view scroll-x class="home-tabs" show-scrollbar="false">
                        <view class="home-tabs__inner">
                            <view
                                v-for="tab in homeTabs"
                                :key="tab.key"
                                class="home-tab"
                                :class="{ 'is-active': activeHomeTab === tab.key }"
                                @click="switchHomeTab(tab.key)"
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
                    <text class="home-search__text">{{ t('common.search') }}</text>
                </view>
                <!-- #endif -->
            </view>
        </view>

        <view v-show="activeHomeTab === 'home'" class="home-channel home-channel--main">
            <view class="home-titlebar-spacer" :style="{ height: navBarHeight + 'px' }"></view>
            <view class="banner">
                <swiper indicator-dots indicator-color="rgba(255,255,255,0.5)" indicator-active-color="#fff" autoplay circular>
                    <swiper-item v-for="item in bannerList" :key="item.id">
                        <navigator
                            v-if="item.target == 'miniProgram'"
                            :url="item.url"
                            target="miniProgram"
                            :app-id="item.appid"
                            :class="['banner-card', item.accentClass]"
                        >
                            <image :src="item.picurl" mode="aspectFill"></image>
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
                                    <view class="banner-card__meta-arrow">
                                        <uni-icons type="right" size="14" color="#e8eef8"></uni-icons>
                                    </view>
                                </view>
                            </view>
                        </navigator>

                        <view v-else :class="['banner-card', item.accentClass]" @click="goBannerPreview(item)">
                            <image :src="item.mediumPicurl" mode="aspectFill"></image>
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
                                    <view class="banner-card__meta-arrow">
                                        <uni-icons type="right" size="14" color="#e8eef8"></uni-icons>
                                    </view>
                                </view>
                            </view>
                        </view>
                    </swiper-item>
                </swiper>
            </view>

            <view class="notice">
                <view class="left">
                    <uni-icons type="sound-filled" size="20" color="#28B389"></uni-icons>
                    <text class="text">{{ $t('index.notice') }}</text>
                </view>

                <view class="center">
                    <swiper vertical interval="1500" duration="300" autoplay circular>
                        <swiper-item v-for="item in noticeList" :key="item.id">
                            <navigator :url="`/pages/app/notice-detail?id=${item.id}&name=${item.title}`">
                                {{ item.title }}
                            </navigator>
                        </swiper-item>
                    </swiper>
                </view>

                <view class="right">
                    <uni-icons type="right" size="16" :color="isDark ? 'rgba(255, 255, 255, 0.9)' : '#334155'"></uni-icons>
                </view>
            </view>

            <view class="select">
                <view class="select-watermark">Daily</view>
                <index-title>
                    <template #name>{{ $t('index.dailyRecommend') }}</template>
                    <template #custom>
                        <view class="date">
                            <uni-icons type="calendar" size="20" :color="isDark ? 'rgba(255, 255, 255, 0.9)' : '#334155'"></uni-icons>
                            <view class="text">
                                {{ new Date().getDate().toString().padStart(2, '0') }}{{ $t('common.day') }}
                            </view>
                            <button class="button is-spotlight" size="mini" @click="refreshRandom">
                                {{ $t('common.refresh') }}
                            </button>
                        </view>
                    </template>
                </index-title>

                <view class="content">
                    <rotate-loading v-if="!randomDailyList.length" style="height: 100%"></rotate-loading>
                    <scroll-view scroll-x>
                        <view
                            class="box"
                            v-for="(item, idx) in randomDailyList"
                            :key="item.id"
                            :class="{ 'is-hero': idx === 0 }"
                            @click="goPreview(item.id, randomDailyList)"
                        >
                            <image
                                :src="idx === 0 ? item.mediumPicurl || item.picurl : item.smallPicurl"
                                mode="aspectFill"
                                lazy-load
                                fade-in
                                @load="idx === 0 ? heroImageLoaded = true : null"
                            ></image>
                            <block v-if="idx === 0">
                                <view class="box-hero-overlay" :class="{ 'is-visible': heroImageLoaded }"></view>
                                <view class="box-hero-content" :class="{ 'is-visible': heroImageLoaded }">
                                    <view class="day-tag">{{ new Date().getDate() }}</view>
                                    <view class="pick-text">PICK OF THE DAY</view>
                                </view>
                            </block>
                            <block v-else>
                                <view v-if="getTimeBadge(item)" class="box-badge box-badge--subtle">{{
                                    getTimeBadge(item)
                                }}</view>
                            </block>
                        </view>
                    </scroll-view>
                </view>
            </view>

            <view class="select">
                <view class="select-watermark">Latest</view>
                <index-title>
                    <template #name>{{ $t('index.latestRelease') }}</template>
                    <template #custom>
                        <button size="mini" class="btn is-default" @click="goTimeline">{{ $t('common.seeAll') }}</button>
                    </template>
                </index-title>

                <view class="content">
                    <rotate-loading v-if="!latestList.length" style="height: 100%"></rotate-loading>
                    <scroll-view scroll-x>
                        <view
                            class="box"
                            v-for="(item, idx) in latestPreviewList"
                            :key="item.id"
                            @click="goPreview(item.id, latestList)"
                        >
                            <image :src="item.smallPicurl" mode="aspectFill" lazy-load fade-in></image>
                            <view v-if="getTimeBadge(item)" class="box-badge">{{ getTimeBadge(item) }}</view>
                        </view>
                    </scroll-view>
                </view>
            </view>

            <!-- 订阅提醒 -->
            <view v-if="isAdmin && hasSubscriptionSignals" class="signal-callout">
                <view class="signal-callout__main">
                    <view class="signal-callout__content">
                        <view class="signal-callout__eyebrow">{{ t('index.followingEyebrow') }}</view>
                        <view class="signal-callout__title">{{ t('index.followingTitle') }}</view>
                        <view class="signal-callout__desc">{{ followingSummary }}</view>
                    </view>
                    <view class="signal-callout__action" @click="toggleFollowingExpanded">
                        {{ followingExpanded ? t('index.followingCollapse') : t('index.followingExpand') }}
                    </view>
                </view>

                <view v-if="followingExpanded" class="signal-callout__panel">
                    <view v-if="subscribedClassifyItems.length" class="signal-group">
                        <view class="signal-group__title">{{ t('subscriptionPage.classifyTitle') }}</view>
                        <view class="signal-group__chips">
                            <view
                                v-for="item in subscribedClassifyItems"
                                :key="item.id"
                                class="signal-chip"
                                @click="goClassify(item)"
                            >
                                {{ item.name }}
                            </view>
                        </view>
                    </view>

                    <view v-if="libraryStore.subscriptions.tags.length" class="signal-group">
                        <view class="signal-group__title">{{ t('subscriptionPage.tagTitle') }}</view>
                        <view class="signal-group__chips">
                            <view
                                v-for="tag in libraryStore.subscriptions.tags"
                                :key="tag"
                                class="signal-chip signal-chip--tag"
                                @click="goSearchByTag(tag)"
                            >
                                #{{ tag }}
                            </view>
                        </view>
                    </view>

                    <navigator url="/pages/user/subscriptions" class="signal-manage">
                        {{ t('index.followingManage') }}
                        <uni-icons type="right" size="14" color="#dbeafe"></uni-icons>
                    </navigator>
                </view>
            </view>

            <!-- 猜你喜欢 -->
            <!-- <view v-if="isAdmin && forYouList.length" class="select select--compact">
            <view class="select-watermark">For You</view>
            <index-title>
                <template #name>{{ t('index.forYouTitle') }}</template>
                <template #custom>
                    <navigator class="box" url="/pages/user/preferences">
                        <button size="mini" class="btn is-default">{{ t('user.settings.preferences') }}</button>
                    </navigator>
                </template>
            </index-title>

            <view class="for-you-groups">
                <view v-for="group in forYouGroups" :key="group.key" class="for-you-group">
                    <view class="for-you-group__head">
                        <view class="for-you-group__title">{{ group.title }}</view>
                        <view class="for-you-group__meta">{{ group.meta }}</view>
                    </view>
                    <view class="content content--compact">
                        <scroll-view scroll-x>
                            <view
                                class="box"
                                v-for="item in group.items"
                                :key="`${group.key}-${item.id}`"
                                @click="goPreview(item.id, group.items)"
                            >
                                <image :src="item.smallPicurl || item.picurl" mode="aspectFill"></image>
                                <view v-if="getTimeBadge(item)" class="box-badge">{{ getTimeBadge(item) }}</view>
                            </view>
                        </scroll-view>
                    </view>
                </view>
            </view>
            <view v-if="signalTags.length" class="tag-strip">
                <view class="tag-strip__label">{{ t('index.forYouSignals') }}</view>
                <scroll-view scroll-x class="tag-strip__scroll" show-scrollbar="false">
                    <view class="tag-strip__inner">
                        <view v-for="tag in signalTags" :key="tag" class="tag-strip__pill" @click="goSearchByTag(tag)">
                            #{{ tag }}
                        </view>
                    </view>
                </scroll-view>
            </view>
        </view> -->

            <navigator class="top-entry" url="/pages/app/topN">
                <view class="top-entry__content">
                    <!-- <view class="top-entry__eyebrow">Top N</view> -->
                    <view class="top-entry__title">{{ $t('top10.title') }}</view>
                    <view class="top-entry__desc">{{ $t('top10.descViews') }}</view>
                    <view class="top-entry__action">
                        <text class="top-entry__action-text">{{ $t('common.seeAll') }}</text>
                        <uni-icons type="right" size="18" color="#ffffff"></uni-icons>
                    </view>
                </view>
                <image
                    class="top-entry__visual"
                    :src="topCardImageURL"
                    mode="heightFix"
                ></image>
            </navigator>

            <view class="select" v-for="(classify, idx) in randomRecommendComputed" :key="classify.id">
                <view class="select-watermark">{{ classify.name }}</view>
                <index-title>
                    <template #name>{{ classify.name }}</template>
                    <template #custom>
                        <button
                            size="mini"
                            class="btn"
                            :class="themeClasses[idx % themeClasses.length]"
                            @click="goClasslist(classify.id, classify.name)"
                        >
                            {{ $t('common.seeAll') }}
                        </button>
                    </template>
                </index-title>

                <view class="content">
                    <rotate-loading v-if="!classify" style="height: 100%"></rotate-loading>
                    <scroll-view scroll-x>
                        <view
                            class="box"
                            v-for="item in classify.data"
                            :key="item.id"
                            @click="goPreview(item.id, classify.data)"
                        >
                            <image :src="item.smallPicurl" mode="aspectFill" lazy-load fade-in></image>
                            <view v-if="getTimeBadge(item)" class="box-badge box-badge--subtle">{{ getTimeBadge(item) }}</view>
                        </view>
                    </scroll-view>
                </view>

                <view v-if="idx % 3 === 0" class="ad-slot" :class="{ ready: adVisibleMap[`mid-${idx}`] }">
                    <custom-ad-banner @load="onAdLoad(`mid-${idx}`)" @error="onAdError(`mid-${idx}`)"></custom-ad-banner>
                </view>
            </view>

            <view class="classify">
                <index-title>
                    <template #name>{{ $t('index.categoryRecommend') }}</template>
                    <template #custom>
                        <navigator url="/pages/app/classify" open-type="reLaunch" class="more"
                            >{{ $t('common.more') }}+</navigator
                        >
                    </template>
                </index-title>

                <rotate-loading v-if="!classifyList.length" style="height: 100%"></rotate-loading>

                <view class="content classify-grid" v-if="classifyList.length">
                    <classify-item
                        v-for="(item, idx) in classifyPreviewList"
                        :key="item.id"
                        :item="item"
                        :layout-style="getLayoutStyleForIndex(idx)"
                    ></classify-item>
                    <!-- <classify-item :isMore="true" :layout-style="getLayoutStyleMore()"></classify-item> -->
                </view>
            </view>

            <view class="ad-slot ad-slot-bottom" :class="{ ready: adVisibleMap.bottom }">
                <custom-ad-banner @load="onAdLoad('bottom')" @error="onAdError('bottom')"></custom-ad-banner>
            </view>
        </view>

        <view v-show="activeHomeTab === 'recommend'" class="home-channel home-channel--recommend">
            <tabbed-pics-view
                :tabs="recommendTabs"
                :show-header="false"
                :tabs-height="0"
                :header-height="navBarHeight"
                api-type="recommend"
                layout-mode="waterfall"
                :show-card-meta="true"
                @scroll="handleEmbeddedScroll"
            ></tabbed-pics-view>
        </view>

        <view v-show="activeHomeTab === 'latest'" class="home-channel home-channel--latest">
            <timeline-page embedded :nav-bar-height="navBarHeight" @scroll="handleEmbeddedScroll"></timeline-page>
        </view>

        <view v-show="activeHomeTab === 'hot'" class="home-channel home-channel--hot">
            <top-n-page embedded :nav-bar-height="navBarHeight" @scroll="handleEmbeddedScroll"></top-n-page>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { onLoad, onPullDownRefresh, onReachBottom, onShareAppMessage, onShareTimeline, onPageScroll } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import {
    apiGetBanner,
    apiGetRandomDay,
    apiGetRandomRecommend,
    apiGetNotice,
    apiGetClassify,
    apiGetClassList,
} from '@/api/wallpaper.js';
import { PICS_BASE_URL } from '@/common/config.js';
import { handlePicUrl } from '@/utils/common.js';
import { useLibraryStore } from '@/stores/library.js';
import { useUserStore } from '@/stores/user.js';
import { useSettingsStore } from '@/stores/settings.js';
import { getStatusBarHeight, getTitleBarHeight, getNavBarHeight } from '@/utils/system.js';
import TimelinePage from '@/pages/app/timeline.vue';
import TopNPage from '@/pages/app/topN.vue';
const { t } = useI18n();
const libraryStore = useLibraryStore();
const userStore = useUserStore();
const settingsStore = useSettingsStore();

const isDark = computed(() => settingsStore.isDark);

const topCardImageURL = ref(PICS_BASE_URL + '/insets/1699281368061_2-removebg-preview.png');

const statusBarHeight = ref(getStatusBarHeight() || 0);
const navBarHeight = ref(getNavBarHeight() || 0);
const titleBarHeight = ref(getTitleBarHeight() || 0);
const isTitleBarVisible = ref(true);
let lastScrollTop = 0;

const activeHomeTab = ref('home');

/** 与 theme-variables.scss 的 --page-background 一致，依赖根节点 theme-light/theme-dark */
const pageBackgroundVar = 'var(--page-background)';

const isDarkTab = computed(() => {
    if (activeHomeTab.value === 'home') {
        return isDark.value;
    }
    return isDark.value;
});

const searchIconColor = computed(() => {
    return isDarkTab.value ? 'rgba(255, 255, 255, 0.7)' : '#64748b';
});

const SCROLL_DEAD_ZONE = 5;

const updateTitleBarVisibleByScroll = (scrollTop) => {
    const currentScrollTop = Math.max(0, Number(scrollTop) || 0);
    const scrollDelta = currentScrollTop - lastScrollTop;
    
    if (Math.abs(scrollDelta) > SCROLL_DEAD_ZONE) {
        if (currentScrollTop > titleBarHeight.value) {
            if (scrollDelta > 0) {
                isTitleBarVisible.value = false;
            } else {
                isTitleBarVisible.value = true;
            }
        } else {
            isTitleBarVisible.value = true;
        }
        lastScrollTop = currentScrollTop;
    }
};

onPageScroll((e) => {
    updateTitleBarVisibleByScroll(e.scrollTop);
});

const handleEmbeddedScroll = (e) => {
    updateTitleBarVisibleByScroll(e.scrollTop);
};

uni.$on('app-scroll', (scrollTop) => {
    updateTitleBarVisibleByScroll(scrollTop);
});

const titlebarPaddingRight = computed(() => {
    // #ifdef MP-WEIXIN
    const menuButtonInfo = uni.getMenuButtonBoundingClientRect ? uni.getMenuButtonBoundingClientRect() : null;
    if (menuButtonInfo) {
        const sysInfo = uni.getSystemInfoSync();
        return sysInfo.windowWidth - menuButtonInfo.left + 10 + 'px';
    }
    // #endif
    return '20rpx';
});
const homeTabs = computed(() => [
    { key: 'home', label: t('index.tabs.home') },
    { key: 'recommend', label: t('index.tabs.recommend') },
    { key: 'latest', label: t('index.tabs.latest') },
    { key: 'hot', label: t('index.tabs.hot') },
]);
const bannerList = ref([]);
const randomDailyList = ref([]);
const heroImageLoaded = ref(false);
const randomRecommendList = ref([]);
const latestList = ref([]);
const noticeList = ref([]);
const classifyList = ref([]);
const adVisibleMap = reactive({});
const followingExpanded = ref(false);
const themeClasses = ['is-collection', 'is-keyword', 'is-spotlight', 'is-default'];
const isAdmin = computed(() => !!userStore.isAdmin);
const latestLoading = ref(false);
const latestNoMore = ref(false);
const latestQuery = ref({
    pageNum: 1,
    pageSize: 12,
    ordering: '-updated_at',
});
const activeTopMetric = ref('views');
const topLoading = ref(false);
const topRankedList = ref([]);
const recommendTabs = computed(() => [
    {
        label: '最新推荐',
        query: {
            ordering: '-updated_at',
        },
    },
]);
const recentViewedList = computed(() => libraryStore.recentViewed.slice(0, 8));
const preferredTagList = computed(() => libraryStore.preferredTags.slice(0, 10));
const signalTags = computed(() =>
    [...new Set([...libraryStore.subscriptions.tags, ...libraryStore.preferredTags])].slice(0, 10),
);
const subscribedClassifyIds = computed(() => libraryStore.subscriptions.classifyIds || []);
const hasSubscriptionSignals = computed(
    () => subscribedClassifyIds.value.length > 0 || libraryStore.subscriptions.tags.length > 0,
);

const normalizeTags = (item = {}) => {
    if (Array.isArray(item.tabs_list)) return item.tabs_list.filter(Boolean);
    if (typeof item.tabs === 'string') {
        return item.tabs
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean);
    }
    return [];
};

const flattenRecommendPool = computed(() => {
    const merged = [...latestList.value, ...randomRecommendList.value.flatMap((item) => item.data || [])];
    const seen = new Set();
    return merged.filter((item) => {
        if (!item?.id || seen.has(item.id) || (isAdmin.value && libraryStore.isWallHidden(item))) return false;
        seen.add(item.id);
        return true;
    });
});

const subscribedClassifyNames = computed(() =>
    classifyComputed.value.filter((item) => subscribedClassifyIds.value.includes(item.id)).map((item) => item.name),
);

const subscribedClassifyItems = computed(() =>
    classifyComputed.value.filter((item) => subscribedClassifyIds.value.includes(item.id)),
);

const followingSummary = computed(() => {
    const classifyCount = subscribedClassifyIds.value.length;
    const tagCount = libraryStore.subscriptions.tags.length;
    return t('index.followingDesc', { classifyCount, tagCount });
});

const getItemsByClassifyName = (name) =>
    flattenRecommendPool.value.filter((item) => name && item.classify_name && item.classify_name.includes(name)).slice(0, 8);

const getItemsByTag = (tag) => flattenRecommendPool.value.filter((item) => normalizeTags(item).includes(tag)).slice(0, 8);

const forYouGroups = computed(() => {
    const groups = [];

    subscribedClassifyItems.value.slice(0, 2).forEach((item) => {
        const items = getItemsByClassifyName(item.name);
        if (!items.length) return;
        groups.push({
            key: `classify-${item.id}`,
            title: item.name,
            meta: t('index.forYouCategory'),
            items,
        });
    });

    libraryStore.subscriptions.tags.slice(0, 2).forEach((tag) => {
        const items = getItemsByTag(tag);
        if (!items.length) return;
        groups.push({
            key: `tag-${tag}`,
            title: `#${tag}`,
            meta: t('index.forYouTag'),
            items,
        });
    });

    libraryStore.preferredTags.slice(0, 2).forEach((tag) => {
        if (libraryStore.subscriptions.tags.includes(tag)) return;
        const items = getItemsByTag(tag);
        if (!items.length) return;
        groups.push({
            key: `preference-${tag}`,
            title: `#${tag}`,
            meta: t('index.forYouRecentPreference'),
            items,
        });
    });

    return groups.slice(0, 4);
});

const forYouList = computed(() => {
    const seen = new Set();
    return forYouGroups.value
        .flatMap((group) => group.items)
        .filter((item) => {
            if (!item?.id || seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });
});

const randomRecommendComputed = computed(() => {
    return randomRecommendList.value.map((item) => ({
        ...item,
        name: uni.getLocale() === 'en' ? item.name_en : item.name,
    }));
});

const classifyComputed = computed(() => {
    return classifyList.value.map((item) => ({
        ...item,
        name: uni.getLocale() === 'en' ? item.name_en : item.name,
    }));
});

const classifyPreviewList = computed(() => classifyComputed.value.slice(0, 8));
const latestPreviewList = computed(() => latestList.value.slice(0, 10));
const DAY_MS = 24 * 60 * 60 * 1000;

const getBadgeCopy = () => {
    const isZh = String(uni.getLocale() || '').startsWith('zh');
    return isZh
        ? {
              justIn: '刚更新',
              latest: '近期',
              new: '新',
          }
        : {
              justIn: 'JUST IN',
              latest: 'LATEST',
              new: 'NEW',
          };
};

const getWallDate = (item) => {
    const raw = item?.updated_at || item?.created_at || null;
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
};

const isUpdatedToday = (item) => {
    const date = getWallDate(item);
    if (!date) return false;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    return date.getTime() >= todayStart.getTime() && date.getTime() < tomorrowStart.getTime();
};

const isUpdatedYesterday = (item) => {
    const date = getWallDate(item);
    if (!date) return false;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    return date.getTime() >= yesterdayStart.getTime() && date.getTime() < todayStart.getTime();
};

const isUpdatedWithinDays = (item, days = 5) => {
    const date = getWallDate(item);
    if (!date) return false;
    const diff = Date.now() - date.getTime();
    return diff >= 0 && diff <= days * DAY_MS;
};

const getTimeBadge = (item) =>
    isUpdatedToday(item)
        ? getBadgeCopy().justIn
        : isUpdatedYesterday(item)
          ? getBadgeCopy().new
          : isUpdatedWithinDays(item, 5)
            ? getBadgeCopy().latest
            : '';

const monthNamesEn = [
    'JANUARY',
    'FEBRUARY',
    'MARCH',
    'APRIL',
    'MAY',
    'JUNE',
    'JULY',
    'AUGUST',
    'SEPTEMBER',
    'OCTOBER',
    'NOVEMBER',
    'DECEMBER',
];
const weekdayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const weekdayNamesZh = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const isZhLocale = computed(() => String(uni.getLocale() || '').startsWith('zh'));

const toTimelineDate = (item) => {
    const raw = item?.updated_at || item?.created_at || Date.now();
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? new Date() : date;
};

const getMonthText = (date) => (isZhLocale.value ? `${date.getMonth() + 1}月` : monthNamesEn[date.getMonth()]);
const getDayLabel = (date) =>
    isZhLocale.value
        ? `${weekdayNamesZh[date.getDay()]} ${date.getMonth() + 1}月`
        : `${weekdayNamesEn[date.getDay()]} / ${monthNamesEn[date.getMonth()].slice(0, 3)}`;
const getMonthKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}`;
const getDayKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

const formatTimelineTime = (item) => {
    const date = toTimelineDate(item);
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
};

const formatRecentTag = (count) => (isZhLocale.value ? `最新 ${count} 张` : `LATEST ${count}`);

const latestMonthGroups = computed(() => {
    const list = [];
    const monthMap = new Map();

    latestList.value.forEach((item) => {
        const date = toTimelineDate(item);
        const monthKey = getMonthKey(date);
        const dayKey = getDayKey(date);

        if (!monthMap.has(monthKey)) {
            const monthItem = {
                key: monthKey,
                year: date.getFullYear(),
                monthText: getMonthText(date),
                count: 0,
                days: [],
                dayMap: new Map(),
            };
            monthMap.set(monthKey, monthItem);
            list.push(monthItem);
        }

        const monthItem = monthMap.get(monthKey);
        monthItem.count += 1;

        if (!monthItem.dayMap.has(dayKey)) {
            const dayItem = {
                key: dayKey,
                day: String(date.getDate()).padStart(2, '0'),
                label: getDayLabel(date),
                items: [],
            };
            monthItem.dayMap.set(dayKey, dayItem);
            monthItem.days.push(dayItem);
        }

        monthItem.dayMap.get(dayKey).items.push(item);
    });

    return list;
});


// 与 classify 页一致：前 6 个 2×3（左高格跨 2 行）+ 第 6 个通栏，第 7、8 个占第 5 行两列，「更多」通栏第 6 行
const getLayoutStyleForIndex = (idx) => {
    if (idx === 0) return { gridColumn: '1', gridRow: '1' };
    if (idx === 1) return { gridColumn: '2', gridRow: '1' };
    if (idx === 2) return { gridColumn: '1', gridRow: '2 / span 2' };
    if (idx === 3) return { gridColumn: '2', gridRow: '2' };
    if (idx === 4) return { gridColumn: '2', gridRow: '3' };
    if (idx === 5) return { gridColumn: '1 / -1', gridRow: '4' };
    if (idx === 6) return { gridColumn: '1', gridRow: '5' };
    if (idx === 7) return { gridColumn: '2', gridRow: '5' };
    return {};
};

const getLayoutStyleMore = () => ({ gridColumn: '1 / -1', gridRow: '6' });

const getBannerTextMeta = (item) => {
    const url = String(item.url || '');
    const decodedUrl = decodeURIComponent(url);

    // 1. 提取核心参数
    const nameMatch = decodedUrl.match(/name=([^&]+)/);
    const keywordMatch = decodedUrl.match(/keyword=([^&]+)/);
    const rawTitle = nameMatch?.[1] || (keywordMatch?.[1] ? `#${keywordMatch[1]}` : '');

    // 2. 识别业务类型
    const type = (() => {
        if (url.includes('/pages/app/classlist')) return 'classify';
        if (url.includes('/wall/search/')) return 'search';
        if (url.includes('/preview')) return 'preview';
        if (item.target === 'miniProgram') return 'miniProgram';
        return 'default';
    })();

    const isBing = rawTitle.includes('必应') || rawTitle.toLowerCase().includes('bing');

    // 3. 数据映射配置
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
        title: rawTitle || (type === 'miniProgram' ? t('index.banner.discoverMore') : t('index.banner.defaultTitle')),
        desc: item.description || (isBing ? t('index.banner.bingDesc') : config.desc),
        badge: config.badge,
        targetLabel: targetMap[item.target] || targetMap.external,
        metaLabel: config.meta,
        accentClass: config.accent,
    };
};

const getBanner = async () => {
    let res = await apiGetBanner();
    // bannerList.value = res.data.map(item => {
    //     // 增加picurl字段，存储大图的url地址
    //     return {
    //         ...item,
    //         picurl: item.smallPicurl.replace("_small.webp", ".jpg")
    //     }
    // })
    bannerList.value = res.data.map((item) => {
        const normalized = handlePicUrl(item);
        return {
            ...normalized,
            ...getBannerTextMeta(item),
        };
    });
};

const getRandom = async () => {
    let res = await apiGetRandomDay();
    randomDailyList.value = res.data.map((item) => handlePicUrl(item));
};

const getRandomRecommend = async () => {
    let res = await apiGetRandomRecommend({ classify_ids: '30,62,2,3,10,12' });
    randomRecommendList.value = res.data.map((classify) => {
        return {
            ...classify,
            data: classify.data.map((item) => handlePicUrl(item)),
        };
    });
};

const getNotice = async () => {
    let res = await apiGetNotice();
    noticeList.value = res.data;
};

const getClassify = async () => {
    let res = await apiGetClassify({
        select: true,
    });
    classifyList.value = res.data.map((item) => handlePicUrl(item));
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
        const nextList = (res.data || []).map((item) => handlePicUrl(item));
        latestList.value = isAppend ? [...latestList.value, ...nextList] : nextList;
        latestList.value.sort((a, b) => toTimelineDate(b).getTime() - toTimelineDate(a).getTime());
        const totalPages = Number(res?.pagination?.total_pages || 1);
        latestNoMore.value = latestQuery.value.pageNum >= totalPages || nextList.length === 0;
    } finally {
        latestLoading.value = false;
    }
};



const goBannerPreview = (data) => {
    if (data.wall) {
        const wallList = handlePicUrl(data.wall);
        uni.setStorageSync('wallList', [wallList]); // banner预览存储单个壁纸
    }
    uni.navigateTo({ url: data.url });
};

const goPreview = (id, data) => {
    uni.setStorageSync('wallList', data); // 预览存储多个壁纸
    uni.navigateTo({
        url: '/pages/app/preview?id=' + id,
    });
};

const goSearch = () => {
    uni.navigateTo({ url: '/pages/app/search' });
};

const switchHomeTab = (key) => {
    activeHomeTab.value = key;
};

const goSearchByTag = (tag) => {
    if (isAdmin.value) {
        libraryStore.bumpPreferredTag(tag);
    }
    uni.navigateTo({
        url: `/pages/app/search?keyword=${encodeURIComponent(tag)}`,
    });
};

const goClassify = (item) => {
    if (!item?.id) return;
    uni.navigateTo({
        url: `/pages/app/classlist?id=${item.id}&name=${encodeURIComponent(item.name || '')}`,
    });
};

const toggleFollowingExpanded = () => {
    followingExpanded.value = !followingExpanded.value;
};

const onAdLoad = (key) => {
    adVisibleMap[key] = true;
};

const onAdError = (key) => {
    adVisibleMap[key] = false;
};

const goTimeline = () => {
    uni.navigateTo({ url: '/pages/app/timeline' });
};

const goClasslist = (id, name) => {
    uni.navigateTo({
        url: `/pages/app/classlist?id=${id}&name=${name}`,
    });
};

const refreshRandom = () => {
    getRandom();
    getRandomRecommend();
};

onLoad(() => {
    getBanner();
    getNotice();
    getRandom();
    getRandomRecommend();
    getClassify();
    getLatest();
});

// 下拉刷新
onPullDownRefresh(() => {
    console.log('onPullDownRefresh');

    if (activeHomeTab.value === 'home') {
        getRandom();
        getRandomRecommend();
    }

    uni.stopPullDownRefresh();
});

//分享给好友
onShareAppMessage((e) => {
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
@import '@/static/styles/theme-variables.scss';

.homeLayout {
    min-height: 100vh;
    box-sizing: border-box;
    transition: background-color 0.3s ease;
    background-color: var(--page-background);

    &.theme-dark {
        background-color: var(--page-background);

        .notice {
            background: rgba(255, 255, 255, 0.05);
            box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
        }

        .select-watermark {
            color: rgba(255, 255, 255, 0.07);
        }

        .select .content .box .box-badge--subtle {
            background: rgba(255, 255, 255, 0.15);
            color: rgba(255, 255, 255, 0.95);
            box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
        }

        .index-title {
            :deep(.name) {
                color: var(--text-primary);
                
                &::after {
                    background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
                }
            }
        }

        .date .text {
            color: var(--text-primary);
        }

        .classify {
            .more {
                color: rgba(255, 255, 255, 0.48);
            }
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
        transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.3s ease;
        
        &.is-hidden {
            transform: translateY(-100%);
        }

        &.is-dark {
            .home-tab {
                color: rgba(255, 255, 255, 0.6);
                
                &.is-active {
                    color: #ffffff;
                }
                
                &.is-active::after {
                    background: #ffffff;
                }
            }
            
            .home-tabs-mask {
                background: linear-gradient(to right, transparent, var(--mask-color, var(--page-background)));
            }

            .home-search {
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(255, 255, 255, 0.15);
                color: rgba(255, 255, 255, 0.8);
                
                &:active {
                    background: rgba(255, 255, 255, 0.15);
                }
            }
        }
    }

    .home-titlebar__inner {
        height: getTitleBarHeight() + 'px';
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
        position: relative;
        display: flex;
        align-items: center;
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
        font-size: 31rpx;
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

    .home-channel--latest,
    .home-channel--hot {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        color: #eaf0fb;
        background: transparent;
        height: 100vh;
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

    .ad-slot {
        padding: 0;
        margin: 0;
        overflow: hidden;
        min-height: 0;

        &.ready {
            padding: 30rpx 30rpx 0;
        }
    }

    .ad-slot-bottom {
        &.ready {
            padding: 0 30rpx 30rpx;
        }
    }

    .banner {
        width: 750rpx;
        padding: 0 0 20rpx;

        swiper {
            width: 750rpx;
            height: 400rpx;
            margin: 20rpx 0rpx;

            &-item {
                width: 100%;
                height: 100%;
                padding: 0rpx 30rpx;

                .banner-card {
                    width: 100%;
                    height: 100%;
                    display: block;
                    position: relative;
                    overflow: hidden;
                    border-radius: 28rpx;

                    image {
                        width: 100%;
                        height: 100%;
                        border-radius: 28rpx;
                        box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.34);
                    }

                    .banner-card__overlay {
                        position: absolute;
                        inset: 0;
                        background: linear-gradient(
                            180deg,
                            rgba(6, 12, 18, 0.06) 0%,
                            rgba(6, 12, 18, 0.18) 34%,
                            rgba(6, 12, 18, 0.78) 100%
                        );
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
                        font-size: 42rpx;
                        line-height: 1.18;
                        font-weight: 800;
                        color: #f8fafc;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }

                    .banner-card__desc {
                        margin-top: 10rpx;
                        font-size: 24rpx;
                        line-height: 1.5;
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

                    .banner-card__meta-arrow {
                        width: 56rpx;
                        height: 56rpx;
                        border-radius: 16rpx;
                        background: rgba(20, 28, 39, 0.32);
                        border: 1rpx solid rgba(255, 255, 255, 0.12);
                        display: flex;
                        align-items: center;
                        justify-content: center;
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
        }
    }

    .signal-callout {
        margin: 0 30rpx 28rpx;
        padding: 26rpx 24rpx;
        border-radius: 28rpx;
        background:
            radial-gradient(circle at top right, rgba(40, 179, 137, 0.18), transparent 28%),
            linear-gradient(135deg, #18202a 0%, #243244 100%);
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 22rpx;
        box-shadow: 0 18rpx 38rpx rgba(15, 23, 42, 0.16);
    }

    .signal-callout__main {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18rpx;

        .signal-callout__content {
            min-width: 0;
            flex: 1;
        }

        .signal-callout__eyebrow {
            font-size: 18rpx;
            font-weight: 800;
            letter-spacing: 4rpx;
            color: rgba(125, 211, 252, 0.88);
            text-transform: uppercase;
        }

        .signal-callout__title {
            margin-top: 10rpx;
            font-size: 32rpx;
            font-weight: 800;
            color: #f8fbff;
        }

        .signal-callout__desc {
            margin-top: 8rpx;
            font-size: 23rpx;
            line-height: 1.7;
            color: rgba(226, 232, 240, 0.74);
        }

        .signal-callout__action {
            flex-shrink: 0;
            min-height: 64rpx;
            padding: 0 24rpx;
            border-radius: 999rpx;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.12);
            border: 1rpx solid rgba(255, 255, 255, 0.12);
            color: #f8fbff;
            font-size: 22rpx;
            font-weight: 700;
        }
    }

    .signal-callout__panel {
        padding-top: 20rpx;
        border-top: 1rpx solid rgba(255, 255, 255, 0.08);
    }

    .signal-group {
        margin-bottom: 18rpx;
    }

    .signal-group__title {
        font-size: 20rpx;
        font-weight: 800;
        letter-spacing: 2rpx;
        color: rgba(226, 232, 240, 0.68);
        text-transform: uppercase;
        margin-bottom: 12rpx;
    }

    .signal-group__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 12rpx;
    }

    .signal-chip {
        min-height: 58rpx;
        padding: 0 20rpx;
        border-radius: 999rpx;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.1);
        border: 1rpx solid rgba(255, 255, 255, 0.1);
        color: #f8fbff;
        font-size: 22rpx;
        font-weight: 700;

        &:active {
            transform: scale(0.96);
            opacity: 0.86;
        }
    }

    .signal-chip--tag {
        color: #bbf7d0;
        background: rgba(40, 179, 137, 0.14);
        border-color: rgba(40, 179, 137, 0.18);
    }

    .signal-manage {
        margin-top: 6rpx;
        min-height: 62rpx;
        padding: 0 20rpx;
        border-radius: 18rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8rpx;
        background: rgba(97, 154, 239, 0.14);
        border: 1rpx solid rgba(147, 197, 253, 0.18);
        color: #dbeafe;
        font-size: 22rpx;
        font-weight: 800;
    }

    .notice {
        width: 690rpx;
        height: 72rpx;
        line-height: 80rpx;
        background: #f9f9f9;
        margin: 0 auto 30rpx;
        border-radius: 80rpx;
        display: flex;
        // x 偏移量 | y 偏移量 | 阴影模糊半径 | 阴影颜色 */
        box-shadow: 0 0px 6rpx rgba(0, 0, 0, 0.05);

        .left {
            width: 140rpx;
            display: flex;
            align-items: center;
            justify-content: center;

            .text {
                color: $wp-theme-color;
                font-weight: 600;
                font-size: 28rpx;
            }
        }

        .center {
            flex: 1;

            swiper {
                height: 100%;

                &-item {
                    display: flex;
                    align-items: center;
                    justify-content: left;

                    height: 100%;
                    font-size: 30rpx;
                    color: var(--text-secondary);
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                }

                navigator {
                    width: 100%;
                }
            }
        }

        .right {
            width: 70rpx;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }

    .select {
        position: relative;
        // padding: 30rpx 0 0 0;
        overflow: hidden;

        &.select--compact {
            .content.content--compact {
                height: 360rpx;

                scroll-view {
                    padding-bottom: 8rpx;

                    .box {
                        width: 232rpx;
                        height: calc(100% - 36rpx);
                        margin-bottom: 24rpx;
                    }
                }
            }
        }

        .select-watermark {
            position: absolute;
            top: -30rpx;
            right: -20rpx;
            font-size: 140rpx;
            font-weight: 900;
            color: rgba(17, 24, 39, 0.07);
            text-transform: uppercase;
            letter-spacing: -4rpx;
            pointer-events: none;
            z-index: 0;
            white-space: nowrap;
        }

        .index-title {
            position: relative;
            z-index: 1;
            margin-bottom: 24rpx;

            :deep(.name) {
                font-size: 38rpx;
                font-weight: 850;
                color: var(--text-primary);
                letter-spacing: 0.5rpx;
                position: relative;
                padding-bottom: 8rpx;
                
                &::after {
                    content: '';
                    position: absolute;
                    left: 0;
                    bottom: 0;
                    width: 36rpx;
                    height: 6rpx;
                    border-radius: 99rpx;
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                }
            }
        }

        .date {
            display: flex;
            align-items: center;
            gap: 16rpx;

            .text {
                font-size: 26rpx;
                font-weight: 600;
                color: var(--text-primary);
                letter-spacing: 0.02em;
            }
        }

        button.btn,
        button.button,
        .btn,
        .date .button {
            margin: 0;
            padding: 0 24rpx;
            height: 52rpx;
            line-height: 50rpx;
            font-size: 22rpx;
            font-weight: 600;
            border-radius: 999rpx;
            border: none;
            background-color: #111111;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            letter-spacing: 0.4rpx;
            box-shadow: 0 4rpx 12rpx rgba(17, 24, 39, 0.16);
            transition: transform 0.28s ease, background-color 0.28s ease, color 0.28s ease;

            &::after {
                border: none;
            }

            &:active {
                transform: scale(0.96);
                opacity: 0.92;
            }

            &.is-default,
            &.is-collection,
            &.is-keyword,
            &.is-spotlight {
                background-color: #111111;
                color: #ffffff;
                border: none;
                box-shadow: 0 4rpx 12rpx rgba(17, 24, 39, 0.16);
            }
        }

        .content {
            // width: 750rpx;
            height: 580rpx;
            position: relative;
            z-index: 1;

            scroll-view {
                white-space: nowrap;
                height: 100%;
                box-sizing: border-box;

                .box {
                    width: 280rpx;
                    height: calc(100% - 46rpx);
                    padding-bottom: 20rpx;
                    display: inline-flex;
                    justify-content: center;
                    align-items: flex-start;
                    margin: 20rpx 24rpx 50rpx 0;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    position: relative;
                    overflow: visible;
                    box-sizing: border-box;

                    &::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 20rpx;
                        border-radius: 28rpx;
                        background: linear-gradient(90deg, rgba(200, 200, 200, 0.08) 25%, rgba(200, 200, 200, 0.18) 50%, rgba(200, 200, 200, 0.08) 75%);
                        background-size: 200% 100%;
                        animation: skeleton-shimmer 1.6s infinite linear;
                        z-index: 0;
                        pointer-events: none;
                    }

                    image {
                        width: 100%;
                        height: 100%;
                        border-radius: 28rpx;
                        display: block;
                        position: relative;
                        z-index: 1;

                        box-shadow: 0 6rpx 15rpx rgba(0, 0, 0, 0.34);
                    }

                    .box-card-tag {
                        position: absolute;
                        top: 16rpx;
                        left: 16rpx;
                        z-index: 1;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 38rpx;
                        padding: 0 14rpx;
                        border-radius: 999rpx;
                        font-size: 18rpx;
                        font-weight: 800;
                        letter-spacing: 0.04em;
                        color: #7dd3fc;
                        background: rgba(43, 140, 238, 0.18);
                        border: 1rpx solid rgba(125, 211, 252, 0.22);
                        box-shadow: 0 6rpx 18rpx rgba(15, 23, 42, 0.18);
                        text-shadow: 0 2rpx 8rpx rgba(15, 23, 42, 0.18);
                    }

                    .box-card-tag--latest {
                        color: #fde68a;
                        background: rgba(245, 158, 11, 0.18);
                        border-color: rgba(253, 230, 138, 0.28);
                    }

                    .box-card-tag--is-default {
                        color: #7dd3fc;
                        background: rgba(43, 140, 238, 0.18);
                        border-color: rgba(125, 211, 252, 0.22);
                    }

                    .box-card-tag--is-collection {
                        color: #f3e8ff;
                        background: rgba(126, 34, 206, 0.28);
                        border-color: rgba(216, 180, 254, 0.28);
                    }

                    .box-card-tag--is-keyword {
                        color: #ecfccb;
                        background: rgba(101, 163, 13, 0.24);
                        border-color: rgba(190, 242, 100, 0.24);
                    }

                    .box-card-tag--is-spotlight {
                        color: #fde68a;
                        background: rgba(245, 158, 11, 0.2);
                        border-color: rgba(253, 230, 138, 0.3);
                    }

                    // Hero 模式专属 (大图)
                    &.is-hero {
                        width: 440rpx;
                        height: calc(100% - 66rpx);
                        padding-bottom: 0;

                        &::before {
                            bottom: 0;
                        }

                        .box-hero-overlay {
                            position: absolute;
                            inset: 0;
                            border-radius: 28rpx;
                            background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 70%, rgba(0, 0, 0, 0.5) 100%);
                            pointer-events: none;
                            z-index: 2;
                            opacity: 0;
                            transition: opacity 0.4s ease-in-out;

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
                            transition: opacity 0.4s ease-in-out;

                            &.is-visible {
                                opacity: 1;
                            }

                            .day-tag {
                                font-size: 64rpx;
                                font-weight: 900;
                                color: rgba(255, 255, 255, 0.95);
                                line-height: 1;
                                margin-bottom: 8rpx;
                                text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
                            }

                            .pick-text {
                                font-size: 20rpx;
                                font-weight: 800;
                                color: #fde68a;
                                text-transform: uppercase;
                                letter-spacing: 4rpx;
                            }
                        }
                    }

                    // New 微标
                    .box-badge {
                        position: absolute;
                        top: 16rpx;
                        right: 16rpx;
                        padding: 4rpx 12rpx;
                        background: rgba(40, 179, 137, 0.9);
                        color: #fff;
                        font-size: 18rpx;
                        font-weight: 800;
                        border-radius: 8rpx;
                        box-shadow: 0 4rpx 12rpx rgba(40, 179, 137, 0.4);
                        z-index: 1;
                    }

                    .box-badge--subtle {
                        background: rgba(15, 23, 42, 0.72);
                        color: rgba(255, 255, 255, 0.92);
                        box-shadow: 0 4rpx 12rpx rgba(15, 23, 42, 0.24);
                    }

                    &:active {
                        transform: scale(0.96) translateY(4rpx);
                    }
                }

                .box:first-child {
                    margin-left: 30rpx;
                }
                .box:last-child {
                    margin-right: 30rpx;
                }
            }
        }

        .for-you-groups {
            position: relative;
            z-index: 1;
        }

        .for-you-group {
            margin-bottom: 18rpx;

            &:last-child {
                margin-bottom: 0;
            }

            .content.content--compact {
                height: 330rpx;
            }
        }

        .for-you-group__head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16rpx;
            padding: 0 6rpx 4rpx;
        }

        .for-you-group__title {
            min-width: 0;
            font-size: 26rpx;
            font-weight: 800;
            color: #0f172a;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .for-you-group__meta {
            flex-shrink: 0;
            min-height: 40rpx;
            padding: 0 16rpx;
            border-radius: 999rpx;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 19rpx;
            font-weight: 800;
            letter-spacing: 1rpx;
            color: #475569;
            background: #e2e8f0;
            border: 1rpx solid #cbd5e1;
            text-transform: uppercase;
        }

        .tag-strip {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            gap: 20rpx;
            padding: 0 6rpx 16rpx;

            .tag-strip__label {
                flex-shrink: 0;
                font-size: 22rpx;
                font-weight: 700;
                color: #64748b;
                letter-spacing: 0.06em;
                text-transform: uppercase;
            }

            .tag-strip__scroll {
                flex: 1;
                min-width: 0;
                white-space: nowrap;
            }

            .tag-strip__inner {
                display: inline-flex;
                align-items: center;
                gap: 14rpx;
                padding-right: 24rpx;
            }

            .tag-strip__pill {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0 22rpx;
                height: 56rpx;
                border-radius: 999rpx;
                background: #f1f5f9;
                border: 1rpx solid #dbe4ee;
                color: #334155;
                font-size: 22rpx;
                font-weight: 600;
                line-height: 1;
                box-shadow: 0 8rpx 18rpx rgba(148, 163, 184, 0.12);

                &:active {
                    transform: scale(0.96);
                    opacity: 0.86;
                }
            }
        }
    }

    &.theme-dark .select {
        button.btn,
        button.button,
        .btn,
        .date .button {
            background-color: #ffffff;
            color: #111111;
            border: none;
            box-shadow: 0 4rpx 12rpx rgba(255, 255, 255, 0.16);

            &::after {
                border: none;
            }

            &.is-default,
            &.is-collection,
            &.is-keyword,
            &.is-spotlight {
                background-color: #ffffff;
                color: #111111;
                border: none;
                box-shadow: 0 4rpx 12rpx rgba(255, 255, 255, 0.16);
            }

            &:active {
                transform: scale(0.96);
                opacity: 0.92;
                background-color: #ffffff;
                color: #111111;
            }
        }
    }

    .subject {
    }

    .top-entry {
        position: relative;
        margin: 0 30rpx 30rpx;
        padding: 24rpx 24rpx 24rpx 28rpx;
        display: block;
        min-height: 210rpx;
        overflow: visible;
        border-radius: 28rpx;
        background: linear-gradient(180deg, #40454f 0%, #393f48 100%);
        border: 1rpx solid rgba(255, 255, 255, 0.04);
        box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.1);
        text-align: left;
    }

    .top-entry__content {
        width: 340rpx;
        min-width: 340rpx;
        padding: 4rpx 0;
        margin-left: 0;
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
        justify-content: flex-start;
    }

    .top-entry__eyebrow {
        display: block;
        width: 100%;
        font-size: 20rpx;
        line-height: 1;
        font-weight: 800;
        letter-spacing: 2rpx;
        color: rgba(255, 255, 255, 0.82);
        text-transform: uppercase;
    }

    .top-entry__title {
        display: block;
        width: 100%;
        margin-top: 10rpx;
        font-size: 34rpx;
        line-height: 1.2;
        font-weight: 800;
        color: #ffffff;
    }

    .top-entry__desc {
        display: block;
        width: 100%;
        margin-top: 10rpx;
        font-size: 24rpx;
        line-height: 1.6;
        color: rgba(255, 255, 255, 0.56);
        max-width: 320rpx;
    }

    .top-entry__action {
        margin-top: 20rpx;
        margin-left: 0;
        align-self: flex-start;
        width: 56rpx;
        height: 56rpx;
        border-radius: 16rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(20, 28, 39, 0.32);
        border: 1rpx solid rgba(255, 255, 255, 0.12);
    }

    .top-entry__action-text {
        display: none;
    }

    .top-entry__visual {
        position: absolute;
        right: 10rpx;
        bottom: -18rpx;
        height: 384rpx;
        width: auto;
        z-index: 2;
        pointer-events: none;
    }

    .classify {
        padding: 0rpx 0 30rpx;

        .content.classify-grid {
            margin-top: 30rpx;
            padding: 0 24rpx;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-auto-rows: 200rpx;
            gap: 20rpx;
        }

        .more {
            font-size: 28rpx;
            color: $uni-text-color-grey;
        }
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
</style>
