<template>
    <view class="layout">
        <view class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>

        <template v-if="!loggedOut">
            <view class="header">
                <view class="back-btn" @click="goBack">
                    <mdi-icon path="/static/icons/arrow-left.svg" size="18px" color="#374151"></mdi-icon>
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
                        <button class="confirm-btn" @click="onConfirm">
                            <mdi-icon path="/static/icons/exit-to-app.svg" size="20px" color="#fff"></mdi-icon>
                            <text>{{ t('logoutPage.confirm') }}</text>
                        </button>
                        <button class="cancel-btn" @click="goBack">{{ t('logoutPage.cancel') }}</button>
                    </view>
                </view>
            </view>
        </template>

        <template v-else>
            <view class="success-content">
                <text class="success-emoji">👋</text>
                <text class="success-title">{{ t('logoutPage.doneTitle') }}</text>
                <text class="success-desc">{{ t('logoutPage.doneDesc', { name: profileShortName }) }}</text>
                <button class="back-settings-btn" @click="backToSettings">{{ t('logoutPage.backSettings') }}</button>
            </view>
        </template>
    </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user.js';
import { getStatusBarHeight } from '@/utils/system.js';

const { t } = useI18n();
const userStore = useUserStore();
const statusBarHeight = ref(getStatusBarHeight() || 0);
const loggedOut = ref(false);

const profileName = computed(() => userStore.userinfo?.profile?.nickname || userStore.userinfo?.nickname || 'User');
const profileShortName = computed(() => String(profileName.value || '').split(' ')[0] || 'User');
const profileEmail = computed(() => userStore.userinfo?.email || 'user@example.com');
const profileAvatar = computed(() => userStore.userinfo?.profile?.avatar);

const onConfirm = () => {
    userStore.clearUserData();
    loggedOut.value = true;
};

const goBack = () => {
    uni.navigateBack({
        fail: () => {
            uni.reLaunch({ url: '/pages/settings/settings' });
        },
    });
};

const backToSettings = () => {
    uni.reLaunch({ url: '/pages/settings/settings' });
};
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: #f5f6f8;
    display: flex;
    flex-direction: column;
}

.status-holder {
    width: 100%;
}

.header {
    height: 112rpx;
    background: #f5f6f8;
    display: flex;
    align-items: center;
    padding: 0 32rpx;
    gap: 16rpx;
}

.back-btn {
    width: 72rpx;
    height: 72rpx;
    border-radius: 16rpx;
    background: #fff;
    border: 1px solid #f0f1f3;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-title {
    flex: 1;
    text-align: center;
    font-size: 36rpx;
    font-weight: 700;
    color: #111827;
}

.header-placeholder {
    width: 72rpx;
    height: 72rpx;
}

.center-content {
    padding: 48rpx;
    padding-top: 120rpx;
}

.panel {
    width: 100%;
    max-width: 840rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.logout-icon-wrap {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background: #fef2f2;
    border: 4rpx solid #fecaca;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 48rpx;
}

.main-title {
    font-size: 44rpx;
    font-weight: 700;
    color: #111827;
    margin-bottom: 20rpx;
    text-align: center;
}

.desc {
    font-size: 28rpx;
    color: #6b7280;
    line-height: 44rpx;
    text-align: center;
    margin-bottom: 64rpx;
}

.account-card {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    background: #fff;
    border-radius: 24rpx;
    border: 1px solid #f0f1f3;
    padding: 28rpx 32rpx;
    display: flex;
    align-items: center;
    gap: 24rpx;
    margin-bottom: 64rpx;
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
    color: #111827;
}

.account-meta .email {
    display: block;
    font-size: 24rpx;
    color: #9ca3af;
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
}

.cancel-btn {
    width: 100%;
    height: 100rpx;
    border-radius: 24rpx;
    background: #fff;
    border: 2rpx solid #e5e7eb;
    color: #374151;
    font-size: 30rpx;
    font-weight: 600;
}

.success-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64rpx;
}

.success-emoji {
    font-size: 104rpx;
    margin-bottom: 40rpx;
}

.success-title {
    font-size: 44rpx;
    font-weight: 700;
    color: #111827;
    margin-bottom: 20rpx;
}

.success-desc {
    font-size: 28rpx;
    color: #6b7280;
    line-height: 44rpx;
    text-align: center;
    margin-bottom: 72rpx;
}

.back-settings-btn {
    width: 100%;
    height: 100rpx;
    border-radius: 24rpx;
    background: #e5322d;
    border: none;
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
}
</style>
