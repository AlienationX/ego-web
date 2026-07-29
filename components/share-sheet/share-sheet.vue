<template>
    <uni-popup ref="popup" type="bottom" :safe-area="false" @change="onPopupChange">
        <view class="share-sheet" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
            <!-- 头部标题栏 -->
            <view class="sheet-header">
                <text class="title">{{ title || t('common.share') }}</text>
                <view class="close-btn" @click="close">
                    <uni-icons type="closeempty" size="20" :color="closeIconColor"></uni-icons>
                </view>
            </view>

            <!-- 4列分享网格 -->
            <view class="share-grid">
                <!-- 1. 微信好友 (weixin) -->
                <!-- #ifdef MP-WEIXIN -->
                <button class="share-item share-button-reset" open-type="share">
                    <view class="icon-wrap icon-weixin">
                        <uni-icons type="weixin" size="32" color="#ffffff"></uni-icons>
                    </view>
                    <text class="item-label">{{ t('shareSheet.weixinFriend') }}</text>
                </button>
                <!-- #endif -->

                <!-- #ifndef MP-WEIXIN -->
                <view class="share-item" @click="shareToWechat('WXSceneSession')">
                    <view class="icon-wrap icon-weixin">
                        <uni-icons type="weixin" size="32" color="#ffffff"></uni-icons>
                    </view>
                    <text class="item-label">{{ t('shareSheet.weixinFriend') }}</text>
                </view>
                <!-- #endif -->

                <!-- 2. 微信朋友圈 (pyq) -->
                <view class="share-item" @click="shareToWechat('WXSenceTimeline')">
                    <view class="icon-wrap icon-pyq">
                        <uni-icons type="pyq" size="32" color="#ffffff"></uni-icons>
                    </view>
                    <text class="item-label">{{ t('shareSheet.weixinTimeline') }}</text>
                </view>

                <!-- 3. 新浪微博 (weibo) -->
                <!-- #ifndef MP-WEIXIN -->
                <view class="share-item" @click="shareToWeibo">
                    <view class="icon-wrap icon-weibo">
                        <uni-icons type="weibo" size="32" color="#ffffff"></uni-icons>
                    </view>
                    <text class="item-label">{{ t('shareSheet.weibo') }}</text>
                </view>
                <!-- #endif -->

                <!-- 4. QQ好友 (qq) -->
                <!-- #ifndef MP-WEIXIN -->
                <view class="share-item" @click="shareToQQ">
                    <view class="icon-wrap icon-qq">
                        <uni-icons type="qq" size="32" color="#ffffff"></uni-icons>
                    </view>
                    <text class="item-label">{{ t('shareSheet.qq') }}</text>
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
const popup = ref(null);

const closeIconColor = computed(() => (settingsStore.isDark ? '#9ca3af' : '#6b7280'));

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
        scene: scene, // WXSceneSession | WXSenceTimeline
        type: 0, // 图文卡片
        href: props.shareUrl || 'https://egowallpaper.space',
        title: props.shareTitle || t('common.appName'),
        summary: props.shareSummary || t('about.introText'),
        imageUrl: props.shareImage || '/static/images/logo.png',
        success: (res) => {
            uni.showToast({
                title: t('shareSheet.shareSuccess') || '分享成功',
                icon: 'none',
            });
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

.share-button-reset {
    padding: 0;
    margin: 0;
    background: transparent;
    line-height: normal;
    border: none;
    outline: none;

    &::after {
        border: none;
    }
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
    }

    .item-label {
        font-size: 24rpx;
        font-weight: 500;
        text-align: center;
    }
}
</style>
