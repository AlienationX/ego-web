<template>
    <uni-popup ref="popup" type="bottom" :safe-area="false" @change="onPopupChange">
        <view class="share-sheet" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
            <!-- 头部标题栏 -->
            <view class="sheet-header">
                <text class="title">{{ title || t('common.share') }}</text>
                <view class="close-btn" @click="close">
                    <uni-icons type="clear" size="32" :color="settingsStore.isDark ? '#a1a1aa' : '#888888'"></uni-icons>
                </view>
            </view>

            <!-- 4列分享网格 -->
            <view class="share-grid">
                <!-- #ifndef MP-WEIXIN -->

                <!-- 1. 微信好友 -->
                <view class="share-item" @click="shareToWechat('WXSceneSession')">
                    <view class="icon-wrap icon-weixin">
                        <uni-icons type="weixin" size="40" color="#ffffff"></uni-icons>
                    </view>
                    <text class="item-label">{{ t('shareSheet.weixinFriend') }}</text>
                </view>

                <!-- 2. 微信朋友圈 (小程序不支持分享朋友圈) -->
                <view class="share-item" @click="shareToWechat('WXSceneTimeline')">
                    <view class="icon-wrap icon-pyq">
                        <uni-icons type="pyq" size="40" color="#ffffff"></uni-icons>
                    </view>
                    <text class="item-label">{{ t('shareSheet.weixinTimeline') }}</text>
                </view>

                <!-- 3. 新浪微博 -->
                <view class="share-item" @click="shareToWeibo">
                    <view class="icon-wrap icon-weibo">
                        <uni-icons type="weibo" size="40" color="#ffffff"></uni-icons>
                    </view>
                    <text class="item-label">{{ t('shareSheet.weibo') }}</text>
                </view>

                <!-- 4. QQ好友 -->
                <view class="share-item" @click="shareToQQ">
                    <view class="icon-wrap icon-qq">
                        <uni-icons type="qq" size="40" color="#ffffff"></uni-icons>
                    </view>
                    <text class="item-label">{{ t('shareSheet.qq') }}</text>
                </view>

                <!-- 5. 系统原生分享 -->
                <view class="share-item" @click="shareToSystem">
                    <view class="icon-wrap icon-system">
                        <mdi-icon path="/static/icons/export.svg" size="32px" color="#ffffff"></mdi-icon>
                    </view>
                    <text class="item-label">{{ t('shareSheet.systemShare') }}</text>
                </view>
                <!-- #endif -->
            </view>
        </view>
    </uni-popup>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserStore } from '@/stores/user.js';
import { apiPostEarnEnergy } from '@/api/wallpaper.js';

const props = defineProps({
    title: {
        type: String,
        default: '',
    },
    shareTitle: {
        type: String,
        default: '',
    },
    shareSummary: {
        type: String,
        default: '',
    },
    shareImage: {
        type: String,
        default: '',
    },
    shareUrl: {
        type: String,
        default: '',
    },
});

const emit = defineEmits(['open', 'close', 'success']);

const { t } = useI18n();
const settingsStore = useSettingsStore();
const userStore = useUserStore();
const popup = ref(null);

const open = () => {
    popup.value?.open();
    emit('open');
};

const close = () => {
    popup.value?.close();
    emit('close');
};

const onPopupChange = (e) => {
    if (!e.show) {
        emit('close');
    }
};

// 1 & 2. 分享到微信（好友 / 朋友圈）
const shareToWechat = (scene) => {
    uni.share({
        provider: 'weixin',
        scene: scene, // WXSceneSession | WXSceneTimeline
        type: 0, // 图文卡片
        href: props.shareUrl || 'https://egowallpaper.space',
        title: props.shareTitle || t('common.appName'),
        summary: props.shareSummary || t('about.introText'),
        imageUrl: props.shareImage || '/static/images/logo.png',
        success: (res) => {
            // 分享微信好友 +1 / 朋友圈 +3 能量（仅登录用户请求接口）
            if (userStore.isLoggedIn) {
                const actionType = scene === 'WXSceneTimeline' ? 'share_timeline' : 'share_image';
                const amount = scene === 'WXSceneTimeline' ? 3 : 1;
                apiPostEarnEnergy({ action_type: actionType, amount }).then((energyRes) => {
                    if (energyRes.data?.energy !== undefined) {
                        userStore.updateEnergy(energyRes.data.energy);
                        uni.showToast({
                            title: t('shareSheet.shareSuccessWithEnergy', { amount }),
                            icon: 'none',
                        });
                    } else {
                        uni.showToast({
                            title: t('shareSheet.shareSuccess') || '分享成功',
                            icon: 'none',
                        });
                    }
                }).catch(() => {
                    uni.showToast({
                        title: t('shareSheet.shareSuccess') || '分享成功',
                        icon: 'none',
                    });
                });
            } else {
                uni.showToast({
                    title: t('shareSheet.shareSuccess') || '分享成功',
                    icon: 'none',
                });
            }
            emit('success', { type: 'weixin', scene });
            close();
        },
        fail: (err) => {
            console.error('weixin share fail:', err);
            if (err?.errMsg?.includes('cancel') || err?.errCode === -2) {
                return;
            }
            uni.showToast({
                title: t('shareSheet.shareFailed') || '分享失败',
                icon: 'none',
            });
        },
    });
};

