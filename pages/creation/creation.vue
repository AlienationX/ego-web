<template>
    <view class="creation-page" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 沉浸式顶部安全区与标题 -->
        <view class="creation-header" :style="{ paddingTop: `${statusBarHeight + 12}px` }">
            <view class="header-main">
                <view class="title-row">
                    <image class="sparkle-icon" src="/static/icons/creation.svg" mode="aspectFit" />
                    <text class="title-text">{{ t('creation.title') }}</text>
                </view>
                <text class="subtitle-text">{{ t('creation.subtitle') }}</text>
            </view>
        </view>

        <!-- 工具卡片列表（采用页面原生滚动） -->
        <view class="card-container" :style="{ paddingBottom: pagePaddingBottom }">
            <!-- 1. 壁纸创作工作台 (Hero 置顶主推大卡 - 暂隐藏，待bug修复后开放) -->
            <view v-if="false" class="tool-card tool-card--workbench" @click="handleWorkbenchClick">
                <view class="workbench-visual">
                    <!-- 三图层叠艺术展示效果 (复刻附件1) -->
                    <view class="preview-item preview-item--left">
                        <image
                            class="preview-img"
                            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&q=80"
                            mode="aspectFill"
                        />
                        <view class="type-badge">T</view>
                    </view>
                    <view class="preview-item preview-item--center">
                        <image
                            class="preview-img"
                            src="https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&q=80"
                            mode="aspectFill"
                        />
                        <view class="moon-arc"></view>
                    </view>
                    <view class="preview-item preview-item--right">
                        <image
                            class="preview-img"
                            src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&q=80"
                            mode="aspectFill"
                        />
                    </view>
                </view>

                <view class="card-content-row">
                    <view class="card-text-block">
                        <text class="card-title">{{ t('creation.workbenchTitle') }}</text>
                        <text class="card-desc">{{ t('creation.workbenchDesc') }}</text>
                    </view>
                    <view class="action-capsule-btn" @click.stop="handleWorkbenchClick">
                        <text class="btn-text">{{ t('creation.createNow') }}</text>
                    </view>
                </view>
            </view>

            <!-- 2. 艺术拼图 (主推核心功能入口 - 附件2/3) -->
            <view class="tool-card tool-card--puzzle" @click="goToPuzzle">
                <view class="card-text-block">
                    <text class="card-title">{{ t('creation.puzzleTitle') }}</text>
                    <text class="card-desc">{{ t('creation.puzzleDesc') }}</text>
                </view>
                <view class="puzzle-visual">
                    <view class="polaroid-stack polaroid-stack--1">
                        <image
                            class="stack-img"
                            src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=260&q=80"
                            mode="aspectFill"
                        />
                    </view>
                    <view class="polaroid-stack polaroid-stack--2">
                        <image
                            class="stack-img"
                            src="https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=260&q=80"
                            mode="aspectFill"
                        />
                    </view>
                </view>
            </view>

            <!-- 3. 磨砂伴侣 (主屏毛玻璃壁纸伴侣) -->
            <view class="tool-card tool-card--blur" @click="goToFrosted">
                <view class="card-text-block">
                    <text class="card-title">{{ t('creation.frostedTitle') }}</text>
                    <text class="card-desc">{{ t('creation.frostedDesc') }}</text>
                </view>
                <view class="blur-visual">
                    <view class="blur-img-wrapper">
                        <image
                            class="blur-demo-img"
                            src="https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=300&q=80"
                            mode="aspectFill"
                        />
                        <view class="blur-radial-halo"></view>
                    </view>
                </view>
            </view>

            <!-- 创作页横版原生广告卡片 -->
            <view class="creation-flow-ad-wrap">
                <custom-ad border-radius="40rpx" />
            </view>

            <!-- 4. 光影边框 (暂隐藏，待bug修复后开放) -->
            <view v-if="false" class="tool-card tool-card--frame" @click="showComingSoon">
                <view class="card-text-block">
                    <text class="card-title">{{ t('creation.frameTitle') }}</text>
                    <text class="card-desc">{{ t('creation.frameDesc') }}</text>
                </view>
                <view class="frame-visual">
                    <view class="frame-thumb frame-thumb--1">
                        <image
                            class="frame-img"
                            src="https://images.unsplash.com/photo-1522383225653-ed111181a951?w=260&q=80"
                            mode="aspectFill"
                        />
                    </view>
                    <view class="frame-thumb frame-thumb--2">
                        <image
                            class="frame-img"
                            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=260&q=80"
                            mode="aspectFill"
                        />
                    </view>
                </view>
            </view>

            <!-- 5. 灵感美学探索 (原 discover 页面功能) -->
            <view class="tool-card tool-card--explore" @click="goToDiscover">
                <view class="card-text-block">
                    <view class="explore-tag-row">
                        <text class="explore-badge">AI EXPLORE</text>
                    </view>
                    <text class="card-title">{{ t('creation.exploreTitle') }}</text>
                    <text class="card-desc">{{ t('creation.exploreDesc') }}</text>
                </view>
                <view class="explore-visual">
                    <view class="explore-orb">
                        <view class="orb-glow"></view>
                        <image
                            class="orb-cover"
                            src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=280&q=80"
                            mode="aspectFill"
                        />
                        <view class="sparkle-chip">✦</view>
                    </view>
                </view>
            </view>
        </view>

        <!-- 底部 TabBar 组件 -->
        <glass-tab-bar
            current-path="/pages/creation/creation"
            :theme="settingsStore.isDark ? 'dark' : 'light'"
        />
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserStore } from '@/stores/user.js';
import { getStatusBarHeight, getTabBarHeight } from '@/utils/layout.js';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const userStore = useUserStore();


