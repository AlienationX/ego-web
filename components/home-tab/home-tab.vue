<template>
    <scroll-view scroll-y class="home-tab-layout" @scroll="handleScroll">
        <!-- 静态 spacer，与其他嵌入式 tab 保持一致，不随 titlebar 显隐变化 -->
        <view :style="{ height: navBarHeight + 'px' }"></view>

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
            <swiper
                v-else
                class="banner-swiper"
                indicator-dots
                indicator-color="rgba(255,255,255,0.5)"
                indicator-active-color="#fff"
                autoplay
                circular
            >
                <swiper-item class="banner-swiper-item" v-for="item in bannerList" :key="item.id">
                    <navigator
                        v-if="item.target == 'miniProgram'"
                        :url="item.url"
                        target="miniProgram"
                        :app-id="item.appid"
                        :class="['banner-card', item.accentClass]"
                    >
                        <image class="banner-card__image" :src="item.mediumPicurl" mode="aspectFill"></image>
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
                        <image class="banner-card__image" :src="item.mediumPicurl" mode="aspectFill"></image>
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

        <!-- Notice -->
        <view class="notice">
            <view class="left">
                <uni-icons type="sound-filled" size="20" color="#28B389"></uni-icons>
                <text class="text">{{ $t('index.notice') }}</text>
            </view>
            <view class="center">
                <!-- Notice 骨架屏 -->
                <view v-if="!noticeList.length" class="sk-notice-bar">
                    <view class="sk-bar sk-bar--notice"></view>
                </view>
                <swiper v-else class="notice-swiper" vertical interval="1500" duration="300" autoplay circular>
                    <swiper-item class="notice-swiper-item" v-for="item in noticeComputed" :key="item.id">
                        <navigator class="notice-nav" :url="`/pages/app/notice-detail?id=${item.id}&name=${encodeURIComponent(item.title)}`">
                            {{ item.title }}
                        </navigator>
                    </swiper-item>
                </swiper>
            </view>
            <view class="right">
                <uni-icons type="right" size="16" :color="settingsStore.isDark ? 'rgba(255, 255, 255, 0.9)' : '#334155'"></uni-icons>
            </view>
        </view>

        <!-- Daily Recommend -->
        <view class="select">
            <view class="select-watermark">Daily</view>
            <index-title>
                <template #name>{{ $t('index.dailyRecommend') }}</template>
                <template #custom>
                    <view class="date">
                        <uni-icons
                            type="calendar"
                            size="20"
                            :color="settingsStore.isDark ? 'rgba(255, 255, 255, 0.9)' : '#334155'"
                        ></uni-icons>
                        <view class="text"> {{ todayDateStr }}{{ $t('common.day') }} </view>
                        <button class="button is-spotlight" size="mini" @click="refreshRandom">
                            {{ $t('common.refresh') }}
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
                <scroll-view v-else scroll-x class="home-scroll">
                    <view
                        class="box"
                        v-for="(item, idx) in randomDailyList"
                        :key="item.id"
                        :class="{ 'is-hero': idx === 0 }"
                        @click="goPreview(item.id, randomDailyList)"
                    >
                        <image
                            class="box-image"
                            :src="idx === 0 ? item.mediumPicurl || item.picurl : item.smallPicurl"
                            mode="aspectFill"
                            lazy-load
                            fade-in
                            @load="idx === 0 ? (heroImageLoaded = true) : null"
                        ></image>
                        <block v-if="idx === 0">
                            <view class="box-hero-overlay" :class="{ 'is-visible': heroImageLoaded }"></view>
                            <view class="box-hero-content" :class="{ 'is-visible': heroImageLoaded }">
                                <view class="day-tag">{{ todayDate }}</view>
                                <view class="pick-text">PICK OF THE DAY</view>
                            </view>
                        </block>
                        <block v-else>
                            <view v-if="item._timeBadge" class="box-badge box-badge--subtle">{{ item._timeBadge }}</view>
                        </block>
                    </view>
                </scroll-view>
            </view>
        </view>

        <!-- Featured Subjects Section -->
        <view class="select">
            <view class="select-watermark">Subject</view>
            <index-title>
                <template #name>{{ $t('index.subjectRecommend') }}</template>
                <template #custom>
                    <button size="mini" class="btn is-default" @click="goSubjects">{{ $t('common.more') }}</button>
                </template>
            </index-title>

            <view class="content content--subjects">
                <!-- Subject 骨架屏 -->
                <view v-if="!subjectsRecommendList.length" class="sk-scroll-row sk-scroll-row--subjects">
                    <view v-for="i in 3" :key="i" class="sk-card sk-card--subject-skeleton"></view>
                </view>
                <scroll-view v-else scroll-x class="home-scroll">
                    <view
                        class="subject-box-new"
                        v-for="item in subjectsRecommendList"
                        :key="item.id"
                        @click="goSubjectDetail(item)"
                    >
                        <view class="subject-box-new__left">
                            <view class="subject-box-new__badge-row">
                                <view class="subject-box-new__badge" v-if="item.is_locked">
                                    <uni-icons type="vip-filled" size="8" color="#fbbf24"></uni-icons>
                                    <text class="badge-text">VIP</text>
                                </view>
                                <view class="subject-box-new__count" v-if="item.wall_count">
                                    {{ item.wall_count }}P
                                </view>
                            </view>
                            <text class="subject-box-new__title">
                                {{ isEn ? (item.name_en || item.name) : item.name }}
                            </text>
                            <text class="subject-box-new__desc">
                                {{ isEn ? (item.content_en || item.content) : item.content }}
                            </text>
                        </view>
                        
                        <view class="subject-box-new__right">
                            <image class="subject-box-new__cover" :src="item.cover_url || '/static/images/placeholder.jpg'" mode="aspectFill" lazy-load></image>
                            <view class="subject-box-new__cover-shadow"></view>
                        </view>
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
                    <button size="mini" class="btn is-default" @click="goTimeline">{{ $t('common.seeAll') }}</button>
                </template>
            </index-title>

            <view class="content">
                <!-- Latest 骨架屏：5个小卡 -->
                <view v-if="!latestList.length" class="sk-scroll-row">
                    <view v-for="i in 5" :key="i" class="sk-card"></view>
                </view>
                <scroll-view v-else scroll-x class="home-scroll">
                    <view class="box" v-for="(item, idx) in latestList" :key="item.id" @click="goPreview(item.id, latestList)">
                        <image class="box-image" :src="item.smallPicurl" mode="aspectFill" lazy-load fade-in></image>
                        <view v-if="item._timeBadge" class="box-badge">{{ item._timeBadge }}</view>
                    </view>
                </scroll-view>
            </view>
        </view>

        <!-- Subscription Signals -->
        <view v-if="isAdmin && hasSubscriptionSignals" class="signal-callout-new" :class="{ 'is-expanded': followingExpanded }">
            <view class="signal-callout-new__header" @click="toggleFollowingExpanded">
                <view class="signal-callout-new__left">
                    <view class="signal-pulse-dot"></view>
                    <text class="signal-callout-new__eyebrow">{{ t('index.followingEyebrow') }}</text>
                </view>
                <view class="signal-callout-new__right">
                    <uni-icons :type="followingExpanded ? 'arrow-up' : 'arrow-down'" size="11" color="var(--text-secondary)"></uni-icons>
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
                        <view
                            v-for="item in subscribedClassifyItems"
                            :key="item.id"
                            class="signal-chip-new"
                            @click="goClassify(item)"
                        >
                            <uni-icons type="images" size="10" color="var(--text-secondary)"></uni-icons>
                            <text class="chip-text">{{ item.name }}</text>
                        </view>
                    </view>
                </view>

                <view v-if="libraryStore.subscriptions.tags.length" class="signal-group-new">
                    <view class="signal-group-new__title">{{ t('subscriptionPage.tagTitle') }}</view>
                    <view class="signal-group-new__chips">
                        <view
                            v-for="tag in libraryStore.subscriptions.tags"
                            :key="tag"
                            class="signal-chip-new signal-chip-new--tag"
                            @click="goSearchByTag(tag)"
                        >
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

        <!-- Top Entry -->
        <navigator class="top-entry" url="/pages/app/topN">
            <view class="top-entry__content">
                <view class="top-entry__title">{{ $t('top10.title') }}</view>
                <view class="top-entry__desc">{{ $t('top10.descViews') }}</view>
                <view class="top-entry__action">
                    <text class="top-entry__action-text">{{ $t('common.seeAll') }}</text>
                    <uni-icons type="right" size="18" color="#ffffff"></uni-icons>
                </view>
            </view>
            <image class="top-entry__visual" :src="topCardImageURL" mode="heightFix"></image>
        </navigator>

        <!-- Classify Sections -->
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
                <rotate-loading v-if="!classify.data?.length" style="height: 100%"></rotate-loading>
                <scroll-view scroll-x class="home-scroll">
                    <view class="box" v-for="item in classify.data" :key="item.id" @click="goPreview(item.id, classify.data)">
                        <image class="box-image" :src="item.smallPicurl" mode="aspectFill" lazy-load fade-in></image>
                        <view v-if="item._timeBadge" class="box-badge box-badge--subtle">{{ item._timeBadge }}</view>
                    </view>
                </scroll-view>
            </view>
        </view>

        <!-- Classify Grid -->
        <view class="classify">
            <index-title>
                <template #name>{{ $t('index.categoryRecommend') }}</template>
                <template #custom>
                    <navigator url="/pages/app/classify" open-type="reLaunch" class="more">{{ $t('common.more') }}+</navigator>
                </template>
            </index-title>

            <rotate-loading v-if="!classifyList.length" style="height: 100%"></rotate-loading>

            <view class="classify-grid-padding">
                <classify-grid v-if="classifyList.length" :items="classifyPreviewList" />
            </view>
        </view>
    </scroll-view>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTranslateParams } from '@/utils/i18n.js';
