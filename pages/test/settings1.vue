<template>
    <view class="layout">
        <menu-bar>
            <template #title>{{ t('user.profile.settings') }}</template>
        </menu-bar>

        <scroll-view scroll-y class="content">
            <view class="summary">
                <view class="summary-icon">
                    <image src="/static/icons/feather/settings.svg" mode="aspectFit" class="summary-icon-img"></image>
                </view>
                <view class="summary-text">
                    <view class="summary-title">{{ t('user.profile.settings') }}</view>
                    <view class="summary-subtitle">{{ t('user.settings.managePreferences') }}</view>
                </view>
            </view>

            <view class="section">
                <view class="section-title">{{ t('user.settings.preferences') }}</view>
                <view class="list">
                    <view class="row" @click="switchLanguage">
                        <view class="left">
                            <view class="icon language">
                                <image src="/static/icons/feather/globe.svg" mode="aspectFit" class="icon-img"></image>
                            </view>
                            <text class="label">{{ t('user.settings.language') }}</text>
                        </view>
                        <view class="right">
                            <text class="value">{{
                                uni.getLocale() === 'en' ? t('user.settings.english') : t('user.settings.chinese')
                            }}</text>
                            <image src="/static/icons/feather/chevron-right.svg" mode="aspectFit" class="arrow-icon"></image>
                        </view>
                    </view>

                    <view class="divider"></view>

                    <view class="row" @click="switchTheme">
                        <view class="left">
                            <view class="icon theme">
                                <image src="/static/icons/feather/moon.svg" mode="aspectFit" class="icon-img"></image>
                            </view>
                            <text class="label">{{ t('user.settings.theme') }}</text>
                        </view>
                        <view class="right">
                            <text class="value">{{
                                settingsStore.options.theme === 'light' ? t('user.settings.light') : t('user.settings.dark')
                            }}</text>
                            <image src="/static/icons/feather/chevron-right.svg" mode="aspectFit" class="arrow-icon"></image>
                        </view>
                    </view>

                    <view class="divider"></view>

                    <view class="row" @click="openPreviewTypePopup">
                        <view class="left">
                            <view class="icon preview">
                                <image src="/static/icons/feather/eye.svg" mode="aspectFit" class="icon-img"></image>
                            </view>
                            <text class="label">{{ t('user.settings.previewType') }}</text>
                        </view>
                        <view class="right">
                            <text class="value">{{
                                settingsStore.options.previewType === 'floating'
                                    ? t('user.settings.previewFloating')
                                    : t('user.settings.previewClassic')
                            }}</text>
                            <image src="/static/icons/feather/chevron-right.svg" mode="aspectFit" class="arrow-icon"></image>
                        </view>
                    </view>
                </view>
            </view>

            <view class="section">
                <view class="section-title">{{ t('user.settings.system') }}</view>
                <view class="list">
                    <view class="row" @click="clearCache">
                        <view class="left">
                            <view class="icon cache">
                                <image src="/static/icons/feather/trash-2.svg" mode="aspectFit" class="icon-img"></image>
                            </view>
                            <text class="label">{{ t('user.settings.clearCache') }}</text>
                        </view>
                        <view class="right">
                            <image src="/static/icons/feather/chevron-right.svg" mode="aspectFit" class="arrow-icon"></image>
                        </view>
                    </view>

                    <view class="divider"></view>

                    <view class="row" @click="goToAbout">
                        <view class="left">
                            <view class="icon about">
                                <image src="/static/icons/feather/info.svg" mode="aspectFit" class="icon-img"></image>
                            </view>
                            <text class="label">{{ t('user.settings.about') }}</text>
                        </view>
                        <view class="right">
                            <image src="/static/icons/feather/chevron-right.svg" mode="aspectFit" class="arrow-icon"></image>
                        </view>
                    </view>
                </view>
            </view>

            <view class="version-info">
                <text class="version-text">{{ t('common.appName') }} v1.0.0</text>
            </view>
        </scroll-view>

        <uni-popup ref="previewTypePopup" type="bottom" :safe-area="true">
            <view class="preview-popup">
                <view class="popup-head">
                    <text class="popup-title">{{ t('user.settings.previewType') }}</text>
                    <view class="popup-close" @click="closePreviewTypePopup">
                        <image src="/static/icons/feather/x.svg" mode="aspectFit" class="close-icon"></image>
                    </view>
                </view>

                <view class="preview-type-list">
                    <view
                        class="preview-item"
                        :class="{ active: settingsStore.options.previewType === 'classic' }"
                        @click="setPreviewType('classic')"
                    >
                        <view class="preview-mock phone">
                            <view class="mock-time"></view>
                            <view class="mock-clock">08:00</view>
                            <view class="mock-bar classic-bar"></view>
                        </view>
                        <text class="preview-name">{{ t('user.settings.previewClassic') }}</text>
                        <view v-if="settingsStore.options.previewType === 'classic'" class="check-icon">
                            <image src="/static/icons/feather/check.svg" mode="aspectFit" class="check-icon-img"></image>
                        </view>
                    </view>

                    <view
                        class="preview-item"
                        :class="{ active: settingsStore.options.previewType === 'floating' }"
                        @click="setPreviewType('floating')"
                    >
                        <view class="preview-mock phone">
                            <view class="mock-time"></view>
                            <view class="mock-clock">08:00</view>
                            <view class="mock-bar floating-bar"></view>
                        </view>
                        <text class="preview-name">{{ t('user.settings.previewFloating') }}</text>
                        <view v-if="settingsStore.options.previewType === 'floating'" class="check-icon">
                            <image src="/static/icons/feather/check.svg" mode="aspectFit" class="check-icon-img"></image>
                        </view>
                    </view>
                </view>
            </view>
        </uni-popup>
    </view>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';