// 3. 分享到新浪微博
const shareToWeibo = () => {
    uni.share({
        provider: 'sinaweibo',
        type: 0,
        href: props.shareUrl || 'https://egowallpaper.space',
        title: props.shareTitle || t('common.appName'),
        summary: props.shareSummary || t('about.introText'),
        imageUrl: props.shareImage || '/static/images/logo.png',
        success: (res) => {
            uni.showToast({
                title: t('shareSheet.shareSuccess') || '分享成功',
                icon: 'none',
            });
            emit('success', { type: 'weibo' });
            close();
        },
        fail: (err) => {
            console.error('weibo share fail:', err);
            if (err?.errMsg?.includes('cancel') || err?.errCode === -2) {
                return;
            }
            uni.showToast({
                title: t('shareSheet.weiboFailed') || '未能调起微博',
                icon: 'none',
            });
        },
    });
};

// 4. 分享到 QQ
const shareToQQ = () => {
    uni.share({
        provider: 'qq',
        type: 1, // 纯文本或链接
        href: props.shareUrl || 'https://egowallpaper.space',
        title: props.shareTitle || t('common.appName'),
        summary: props.shareSummary || t('about.introText'),
        imageUrl: props.shareImage || '/static/images/logo.png',
        success: (res) => {
            uni.showToast({
                title: t('shareSheet.shareSuccess') || '分享成功',
                icon: 'none',
            });
            emit('success', { type: 'qq' });
            close();
        },
        fail: (err) => {
            console.error('qq share fail:', err);
            if (err?.errMsg?.includes('cancel') || err?.errCode === -2) {
                return;
            }
            uni.showToast({
                title: t('shareSheet.qqFailed') || '未能调起QQ',
                icon: 'none',
            });
        },
    });
};

// 5. 系统原生分享
const shareToSystem = () => {
    uni.shareWithSystem({
        type: 'text',
        summary: props.shareSummary || t('about.introText'),
        href: props.shareUrl || 'https://egowallpaper.space',
        success: () => {
            uni.showToast({
                title: t('shareSheet.shareSuccess') || '分享成功',
                icon: 'none',
            });
            emit('success', { type: 'system' });
            close();
        },
        fail: (err) => {
            console.error('system share fail:', err);
        },
    });
};

defineExpose({
    open,
    close,
});
</script>

<style lang="scss" scoped>
.share-sheet {
    background: #ffffff;
    border-radius: 36rpx 36rpx 0 0;
    padding: 36rpx 32rpx 50rpx 32rpx;
    box-sizing: border-box;
    transition: background-color 0.3s ease;

    &.theme-dark {
        background: #18181b;

        .sheet-header .title {
            color: #f4f5f6;
        }

        .share-item .item-label {
            color: #d1d5db;
        }
    }

    &.theme-light {
        background: #ffffff;

        .sheet-header .title {
            color: #111827;
        }

        .share-item .item-label {
            color: #4b5563;
        }
    }
}

.sheet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 40rpx;

    .title {
        font-size: 34rpx;
        font-weight: 700;
    }

    .close-btn {
        width: 60rpx;
        height: 60rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;

        &:active {
            opacity: 0.7;
        }
    }
}

.share-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20rpx;
    margin-bottom: 20rpx;
}

.share-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:active {
        opacity: 0.8;
        transform: scale(0.96);
    }

    .icon-wrap {
        width: 108rpx;
        height: 108rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16rpx;
        box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.08);

        &.icon-weixin {
            background: #07c160;
        }

        &.icon-pyq {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        &.icon-weibo {
            background: #e6162d;
        }

        &.icon-qq {
            background: #1296db;
        }

        &.icon-system {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        }
    }

    .item-label {
        font-size: 24rpx;
        font-weight: 500;
        text-align: center;
    }
}
</style>
