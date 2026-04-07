<template>
    <view class="bars-page" :class="[`theme-${currentTheme}`]">
        <glass-nav-bar
            title="设计导航组件"
            subtitle="顶部栏与底部栏预览"
            eyebrow="UI TEST"
            :right-text="themeButtonText"
            searchable
            :theme="currentTheme"
            @right-click="handleAction"
        ></glass-nav-bar>

        <view class="bars-page__body">
            <view class="hero-card">
                <view class="hero-card__badge">Component Demo</view>
                <view class="hero-card__title">自定义导航栏与底部栏</view>
                <view class="hero-card__desc">
                    这里用一个独立测试页把新的顶部导航和底部导航先跑通。点击底部按钮会按现在应用的主入口方式跳转，方便我们后续直接替换到真实页面。
                </view>
            </view>

            <view class="section-card">
                <view class="section-card__title">顶部栏特性</view>
                <view class="feature-list">
                    <view class="feature-item">支持返回、搜索、右侧操作按钮</view>
                    <view class="feature-item">自动适配状态栏高度和刘海区域</view>
                    <view class="feature-item">玻璃拟态外观，适合当前应用的轻盈风格</view>
                </view>
            </view>

            <view class="section-card">
                <view class="section-card__title">底部栏特性</view>
                <view class="preview-grid">
                    <view class="preview-tile">
                        <view class="preview-tile__label">推荐</view>
                        <view class="preview-tile__value">切回首页</view>
                    </view>
                    <view class="preview-tile">
                        <view class="preview-tile__label">分类</view>
                        <view class="preview-tile__value">模仿 tab 跳转</view>
                    </view>
                    <view class="preview-tile">
                        <view class="preview-tile__label">发现</view>
                        <view class="preview-tile__value">进入分析页</view>
                    </view>
                    <view class="preview-tile">
                        <view class="preview-tile__label">我的</view>
                        <view class="preview-tile__value">进入个人中心</view>
                    </view>
                </view>
            </view>

            <view class="section-card">
                <view class="section-card__title">示例操作</view>
                <view class="action-row">
                    <button class="action-btn" @click="goPage('/pages/app/index', true)">打开首页</button>
                    <button class="action-btn action-btn--ghost" @click="goPage('/pages/discover/discover', true)">打开发现</button>
                </view>
            </view>
        </view>

        <glass-tab-bar
            :current-path="currentTabPath"
            :theme="currentTheme"
            :disable-navigation="true"
            @change="handleTabChange"
        ></glass-tab-bar>
    </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import GlassNavBar from '@/components/glass-nav-bar/glass-nav-bar.vue';
import GlassTabBar from '@/components/glass-tab-bar/glass-tab-bar.vue';

const currentTheme = ref(uni.getStorageSync('theme') || 'light');
const currentTabPath = ref('/pages/discover/discover');
const themeButtonText = computed(() => (currentTheme.value === 'dark' ? '浅色' : '深色'));

const handleAction = () => {
    currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark';
    uni.setStorageSync('theme', currentTheme.value);
    // #ifdef APP
    plus.nativeUI.setUIStyle(currentTheme.value);
    // #endif
};

const goPage = (url, isTab = false) => {
    if (isTab) {
        uni.switchTab({ url });
        return;
    }
    uni.navigateTo({ url });
};

const handleTabChange = (item) => {
    currentTabPath.value = item.pagePath;
};
</script>

<style lang="scss" scoped>
.bars-page {
    --bars-bg-1: rgba(255, 184, 202, 0.28);
    --bars-bg-2: rgba(115, 215, 187, 0.18);
    --bars-bg-main-1: #f8fbff;
    --bars-bg-main-2: #f4f6fb;
    --bars-bg-main-3: #eef2f8;
    --bars-panel-border: rgba(255, 255, 255, 0.94);
    --bars-panel-start: rgba(255, 255, 255, 0.32);
    --bars-panel-end: rgba(248, 250, 255, 0.18);
    --bars-panel-shadow: rgba(15, 23, 42, 0);
    --bars-badge-bg: rgba(40, 179, 137, 0.12);
    --bars-badge-text: #0f8b6d;
    --bars-title: #18202a;
    --bars-desc: rgba(24, 32, 42, 0.64);
    --bars-subtle-card: rgba(255, 255, 255, 0.16);
    --bars-divider: rgba(24, 32, 42, 0.08);
    min-height: 100vh;
    background:
        radial-gradient(circle at top right, var(--bars-bg-1), transparent 30%),
        radial-gradient(circle at left center, var(--bars-bg-2), transparent 32%),
        linear-gradient(180deg, var(--bars-bg-main-1) 0%, var(--bars-bg-main-2) 44%, var(--bars-bg-main-3) 100%);
}

