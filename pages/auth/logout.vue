<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <view class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>

        <template v-if="!loggedOut">
            <view class="header">
                <view class="back-btn" @click="goBack">
                    <mdi-icon path="/static/icons/arrow-left.svg" size="20px" :color="backIconColor"></mdi-icon>
                </view>
                <text class="header-title">{{ t('logoutPage.title') }}</text>
                <view class="header-placeholder"></view>
            </view>

            <view class="center-content">
                <view class="panel">
                    <view class="logout-icon-wrap">
                        <mdi-icon path="/static/icons/exit-to-app.svg" size="40px" color="#E5322D"></mdi-icon>
                    </view>

                    <text class="main-title">{{ t('logoutPage.askTitle') }}</text>
                    <text class="desc">{{ t('logoutPage.askDesc') }}</text>

                    <view class="account-card">
                        <image class="avatar" :src="profileAvatar" mode="aspectFill"></image>
                        <view class="account-meta">
                            <text class="name">{{ profileName }}</text>
                            <text class="email">{{ profileEmail }}</text>
                        </view>
                    </view>

                    <view class="btn-group">
                        <button
                            class="confirm-btn"
                            :class="{ 'is-loading': isSubmitting, 'is-success': isSuccess }"
                            :disabled="isSubmitting || isSuccess"
                            @click="onConfirm"
                        >
                            <view v-if="isSubmitting" class="btn-spinner"></view>
                            <view v-else-if="isSuccess" class="success-icon-wrap">
                                <mdi-icon path="/static/icons/check.svg" size="20px" color="#fff"></mdi-icon>
                            </view>
                            <mdi-icon v-else path="/static/icons/exit-to-app.svg" size="20px" color="#fff"></mdi-icon>
                            <text>{{ isSuccess ? t('logoutPage.doneTitle') : (isSubmitting ? (t('logoutPage.loggingOut') || t('common.processing') || '退出中...') : t('logoutPage.confirm')) }}</text>
                        </button>
                        <button class="cancel-btn" :disabled="isSubmitting || isSuccess" @click="goBack">{{ t('logoutPage.cancel') }}</button>
                    </view>
                </view>
            </view>
        </template>

        <template v-else>
            <view class="success-content">
                <!-- <text class="success-emoji">👋</text> -->
                <image class="success-emoji" src="/static/images/successful.svg" mode="aspectFit"></image>
                <text class="success-title">{{ t('logoutPage.doneTitle') }}</text>
                <text class="success-desc">{{ tp('logoutPage.doneDesc', { name: profileShortName }) }}</text>
                <button class="back-user-btn" @click="backToUser">{{ t('logoutPage.backUser') }}</button>
            </view>
        </template>
    </view>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTranslateParams } from '@/utils/i18n.js';
import { useUserStore } from '@/stores/user.js';
import { getStatusBarHeight } from '@/utils/layout.js';
import { useSettingsStore } from '@/stores/settings.js';

const { t } = useI18n();
const { tp } = useTranslateParams();
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const backIconColor = computed(() => (settingsStore.isDark ? '#e5e7eb' : '#374151'));
const statusBarHeight = ref(getStatusBarHeight() || 0);
const loggedOut = ref(false);
const isSubmitting = ref(false);
const isSuccess = ref(false);

onMounted(() => {
    const sb = getStatusBarHeight();
    if (sb > 0) {
        statusBarHeight.value = sb;
    }
});

const profileName = computed(() => userStore.userinfo?.profile?.nickname || userStore.userinfo?.nickname || 'User');
const profileShortName = computed(() => String(profileName.value || '').split(' ')[0] || 'User');
const profileEmail = computed(() => userStore.userinfo?.email || 'user@example.com');
const profileAvatar = computed(() => userStore.userinfo?.profile?.avatar);

const onConfirm = async () => {
    if (isSubmitting.value || isSuccess.value) return;
    isSubmitting.value = true;

    // 体验流畅过渡：400ms loading 动效
    await new Promise((resolve) => setTimeout(resolve, 400));

    // 清理用户信息与授权
    userStore.clearUserData();

    isSubmitting.value = false;
    isSuccess.value = true;

    // #ifdef APP-PLUS || MP-WEIXIN
    try {
        uni.vibrateShort({ type: 'light' });
    } catch (e) {}
    // #endif

    // 450ms 优雅淡入成功页
    setTimeout(() => {
        loggedOut.value = true;
    }, 450);
};

const goBack = () => {
    uni.navigateBack({
        fail: () => {
            uni.reLaunch({ url: '/pages/settings/settings' });
        },
    });
};

const backToUser = () => {
    uni.reLaunch({ url: '/pages/user/user' });
};
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: var(--page-background);
    display: flex;
    flex-direction: column;
}

.status-holder {
    width: 100%;
}

