<template>
    <view class="container">
        <view class="back">
            
        </view>
        <view class="title">
            <slot name="title"></slot>
        </view>
        <view class="menuBtn">
            <slot name="menuBtn"></slot>
        </view>
    </view>
</template>

<script setup>
</script>

<style lang="scss" scoped>
    .container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 30rpx;
        
        .title {
            
        }

        .menuBtn {
            font-size: 34rpx;
            font-weight: bold;
            color: $uni-text-color;
        }
    }
</style>