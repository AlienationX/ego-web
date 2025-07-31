<template>
    <view>
        <!-- #ifdef MP-TOUTIAO -->
        <view v-if="showAd" class="content">
            <!-- adpid="1111111111" 此广告位标识仅在HBuilderX标准基座中有效，仅用于测试 -->
            <!-- 广告后台申请的广告位(adpid)需要自定义基座/云打包/本地打包后生效 -->
            <view class="ad-view">
                <ad :adpid="adpid" @load="onload" @close="onclose" @error="onerror" width="750rpx"></ad>
            </view>
        </view>
        <!-- #endif -->
    </view>
</template>

<script setup>
    defineProps({
        adpid: {
            type: String,
            default: '1760125998' // 1760125998
        }
    });

    import { useUserStore } from '@/stores/user.js';
    const userStore = useUserStore();
    const showAd = userStore.showAd;

    const onload = (e) => {
        console.log('ad-banner onload', e);
    };
    const onclose = (e) => {
        console.log('ad-banner onclose: ' + e.detail, e);
    };
    const onerror = (e) => {
        console.log('ad-banner onerror: ' + e.detail.errMsg.errCode + ' message:: ' + e.detail.errMsg.errMsg, e);
    };
</script>

<style lang="scss" scoped>
    .content {
        // background-color: #DBDBDB;
        padding: 0 32rpx;

        .ad-view {
            background-color: #ffffff;
        }
    }
</style>
