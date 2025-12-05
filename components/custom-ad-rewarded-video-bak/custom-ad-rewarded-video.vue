<template>
    <uni-popup class="popup" ref="popup" type="center">
        <image class="img"></image>
        <uni-icons class="close" type="clear" size="32" @click="close"></uni-icons>
        <text class="txt">Unlock This Wallpaper</text>
        <button class="btn" @click="onWatch">Watch An Ads</button>
    </uni-popup>
</template>

<script setup>
    import { onLoad, onUnload } from '@dcloudio/uni-app';
    import { useAdRewardedVideo } from '@/hooks/useAd.js';

    const { createRewardedVideoAd, showRewardedVideoAd, destroyRewardedVideoAd } = useAdRewardedVideo();
    
    const popup = ref(null);
    const show = ()=> {
        popup.value.show();
    }
    
    const close = ()=> {
        popup.value.close();
    }

    const onWatch = () => {
        showRewardedVideoAd();
    };

    onLoad((e) => {
        createRewardedVideoAd(); // 创建激励视频广告
    });

    onUnload(() => {
        destroyRewardedVideoAd(); // 销毁激励视频广告
    });
    
    // 暴露方法给父组件
    defineExpose({
        show
    });
</script>

<style lang="scss" scoped>
    .popup {
        border-radius: 24rpx;
        position: relative;

        .img {
        }
        .close {
            position: absolute;
            top: 4rpx;
            right: 4rpx;
        }
        .txt {
            font-weight: bold;
            font-size: 42rpx;
        }
        .btn {
            font-size: 28rpx;
            color: #ffffff;
            background-color: $wp-theme-color;
            // font-weight: bold;
            padding: 0rpx 20rpx;

            border: none;
            border-radius: 40rpx;
        }
    }
</style>