const { t, locale } = useI18n();
const settingsStore = useSettingsStore();
const previewTypePopup = ref(null);

const switchLanguage = () => {
    const currentLanguage = uni.getLocale() === 'en' ? 'zh-Hans' : 'en';
    uni.setLocale(currentLanguage);
    uni.setStorageSync('lang', currentLanguage);
    locale.value = currentLanguage;
};

const switchTheme = () => {
    settingsStore.options.theme = settingsStore.options.theme === 'light' ? 'dark' : 'light';
    uni.showToast({
        title: settingsStore.options.theme,
        icon: 'none',
    });
};

const openPreviewTypePopup = () => {
    previewTypePopup.value?.open();
};

const closePreviewTypePopup = () => {
    previewTypePopup.value?.close();
};

const setPreviewType = (type) => {
    settingsStore.options.previewType = type;
    closePreviewTypePopup();
};

const clearCache = async () => {
    uni.showLoading({
        title: t('user.settings.clearing'),
        mask: true,
    });

    try {
        uni.clearStorageSync();

        uni.hideLoading();
        uni.showToast({
            title: t('user.settings.clearSuccess'),
            icon: 'none',
            duration: 2000,
        });
    } catch (error) {
        uni.hideLoading();
        uni.showToast({
            title: t('user.settings.clearFailed'),
            icon: 'none',
            duration: 2000,
        });
    }
};

const goToAbout = () => {
    uni.navigateTo({ url: '/pages/about/about' });
};
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: #f5f7fb;
}

.content {
    box-sizing: border-box;
    height: calc(100vh - 88rpx);
    padding: 24rpx 26rpx 44rpx;
}

.summary {
    background: #ffffff;
    border: 1rpx solid #ebeff6;
    border-radius: 28rpx;
    padding: 26rpx 24rpx;
    display: flex;
    align-items: center;
    gap: 18rpx;
    margin-bottom: 26rpx;
    box-shadow: 0 10rpx 26rpx rgba(27, 39, 74, 0.06);
}

.summary-icon {
    width: 78rpx;
    height: 78rpx;
    border-radius: 22rpx;
    background: #667eea;
    display: flex;
    align-items: center;
    justify-content: center;

    .summary-icon-img {
        width: 40rpx;
        height: 40rpx;
        filter: brightness(0) invert(1);
    }
}

.summary-text {
    flex: 1;
}

.summary-title {
    font-size: 34rpx;
    line-height: 1.2;
    color: #1d2638;
    font-weight: 700;
}

.summary-subtitle {
    margin-top: 8rpx;
    font-size: 24rpx;
    color: #7f889a;
    line-height: 1.45;
}

.section {
    margin-bottom: 26rpx;
}

