<template>
    <view class="layout">
        <view v-if="showTopbar" class="top-shell">
            <view class="status-bar-bg" :style="{ height: `${statusBarHeight}px` }"></view>
            <view class="topbar" :style="{ top: `${statusBarHeight}px`, height: `${titleBarHeight}px` }">
                <view class="topbar__left">
                    <view class="topbar__back topbar__back--bar" @click="goBack">
                        <mdi-icon path="/static/icons/arrow-left.svg" size="20px" color="#eef5ff"></mdi-icon>
                    </view>
                    <view class="topbar__title">{{ props.name || t('category.title') }}</view>
                </view>
                <view class="topbar__actions">
                    <view class="topbar__icon" @click="goSearch">
                        <uni-icons type="search" size="18" color="#94a3b8"></uni-icons>
                    </view>
                    <view class="topbar__icon">
                        <uni-icons type="more-filled" size="18" color="#94a3b8"></uni-icons>
                    </view>
                </view>
            </view>
        </view>

        <view class="fill" :style="{ height: `${showTopbar ? navBarHeight : 0}px` }"></view>

        <view class="hero">
            <image class="hero__image" :src="heroImage" mode="aspectFill"></image>
            <view class="hero__overlay"></view>
            <view class="hero__back" :style="{ top: `${statusBarHeight + 12}px` }" @click="goBack">
                <mdi-icon path="/static/icons/arrow-left.svg" size="20px" color="#eef5ff"></mdi-icon>
            </view>
            <view class="hero__content">
                <view class="hero__badge">{{ heroBadge }}</view>
                <view class="hero__title">{{ heroTitle }}</view>
                <view class="hero__desc">{{ heroDesc }}</view>
            </view>
        </view>

        <view class="toolbar" :style="{ top: `${showTopbar ? navBarHeight : 0}px` }">
            <scroll-view scroll-x class="toolbar__chips" show-scrollbar="false">
                <view class="toolbar__chips-inner">
                    <view class="toolbar__chip" :class="{ 'is-active': activeButton === 'recommend' }" @click="onRecommend">
                        {{ t('common.recommend') }}
                    </view>
                    <view class="toolbar__chip" :class="{ 'is-active': activeButton === 'score' }" @click="onScore">
                        {{ t('common.score') }}
                    </view>
                    <view class="toolbar__chip" :class="{ 'is-active': activeButton === 'date' }" @click="onDateSort">
                        <text>{{ t('common.publishDate') }}</text>
                        <uni-icons
                            v-if="activeButton === 'date'"
                            :type="dateSortAsc ? 'arrow-up' : 'arrow-down'"
                            size="13"
                            color="#dce8ff"
                        ></uni-icons>
                    </view>
                </view>
            </scroll-view>

            <view class="toolbar__actions">
                <view class="toolbar__action" @click="onChangeColumn">
                    <image
                        class="toolbar__action-icon"
                        v-if="settingsStore.options.column === 3"
                        src="/static/icons/numeric-3-box.svg"
                        mode="aspectFit"
                    ></image>
                    <image class="toolbar__action-icon" v-else src="/static/icons/numeric-2-box.svg" mode="aspectFit"></image>
                </view>
                <view class="toolbar__action" @click="onChangeView">
                    <image
                        class="toolbar__action-icon"
                        v-if="settingsStore.options.view === 'window'"
                        src="/static/icons/view-grid.svg"
                        mode="aspectFit"
                    ></image>
                    <image class="toolbar__action-icon" v-else src="/static/icons/view-dashboard.svg" mode="aspectFit"></image>
                </view>
            </view>
        </view>

        <view class="content-wrapper">
            <pics-view :classList="classList"></pics-view>

            <view class="loadingLayout" v-show="noData || isRunning">
                <uni-load-more :status="noData ? 'noMore' : 'loading'"></uni-load-more>
            </view>

            <back-to-top ref="backToTopRef"></back-to-top>
            <view class="safe-area-inset-bottom"></view>
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
import { getNavBarHeight, getStatusBarHeight, getTitleBarHeight } from '@/utils/system.js';

const { t } = useI18n();
const settingsStore = useSettingsStore();

const backToTopRef = ref(null);
const isRunning = ref(false);
const noData = ref(false);
const classList = ref([]);
const pendingList = ref([]);
const activeButton = ref('');
const dateSortAsc = ref(true);
const showTopbar = ref(false);
const currentClassify = ref(null);

const statusBarHeight = ref(getStatusBarHeight() || 0);
const titleBarHeight = ref(getTitleBarHeight() || 44);
const navBarHeight = ref(getNavBarHeight() || 88);

const props = defineProps({
    id: String,
    name: String,
});

