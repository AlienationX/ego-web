<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <menu-bar>
            <template #title>{{ t('helpCentre.title') }}</template>
        </menu-bar>

        <view class="content">
            <view class="intro">
                <text class="intro-title">{{ t('helpCentre.introTitle') }}</text>
                <text class="intro-desc">{{ t('helpCentre.introDesc') }}</text>
            </view>

            <view class="faq-list">
                <view v-for="item in faqList" :key="item.id" class="faq-item" @click="toggle(item.id)">
                    <view class="faq-header">
                        <text class="faq-q">{{ t(item.q) }}</text>
                        <uni-icons :type="openId === item.id ? 'up' : 'down'" size="14" :color="iconMutedColor"></uni-icons>
                    </view>
                    <text v-if="openId === item.id" class="faq-a">{{ t(item.a) }}</text>
                </view>
            </view>

            <view class="action-list">
                <view class="action-row" @click="goFeedback">
                    <text>{{ t('helpCentre.contactSupport') }}</text>
                    <uni-icons type="forward" size="15" :color="iconForwardColor"></uni-icons>
                </view>
                <view class="action-row" @click="openHtml('/privacy_agreement.html')">
                    <text>{{ t('helpCentre.privacy') }}</text>
                    <uni-icons type="forward" size="15" :color="iconForwardColor"></uni-icons>
                </view>
                <view class="action-row" @click="openHtml('/user_agreement.html')">
                    <text>{{ t('helpCentre.agreement') }}</text>
                    <uni-icons type="forward" size="15" :color="iconForwardColor"></uni-icons>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const iconMutedColor = computed(() => (settingsStore.isDark ? '#94a3b8' : '#7b8794'));
const iconForwardColor = computed(() => (settingsStore.isDark ? '#64748b' : '#b2bac7'));
const openId = ref(1);
const faqList = [
    { id: 1, q: 'helpCentre.faq.q1', a: 'helpCentre.faq.a1' },
    { id: 2, q: 'helpCentre.faq.q2', a: 'helpCentre.faq.a2' },
    { id: 3, q: 'helpCentre.faq.q3', a: 'helpCentre.faq.a3' },
];

const toggle = (id) => {
    openId.value = openId.value === id ? null : id;
};

const goFeedback = () => {
    uni.navigateTo({ url: '/pages/settings/feedback' });
};

const openHtml = (path) => {
    uni.navigateTo({
        url: `/pages/webview/webview?url=${encodeURIComponent(path)}`,
    });
};
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: var(--page-background);
}
.content {
    padding: 20rpx 24rpx 34rpx;
    box-sizing: border-box;
}
.intro {
    background: var(--page-background-secondary);
    border: 1rpx solid var(--panel-border);
    border-radius: 18rpx;
    padding: 24rpx;
    margin-bottom: 16rpx;
}
.intro-title {
    font-size: 34rpx;
    color: var(--text-primary);
    font-weight: 700;
    display: block;
}
.intro-desc {
    margin-top: 10rpx;
    font-size: 24rpx;
    color: var(--text-secondary);
    line-height: 1.6;
    display: block;
}
.faq-list,
.action-list {
    background: var(--page-background-secondary);
    border: 1rpx solid var(--panel-border);
    border-radius: 18rpx;
    overflow: hidden;
    margin-bottom: 16rpx;
}
.faq-item {
    padding: 20rpx 20rpx;
    border-bottom: 1rpx solid var(--panel-border);
}
.faq-item:last-child {
    border-bottom: none;
}
.faq-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
}
.faq-q {
    font-size: 28rpx;
    color: var(--text-primary);
    font-weight: 600;
}
.faq-a {
    margin-top: 12rpx;
    display: block;
    font-size: 24rpx;
    color: var(--text-secondary);
    line-height: 1.7;
}
.action-row {
    min-height: 94rpx;
    padding: 0 20rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 28rpx;
    color: var(--text-primary);
    border-bottom: 1rpx solid var(--panel-border);
}
.action-row:last-child {
    border-bottom: none;
}
</style>
