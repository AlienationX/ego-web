<template>
    <!-- #ifdef APP-PLUS -->
    <view v-if="visible" class="wallpaper-sheet-overlay" :class="themeClass" @click.self="handleCancel">
        <view class="wallpaper-sheet" :class="[themeClass, { 'wallpaper-sheet--visible': sheetVisible }]">
            <view class="wallpaper-sheet__handle-wrap">
                <view class="wallpaper-sheet__handle" />
            </view>
            <view class="wallpaper-sheet__header">
                <view class="wallpaper-sheet__header-content">
                    <text class="wallpaper-sheet__title">{{ t('wallpaper.sheetTitle') }}</text>
                    <text class="wallpaper-sheet__subtitle">{{ t('wallpaper.sheetSubtitle') }}</text>
                </view>
                <view class="wallpaper-sheet__close-btn" @click="handleCancel">
                    <uni-icons type="clear" size="32" :color="settingsStore.isDark ? '#a1a1aa' : '#888888'" />
                </view>
            </view>
            <view class="wallpaper-sheet__options">
                <view class="wallpaper-sheet__option" @click="handleSelect(0)">
                    <view class="wallpaper-sheet__option-icon wallpaper-sheet__option-icon--home">
                        <mdi-icon path="/static/icons/cellphone.svg" size="26px" color="#ffffff" />
                    </view>
                    <view class="wallpaper-sheet__option-info">
                        <text class="wallpaper-sheet__option-title">{{ t('wallpaper.setSystem') }}</text>
                        <text class="wallpaper-sheet__option-desc">{{ t('wallpaper.setSystemDesc') }}</text>
                    </view>
                    <view class="wallpaper-sheet__vip-badge">
                        <text class="wallpaper-sheet__vip-text">VIP</text>
                    </view>
                </view>
                <view class="wallpaper-sheet__divider" />
                <view class="wallpaper-sheet__option" @click="handleSelect(1)">
                    <view class="wallpaper-sheet__option-icon wallpaper-sheet__option-icon--lock">
                        <mdi-icon path="/static/icons/lock.svg" size="22px" color="#ffffff" />
                    </view>
                    <view class="wallpaper-sheet__option-info">
                        <text class="wallpaper-sheet__option-title">{{ t('wallpaper.setLock') }}</text>
                        <text class="wallpaper-sheet__option-desc">{{ t('wallpaper.setLockDesc') }}</text>
                    </view>
                    <view class="wallpaper-sheet__vip-badge">
                        <text class="wallpaper-sheet__vip-text">VIP</text>
                    </view>
                </view>
                <view class="wallpaper-sheet__divider" />
                <view class="wallpaper-sheet__option" @click="handleSelect(2)">
                    <view class="wallpaper-sheet__option-icon wallpaper-sheet__option-icon--both">
                        <mdi-icon path="/static/icons/layers-triple.svg" size="22px" color="#ffffff" />
                    </view>
                    <view class="wallpaper-sheet__option-info">
                        <text class="wallpaper-sheet__option-title">{{ t('wallpaper.setBoth') }}</text>
                        <text class="wallpaper-sheet__option-desc">{{ t('wallpaper.setBothDesc') }}</text>
                    </view>
                    <view class="wallpaper-sheet__vip-badge">
                        <text class="wallpaper-sheet__vip-text">VIP</text>
                    </view>
                </view>
                <view class="wallpaper-sheet__divider" />
                <view class="wallpaper-sheet__option" @click="handleSelect(3)">
                    <view class="wallpaper-sheet__option-icon wallpaper-sheet__option-icon--save">
                        <mdi-icon path="/static/icons/download.svg" size="22px" color="#ffffff" />
                    </view>
                    <view class="wallpaper-sheet__option-info">
                        <text class="wallpaper-sheet__option-title">{{ t('wallpaper.saveOnly') }}</text>
                        <text class="wallpaper-sheet__option-desc">{{ t('wallpaper.saveOnlyDesc') }}</text>
                    </view>
                    <view class="wallpaper-sheet__free-badge">
                        <text class="wallpaper-sheet__free-text">{{ t('common.free') }}</text>
                    </view>
                </view>
            </view>
        </view>
    </view>
    <!-- #endif -->
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserStore } from '@/stores/user.js';
import { setAndroidWallpaper } from '@/common/core.js';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const userStore = useUserStore();

