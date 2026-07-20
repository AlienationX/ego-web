<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- Ambient Color Glow Background -->
        <view class="hero-blur-bg" v-if="heroImage" :style="{ backgroundImage: `url(${heroImage})` }"></view>
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
                            :color="settingsStore.isDark ? '#f8fbff' : '#1e293b'"
                        ></mdi-icon>
                    </view>
                    <view class="topbar__title">{{ heroTitle }}</view>
                </view>
                <view class="topbar__actions">
                    <view class="topbar__icon" @click="goSearch">
                        <uni-icons type="search" size="18" :color="settingsStore.isDark ? '#94a3b8' : '#64748b'"></uni-icons>
                    </view>
                </view>
            </view>
        </view>

        <view class="content-wrapper" :style="contentWrapperStyle">
            <modern-pics-view
                v-if="tabs.length > 0"
                :show-header="true"
                :tabs="tabs"
                api-type="classList"
                :header-height="heroHeightPx"
                :tabs-height="44"
                :sticky-top="navBarHeight"
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
                <view class="hero__badge" v-if="currentSubject && currentSubject.is_locked">
                    <uni-icons type="vip-filled" size="12" color="#ffffff"></uni-icons>
                    <text style="margin-left: 6rpx;">VIP ONLY</text>
                </view>
                <view class="hero__badge" v-else-if="currentSubject && currentSubject.tags">
                    {{ currentSubject.tags.split(',')[0] }}
                </view>
                <view class="hero__badge" v-else>专题策划</view>
                <view class="hero__title">{{ heroTitle }}</view>
                <view class="hero__desc">{{ heroDesc }}</view>
            </view>
        </view>

        <custom-ad-banner v-slot="{ adActive }" @height-change="onAdHeightChange"></custom-ad-banner>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { apiGetSubjectDetail } from '@/api/wallpaper.js';
import { useSettingsStore } from '@/stores/settings.js';
import { getNavBarHeight, getStatusBarHeight, getTitleBarHeight } from '@/utils/layout.js';
import { handlePicUrl } from '@/utils/common.js';

const { t, locale } = useI18n();
const settingsStore = useSettingsStore();
const isEn = computed(() => locale.value === 'en');

const props = defineProps({
    id: String,
    name: String,
    name_en: String,
});

const headerScrollTop = ref(0);
const topbarFadeLengthPx = uni.upx2px(180);
const currentSubject = ref(null);
const currentId = ref('');

const onScroll = (e) => {
    headerScrollTop.value = Math.min(e.scrollTop, heroHeightPx);
};

const tabs = computed(() => {
    if (!currentId.value) return [];
    return [
        {
            label: t('common.random'),
            query: { subject_id: parseInt(currentId.value), sortord: 'random' },
        },
        {
            label: t('common.score'),
            query: { subject_id: parseInt(currentId.value), sortord: 'score' },
        },
        {
            label: t('common.publishDate'),
            query: { subject_id: parseInt(currentId.value), sortord: 'date_desc' },
            isDate: true,
        },
    ];
});

const statusBarHeight = ref(getStatusBarHeight() || 0);
const titleBarHeight = ref(getTitleBarHeight() || 44);
const navBarHeight = ref(getNavBarHeight() || 88);
const heroHeightPx = uni.upx2px(560);
const adHeight = ref(0);

const onAdHeightChange = (height) => {
    adHeight.value = Math.max(0, Number(height) || 0);
};

const contentWrapperStyle = computed(() => ({
    paddingBottom: adHeight.value > 0 ? `${adHeight.value}px` : '0px',
}));

const topbarOpacity = computed(() => {
    const revealStart = Math.max(0, heroHeightPx - navBarHeight.value - topbarFadeLengthPx);
    const revealEnd = heroHeightPx - uni.upx2px(44);
    const scroll = headerScrollTop.value;
    if (scroll <= revealStart) return 0;
    if (scroll >= revealEnd) return 1;
    return (scroll - revealStart) / (revealEnd - revealStart);
});

const heroImage = computed(() => {
    if (currentSubject.value && currentSubject.value.picurl) {
        return currentSubject.value.picurl;
    }
    return '';
});

const heroTitle = computed(() => {
    if (currentSubject.value) {
        return isEn.value ? (currentSubject.value.name_en || currentSubject.value.name) : currentSubject.value.name;
    }
    return props.name || '';
});

const heroDesc = computed(() => {
    if (currentSubject.value) {
        return isEn.value ? (currentSubject.value.content_en || currentSubject.value.content) : currentSubject.value.content;
    }
    return '';
});

const fetchSubjectDetail = async (id) => {
    try {
        const res = await apiGetSubjectDetail(id);
        if (res.code === 200 && res.data) {
            currentSubject.value = handlePicUrl(res.data);
        }
    } catch (err) {
        console.error('Failed to load subject detail:', err);
    }
};

const goBack = () => {
    uni.navigateBack({
        fail: () => {
            uni.reLaunch({ url: '/pages/app/index' });
        }
    });
};

const goSearch = () => {
    uni.navigateTo({
        url: '/pages/app/search',
    });
};

onLoad((options) => {
    const id = options.id || props.id;
    currentId.value = id;
    if (id) {
        fetchSubjectDetail(id);
    }
});
</script>

<style lang="scss" scoped>
.layout {
    background: var(--page-background);
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.top-shell {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 99;
}

.status-bar-bg {
    background: var(--page-background);
    width: 100%;
}

.topbar {
    width: 100%;
    background: var(--page-background);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30rpx;
    box-sizing: border-box;
}

.topbar__left {
    display: flex;
    align-items: center;
    gap: 16rpx;
    flex: 1;
    min-width: 0;
}

.topbar__back {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    width: 60rpx;
    height: 60rpx;

    &--bar {
        width: 48rpx;
        height: 48rpx;
    }
}

.topbar__title {
    font-size: 32rpx;
    font-weight: 700;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.topbar__actions {
    display: flex;
    align-items: center;
    gap: 20rpx;
}

.topbar__icon {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
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

.hero-blur-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 600rpx;
    opacity: 0.22;
    filter: blur(80px);
    transform: scale(1.2);
    z-index: 0;
    pointer-events: none;
    background-size: cover;
    background-position: center;

    .theme-light & {
        opacity: 0.12;
    }
}
</style>
