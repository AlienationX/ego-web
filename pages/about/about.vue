<template>
    <view class="layout">
        <menu-bar>
            <template #title>{{ t('about.title') }}</template>
        </menu-bar>

        <view class="content-wrapper">
            <view class="app-info">
                <view class="logo-section">
                    <image src="/static/logo.svg" mode="aspectFit" class="app-logo"></image>
                    <view class="app-name">{{ t('common.appName') }}</view>
                    <view class="app-slogan">{{ t('about.slogan') }}</view>
                </view>

                <view class="version-section">
                    <view class="version-item">
                        <text class="version-label">{{ t('about.version') }}</text>
                        <text class="version-value">{{ APP_INFO.appVersion }}</text>
                    </view>
                    <view class="version-item">
                        <text class="version-label">{{ t('about.build') }}</text>
                        <text class="version-value">{{ APP_INFO.appVersionCode }}</text>
                    </view>
                </view>
            </view>

            <view class="info-list">
                <view class="info-group">
                    <view class="group-title">{{ t('about.information') }}</view>
                    <view class="info-item" @click="goToPage('introduction')">
                        <view class="item-left">
                            <uni-icons type="info-filled" size="20" color="#28B389"></uni-icons>
                            <text class="item-text">{{ t('about.introduction') }}</text>
                        </view>
                        <uni-icons type="right" size="16" color="#ccc"></uni-icons>
                    </view>
                    <view class="info-item" @click="checkUpdate">
                        <view class="item-left">
                            <uni-icons type="loop" size="20" color="#28B389"></uni-icons>
                            <text class="item-text">{{ t('about.checkUpdate') }}</text>
                        </view>
                        <view class="item-right">
                            <text class="update-status">{{ t('about.latestVersion') }}</text>
                            <uni-icons type="right" size="16" color="#ccc"></uni-icons>
                        </view>
                    </view>
                </view>

                <view class="info-group">
                    <view class="group-title">{{ t('about.legal') }}</view>
                    <view class="info-item" @click="openHtmlFile('/privacy_agreement.html')">
                        <view class="item-left">
                            <uni-icons type="locked-filled" size="20" color="#28B389"></uni-icons>
                            <text class="item-text">{{ t('about.privacy') }}</text>
                        </view>
                        <uni-icons type="right" size="16" color="#ccc"></uni-icons>
                    </view>
                    <view class="info-item" @click="openHtmlFile('/user_agreement.html')">
                        <view class="item-left">
                            <uni-icons type="paperplane-filled" size="20" color="#28B389"></uni-icons>
                            <text class="item-text">{{ t('about.agreement') }}</text>
                        </view>
                        <uni-icons type="right" size="16" color="#ccc"></uni-icons>
                    </view>
                </view>

                <view class="info-group">
                    <view class="group-title">{{ t('about.contact') }}</view>
                    <view class="info-item" @click="contactSupport">
                        <view class="item-left">
                            <uni-icons type="chatboxes-filled" size="20" color="#28B389"></uni-icons>
                            <text class="item-text">{{ t('about.feedback') }}</text>
                        </view>
                        <uni-icons type="right" size="16" color="#ccc"></uni-icons>
                    </view>
                    <view class="info-item" @click="copyEmail">
                        <view class="item-left">
                            <uni-icons type="email-filled" size="20" color="#28B389"></uni-icons>
                            <text class="item-text">{{ t('about.email') }}</text>
                        </view>
                        <view class="item-right">
                            <text class="email-text">735003439@qq.com</text>
                            <uni-icons type="right" size="16" color="#ccc"></uni-icons>
                        </view>
                    </view>
                </view>

                <view class="info-group">
                    <view class="group-title">{{ t('about.others') }}</view>
                    <view class="info-item" @click="goAppStore">
                        <view class="item-left">
                            <uni-icons type="star-filled" size="20" color="#28B389"></uni-icons>
                            <text class="item-text">{{ t('about.rateUs') }}</text>
                        </view>
                        <uni-icons type="right" size="16" color="#ccc"></uni-icons>
                    </view>
                    <view class="info-item" @click="shareApp">
                        <view class="item-left">
                            <uni-icons type="redo" size="20" color="#28B389"></uni-icons>
                            <text class="item-text">{{ t('about.share') }}</text>
                        </view>
                        <uni-icons type="right" size="16" color="#ccc"></uni-icons>
                    </view>
                </view>
            </view>

            <view class="footer">
                <text class="copyright">{{ t('about.copyright').replace('{year}', currentYear) }}</text>
            </view>

            <view class="safe-area-inset-bottom"></view>
        </view>
    </view>
</template>

