<template>
    <view class="search-bar-wrap" @click="goSearch">
        <view class="search-content">
            <view class="search-inner">
                <mdi-icon path="/static/icons/magnify.svg" size="20" color="#999"></mdi-icon>
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
    background: rgba(255, 255, 255, 0.05);
    border: 1rpx solid rgba(255, 255, 255, 0.1);
    border-radius: 20rpx;
    backdrop-filter: blur(20rpx);
    display: flex;
    align-items: center;
    padding: 0 32rpx;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;

    &:active {
        background: rgba(255, 255, 255, 0.08);
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
    color: #94a3b8;
    letter-spacing: 1rpx;
}
</style>
