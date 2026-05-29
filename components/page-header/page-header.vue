<template>
    <view class="page-header" :class="isDark ? 'theme-dark' : 'theme-light'" :style="{ paddingTop: `${statusBarHeight}px` }">
        <view class="page-header__inner">
            <view class="page-header__side page-header__side--left">
                <view v-if="showBack" class="page-header__action" @click="handleBack">
                    <mdi-icon
                        path="/static/icons/arrow-left.svg"
                        size="26px"
                        :color="isDark ? '#f7f7fb' : '#101828'"
                    ></mdi-icon>
                </view>
            </view>

            <view class="page-header__center">
                <view v-if="eyebrow" class="page-header__eyebrow">{{ eyebrow }}</view>
                <view class="page-header__title">{{ title }}</view>
                <view v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</view>
            </view>

            <view class="page-header__side page-header__side--right">
                <navigator v-if="searchable" url="/pages/app/search" class="page-header__action">
                    <uni-icons type="search" size="18" :color="isDark ? '#f7f7fb' : '#101828'"></uni-icons>
                </navigator>
                <view v-else-if="rightText" class="page-header__pill" @click="$emit('right-click')">{{ rightText }}</view>
                <view v-else class="page-header__placeholder"></view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue';
import { getStatusBarHeight } from '@/utils/system.js';
import { useSettingsStore } from '@/stores/settings.js';

const settingsStore = useSettingsStore();
const isDark = computed(() => settingsStore.isDark);

const props = defineProps({
    title: {
        type: String,
        default: '',
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
});

defineEmits(['right-click']);

const statusBarHeight = getStatusBarHeight();

const handleBack = () => {
    const pages = getCurrentPages();
    if (pages.length > 1) {
        uni.navigateBack();
        return;
    }
    uni.switchTab({ url: '/pages/app/index' });
};
</script>

<style lang="scss" scoped>
@import '@/static/styles/theme-variables.scss';

.page-header {
    position: relative;
    padding-left: 24rpx;
    padding-right: 24rpx;
    padding-bottom: 18rpx;
    background:
        radial-gradient(circle at top right, rgba(125, 211, 252, 0.12) 0%, rgba(125, 211, 252, 0) 26%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.92) 100%);

    &.theme-dark {
        background:
            radial-gradient(circle at top right, rgba(125, 211, 252, 0.06) 0%, rgba(125, 211, 252, 0) 26%),
            linear-gradient(180deg, rgba(24, 24, 28, 0.98) 0%, rgba(28, 28, 28, 0.92) 100%);
    }
}

.page-header__inner {
    min-height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
}

.page-header__side {
    min-width: 88rpx;
    display: flex;
    align-items: center;
}

.page-header__side--right {
    justify-content: flex-end;
}

.page-header__center {
    flex: 1;
    text-align: center;
    min-width: 0;
}

.page-header__eyebrow {
    font-size: 18rpx;
    line-height: 1;
    letter-spacing: 4rpx;
    font-weight: 700;
    color: rgba(16, 24, 40, 0.42);
    text-transform: uppercase;
    margin-bottom: 6rpx;

    .theme-dark & {
        color: rgba(247, 247, 251, 0.42);
    }
}

.page-header__title {
    font-size: 34rpx;
    line-height: 1.2;
    font-weight: 800;
    color: #101828;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    .theme-dark & {
        color: var(--text-primary);
    }
}

.page-header__subtitle {
    margin-top: 4rpx;
    font-size: 22rpx;
    color: rgba(16, 24, 40, 0.56);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    .theme-dark & {
        color: var(--text-tertiary);
    }
}

.page-header__action,
.page-header__placeholder {
    width: 64rpx;
    height: 64rpx;
    // border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    // background: rgba(255, 255, 255, 0.82);
    // border: 1rpx solid rgba(16, 24, 40, 0.06);
    // box-shadow: 0 8rpx 18rpx rgba(15, 23, 42, 0.06);
    box-sizing: border-box;
}

.page-header__pill {
    min-height: 64rpx;
    padding: 0 24rpx;
    border-radius: 999rpx;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 22rpx;
    font-weight: 700;
    color: #0f8b6d;
    background: rgba(40, 179, 137, 0.12);
    border: 1rpx solid rgba(40, 179, 137, 0.16);

    .theme-dark & {
        color: #7df7c4;
        background: rgba(125, 247, 196, 0.12);
        border: 1rpx solid rgba(125, 247, 196, 0.16);
    }
}
</style>
