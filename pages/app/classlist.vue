<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 顶部常驻导航栏：毛玻璃背景渐变 + 单行一体化常驻吸顶 -->
        <view class="top-shell">
            <!-- 毛玻璃半透明背景层，随滚动平滑展现 -->
            <view
                class="top-shell__bg"
                :style="{
                    opacity: topbarProgress,
                }"
            ></view>

            <view class="status-bar-bg" :style="{ height: `${statusBarHeight}px` }"></view>
            <view class="topbar" :style="topbarStyle">
                <view class="topbar__left">
                    <view
                        class="topbar__back"
                        :class="{ 'is-solid': topbarProgress > 0.6 }"
                        @click="goBack"
                    >
                        <mdi-icon
                            path="/static/icons/arrow-left.svg"
                            size="20px"
                            :color="backIconColor"
                        ></mdi-icon>
                    </view>
                    <view class="topbar__title" :style="topbarTitleStyle">
                        {{ heroTitle }}
                    </view>
                </view>
                <view class="topbar__actions">
                    <!-- 单行一体化排序胶囊 -->
                    <view
                        class="topbar__sort"
                        :class="{ 'is-solid': topbarProgress > 0.6 }"
                        @click="toggleSortMenu"
                    >
                        <text class="topbar__sort-text">{{ currentSortLabel }}</text>
                        <mdi-icon
                            :path="isSortMenuOpen ? '/static/icons/chevron-up.svg' : '/static/icons/chevron-down.svg'"
                            size="12px"
                            :color="actionIconColor"
                        ></mdi-icon>
                    </view>

                    <!-- 单行一体化视图模式切换 (网格 / 瀑布流) -->
                    <view
                        class="topbar__icon"
                        :class="{ 'is-solid': topbarProgress > 0.6 }"
                        @click="toggleViewMode"
                    >
                        <mdi-icon
                            :path="!isWaterfall ? '/static/icons/view-grid.svg' : '/static/icons/view-dashboard.svg'"
                            size="18px"
                            :color="actionIconColor"
                        ></mdi-icon>
                    </view>

                    <!-- 搜索按钮 -->
                    <view
                        class="topbar__icon"
                        :class="{ 'is-solid': topbarProgress > 0.6 }"
                        @click="goSearch"
                    >
                        <mdi-icon
                            path="/static/icons/magnify.svg"
                            size="18px"
                            :color="actionIconColor"
                        ></mdi-icon>
                    </view>

                    <!-- 管理员更多按钮 -->
                    <view
                        class="topbar__icon"
                        :class="{ 'is-solid': topbarProgress > 0.6 }"
                        v-if="isAdmin"
                    >
                        <uni-icons
                            type="more-filled"
                            size="18"
                            :color="actionIconColor"
                        ></uni-icons>
                    </view>
                </view>
            </view>
        </view>

        <!-- 排序气泡下拉菜单独立浮层（置于页面顶层，杜绝点击穿透与父级溢出截断） -->
        <view v-if="isSortMenuOpen" class="sort-popover-layer">
            <!-- 全屏透明点击遮罩 -->
            <view class="sort-popover-mask" @click="closeSortMenu"></view>
            <!-- 气泡下拉菜单本体 -->
            <view class="sort-popover" :style="sortPopoverStyle" @click.stop>
                <view
                    v-for="(item, idx) in sortOptions"
                    :key="idx"
                    class="sort-popover__item"
                    :class="{ 'is-active': currentTabIndex === idx }"
                    @click.stop="selectSort(idx)"
                >
                    <text class="sort-popover__label">{{ item.label }}</text>
                    <view class="sort-popover__indicator">
                        <template v-if="item.isDate && currentTabIndex === idx">
                            <mdi-icon
                                :path="dateSortAsc ? '/static/icons/arrow-up.svg' : '/static/icons/arrow-down.svg'"
                                size="14px"
                                :color="activeSortColor"
                            ></mdi-icon>
                        </template>
                        <mdi-icon
                            v-else-if="currentTabIndex === idx"
                            path="/static/icons/check.svg"
                            size="16px"
                            :color="activeSortColor"
                        ></mdi-icon>
                    </view>
                </view>
            </view>
        </view>

        <!-- Hero 区域：保留 560rpx 封面大图 (视差慢滑 + 文字升腾淡出) -->
        <view class="hero">
            <image
                class="hero__image"
                :src="heroImage"
                mode="aspectFill"
                :style="heroImageStyle"
            ></image>
            <view class="hero__overlay" :style="heroOverlayStyle"></view>
            <view class="hero__content" :style="heroContentStyle">
                <view class="hero__badge">{{ heroBadge }}</view>
                <view class="hero__title">{{ heroTitle }}</view>
                <view class="hero__desc">{{ heroDesc }}</view>
            </view>
        </view>

        <!-- 瀑布流/网格内容区域 (单行一体化，去除冗余吸顶双层 Header) -->
        <view class="content-wrapper">
            <modern-pics-view
                v-if="tabs.length > 0"
                ref="picsViewRef"
                :show-header="false"
                :tabs="tabs"
                api-type="classList"
                :header-height="0"
                :tabs-height="0"
                :sticky-top="0"
                :classify-type="currentClassify?.classify_type"
                @update="onListUpdate"
                @change="onTabChange"
            ></modern-pics-view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onLoad, onUnload, onShareAppMessage, onShareTimeline, onReachBottom, onPageScroll } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { apiGetClassify } from '@/api/wallpaper.js';
