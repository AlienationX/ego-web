<template>
    <view class="search-bar-wrap" @click="goSearch">
        <view class="search-content">
            <view class="search-inner">
                <mdi-icon path="/static/icons/magnify.svg" size="20" color="var(--text-tertiary)"></mdi-icon>
                <text class="placeholder">{{ $t('search.placeholder') }}</text>
            </view>
        </view>
    </view>
</template>

<script setup>
const goSearch = () => {
    uni.navigateTo({
        url: '/pages/app/search'
    });
};
</script>

<style lang="scss" scoped>
.search-bar-wrap {
    padding: 20rpx 30rpx;
    width: 100%;
    box-sizing: border-box;
}

.search-content {
    height: 96rpx;
    background: var(--panel-background);
    border: 1rpx solid var(--panel-border);
    border-radius: 20rpx;
    backdrop-filter: blur(20rpx);
    display: flex;
    align-items: center;
    padding: 0 32rpx;
    box-shadow: 0 8rpx 24rpx var(--shadow-color);
    transition: all 0.2s ease;

    .theme-dark & {
        border: none;
    }

    &:active {
        background: var(--panel-background-strong);
        transform: scale(0.98);
    }
}

.search-inner {
    display: flex;
    align-items: center;
    gap: 20rpx;
}

.placeholder {
    font-size: 28rpx;
    color: var(--text-tertiary);
    letter-spacing: 1rpx;
}
</style>