import {
    apiGetBanner,
    apiGetRandomDay,
    apiGetRandomRecommend,
    apiGetNotice,
    apiGetClassify,
    apiGetClassList,
    apiGetSubjects,
} from '@/api/wallpaper.js';
import { PICS_BASE_URL } from '@/common/config.js';
import { handlePicUrl } from '@/utils/common.js';
import { useLibraryStore } from '@/stores/library.js';
import { useUserStore } from '@/stores/user.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useAppStore } from '@/stores/app.js';

const { t, locale } = useI18n();
const { tp } = useTranslateParams();
const libraryStore = useLibraryStore();
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const appStore = useAppStore();

const isAdmin = computed(() => !!userStore.isAdmin);
const isEn = computed(() => locale.value === 'en');

const props = defineProps({
    navBarHeight: {
        type: Number,
        default: 0,
    },
});

const emit = defineEmits(['scroll']);

const handleScroll = (e) => {
    emit('scroll', { scrollTop: e.detail.scrollTop });
};

// navBarHeight 直接使用 props，不再重复获取
const navBarHeight = computed(() => props.navBarHeight);

const topCardImageURL = ref(PICS_BASE_URL + '/insets/1699281368061_2-removebg-preview.png');

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
const heroImageLoaded = ref(false);
const randomRecommendList = ref([]);
const latestList = ref([]);
const noticeList = ref([]);
const subjectsRecommendList = ref([]);
const noticeComputed = computed(() => {
    return noticeList.value.map((item) => ({
        ...item,
        title: isEn.value && item.title_en ? item.title_en : item.title,
    }));
});
const classifyList = ref([]);
const adVisibleMap = reactive({});
const followingExpanded = ref(false);
const themeClasses = ['is-collection', 'is-keyword', 'is-spotlight', 'is-default'];

