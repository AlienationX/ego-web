<template>
    <view class="desktop-preview-overlay">
        <!-- 底部浮动控制总面板（极简高质感双态胶囊，从容入场，绝无繁冗遮挡） -->
        <view class="desktop-controls-panel"
            :class="[isControlsVisible ? 'is-entering' : 'is-leaving', { 'is-immersive-state': currentRotated }]"
            @click.stop>
            <view class="desktop-mode-switcher">
                <!-- 状态 1：标准视角（竖屏原始画幅） -->
                <view class="switcher-pill" :class="{ 'is-active': !currentRotated }"
                    @click="setRotateState(false)">
                    <mdi-icon path="/static/icons/phone-rotate-portrait.svg" size="15px"
                        :color="!currentRotated ? '#ffffff' : '#94a3b8'"></mdi-icon>
                    <text class="pill-text">标准画幅</text>
                </view>

                <!-- 状态 2：横屏沉浸（一键 90° 旋转全屏查看） -->
                <view class="switcher-pill" :class="{ 'is-active': currentRotated }"
                    @click="setRotateState(true)">
                    <mdi-icon path="/static/icons/phone-rotate-landscape.svg" size="15px"
                        :color="currentRotated ? '#ffffff' : '#94a3b8'"></mdi-icon>
                    <text class="pill-text">横屏沉浸</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
    isRotated: {
        type: Boolean,
        default: false,
    },
    showControls: {
        type: Boolean,
        default: true,
    },
});

const emit = defineEmits(['rotate-change']);

const isControlsVisible = computed(() => {
    return props.showControls !== false;
});

// 内部旋转状态与父级保持双向响应
const currentRotated = ref(props.isRotated);

watch(() => props.isRotated, (val) => {
    currentRotated.value = !!val;
});

const setRotateState = (state) => {
    if (currentRotated.value === state) return;
    currentRotated.value = state;
    emit('rotate-change', state);
};
</script>

<style lang="scss" scoped>
.desktop-preview-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 20;
    overflow: hidden;
}

// 底部浮动控制总面板（参考 preview 时钟 0.8s 舒展入场节奏，无假桌面遮挡）
.desktop-controls-panel {
    position: absolute;
    bottom: 9vh;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 30;
    pointer-events: auto;

    &.is-entering {
        animation: desktopPanelSlideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        pointer-events: auto;
    }

    &.is-leaving {
        animation: desktopPanelSlideOut 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
        pointer-events: none !important;
    }

    // 横屏沉浸模式下弱化显示，不喧宾夺主
    &.is-immersive-state {
        opacity: 0.65;
        transition: opacity 0.3s ease;

        &:active {
            opacity: 1;
        }
    }
}

// 极简双态切换胶囊（磨砂深晶质感）
.desktop-mode-switcher {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 8rpx 10rpx;
    border-radius: 40rpx;
    background: rgba(15, 23, 42, 0.88);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1rpx solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.4);

    .switcher-pill {
        display: flex;
        align-items: center;
        gap: 8rpx;
        padding: 12rpx 28rpx;
        border-radius: 30rpx;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

        .pill-text {
            font-size: 22rpx;
            font-weight: 700;
            color: #94a3b8;
            letter-spacing: 0.5rpx;
            transition: color 0.25s ease;
        }

        &:active {
            transform: scale(0.95);
        }

        &.is-active {
            background: #4f46e5;
            box-shadow: 0 4rpx 14rpx rgba(79, 70, 229, 0.4);

            .pill-text {
                color: #ffffff;
            }
        }
    }
}

// ── 进退场关键帧（完全匹配 0.8s preview 时钟从容节奏） ──
@keyframes desktopPanelSlideIn {
    0% {
        opacity: 0;
        transform: translate3d(0, 100rpx, 0);
    }
    100% {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
}

@keyframes desktopPanelSlideOut {
    0% {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
    100% {
        opacity: 0;
        transform: translate3d(0, 120rpx, 0);
    }
}
</style>
