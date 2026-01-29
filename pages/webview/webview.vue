<template>
    <view class="layout">
        <web-view :src="webviewUrl" @message="handleMessage" class="webview"></web-view>
    </view>
</template>

<script setup>
    import { ref, computed } from 'vue';
    import { onLoad } from '@dcloudio/uni-app';
    import { useI18n } from 'vue-i18n';

    const { t } = useI18n();
    const webviewUrl = ref('');

    const pageTitle = computed(() => {
        if (webviewUrl.value.includes('privacy_agreement')) {
            return t('about.privacy');
        } else if (webviewUrl.value.includes('user_agreement')) {
            return t('about.agreement');
        }
        return t('common.title');
    });

    const handleMessage = (e) => {
        console.log('Webview message:', e.detail);
    };

    onLoad((options) => {
        if (options.url) {
            const decodedUrl = decodeURIComponent(options.url);
            
            if (decodedUrl.includes('privacy_agreement')) {
                webviewUrl.value = '/static/assets/privacy_agreement.html';
            } else if (decodedUrl.includes('user_agreement')) {
                webviewUrl.value = '/static/assets/user_agreement.html';
            }
            
            uni.setNavigationBarTitle({
                title: pageTitle.value
            });
        }
    });
</script>

<style lang="scss" scoped>
    .layout {
        background-color: #f5f5f5;
        min-height: 100vh;
    }

    .webview {
        width: 100%;
        height: 100vh;
    }
</style>
