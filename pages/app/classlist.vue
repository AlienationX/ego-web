<template>
    <view class="layout" :class="isDark ? 'theme-dark' : 'theme-light'">
        <view
            class="top-shell"
            :style="{
                opacity: topbarOpacity,
                pointerEvents: topbarOpacity > 0.2 ? 'auto' : 'none',
            }"
        >
            <view class="status-bar-bg" :style="{ height: `${statusBarHeight}px` }"></view>
            <view class="topbar" :style="{ top: `${statusBarHeight}px`, height: `${titleBarHeight}px` }">
                <view class="topbar__left">
                    <view class="topbar__back topbar__back--bar" @click="goBack">
                        <mdi-icon
                            path="/static/icons/arrow-left.svg"
                            size="20px"
                            :color="isDark ? '#f8fbff' : '#1e293b'"
                        ></mdi-icon>
                    </view>
                    <view class="topbar__title">{{ heroTitle }}</view>
                </view>
                <view class="topbar__actions">
                    <view class="topbar__icon" @click="goSearch">
                        <uni-icons type="search" size="18" :color="isDark ? '#94a3b8' : '#64748b'"></uni-icons>
                    </view>
                    <view class="topbar__icon" v-if="isAdmin">
                        <uni-icons type="more-filled" size="18" :color="isDark ? '#94a3b8' : '#64748b'"></uni-icons>
                    </view>
                </view>
            </view>
        </view>

        <view class="content-wrapper">
            <modern-pics-view
                v-if="tabs.length > 0"
                :show-header="true"
                :tabs="tabs"
                api-type="classList"
                :header-height="heroHeightPx"
                :tabs-height="44"
                :sticky-top="navBarHeight"
                @update="onListUpdate"
                @scroll="onScroll"
            ></modern-pics-view>
        </view>

        <view
            class="hero"
            :style="{
                transform: `translateY(${-headerScrollTop}px)`,
                opacity: 1 - headerScrollTop / heroHeightPx,
            }"
        >
            <image class="hero__image" :src="heroImage" mode="aspectFill"></image>
            <view class="hero__overlay"></view>
            <view class="hero__back" :style="{ top: `${statusBarHeight + 12}px` }" @click="goBack">
                <mdi-icon path="/static/icons/arrow-left.svg" size="20px" color="#ffffff"></mdi-icon>
            </view>
            <view class="hero__content">
                <view class="hero__badge">{{ heroBadge }}</view>
                <view class="hero__title">{{ heroTitle }}</view>
                <view class="hero__desc">{{ heroDesc }}</view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
    onLoad,
    onUnload,
    onReachBottom,
    onPullDownRefresh,
    onPageScroll,
    onShareAppMessage,
    onShareTimeline,
} from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { apiGetClassify, apiGetClassList } from '@/api/wallpaper.js';
import { gotoHome, handlePicUrl } from '@/utils/common.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useAppStore } from '@/stores/app.js';
import { useUserStore } from '@/stores/user.js';
import { getNavBarHeight, getStatusBarHeight, getTitleBarHeight } from '@/utils/system.js';

const { t, locale } = useI18n();
const settingsStore = useSettingsStore();
const appStore = useAppStore();
const userStore = useUserStore();
const isAdmin = computed(() => !!userStore.isAdmin);
const isDark = computed(() => settingsStore.isDark);
const isEn = computed(() => locale.value === 'en');

const props = defineProps({
    id: String,
    name: String,
    name_en: String,
});

const activeButton = ref('');
const dateSortAsc = ref(true);
const headerScrollTop = ref(0);
const topbarFadeLengthPx = uni.upx2px(180);
const currentClassify = ref(null);
const classList = ref([]);
const currentId = ref('');

const onListUpdate = (e) => {
    classList.value = e.images;
};

const onScroll = (e) => {
    const scrollTop = e.scrollTop;
    headerScrollTop.value = Math.min(scrollTop, heroHeightPx);
};

const getSortordByKey = (key, isAsc = dateSortAsc.value) => {
    if (key === 'recommend') return 'random';
    if (key === 'score') return 'score';
    if (key === 'views') return 'views';
    if (key === 'downloads') return 'downloads';
    if (key === 'date') return isAsc ? 'date_asc' : 'date_desc';
    return '';
};

