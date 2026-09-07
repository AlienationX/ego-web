<template>
    <view class="desktop-preview-overlay" :class="{ 'is-rotated': isRotated }">
        <!-- 场景 1：macOS 桌面 Mockup 遮罩 -->
        <view v-if="desktopMode === 'mac'" class="mac-mockup-overlay">
            <!-- 顶部 macOS 菜单栏 -->
            <view class="mac-menu-bar">
                <view class="mac-menu-left">
                    <text class="mac-apple-logo"></text>
                    <text class="mac-menu-item mac-menu-item--bold">Finder</text>
                    <text class="mac-menu-item">File</text>
                    <text class="mac-menu-item">Edit</text>
                    <text class="mac-menu-item">View</text>
                    <text class="mac-menu-item">Go</text>
                    <text class="mac-menu-item">Window</text>
                    <text class="mac-menu-item">Help</text>
                </view>

                <view class="mac-menu-right">
                    <mdi-icon path="/static/icons/wifi.svg" size="14px" color="#ffffff"></mdi-icon>
                    <mdi-icon path="/static/icons/battery-80.svg" size="16px" color="#ffffff"></mdi-icon>
                    <mdi-icon path="/static/icons/magnify.svg" size="14px" color="#ffffff"></mdi-icon>
                    <mdi-icon path="/static/icons/tune-variant.svg" size="14px" color="#ffffff"></mdi-icon>
                    <text class="mac-clock-text">{{ currentTimeText }}</text>
                </view>
            </view>

            <!-- 底部 macOS 悬浮 Dock 栏 -->
            <view class="mac-dock-wrapper">
                <view class="mac-dock">
                    <view class="dock-app-icon dock-finder">
                        <mdi-icon path="/static/icons/folder-outline.svg" size="22px" color="#ffffff"></mdi-icon>
                    </view>
                    <view class="dock-app-icon dock-safari">
                        <mdi-icon path="/static/icons/compass-outline.svg" size="22px" color="#ffffff"></mdi-icon>
                    </view>
                    <view class="dock-app-icon dock-messages">
                        <mdi-icon path="/static/icons/message-text-outline.svg" size="22px" color="#ffffff"></mdi-icon>
                    </view>
                    <view class="dock-app-icon dock-code">
                        <mdi-icon path="/static/icons/code-tags.svg" size="22px" color="#ffffff"></mdi-icon>
                    </view>
                    <view class="dock-app-icon dock-photos">
                        <mdi-icon path="/static/icons/image-multiple-outline.svg" size="22px" color="#ffffff"></mdi-icon>
                    </view>
                    <view class="dock-divider"></view>
                    <view class="dock-app-icon dock-settings">
                        <mdi-icon path="/static/icons/cog-outline.svg" size="22px" color="#ffffff"></mdi-icon>
                    </view>
                </view>
            </view>
        </view>

        <!-- 场景 2：Windows 11 桌面 Mockup 遮罩 -->
        <view v-else-if="desktopMode === 'win'" class="win-mockup-overlay">
            <!-- 底部 Win11 居中任务栏 -->
            <view class="win-taskbar">
                <view class="win-taskbar-left">
                    <mdi-icon path="/static/icons/weather-partly-cloudy.svg" size="18px" color="#ffffff"></mdi-icon>
                    <text class="win-weather-text">24°C 多云</text>
                </view>

                <view class="win-taskbar-center">
                    <view class="win-icon win-start">
                        <mdi-icon path="/static/icons/brands/microsoft-windows.svg" size="18px" color="#38bdf8"></mdi-icon>
                    </view>
                    <view class="win-icon">
                        <mdi-icon path="/static/icons/magnify.svg" size="18px" color="#ffffff"></mdi-icon>
                    </view>
                    <view class="win-icon">
                        <mdi-icon path="/static/icons/folder-outline.svg" size="18px" color="#ffffff"></mdi-icon>
                    </view>
                    <view class="win-icon">
                        <mdi-icon path="/static/icons/microsoft-edge.svg" size="18px" color="#38bdf8"></mdi-icon>
                    </view>
                    <view class="win-icon">
                        <mdi-icon path="/static/icons/code-tags.svg" size="18px" color="#60a5fa"></mdi-icon>
                    </view>
                </view>

                <view class="win-taskbar-right">
                    <mdi-icon path="/static/icons/wifi.svg" size="14px" color="#ffffff"></mdi-icon>
                    <mdi-icon path="/static/icons/volume-high.svg" size="14px" color="#ffffff"></mdi-icon>
                    <view class="win-date-time">
                        <text class="win-time">{{ currentWinTime }}</text>
                        <text class="win-date">{{ currentWinDate }}</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 底部模式控制切换器胶囊 -->
        <view class="desktop-mode-switcher" @click.stop>
            <view class="switcher-pill" :class="{ 'is-active': desktopMode === 'mac' && !isRotated }"
                @click="setMode('mac')">
                <text>{{ t('desktop.dockMac') }}</text>
            </view>
            <view class="switcher-pill" :class="{ 'is-active': desktopMode === 'win' && !isRotated }"
                @click="setMode('win')">
                <text>{{ t('desktop.dockWin') }}</text>
            </view>
            <view class="switcher-pill" :class="{ 'is-active': isRotated }" @click="toggleRotate">
                <mdi-icon path="/static/icons/screen-rotation.svg" size="12px"
                    :color="isRotated ? '#ffffff' : '#94a3b8'"></mdi-icon>
                <text>{{ t('desktop.rotateLandscape') }}</text>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const emit = defineEmits(['rotate-change']);