import { gotoHome, handlePicUrl } from '@/utils/common.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useAppStore } from '@/stores/app.js';
import { useUserStore } from '@/stores/user.js';
import { getNavBarHeight, getStatusBarHeight, getTitleBarHeight } from '@/utils/layout.js';

const { t, locale } = useI18n();
const settingsStore = useSettingsStore();
const appStore = useAppStore();
const userStore = useUserStore();
const isAdmin = computed(() => !!userStore.isAdmin);
const isEn = computed(() => locale.value === 'en');

const props = defineProps({
    id: String,
    name: String,
    name_en: String,
});

const headerScrollTop = ref(0);
const topbarFadeLengthPx = uni.upx2px(180);
const currentClassify = ref(null);
const classList = ref([]);
const currentId = ref('');

const picsViewRef = ref(null);

onReachBottom(() => {
    picsViewRef.value?.loadMore();
});

const onListUpdate = (e) => {
    classList.value = e.images;
};

const tabs = computed(() => {
    if (!currentId.value) return [];
    return [
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
    ];
});

const statusBarHeight = ref(getStatusBarHeight() || 0);
const titleBarHeight = ref(44);
const navBarHeight = ref(88);
const capsuleWidth = ref(87);

const updateNavMetrics = () => {
    let sHeight = getStatusBarHeight() || 0;
    let tHeight = 44;
    let nHeight = sHeight + 44;

    // #ifdef MP-WEIXIN
    try {
        if (uni.getMenuButtonBoundingClientRect) {
            const menu = uni.getMenuButtonBoundingClientRect();
            if (menu && menu.top && menu.height) {
                capsuleWidth.value = menu.width || 87;
                sHeight = menu.top > 0 ? (sHeight || (menu.top - 4)) : sHeight;
                const topGap = Math.max(6, menu.top - sHeight);
                const bottomGap = Math.max(8, topGap);
                tHeight = menu.height + topGap + bottomGap;
                nHeight = sHeight + tHeight;
            }
        }
    } catch (e) {}
    // #endif

    statusBarHeight.value = sHeight;
    titleBarHeight.value = Math.max(44, tHeight);
    navBarHeight.value = statusBarHeight.value + titleBarHeight.value;
};

updateNavMetrics();