<script setup>
    import { ref } from 'vue';
    import { onLoad } from '@dcloudio/uni-app';
    import { useI18n } from 'vue-i18n';

    const { t } = useI18n();

    const APP_INFO = uni.getAppBaseInfo();
    const currentYear = new Date().getFullYear();    

    const openHtmlFile = (url) => {
        uni.navigateTo({
            url: `/pages/webview/webview?url=${encodeURIComponent(url)}`
        });
    };

    const contactSupport = () => {
        uni.navigateTo({
            url: '/pages/feedback/feedback'
        });
    };

    const copyEmail = () => {
        uni.setClipboardData({
            data: '735003439@qq.com',
            success: () => {
                uni.showToast({
                    title: t('about.copied'),
                    icon: 'success'
                });
            }
        });
    };

    const checkUpdate = () => {
        uni.showLoading({ title: t('about.checking') });
        setTimeout(() => {
            uni.hideLoading();
            uni.showModal({
                title: t('common.tip'),
                content: t('about.alreadyLatest'),
                showCancel: false
            });
        }, 1000);
    };

    const goAppStore = () => {
        uni.showModal({
            title: t('common.tip'),
            content: t('about.rateTip'),
            success: (res) => {
                if (res.confirm) {
                    // #ifdef APP-PLUS
                    plus.runtime.openURL('itms-apps://itunes.apple.com/app/idYOUR_APP_ID');
                    // #endif
                }
            }
        });
    };

    const shareApp = () => {
        uni.share({
            provider: 'weixin',
            scene: 'WXSceneSession',
            type: 0,
            summary: t('about.shareText'),
            success: () => {
                uni.showToast({
                    title: t('about.shareSuccess'),
                    icon: 'success'
                });
            },
            fail: () => {
                uni.showToast({
                    title: t('about.shareFailed'),
                    icon: 'none'
                });
            }
        });
    };

    const goToPage = (page) => {
        if (page === 'introduction') {
            uni.showModal({
                title: t('about.introduction'),
                content: t('about.introText'),
                showCancel: false
            });
        }
    };

    onLoad(() => {
        uni.setNavigationBarTitle({
            title: t('about.title')
        });
    });
</script>

<style lang="scss" scoped>
    .layout {
        background-color: #f5f5f5;
        min-height: 100vh;

        .content-wrapper {
            padding: 20rpx 0;
        }

        .app-info {
            background: #fff;
            margin-bottom: 20rpx;
            padding: 60rpx 30rpx 40rpx;

            .logo-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-bottom: 40rpx;

                .app-logo {
                    width: 160rpx;
                    height: 160rpx;
                    border-radius: 32rpx;
                    margin-bottom: 30rpx;
                    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
                }

                .app-name {
                    font-size: 40rpx;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 12rpx;
                }

                .app-slogan {
                    font-size: 28rpx;
                    color: #999;
                }
            }

            .version-section {
                display: flex;
                justify-content: center;
                gap: 60rpx;

                .version-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;

                    .version-label {
                        font-size: 24rpx;
                        color: #999;
                        margin-bottom: 8rpx;
                    }

                    .version-value {
                        font-size: 32rpx;
                        font-weight: 600;
                        color: $wp-theme-color;
                    }
                }
            }
        }

        .info-list {
            padding: 0 30rpx;

            .info-group {
                background: #fff;
                border-radius: 16rpx;
                margin-bottom: 20rpx;
                overflow: hidden;

                .group-title {
                    padding: 30rpx 30rpx 20rpx;
                    font-size: 28rpx;
                    color: #999;
                    font-weight: 500;
                }

                .info-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 30rpx;
                    border-bottom: 1rpx solid #f5f5f5;
                    transition: all 0.3s;

                    &:last-child {
                        border-bottom: none;
                    }

                    &:active {
                        background: #f9f9f9;
                    }

                    .item-left {
                        display: flex;
                        align-items: center;
                        gap: 20rpx;
                        flex: 1;

                        .item-text {
                            font-size: 30rpx;
                            color: #333;
                        }
                    }

                    .item-right {
                        display: flex;
                        align-items: center;
                        gap: 12rpx;

                        .update-status {
                            font-size: 24rpx;
                            color: #999;
                        }

                        .email-text {
                            font-size: 26rpx;
                            color: #666;
                        }
                    }
                }
            }
        }

        .footer {
            text-align: center;
            padding: 40rpx 30rpx;

            .copyright {
                font-size: 24rpx;
                color: #999;
                line-height: 1.6;
            }
        }

        .safe-area-inset-bottom {
            height: constant(safe-area-inset-bottom);
            height: env(safe-area-inset-bottom);
        }
    }
</style>
