<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 顶部常驻导航栏：毛玻璃背景渐变 + 优雅自适应返回/搜索 + 标题微升就位 -->
        <view class="top-shell">
            <!-- 毛玻璃半透明背景层，随滚动平滑展现 -->
            <view
                class="top-shell__bg"
                :style="{
                    opacity: topbarProgress,
                }"
            ></view>

            <view class="status-bar-bg" :style="{ height: `${statusBarHeight}px` }"></view>
            <view class="topbar" :style="{ height: `${titleBarHeight}px` }">
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
                    <view
                        class="topbar__icon"
                        :class="{ 'is-solid': topbarProgress > 0.6 }"
                        @click="goSearch"
                    >
                        <uni-icons
                            type="search"
                            size="18"
                            :color="actionIconColor"
                        ></uni-icons>
                    </view>
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

        <!-- 瀑布流/网格内容区域 -->
        <view class="content-wrapper" :style="contentWrapperStyle">
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

        <!-- Hero 区域：视差慢滑 + 下拉拉伸 + 文字升腾淡出 -->
        <view class="hero" :style="heroContainerStyle">
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
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onUnload, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { apiGetClassify } from '@/api/wallpaper.js';
import { gotoHome, handlePicUrl } from '@/utils/common.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useAppStore } from '@/stores/app.js';
import { useUserStore } from '@/stores/user.js';
import { getNavBarHeight, getStatusBarHeight, getTitleBarHeight } from '@/utils/layout.js';
import { IS_INTERNATIONAL } from '@/utils/system.js';

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

const onListUpdate = (e) => {
    classList.value = e.images;
};

const onScroll = (e) => {
    const scrollTop = e.scrollTop;
    headerScrollTop.value = Math.min(scrollTop, heroHeightPx);
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
const titleBarHeight = ref(getTitleBarHeight() || 44);
const navBarHeight = computed(() => statusBarHeight.value + titleBarHeight.value);
const heroHeightPx = uni.upx2px(560);
const contentWrapperStyle = computed(() => ({
    paddingBottom: '0px',
}));

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

// Hero 容器位移
const heroContainerStyle = computed(() => {
    const scroll = headerScrollTop.value;
    const translateY = scroll > 0 ? -scroll : 0;
    return {
        transform: `translate3d(0, ${translateY}px, 0)`,
        // 完全被顶栏覆盖后隐藏，避免层级穿透与重绘
        opacity: scroll >= collapseDistance.value + 40 ? 0 : 1,
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
        return classList.value[0].mediumPicurl || classList.value[0].picurl;
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

onLoad((e) => {
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
    height: 100vh;
    overflow: hidden;
    background: var(--page-background);
}

.top-shell {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 100;
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
    width: 72rpx;
    height: 72rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    // 初始浮在大图上的半透明毛玻璃质感，无论背景明暗均清晰醒目
    background: rgba(10, 14, 21, 0.44);
    border: 1rpx solid rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(14rpx);
    -webkit-backdrop-filter: blur(14rpx);
    transition: background 0.22s ease, border-color 0.22s ease, transform 0.15s ease;

    &:active {
        transform: scale(0.92);
    }

    // 吸顶后的柔和背景胶囊
    &.is-solid {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.08);

        .theme-light & {
            background: rgba(0, 0, 0, 0.04);
            border-color: rgba(0, 0, 0, 0.05);
        }
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
    flex: 1;
    min-height: 0;
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
    overflow: hidden;
    will-change: transform, opacity;
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
