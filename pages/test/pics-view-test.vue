<template>
    <view class="layout" :class="isDark ? 'theme-dark' : 'theme-light'" @tap="onDebugTap">
        <!-- 顶部状态栏 + 导航栏 (模拟 classlist 的 top-shell) -->
        <view class="top-shell" :style="{ opacity: topbarOpacity, pointerEvents: topbarOpacity > 0.2 ? 'auto' : 'none' }">
            <view class="status-bar-bg" :style="{ height: `${statusBarHeight}px` }"></view>
            <view class="topbar" :style="{ top: `${statusBarHeight}px`, height: `${titleBarHeight}px` }">
                <view class="topbar__left">
                    <view class="topbar__back" @click="goBack">
                        <mdi-icon
                            path="/static/icons/arrow-left.svg"
                            size="20px"
                            :color="isDark ? '#f8fbff' : '#1e293b'"
                        ></mdi-icon>
                    </view>
                    <view class="topbar__title">TabbedPicsView Test</view>
                </view>
            </view>
        </view>

        <!-- 内容区域 -->
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

        <!-- Hero 区域 (模拟 classlist 的 hero，测试 z-index 遮挡) -->
        <view
            class="hero"
            :style="{ transform: `translateY(${-headerScrollTop}px)`, opacity: 1 - headerScrollTop / heroHeightPx }"
        >
            <view class="hero__bg"></view>
            <view class="hero__overlay"></view>
            <view class="hero__back" :style="{ top: `${statusBarHeight + 12}px` }" @click="goBack">
                <mdi-icon path="/static/icons/arrow-left.svg" size="20px" color="#ffffff"></mdi-icon>
            </view>
            <view class="hero__content">
                <view class="hero__badge">测试页面</view>
                <view class="hero__title">瀑布流点击测试</view>
                <view class="hero__desc">验证 header-bar pointer-events 修复是否生效</view>
            </view>
        </view>

        <!-- 调试信息面板 -->
        <view class="debug-panel" :style="{ top: `${navBarHeight}px` }">
            <view class="debug-section">
                <view class="debug-section__title">Scroll</view>
                <view class="debug-row">
                    <text class="debug-label">scrollTop:</text>
                    <text class="debug-val">{{ headerScrollTop }}</text>
                </view>
                <view class="debug-row">
                    <text class="debug-label">heroOpacity:</text>
                    <text class="debug-val">{{ (1 - headerScrollTop / heroHeightPx).toFixed(2) }}</text>
                </view>
            </view>
            <view class="debug-divider"></view>
            <view class="debug-section">
                <view class="debug-section__title">Tap</view>
                <view class="debug-row">
                    <text class="debug-label">坐标:</text>
                    <text class="debug-val">{{ tapCoord.x }}, {{ tapCoord.y }}</text>
                </view>
                <view class="debug-row">
                    <text class="debug-label">区域:</text>
                    <text class="debug-val" :style="{ color: tapZoneColor }">{{ tapZone }}</text>
                </view>
                <view class="debug-row">
                    <text class="debug-label">目标:</text>
                    <text class="debug-val">{{ tapTarget }}</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { getNavBarHeight, getStatusBarHeight, getTitleBarHeight } from '@/utils/layout.js';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const isDark = computed(() => settingsStore.isDark);

const headerScrollTop = ref(0);
const classList = ref([]);

const statusBarHeight = ref(getStatusBarHeight() || 0);
const titleBarHeight = ref(getTitleBarHeight() || 44);
const navBarHeight = ref(getNavBarHeight() || 88);
const heroHeightPx = uni.upx2px(560);

// ── 调试：点击坐标 & 区域 ──
const tapCoord = ref({ x: 0, y: 0 });
const tapZone = ref('—');
const tapTarget = ref('—');
const tapZoneColor = ref('#7fb2ff');

const getTapZone = (y) => {
    const navBottom = statusBarHeight.value + titleBarHeight.value;
    const heroBottom = heroHeightPx;

    if (y < navBottom) return { zone: 'top-shell(导航栏)', color: '#f59e0b' };
    if (y < heroBottom) return { zone: 'hero(遮罩层)', color: '#ef4444' };
    if (y < heroBottom + uni.upx2px(88)) return { zone: 'header-bar(标签栏)', color: '#f97316' };
    return { zone: 'waterfall(瀑布流)', color: '#22c55e' };
};