const topbarStyle = computed(() => {
    // #ifdef MP-WEIXIN
    const pr = capsuleWidth.value > 0 ? capsuleWidth.value + 12 : 100;
    return {
        height: `${titleBarHeight.value}px`,
        paddingRight: `${pr}px`,
    };
    // #endif
    // #ifndef MP-WEIXIN
    return {
        height: `${titleBarHeight.value}px`,
    };
    // #endif
});

// ── 单行一体化排序与视图模式 ──
const currentTabIndex = ref(0);
const dateSortAsc = ref(false);
const isSortMenuOpen = ref(false);

const sortOptions = computed(() => [
    { label: t('common.random') || '随机', isDate: false },
    { label: t('common.score') || '评分', isDate: false },
    { label: t('common.publishDate') || '最新', isDate: true },
]);

const currentSortLabel = computed(() => {
    const item = sortOptions.value[currentTabIndex.value];
    if (!item) return '';
    if (item.isDate) {
        return item.label + (dateSortAsc.value ? ' ↑' : ' ↓');
    }
    return item.label;
});

const toggleSortMenu = () => {
    isSortMenuOpen.value = !isSortMenuOpen.value;
};

const closeSortMenu = () => {
    isSortMenuOpen.value = false;
};

const selectSort = (idx) => {
    if (currentTabIndex.value === idx) {
        if (sortOptions.value[idx].isDate) {
            dateSortAsc.value = !dateSortAsc.value;
            picsViewRef.value?.handleTabClick(idx);
        }
    } else {
        currentTabIndex.value = idx;
        picsViewRef.value?.handleTabClick(idx);
    }
    closeSortMenu();
};

const onTabChange = (e) => {
    if (e && typeof e.index === 'number') {
        currentTabIndex.value = e.index;
        if (typeof e.isDateAsc === 'boolean') {
            dateSortAsc.value = e.isDateAsc;
        }
    }
};

const isWaterfall = computed(() => settingsStore.options.view !== 'window');
const toggleViewMode = () => {
    settingsStore.options.view = settingsStore.options.view === 'window' ? 'waterfall' : 'window';
};

const activeSortColor = computed(() => '#619aef');

const sortPopoverStyle = computed(() => {
    // #ifdef MP-WEIXIN
    const rightOffset = capsuleWidth.value > 0 ? capsuleWidth.value + 16 : 100;
    return {
        top: `${navBarHeight.value + 6}px`,
        right: `${rightOffset}px`,
    };
    // #endif
    // #ifndef MP-WEIXIN
    return {
        top: `${navBarHeight.value + 6}px`,
        right: '24rpx',
    };
    // #endif
});

onPageScroll((e) => {
    headerScrollTop.value = Math.max(0, e.scrollTop || 0);
    picsViewRef.value?.onPageScroll(e);
});

const heroHeightPx = uni.upx2px(560);

// 当 Tabs 触顶吸附的临界滚动距离
const collapseDistance = computed(() => Math.max(1, heroHeightPx - navBarHeight.value));

// 顶栏背景过渡进度 (0 到 1)
// 在 Tabs 达到吸顶前约 140rpx (70px) 开始渐变显现，到达吸顶时刚好为 1
const topbarProgress = computed(() => {
    const scroll = headerScrollTop.value;
    const fadeDistance = uni.upx2px(140);
    const start = Math.max(0, collapseDistance.value - fadeDistance);
    const end = collapseDistance.value;
    if (scroll <= start) return 0;
    if (scroll >= end) return 1;
    const t = (scroll - start) / (end - start);
    // 平滑缓动 (Hermite S 曲线插值，两端平缓减速)
    return t * t * (3 - 2 * t);
});

// 顶栏图标颜色平滑自适应
const backIconColor = computed(() => {
    if (topbarProgress.value > 0.5) {
        return settingsStore.isDark ? '#f8fbff' : '#1e293b';
    }
    return '#ffffff';
});