const statusBarHeight = computed(() => getStatusBarHeight() || 24);

const pagePaddingBottom = computed(() => {
    const baseTabSpace = getTabBarHeight();
    return `${baseTabSpace + 20}px`;
});

// 进入艺术拼图功能
const goToPuzzle = () => {
    uni.navigateTo({
        url: '/pages/creation/puzzle',
    });
};

// 进入主屏磨砂伴侣功能
const goToFrosted = () => {
    uni.navigateTo({
        url: '/pages/creation/frosted',
    });
};

// 进入原 discover 美学探索功能
const goToDiscover = () => {
    uni.navigateTo({
        url: '/pages/creation/discover',
    });
};

// 点击壁纸工作台：进入全新壁纸创作工作台
const handleWorkbenchClick = () => {
    uni.navigateTo({
        url: '/pages/creation/workbench',
    });
};

// 待上线功能提示
const showComingSoon = () => {
    uni.showToast({
        title: t('creation.comingSoon'),
        icon: 'none',
        duration: 2000,
    });
};
</script>

<style lang="scss" scoped>
.creation-page {
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    transition: background-color 0.3s ease;

    &.theme-light {
        background-color: #f7f7f9;
        color: #111827;

        .creation-header .title-text {
            color: #0f172a;
        }
        .creation-header .subtitle-text {
            color: #64748b;
        }
        .creation-header .sparkle-icon {
            filter: invert(18%) sepia(85%) saturate(2200%) hue-rotate(252deg) brightness(85%) contrast(98%);
        }
    }

    &.theme-dark {
        background-color: #121216;
        color: #f8fafc;

        .creation-header .title-text {
            color: #f8fafc;
        }
        .creation-header .subtitle-text {
            color: #94a3b8;
        }
        .creation-header .sparkle-icon {
            filter: invert(80%) sepia(20%) saturate(1500%) hue-rotate(220deg);
        }
    }
}

/* 顶部标题区 */
.creation-header {
    padding: 0 40rpx 20rpx;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;

    .header-main {
        display: flex;
        flex-direction: column;
        gap: 8rpx;
    }

    .title-row {
        display: flex;
        align-items: center;
        gap: 12rpx;
    }

    .sparkle-icon {
        width: 44rpx;
        height: 44rpx;
    }

    .title-text {
        font-size: 46rpx;
        font-weight: 800;
        letter-spacing: -0.5rpx;
        line-height: 1.2;
    }

    .subtitle-text {
        font-size: 26rpx;
        font-weight: 400;
        line-height: 1.4;
    }
}

.card-container {
    padding: 12rpx 36rpx;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 32rpx;
}