const visible = ref(false);
const sheetVisible = ref(false);
const picUrl = ref('');
const currentItem = ref(null);

const themeClass = computed(() => settingsStore.isDark ? 'theme-dark' : 'theme-light');

const open = (url, item = null) => {
    picUrl.value = url;
    currentItem.value = item;
    visible.value = true;
    setTimeout(() => { sheetVisible.value = true; }, 20);
};

const close = () => {
    sheetVisible.value = false;
    setTimeout(() => { visible.value = false; picUrl.value = ''; currentItem.value = null; }, 280);
};

const handleCancel = () => close();

const handleSelect = (tapIndex) => {
    const targetUrl = picUrl.value;

    // 选项 4（仅保存到相册）：触发与 preview.vue 相同的 clickDownload 校验与广告流程
    if (tapIndex === 3) {
        close();
        uni.$emit('triggerClickDownload');
        return;
    }

    // 选项 1/2/3（设置桌面/锁屏/全局）- VIP 专属功能
    const targetMap = ['system', 'lock', 'both'];
    const wallpaperTarget = targetMap[tapIndex];

    const executeSetWallpaper = () => {
        close();
        uni.showLoading({ title: t('wallpaper.applying') || '设置中...', mask: true });

        uni.downloadFile({
            url: targetUrl,
            success: (dlRes) => {
                console.log("[WallpaperSheet] download success:", dlRes);
                if (dlRes.statusCode === 200) {
                    // #ifdef APP-PLUS
                    const localPath = plus.io.convertLocalFileSystemURL(dlRes.tempFilePath);
                    setAndroidWallpaper(localPath, wallpaperTarget)
                        .then(() => {
                            uni.hideLoading();
                            uni.showToast({ title: t('wallpaper.setSuccess') || '壁纸设置成功', icon: 'none' });
                        })
                        .catch((err) => {
                            uni.hideLoading();
                            console.error('[WallpaperSheet] set error:', err.message || err);
                            uni.showToast({ title: t('wallpaper.setFailed') || '设置失败，请重试', icon: 'none' });
                        });
                    // #endif
                } else {
                    uni.hideLoading();
                    uni.showToast({ title: t('common.downloadFailed') || '下载失败', icon: 'none' });
                }
            },
            fail: () => {
                uni.hideLoading();
                uni.showToast({ title: t('common.networkError') || '网络异常', icon: 'none' });
            },
        });
    };

    if (userStore.isVip) {
        executeSetWallpaper();
    } else {
        close();
        uni.showModal({
            title: t('wallpaper.vipRequiredTitle') || 'VIP 专属功能',
            content: t('wallpaper.vipRequiredHint') || '一键设置手机桌面与锁屏壁纸为 VIP 专属功能，开通会员后可无限次享用。',
            confirmText: t('membership.openVipNow') || '立即开通 VIP',
            cancelText: t('common.cancel') || '取消',
            success: (res) => {
                if (res.confirm) {
                    uni.navigateTo({ url: '/pages/member/payment' });
                }
            },
        });
    }
};

onMounted(() => { uni.$on('showWallpaperSheet', ({ picUrl: url, itemInfo }) => open(url, itemInfo)); });
onUnmounted(() => { uni.$off('showWallpaperSheet'); });
defineExpose({ open, close });
</script>

<style lang="scss" scoped>
.wallpaper-sheet-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}

