<template>
    <view>
        <!-- #ifdef MP-360 -->
        <!-- 微信小程序广告插件未申请成功，暂时屏蔽 -->
        <view v-if="showAd" class="content">
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
        default: '1760125998' // 1760125998
    }
});
const emit = defineEmits(['load', 'close', 'error']);

import { computed } from 'vue';
import { useUserStore } from '@/stores/user.js';
const userStore = useUserStore();
const showAd = computed(() => !userStore.isVip && userStore.showAd);

const onload = (e) => {
    emit('load', e);
    // console.log('ad-banner onload', e);
};
const onclose = (e) => {
    emit('close', e);
    // console.log('ad-banner onclose: ' + e.detail, e);
};
const onerror = (e) => {
    emit('error', e);
    // console.log('ad-banner onerror: ' + e.detail.errMsg.errCode + ' message:: ' + e.detail.errMsg.errMsg, e);
};
</script>

<style lang="scss" scoped>
.content {
    background-color: #f5f5f5;
    // padding: 0rpx 30rpx 20rpx;

    .ad-view {
        // background-color: #ffffff;
    }
}
</style>
