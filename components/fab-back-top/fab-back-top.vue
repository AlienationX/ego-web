<template>
    <view
        class="fab-back-top"
        :class="{ show: show, 'is-embedded': embedded }"
        :style="computedStyle"
        @click="handleClick"
    >
        <uni-icons type="arrow-up" size="24" color="#fff"></uni-icons>
    </view>
</template>

<script setup>
import { computed } from 'vue';
import { getTabBarHeight } from '@/utils/layout.js';
import { USE_CUSTOM_TABBAR } from '@/common/config.js';

const props = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
    embedded: {
        type: Boolean,
        default: false,
    },
    adHeight: {
        type: Number,
        default: 0,
    },
    bottomOffset: {
        type: Number,
        default: 0,
    },
});

const emit = defineEmits(['click']);

const computedStyle = computed(() => {
    if (props.bottomOffset > 0) {
        return { bottom: `${props.bottomOffset}px` };
    }
    const tabH = (props.embedded && USE_CUSTOM_TABBAR) ? getTabBarHeight() : 0;
    const adH = props.adHeight > 0 ? props.adHeight : 0;
    return {
        bottom: `${tabH + adH + 16}px`,
    };
});

const handleClick = (e) => {
    emit('click', e);
};
</script>

<style lang="scss" scoped>
.fab-back-top {
    position: fixed;
    right: 32rpx;
    bottom: calc(32rpx + env(safe-area-inset-bottom));
    width: 88rpx;
    height: 88rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #2b8cee;
    box-shadow: 0 12rpx 32rpx rgba(43, 140, 238, 0.4);
    z-index: 1000;
    opacity: 0;
    transform: scale(0.6) translateY(20rpx);
    pointer-events: none;
    transition:
        opacity 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
        transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
        bottom 0.3s ease;

    &.show {
        opacity: 1;
        transform: scale(1) translateY(0);
        pointer-events: auto;
    }

    &:active {
        transform: scale(0.9);
    }
}
</style>
