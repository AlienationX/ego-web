<template>
    <view>
        <!-- #ifndef MP-WEIXIN -->
        <view v-show="showAd" class="content">
            <!-- adpid="1111111111" 此广告位标识仅在HBuilderX标准基座中有效，仅用于测试 -->
            <!-- 广告后台申请的广告位(adpid)需要自定义基座/云打包/本地打包后生效 -->
            <view class="ad-view">
                <ad :adpid="adpid" @load="onload" @close="onclose" @error="onerror"></ad>
            </view>
        </view>
        <!-- #endif -->
    </view>
</template>

<script setup>
    defineProps({
        adpid: {
            type: String,
            default: "1760125998",  // 1760125998
        }
    })

    import {
        useProfileStore
    } from '@/stores/profile.js';
    const profileStore = useProfileStore();
    const showAd = profileStore.showAd;

    const onload = (e) => {
        console.log("onload", e);
    }
    const onclose = (e) => {
        console.log("onclose: " + e.detail);
    }
    const onerror = (e) => {
        console.log("onerror: " + e.detail.errMsg.errCode + " message:: " + e.detail.errMsg.errMsg);
    }
</script>

<style lang="scss" scoped>
    .content {
        background-color: #DBDBDB;
        padding: 10px;

        .ad-view {
            background-color: #FFFFFF;
            margin-bottom: 10px;
        }
    }
</style>