const tabs = computed(() => [
    {
        label: t('common.random'),
        query: { classify_id: parseInt(currentId.value), sortord: 'random' },
    },
    {
        label: t('common.score'),
        query: { classify_id: parseInt(currentId.value), sortord: 'score' },
    },
    {
        label: t('common.publishDate'),
        query: { classify_id: parseInt(currentId.value), sortord: 'date_desc' },
        isDate: true,
    },
]);

const syncClassifySortState = () => {
    settingsStore.options.classifySortKey = activeButton.value;
    settingsStore.options.classifyDateAsc = dateSortAsc.value;
};

const restoreClassifySortState = () => {
    activeButton.value = settingsStore.options.classifySortKey || '';
    dateSortAsc.value =
        typeof settingsStore.options.classifyDateAsc === 'boolean' ? settingsStore.options.classifyDateAsc : false;
};

const statusBarHeight = ref(getStatusBarHeight() || 0);
const titleBarHeight = ref(getTitleBarHeight() || 44);
const navBarHeight = ref(getNavBarHeight() || 88);
const heroHeightPx = uni.upx2px(560);

const topbarOpacity = computed(() => {
    const revealStart = Math.max(0, heroHeightPx - navBarHeight.value - topbarFadeLengthPx);
    const revealEnd = heroHeightPx - uni.upx2px(44);
    const scroll = headerScrollTop.value;
    if (scroll <= revealStart) return 0;
    if (scroll >= revealEnd) return 1;
    return (scroll - revealStart) / (revealEnd - revealStart);
});

const heroImage = computed(() => {
    // 优先级 1: 分类专属封面 (currentClassify)
    if (currentClassify.value?.picurl) {
        if (currentClassify.value.picurl.includes('classify/')) {
            return currentClassify.value.picurl;
        }
        return currentClassify.value.mediumPicurl;
    }
    // 优先级 2: 列表首图 (classList)
    if (classList.value?.[0]?.picurl) {
        return classList.value[0].mediumPicurl || classList.value[0].picurl;
    }
    // 优先级 3: 默认图
    return '/static/images/guide/guide1.png';
});

const heroBadge = computed(() => `${t('common.recommend')} CATEGORY`);

const heroTitle = computed(() => {
    const name = (isEn.value ? currentClassify.value?.name_en : currentClassify.value?.name) || t('category.title');
    return name.toUpperCase();
});

const heroDesc = computed(() => {
    return `${heroTitle.value} · ${t('category.desc')}`;
});

const queryParams = ref({
    classify_id: parseInt(props.id),
    pageNum: 1,
    pageSize: 12,
    sortord: '',
});

const init = (sortord = '') => {
    queryParams.value = {
        classify_id: parseInt(props.id),
        pageNum: 1,
        pageSize: 12,
        sortord: sortord || getSortordByKey(activeButton.value, dateSortAsc.value),
    };
};

const fetchClassifyInfo = async (id) => {
    // 1. 尝试从缓存获取
    let cacheList = appStore.classifyList || [];
    let match = cacheList.find((item) => String(item.id) === String(id));

    if (!match) {
        // 2. 缓存未命中的话，调用接口获取全部分类
        try {
            const res = await apiGetClassify({ pageSize: 100 });
            cacheList = (res.data || []).map((item) => handlePicUrl(item));
            appStore.classifyList = cacheList;
            match = cacheList.find((item) => String(item.id) === String(id));
        } catch (e) {
            console.error('Failed to fetch classify info:', e);
        }
    }

    currentClassify.value = match || null;
};

const onSortQuery = (key) => {
    if (key === 'date') {
        activeButton.value = 'date';
        dateSortAsc.value = !dateSortAsc.value;
    } else {
        activeButton.value = key;
        dateSortAsc.value = false;
    }
    syncClassifySortState();
};

const onChangeColumn = () => {
    settingsStore.options.column = settingsStore.options.column === 3 ? 2 : 3;
};

const onChangeView = () => {
    settingsStore.options.view = settingsStore.options.view === 'window' ? 'waterfall' : 'window';
};

const goBack = () => {
    uni.navigateBack({
        fail: () => {
            uni.reLaunch({
                url: '/pages/app/index',
            });
        },
    });
};

const goSearch = () => {
    uni.navigateTo({
        url: '/pages/app/search',
    });
};

