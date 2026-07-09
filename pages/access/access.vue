<template>
    <view class="access-page" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 背景装饰：渐变 + 柔光圆斑 + 网格 -->
        <view class="ambient-bg">
            <view class="ambient-bg__orb ambient-bg__orb--one"></view>
            <view class="ambient-bg__orb ambient-bg__orb--two"></view>
            <view class="ambient-bg__orb ambient-bg__orb--three"></view>
            <view class="ambient-bg__grid"></view>
        </view>

        <view class="hero-section" :style="{ paddingTop: backTop + 'px' }">
            <view class="hero-head hero-enter-1">
                <view class="back-btn" @click="goBack">
                    <uni-icons :type="'back'" :color="iconColor" size="20"></uni-icons>
                </view>
                <view class="hero-title-block">
                    <view class="hero-kicker">EGO ACCESS</view>
                    <view class="hero-title">{{ pageTitle }}</view>
                </view>
            </view>
            <view class="hero-subtitle hero-enter-2">{{ pageSubtitle }}</view>
        </view>

        <view class="content" :style="contentStyle">
            <view class="custom-accordion">
                <!-- 方式一 -->
                <view class="accordion-item" :class="{ active: activeIndex === 0 }">
                    <view class="item-header" @click="activeIndex = activeIndex === 0 ? -1 : 0">
                        <view class="header-left">
                            <view class="header-icon-wrap header-icon-wrap--pink">
                                <image class="header-icon" src="/static/icons/video.svg" mode="aspectFit"></image>
                            </view>
                            <view class="item-title-block">
                                <text class="item-title">方式一</text>
                                <text class="item-subtitle">观看广告生成随机 Key</text>
                            </view>
                        </view>
                        <view class="arrow-icon" :class="{ 'is-active': activeIndex === 0 }">
                            <mdi-icon
                                :path="activeIndex === 0 ? '/static/icons/chevron-up.svg' : '/static/icons/chevron-down.svg'"
                                size="14px"
                                :color="iconColor"
                            ></mdi-icon>
                        </view>
                    </view>
                    <view class="item-body" v-if="activeIndex === 0">
                        <view class="panel">
                            <view class="panel-desc">点击按钮观看激励视频，完成后生成 6 位随机 Key。</view>
                            <button class="action-btn action-btn--primary" @click="handleGenerateKeyByAd">
                                <mdi-icon path="/static/icons/video.svg" size="16px" color="#ffffff"></mdi-icon>
                                <text class="action-btn__text">观看广告并生成 Key</text>
                            </button>

                            <view class="key-result" v-if="generatedKey">
                                <view class="key-icon-wrap">
                                    <mdi-icon path="/static/icons/crown-circle.svg" size="20px" color="#ffffff"></mdi-icon>
                                </view>
                                <view class="key-content">
                                    <view class="key-label">当前 Key</view>
                                    <view class="key-value">{{ generatedKey }}</view>
                                </view>
                                <view class="key-copy" @click="copyKey">
                                    <mdi-icon path="/static/icons/content-save.svg" size="14px" :color="iconColor"></mdi-icon>
                                </view>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- 方式二 -->
                <view class="accordion-item" :class="{ active: activeIndex === 1 }">
                    <view class="item-header" @click="activeIndex = activeIndex === 1 ? -1 : 1">
                        <view class="header-left">
                            <view class="header-icon-wrap header-icon-wrap--mint">
                                <image class="header-icon" src="/static/icons/navigation-variant.svg" mode="aspectFit"></image>
                            </view>
                            <view class="item-title-block">
                                <text class="item-title">方式二</text>
                                <text class="item-subtitle">输入 Key 后观看广告</text>
                            </view>
                        </view>
                        <view class="arrow-icon" :class="{ 'is-active': activeIndex === 1 }">
                            <mdi-icon
                                :path="activeIndex === 1 ? '/static/icons/chevron-up.svg' : '/static/icons/chevron-down.svg'"
                                size="14px"
                                :color="iconColor"
                            ></mdi-icon>
                        </view>
                    </view>
                    <view class="item-body" v-if="activeIndex === 1">
                        <view class="panel">
                            <view class="panel-desc">输入已有 Key，点击按钮观看激励视频。</view>

                            <view class="input-wrap">
                                <view class="input-prefix">
                                    <mdi-icon path="/static/icons/crown-circle.svg" size="14px" :color="iconColor"></mdi-icon>
                                </view>
                                <input
                                    class="key-input"
                                    maxlength="32"
                                    placeholder="请输入 Key"
                                    placeholder-class="key-input__placeholder"
                                    v-model.trim="inputKey"
                                />
                                <view v-if="inputKey" class="input-clear" @click="inputKey = ''">
                                    <mdi-icon path="/static/icons/close-circle.svg" size="14px" :color="iconColor"></mdi-icon>
                                </view>
                            </view>

                            <button
                                class="action-btn action-btn--primary"
                                :class="{ 'is-disabled': !inputKey }"
                                :disabled="!inputKey"
                                @click="handleWatchAdWithInputKey"
                            >
                                <mdi-icon path="/static/icons/video.svg" size="16px" color="#ffffff"></mdi-icon>
                                <text class="action-btn__text">输入 Key 并观看广告</text>
                            </button>
                        </view>
                    </view>
                </view>
            </view>

            <view class="tips">
                <view class="tips-badge">NOTE</view>
                <text class="tips-text">提示：广告能力受平台与网络影响，若无法弹出广告请稍后重试。</text>
            </view>

            <!-- 吸底广告 -->
            <custom-ad-banner @height-change="onAdHeightChange"></custom-ad-banner>
        </view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { getStatusBarHeight } from '@/utils/system.js';
