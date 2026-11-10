<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <view class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>

        <view class="header">
            <view class="back-btn" @click="onBack">
                <mdi-icon path="/static/icons/arrow-left.svg" size="20px" :color="backIconColor"></mdi-icon>
            </view>
            <text class="header-title">{{ headerTitle }}</text>
            <view class="header-placeholder"></view>
        </view>

        <view class="content">
            <view class="panel" v-if="step === 'warn'">
                <view class="warn-hero">
                    <view class="hero-icon">
                        <mdi-icon path="/static/icons/account-remove.svg" size="40px" color="#E5322D"></mdi-icon>
                    </view>
                    <text class="hero-title">{{ t('deactivate.warnTitle') }}</text>
                    <text class="hero-desc">{{ t('deactivate.warnDesc') }}</text>
                </view>

                <text class="section-title">{{ t('deactivate.happenTitle') }}</text>
                <view class="list-card">
                    <view
                        class="list-row"
                        v-for="(item, idx) in happenList"
                        :key="item.title"
                        :class="{ last: idx === happenList.length - 1 }"
                    >
                        <view class="list-icon">
                            <mdi-icon :path="item.icon" size="20px" :color="listIconColor"></mdi-icon>
                        </view>
                        <view class="list-text">
                            <text class="list-title">{{ item.title }}</text>
                            <text class="list-desc">{{ item.desc }}</text>
                        </view>
                    </view>
                </view>

                <text class="section-title">{{ t('deactivate.reasonTitle') }}</text>
                <view class="list-card">
                    <view
                        class="list-row selectable"
                        v-for="(reasonItem, idx) in reasonList"
                        :key="reasonItem"
                        :class="{ last: idx === reasonList.length - 1 }"
                        @click="selectReason(reasonItem)"
                    >
                        <text class="reason-text" :class="{ active: reason === reasonItem }">{{ reasonItem }}</text>
                        <view class="radio" :class="{ on: reason === reasonItem }">
                            <view v-if="reason === reasonItem" class="radio-dot"></view>
                        </view>
                    </view>
                </view>

                <view class="btn-group">
                    <button class="primary-btn" @click="step = 'confirm'">
                        <mdi-icon path="/static/icons/alert-box.svg" size="20px" color="#fff"></mdi-icon>
                        <text>{{ t('deactivate.continue') }}</text>
                    </button>
                    <button class="secondary-btn" @click="onBack">{{ t('deactivate.keep') }}</button>
                </view>
            </view>

            <view class="panel" v-else-if="step === 'confirm'">
                <view class="warning-card">
                    <view class="warning-icon">
                        <mdi-icon path="/static/icons/alert-box.svg" size="20px" color="#dc2626"></mdi-icon>
                    </view>
                    <view class="warning-text">
                        <text class="warning-title">{{ t('deactivate.warningTitle') }}</text>
                        <text class="warning-desc">{{ t('deactivate.warningDesc') }}</text>
                    </view>
                </view>

                <!-- 1. 邮箱注册用户：直接智能展示密码验证 -->
                <template v-if="isEmailUser">
                    <text class="section-title">{{ t('deactivate.passwordLabel') }}</text>
                    <view class="confirm-card">
                        <view class="input-box" :class="{ focused: focusKey === 'password' }">
                            <mdi-icon path="/static/icons/lock.svg" size="18px" :color="focusKey === 'password' ? '#e5322d' : iconMutedColor" class="input-icon"></mdi-icon>
                            <input
                                class="field-input"
                                :type="showPassword ? 'text' : 'password'"
                                v-model="password"
                                :placeholder="t('deactivate.passwordPlaceholder')"
                                placeholder-class="placeholder-style"
                                @focus="focusKey = 'password'"
                                @blur="focusKey = ''"
                            />
                            <view class="eye-btn" @click.stop="showPassword = !showPassword">
                                <mdi-icon
                                    :path="showPassword ? '/static/icons/eye-off.svg' : '/static/icons/eye.svg'"
                                    size="20px"
                                    :color="iconMutedColor"
                                ></mdi-icon>
                            </view>
                        </view>

                        <view class="check-line" @click="agree = !agree">
                            <view class="check-box" :class="{ on: agree }">
                                <mdi-icon v-if="agree" path="/static/icons/check.svg" size="20px" color="#fff"></mdi-icon>
                            </view>
                            <text class="check-text">{{ t('deactivate.agree') }}</text>
                        </view>
                    </view>
                </template>

                <!-- 2. 无合法邮箱的第三方用户（微信/华为等）：直接智能展示 DEACTIVATE 确认 -->
                <template v-else>
                    <text class="section-title">{{ t('deactivate.typeToConfirm') }}</text>
                    <view class="confirm-card" :class="{ confirmed: isConfirmed }">
                        <input
                            v-model="confirmText"
                            class="confirm-input"
                            :placeholder="t('deactivate.placeholder')"
                            placeholder-style="color: rgba(156, 163, 175, 0.5); font-weight: 500;"
                            @input="onConfirmInput"
                        />

                        <view class="check-line" @click="agree = !agree">
                            <view class="check-box" :class="{ on: agree }">
                                <mdi-icon v-if="agree" path="/static/icons/check.svg" size="20px" color="#fff"></mdi-icon>
                            </view>
                            <text class="check-text">{{ t('deactivate.agree') }}</text>
                        </view>
                    </view>
                </template>

                <view class="btn-group">
                    <button
                        class="primary-btn"
                        :class="{ 'is-loading': submitting, 'is-success': isSuccess }"
                        :disabled="!canSubmit || submitting || isSuccess"
                        @click="onDeactivate"
                    >
                        <view v-if="submitting" class="btn-spinner"></view>
                        <view v-else-if="isSuccess" class="success-icon-wrap">
                            <mdi-icon path="/static/icons/check.svg" size="20px" color="#fff"></mdi-icon>
                        </view>
                        <mdi-icon v-else path="/static/icons/account-remove.svg" size="20px" color="#fff"></mdi-icon>
                        <text>{{ isSuccess ? t('deactivate.doneHeader') : (submitting ? (t('deactivate.deactivating') || t('common.processing') || '停用中...') : t('deactivate.button')) }}</text>
                    </button>
                    <button class="secondary-btn" :disabled="submitting || isSuccess" @click="onBack">{{ t('deactivate.cancel') }}</button>
                </view>
            </view>

            <view class="panel" v-else>
                <view class="done-hero">
                    <view class="done-icon">
                        <mdi-icon path="/static/icons/check.svg" size="24px" color="#e5322d"></mdi-icon>
                    </view>
                    <text class="done-title">{{ t('deactivate.doneTitle') }}</text>
                    <text class="done-desc">{{ t('deactivate.doneDesc') }}</text>
                </view>

                <view class="done-card">
                    <text class="done-card-title">{{ t('deactivate.doneNextTitle') }}</text>
                    <view class="done-item" v-for="item in doneList" :key="item">
                        <view class="dot"></view>
                        <text class="done-item-text">{{ item }}</text>
                    </view>
                </view>

                <button class="dark-btn" @click="onBack">{{ t('deactivate.backSettings') }}</button>
            </view>
        </view>
    </view>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user.js';
