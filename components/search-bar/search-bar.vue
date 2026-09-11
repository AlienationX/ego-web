<template>
    <view class="search-bar-wrap" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <view class="search-bar" @click="goSearch">
            <view class="search-bar__left">
                <mdi-icon
                    path="/static/icons/magnify.svg"
                    size="20px"
                    :color="settingsStore.isDark ? 'rgba(247, 247, 251, 0.45)' : 'rgba(30, 41, 59, 0.45)'"
                ></mdi-icon>
                <text class="search-bar__placeholder">{{ placeholder || $t('search.placeholder') || '搜索壁纸、分类、标签...' }}</text>
            </view>
            <view class="search-bar__action" @click.stop="goSearch">
                <mdi-icon
                    path="/static/icons/tune-variant.svg"
                    size="20px"
                    :color="settingsStore.isDark ? '#f1f5f9' : 'rgba(30, 41, 59, 0.75)'"
                ></mdi-icon>
            </view>
        </view>
    </view>
</template>

<script setup>
import { useSettingsStore } from '@/stores/settings.js';

const props = defineProps({
    placeholder: {
        type: String,
        default: '',
    },
});

const settingsStore = useSettingsStore();

const goSearch = () => {
    uni.navigateTo({
        url: '/pages/app/search'
    });
};
</script>

<style lang="scss" scoped>
.search-bar-wrap {
    width: 100%;
    box-sizing: border-box;
}

.search-bar {
    height: 94rpx;
    background: #ffffff;
    border-radius: 30rpx;
    border: 1rpx solid rgba(30, 41, 59, 0.06);
    box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.04);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24rpx 0 30rpx;
    box-sizing: border-box;
    transition: transform 0.2s, box-shadow 0.2s;

    .theme-dark & {
        background: #222228;
        border-color: rgba(255, 255, 255, 0.08);
        box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.3);
    }

    &:active {
        transform: scale(0.99);
    }

    &__left {
        display: flex;
        align-items: center;
        gap: 18rpx;
        flex: 1;
        overflow: hidden;
    }

    &__placeholder {
        font-size: 26rpx;
        color: var(--text-tertiary);
        letter-spacing: 0.3rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__action {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 54rpx;
        height: 54rpx;
        border-radius: 50%;
        background: rgba(15, 23, 42, 0.04);
        flex-shrink: 0;
        transition: opacity 0.2s, transform 0.2s, background 0.2s;

        .theme-dark & {
            background: rgba(255, 255, 255, 0.08);
        }

        &:active {
            opacity: 0.6;
            transform: scale(0.92);
        }
    }
}
</style>
