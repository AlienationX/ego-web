<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <view class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>
        <view class="header">
            <view class="back-btn" @click="goBack">
                <mdi-icon path="/static/icons/arrow-left.svg" size="20px"
                    :color="settingsStore.isDark ? '#e5e7eb' : '#1e293b'"></mdi-icon>
            </view>
            <text class="header-title">{{ t('editProfile.title') }}</text>
            <view class="header-placeholder"></view>
        </view>

        <view class="content">
            <!-- 头像编辑区 -->
            <view class="avatar-area">
                <view class="avatar-wrap" @click="chooseAvatar">
                    <image class="avatar" :src="form.avatar" mode="aspectFill"></image>
                    <view class="camera-btn">
                        <mdi-icon path="/static/icons/camera.svg" size="14px" color="#ffffff"></mdi-icon>
                    </view>
                </view>
                <text class="avatar-tip" @click="chooseAvatar">{{ t('editProfile.changePhoto') }}</text>
            </view>

            <!-- 基本信息卡片（原生简洁列表式） -->
            <view class="section-title">{{ t('editProfile.personalInfo') }}</view>
            <view class="card">
                <!-- 昵称 -->
                <view class="field-row">
                    <text class="row-label">{{ t('editProfile.fullName') }}</text>
                    <input
                        v-model="form.nickname"
                        class="row-input"
                        :placeholder="t('editProfile.placeholders.fullName')"
                        placeholder-class="placeholder-style"
                    />
                </view>

                <!-- 邮箱（只读） -->
                <view class="field-row">
                    <text class="row-label">{{ t('editProfile.email') }}</text>
                    <view class="row-right">
                        <text class="row-value muted">{{ form.email }}</text>
                        <mdi-icon path="/static/icons/lock.svg" size="14px" :color="iconMutedColor" class="right-icon"></mdi-icon>
                    </view>
                </view>

                <!-- 手机号 -->
                <view class="field-row">
                    <text class="row-label">{{ t('editProfile.phone') }}</text>
                    <input
                        v-model="form.phone_number"
                        type="number"
                        class="row-input"
                        :placeholder="t('editProfile.placeholders.phone')"
                        placeholder-class="placeholder-style"
                    />
                </view>

                <!-- 性别 -->
                <picker :range="genderRange" :value="form.gender" @change="onGenderChange" class="picker-row-wrap">
                    <view class="field-row picker-row">
                        <text class="row-label">{{ t('editProfile.gender') }}</text>
                        <view class="row-right">
                            <text class="row-value">{{ genderRange[form.gender] || t('editProfile.genders.secret') }}</text>
                            <mdi-icon path="/static/icons/chevron-right.svg" size="16px" :color="iconMutedColor" class="right-icon"></mdi-icon>
                        </view>
                    </view>
                </picker>

                <!-- 生日 -->
                <picker mode="date" :value="form.birthday" @change="onBirthdayChange" class="picker-row-wrap">
                    <view class="field-row picker-row field-row-last">
                        <text class="row-label">{{ t('editProfile.birthday') }}</text>
                        <view class="row-right">
                            <text class="row-value" :class="{ placeholder: !form.birthday }">
                                {{ form.birthday || t('editProfile.placeholders.birthday') }}
                            </text>
                            <mdi-icon path="/static/icons/chevron-right.svg" size="16px" :color="iconMutedColor" class="right-icon"></mdi-icon>
                        </view>
                    </view>
                </picker>
            </view>

            <!-- 更多详情卡片 -->
            <view class="section-title">{{ t('editProfile.details') }}</view>
            <view class="card">
                <!-- 地区（仅管理员可见） -->
                <view class="field-row" v-if="settingsStore.isAdmin">
                    <text class="row-label">{{ t('editProfile.region') }}</text>
                    <input
                        v-model="form.region"
                        class="row-input"
                        :placeholder="t('editProfile.placeholders.region')"
                        placeholder-class="placeholder-style"
                    />
                </view>

                <!-- 个人签名/简介 -->
                <view class="field-row field-row-last">
                    <text class="row-label">{{ t('editProfile.description') }}</text>
                    <input
                        v-model="form.description"
                        class="row-input"
                        :placeholder="t('editProfile.placeholders.description')"
                        placeholder-class="placeholder-style"
                    />
                </view>
            </view>

            <button
                class="save-btn"
                :class="{ 'is-loading': isSaving, 'is-success': isSaved }"
                :disabled="isSaving || isSaved"
                @click="handleSave"
            >
                <view v-if="isSaving" class="btn-spinner"></view>
                <view v-else-if="isSaved" class="success-icon-wrap">
                    <mdi-icon path="/static/icons/check.svg" size="20px" color="#ffffff"></mdi-icon>
                </view>
                <text class="btn-text">
                    {{ isSaved ? t('editProfile.profileSaved') : (isSaving ? (t('common.saving') || '保存中...') : t('editProfile.saveChanges')) }}
                </text>
            </button>
        </view>
    </view>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user.js';
