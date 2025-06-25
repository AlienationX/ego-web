<template>
    <view>
        
        <!-- #ifndef MP-WEIXIN -->
        <!-- adpid="1507000689" 此广告位标识仅在HBuilderX标准基座中有效，仅用于测试 -->
        <view v-if="showAd" class="content">
            <ad-rewarded-video :adpid="adpid" :loadnext="true" v-slot:default="{loading, error}" @load="onload"
                @close="onclose" @error="onerror">
                <button :disabled="loading" :loading="loading">显示广告</button>
                <view v-if="error">{{error}}</view>
            </ad-rewarded-video>
        </view>
        <!-- #endif -->
        
    </view>
</template>

<script setup>
    defineProps({
        adpid: {
            type: String,
            default: "1892019135", // 1892019135
        }
    })

    import {
        useProfileStore
    } from '@/stores/profile.js';
    const profileStore = useProfileStore();
    const showAd = profileStore.showAd;

    const onload = (e) => {
        console.log("ad-rewarded-video onload: ", e);
    }

    const onclose = (e) => {
        const detail = e.detail
        // 用户点击了【关闭广告】按钮
        if (detail && detail.isEnded) {
            // 正常播放结束
            console.log("ad-rewarded-video onclose: succeed", detail.isEnded, e);
        } else {
            // 播放中途退出
            console.log("ad-rewarded-video onclose: failure",detail.isEnded, e);
        }
    }
    
    const onerror = (e) => {
        // 广告加载失败
        console.log("ad-rewarded-video onerror: ", e.detail);
    }
</script>

<style lang="scss" scoped>
</style>