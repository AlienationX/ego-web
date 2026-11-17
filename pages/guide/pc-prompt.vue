<template>
    <view class="pc-layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 居中核心区域（完全扁平，无任何外层卡片边框及阴影） -->
        <view class="pc-container">
            <!-- 顶部应用标识 -->
            <!-- <view class="pc-container__brand">
                <image class="pc-container__logo" src="/static/logo.svg" mode="aspectFit" />
                <text class="pc-container__brand-name">本我壁纸</text>
            </view> -->

            <!-- 核心标题与引导文案 -->
            <text class="pc-container__title">请使用手机微信访问</text>
            <text class="pc-container__subtitle">
                本应用专为移动设备深度定制，请移步手机端获得原画壁纸浏览与一键设置壁纸体验
            </text>

            <!-- 方式一：直接扫码（无边框，干净纯粹） -->
            <view class="pc-qrcode-section" @click="handlePreviewQrcode">
                <view class="pc-qrcode-box">
                    <image
                        v-if="!qrcodeLoadError"
                        class="pc-qrcode-img"
                        :src="qrcodeUrl"
                        mode="aspectFit"
                        :show-menu-by-longpress="true"
                        @error="onQrcodeError"
                    />
                    <!-- 加载失败兜底图形 -->
                    <view v-else class="pc-qrcode-fallback">
                        <mdi-icon
                            path="/static/icons/alert-circle.svg"
                            size="36px"
                            color="#94a3b8"
                        />
                        <text class="pc-qrcode-fallback__text">二维码加载失败，可使用下方搜索方式</text>
                    </view>
                </view>
                <text class="pc-qrcode-tip">手机微信「扫一扫」立即进入</text>
                <text class="pc-qrcode-subtip">点击可全屏查看二维码</text>
            </view>

            <!-- 扁平轻量分割线 -->
            <view class="pc-divider">
                <view class="pc-divider__line"></view>
                <text class="pc-divider__text">或</text>
                <view class="pc-divider__line"></view>
            </view>

            <!-- 方式二：搜索小程序名称 -->
            <view class="pc-search-section">
                <view class="pc-search-box" @click="handleCopyName">
                    <view class="pc-search-box__left">
                        <mdi-icon
                            path="/static/icons/magnify.svg"
                            size="18px"
                            :color="settingsStore.isDark ? '#94a3b8' : '#64748b'"
                        />
                        <text class="pc-search-box__label">微信搜索：</text>
                        <text class="pc-search-box__name">本我壁纸</text>
                    </view>
                    <view class="pc-search-box__btn">
                        <mdi-icon
                            path="/static/icons/content-save.svg"
                            size="14px"
                            color="#ffffff"
                        />
                        <text class="pc-search-box__btn-text">复制名称</text>
                    </view>
                </view>
                <text class="pc-search-tip">打开手机微信搜索「本我壁纸」进入体验</text>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useSettingsStore } from '@/stores/settings.js';
import { PICS_BASE_URL } from '@/common/config.js';

const settingsStore = useSettingsStore();
const qrcodeLoadError = ref(false);

// 二维码图片完整地址
const qrcodeUrl = computed(() => {
    const base = (PICS_BASE_URL || '').replace(/\/+$/, '');
    return `${base}/gh_1072957b53f6_258.jpg`;
});

const onQrcodeError = () => {
    qrcodeLoadError.value = true;
};