import { apiPostProfile, apiUploadProfile } from '@/api/wallpaper.js';
import { getStatusBarHeight } from '@/utils/layout.js';
import { useSettingsStore } from '@/stores/settings.js';
import { validateTextSecurity, validateImageSecurity } from '@/utils/security.js';
// #ifdef APP-PLUS
import { chooseSystemMedia } from '@/uni_modules/uni-chooseSystemImage';
// #endif

const userStore = useUserStore();
const { t } = useI18n();
const settingsStore = useSettingsStore();
const backIconColor = computed(() => (settingsStore.isDark ? '#e5e7eb' : '#374151'));
const iconMutedColor = computed(() => (settingsStore.isDark ? '#94a3b8' : '#9ca3af'));
const statusBarHeight = ref(getStatusBarHeight() || 0);
const isSaving = ref(false);
const isSaved = ref(false);

onMounted(() => {
    const sb = getStatusBarHeight();
    if (sb > 0) {
        statusBarHeight.value = sb;
    }
});

const form = reactive({
    avatar: userStore.userinfo?.profile?.avatar || '/static/images/pics/default_avatar.svg',
    nickname: userStore.userinfo?.profile?.nickname || userStore.userinfo?.nickname || '',
    email: userStore.userinfo?.email || '',
    phone_number: userStore.userinfo?.profile?.phone_number || '',
    region: userStore.userinfo?.profile?.region || '',
    description: userStore.userinfo?.profile?.description || '',
    gender: userStore.userinfo?.profile?.gender ?? 0,
    birthday: userStore.userinfo?.profile?.birthday || '',
});

const genderRange = computed(() => [
    t('editProfile.genders.secret'),
    t('editProfile.genders.male'),
    t('editProfile.genders.female')
]);

const onGenderChange = (e) => {
    form.gender = parseInt(e.detail.value, 10);
};

const onBirthdayChange = (e) => {
    form.birthday = e.detail.value;
};

const showPermissionModal = () => {
    uni.showModal({
        title: t('editProfile.permissionTitle') || '需要访问相册',
        content: t('editProfile.permissionContent') || '为了更换头像，需要访问您的相册权限。请在设置中开启相册权限。',
        confirmText: t('editProfile.goToSettings') || '去设置',
        cancelText: t('common.cancel') || '取消',
        success: (res) => {
            if (res.confirm) {
                // #ifdef APP
                if (typeof plus !== 'undefined' && plus.runtime) {
                    plus.runtime.openURL('app-settings:');
                } else {
                    uni.openSetting();
                }
                // #endif
                // #ifndef APP
                uni.openAppAuthorizeSetting({
                    fail: () => {
                        uni.openSetting();
                    },
                });
                // #endif
            }
        },
    });
};

const chooseAvatar = () => {
    // #ifdef APP-PLUS
    const channel = plus.runtime.channel;
    if (channel === 'google') {
        chooseSystemMedia({
            count: 1,
            mediaType: ['image'],
            success: (res) => {
                const file = res.filePaths?.[0];
                if (!file) return;
                form.avatar = file;
            },
            fail: (err) => {
                if (err?.errCode === 2101001) return;
                if (err?.errCode === 2101005 || /permission|权限|denied|拒绝/i.test(err?.errMsg || '')) {
                    showPermissionModal();
                } else {
                    uni.showToast({ title: t('editProfile.imageSelectFailed') || '选择图片失败', icon: 'none' });
                }
            },
        });
        return;
    }
    // #endif

    uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
            const file = res.tempFilePaths?.[0];
            if (!file) return;
            // #ifdef MP-WEIXIN
            const isSafe = await validateImageSecurity(file);
            if (!isSafe) return;
            // #endif
            form.avatar = file;
        },
        fail: (err) => {
            if (err?.errMsg && (err.errMsg.toLowerCase().includes('permission') || err.errMsg.includes('权限') || err.errMsg.includes('denied'))) {
                showPermissionModal();
            } else if (err?.errMsg && err.errMsg.includes('cancel')) {
                // 用户取消，忽略
            } else {
                uni.showToast({ title: t('editProfile.imageSelectFailed') || '选择图片失败', icon: 'none' });
            }
        },
    });
};

