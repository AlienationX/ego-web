<template>
    <view class="pc-layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 背景环境光装饰层 -->
        <view class="ambient-glow ambient-glow--top"></view>
        <view class="ambient-glow ambient-glow--bottom"></view>

        <!-- 居中核心卡片 -->
        <view class="pc-card">
            <!-- 顶部应用标识与徽章 -->
            <view class="brand-row">
                <image class="app-logo" src="/static/logo.svg" mode="aspectFit" />
                <text class="app-name">{{ $t('common.appName') || '本我壁纸' }}</text>
            </view>

            <!-- 核心引导设备图标徽章 -->
            <view class="device-badge">
                <mdi-icon
                    path="/static/icons/cellphone.svg"
                    size="32px"
                    :color="settingsStore.isDark ? '#818cf8' : '#4f46e5'"
                ></mdi-icon>
            </view>

            <text class="title">请使用手机微信访问</text>
            
            <text class="subtitle">
                本应用专为移动设备深度定制。<br />
                为保证超高清原画浏览、灵动锁屏预览及一键设壁纸体验，请移步手机端微信使用。
            </text>

            <!-- 小程序太阳码区域 -->
            <view class="qrcode-wrapper">
                <view class="qrcode-inner">
                    <image
                        v-if="!qrcodeLoadError"
                        class="qrcode-img"
                        src="/static/images/mini-program-qrcode.png"
                        mode="aspectFit"
                        :show-menu-by-longpress="true"
                        @error="onQrcodeError"
                    />
                    <!-- 若尚未放置实际小程序码图片时的优雅兜底图形 -->
                    <view v-else class="qrcode-fallback">
                        <image class="fallback-logo" src="/static/logo.svg" mode="aspectFit" />
                        <text class="fallback-text">微信搜索</text>
                        <text class="fallback-highlight">「本我壁纸」</text>
                    </view>
                </view>

                <text class="qrcode-tip">手机微信「扫一扫」立即进入</text>
            </view>

            <!-- 便捷复制按钮 -->
            <view class="action-row">
                <button class="copy-btn" @click="handleCopyName">
                    <mdi-icon
                        path="/static/icons/content-save.svg"
                        size="16px"
                        :color="settingsStore.isDark ? '#e2e8f0' : '#475569'"
                    ></mdi-icon>
                    <text class="copy-btn-text">复制小程序名称</text>
                </button>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref } from 'vue';
import { useSettingsStore } from '@/stores/settings.js';

const settingsStore = useSettingsStore();
const qrcodeLoadError = ref(false);

const onQrcodeError = () => {
    qrcodeLoadError.value = true;
};

// 复制小程序名称，方便用户在手机微信直接搜索
const handleCopyName = () => {
    uni.setClipboardData({
        data: '本我壁纸',
        success: () => {
            uni.showToast({
                title: '名称已复制，请在手机微信中搜索',
                icon: 'none',
                duration: 2500,
            });
        },
    });
};
</script>