import { useAdRewardedVideo } from '@/hooks/useAd.js';
import { apiPostRewards } from '@/api/wallpaper.js';
import { useSettingsStore } from '@/stores/settings.js';

const { createRewardedVideoAd, showRewardedVideoAd, destroyRewardedVideoAd } = useAdRewardedVideo();
const settingsStore = useSettingsStore();
const iconColor = computed(() => (settingsStore.isDark ? '#f7f7fb' : '#15171c'));

const backTop = ref(getStatusBarHeight() + 10);
const pageTitle = 'Access Key';
const pageSubtitle = '两种方式，快速获取或使用 Key';

const generatedKey = ref('');
const inputKey = ref('');
const adHeight = ref(0);
const baseContentBottomPadding = uni.upx2px(24);
const onAdHeightChange = (height) => {
    adHeight.value = Math.max(0, Number(height) || 0);
};
const contentStyle = computed(() => ({
    paddingBottom: `${baseContentBottomPadding + adHeight.value}px`,
}));

const handleGenerateKeyByAd = async () => {
    showRewardedVideoAd('', {
        onSuccess: async () => {
            const res = await apiPostRewards();
            generatedKey.value = res.data.access_key;
        },
    });
};

const handleWatchAdWithInputKey = () => {
    if (!inputKey.value) {
        uni.showToast({
            title: '请先输入 Key',
            icon: 'none',
        });
        return;
    }

    uni.showToast({
        title: 'Loading...',
        icon: 'none',
    });

    showRewardedVideoAd('', {
        onSuccess: () => {
            // Watch ad finished, the backend handles the callback
            uni.showToast({ title: 'Watching ad recorded for Key', icon: 'success' });
            inputKey.value = '';
        },
    });
};

const copyKey = () => {
    if (!generatedKey.value) return;
    uni.setClipboardData({
        data: generatedKey.value,
        success: () => {
            uni.showToast({ title: '已复制 Key', icon: 'success' });
        },
    });
};

const goBack = () => {
    uni.reLaunch({ url: '/pages/app/index' });
};

const activeIndex = ref(0);

onLoad(() => {
    createRewardedVideoAd();
});

onUnload(() => {
    destroyRewardedVideoAd();
});
</script>

<style lang="scss" scoped>
.access-page {
    position: relative;
    background: linear-gradient(180deg, #eef4ff 0%, #f0fbf6 60%, #f6fffa 100%);
    min-height: 100vh;
    overflow: hidden;
}

.theme-dark {
    &.access-page {
        background: linear-gradient(180deg, #0d1018 0%, #0c0f14 60%, #0b1514 100%);
    }
}

// ── 背景装饰 ──
.ambient-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;

    &__orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(80rpx);
        opacity: 0.6;

        &--one {
            width: 520rpx;
            height: 520rpx;
            top: -180rpx;
            right: -160rpx;
            background: radial-gradient(circle, rgba(52, 97, 253, 0.45) 0%, transparent 70%);
        }

        &--two {
            width: 480rpx;
            height: 480rpx;
            top: 200rpx;
            left: -180rpx;
            background: radial-gradient(circle, rgba(125, 247, 196, 0.5) 0%, transparent 70%);
            opacity: 0.5;
        }

        &--three {
            width: 360rpx;
            height: 360rpx;
            top: 720rpx;
            right: -120rpx;
            background: radial-gradient(circle, rgba(52, 97, 253, 0.4) 0%, transparent 70%);
            opacity: 0.4;
        }
    }

    &__grid {
        position: absolute;
        inset: 0;
        background-image: linear-gradient(rgba(52, 97, 253, 0.05) 1rpx, transparent 1rpx),
            linear-gradient(90deg, rgba(52, 97, 253, 0.05) 1rpx, transparent 1rpx);
        background-size: 60rpx 60rpx;
        mask-image: linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent);
        -webkit-mask-image: linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent);
    }
}

