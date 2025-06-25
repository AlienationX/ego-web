<template>
    <view>
        
        <!-- #ifndef MP-WEIXIN -->
        <!-- adpid="1111111113" 此广告位标识仅在HBuilderX标准基座中有效，仅用于测试 -->
        <ad-interstitial v-if="showAd" ref="adInterstitialRef" :adpid="adpid" :loadnext="false"
            v-slot:default="{loading, error}" @load="onload" @close="onclose" @error="onerror">
            <view v-if="error">{{error}}</view>
        </ad-interstitial>
        <!-- #endif -->
        
    </view>
</template>

<script setup>
    defineProps({
        adpid: {
            type: String,
            default: "1129226586",  // 1129226586
        }
    })

    import {ref} from 'vue';
    import {
        useProfileStore
    } from '@/stores/profile.js';
    
    const profileStore = useProfileStore();
    const showAd = profileStore.showAd;
    const adInterstitialRef = ref(null);

    const onload = (e) => {
        console.log("ad-interstitial onload", e);
    }
    
    const onclose = (e) => {
        console.log("ad-interstitial onclose: " + e.detail, e);
    }
    
    const onerror = (e) => {
        console.log("ad-interstitial onerror: " + e.detail.code + " message:: " + e.detail.errMsg, e);
    }
    
    const show = () => {
        adInterstitialRef.value.show();
    }
    // 必须暴露方法
    defineExpose({ show });
</script>

<style lang="scss" scoped>
</style>