<style lang="scss" scoped>
.pc-layout {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    background-color: var(--page-background, #f8fafc);
    box-sizing: border-box;
    padding: 40rpx;
    transition: background-color 0.3s ease;
}

// ── 环境光装饰光晕 ──
.ambient-glow {
    position: absolute;
    width: 600rpx;
    height: 600rpx;
    border-radius: 50%;
    pointer-events: none;
    filter: blur(120rpx);
    opacity: 0.28;

    &--top {
        top: -100rpx;
        left: 10%;
        background: radial-gradient(circle, #6366f1 0%, transparent 70%);
    }

    &--bottom {
        bottom: -100rpx;
        right: 10%;
        background: radial-gradient(circle, #ec4899 0%, transparent 70%);
    }

    .theme-dark & {
        opacity: 0.18;
    }
}

// ── 核心毛玻璃卡片 ──
.pc-card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 820rpx;
    background: var(--panel-background, rgba(255, 255, 255, 0.9));
    border-radius: 40rpx;
    padding: 60rpx 48rpx 50rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    box-sizing: border-box;
    box-shadow:
        0 10rpx 30rpx rgba(0, 0, 0, 0.04),
        0 30rpx 60rpx -10rpx rgba(15, 23, 42, 0.08);
    border: 1rpx solid var(--panel-border, rgba(0, 0, 0, 0.06));
    backdrop-filter: blur(24rpx);
    -webkit-backdrop-filter: blur(24rpx);

    .theme-dark & {
        background: var(--panel-background, rgba(30, 41, 59, 0.85));
        border: 1rpx solid rgba(255, 255, 255, 0.1);
        box-shadow:
            0 10rpx 30rpx rgba(0, 0, 0, 0.2),
            0 30rpx 70rpx -10rpx rgba(0, 0, 0, 0.5);
    }
}

.brand-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 36rpx;

    .app-logo {
        width: 48rpx;
        height: 48rpx;
        border-radius: 12rpx;
    }

    .app-name {
        font-size: 28rpx;
        font-weight: 700;
        letter-spacing: 1rpx;
        color: var(--text-primary, #0f172a);
    }
}

.device-badge {
    width: 110rpx;
    height: 110rpx;
    border-radius: 50%;
    background: rgba(79, 70, 229, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 28rpx;

    .theme-dark & {
        background: rgba(129, 140, 248, 0.14);
    }
}

.title {
    font-size: 40rpx;
    font-weight: 800;
    line-height: 1.3;
    color: var(--text-primary, #0f172a);
    margin-bottom: 18rpx;
}

.subtitle {
    font-size: 26rpx;
    line-height: 1.65;
    color: var(--text-secondary, #64748b);
    max-width: 680rpx;
    margin-bottom: 40rpx;
}

// ── 太阳码区域 ──
.qrcode-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30rpx 36rpx 24rpx;
    border-radius: 32rpx;
    background: rgba(0, 0, 0, 0.02);
    border: 1rpx dashed rgba(0, 0, 0, 0.08);
    margin-bottom: 36rpx;

    .theme-dark & {
        background: rgba(255, 255, 255, 0.03);
        border: 1rpx dashed rgba(255, 255, 255, 0.12);
    }

    .qrcode-inner {
        width: 300rpx;
        height: 300rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 18rpx;
    }

    .qrcode-img {
        width: 100%;
        height: 100%;
        border-radius: 20rpx;
    }

    .qrcode-fallback {
        width: 100%;
        height: 100%;
        border-radius: 20rpx;
        background: var(--panel-background, #ffffff);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10rpx;
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);

        .fallback-logo {
            width: 80rpx;
            height: 80rpx;
            border-radius: 16rpx;
            margin-bottom: 8rpx;
        }

        .fallback-text {
            font-size: 22rpx;
            color: var(--text-secondary, #64748b);
        }

        .fallback-highlight {
            font-size: 26rpx;
            font-weight: 700;
            color: #4f46e5;

            .theme-dark & {
                color: #818cf8;
            }
        }
    }

    .qrcode-tip {
        font-size: 24rpx;
        font-weight: 600;
        color: var(--text-secondary, #64748b);
    }
}

// ── 复制按钮 ──
.action-row {
    width: 100%;
    display: flex;
    justify-content: center;

    .copy-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 12rpx;
        padding: 0 36rpx;
        height: 72rpx;
        line-height: 72rpx;
        border-radius: 999rpx;
        background: rgba(0, 0, 0, 0.04);
        border: 1rpx solid rgba(0, 0, 0, 0.06);
        cursor: pointer;
        transition: all 0.2s ease;

        &:active {
            transform: scale(0.97);
            background: rgba(0, 0, 0, 0.08);
        }

        .theme-dark & {
            background: rgba(255, 255, 255, 0.08);
            border: 1rpx solid rgba(255, 255, 255, 0.12);

            &:active {
                background: rgba(255, 255, 255, 0.14);
            }
        }

        .copy-btn-text {
            font-size: 24rpx;
            font-weight: 600;
            color: var(--text-primary, #0f172a);
        }
    }
}
</style>