const actionIconColor = computed(() => {
    if (topbarProgress.value > 0.5) {
        return settingsStore.isDark ? '#94a3b8' : '#64748b';
    }
    return 'rgba(255, 255, 255, 0.88)';
});

// 顶栏标题从下方微幅升起浮现样式
const topbarTitleStyle = computed(() => {
    const progress = topbarProgress.value;
    const translateY = (1 - progress) * 14;
    return {
        opacity: progress,
        transform: `translate3d(0, ${translateY}px, 0)`,
        pointerEvents: progress > 0.2 ? 'auto' : 'none',
    };
});

// Hero 图片的视差移动与下拉弹性放大
const heroImageStyle = computed(() => {
    const scroll = headerScrollTop.value;
    if (scroll < 0) {
        // 下拉弹性放大 (根据下拉距离等比缩放)
        const scale = 1 + Math.abs(scroll) / heroHeightPx;
        return {
            transform: `scale(${scale})`,
            transformOrigin: 'center top',
        };
    }
    // 上滑视差移动（图片以 0.38 倍速度反向位移，产生深邃景深）
    const parallaxY = scroll * 0.38;
    return {
        transform: `translate3d(0, ${parallaxY}px, 0)`,
    };
});

// Hero 遮罩浓度微调
const heroOverlayStyle = computed(() => {
    const scroll = Math.max(0, headerScrollTop.value);
    const progress = Math.min(1, scroll / collapseDistance.value);
    return {
        opacity: 1 + progress * 0.15,
    };
});

// Hero 文字内容（徽标、大标题、副标题）的升腾淡出动效
const heroContentStyle = computed(() => {
    const scroll = Math.max(0, headerScrollTop.value);
    // 在上滑的前 65% 距离内优雅淡出完毕，完全不与顶栏冲突
    const fadeEnd = Math.max(1, collapseDistance.value * 0.65);
    const t = Math.min(1, scroll / fadeEnd);
    const progress = t * t; // 缓出曲线
    const opacity = Math.max(0, 1 - progress);
    const translateY = -t * 26; // 向上微浮 26px
    const scale = 1 - t * 0.04; // 微缩 4%
    return {
        opacity,
        transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
        transformOrigin: 'left bottom',
    };
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
        return classList.value[0].mediumPicurl || '';
    }
    // 优先级 3: 默认图
    return '';
});

const heroBadge = computed(() => `${t('common.recommend')} CATEGORY`);

const heroTitle = computed(() => {
    const name = (isEn.value ? currentClassify.value?.name_en : currentClassify.value?.name) || t('category.title');
    return name.toUpperCase();
});

const heroDesc = computed(() => {
    return `${heroTitle.value} · ${t('category.desc')}`;
});

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

onMounted(() => {
    updateNavMetrics();
});

onLoad((e) => {
    updateNavMetrics();
    const { id } = e;
    if (!id) {
        gotoHome();
        return;
    }
    currentId.value = id;
    fetchClassifyInfo(id);
});

onUnload(() => {
    appStore.wallList = [];
});

