<template>
    <uni-popup class="popup" ref="popup" type="center" border-radius="32rpx" background-color="#fff">
        <view class="box">
            <uni-icons class="close" type="clear" size="32" @click="close"></uni-icons>
            <image class="pic" src="/common/images/pics/ad_album.svg" mode="heightFix"></image>
            <view class="txt">Unlock This Wallpaper</view>
            <button class="btn" @click="onWatch">Watch An Ads</button>
        </view>
    </uni-popup>
</template>

<script setup>
    import { ref } from 'vue';
    import { onLoad, onUnload } from '@dcloudio/uni-app';
    import { useAdRewardedVideo } from '@/hooks/useAd.js';

    const { createRewardedVideoAd, showRewardedVideoAd, destroyRewardedVideoAd } = useAdRewardedVideo();

    const popup = ref(null);
    const open = () => {
        popup.value.open();
    };

    const close = () => {
        popup.value.close();
    };

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
        open
    });
</script>

<style lang="scss" scoped>
    .popup {
        .box {
            padding: 40rpx;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;

            .close {
                position: absolute;
                top: 8rpx;
                right: 8rpx;
            }

            .pic {
                height: 200rpx;
                margin-bottom: 20rpx;
            }

            .txt {
                font-weight: bold;
                font-size: 42rpx;
                color: #555555;
                text-align: center;
                margin: 20rpx;
            }

            .btn {
                font-size: 32rpx;
                color: #ffffff;
                background-color: #28b389;
                font-weight: bold;
                margin: 20rpx 20rpx;
                width: 100%;
                border: none;
                border-radius: 32rpx;
            }
        }
    }
</style>
