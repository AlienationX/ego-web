<template>
    <view class="content">
        <!-- #ifndef MP-WEIXIN -->
        <ad-interstitial adpid="1111111113" :loadnext="true" v-slot:default="{ loading, error }" @load="onadload" @close="onadclose" @error="onaderror">
            <button :disabled="loading" :loading="loading">显示广告</button>
            <view v-if="error">{{ error }}</view>
        </ad-interstitial>
        <!-- #endif -->
    </view>
</template>

<script>
// 1111111113
// 1129226586

export default {
    data() {
        return {};
    },
    methods: {
        onadload(e) {
            console.log('ad-inter广告数据加载成功', e);
        },
        onadclose(e) {
            console.log('ad-inter广告关闭', e);
        },
        onaderror(e) {
            // 广告加载失败
            console.log('ad-inter广告报错', e);
        }
    }
};
</script>
