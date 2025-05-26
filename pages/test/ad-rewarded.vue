<template>
    <view>
        <!-- #ifndef MP-WEIXIN -->
        <ad-rewarded-video ref="adRewardedVideo" adpid="1892019135" :url-callback="urlCallback" :preload="false"
            :loadnext="false" :disabled="true" v-slot:default="{loading, error}" @load="onadload" @close="onadclose"
            @error="onaderror">
            <view class="ad-error" v-if="error">{{error}}</view>
        </ad-rewarded-video>
        <button type="primary" :disabled="isLoading" :loading="isLoading" @click="showAd">显示广告</button>
        <!-- #endif -->
    </view>
</template>

<script>
    // 1507000689
    // 1892019135

    export default {
        data() {
            return {
                isLoading: false,
                urlCallback: {
                    userId: 'testuser',
                    extra: 'testdata'
                }
            }
        },
        onReady() {
            this.isLoading = true;
            this.$refs.adRewardedVideo.load();
        },
        methods: {
            showAd() {
                if (this.isLoading) {
                    return
                }
                this.$refs.adRewardedVideo.show();
            },
            onadload(e) {
                this.isLoading = false;
                console.log('广告数据加载成功');
            },
            onadclose(e) {
                const detail = e.detail
                // 用户点击了【关闭广告】按钮
                if (detail && detail.isEnded) {
                    // 正常播放结束
                    console.log("onClose " + detail.isEnded);
                } else {
                    // 播放中途退出
                    console.log("onClose " + detail.isEnded);
                }
                //this.isLoading = true;
                //this.$refs.adRewardedVideo.load();
            },
            onaderror(e) {
                // 广告加载失败
                console.log(e.detail);
                this.isLoading = false;
            }
        }
    }
</script>

<style>
    .ad-error {
        color: orangered;
        margin-top: 5px;
    }
</style>