.bars-page.theme-dark {
    --bars-bg-1: rgba(43, 140, 238, 0.2);
    --bars-bg-2: rgba(16, 185, 129, 0.14);
    --bars-bg-main-1: #050913;
    --bars-bg-main-2: #080f1b;
    --bars-bg-main-3: #0b1320;
    --bars-panel-border: rgba(148, 163, 184, 0.14);
    --bars-panel-start: rgba(20, 30, 42, 0.22);
    --bars-panel-end: rgba(16, 24, 36, 0.12);
    --bars-panel-shadow: rgba(0, 0, 0, 0);
    --bars-badge-bg: rgba(40, 179, 137, 0.18);
    --bars-badge-text: #6ee7b7;
    --bars-title: #f8fafc;
    --bars-desc: rgba(226, 232, 240, 0.68);
    --bars-subtle-card: rgba(255, 255, 255, 0.05);
    --bars-divider: rgba(148, 163, 184, 0.12);
}

.bars-page__body {
    padding: 0 24rpx 24rpx;
}

.hero-card,
.section-card {
    border-radius: 0;
    border: none;
    border-bottom: 1rpx solid var(--bars-divider);
    background: transparent;
    box-shadow: none;
    backdrop-filter: none;
}

.hero-card {
    padding: 12rpx 0 28rpx;
}

.hero-card__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 44rpx;
    padding: 0 18rpx;
    border-radius: 999rpx;
    background: var(--bars-badge-bg);
    color: var(--bars-badge-text);
    font-size: 20rpx;
    font-weight: 700;
    letter-spacing: 2rpx;
    margin-bottom: 18rpx;
}

.hero-card__title {
    font-size: 44rpx;
    line-height: 1.2;
    font-weight: 700;
    color: var(--bars-title);
}

.hero-card__desc {
    margin-top: 18rpx;
    font-size: 27rpx;
    line-height: 1.8;
    color: var(--bars-desc);
}

.section-card {
    margin-top: 22rpx;
    padding: 0 0 28rpx;
}

.section-card__title {
    font-size: 30rpx;
    font-weight: 700;
    color: var(--bars-title);
    margin-bottom: 18rpx;
}

.feature-list {
    display: flex;
    flex-direction: column;
    gap: 14rpx;
}

.feature-item {
    padding: 20rpx 0;
    border-radius: 0;
    background: transparent;
    border-bottom: 1rpx solid var(--bars-divider);
    color: var(--bars-desc);
    font-size: 26rpx;
    line-height: 1.6;
}

.feature-item:last-child {
    border-bottom: none;
}

.preview-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16rpx;
}

.preview-tile {
    padding: 24rpx 0;
    border-radius: 0;
    background: var(--bars-subtle-card);
    border-bottom: 1rpx solid var(--bars-divider);
}

.preview-tile__label {
    font-size: 22rpx;
    color: var(--bars-desc);
    margin-bottom: 8rpx;
}

.preview-tile__value {
    font-size: 28rpx;
    font-weight: 600;
    color: var(--bars-title);
}

.action-row {
    display: flex;
    gap: 16rpx;
}

.action-btn {
    flex: 1;
    height: 84rpx;
    border: none;
    border-radius: 999rpx;
    background: linear-gradient(135deg, #28b389, #179d76);
    color: #fff;
    font-size: 28rpx;
    font-weight: 600;
}

.action-btn::after {
    border: none;
}

.action-btn--ghost {
    background: var(--bars-subtle-card);
    color: var(--bars-title);
}
</style>
