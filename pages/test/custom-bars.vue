<template>
    <view class="page" :class="isDark ? 'theme-dark' : 'theme-light'">
        <!-- 占位，防止内容被 tabbar 遮住 -->
        <view class="page__spacer" :style="{ height: navBarHeight + 'px' }"></view>

        <view class="page__body">
            <view class="section-title">glass-tab-bar 预览</view>
            <view class="desc">点击底部各 tab 会跳转到真实页面。当前高亮路径：{{ currentTabPath }}</view>
        </view>

        <glass-tab-bar
            :current-path="currentTabPath"
            :theme="isDark ? 'dark' : 'light'"
            :bottom-offset="0"
            :disable-navigation="true"
            @change="(item) => currentTabPath = item.pagePath"
        ></glass-tab-bar>
    </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useSettingsStore } from '@/stores/settings.js';
import { getNavBarHeight } from '@/utils/system.js';
import GlassTabBar from '@/components/glass-tab-bar/glass-tab-bar.vue';

const settingsStore = useSettingsStore();
const isDark = computed(() => settingsStore.isDark);
const navBarHeight = ref(getNavBarHeight() || 0);

// 当前高亮的 tab 路径，默认指向首页
const currentTabPath = ref('/pages/app/index');
</script>

<style lang="scss" scoped>
.page {
    min-height: 100vh;
    background: var(--page-background);
}

.page__spacer {
    width: 100%;
}

.page__body {
    padding: 40rpx 30rpx;
}

.section-title {
    font-size: 36rpx;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 20rpx;
}

.desc {
    font-size: 26rpx;
    color: var(--text-secondary);
    line-height: 1.7;
}
</style>
