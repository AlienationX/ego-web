<template>
    <view class="glass-nav-layout" :class="[`theme-${theme}`]">
        <view class="glass-nav" :style="{ paddingTop: `${statusBarHeight}px` }">
            <view class="glass-nav__inner" :style="{ minHeight: `${titleBarHeight}px` }">
                <view class="glass-nav__side glass-nav__side--left">
                    <view v-if="showBack" class="glass-nav__action glass-nav__action--back" @click="handleBack">
                        <uni-icons type="left" size="18" :color="iconColor"></uni-icons>
                    </view>
                </view>

                <view class="glass-nav__center">
                    <view class="glass-nav__eyebrow" v-if="eyebrow">{{ eyebrow }}</view>
                    <view class="glass-nav__title">{{ title }}</view>
                    <view class="glass-nav__subtitle" v-if="subtitle">{{ subtitle }}</view>
                </view>

                <view class="glass-nav__side glass-nav__side--right">
                    <view v-if="searchable" class="glass-nav__action" @click="goSearch">
                        <uni-icons type="search" size="18" :color="iconColor"></uni-icons>
                    </view>
                    <view v-if="rightText" class="glass-nav__pill" @click="emit('right-click')">{{ rightText }}</view>
                </view>
            </view>
        </view>

        <view v-if="placeholder" class="glass-nav__placeholder" :style="{ height: `${navBarHeight + extraOffset}px` }"></view>
    </view>
</template>

<script setup>
import { computed } from 'vue';
import { getNavBarHeight, getStatusBarHeight, getTitleBarHeight } from '@/utils/system.js';

const props = defineProps({
    title: {
        type: String,
        default: '本我壁纸',
    },
    subtitle: {
        type: String,
        default: '',
    },
    eyebrow: {
        type: String,
        default: '',
    },
    showBack: {
        type: Boolean,
        default: true,
    },
    searchable: {
        type: Boolean,
        default: false,
    },
    rightText: {
        type: String,
        default: '',
    },
    theme: {
        type: String,
        default: 'light',
    },
    placeholder: {
        type: Boolean,
        default: true,
    },
    extraOffset: {
        type: Number,
        default: 16,
    },
});

const emit = defineEmits(['right-click']);

const statusBarHeight = computed(() => getStatusBarHeight());
const titleBarHeight = computed(() => getTitleBarHeight());
const navBarHeight = computed(() => getNavBarHeight());
const iconColor = computed(() => (props.theme === 'dark' ? '#f8fafc' : '#18202a'));

const handleBack = () => {
    const pages = getCurrentPages();
    if (pages.length > 1) {
        uni.navigateBack();
        return;
    }
    uni.switchTab({ url: '/pages/app/index' });
};

const goSearch = () => {
    uni.navigateTo({ url: '/pages/app/search' });
};
</script>

<style lang="scss" scoped>
.glass-nav-layout {
    position: relative;
    --glass-nav-bg-top: rgba(246, 248, 251, 0.96);
    --glass-nav-bg-bottom: rgba(246, 248, 251, 0.7);
    --glass-nav-panel-start: rgba(255, 255, 255, 0.92);
    --glass-nav-panel-end: rgba(248, 251, 255, 0.72);
    --glass-nav-panel-border: rgba(255, 255, 255, 0.9);
    --glass-nav-shadow: rgba(15, 23, 42, 0.08);
    --glass-nav-text: #18202a;
    --glass-nav-subtext: rgba(24, 32, 42, 0.58);
    --glass-nav-eyebrow: rgba(24, 32, 42, 0.46);
    --glass-nav-action-bg: rgba(255, 255, 255, 0.85);
    --glass-nav-action-border: rgba(24, 32, 42, 0.06);
    --glass-nav-pill-text: #0f8b6d;
    --glass-nav-pill-bg: rgba(40, 179, 137, 0.12);
    --glass-nav-pill-border: rgba(40, 179, 137, 0.18);
    --glass-nav-inner-highlight: inset 0 1rpx 0 rgba(255, 255, 255, 0.9);
}

.glass-nav-layout.theme-dark {
    --glass-nav-bg-top: rgba(4, 10, 18, 0.96);
    --glass-nav-bg-bottom: rgba(4, 10, 18, 0.68);
    --glass-nav-panel-start: rgba(30, 43, 60, 0.96);
    --glass-nav-panel-end: rgba(21, 31, 46, 0.94);
    --glass-nav-panel-border: rgba(148, 163, 184, 0.18);
    --glass-nav-shadow: rgba(0, 0, 0, 0.42);
    --glass-nav-text: #f8fafc;
    --glass-nav-subtext: rgba(226, 232, 240, 0.66);
    --glass-nav-eyebrow: rgba(148, 163, 184, 0.74);
    --glass-nav-action-bg: rgba(255, 255, 255, 0.12);
    --glass-nav-action-border: rgba(148, 163, 184, 0.16);
    --glass-nav-pill-text: #6ee7b7;
    --glass-nav-pill-bg: rgba(40, 179, 137, 0.2);
    --glass-nav-pill-border: rgba(110, 231, 183, 0.22);
    --glass-nav-inner-highlight: inset 0 0 0 rgba(0, 0, 0, 0);
}

.glass-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 40;
    padding-left: 0;
    padding-right: 0;
    background: linear-gradient(to bottom, var(--glass-nav-bg-top), var(--glass-nav-bg-bottom) 70%, rgba(246, 248, 251, 0));
    backdrop-filter: blur(18rpx);
}

.glass-nav__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    padding: 10rpx 24rpx;
    border-radius: 0;
    border: 1rpx solid var(--glass-nav-panel-border);
    background: linear-gradient(135deg, var(--glass-nav-panel-start), var(--glass-nav-panel-end));
    box-shadow:
        0 10rpx 28rpx var(--glass-nav-shadow),
        var(--glass-nav-inner-highlight);
}

.glass-nav__side {
    display: flex;
    align-items: center;
    gap: 10rpx;
    min-width: 96rpx;
}

.glass-nav__side--right {
    justify-content: flex-end;
}

.glass-nav__center {
    flex: 1;
    min-width: 0;
    text-align: center;
}

.glass-nav__eyebrow {
    font-size: 18rpx;
    color: var(--glass-nav-eyebrow);
    letter-spacing: 6rpx;
    text-transform: uppercase;
    margin-bottom: 4rpx;
}

.glass-nav__title {
    font-size: 34rpx;
    font-weight: 700;
    color: var(--glass-nav-text);
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.glass-nav__subtitle {
    margin-top: 4rpx;
    font-size: 22rpx;
    color: var(--glass-nav-subtext);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.glass-nav__action {
    width: 60rpx;
    height: 60rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--glass-nav-action-bg);
    border: 1rpx solid var(--glass-nav-action-border);
    box-shadow: var(--glass-nav-inner-highlight);
}

.glass-nav__pill {
    min-width: 84rpx;
    height: 60rpx;
    padding: 0 22rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22rpx;
    color: var(--glass-nav-pill-text);
    background: var(--glass-nav-pill-bg);
    border: 1rpx solid var(--glass-nav-pill-border);
    font-weight: 600;
}

.glass-nav__placeholder {
    width: 100%;
}
</style>