const heroImage = computed(() => {
    // 优先级 1: 分类专属封面 (currentClassify)
    if (currentClassify.value?.picurl) {
        if (currentClassify.value.picurl.includes("classify/") ) {
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

const heroTitle = computed(() => {
    const name = props.name || currentClassify.value?.name || t('category.title');
    return name.toUpperCase();
});

const heroBadge = computed(() => `${t('common.recommend')} CATEGORY`);

const heroDesc = computed(() => {
    const name = props.name || currentClassify.value?.name || t('category.title');
    return `${name} · ${t('category.desc')}`;
});

const queryParams = ref({
    classify_id: parseInt(props.id),
    pageNum: 1,
    pageSize: 12,
    sortord: '',
});

const init = (sortord = '', resetClassList = []) => {
    queryParams.value = {
        classify_id: parseInt(props.id),
        pageNum: 1,
        pageSize: 12,
        sortord,
    };
    noData.value = false;
    classList.value = resetClassList;
};

const fetchClassifyInfo = async (id) => {
    // 1. 尝试从缓存获取
    let cacheList = uni.getStorageSync('classifyList') || [];
    let match = cacheList.find((item) => String(item.id) === String(id));

    if (!match) {
        // 2. 缓存未命中的话，调用接口获取全部分类
        try {
            const res = await apiGetClassify({ pageSize: 100 });
            cacheList = (res.data || []).map((item) => handlePicUrl(item));
            uni.setStorageSync('classifyList', cacheList);
            match = cacheList.find((item) => String(item.id) === String(id));
        } catch (e) {
            console.error('Failed to fetch classify info:', e);
        }
    } else {
        currentClassify.value = match;
    }
};

const getClassList = async () => {
    try {
        uni.showLoading();
        isRunning.value = true;

        const res = await apiGetClassList(queryParams.value);
        const fullData = (res.data || []).map((item) => handlePicUrl(item));

        pendingList.value.push(...fullData);
        classList.value = [...pendingList.value];

        if (queryParams.value.pageNum >= res.pagination.total_pages) noData.value = true;
        uni.setStorageSync('wallList', classList.value);
    } finally {
        uni.hideLoading();
        isRunning.value = false;
    }
};

const runQuery = (sortord) => {
    init(sortord, [...pendingList.value]);
    pendingList.value = [];
    getClassList();
    backToTopRef.value?.scrollToTop();
};

const onRecommend = () => {
    activeButton.value = 'recommend';
    dateSortAsc.value = true;
    runQuery('random');
};

const onScore = () => {
    activeButton.value = 'score';
    dateSortAsc.value = true;
    runQuery('score');
};

const onDateSort = () => {
    activeButton.value = 'date';
    dateSortAsc.value = !dateSortAsc.value;
    runQuery(dateSortAsc.value ? 'date_asc' : 'date_desc');
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
    fetchClassifyInfo(id);
    getClassList();
});

onUnload(() => {
    uni.removeStorageSync('wallList');
});

onReachBottom(() => {
    if (noData.value) return;
    queryParams.value.pageNum++;
    getClassList();
});

onPullDownRefresh(() => {
    classList.value = [];
    pendingList.value = [];
    uni.removeStorageSync('wallList');
    getClassList();
    uni.stopPullDownRefresh();
    isRunning.value = false;
});

onPageScroll((e) => {
    backToTopRef.value.showBackToTop = e.scrollTop > 260;
    const heroHeightPx = uni.upx2px(560);
    showTopbar.value = e.scrollTop >= Math.max(heroHeightPx - navBarHeight.value, 0);
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
    min-height: 100vh;
    background:
        radial-gradient(circle at top right, rgba(97, 154, 239, 0.18), transparent 24%),
        linear-gradient(180deg, #0b1017 0%, #10161f 32%, #0b1017 100%);
}

.top-shell {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    z-index: 120;
}

.status-bar-bg {
    width: 100%;
    background: #0b1017;
}

.topbar {
    position: fixed;
    left: 0;
    right: 0;
    z-index: 121;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24rpx;
    background: #0b1017;
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
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
}

.topbar__back--bar {
    background: rgba(97, 154, 239, 0.08);
}

.topbar__title {
    font-size: 34rpx;
    font-weight: 700;
    color: #f8fbff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 420rpx;
}

.topbar__actions {
    display: flex;
    align-items: center;
    gap: 10rpx;
}

.topbar__icon {
    background: rgba(255, 255, 255, 0.04);
}

.fill {
    width: 100%;
}

.hero {
    position: relative;
    width: 100%;
    height: 560rpx;
    overflow: hidden;
}

.hero__back {
    position: absolute;
    left: 24rpx;
    z-index: 2;
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

.toolbar {
    position: sticky;
    z-index: 80;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    padding: 18rpx 24rpx 20rpx;
    background: rgba(11, 16, 23, 0.94);
    backdrop-filter: blur(18rpx);
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.04);
}

.toolbar__chips {
    flex: 1;
    white-space: nowrap;
}

.toolbar__chips-inner {
    display: inline-flex;
    align-items: center;
    gap: 14rpx;
    padding-right: 16rpx;
}

.toolbar__chip {
    min-height: 68rpx;
    padding: 0 26rpx;
    border-radius: 999rpx;
    display: inline-flex;
    align-items: center;
    gap: 8rpx;
    font-size: 24rpx;
    font-weight: 600;
    color: #c2cfdf;
    background: rgba(32, 40, 52, 0.92);
    border: 1rpx solid rgba(255, 255, 255, 0.05);
}

.toolbar__chip.is-active {
    color: #f8fbff;
    background: #619aef;
    border-color: rgba(97, 154, 239, 0.24);
    box-shadow: 0 14rpx 30rpx rgba(97, 154, 239, 0.24);
}

.toolbar__actions {
    display: flex;
    align-items: center;
    gap: 12rpx;
    flex-shrink: 0;
}

.toolbar__action {
    width: 64rpx;
    height: 64rpx;
    border-radius: 18rpx;
    background: rgba(41, 52, 68, 0.96);
    border: 1rpx solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
}

.toolbar__action image {
    width: 38rpx;
    height: 38rpx;
}

.toolbar__action-icon {
    filter: brightness(0) saturate(100%) invert(94%) sepia(10%) saturate(473%) hue-rotate(183deg) brightness(103%)
        contrast(101%);
}

.content-wrapper {
    padding-bottom: 48rpx;
}

.loadingLayout {
    padding: 26rpx 0 0;
}
</style>