const onDebugTap = (e) => {
    const x = Math.round(e.detail.x);
    const y = Math.round(e.detail.y);
    tapCoord.value = { x, y };

    const zoneInfo = getTapZone(y);
    tapZone.value = zoneInfo.zone;
    tapZoneColor.value = zoneInfo.color;

    // 提取点击目标元素信息
    const target = e.target || {};
    const tag = target.tagName || '';
    const id = target.id || '';
    const cls = (target.className || '').replace(/\s+/g, ' ').trim();
    tapTarget.value = [tag, id, cls].filter(Boolean).join(' | ') || '(unknown)';

    console.log('[Test Tap]', { x, y, zone: zoneInfo.zone, target: tapTarget.value });
};

const topbarOpacity = computed(() => {
    const revealStart = Math.max(0, heroHeightPx - navBarHeight.value - uni.upx2px(180));
    const revealEnd = heroHeightPx - uni.upx2px(44);
    const scroll = headerScrollTop.value;
    if (scroll <= revealStart) return 0;
    if (scroll >= revealEnd) return 1;
    return (scroll - revealStart) / (revealEnd - revealStart);
});

const onListUpdate = (e) => {
    classList.value = e.images;
};

const onScroll = (e) => {
    const scrollTop = e.scrollTop;
    headerScrollTop.value = Math.min(scrollTop, heroHeightPx);
};

const goBack = () => {
    uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/app/index' }) });
};

// 使用真实分类数据构造 tabs
const tabs = computed(() => [
    {
        label: t('common.random') || '随机',
        query: { classify_id: 1, sortord: 'random' },
    },
    {
        label: t('common.score') || '评分',
        query: { classify_id: 1, sortord: 'score' },
    },
    {
        label: t('common.publishDate') || '日期',
        query: { classify_id: 1, sortord: 'date_desc' },
        isDate: true,
    },
]);
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

.topbar__back {
    width: 70rpx;
    height: 70rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(97, 154, 239, 0.12);
    border: 1rpx solid rgba(97, 154, 239, 0.16);

    .theme-light & {
        background: rgba(97, 154, 239, 0.08);
        border: 1rpx solid rgba(97, 154, 239, 0.12);
    }
}

.topbar__title {
    font-size: 34rpx;
    font-weight: 700;
    color: #f8fbff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    .theme-light & {
        color: var(--text-primary);
    }
}

.content-wrapper {
    flex: 1;
    min-height: 0;
    position: relative;
    overflow: hidden;
}

// ── Hero ──
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

.hero__bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.hero__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(8, 12, 18, 0.1) 0%, rgba(8, 12, 18, 0.26) 45%, rgba(8, 12, 18, 0.92) 100%);

    .theme-light & {
        background: linear-gradient(180deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.15) 45%, rgba(0, 0, 0, 0.7) 100%);
    }
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
    pointer-events: auto;
}

.hero__content {
    position: absolute;
    left: 28rpx;
    right: 28rpx;
    bottom: 34rpx;
    z-index: 1;
    pointer-events: auto;
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

// ── 调试面板 ──
.debug-panel {
    position: fixed;
    right: 12rpx;
    z-index: 200;
    background: rgba(0, 0, 0, 0.78);
    backdrop-filter: blur(12rpx);
    border-radius: 12rpx;
    padding: 10rpx 0;
    border: 1rpx solid rgba(255, 255, 255, 0.1);
    min-width: 260rpx;
}

.debug-section {
    padding: 4rpx 20rpx;
}

.debug-section__title {
    font-size: 20rpx;
    color: rgba(255, 255, 255, 0.35);
    font-weight: 600;
    letter-spacing: 1rpx;
    margin-bottom: 4rpx;
}

.debug-divider {
    height: 1rpx;
    background: rgba(255, 255, 255, 0.06);
    margin: 6rpx 12rpx;
}

.debug-row {
    display: flex;
    justify-content: space-between;
    gap: 12rpx;
    padding: 3rpx 0;
}

.debug-label {
    font-size: 22rpx;
    color: #94a3b8;
    flex-shrink: 0;
}

.debug-val {
    font-size: 22rpx;
    color: #7fb2ff;
    font-weight: 700;
    text-align: right;
    word-break: break-all;
}
</style>
