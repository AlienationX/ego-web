<template>
    <view class="access-page">
        <view class="back-btn" :style="{ top: backTop + 'px' }" @click="goBack">
            <uni-icons type="back" color="#4a5670" size="20"></uni-icons>
        </view>

        <view class="title-area">
            <view class="title">{{ pageTitle }}</view>
            <view class="subtitle">{{ pageSubtitle }}</view>
        </view>

        <view class="content">
            <uni-collapse accordion>
                <uni-collapse-item :open="true" title="方式一：观看广告生成随机 Key" thumb="/static/icons/youtube.svg">
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
                </uni-collapse-item>

                <uni-collapse-item title="方式二：输入 Key 后观看广告" thumb="/static/icons/youtube.svg">
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
                </uni-collapse-item>
            </uni-collapse>

            <view class="tips">
                <image class="tip-icon" src="/static/icons/help-circle.svg" mode="aspectFit"></image>
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
    console.log(res);
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
    uni.reLaunch({ url: '/pages/index/index' });
};

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
    position: fixed;
    left: 36rpx;
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.92);
    border: 1rpx solid rgba(214, 223, 238, 0.95);
    box-shadow: 0 8rpx 20rpx rgba(31, 44, 72, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
}

.title-area {
    padding: 30rpx 0;
    // 标题区域居中
    text-align: center;
    background-color: #0078d4;
}

.title {
    font-size: 56rpx;
    font-weight: 600;
    color: #ffffff;
    line-height: 1.2;
}

.subtitle {
    margin-top: 20rpx;
    font-size: 32rpx;
    color: #ffffff;
}

.content {
    padding: 18rpx;
}

.panel {
    border: 2rpx solid #e5ecf9;
    border-radius: 28rpx;
    background: #f8fbff;
    padding: 24rpx;
    margin-bottom: 24rpx;
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
    font-size: 36rpx;
    letter-spacing: 4rpx;
    font-weight: 700;
    color: #3158d8;
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
</style>
