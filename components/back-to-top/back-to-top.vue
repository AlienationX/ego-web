<template>
    <!-- 返回顶部按钮 -->
    <view v-if="showBackToTop" class="backToTop" @click="scrollToTop">
        <uni-icons type="up" size="24" color="#ffffff"></uni-icons>
    </view>
</template>

<script setup>
    import { ref } from 'vue';

    const showBackToTop = ref(false);
    // 返回顶部
    const scrollToTop = () => {
        uni.pageScrollTo({
            scrollTop: 0,
            duration: 300 // 滚动动画持续时间
        });
    };

    // 暴露属性给父组件
    defineExpose({
        showBackToTop,
        scrollToTop
    });
</script>

<style lang="scss" scoped>
    .backToTop {
        position: fixed;
        bottom: 60rpx;
        right: 30rpx;
        width: 80rpx;
        height: 80rpx;
        background-color: $wp-theme-color;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.2);
        cursor: pointer;
        z-index: 1000;
        transition: opacity 0.3s ease;

        &:hover {
            background-color: #1e8a6d;
        }
    }
</style>
