<template>
    <view class="glass-tab-layout" :class="[`theme-${theme}`]">
        <view v-if="placeholder" class="glass-tab__placeholder" :style="{ height: `${tabBarSpace}px` }"></view>

        <view class="glass-tab" :style="{ bottom: `${safeBottom}px` }">
            <view class="glass-tab__shell">
                <view
                    v-for="item in items"
                    :key="item.pagePath"
                    class="glass-tab__item"
                    :class="{ 'is-active': currentPath === item.pagePath }"
                    @click="handleSwitch(item)"
                >
                    <view class="glass-tab__icon-wrap">
                        <image class="glass-tab__icon" :src="currentPath === item.pagePath ? item.selectedIconPath : item.iconPath" mode="aspectFit"></image>
                    </view>
                    <view class="glass-tab__text">{{ item.text }}</view>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getTabBarHeight } from '@/utils/system.js';

const props = defineProps({
    currentPath: {
        type: String,
        default: '',
    },
    placeholder: {
        type: Boolean,
        default: true,
    },
    theme: {
        type: String,
        default: 'light',
    },
    disableNavigation: {
        type: Boolean,
        default: false,
    },
});
const emit = defineEmits(['change']);

const { t } = useI18n();

const items = computed(() => [
    {
        text: t('tabbar.index'),
        pagePath: '/pages/app/index',
        iconPath: props.theme === 'dark' ? '/static/tabbar/Dark_Home.png' : '/static/tabbar/Light_Home.png',
        selectedIconPath: '/static/tabbar/Fill_Home_Green.png',
    },
    {
        text: t('tabbar.category'),
        pagePath: '/pages/app/classify',
        iconPath: props.theme === 'dark' ? '/static/tabbar/Dark_Category.png' : '/static/tabbar/Light_Category.png',
        selectedIconPath: '/static/tabbar/Fill_Category_Green.png',
    },
    {
        text: t('tabbar.discover'),
        pagePath: '/pages/discover/discover',
        iconPath: props.theme === 'dark' ? '/static/tabbar/Dark_Discover.png' : '/static/tabbar/Light_Discover.png',
        selectedIconPath: '/static/tabbar/Fill_Discover_Green.png',
    },
    {
        text: t('tabbar.user'),
        pagePath: '/pages/user/user',
        iconPath: props.theme === 'dark' ? '/static/tabbar/Dark_User.png' : '/static/tabbar/Light_User.png',
        selectedIconPath: '/static/tabbar/Fill_User_Green.png',
    },
]);

const safeBottom = computed(() => Math.max(getTabBarHeight(), 0));
const tabBarSpace = computed(() => safeBottom.value + 122);

const handleSwitch = (item) => {
    if (props.currentPath === item.pagePath) return;
    emit('change', item);
    if (props.disableNavigation) return;
    uni.switchTab({
        url: item.pagePath,
    });
};
</script>

<style lang="scss" scoped>
.glass-tab-layout {
    position: relative;
    --glass-tab-shell-start: rgba(255, 255, 255, 0.94);
    --glass-tab-shell-end: rgba(245, 248, 252, 0.86);
    --glass-tab-shell-border: rgba(255, 255, 255, 0.95);
    --glass-tab-shell-shadow: rgba(15, 23, 42, 0.14);
    --glass-tab-text: rgba(24, 32, 42, 0.58);
    --glass-tab-active-text: #0f8b6d;
    --glass-tab-active-bg-start: rgba(40, 179, 137, 0.16);
    --glass-tab-active-bg-end: rgba(40, 179, 137, 0.08);
    --glass-tab-inner-highlight: inset 0 1rpx 0 rgba(255, 255, 255, 0.92);
}

.glass-tab-layout.theme-dark {
    --glass-tab-shell-start: rgba(11, 18, 28, 0.96);
    --glass-tab-shell-end: rgba(7, 13, 22, 0.94);
    --glass-tab-shell-border: rgba(148, 163, 184, 0.12);
    --glass-tab-shell-shadow: rgba(0, 0, 0, 0.52);
    --glass-tab-text: rgba(226, 232, 240, 0.62);
    --glass-tab-active-text: #6ee7b7;
    --glass-tab-active-bg-start: rgba(40, 179, 137, 0.28);
    --glass-tab-active-bg-end: rgba(40, 179, 137, 0.14);
    --glass-tab-inner-highlight: inset 0 0 0 rgba(0, 0, 0, 0);
}

.glass-tab__placeholder {
    width: 100%;
}

.glass-tab {
    position: fixed;
    left: 24rpx;
    right: 24rpx;
    z-index: 45;
}

.glass-tab__shell {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8rpx;
    padding: 14rpx;
    border-radius: 34rpx;
    background: linear-gradient(135deg, var(--glass-tab-shell-start), var(--glass-tab-shell-end));
    border: 1rpx solid var(--glass-tab-shell-border);
    box-shadow:
        0 18rpx 46rpx var(--glass-tab-shell-shadow),
        var(--glass-tab-inner-highlight);
    backdrop-filter: blur(24rpx);
}

.glass-tab__item {
    flex: 1;
    min-width: 0;
    height: 94rpx;
    border-radius: 26rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4rpx;
    color: var(--glass-tab-text);
    transition:
        transform 0.28s ease,
        background-color 0.28s ease,
        box-shadow 0.28s ease;
}

.glass-tab__item.is-active {
    background: linear-gradient(135deg, var(--glass-tab-active-bg-start), var(--glass-tab-active-bg-end));
    box-shadow: var(--glass-tab-inner-highlight);
    transform: translateY(-2rpx);
    color: var(--glass-tab-active-text);
}

.glass-tab__icon-wrap {
    width: 40rpx;
    height: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.glass-tab__icon {
    width: 38rpx;
    height: 38rpx;
}

.glass-tab__text {
    font-size: 20rpx;
    font-weight: 600;
    line-height: 1;
}
</style>
