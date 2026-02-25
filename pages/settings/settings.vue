<template>
    <view class="layout">
        <menu-bar>
            <template #title>{{ t('user.profile.settings') }}</template>
        </menu-bar>

        <view class="list">
            <view class="row" v-for="item in settings" :key="item.left_text" @click="item.click">
                <view class="left">
                    <image class="icon" :src="item.left_icon"></image>
                    <view class="text">{{ item.left_text }}</view>
                </view>
                <view class="right">
                    <view class="text" v-if="item.right_text">{{ item.right_text }}</view>
                    <uni-icons v-if="item.right_icon" :type="item.right_icon" size="15" color="#9da6b3"></uni-icons>
                </view>
            </view>
        </view>

        <uni-popup ref="previewTypePopup" type="bottom" :safe-area="true">
            <view class="preview-popup">
                <view class="popup-header">
                    <view class="title">{{ t('user.settings.previewType') }}</view>
                    <view class="popup-close" @click="closePreviewTypePopup">
                        <uni-icons type="closeempty" size="20" color="#7d8696"></uni-icons>
                    </view>
                </view>

                <view class="preview-type-list">
                    <view
                        class="preview-type-item"
                        :class="{ active: settingsStore.options.previewType === 'classic' }"
                        @click="setPreviewType('classic')">
                        <view class="preview-mock phone classic">
                            <view class="mock-time"></view>
                            <view class="mock-clock">08:00</view>
                            <view class="mock-bar classic-bar"></view>
                        </view>
                        <view class="preview-type-name">{{ t('user.settings.previewClassic') }}</view>
                        <uni-icons
                            v-if="settingsStore.options.previewType === 'classic'"
                            class="active-mark"
                            type="checkmarkempty"
                            size="16"
                            color="#1f87ef"></uni-icons>
                    </view>

                    <view
                        class="preview-type-item"
                        :class="{ active: settingsStore.options.previewType === 'floating' }"
                        @click="setPreviewType('floating')">
                        <view class="preview-mock phone floating">
                            <view class="mock-time"></view>
                            <view class="mock-clock">08:00</view>
                            <view class="mock-bar floating-bar"></view>
                        </view>
                        <view class="preview-type-name">{{ t('user.settings.previewFloating') }}</view>
                        <uni-icons
                            v-if="settingsStore.options.previewType === 'floating'"
                            class="active-mark"
                            type="checkmarkempty"
                            size="16"
                            color="#1f87ef"></uni-icons>
                    </view>
                </view>
            </view>
        </uni-popup>
    </view>
</template>

<script setup>
import { computed, ref } from 'vue';
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

const settings = computed(() => [
    {
        left_icon: '/static/icons/translate.svg',
        left_text: t('user.settings.language'),
        right_text: uni.getLocale() === 'en' ? t('user.settings.english') : t('user.settings.chinese'),
        right_icon: 'forward',
        click: switchLanguage,
    },
    {
        left_icon: '/static/icons/theme-light-dark.svg',
        left_text: t('user.settings.theme'),
        right_text: settingsStore.options.theme === 'light' ? t('user.settings.light') : t('user.settings.dark'),
        right_icon: 'forward',
        click: switchTheme,
    },
    {
        left_icon: '/static/icons/view-carousel.svg',
        left_text: t('user.settings.previewType'),
        right_text:
            settingsStore.options.previewType === 'floating' ? t('user.settings.previewFloating') : t('user.settings.previewClassic'),
        right_icon: 'forward',
        click: openPreviewTypePopup,
    },
    {
        left_icon: '/static/icons/database-refresh.svg',
        left_text: t('user.settings.clearCache'),
        right_text: '',
        right_icon: '',
        click: clearCache,
    },
    {
        left_icon: '/static/icons/cog.svg',
        left_text: t('user.settings.about'),
        right_text: '',
        right_icon: 'forward',
        click: goToAbout,
    },
]);
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: #f5f5f5;
}

.list {
    padding: 20rpx 24rpx 24rpx;
    background: transparent;

    .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 6rpx;
        height: 108rpx;
        border-bottom: 1rpx solid #e4e9ef;

        &:last-child {
            border-bottom: none;
        }

        .left {
            display: flex;
            align-items: center;

            .icon {
                width: 40rpx;
                height: 40rpx;
                filter: brightness(0) saturate(100%) invert(52%) sepia(88%) saturate(485%) hue-rotate(106deg)
                    brightness(91%) contrast(87%);
            }

            .text {
                padding-left: 18rpx;
                color: #2f3643;
                font-size: 30rpx;
            }
        }

        .right {
            display: flex;
            align-items: center;
            min-height: 40rpx;

            .text {
                font-size: 26rpx;
                color: #8a93a3;
                margin-right: 10rpx;
            }
        }
    }
}

.preview-popup {
    background: #fff;
    border-radius: 26rpx 26rpx 0 0;
    padding: 24rpx 24rpx calc(34rpx + env(safe-area-inset-bottom));

    .popup-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12rpx;

        .title {
            font-size: 32rpx;
            color: #222b37;
            font-weight: 600;
        }

        .popup-close {
            width: 56rpx;
            height: 56rpx;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }

    .preview-type-list {
        display: flex;
        gap: 18rpx;

        .preview-type-item {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 20rpx 12rpx 16rpx;
            flex: 1;
            border: 1rpx solid #edf1f5;
            border-radius: 14rpx;

            &.active {
                border-color: #9dc7f3;
                background: #f7fbff;

                .preview-type-name {
                    color: #1f87ef;
                }

                .preview-mock.phone {
                    border-color: #8db6e4;
                }
            }

            .preview-type-name {
                margin-top: 14rpx;
                font-size: 28rpx;
                color: #3f4957;
                text-align: center;
                min-height: auto;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
            }

            .active-mark {
                margin-left: 0;
                margin-top: 8rpx;
                width: 32rpx;
                text-align: center;
            }
        }
    }

    .preview-mock.phone {
        position: relative;
        width: 130rpx;
        height: 200rpx;
        border: 8rpx solid #bfc4cc;
        border-radius: 24rpx;
        background: #fff;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-top: 18rpx;
    }

    .mock-time {
        width: 46rpx;
        height: 10rpx;
        border-radius: 6rpx;
        background: #d6dbe3;
        margin-bottom: 12rpx;
    }

    .mock-clock {
        font-size: 14rpx;
        line-height: 1;
        color: #a9b0ba;
    }

    .mock-bar {
        width: 86rpx;
        height: 20rpx;
        border-radius: 8rpx;
        background: #1f87ef;
    }

    .classic-bar {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        bottom: 46rpx;
    }

    .floating-bar {
        position: absolute;
        width: 20rpx;
        height: 64rpx;
        right: 14rpx;
        bottom: 28rpx;
    }

    .mock-top-bar {
        width: 96rpx;
        height: 24rpx;
        border-radius: 8rpx;
        background: #1f87ef;
    }

}
</style>