onShareAppMessage(() => {
    return {
        title: '本我壁纸: ' + props.name,
        path: '/pages/app/classlist?id=' + currentId.value + '&name=' + props.name,
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
    min-height: 100vh;
    background: var(--page-background);
}

.top-shell {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 999;
    pointer-events: auto;
}

.top-shell__bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    background: rgba(238, 241, 244, 0.85);
    backdrop-filter: blur(28rpx) saturate(180%);
    -webkit-backdrop-filter: blur(28rpx) saturate(180%);
    border-bottom: none;

    .theme-light & {
        background: rgba(238, 241, 244, 0.85);
        border-bottom: none;
    }

    .theme-dark & {
        background: rgba(24, 24, 24, 0.85);
        border-bottom: none;
    }
}

.status-bar-bg {
    width: 100%;
    background: transparent;
}

.topbar {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24rpx;
    background: transparent;
    border-bottom: none;
}

.topbar__left {
    display: flex;
    align-items: center;
    gap: 18rpx;
    min-width: 0;
}

.topbar__back,
.topbar__icon {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    cursor: pointer;
    transition: opacity 0.2s ease, transform 0.15s ease;

    &:active {
        opacity: 0.5;
        transform: scale(0.92);
    }
}

.topbar__sort {
    height: 64rpx;
    padding: 0 16rpx;
    display: flex;
    align-items: center;
    gap: 6rpx;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    cursor: pointer;
    transition: opacity 0.2s ease, transform 0.15s ease;

    &:active {
        opacity: 0.55;
        transform: scale(0.94);
    }

    .topbar__sort-text {
        font-size: 26rpx;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.92);
        white-space: nowrap;

        .theme-light .is-solid & {
            color: var(--text-primary);
        }
    }
}

/* 排序气泡下拉菜单浮层 (独立置于全屏顶层，杜绝点击失效与穿透) */
.sort-popover-layer {
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: auto;
}

.sort-popover-mask {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: rgba(0, 0, 0, 0.001); // 微透明保障移动端触摸精准捕获
}

.sort-popover {
    position: absolute;
    z-index: 2;
    min-width: 230rpx;
    padding: 12rpx;
    border-radius: 24rpx;
    background: var(--popup-background);
    border: 1rpx solid var(--popup-border);
    box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(36rpx);
    -webkit-backdrop-filter: blur(36rpx);
    animation: popover-fade-in 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    transform-origin: top right;

    &__item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 72rpx;
        padding: 0 20rpx;
        border-radius: 16rpx;
        cursor: pointer;
        transition: background-color 0.15s ease;

        &:active {
            background: rgba(0, 0, 0, 0.04);
            .theme-dark & {
                background: rgba(255, 255, 255, 0.06);
            }
        }

        &.is-active {
            background: rgba(97, 154, 239, 0.12);

            .sort-popover__label {
                color: #619aef;
                font-weight: 600;
            }
        }
    }

    &__label {
        font-size: 26rpx;
        color: var(--text-primary);
        font-weight: 500;
    }

    &__indicator {
        display: flex;
        align-items: center;
        margin-left: 16rpx;
    }
}

@keyframes popover-fade-in {
    from {
        opacity: 0;
        transform: translateY(-8rpx) scale(0.94);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
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
    will-change: transform, opacity;

    .theme-light & {
        color: var(--text-primary);
    }
}

.topbar__actions {
    display: flex;
    align-items: center;
    gap: 10rpx;
}

.content-wrapper {
    width: 100%;
    position: relative;
    box-sizing: border-box;
}

.hero {
    position: relative;
    width: 100%;
    height: 560rpx;
    z-index: 10;
    overflow: hidden;
}

.hero__image {
    position: absolute;
    top: -15%;
    left: 0;
    width: 100%;
    height: 130%;
    will-change: transform;
}

.hero__overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.14) 0%, rgba(15, 23, 42, 0.38) 45%, rgba(15, 23, 42, 0.96) 100%);

    .theme-light & {
        background: linear-gradient(180deg, rgba(0, 0, 0, 0.06) 0%, rgba(0, 0, 0, 0.22) 45%, rgba(0, 0, 0, 0.78) 100%);
    }
}

.hero__content {
    position: absolute;
    left: 28rpx;
    right: 28rpx;
    bottom: 34rpx;
    z-index: 2;
    pointer-events: auto;
    will-change: transform, opacity;
}

.hero__badge {
    display: inline-flex;
    align-items: center;
    min-height: 40rpx;
    padding: 0 14rpx;
    border-radius: 999rpx;
    background: rgba(97, 154, 239, 0.18);
    border: 1rpx solid rgba(97, 154, 239, 0.26);
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

.loadingLayout {
    padding: 26rpx 0 0;
}
</style>