const { t } = useI18n();

// 模式：'mac' | 'win'
const desktopMode = ref('mac');
const isRotated = ref(false);

const setMode = (mode) => {
    desktopMode.value = mode;
    if (isRotated.value) {
        isRotated.value = false;
        emit('rotate-change', false);
    }
    try {
        uni.vibrateShort?.();
    } catch (e) { }
};

const toggleRotate = () => {
    isRotated.value = !isRotated.value;
    emit('rotate-change', isRotated.value);
    try {
        uni.vibrateShort?.();
    } catch (e) { }
};

const now = new Date();
const currentTimeText = computed(() => {
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
});

const currentWinTime = computed(() => {
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
});

const currentWinDate = computed(() => {
    return `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
});
</script>

<style lang="scss" scoped>
.desktop-preview-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    pointer-events: auto;
    z-index: 20;
}

// macOS 桌面模拟
.mac-mockup-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    pointer-events: none;

    .mac-menu-bar {
        height: 52rpx;
        padding: 0 24rpx;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(20px);
        display: flex;
        align-items: center;
        justify-content: space-between;

        .mac-menu-left {
            display: flex;
            align-items: center;
            gap: 18rpx;

            .mac-apple-logo {
                font-size: 26rpx;
                color: #ffffff;
                margin-right: 6rpx;
            }

            .mac-menu-item {
                font-size: 20rpx;
                font-weight: 500;
                color: rgba(255, 255, 255, 0.9);

                &--bold {
                    font-weight: 700;
                }
            }
        }

        .mac-menu-right {
            display: flex;
            align-items: center;
            gap: 14rpx;

            .mac-clock-text {
                font-size: 20rpx;
                font-weight: 600;
                color: #ffffff;
                margin-left: 4rpx;
            }
        }
    }

    .mac-dock-wrapper {
        display: flex;
        justify-content: center;
        margin-bottom: 160rpx;

        .mac-dock {
            display: flex;
            align-items: center;
            gap: 14rpx;
            padding: 10rpx 16rpx;
            border-radius: 28rpx;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(24px);
            border: 1rpx solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.35);

            .dock-app-icon {
                width: 64rpx;
                height: 64rpx;
                border-radius: 16rpx;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);

                &.dock-finder {
                    background: linear-gradient(135deg, #38bdf8, #2563eb);
                }

                &.dock-safari {
                    background: linear-gradient(135deg, #60a5fa, #1d4ed8);
                }

                &.dock-messages {
                    background: linear-gradient(135deg, #4ade80, #16a34a);
                }

                &.dock-code {
                    background: linear-gradient(135deg, #0284c7, #0369a1);
                }

                &.dock-photos {
                    background: linear-gradient(135deg, #f43f5e, #e11d48);
                }

                &.dock-settings {
                    background: linear-gradient(135deg, #94a3b8, #475569);
                }
            }

            .dock-divider {
                width: 2rpx;
                height: 48rpx;
                background: rgba(255, 255, 255, 0.25);
                margin: 0 4rpx;
            }
        }
    }
}

// Windows 11 桌面模拟
.win-mockup-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    pointer-events: none;

    .win-taskbar {
        height: 72rpx;
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(24px);
        border-top: 1rpx solid rgba(255, 255, 255, 0.12);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24rpx;
        margin-bottom: 140rpx;

        .win-taskbar-left {
            display: flex;
            align-items: center;
            gap: 8rpx;

            .win-weather-text {
                font-size: 20rpx;
                color: #ffffff;
            }
        }

        .win-taskbar-center {
            display: flex;
            align-items: center;
            gap: 16rpx;

            .win-icon {
                width: 52rpx;
                height: 52rpx;
                border-radius: 10rpx;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s ease;

                &:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            }
        }

        .win-taskbar-right {
            display: flex;
            align-items: center;
            gap: 12rpx;

            .win-date-time {
                display: flex;
                flex-direction: column;
                align-items: flex-end;

                .win-time {
                    font-size: 20rpx;
                    font-weight: 600;
                    color: #ffffff;
                }

                .win-date {
                    font-size: 16rpx;
                    color: #94a3b8;
                }
            }
        }
    }
}

// 底部浮动控制胶囊
.desktop-mode-switcher {
    position: absolute;
    bottom: 80rpx;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 8rpx 10rpx;
    border-radius: 40rpx;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(16px);
    border: 1rpx solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.4);
    z-index: 30;

    .switcher-pill {
        display: flex;
        align-items: center;
        gap: 6rpx;
        padding: 10rpx 24rpx;
        border-radius: 30rpx;
        font-size: 22rpx;
        font-weight: 700;
        color: #94a3b8;
        cursor: pointer;
        transition: all 0.2s ease;

        &.is-active {
            background: #4f46e5;
            color: #ffffff;
            box-shadow: 0 4rpx 12rpx rgba(79, 70, 229, 0.35);
        }
    }
}
</style>
