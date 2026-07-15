<template>
    <view class="bubble-tooltip-container" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'" @click.stop="toggle">
        <!-- 触发内容 -->
        <slot></slot>

        <!-- 气泡内容 -->
        <view v-if="visible" class="bubble-wrapper" :class="[placement, visible ? 'fade-in' : '']" @click.stop>
            <view class="bubble-content">
                <view class="bubble-close" @click.stop="close">
                    <uni-icons type="closeempty" size="18" :color="settingsStore.isDark ? 'rgba(255,255,255,0.6)' : '#94a3b8'"></uni-icons>
                </view>
                <text class="bubble-text">{{ content }}</text>
            </view>
            <view class="bubble-arrow"></view>
        </view>
    </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useSettingsStore } from '@/stores/settings.js';

const props = defineProps({
    content: {
        type: String,
        default: '',
    },
    placement: {
        type: String,
        default: 'top', // top, bottom, left, right, right-start
    },
});

const settingsStore = useSettingsStore();
const visible = ref(false);

const toggle = () => {
    visible.value = !visible.value;
};

const close = () => {
    visible.value = false;
};

// 点击外部关闭
const handleGlobalClick = () => {
    if (visible.value) {
        visible.value = false;
    }
};

onMounted(() => {
    // #ifdef H5
    window.addEventListener('click', handleGlobalClick);
    // #endif
});

onUnmounted(() => {
    // #ifdef H5
    window.removeEventListener('click', handleGlobalClick);
    // #endif
});

defineExpose({
    open: () => (visible.value = true),
    close: () => (visible.value = false),
});
</script>

<style lang="scss" scoped>
.bubble-tooltip-container {
    position: relative;
    display: inline-block;
}

.bubble-wrapper {
    position: absolute;
    z-index: 1000;
    pointer-events: auto;
    visibility: visible;
    
    &.fade-in {
        animation: fadeIn 0.2s ease-out;
    }
}

.bubble-content {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20rpx;
    padding: 30rpx 60rpx 30rpx 30rpx;
    position: relative;
    width: 500rpx;
    box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.1);
    border: 1rpx solid rgba(0, 0, 0, 0.05);
    
    .theme-light & {
        background: rgba(0, 0, 0, 0.9);
        box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.3);
        border: none;
    }
}

.bubble-close {
    position: absolute;
    top: 16rpx;
    right: 16rpx;
    width: 44rpx;
    height: 44rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;

    &:active {
        opacity: 0.6;
    }
}

.bubble-text {
    color: #1e293b;
    font-size: 26rpx;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
    display: block;
    
    .theme-light & {
        color: #ffffff;
    }
}

.bubble-arrow {
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
}

/* 位置样式 - 优化定位逻辑，避免闪烁 */
.top {
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(-16rpx);
    
    &.fade-in { animation: fadeInTop 0.2s ease-out; }

    .bubble-arrow {
        bottom: -10rpx;
        left: 50%;
        transform: translateX(-50%);
        border-width: 12rpx 10rpx 0 10rpx;
        border-color: rgba(255, 255, 255, 0.95) transparent transparent transparent;
        .theme-light & { border-top-color: rgba(0, 0, 0, 0.9); }
    }
}

.bottom {
    top: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(16rpx);
    
    &.fade-in { animation: fadeInBottom 0.2s ease-out; }

    .bubble-arrow {
        top: -10rpx;
        left: 50%;
        transform: translateX(-50%);
        border-width: 0 10rpx 12rpx 10rpx;
        border-color: transparent transparent rgba(255, 255, 255, 0.95) transparent;
        .theme-light & { border-bottom-color: rgba(0, 0, 0, 0.9); }
    }
}

.left {
    right: 100%;
    top: 50%;
    transform: translateY(-50%) translateX(-16rpx);
    
    &.fade-in { animation: fadeInLeft 0.2s ease-out; }

    .bubble-arrow {
        right: -10rpx;
        top: 50%;
        transform: translateY(-50%);
        border-width: 10rpx 0 10rpx 12rpx;
        border-color: transparent transparent transparent rgba(255, 255, 255, 0.95);
        .theme-light & { border-left-color: rgba(0, 0, 0, 0.9); }
    }
}

.right {
    left: 100%;
    top: 50%;
    transform: translateY(-50%) translateX(16rpx);
    
    &.fade-in { animation: fadeInRight 0.2s ease-out; }

    .bubble-arrow {
        left: -10rpx;
        top: 50%;
        transform: translateY(-50%);
        border-width: 10rpx 12rpx 10rpx 0;
        border-color: transparent rgba(255, 255, 255, 0.95) transparent transparent;
        .theme-light & { border-right-color: rgba(0, 0, 0, 0.9); }
    }
}

.right-start {
    left: 100%;
    top: -24rpx;
    transform: translateX(16rpx);
    
    &.fade-in { animation: fadeInRightStart 0.2s ease-out; }

    .bubble-arrow {
        left: -10rpx;
        top: 32rpx;
        border-width: 10rpx 12rpx 10rpx 0;
        border-color: transparent rgba(255, 255, 255, 0.95) transparent transparent;
        .theme-light & { border-right-color: rgba(0, 0, 0, 0.9); }
    }
}

/* 各方向独立的动画，解决位置突兀感 */
@keyframes fadeInTop {
    from { opacity: 0; transform: translateX(-50%) translateY(0) scale(0.9); }
    to { opacity: 1; transform: translateX(-50%) translateY(-16rpx) scale(1); }
}

@keyframes fadeInBottom {
    from { opacity: 0; transform: translateX(-50%) translateY(0) scale(0.9); }
    to { opacity: 1; transform: translateX(-50%) translateY(16rpx) scale(1); }
}

@keyframes fadeInLeft {
    from { opacity: 0; transform: translateY(-50%) translateX(0) scale(0.9); }
    to { opacity: 1; transform: translateY(-50%) translateX(-16rpx) scale(1); }
}

@keyframes fadeInRight {
    from { opacity: 0; transform: translateY(-50%) translateX(0) scale(0.9); }
    to { opacity: 1; transform: translateY(-50%) translateX(16rpx) scale(1); }
}

@keyframes fadeInRightStart {
    from { opacity: 0; transform: translateX(0) scale(0.9); }
    to { opacity: 1; transform: translateX(16rpx) scale(1); }
}
</style>
