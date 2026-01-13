<template>
    <view class="layout">
        <menu-bar>
            <template #title>{{ t('user.profile.settings') }}</template>
        </menu-bar>
        
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
    import { computed } from 'vue';
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
        uni.showToast({
            title: settingsStore.options.theme,
            icon: 'none'
        })
    };

    const clearCache = async () => {
        uni.showLoading({
            title: t('user.settings.clearing'),
            mask: true
        });

        try {
            uni.clearStorageSync();

            uni.hideLoading();
            uni.showToast({
                title: t('user.settings.clearSuccess'),
                icon: 'none',  // success 对勾图标
                duration: 2000
            });
        } catch (error) {
            uni.hideLoading();
            uni.showToast({
                title: t('user.settings.clearFailed'),
                icon: 'none',
                duration: 2000
            });
        }
    };

    const settings = computed(() => [
        {
            left_icon: '/static/icons/translate.svg',
            left_text: t('user.settings.language'),
            right_text: uni.getLocale() === 'en' ? t('user.settings.english') : t('user.settings.chinese'),
            right_icon: 'forward',
            click: swithLanguage
        },
        {
            left_icon: '/static/icons/theme-light-dark.svg',
            left_text: t('user.settings.theme'),
            right_text: settingsStore.options.theme === 'light' ? t('user.settings.light') : t('user.settings.dark'),
            right_icon: 'forward',
            click: swithTheme
        },
        {
            left_icon: '/static/icons/database-refresh.svg',
            left_text: t('user.settings.clearCache'),
            right_text: '',
            right_icon: '',
            click: clearCache
        }
    ]);

</script>

<style lang="scss" scoped>
    .layout {
        background-color: #f5f5f5;
        min-height: 100vh;
        
        .list {
            padding: 20rpx 0;
            
            .row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 30rpx;
                height: 100rpx;
                position: relative;
                background: #fff;
                margin-bottom: 20rpx;
                
                &:last-child {
                    margin-bottom: 0;
                }

                .left {
                    display: flex;
                    align-items: center;
                    
                    .icon {
                        width: 44rpx;
                        height: 44rpx;
                    }

                    .text {
                        padding-left: 20rpx;
                        color: #333;
                        font-size: 32rpx;
                    }
                }

                .right {
                    display: flex;
                    align-items: center;

                    .text {
                        font-size: 28rpx;
                        color: #999;
                        margin-right: 12rpx;
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
