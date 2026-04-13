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
    height: 88rpx;
    background: #f4f4f4;
    border: 1rpx solid #eee;
    border-radius: 44rpx;
    display: flex;
    align-items: center;
    padding: 0 32rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.02);
}

.search-inner {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.placeholder {
    font-size: 28rpx;
    color: #999;
    letter-spacing: 1rpx;
}
</style>