.wallpaper-sheet {
    border-radius: 28rpx 28rpx 0 0;
    padding-bottom: env(safe-area-inset-bottom, 34rpx);
    transform: translateY(100%);
    transition: transform 0.28s cubic-bezier(0.25, 0.8, 0.25, 1);
    will-change: transform;

    &--visible {
        transform: translateY(0);
    }

    &.theme-light {
        background: #ffffff;

        .wallpaper-sheet__title {
            color: #111827;
        }

        .wallpaper-sheet__subtitle {
            color: #6b7280;
        }

        .wallpaper-sheet__option-title {
            color: #111827;
        }

        .wallpaper-sheet__option-desc {
            color: #9ca3af;
        }

        .wallpaper-sheet__divider {
            background: rgba(0, 0, 0, 0.06);
        }

        .wallpaper-sheet__handle {
            background: #d1d5db;
        }

        .wallpaper-sheet__cancel {
            background: #f3f4f6;
        }

        .wallpaper-sheet__cancel-text {
            color: #374151;
        }
    }

    &.theme-dark {
        background: #1c1c1e;

        .wallpaper-sheet__title {
            color: #f9fafb;
        }

        .wallpaper-sheet__subtitle {
            color: #9ca3af;
        }

        .wallpaper-sheet__option-title {
            color: #f9fafb;
        }

        .wallpaper-sheet__option-desc {
            color: #6b7280;
        }

        .wallpaper-sheet__divider {
            background: rgba(255, 255, 255, 0.07);
        }

        .wallpaper-sheet__handle {
            background: #4b5563;
        }

        .wallpaper-sheet__cancel {
            background: #2c2c2e;
        }

        .wallpaper-sheet__cancel-text {
            color: #e5e7eb;
        }
    }
}

.wallpaper-sheet__handle-wrap {
    display: flex;
    justify-content: center;
    padding: 16rpx 0 8rpx;
}

.wallpaper-sheet__handle {
    width: 72rpx;
    height: 8rpx;
    border-radius: 100rpx;
}

.wallpaper-sheet__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 36rpx 28rpx 44rpx;
}

.wallpaper-sheet__header-content {
    display: flex;
    flex-direction: column;
}

.wallpaper-sheet__close-btn {
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

.wallpaper-sheet__title {
    font-size: 36rpx;
    font-weight: 700;
    letter-spacing: -0.3rpx;
    display: block;
    margin-bottom: 6rpx;
}

.wallpaper-sheet__subtitle {
    font-size: 26rpx;
    display: block;
}

.wallpaper-sheet__options {
    margin: 0 24rpx;
    border-radius: 20rpx;
    overflow: hidden;
}

.wallpaper-sheet__option {
    display: flex;
    align-items: center;
    padding: 28rpx 24rpx;
    gap: 24rpx;

    &:active {
        opacity: 0.6;
    }
}

.wallpaper-sheet__option-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--home {
        background: linear-gradient(145deg, #6366f1, #8b5cf6);
    }

    &--lock {
        background: linear-gradient(145deg, #ec4899, #f43f5e);
    }

    &--both {
        background: linear-gradient(145deg, #f59e0b, #ef4444);
    }

    &--save {
        background: linear-gradient(145deg, #10b981, #0ea5e9);
    }
}

.wallpaper-sheet__option-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
}

.wallpaper-sheet__option-title {
    font-size: 32rpx;
    font-weight: 600;
}

.wallpaper-sheet__option-desc {
    font-size: 24rpx;
}

.wallpaper-sheet__divider {
    height: 1rpx;
    margin: 0 24rpx;
}

.wallpaper-sheet__vip-badge {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    border-radius: 10rpx;
    padding: 6rpx 14rpx;
    flex-shrink: 0;
}

.wallpaper-sheet__vip-text {
    font-size: 20rpx;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 1rpx;
}

.wallpaper-sheet__free-badge {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border-radius: 10rpx;
    padding: 6rpx 14rpx;
    flex-shrink: 0;
}

.wallpaper-sheet__free-text {
    font-size: 20rpx;
    font-weight: 700;
    color: #ffffff;
}
</style>
