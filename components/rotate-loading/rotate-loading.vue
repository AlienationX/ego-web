<template>
    <view class="container">
        <svg class="loading" :style="loadingStyle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path :fill="color" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
        </svg>
    </view>
</template>

<script setup>
    import { ref, computed, toRefs } from 'vue';

    // 组件属性
    const props = defineProps({
        size: { type: Number, default: 120 }, // SVG 尺寸
        speed: { type: Number, default: 1.2 }, // 旋转速度（秒/圈）
        color: { type: String, default: '#28B389' } // 颜色
    });

    const { size, speed } = toRefs(props);

    const loadingStyle = computed(() => ({
        width: size.value + 'rpx',
        height: size.value + 'rpx'
        // animation: `spin ${speed.value}s linear infinite` // 这么写存在问题，动画不转
        // animationPlayState: loading ? 'running' : 'paused'
    }));
</script>

<style lang="scss" scoped>
    .container {
        display: flex;
        justify-content: center;
        align-items: center;

        .loading {
            animation: spin 1.2s linear infinite;
            transform-origin: center;

            // 小程序不支持 @keyframes css实现动画效果
            @keyframes spin {
                from {
                    transform: rotate(0deg);
                }
                to {
                    transform: rotate(360deg);
                }
            }
        }
    }
</style>