onLoad((e) => {
    const { id } = e;
    if (!id) {
        gotoHome();
        return;
    }
    currentId.value = id;
    if (isAdmin.value) {
        restoreClassifySortState();
    }
    fetchClassifyInfo(id);
});

onUnload(() => {
    appStore.wallList = [];
});

onShareAppMessage(() => {
    return {
        title: '本我壁纸: ' + props.name,
        path: '/pages/app/classlist?id=' + queryParams.value.classify_id + '&name=' + props.name,
    };
});

onShareTimeline(() => {
    return {
        title: '本我壁纸: ' + props.name,
    };
});
</script>

<style lang="scss" scoped>
.layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background: #0b1017;

    &.theme-light {
        background: var(--page-background);
    }
}

.top-shell {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 100;
    transition: opacity 0.2s ease;
}

.status-bar-bg {
    width: 100%;
    background: #0b1017;

    .theme-light & {
        background: var(--page-background);
    }
}

.topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24rpx;
    background: #0b1017;
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);

    .theme-light & {
        background: var(--page-background);
        border-bottom: 1rpx solid rgba(0, 0, 0, 0.06);
    }
}

.topbar__left {
    display: flex;
    align-items: center;
    gap: 18rpx;
    min-width: 0;
}

.topbar__back,
.topbar__icon {
    width: 70rpx;
    height: 70rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.topbar__back {
    background: rgba(97, 154, 239, 0.12);
    border: 1rpx solid rgba(97, 154, 239, 0.16);

    .theme-light & {
        background: rgba(97, 154, 239, 0.08);
        border: 1rpx solid rgba(97, 154, 239, 0.12);
    }
}

.topbar__back--bar {
    background: rgba(97, 154, 239, 0.08);

    .theme-light & {
        background: rgba(97, 154, 239, 0.06);
    }
}

.topbar__title {
    font-size: 34rpx;
    font-weight: 700;
    color: #f8fbff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 420rpx;

    .theme-light & {
        color: var(--text-primary);
    }
}

.topbar__actions {
    display: flex;
    align-items: center;
    gap: 10rpx;
}

.topbar__icon {
    background: rgba(255, 255, 255, 0.04);

    .theme-light & {
        background: rgba(0, 0, 0, 0.04);
    }
}

.fill {
    flex-shrink: 0;
}

.content-wrapper {
    flex: 1;
    width: 100%;
    position: relative;
    overflow: hidden;
}

.hero {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 560rpx;
    z-index: 10;
    pointer-events: none;
    will-change: transform, opacity;
}

.hero__content,
.hero__back {
    pointer-events: auto;
}

.hero__back {
    position: absolute;
    left: 24rpx;
    z-index: 10;
    width: 72rpx;
    height: 72rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(10, 14, 21, 0.46);
    border: 1rpx solid rgba(255, 255, 255, 0.08);
}

.hero__image {
    width: 100%;
    height: 100%;
}

.hero__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(8, 12, 18, 0.1) 0%, rgba(8, 12, 18, 0.26) 45%, rgba(8, 12, 18, 0.92) 100%);

    .theme-light & {
        background: linear-gradient(180deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.15) 45%, rgba(0, 0, 0, 0.7) 100%);
    }
}

.hero__content {
    position: absolute;
    left: 28rpx;
    right: 28rpx;
    bottom: 34rpx;
    z-index: 1;
}

.hero__badge {
    display: inline-flex;
    align-items: center;
    min-height: 40rpx;
    padding: 0 14rpx;
    border-radius: 999rpx;
    background: rgba(97, 154, 239, 0.16);
    border: 1rpx solid rgba(97, 154, 239, 0.22);
    color: #7fb2ff;
    font-size: 18rpx;
    font-weight: 800;
    letter-spacing: 2rpx;
    margin-bottom: 14rpx;
}

.hero__title {
    font-size: 66rpx;
    font-weight: 900;
    line-height: 0.95;
    letter-spacing: -2rpx;
    color: #ffffff;
    text-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.34);
}

.hero__desc {
    margin-top: 12rpx;
    max-width: 540rpx;
    font-size: 24rpx;
    line-height: 1.7;
    color: rgba(226, 232, 240, 0.76);
}

.content-wrapper {
    flex: 1;
    min-height: 0;
    position: relative;
}

.loadingLayout {
    padding: 26rpx 0 0;
}
</style>
