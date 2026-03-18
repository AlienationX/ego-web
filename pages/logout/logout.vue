<template>
    <view class="layout">
        <view class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>

        <template v-if="!loggedOut">
            <view class="header">
                <view class="back-btn" @click="goBack">
                    <uni-icons type="back" size="18" color="#374151"></uni-icons>
                </view>
                <text class="header-title">{{ t('logoutPage.title') }}</text>
                <view class="header-placeholder"></view>
            </view>

            <view class="center-content">
                <view class="panel">
                    <view class="logout-icon-wrap">
                        <uni-icons type="redo" size="32" color="#E5322D"></uni-icons>
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
                            <uni-icons type="redo" size="16" color="#fff"></uni-icons>
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
const profileAvatar = computed(
    () =>
        userStore.userinfo?.profile?.avatar ||
        'https://images.unsplash.com/photo-1655249493799-9cee4fe983bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200'
);

const onConfirm = () => {
    userStore.clearUserData();
    loggedOut.value = true;
};

const goBack = () => {
    uni.navigateBack({
        fail: () => {
            uni.reLaunch({ url: '/pages/test/settings1' });
        },
    });
};

const backToSettings = () => {
    uni.reLaunch({ url: '/pages/test/settings1' });
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
    height: 56px;
    background: #f5f6f8;
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 8px;
}

.back-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #fff;
    border: 1px solid #f0f1f3;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-title {
    flex: 1;
    text-align: center;
    font-size: 18px;
    font-weight: 700;
    color: #111827;
}

.header-placeholder {
    width: 36px;
    height: 36px;
}

.center-content {
    // flex: 1;
    // display: flex;
    // flex-direction: column;
    // align-items: center;
    // justify-content: center;
    padding: 24px;
    padding-top: 120rpx;
}

.panel {
    width: 100%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.logout-icon-wrap {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #fef2f2;
    border: 2px solid #fecaca;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
}

.main-title {
    font-size: 22px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 10px;
    text-align: center;
}

.desc {
    font-size: 14px;
    color: #6b7280;
    line-height: 22px;
    text-align: center;
    margin-bottom: 32px;
}

.account-card {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #f0f1f3;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 32px;
}

.avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
}

.account-meta .name {
    display: block;
    font-size: 15px;
    font-weight: 600;
    color: #111827;
}

.account-meta .email {
    display: block;
    font-size: 12px;
    color: #9ca3af;
}

.btn-group {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.confirm-btn {
    width: 100%;
    height: 50px;
    border-radius: 12px;
    background: #e5322d;
    border: none;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.cancel-btn {
    width: 100%;
    height: 50px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid #e5e7eb;
    color: #374151;
    font-size: 15px;
    font-weight: 600;
}

.success-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
}

.success-emoji {
    font-size: 52px;
    margin-bottom: 20px;
}

.success-title {
    font-size: 22px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 10px;
}

.success-desc {
    font-size: 14px;
    color: #6b7280;
    line-height: 22px;
    text-align: center;
    margin-bottom: 36px;
}

.back-settings-btn {
    width: 100%;
    height: 50px;
    border-radius: 12px;
    background: #e5322d;
    border: none;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
}
</style>