.section-title {
    margin: 0 4rpx 12rpx;
    font-size: 24rpx;
    color: #8d95a5;
    letter-spacing: 0.6rpx;
    text-transform: uppercase;
}

.list {
    background: #ffffff;
    border: 1rpx solid #ebeff6;
    border-radius: 24rpx;
    overflow: hidden;
    box-shadow: 0 8rpx 24rpx rgba(24, 39, 75, 0.05);
}

.row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 116rpx;
    padding: 0 22rpx;

    &:active {
        background: #f8faff;
    }
}

.left {
    display: flex;
    align-items: center;
    min-width: 0;
}

.icon {
    width: 66rpx;
    height: 66rpx;
    border-radius: 18rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20rpx;

    &.language {
        background: #667eea;
    }

    &.theme {
        background: #f5576c;
    }

    &.preview {
        background: #4facfe;
    }

    &.cache {
        background: #43e97b;
    }

    &.about {
        background: #fa709a;
    }

    .icon-img {
        width: 32rpx;
        height: 32rpx;
        filter: brightness(0) invert(1);
    }
}

.label {
    font-size: 30rpx;
    color: #1f293d;
    font-weight: 500;
}

.right {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.value {
    max-width: 260rpx;
    font-size: 26rpx;
    color: #8a93a5;
    text-align: right;
}

.arrow-icon {
    width: 28rpx;
    height: 28rpx;
}

.divider {
    height: 1rpx;
    background: #edf1f7;
    margin-left: 108rpx;
}

.version-info {
    text-align: center;
    padding: 14rpx 0 8rpx;
}

.version-text {
    font-size: 22rpx;
    color: #a5acb9;
}

.preview-popup {
    background: #ffffff;
    border-radius: 34rpx 34rpx 0 0;
    padding: 28rpx 24rpx calc(34rpx + env(safe-area-inset-bottom));
}

.popup-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18rpx;
}

.popup-title {
    font-size: 32rpx;
    color: #1c2435;
    font-weight: 700;
}

.popup-close {
    width: 62rpx;
    height: 62rpx;
    border-radius: 50%;
    background: #f3f5f9;
    display: flex;
    align-items: center;
    justify-content: center;

    &:active {
        background: #e9edf3;
    }

    .close-icon {
        width: 24rpx;
        height: 24rpx;
    }
}

.preview-type-list {
    display: flex;
    gap: 18rpx;
}

.preview-item {
    position: relative;
    flex: 1;
    border: 2rpx solid #e4e9f2;
    border-radius: 20rpx;
    background: #f8fafe;
    padding: 18rpx 14rpx 16rpx;
    display: flex;
    flex-direction: column;
    align-items: center;

    &:active {
        transform: scale(0.99);
    }

    &.active {
        border-color: #667eea;
        background: #f2f6ff;
    }
}

.check-icon {
    position: absolute;
    top: 10rpx;
    right: 10rpx;
    width: 36rpx;
    height: 36rpx;
    border-radius: 50%;
    background: #667eea;
    display: flex;
    align-items: center;
    justify-content: center;

    .check-icon-img {
        width: 20rpx;
        height: 20rpx;
        filter: brightness(0) invert(1);
    }
}

.preview-name {
    margin-top: 12rpx;
    font-size: 24rpx;
    color: #4c566b;
}

.preview-item.active .preview-name {
    color: #667eea;
    font-weight: 600;
}

.preview-mock.phone {
    position: relative;
    width: 128rpx;
    height: 198rpx;
    border: 6rpx solid #d5dae5;
    border-radius: 26rpx;
    background: #fff;
    padding-top: 18rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.mock-time {
    width: 50rpx;
    height: 10rpx;
    border-radius: 10rpx;
    background: #e6eaf2;
    margin-bottom: 12rpx;
}

.mock-clock {
    font-size: 16rpx;
    color: #afb6c4;
    line-height: 1;
}

.mock-bar {
    position: absolute;
    background: #667eea;
    border-radius: 8rpx;
}

.classic-bar {
    width: 86rpx;
    height: 20rpx;
    left: 50%;
    transform: translateX(-50%);
    bottom: 48rpx;
}

.floating-bar {
    width: 20rpx;
    height: 68rpx;
    right: 16rpx;
    bottom: 24rpx;
    border-radius: 10rpx;
}
</style>
