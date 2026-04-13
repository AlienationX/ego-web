<template>
    <view class="access-page">
        <view class="hero-section" :style="{ paddingTop: getStatusBarHeight() + 'px' }">
            <view class="hero-head hero-enter-1">
                <view class="back-btn" @click="goBack">
                    <uni-icons type="back" color="#3461fd" size="20"></uni-icons>
                </view>
                <view class="hero-title">{{ pageTitle }}</view>
            </view>
            <view class="hero-subtitle hero-enter-2">{{ pageSubtitle }}</view>
        </view>

        <view class="content">
            <view class="custom-accordion">
                <!-- 方式一 -->
                <view class="accordion-item" :class="{ active: activeIndex === 0 }">
                    <view class="item-header" @click="activeIndex = activeIndex === 0 ? -1 : 0">
                        <view class="header-left">
                            <image class="header-icon" src="/static/icons/video.svg" mode="aspectFit"></image>
                            <text class="item-title">方式一：观看广告生成随机 Key</text>
                        </view>
                        <image class="arrow-icon" :src="activeIndex === 0 ? '/static/icons/chevron-up.svg' : '/static/icons/chevron-down.svg'" mode="aspectFit"></image>
                    </view>
                    <view class="item-body" v-if="activeIndex === 0">
                        <view class="panel">
                            <view class="panel-desc">点击按钮观看激励视频，完成后生成 6 位随机 Key。</view>
                            <button class="action-btn" @click="handleGenerateKeyByAd">观看广告并生成 Key</button>

                            <view class="key-result" v-if="generatedKey">
                                <image class="key-icon" src="/static/icons/crown-circle.svg" mode="aspectFit"></image>
                                <view class="key-content">
                                    <view class="key-label">当前 Key</view>
                                    <view class="key-value">{{ generatedKey }}</view>
                                </view>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- 方式二 -->
                <view class="accordion-item" :class="{ active: activeIndex === 1 }">
                    <view class="item-header" @click="activeIndex = activeIndex === 1 ? -1 : 1">
                        <view class="header-left">
                            <image class="header-icon" src="/static/icons/navigation-variant.svg" mode="aspectFit"></image>
                            <text class="item-title">方式二：输入 Key 后观看广告</text>
                        </view>
                        <image class="arrow-icon" :src="activeIndex === 1 ? '/static/icons/chevron-up.svg' : '/static/icons/chevron-down.svg'" mode="aspectFit"></image>
                    </view>
                    <view class="item-body" v-if="activeIndex === 1">
                        <view class="panel">
                            <view class="panel-desc">输入已有 Key，点击按钮观看激励视频。</view>

                            <view class="input-wrap">
                                <input class="key-input" maxlength="32" placeholder="请输入 Key" v-model.trim="inputKey" />
                            </view>

                            <button
                                class="action-btn"
                                :class="{ ghost: !inputKey }"
                                :disabled="!inputKey"
                                @click="handleWatchAdWithInputKey"
                            >
                                输入 Key 并观看广告
                            </button>
                        </view>
                    </view>
                </view>
            </view>

            <view class="tips">
                <!-- <image class="tip-icon" src="/static/icons/help-circle.svg" mode="aspectFit"></image> -->
                <text>提示：广告能力受平台与网络影响，若无法弹出广告请稍后重试。</text>
            </view>

            <view class="bottom-ad">
                <custom-ad-banner></custom-ad-banner>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { getStatusBarHeight } from '@/utils/system.js';
import { useAdRewardedVideo } from '@/hooks/useAd.js';
import { apiPostRewards } from '@/api/wallpaper.js';

const { createRewardedVideoAd, showRewardedVideoAd, destroyRewardedVideoAd } = useAdRewardedVideo();

const backTop = ref(getStatusBarHeight() + 10);
const pageTitle = 'Access Key';
const pageSubtitle = '两种方式，快速获取或使用 Key';

const generatedKey = ref('');
const inputKey = ref('');

const handleGenerateKeyByAd = async () => {
    showRewardedVideoAd();
    const res = await apiPostRewards();
    generatedKey.value = res.data.access_key;
};

