<template>
    <view class="layout">
        <view class="list">
            <view class="row" v-for="item in settings" :key="item.left_text" @click="item.click">
                <view class="left">
                    <!-- <uni-icons :type="item.left_icon" size="20" color="#28b389"></uni-icons> -->
                    <image class="icon" :src="item.left_icon"></image>
                    <view class="text">
                        {{ item.left_text }}
                    </view>
                </view>
                <view class="right">
                    <view class="text">
                        {{ item.right_text }}
                    </view>
                    <uni-icons :type="item.right_icon" size="15"></uni-icons>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
    import { ref, reactive, computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useSettingsStore } from '@/stores/settings.js';

    const { t, locale } = useI18n();

    const settingsStore = useSettingsStore();

    const swithLanguage = () => {
        const currentLanguage = uni.getLocale() === 'en' ? 'zh-Hans' : 'en';
        uni.setLocale(currentLanguage);
        uni.setStorageSync('lang', currentLanguage);
        locale.value = currentLanguage;
    };

    const swithTheme = () => {
        settingsStore.options.theme = settingsStore.options.theme === 'light' ? 'dark' : 'light';
    };

    // 必须使用computed定义，否则切换语言后t函数不会更新
    const settings = computed(() => [
        {
            left_icon: '/common/icons/translate.svg',
            left_text: t('user.settings.language'),
            right_text: uni.getLocale() === 'en' ? t('user.settings.english') : t('user.settings.chinese'),
            right_icon: 'forward',
            click: swithLanguage
        },
        {
            left_icon: '/common/icons/theme-light-dark.svg',
            left_text: t('user.settings.theme'),
            right_text: settingsStore.options.theme === 'light' ? t('user.settings.light') : t('user.settings.dark'),
            right_icon: 'forward',
            click: swithTheme
        }
    ]);
</script>

<style lang="scss" scoped>
    .layout {
        .list {
            .row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 30rpx;
                height: 100rpx;
                border-bottom: 1rpx solid #eee;
                position: relative;
                background: #fff;

                // &:last-child {border-bottom: 0;}  // 去掉最底下的边框
                .left {
                    display: flex;
                    align-items: center;
                    .icon {
                        width: 44rpx;
                        height: 44rpx;
                    }

                    .text {
                        padding-left: 20rpx;
                        color: #666;
                    }
                }

                .right {
                    display: flex;
                    align-items: center;

                    .text {
                        font-size: 28rpx;
                        color: #aaa;
                    }
                }

                button {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100rpx;
                    width: 100%;
                    opacity: 0;
                }
            }
        }
    }
</style>
