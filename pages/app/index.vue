<template>
    <view class="homeLayout pageBackground">
        <nav-bar :title="$t('index.title')"></nav-bar>

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
                <uni-icons type="right" size="16" color="#333"></uni-icons>
            </view>
        </view>

        <view class="select">
            <view class="select-watermark">Daily</view>
            <index-title>
                <template #name>{{ $t('index.dailyRecommend') }}</template>
                <template #custom>
                    <view class="date">
                        <button class="button is-spotlight" size="mini" @click="refreshRandom">
                            {{ $t('common.refresh') }}
                        </button>
                        <uni-icons type="calendar" size="18" color="#666"></uni-icons>
                        <view class="text"> {{ new Date().getDate().toString().padStart(2, '0') }}{{ $t('common.day') }} </view>
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
                        <image :src="idx === 0 ? item.mediumPicurl || item.picurl : item.smallPicurl" mode="aspectFill"></image>
                        <block v-if="idx === 0">
                            <view class="box-hero-overlay"></view>
                            <view class="box-hero-content">
                                <view class="day-tag">{{ new Date().getDate() }}</view>
                                <view class="pick-text">PICK OF THE DAY</view>
                            </view>
                        </block>
                        <block v-else>
                            <view v-if="getTimeBadge(item)" class="box-badge box-badge--subtle">{{ getTimeBadge(item) }}</view>
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
                    <navigator class="box" url="/pages/app/timeline">
                        <button size="mini" class="btn is-default">{{ $t('common.seeAll') }}</button>
                    </navigator>
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
                        <image :src="item.smallPicurl" mode="aspectFill"></image>
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
                src="/static/images/inset/1699281368061_2-removebg-preview.png"
                mode="heightFix"
            ></image>
        </navigator>

        <view class="select" v-for="(classify, idx) in randomRecommendComputed" :key="classify.id">
            <view class="select-watermark">{{ classify.name }}</view>
            <index-title>
                <template #name>{{ classify.name }}</template>
                <template #custom>
                    <navigator class="box" :url="'/pages/app/classlist?id=' + classify.id + '&name=' + classify.name">
                        <button size="mini" class="btn" :class="themeClasses[idx % themeClasses.length]">
                            {{ $t('common.seeAll') }}
                        </button>
                    </navigator>
                </template>
            </index-title>

            <view class="content">
                <rotate-loading v-if="!classify" style="height: 100%"></rotate-loading>
                <scroll-view scroll-x>
                    <view class="box" v-for="item in classify.data" :key="item.id" @click="goPreview(item.id, classify.data)">
                        <image :src="item.smallPicurl" mode="aspectFill"></image>
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
                    <navigator url="/pages/app/classify" open-type="reLaunch" class="more">{{ $t('common.more') }}+</navigator>
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
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { onLoad, onPullDownRefresh, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import {
    apiGetBanner,
    apiGetRandomDay,
    apiGetRandomRecommend,
    apiGetNotice,
    apiGetClassify,
    apiGetClassList,
} from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { useI18n } from 'vue-i18n';
import { useLibraryStore } from '@/stores/library.js';
import { useUserStore } from '@/stores/user.js';
const { t } = useI18n();
const libraryStore = useLibraryStore();
const userStore = useUserStore();

const bannerList = ref([]);
const randomDailyList = ref([]);
const randomRecommendList = ref([]);
const latestList = ref([]);
const noticeList = ref([]);
const classifyList = ref([]);
const adVisibleMap = reactive({});
const followingExpanded = ref(false);
const themeClasses = ['is-collection', 'is-keyword', 'is-spotlight', 'is-default'];
const isAdmin = computed(() => !!userStore.isAdmin);
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
    const raw = item?.updated_at || item?.created_at || item?.created || null;
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

const getLatest = async () => {
    let res = await apiGetClassList({
        ordering: '-created',
        page_size: 20,
    });
    latestList.value = (res.data || []).map((item) => handlePicUrl(item));
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

    // getBanner();
    // getNotice();
    getRandom();
    getRandomRecommend();
    // getClassify();

    // uni.hideNavigationBarLoading();
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
.homeLayout {
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
                    color: #666;
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
            color: rgba(0, 0, 0, 0.04);
            text-transform: uppercase;
            letter-spacing: -4rpx;
            pointer-events: none;
            z-index: 0;
            white-space: nowrap;
        }

        .index-title {
            position: relative;
            z-index: 1;
        }

        .date {
            display: flex;
            align-items: center;
            gap: 12rpx;

            .button {
                margin: 0;
                padding: 0 16rpx;
                height: 46rpx;
                line-height: 44rpx;
                font-size: 22rpx;
                font-weight: 700;
                border-radius: 999rpx;
                background: #e2e8f0;
                color: #475569;
                border: 1rpx solid #cbd5e1;
                display: flex;
                align-items: center;
                justify-content: center;

                &::after {
                    border: none;
                }

                &:active {
                    transform: scale(0.95);
                    opacity: 0.8;
                }

                &.is-spotlight {
                    color: #475569;
                    background: #e2e8f0;
                    border-color: #cbd5e1;
                }
            }

            .text {
                font-size: 26rpx;
                font-weight: 600;
                color: #666;
                letter-spacing: 0.02em;
            }
        }

        .btn {
            margin: 0;
            padding: 0 20rpx;
            height: 46rpx;
            line-height: 44rpx;
            font-size: 22rpx;
            font-weight: 700;
            border-radius: 999rpx;
            border: 1rpx solid rgba(0, 0, 0, 0.08);
            background: #f1f5f9;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;

            &::after {
                border: none;
            }

            &:active {
                transform: scale(0.95);
                filter: brightness(0.95);
            }

            &.is-default,
            &.is-collection,
            &.is-keyword,
            &.is-spotlight {
                color: #475569;
                background: #e2e8f0;
                border-color: #cbd5e1;
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

                    image {
                        width: 100%;
                        height: 100%;
                        border-radius: 28rpx;
                        display: block;

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

                        .box-hero-overlay {
                            position: absolute;
                            inset: 0;
                            border-radius: 28rpx;
                            background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.7) 100%);
                            pointer-events: none;
                        }

                        .box-hero-content {
                            position: absolute;
                            left: 24rpx;
                            bottom: 30rpx;
                            right: 24rpx;

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
</style>