import { getStatusBarHeight } from '@/utils/layout.js';
import { useSettingsStore } from '@/stores/settings.js';
import { apiPostDeactivateUser } from '@/api/wallpaper.js';

const { t } = useI18n();
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const backIconColor = computed(() => (settingsStore.isDark ? '#e5e7eb' : '#1e293b'));
const listIconColor = computed(() => (settingsStore.isDark ? '#94a3b8' : '#475569'));
const iconMutedColor = computed(() => (settingsStore.isDark ? '#94a3b8' : '#9ca3af'));
const statusBarHeight = ref(getStatusBarHeight() || 0);

onMounted(() => {
    const sb = getStatusBarHeight();
    if (sb > 0) {
        statusBarHeight.value = sb;
    }
});
const step = ref('warn');
const confirmText = ref('');
const password = ref('');
const showPassword = ref(false);
const focusKey = ref('');
const agree = ref(false);
const reason = ref('');
const submitting = ref(false);
const isSuccess = ref(false);

// 验证是否为合法邮箱格式
const isValidEmail = (val) => {
    if (!val || typeof val !== 'string') return false;
    const trimmed = val.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

// 智能判定：当且仅当用户信息中的 email 字段不为空，且为合法邮箱格式时，要求输入密码；否则展示 DEACTIVATE
const isEmailUser = computed(() => {
    const email = userStore.userinfo?.email;
    return isValidEmail(email);
});

const selectReason = (r) => {
    reason.value = r;
};

const headerTitle = computed(() => {
    if (step.value === 'confirm') return t('deactivate.finalTitle');
    if (step.value === 'done') return t('deactivate.doneHeader');
    return t('deactivate.title');
});

const isConfirmed = computed(() => confirmText.value.trim().toUpperCase() === 'DEACTIVATE');
const isPasswordValid = computed(() => password.value.trim().length >= 6);

const canSubmit = computed(() => {
    if (isEmailUser.value) {
        return isPasswordValid.value && agree.value;
    }
    return isConfirmed.value && agree.value;
});

// 精简为 3 条核心条目：去掉了引起误解的“发送确认邮件”
const happenList = computed(() => [
    { icon: '/static/icons/account-remove.svg', title: t('deactivate.happen1Title'), desc: t('deactivate.happen1Desc') },
    { icon: '/static/icons/database-refresh.svg', title: t('deactivate.happen2Title'), desc: t('deactivate.happen2Desc') },
    { icon: '/static/icons/autorenew.svg', title: t('deactivate.happen4Title'), desc: t('deactivate.happen4Desc') },
]);

const reasonList = computed(() => [
    t('deactivate.reason1'),
    t('deactivate.reason2'),
    t('deactivate.reason3'),
    t('deactivate.reason4'),
    t('deactivate.reason5'),
    t('deactivate.reason6'),
]);

const doneList = computed(() => [
    t('deactivate.done1'),
    t('deactivate.done2'),
    t('deactivate.done3'),
]);

const onConfirmInput = (e) => {
    const value = typeof e === 'string' ? e : e?.detail?.value;
    if (typeof value === 'string') {
        confirmText.value = value.toUpperCase();
    }
};

const onDeactivate = async () => {
    if (!canSubmit.value || submitting.value || isSuccess.value) return;
    try {
        submitting.value = true;
        const payload = {
            reason: reason.value,
        };
        if (isEmailUser.value) {
            payload.password = password.value;
        } else {
            payload.confirm_text = confirmText.value;
        }

        await apiPostDeactivateUser(payload);
        userStore.clearUserData();
        submitting.value = false;
        isSuccess.value = true;

        // #ifdef APP-PLUS || MP-WEIXIN
        try {
            uni.vibrateShort({ type: 'light' });
        } catch (e) {}
        // #endif

        setTimeout(() => {
            step.value = 'done';
            isSuccess.value = false;
        }, 500);
    } catch (err) {
        submitting.value = false;
        console.error('停用账户失败:', err);
        uni.showToast({
            title: err?.message || err?.error || t('common.networkError') || '停用失败，请稍后重试',
            icon: 'none',
        });
    }
};

const onBack = () => {
    if (step.value === 'confirm') {
        step.value = 'warn';
        return;
    }
    uni.navigateBack({
        fail: () => {
            uni.redirectTo({ url: '/pages/settings/settings' });
        },
    });
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

.content {
    flex: 1;
    display: flex;
    justify-content: center;
    padding: 24rpx 32rpx 80rpx;
}

.panel {
    width: 100%;
    max-width: 840rpx;
    animation: panelFadeSlide 0.38s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes panelFadeSlide {
    from {
        opacity: 0;
        transform: translateY(24rpx);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.warn-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-bottom: 48rpx;
}

.hero-icon {
    width: 120rpx;
    height: 120rpx;
    border-radius: 60rpx;
    background: #fee2e2;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;
    color: #e5322d;
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    animation: iconPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

@keyframes iconPop {
    0% {
        transform: scale(0.6);
        opacity: 0;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

.hero-title {
    font-size: 36rpx;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 12rpx;
}

.hero-desc {
    font-size: 26rpx;
    color: var(--text-secondary);
    line-height: 40rpx;
    max-width: 540rpx;
}

.section-title {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--text-tertiary);
    margin-bottom: 16rpx;
    display: block;
}

.list-card {
    background: var(--page-background-secondary);
    border: none;
    box-shadow: none;
    border-radius: 28rpx;
    margin-bottom: 40rpx;
    overflow: hidden;
}

.list-row {
    display: flex;
    align-items: center;
    padding: 30rpx 32rpx;
    gap: 20rpx;
    border-bottom: 1rpx solid var(--panel-border);
    transition: background 0.15s ease;
}

.list-row.last {
    border-bottom: none;
}

.list-row.selectable {
    justify-content: space-between;
    cursor: pointer;
}

.list-row.selectable:active {
    background: rgba(0, 0, 0, 0.02);
}

.list-icon {
    width: 68rpx;
    height: 68rpx;
    border-radius: 20rpx;
    background: var(--panel-background, rgba(120, 120, 128, 0.08));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.list-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
}

.list-title {
    font-size: 28rpx;
    font-weight: 600;
    color: var(--text-primary);
}

.list-desc {
    font-size: 24rpx;
    color: var(--text-secondary);
    line-height: 36rpx;
}

.reason-text {
    font-size: 28rpx;
    color: var(--text-secondary);
    font-weight: 500;
    transition: all 0.2s ease;
}

.reason-text.active {
    color: #e5322d;
    font-weight: 600;
}

.radio {
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    border: 3rpx solid #d1d5db;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.radio.on {
    border-color: #e5322d;
    background: #e5322d;
}

.radio-dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    background: #ffffff;
}

.btn-group {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.primary-btn {
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

.primary-btn:disabled {
    background: var(--panel-background);
    color: var(--text-tertiary);
}

.secondary-btn {
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

.warning-card {
    background: #fef2f2;
    border: none;
    border-radius: 24rpx;
    padding: 32rpx;
    display: flex;
    gap: 20rpx;
    align-items: flex-start;
    margin-bottom: 48rpx;
    color: #dc2626;
}

.warning-icon {
    width: 36rpx;
    height: 36rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2rpx;
}

.warning-text {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.warning-title {
    font-size: 28rpx;
    font-weight: 700;
    color: #991b1b;
}

.warning-desc {
    font-size: 24rpx;
    color: #b91c1c;
    line-height: 36rpx;
}

.confirm-card {
    background: var(--page-background-secondary);
    border: none;
    box-shadow: none;
    border-radius: 28rpx;
    padding: 28rpx 32rpx;
    margin-bottom: 56rpx;
}

.confirm-card.confirmed {
    border-color: #fecaca;
}

/* 密码输入框 (与 change-password.vue 一致) */
.input-box {
    width: 100%;
    height: 96rpx;
    background: var(--page-background);
    border-radius: 20rpx;
    padding: 0 24rpx;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 16rpx;
    border: 2rpx solid transparent;
    transition: all 0.2s ease;

    &.focused {
        border-color: #e5322d;
        background: var(--page-background-secondary);
    }
}

.input-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.field-input {
    flex: 1;
    height: 100%;
    border: none;
    background: transparent;
    font-size: 28rpx;
    color: var(--text-primary);
    caret-color: #e5322d;
}

.eye-btn {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:active {
        opacity: 0.7;
    }
}

.placeholder-style {
    color: var(--text-tertiary);
    font-size: 26rpx;
}

.confirm-input {
    width: 100%;
    height: 52rpx;
    border: none;
    background: transparent;
    font-size: 32rpx;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: 0.1em;
    caret-color: #e5322d;
    outline: none;
    box-sizing: border-box;
}

.confirm-card.confirmed .confirm-input {
    color: #dc2626;
}

.check-line {
    margin-top: 24rpx;
    display: flex;
    align-items: center;
    gap: 16rpx;
    cursor: pointer;
}

.check-box {
    width: 36rpx;
    height: 36rpx;
    border-radius: 12rpx;
    border: 2rpx solid #cad3e2;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    flex-shrink: 0;
}

.check-box.on {
    border-color: #e5322d;
    background: #e5322d;
}

.check-text {
    font-size: 24rpx;
    color: var(--text-secondary);
    line-height: 36rpx;
}

.done-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-bottom: 56rpx;
}

.done-icon {
    width: 120rpx;
    height: 120rpx;
    border-radius: 60rpx;
    background: rgba(229, 50, 45, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 32rpx;
    color: #e5322d;
    animation: iconPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

.done-title {
    font-size: 40rpx;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 16rpx;
}

.done-desc {
    font-size: 26rpx;
    color: var(--text-secondary);
    line-height: 40rpx;
    max-width: 500rpx;
}

.done-card {
    background: var(--page-background-secondary);
    border: none;
    box-shadow: none;
    border-radius: 28rpx;
    padding: 36rpx 32rpx;
    margin-bottom: 48rpx;
}

.done-card-title {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 24rpx;
    display: block;
}

.done-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 20rpx;
}

.done-item:last-child {
    margin-bottom: 0;
}

.dot {
    width: 10rpx;
    height: 10rpx;
    border-radius: 5rpx;
    background: #e5322d;
    flex-shrink: 0;
}

.done-item-text {
    font-size: 28rpx;
    color: var(--text-secondary);
}

.dark-btn {
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
    transition: opacity 0.2s ease;

    &:active {
        opacity: 0.88;
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
</style>

<style lang="scss" scoped>
// ── 暗色模式覆盖 ──
.theme-dark {
    .hero-icon {
        background: rgba(229, 50, 45, 0.12);
        border: none;
    }

    .list-card {
        background: #1e1e22;
        border: none;
        box-shadow: none;
    }

    .list-row {
        border-bottom-color: rgba(255, 255, 255, 0.05);

        &.selectable:active {
            background: rgba(255, 255, 255, 0.03);
        }
    }

    .list-icon {
        background: rgba(255, 255, 255, 0.06);
    }

    .warning-card {
        background: rgba(220, 38, 38, 0.12);
        border: none;
    }

    .warning-title {
        color: #f87171;
    }

    .warning-desc {
        color: #fca5a5;
    }

    .confirm-card {
        background: #1e1e22;
        border: none;
        box-shadow: none;
    }

    .input-box {
        background: #141416;

        &.focused {
            background: #18181c;
            border-color: #ef4444;
        }
    }

    .check-box {
        border-color: rgba(255, 255, 255, 0.2);
    }

    .done-card {
        background: #1e1e22;
        border: none;
        box-shadow: none;
    }

    .secondary-btn {
        background: rgba(255, 255, 255, 0.08);
        color: #f1f5f9;
        border: none;
        box-shadow: none;
    }
}
</style>