// 点击二维码放大全屏查看
const handlePreviewQrcode = () => {
    if (!qrcodeUrl.value || qrcodeLoadError.value) return;
    uni.previewImage({
        urls: [qrcodeUrl.value],
        current: qrcodeUrl.value,
    });
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
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--page-background-secondary, #ffffff);
    box-sizing: border-box;
    padding: 30rpx;
    transition: background-color 0.3s ease;

    .theme-dark & {
        background-color: var(--page-background, #181818);
    }
}

// ── 核心内容容器（纯扁平排版，无任何卡片外框、底色差与阴影） ──
.pc-container {
    width: 100%;
    max-width: 600rpx;
    background: transparent;
    border: none;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    box-sizing: border-box;

    &__brand {
        display: flex;
        align-items: center;
        gap: 12rpx;
        margin-bottom: 40rpx;
    }

    &__logo {
        width: 48rpx;
        height: 48rpx;
        border-radius: 10rpx;
    }

    &__brand-name {
        font-size: 40rpx;
        font-weight: 600;
        letter-spacing: 0.5rpx;
        color: var(--text-primary, #15171c);
    }

    &__title {
        font-size: 34rpx;
        font-weight: 700;
        line-height: 1.35;
        color: var(--text-primary, #15171c);
        margin-bottom: 12rpx;
    }

    &__subtitle {
        font-size: 23rpx;
        line-height: 1.55;
        color: var(--text-secondary, rgba(21, 23, 28, 0.65));
        max-width: 520rpx;
        margin-bottom: 120rpx;
    }
}

// ── 方式一：直接扫码（无边框、无底框） ──
.pc-qrcode-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
}

.pc-qrcode-box {
    width: 270rpx;
    height: 270rpx;
    border: none;
    background: transparent;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 18rpx;
    transition: transform 0.2s ease;

    &:active {
        transform: scale(0.98);
    }

    .pc-qrcode-img {
        width: 100%;
        height: 100%;
        border-radius: 14rpx;
        display: block;
    }

    .pc-qrcode-fallback {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8rpx;

        &__text {
            font-size: 20rpx;
            color: var(--text-tertiary, #94a3b8);
            text-align: center;
            padding: 0 10rpx;
        }
    }
}

.pc-qrcode-tip {
    font-size: 25rpx;
    font-weight: 600;
    color: var(--text-primary, #15171c);
    margin-bottom: 6rpx;
}

.pc-qrcode-subtip {
    font-size: 21rpx;
    color: var(--text-tertiary, rgba(21, 23, 28, 0.45));
}

// ── 扁平分割线 ──
.pc-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 460rpx;
    margin: 32rpx 0 28rpx;
    gap: 16rpx;

    &__line {
        flex: 1;
        height: 1rpx;
        background-color: var(--panel-border, rgba(0, 0, 0, 0.08));

        .theme-dark & {
            background-color: var(--panel-border, rgba(255, 255, 255, 0.08));
        }
    }

    &__text {
        font-size: 22rpx;
        font-weight: 500;
        color: var(--text-tertiary, rgba(21, 23, 28, 0.4));
    }
}

// ── 方式二：搜索小程序 ──
.pc-search-section {
    width: 100%;
    max-width: 480rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.pc-search-box {
    width: 100%;
    height: 76rpx;
    background-color: rgba(0, 0, 0, 0.035);
    border: none;
    border-radius: 18rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12rpx 0 20rpx;
    box-sizing: border-box;
    cursor: pointer;
    transition: all 0.2s ease;

    &:active {
        opacity: 0.8;
        transform: scale(0.98);
    }

    .theme-dark & {
        background-color: rgba(255, 255, 255, 0.06);
    }

    &__left {
        display: flex;
        align-items: center;
        gap: 10rpx;
    }

    &__label {
        font-size: 23rpx;
        color: var(--text-secondary, rgba(21, 23, 28, 0.65));
    }

    &__name {
        font-size: 25rpx;
        font-weight: 600;
        color: var(--text-primary, #15171c);
    }

    &__btn {
        height: 52rpx;
        padding: 0 18rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6rpx;
        background-color: #07c160;
        border-radius: 12rpx;
        cursor: pointer;
        box-shadow: 0 2rpx 8rpx rgba(7, 193, 96, 0.2);

        &-text {
            font-size: 21rpx;
            font-weight: 600;
            color: #ffffff;
            line-height: 1.4;
        }
    }
}

.pc-search-tip {
    font-size: 21rpx;
    color: var(--text-tertiary, rgba(21, 23, 28, 0.45));
    margin-top: 14rpx;
}
</style>
