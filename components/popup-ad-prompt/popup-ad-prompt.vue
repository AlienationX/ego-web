<template>
    <uni-popup ref="popup" type="center" :mask-click="true" :safe-area="true">
        <view class="ad-prompt" :class="isDark ? 'theme-dark' : 'theme-light'">
            <view class="ad-prompt__close" @click="close">
                <mdi-icon path="/static/icons/close.svg" size="18px" :color="isDark ? '#e5e7eb' : '#2f3949'"></mdi-icon>
            </view>

            <image class="ad-prompt__image" src="/static/images/pictures.svg" mode="aspectFit"></image>

            <text class="ad-prompt__title">{{ $t('message.adText') }}</text>

            <button class="ad-prompt__button" @click="onWatch">
                {{ $t('message.adPrompt') }}
            </button>
        </view>
    </uni-popup>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { useAdRewardedVideo } from '@/hooks/useAd.js';
import { apiPostIncrementDownloads } from '@/api/wallpaper.js';
import { useSettingsStore } from '@/stores/settings.js';

const props = defineProps({
    id: Number,
    picurl: String,
});

const settingsStore = useSettingsStore();
const isDark = computed(() => settingsStore.isDark);

// views字段值+1
const incrementDownloads = async (id) => {
    await apiPostIncrementDownloads(id);
};

const { createRewardedVideoAd, showRewardedVideoAd, destroyRewardedVideoAd } = useAdRewardedVideo();

const popup = ref(null);
const open = () => {
    popup.value.open();
};

const close = () => {
    popup.value.close();
};

const onWatch = () => {
    close();
    uni.showLoading({
        title: 'Downloading...',
        mask: true,
    });

    // createRewardedVideoAd(); // 创建激励视频广告
    showRewardedVideoAd(props.picurl);
    // destroyRewardedVideoAd(); // 销毁激励视频广告

    incrementDownloads(props.id);

    uni.hideLoading();
};

onLoad(() => {
    createRewardedVideoAd(); // 创建激励视频广告
});

onUnload(() => {
    destroyRewardedVideoAd(); // 销毁激励视频广告
});

// 暴露方法给父组件
defineExpose({
    open,
});
</script>

<style lang="scss" scoped>
.ad-prompt {
    width: 76vw;
    max-width: 560rpx;
    background: var(--popup-background);
    border: 1rpx solid var(--popup-border);
    border-radius: 56rpx;
    padding: 44rpx 36rpx 44rpx;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 48rpx 144rpx var(--popup-shadow);

    &__close {
        position: absolute;
        top: 20rpx;
        right: 20rpx;
        width: 56rpx;
        height: 56rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--page-background-secondary);
        border: 1rpx solid var(--panel-border);
        transition: all 0.2s;

        &:active {
            transform: scale(0.95);
            opacity: 0.8;
        }
    }

    &__image {
        width: 280rpx;
        height: 280rpx;
        margin-bottom: 40rpx;
    }

    &__title {
        font-size: 36rpx;
        font-weight: 700;
        color: var(--text-primary);
        text-align: center;
        margin-bottom: 0rpx;
    }

    &__button {
        margin-top: 44rpx;
        min-width: 352rpx;
        height: 88rpx;
        border-radius: 999rpx;
        background: var(--text-primary);
        color: var(--page-background);
        font-size: 32rpx;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 32rpx 64rpx var(--shadow-color);

        &::after {
            border: none;
        }

        &:active {
            transform: scale(0.98);
            opacity: 0.9;
        }
    }
}
</style>