.theme-dark {
    .ambient-bg {
        &__grid {
            background-image: linear-gradient(rgba(255, 255, 255, 0.04) 1rpx, transparent 1rpx),
                linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1rpx, transparent 1rpx);
        }
        &__orb {
            opacity: 0.4;
        }
    }
}

// ── Hero ──
.back-btn {
    width: 72rpx;
    height: 72rpx;
    border-radius: 22rpx;
    background: var(--panel-background-strong);
    border: 1rpx solid var(--panel-border);
    box-shadow: 0 12rpx 28rpx var(--shadow-color);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;
    transition: all 0.2s ease;
    backdrop-filter: blur(20rpx);
    -webkit-backdrop-filter: blur(20rpx);

    &:active {
        transform: scale(0.92);
        opacity: 0.7;
    }
}

.hero-section {
    position: relative;
    padding: 64rpx 44rpx 40rpx;
    z-index: 10;
    text-align: left;
    background: linear-gradient(180deg, var(--panel-background-strong) 0%, transparent 100%);
    border-bottom: 1rpx solid var(--panel-border);

    .hero-head {
        display: flex;
        align-items: center;
        margin-bottom: 24rpx;
    }

    .hero-title-block {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .hero-kicker {
        font-size: 22rpx;
        font-weight: 800;
        letter-spacing: 6rpx;
        background: linear-gradient(135deg, #3461fd, #2bbd8a);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        margin-bottom: 4rpx;
    }

    .hero-title {
        font-size: 64rpx;
        font-weight: 900;
        color: var(--text-primary);
        letter-spacing: -2rpx;
        line-height: 1.1;
    }

    .hero-subtitle {
        font-size: 28rpx;
        font-weight: 500;
        color: var(--text-secondary);
        letter-spacing: 0.5rpx;
        margin-left: 96rpx;
    }
}

.hero-enter-1 {
    animation: hero-enter-up 0.5s ease-out both;
}

.hero-enter-2 {
    animation: hero-enter-up 0.6s ease-out both;
    animation-delay: 0.12s;
}

@keyframes hero-enter-up {
    from {
        opacity: 0;
        transform: translateY(30rpx);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

// ── 手风琴 ──
.content {
    position: relative;
    z-index: 5;
    padding: 24rpx 24rpx 24rpx;
}

.custom-accordion {
    .accordion-item {
        background: var(--panel-background-strong);
        border: 1rpx solid var(--panel-border);
        border-radius: 28rpx;
        margin-bottom: 24rpx;
        overflow: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 8rpx 24rpx var(--shadow-color);
        backdrop-filter: blur(20rpx);
        -webkit-backdrop-filter: blur(20rpx);

        &.active {
            border-color: rgba(52, 97, 253, 0.4);
            box-shadow: 0 12rpx 36rpx rgba(52, 97, 253, 0.18);
        }
    }

    .item-header {
        padding: 32rpx 28rpx;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: background 0.2s ease;

        &:active {
            background: var(--panel-background);
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 20rpx;
            flex: 1;
        }

        .header-icon-wrap {
            width: 76rpx;
            height: 76rpx;
            border-radius: 22rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;

            &--pink {
                background: linear-gradient(135deg, rgba(52, 97, 253, 0.18), rgba(43, 189, 138, 0.18));
            }

            &--mint {
                background: linear-gradient(135deg, rgba(125, 247, 196, 0.28), rgba(52, 97, 253, 0.14));
            }
        }

        .header-icon {
            width: 40rpx;
            height: 40rpx;
            filter: invert(34%) sepia(87%) saturate(4641%) hue-rotate(224deg) brightness(101%) contrast(105%);
        }

        .item-title-block {
            display: flex;
            flex-direction: column;
            gap: 6rpx;
            flex: 1;
        }

        .item-title {
            font-size: 28rpx;
            font-weight: 800;
            color: var(--text-primary);
        }

        .item-subtitle {
            font-size: 24rpx;
            color: var(--text-tertiary);
            font-weight: 500;
        }

        .arrow-icon {
            width: 48rpx;
            height: 48rpx;
            border-radius: 50%;
            background: var(--panel-background);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            flex-shrink: 0;

            &.is-active {
                background: linear-gradient(135deg, #3461fd, #2bbd8a);
                transform: rotate(180deg);

                :deep() {
                    color: #ffffff;
                }
            }
        }
    }

    .item-body {
        padding: 0 24rpx 24rpx;
        animation: slide-down 0.3s ease-out;
    }
}

@keyframes slide-down {
    from {
        opacity: 0;
        transform: translateY(-10rpx);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.panel {
    background: var(--panel-background);
    border-radius: 24rpx;
    padding: 24rpx;
    border: 1rpx solid var(--panel-border);
}

.panel-desc {
    margin-top: 4rpx;
    margin-bottom: 20rpx;
    font-size: 24rpx;
    line-height: 1.6;
    color: var(--text-secondary);
}

.action-btn {
    width: 100%;
    height: 92rpx;
    border-radius: 24rpx;
    color: #ffffff;
    border: none;
    font-size: 28rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
    background: linear-gradient(135deg, #3461fd 0%, #2bbd8a 100%);
    box-shadow: 0 12rpx 24rpx rgba(52, 97, 253, 0.28);
    transition: all 0.2s ease;

    &__text {
        line-height: 1;
    }

    &:active {
        transform: translateY(2rpx);
        box-shadow: 0 6rpx 12rpx rgba(52, 97, 253, 0.24);
    }

    &.is-disabled {
        background: var(--panel-background);
        color: var(--text-tertiary);
        box-shadow: none;
    }

    &::after {
        border: none;
    }
}

.key-result {
    margin-top: 20rpx;
    border-radius: 20rpx;
    background: linear-gradient(135deg, rgba(52, 97, 253, 0.08), rgba(125, 247, 196, 0.12));
    border: 1rpx solid rgba(52, 97, 253, 0.22);
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 18rpx 20rpx;
    animation: key-show 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.theme-dark {
    .key-result {
        background: rgba(52, 97, 253, 0.12);
        border-color: rgba(52, 97, 253, 0.3);
    }
}

@keyframes key-show {
    from {
        opacity: 0;
        transform: translateY(20rpx) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.key-icon-wrap {
    width: 56rpx;
    height: 56rpx;
    border-radius: 16rpx;
    background: linear-gradient(135deg, #3461fd, #2bbd8a);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.key-content {
    flex: 1;
    min-width: 0;
}

.key-label {
    font-size: 22rpx;
    color: var(--text-tertiary);
    font-weight: 600;
    letter-spacing: 1rpx;
}

.key-value {
    margin-top: 4rpx;
    font-size: 36rpx;
    letter-spacing: 6rpx;
    font-weight: 900;
    background: linear-gradient(135deg, #3461fd, #2bbd8a);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.key-copy {
    width: 56rpx;
    height: 56rpx;
    border-radius: 16rpx;
    background: var(--panel-background-strong);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s ease;

    &:active {
        transform: scale(0.9);
    }
}

.input-wrap {
    margin-bottom: 18rpx;
    position: relative;
    display: flex;
    align-items: center;
    background: var(--panel-background-strong);
    border: 1rpx solid var(--panel-border);
    border-radius: 22rpx;
    padding: 0 20rpx;
    height: 88rpx;
    transition: all 0.2s ease;

    &:focus-within {
        border-color: #3461fd;
        box-shadow: 0 0 0 4rpx rgba(52, 97, 253, 0.12);
    }
}

.input-prefix {
    width: 32rpx;
    height: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12rpx;
    flex-shrink: 0;
}

.key-input {
    flex: 1;
    height: 100%;
    background: transparent;
    border: none;
    font-size: 28rpx;
    color: var(--text-primary);
    font-weight: 600;
    letter-spacing: 2rpx;
    min-width: 0;

    &__placeholder {
        color: var(--text-tertiary);
        font-weight: 500;
        letter-spacing: 0;
    }
}

.input-clear {
    width: 32rpx;
    height: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-left: 8rpx;
}

.tips {
    display: flex;
    align-items: flex-start;
    gap: 12rpx;
    color: var(--text-tertiary);
    font-size: 22rpx;
    line-height: 1.5;
    padding: 24rpx 28rpx;
    margin: 8rpx 4rpx 0;
    background: var(--panel-background);
    border: 1rpx solid var(--panel-border);
    border-radius: 18rpx;
}

.tips-badge {
    display: inline-block;
    padding: 2rpx 10rpx;
    background: linear-gradient(135deg, #3461fd, #2bbd8a);
    color: #ffffff;
    font-size: 20rpx;
    font-weight: 800;
    letter-spacing: 2rpx;
    border-radius: 8rpx;
    flex-shrink: 0;
    line-height: 1.4;
}

.tips-text {
    flex: 1;
    color: var(--text-tertiary);
}
</style>
