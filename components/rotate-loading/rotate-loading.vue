<template>
    <view class="container">
        <view class="spinner" :style="spinnerStyle"></view>
    </view>
</template>

<script setup>
    import { computed, toRefs } from 'vue';

    const props = defineProps({
        size: { type: Number, default: 120 },
        speed: { type: Number, default: 1.2 },
        color: { type: String, default: '' }
    });

    const { size, speed, color } = toRefs(props);

    const spinnerStyle = computed(() => {
        const c = color.value || '#28B389';
        const borderW = Math.max(6, Math.round(size.value * 0.08));
        return {
            width: size.value + 'rpx',
            height: size.value + 'rpx',
            borderWidth: borderW + 'rpx',
            borderStyle: 'solid',
            borderColor: c,
            borderTopColor: 'transparent',
            animationDuration: speed.value + 's'
        };
    });
</script>

<style lang="scss" scoped>
    @import '@/static/styles/variable-style.scss';

    .container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-width: 60rpx;
        min-height: 60rpx;
    }

    .spinner {
        box-sizing: border-box;
        border-radius: 50%;
        border-style: solid;
        animation: spin linear infinite;
        -webkit-animation: spin linear infinite;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
            -webkit-transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
            -webkit-transform: rotate(360deg);
        }
    }
</style>