// --- Latest pagination ---
const latestLoading = ref(false);
const latestNoMore = ref(false);
const latestQuery = ref({
    pageNum: 1,
    pageSize: 12, // ── 优化6：与 latestPreviewList 截取数对齐，避免多拉无用数据 ──
    ordering: '-updated_at',
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

const classifyPreviewList = computed(() => classifyComputed.value.slice(0, 7));

const DAY_MS = 24 * 60 * 60 * 1000;

// --- Time badge helpers ---
// ── 优化2：badgeCopy 只计算一次，不在每个 item 处理时重复调用 getLocale() ──
const getBadgeCopy = () => {
    const isZh = String(uni.getLocale() || '').startsWith('zh');
    return isZh ? { justIn: '刚更新', latest: '近期', new: '新' } : { justIn: 'JUST IN', latest: 'LATEST', new: 'NEW' };
};
const badgeCopy = getBadgeCopy();

const getWallDate = (item) => {
    const raw = item?.updated_at || item?.created_at || null;
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

// ── 优化2：使用缓存的 badgeCopy，不再每次构造新对象 ──
const getTimeBadge = (item) =>
    isUpdatedToday(item)
        ? badgeCopy.justIn
        : isUpdatedYesterday(item)
          ? badgeCopy.new
          : isUpdatedWithinDays(item, 5)
            ? badgeCopy.latest
            : '';

const addTimeBadge = (item) => {
    item._timeBadge = getTimeBadge(item);
    return item;
};

const toTimelineDate = (item) => {
    const raw = item?.updated_at || item?.created_at || Date.now();
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

const getRandom = async () => {
    let res = await apiGetRandomDay();
    randomDailyList.value = res.data.map((item) => addTimeBadge(handlePicUrl(item)));
};

const getRandomRecommend = async () => {
    let res = await apiGetRandomRecommend({ classify_ids: '30,62,2,3,10,12' });
    randomRecommendList.value = res.data.map((classify) => ({
        ...classify,
        data: classify.data.map((item) => addTimeBadge(handlePicUrl(item))),
    }));
};

const getNotice = async () => {
    let res = await apiGetNotice();
    noticeList.value = res.data;
};

const getClassify = async () => {
    let res = await apiGetClassify({ select: true });
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
    uni.navigateTo({ url: `/pages/app/classlist?id=${id}&name=${name}` });
};

const refreshRandom = () => {
    heroImageLoaded.value = false;
    getRandom();
    getRandomRecommend();
    getSubjects();
};

const getSubjects = async () => {
    try {
        const res = await apiGetSubjects({ select: true });
        if (res.code === 200 && res.data) {
            subjectsRecommendList.value = res.data.map((item) => handlePicUrl(item));
        }
    } catch (err) {
        console.error('Failed to load recommended subjects:', err);
    }
};

const goSubjects = () => {
    uni.navigateTo({ url: '/pages/app/subjects' });
};

const goSubjectDetail = (item) => {
    uni.navigateTo({
        url: `/pages/app/subject-detail?id=${item.id}&name=${encodeURIComponent(item.name)}`
    });
};

onMounted(() => {
    // ── 优化：分优先级延时加载，错峰发请求，减少首屏并发竞争 ──
    // P1 立即：首屏可见的关键数据
    getBanner();
    getRandom();
    getLatest();

    // P2 延时 300ms：首屏次要数据，让 P1 的渲染先跑起来
    setTimeout(() => {
        getRandomRecommend();
        getNotice();
        getSubjects();
    }, 300);

    // P3 延时 800ms：需要滚动才能看到，完全错峰
    setTimeout(() => {
        getClassify();
    }, 800);
});
</script>

<style lang="scss" scoped>
.home-tab-layout {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    box-sizing: border-box;
    height: 100vh;
}

.banner {
    width: 750rpx;
    padding: 0 0 8rpx;
    // ── 优化8：使用 class 选择器替代 swiper 标签名，小程序端更可靠 ──
    .banner-swiper {
        width: 750rpx;
        height: 400rpx;
        margin: 20rpx 0rpx;
    }

    // swiper-item 在小程序端编译为原生容器，用后代 class 控制内部布局
    // 通过 padding 保证左右间距，避免 margin 在 overflow:hidden 容器内右侧被裁掉
    .banner-swiper-item {
        padding: 0 20rpx;
        box-sizing: border-box;
    }

    .banner-card {
        width: 100%;
        height: 100%;
        display: block;
        position: relative;
        overflow: hidden;
        border-radius: 28rpx;
        box-sizing: border-box;

        .banner-card__image {
            width: 100%;
            height: 100%;
            box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.34);
            transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
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

.notice {
    width: 710rpx;
    height: 72rpx;
    line-height: 80rpx;
    background: var(--page-background-secondary);
    margin: 0 auto 24rpx;
    border-radius: 80rpx;
    display: flex;
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

        // ── 优化8：使用 class 选择器替代标签名 ──
        .notice-swiper {
            height: 100%;
        }

        .notice-swiper-item {
            display: flex;
            align-items: center;
            justify-content: left;
            height: 100%;
            font-size: 28rpx;
            color: var(--text-secondary);
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }

        .notice-nav {
            width: 100%;
            display: block;
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
    overflow: hidden;

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
        background-color: var(--text-primary);
        color: var(--page-background);
        display: flex;
        align-items: center;
        justify-content: center;
        letter-spacing: 0.4rpx;
        box-shadow: 0 4rpx 12rpx rgba(17, 24, 39, 0.16);
        transition:
            transform 0.28s ease,
            background-color 0.28s ease,
            color 0.28s ease;

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
            background-color: var(--text-primary);
            color: var(--page-background);
            border: none;
            box-shadow: 0 4rpx 12rpx rgba(17, 24, 39, 0.16);
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
            padding: 0 20rpx;

            .box {
                width: 280rpx;
                height: calc(100% - 50rpx);
                display: inline-flex;
                justify-content: center;
                align-items: flex-start;
                margin: 20rpx 20rpx 50rpx 0;
                transition: box-shadow 0.3s ease;
                position: relative;
                overflow: hidden;
                border-radius: 28rpx;
                box-sizing: border-box;
                // box-shadow: 0 6rpx 15rpx rgba(0, 0, 0, 0.34);
                box-shadow: none;

                &::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border-radius: 28rpx;
                    background: linear-gradient(
                        90deg,
                        rgba(200, 200, 200, 0.08) 25%,
                        rgba(200, 200, 200, 0.18) 50%,
                        rgba(200, 200, 200, 0.08) 75%
                    );
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
                    position: relative;
                    z-index: 1;
                    transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
                }

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

                // Hero mode
                &.is-hero {
                    width: 440rpx;
                    height: calc(100% - 50rpx);
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

                &:active {
                    .box-image {
                        transform: scale(1.08);
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

.top-entry {
    position: relative;
    margin: 0 20rpx 30rpx;
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
    .more {
        font-size: 28rpx;
        color: $uni-text-color-grey;
    }

    .classify-grid-padding {
        padding: 20rpx;
    }
}

.ad-slot {
    padding: 0;
    margin: 0;
    min-height: 0;
    box-sizing: border-box;

    &__inner {
        display: none;
    }

    &.ready &__inner {
        display: block;
        margin: 0 30rpx 30rpx;
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
    width: calc(100% - 60rpx);
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

    &--notice {
        height: 32rpx;
        width: 80%;
        border-radius: 6rpx;
    }
}

// ── Notice 骨架 ──
.sk-notice-bar {
    height: 100%;
    display: flex;
    align-items: center;
    padding-left: 8rpx;
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

    &--subjects {
        height: 100%;
        padding: 10rpx 20rpx;
        gap: 20rpx;
    }
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

    &--subject-skeleton {
        width: 480rpx !important;
        height: 220rpx !important;
        border-radius: 32rpx;
        flex-shrink: 0;
    }
}

.content--subjects {
    height: 260rpx !important;
}

.subject-box-new {
    width: 480rpx;
    height: 220rpx;
    display: inline-flex;
    flex-shrink: 0;
    background: var(--panel-background);
    border: 1rpx solid var(--panel-border);
    margin: 12rpx 20rpx 12rpx 0;
    position: relative;
    border-radius: 32rpx;
    box-sizing: border-box;
    box-shadow: 0 10rpx 28rpx var(--shadow-color);
    transition: transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.24s;
    cursor: pointer;
    overflow: hidden;
    padding: 24rpx;
    gap: 16rpx;
    align-items: center;

    &:active {
        transform: scale(0.97);
        box-shadow: 0 4rpx 12rpx var(--shadow-color);
    }

    &__left {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
        min-width: 0;
    }

    &__badge-row {
        display: flex;
        align-items: center;
        gap: 10rpx;
    }

    &__badge {
        display: inline-flex;
        align-items: center;
        gap: 4rpx;
        padding: 4rpx 12rpx;
        background: rgba(251, 191, 36, 0.08);
        border: 1rpx solid rgba(251, 191, 36, 0.16);
        border-radius: 100rpx;
        color: #fbbf24;
        font-size: 16rpx;
        font-weight: 900;

        .badge-text {
            line-height: 1;
        }
    }

    &__count {
        font-size: 16rpx;
        font-weight: 800;
        color: var(--text-tertiary);
        letter-spacing: 0.5rpx;
    }

    &__title {
        font-size: 26rpx;
        font-weight: 800;
        color: var(--text-primary);
        line-height: 1.25;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
    }

    &__desc {
        font-size: 18rpx;
        color: var(--text-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
        margin-top: 4rpx;
    }

    &__right {
        position: relative;
        width: 120rpx;
        height: 172rpx;
        flex-shrink: 0;
        border-radius: 20rpx;
        overflow: hidden;
        box-shadow: 0 6rpx 16rpx var(--shadow-color);
        background: var(--page-background-secondary);
    }

    &__cover {
        width: 100%;
        height: 100%;
        display: block;
    }

    &__cover-shadow {
        position: absolute;
        inset: 0;
        box-shadow: inset 0 0 10rpx rgba(0, 0, 0, 0.1);
        pointer-events: none;
    }
}
</style>