const handleWatchAdWithInputKey = () => {
    if (!inputKey.value) {
        uni.showToast({
            title: '请先输入 Key',
            icon: 'none',
        });
        return;
    }

    showRewardedVideoAd();
    uni.showToast({
        title: 'Loading...',
        icon: 'none',
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
    min-height: 100vh;
    background: #ffffff;
}

.back-btn {
    width: 68rpx;
    height: 68rpx;
    border-radius: 20rpx;
    background: rgba(255, 255, 255, 0.98);
    border: 1rpx solid rgba(52, 97, 253, 0.15);
    box-shadow: 0 12rpx 28rpx rgba(52, 97, 253, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx; // 改为右边距
    transition: all 0.2s ease;

    &:active {
        transform: scale(0.92);
        background: #f0f4ff;
    }
}

.hero-section {
    position: relative;
    padding: 64rpx 44rpx 40rpx;
    z-index: 10;
    text-align: left;
    background: #f8fbff; // 直接在容器上设置纯色背景，不要间距
    border-bottom: 2rpx solid #edf2f9;

    .hero-head {
        display: flex;
        align-items: center;
        margin-bottom: 24rpx;
    }
    
    .hero-title {
        font-size: 64rpx;
        font-weight: 900;
        color: #111827;
        letter-spacing: -2rpx;
        line-height: 1.1;
        filter: drop-shadow(0 4rpx 10rpx rgba(0,0,0,0.06));
    }

    .hero-subtitle {
        font-size: 32rpx;
        font-weight: 700;
        color: #4b5563;
        letter-spacing: 0.5rpx;
        opacity: 0.9;
        margin-left: 10rpx;
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

.custom-accordion {
    .accordion-item {
        background: #ffffff;
        border: 2rpx solid #eef2f8;
        border-radius: 28rpx;
        margin-bottom: 24rpx;
        overflow: hidden;
        transition: all 0.3s ease;

        &.active {
            border-color: rgba(52, 97, 253, 0.2);
            box-shadow: 0 8rpx 24rpx rgba(52, 97, 253, 0.05);
        }
    }

    .item-header {
        padding: 32rpx 28rpx;
        display: flex;
        align-items: center;
        justify-content: space-between;
        
        &:active {
            background: #f8fbff;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 20rpx;
        }

        .header-icon {
            width: 44rpx;
            height: 44rpx;
            // 保持品牌蓝色调
            filter: invert(34%) sepia(87%) saturate(4641%) hue-rotate(224deg) brightness(101%) contrast(105%);
        }

        .arrow-icon {
            width: 32rpx;
            height: 32rpx;
            opacity: 0.6;
        }

        .item-title {
            font-size: 28rpx;
            font-weight: 700;
            color: #1a1b1e;
        }
    }

    .item-body {
        padding: 0 24rpx 24rpx;
        animation: slide-down 0.3s ease-out;
    }
}

@keyframes slide-down {
    from { opacity: 0; transform: translateY(-10rpx); }
    to { opacity: 1; transform: translateY(0); }
}

.content {
    padding: 24rpx 32rpx 100rpx;
}

.panel {
    background: #f8fbff;
    border-radius: 24rpx;
    padding: 24rpx;
}

.panel-desc {
    margin-top: 12rpx;
    margin-bottom: 18rpx;
    font-size: 24rpx;
    line-height: 1.5;
    color: #68728c;
}

.action-btn {
    width: 100%;
    height: 92rpx;
    border-radius: 24rpx;
    background: #3461fd;
    color: #ffffff;
    border: none;
    font-size: 30rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;

    &.ghost {
        background: #eef3ff;
        color: #2f68ff;
    }

    &::after {
        border: none;
    }
}

.key-result {
    margin-top: 18rpx;
    border-radius: 20rpx;
    background: #ffffff;
    border: 1rpx solid #dbe6ff;
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 16rpx 18rpx;
    // 增加出现动画
    animation: key-show 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
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

.key-icon {
    width: 44rpx;
    height: 44rpx;
}

.key-content {
    flex: 1;
}

.key-label {
    font-size: 22rpx;
    color: #8c95ac;
}

.key-value {
    margin-top: 4rpx;
    font-size: 40rpx; // 稍微调大
    letter-spacing: 6rpx;
    font-weight: 900;
    color: #3461fd; // 使用鲜艳的主题蓝色
}

.input-wrap {
    margin-bottom: 16rpx;
}

.key-input {
    height: 88rpx;
    background: #ffffff;
    border: 1rpx solid #dce5f6;
    border-radius: 22rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    color: #2b3245;
}

.tips {
    display: flex;
    align-items: center;
    gap: 10rpx;
    color: #8a92a9;
    font-size: 22rpx;
    line-height: 1.4;
    padding: 30rpx;
    // margin-top: 12rpx;
    // margin-bottom: 18rpx;
}

.tip-icon {
    width: 30rpx;
    height: 30rpx;
    flex-shrink: 0;
}

.bottom-ad {
    margin-top: 8rpx;
}

.bottom-ad {
    margin-top: 8rpx;
}
</style>