const handleSave = async () => {
    if (isSaving.value || isSaved.value) return;

    if (!form.nickname.trim()) {
        uni.showToast({ title: t('editProfile.enterName'), icon: 'none' });
        return;
    }

    // #ifdef MP-WEIXIN
    const isNameSafe = await validateTextSecurity(form.nickname.trim());
    if (!isNameSafe) return;
    if (form.description.trim()) {
        const isDescSafe = await validateTextSecurity(form.description.trim());
        if (!isDescSafe) return;
    }
    // #endif

    isSaving.value = true;

    try {
        const payload = {
            nickname: form.nickname.trim(),
            phone_number: form.phone_number.trim(),
            region: form.region.trim(),
            description: form.description.trim(),
            gender: form.gender,
            birthday: form.birthday || null,
        };

        let res;
        if (String(form.avatar || '').startsWith('http') || String(form.avatar || '').startsWith('/static/')) {
            res = await apiPostProfile(payload);
        } else {
            res = await apiUploadProfile({
                ...payload,
                avatar: form.avatar,
            });
        }

        const updatedProfile = res?.data || {};
        userStore.userinfo = {
            ...userStore.userinfo,
            profile: {
                ...userStore.userinfo.profile,
                ...updatedProfile,
            },
        };

        await userStore.setUserInfo();

        isSaving.value = false;
        isSaved.value = true;

        // #ifdef APP-PLUS || MP-WEIXIN
        try {
            uni.vibrateShort({ type: 'light' });
        } catch (e) {}
        // #endif

        setTimeout(() => {
            uni.navigateBack({
                fail: () => uni.reLaunch({ url: '/pages/settings/settings' }),
            });
        }, 750);
    } catch (error) {
        isSaving.value = false;
        uni.showToast({
            title: t('editProfile.saveFailed'),
            icon: 'none',
        });
    }
};

const goBack = () => {
    uni.navigateBack({
        fail: () => {
            uni.reLaunch({ url: '/pages/settings/settings' });
        },
    });
};
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: var(--page-background);
}

.status-holder {
    width: 100%;
}

.header {
    height: 112rpx;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30rpx;
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
    font-size: 36rpx;
    font-weight: 700;
    color: var(--text-primary);
    flex: 1;
    text-align: center;
}

.header-placeholder {
    width: 60rpx;
    height: 60rpx;
}

.content {
    box-sizing: border-box;
    padding-top: 16rpx;
    padding-bottom: calc(80rpx + constant(safe-area-inset-bottom));
    padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
}

.avatar-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 36rpx;
    padding-bottom: 48rpx;
}

.avatar-wrap {
    position: relative;
    cursor: pointer;
}

.avatar {
    width: 180rpx;
    height: 180rpx;
    border-radius: 50%;
    display: block;
}

.camera-btn {
    position: absolute;
    right: 4rpx;
    bottom: 4rpx;
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    background: #e5322d;
    border: 4rpx solid var(--page-background);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;

    &:active {
        transform: scale(0.92);
    }
}

.avatar-tip {
    margin-top: 20rpx;
    font-size: 26rpx;
    color: #e5322d;
    font-weight: 600;
    cursor: pointer;

    &:active {
        opacity: 0.8;
    }
}

.section-title {
    padding: 0 30rpx;
    margin-bottom: 16rpx;
    font-size: 22rpx;
    font-weight: 600;
    color: var(--text-tertiary);
    letter-spacing: 0.07em;
    text-transform: uppercase;
    display: block;
}

.card {
    background: var(--page-background-secondary);
    border-radius: 28rpx;
    border: none;
    box-shadow: none;
    margin: 0 30rpx 40rpx;
    overflow: hidden;
}

.picker-row-wrap {
    width: 100%;
    display: block;
}

.field-row {
    position: relative;
    min-height: 104rpx;
    padding: 0 32rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24rpx;
    border-bottom: 1rpx solid var(--panel-border);
    box-sizing: border-box;
    transition: background-color 0.15s ease;

    &:active {
        background: rgba(0, 0, 0, 0.02);
    }

    &.field-row-last {
        border-bottom: none;
    }
}

.row-label {
    font-size: 28rpx;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    flex-shrink: 0;
}

.row-input {
    flex: 1;
    height: 100%;
    font-size: 28rpx;
    color: var(--text-primary);
    text-align: right;
    background: transparent;
    caret-color: #e5322d;
}

.row-right {
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.row-value {
    font-size: 28rpx;
    color: var(--text-primary);

    &.muted {
        color: var(--text-tertiary);
    }

    &.placeholder {
        color: var(--text-tertiary);
    }
}

.right-icon {
    flex-shrink: 0;
}

:deep(.placeholder-style),
.placeholder-style {
    color: var(--text-tertiary);
    font-size: 28rpx;
    font-weight: 400;
    text-align: right;
}

// ── 确认保存按钮与交互动画 ──
.save-btn {
    margin: 20rpx 30rpx 60rpx;
    height: 100rpx;
    border-radius: 24rpx;
    background: #e5322d;
    color: #ffffff;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14rpx;
    font-size: 30rpx;
    font-weight: 600;
    letter-spacing: 0.5rpx;
    box-shadow: none;
    transition: transform 0.25s ease, background-color 0.3s ease, opacity 0.2s ease;

    &::after {
        border: none;
    }

    &:active:not(:disabled) {
        transform: scale(0.97);
        opacity: 0.88;
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

// ── 暗色模式适配 ──
.theme-dark {
    .header {
        background: transparent;
    }

    .card {
        background: #1e1e22;
        border: none;
        box-shadow: none;
    }

    .field-row {
        border-bottom-color: rgba(255, 255, 255, 0.05);

        &:active {
            background: rgba(255, 255, 255, 0.03);
        }
    }

    .save-btn {
        background: #e5322d;
        box-shadow: none;

        &.is-success {
            background: #ef4444;
        }
    }
}
</style>