.header {
    height: 112rpx;
    background: transparent;
    display: flex;
    align-items: center;
    padding: 0 30rpx;
    gap: 16rpx;
}

.back-btn {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:active {
        opacity: 0.7;
    }
}

.header-title {
    flex: 1;
    text-align: center;
    font-size: 36rpx;
    font-weight: 700;
    color: var(--text-primary);
}

.header-placeholder {
    width: 60rpx;
    height: 60rpx;
}

.center-content {
    padding: 48rpx 30rpx;
    padding-top: 100rpx;
}

.panel {
    width: 100%;
    max-width: 840rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.logout-icon-wrap {
    width: 150rpx;
    height: 150rpx;
    border-radius: 50%;
    background: rgba(229, 50, 45, 0.08);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 44rpx;
    animation: popIcon 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes popIcon {
    0% {
        opacity: 0;
        transform: scale(0.4);
    }
    70% {
        opacity: 1;
        transform: scale(1.12);
    }
    100% {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(28rpx);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.main-title {
    font-size: 44rpx;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 20rpx;
    text-align: center;
}

.desc {
    font-size: 28rpx;
    color: var(--text-secondary);
    line-height: 44rpx;
    text-align: center;
    margin-bottom: 56rpx;
}

.account-card {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    background: var(--page-background-secondary);
    border-radius: 28rpx;
    border: none;
    box-shadow: none;
    padding: 28rpx 32rpx;
    display: flex;
    align-items: center;
    gap: 24rpx;
    margin-bottom: 56rpx;
}

.avatar {
    width: 88rpx;
    height: 88rpx;
    border-radius: 50%;
}

.account-meta .name {
    display: block;
    font-size: 30rpx;
    font-weight: 600;
    color: var(--text-primary);
}

.account-meta .email {
    display: block;
    font-size: 24rpx;
    color: var(--text-tertiary);
}

.btn-group {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.confirm-btn {
    width: 100%;
    height: 100rpx;
    border-radius: 24rpx;
    background: #e5322d;
    border: none;
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    box-shadow: none;
    transition: transform 0.25s ease, background-color 0.3s ease, opacity 0.2s ease;

    &:active:not(:disabled) {
        opacity: 0.88;
        transform: scale(0.97);
    }

    &.is-loading {
        opacity: 0.85;
        transform: scale(0.98);
        cursor: not-allowed;
    }

    &.is-success {
        background: #ef4444;
        animation: saveSuccessPulse 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.2);
    }

    .btn-spinner {
        width: 32rpx;
        height: 32rpx;
        border: 4rpx solid rgba(255, 255, 255, 0.35);
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: btnSpin 0.7s linear infinite;
    }

    .success-icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        animation: successBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    &::after {
        border: none;
    }
}

.cancel-btn {
    width: 100%;
    height: 100rpx;
    border-radius: 24rpx;
    background: var(--page-background-secondary);
    border: none;
    box-shadow: none;
    color: var(--text-primary);
    font-size: 30rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s ease;

    &:active {
        opacity: 0.88;
        transform: scale(0.97);
    }

    &::after {
        border: none;
    }
}

.success-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64rpx 30rpx;
    animation: fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.success-emoji {
    width: 280rpx;
    height: 280rpx;
    margin-bottom: 50rpx;
    animation: popIcon 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.success-title {
    font-size: 44rpx;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 20rpx;
    animation: fadeSlideUp 0.45s 0.1s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.success-desc {
    font-size: 28rpx;
    color: var(--text-secondary);
    line-height: 44rpx;
    text-align: center;
    margin-bottom: 72rpx;
    animation: fadeSlideUp 0.45s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.back-user-btn {
    width: 100%;
    height: 100rpx;
    border-radius: 24rpx;
    background: #e5322d;
    border: none;
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: none;
    transition: all 0.25s ease;
    animation: fadeSlideUp 0.45s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;

    &:active {
        opacity: 0.88;
        transform: scale(0.97);
    }

    &::after {
        border: none;
    }
}

@keyframes btnSpin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

@keyframes successBounce {
    0% {
        transform: scale(0);
        opacity: 0;
    }
    60% {
        transform: scale(1.3);
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes saveSuccessPulse {
    0% {
        transform: scale(0.95);
    }
    50% {
        transform: scale(1.02);
    }
    100% {
        transform: scale(1);
    }
}

@keyframes fadeSlideUp {
    from {
        opacity: 0;
        transform: translateY(20rpx);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

// ── 暗色模式覆盖 ──
.theme-dark {
    .logout-icon-wrap {
        background: rgba(229, 50, 45, 0.12);
        border: none;
    }

    .account-card {
        background: #1e1e22;
        border: none;
        box-shadow: none;
    }

    .cancel-btn {
        background: #1e1e22;
        border: none;
        box-shadow: none;

        &:active {
            background: rgba(255, 255, 255, 0.05);
        }
    }
}
</style>