/* 卡片入场位移渐显动效 */
@keyframes cardEntrance {
    0% {
        opacity: 0;
        transform: translateY(48rpx);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 通用卡片规范：无边框设计、立体弥散阴影、入场动画 */
.tool-card {
    position: relative;
    width: 100%;
    border-radius: 40rpx;
    box-sizing: border-box;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease;
    animation-name: cardEntrance;
    animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    animation-fill-mode: both;

    &:active {
        transform: scale(0.985);
    }
}

.card-text-block {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    z-index: 2;

    .card-title {
        font-size: 38rpx;
        font-weight: 800;
        line-height: 1.25;
        letter-spacing: -0.3rpx;
    }

    .card-desc {
        font-size: 25rpx;
        font-weight: 400;
        line-height: 1.4;
        opacity: 0.72;
    }
}

/* ─────────────────────────────────────────────────────────────
   1. 壁纸创作工作台 Hero Card
───────────────────────────────────────────────────────────── */
.tool-card--workbench {
    animation-duration: 0.8s;
    animation-delay: 0s;
    padding: 36rpx 36rpx 36rpx;
    display: flex;
    flex-direction: column;
    gap: 32rpx;

    .theme-light & {
        background: linear-gradient(145deg, #eef2ff 0%, #f4f3ff 45%, #faf5ff 100%);
        box-shadow: 0 20rpx 48rpx -10rpx rgba(99, 102, 241, 0.22), 0 8rpx 20rpx -4rpx rgba(15, 23, 42, 0.05);

        .card-title {
            color: #1e1b4b;
        }
        .card-desc {
            color: #4338ca;
        }
    }

    .theme-dark & {
        background: linear-gradient(145deg, #1e1b4b 0%, #2e1065 50%, #1a162b 100%);
        box-shadow: 0 20rpx 50rpx -8rpx rgba(0, 0, 0, 0.75), 0 8rpx 24rpx -4rpx rgba(99, 102, 241, 0.2);

        .card-title {
            color: #f5f3ff;
        }
        .card-desc {
            color: #c4b5fd;
        }
    }

    .workbench-visual {
        position: relative;
        height: 200rpx;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .preview-item {
        position: absolute;
        border-radius: 24rpx;
        overflow: hidden;
        box-shadow: 0 14rpx 32rpx rgba(15, 23, 42, 0.24);

        .theme-dark & {
            box-shadow: 0 16rpx 38rpx rgba(0, 0, 0, 0.75);
        }
    }

    .preview-item--left {
        left: 20rpx;
        bottom: 8rpx;
        width: 130rpx;
        height: 150rpx;
        transform: rotate(-10deg);
        z-index: 1;

        .preview-img {
            width: 100%;
            height: 100%;
        }

        .type-badge {
            position: absolute;
            top: 10rpx;
            right: 10rpx;
            width: 38rpx;
            height: 38rpx;
            background: rgba(15, 23, 42, 0.55);
            backdrop-filter: blur(8px);
            border-radius: 12rpx;
            color: #ffffff;
            font-size: 20rpx;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }

    .preview-item--center {
        width: 380rpx;
        height: 180rpx;
        z-index: 3;
        transform: translateZ(0);

        .preview-img {
            width: 100%;
            height: 100%;
        }

        .moon-arc {
            position: absolute;
            top: 24rpx;
            left: 50%;
            transform: translateX(-50%);
            width: 80rpx;
            height: 80rpx;
            border-radius: 50%;
            box-shadow: inset -6rpx -6rpx 0 3rpx #ffffff;
            opacity: 0.85;
        }
    }

    .preview-item--right {
        right: 24rpx;
        top: 6rpx;
        width: 110rpx;
        height: 110rpx;
        border-radius: 50%;
        transform: rotate(8deg);
        z-index: 2;

        .preview-img {
            width: 100%;
            height: 100%;
        }
    }

    .card-content-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .action-capsule-btn {
        background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
        padding: 16rpx 40rpx;
        border-radius: 9999px;
        box-shadow: 0 8rpx 20rpx rgba(79, 70, 229, 0.35);
        transition: transform 0.18s ease;

        &:active {
            transform: scale(0.95);
        }

        .btn-text {
            color: #ffffff;
            font-size: 26rpx;
            font-weight: 700;
            letter-spacing: 0.5rpx;
        }
    }
}

/* ─────────────────────────────────────────────────────────────
   2. 艺术拼图卡片
───────────────────────────────────────────────────────────── */
.tool-card--puzzle {
    animation-duration: 1.0s;
    animation-delay: 0.2s;
    padding: 38rpx 40rpx;
    height: 220rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .theme-light & {
        background: linear-gradient(135deg, #fdfbf7 0%, #f6f1e8 100%);
        box-shadow: 0 18rpx 42rpx -8rpx rgba(180, 150, 110, 0.22), 0 6rpx 18rpx -4rpx rgba(15, 23, 42, 0.05);

        .card-title {
            color: #292524;
        }
        .card-desc {
            color: #78716c;
        }
    }

    .theme-dark & {
        background: linear-gradient(135deg, #262422 0%, #1e1d1b 100%);
        box-shadow: 0 18rpx 44rpx -8rpx rgba(0, 0, 0, 0.7), 0 6rpx 20rpx -4rpx rgba(0, 0, 0, 0.4);

        .card-title {
            color: #fafaf9;
        }
        .card-desc {
            color: #a8a29e;
        }
    }

    .puzzle-visual {
        position: relative;
        width: 220rpx;
        height: 160rpx;
    }

    .polaroid-stack {
        position: absolute;
        border-radius: 20rpx;
        overflow: hidden;
        box-shadow: 0 12rpx 28rpx rgba(0, 0, 0, 0.22);

        .theme-dark & {
            box-shadow: 0 14rpx 32rpx rgba(0, 0, 0, 0.65);
        }

        .stack-img {
            width: 100%;
            height: 100%;
        }
    }

    .polaroid-stack--1 {
        width: 110rpx;
        height: 110rpx;
        left: 10rpx;
        bottom: 8rpx;
        transform: rotate(-8deg);
        z-index: 1;
    }

    .polaroid-stack--2 {
        width: 130rpx;
        height: 130rpx;
        right: 12rpx;
        top: 4rpx;
        transform: rotate(6deg);
        z-index: 2;
    }
}

/* ─────────────────────────────────────────────────────────────
   3. 背景模糊卡片
───────────────────────────────────────────────────────────── */
.tool-card--blur {
    animation-duration: 1.2s;
    animation-delay: 0.4s;
    padding: 38rpx 40rpx;
    height: 220rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .theme-light & {
        background: linear-gradient(135deg, #f0fdf4 0%, #e6f9f0 100%);
        box-shadow: 0 18rpx 42rpx -8rpx rgba(34, 197, 94, 0.2), 0 6rpx 18rpx -4rpx rgba(15, 23, 42, 0.05);

        .card-title {
            color: #064e3b;
        }
        .card-desc {
            color: #047857;
        }
    }

    .theme-dark & {
        background: linear-gradient(135deg, #063c2f 0%, #03211a 100%);
        box-shadow: 0 18rpx 44rpx -8rpx rgba(0, 0, 0, 0.7), 0 6rpx 20rpx -4rpx rgba(4, 120, 87, 0.25);

        .card-title {
            color: #ecfdf5;
        }
        .card-desc {
            color: #6ee7b7;
        }
    }

    .blur-visual {
        position: relative;
        width: 220rpx;
        height: 160rpx;
        display: flex;
        align-items: center;
        justify-content: flex-end;
    }

    .blur-img-wrapper {
        position: relative;
        width: 170rpx;
        height: 130rpx;
        border-radius: 24rpx;
        overflow: hidden;
        box-shadow: 0 12rpx 28rpx rgba(0, 0, 0, 0.2);

        .theme-dark & {
            box-shadow: 0 14rpx 32rpx rgba(0, 0, 0, 0.65);
        }

        .blur-demo-img {
            width: 100%;
            height: 100%;
            filter: blur(1.5px) contrast(1.1);
            transform: scale(1.08);
        }

        .blur-radial-halo {
            position: absolute;
            inset: 0;
            background: radial-gradient(circle, transparent 40%, rgba(255, 255, 255, 0.3) 100%);
        }
    }
}

/* ─────────────────────────────────────────────────────────────
   4. 光影边框卡片
───────────────────────────────────────────────────────────── */
.tool-card--frame {
    animation-duration: 1.4s;
    animation-delay: 0.6s;
    padding: 38rpx 40rpx;
    height: 220rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .theme-light & {
        background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
        box-shadow: 0 18rpx 42rpx -8rpx rgba(249, 115, 22, 0.18), 0 6rpx 18rpx -4rpx rgba(15, 23, 42, 0.05);

        .card-title {
            color: #431407;
        }
        .card-desc {
            color: #9a3412;
        }
    }

    .theme-dark & {
        background: linear-gradient(135deg, #2a1b14 0%, #1c1512 100%);
        box-shadow: 0 18rpx 44rpx -8rpx rgba(0, 0, 0, 0.7), 0 6rpx 20rpx -4rpx rgba(249, 115, 22, 0.2);

        .card-title {
            color: #ffedd5;
        }
        .card-desc {
            color: #fdba74;
        }
    }

    .frame-visual {
        position: relative;
        width: 220rpx;
        height: 160rpx;
    }

    .frame-thumb {
        position: absolute;
        border-radius: 20rpx;
        overflow: hidden;
        box-shadow: 0 12rpx 28rpx rgba(0, 0, 0, 0.18);

        .theme-dark & {
            box-shadow: 0 14rpx 32rpx rgba(0, 0, 0, 0.65);
        }

        .frame-img {
            width: 100%;
            height: 100%;
        }
    }

    .frame-thumb--1 {
        width: 120rpx;
        height: 120rpx;
        left: 10rpx;
        bottom: 8rpx;
        transform: rotate(-10deg);
        z-index: 1;
    }

    .frame-thumb--2 {
        width: 120rpx;
        height: 120rpx;
        right: 16rpx;
        top: 6rpx;
        transform: rotate(8deg);
        z-index: 2;
    }
}

/* ─────────────────────────────────────────────────────────────
   5. 灵感美学探索卡片
───────────────────────────────────────────────────────────── */
.tool-card--explore {
    animation-duration: 1.6s;
    animation-delay: 0.8s;
    padding: 38rpx 40rpx;
    height: 220rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .theme-light & {
        background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
        box-shadow: 0 18rpx 42rpx -8rpx rgba(168, 85, 247, 0.22), 0 6rpx 18rpx -4rpx rgba(15, 23, 42, 0.05);

        .card-title {
            color: #3b0764;
        }
        .card-desc {
            color: #7e22ce;
        }
    }

    .theme-dark & {
        background: linear-gradient(135deg, #2e1065 0%, #1e1438 100%);
        box-shadow: 0 18rpx 44rpx -8rpx rgba(0, 0, 0, 0.75), 0 6rpx 20rpx -4rpx rgba(147, 51, 234, 0.25);

        .card-title {
            color: #faf5ff;
        }
        .card-desc {
            color: #d8b4fe;
        }
    }

    .explore-tag-row {
        margin-bottom: 2rpx;
    }

    .explore-badge {
        display: inline-block;
        font-size: 18rpx;
        font-weight: 800;
        letter-spacing: 1rpx;
        padding: 2rpx 14rpx;
        border-radius: 999px;
        background: #8b5cf6;
        color: #ffffff;
    }

    .explore-visual {
        position: relative;
        width: 180rpx;
        height: 160rpx;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .explore-orb {
        position: relative;
        width: 130rpx;
        height: 130rpx;
        border-radius: 50%;
        overflow: hidden;
        box-shadow: 0 10rpx 32rpx rgba(168, 85, 247, 0.45);

        .orb-cover {
            width: 100%;
            height: 100%;
        }

        .sparkle-chip {
            position: absolute;
            top: 8rpx;
            right: 8rpx;
            color: #ffd38f;
            font-size: 26rpx;
            text-shadow: 0 0 8rpx #ffd38f;
        }
    }
}

// ── 创作页横版原生信息流广告卡片 ──
.creation-flow-ad-wrap {
    width: 100%;
    box-sizing: border-box;

    .creation-flow-ad-card {
        width: 100%;
        border-radius: 40rpx;
        overflow: hidden;
        background: var(--bg-card, rgba(255, 255, 255, 0.8));
        box-shadow: 0 8rpx 28rpx rgba(0, 0, 0, 0.05);
        transform: translateZ(0);
        -webkit-mask-image: -webkit-radial-gradient(white, black);
        display: flex;
        justify-content: center;

        :deep(ad-custom) {
            width: 100% !important;
            display: block !important;
        }
    }
}
</style>
