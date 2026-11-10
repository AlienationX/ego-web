<template>
    <view class="reset-container" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 沉浸式顶部导航栏 -->
        <view class="nav-header" :style="{ paddingTop: statusBarHeight + 'px' }">
            <view class="nav-bar">
                <view class="back-btn" @click="goBack">
                    <mdi-icon path="/static/icons/arrow-left.svg" size="20px" :color="backIconColor"></mdi-icon>
                </view>
                <text class="nav-title">{{ pageTitle }}</text>
                <view class="nav-placeholder"></view>
            </view>
        </view>

        <!-- 页面滚动内容区 -->
        <scroll-view class="scroll-host" scroll-y :show-scrollbar="false">
            <view class="scroll-inner">
                <!-- 第一步：输入邮箱 -->
                <view class="step-card-panel" v-if="currentIndex === 0">
                    <view class="title-section">
                        <view class="hero-icon-wrap">
                            <mdi-icon path="/static/icons/lock.svg" size="32px" color="#e5322d"></mdi-icon>
                        </view>
                        <text class="main-title">{{ t('login.forgetPasswordTitle') }}</text>
                        <text class="sub-title">{{ t('login.forgetPasswordSubtitle') }}</text>
                    </view>

                    <view class="form-card">
                        <view class="input-box" :class="{ focused: isFocused === 'email' }">
                            <mdi-icon path="/static/icons/email.svg" size="18px" :color="isFocused === 'email' ? '#e5322d' : iconMutedColor" class="input-icon"></mdi-icon>
                            <input
                                class="field-input"
                                type="text"
                                :placeholder="t('login.emailPlaceholder')"
                                placeholder-class="placeholder-style"
                                v-model="step1Form.contact"
                                @focus="isFocused = 'email'"
                                @blur="isFocused = ''"
                            />
                        </view>
                    </view>

                    <view class="submit-section">
                        <button
                            class="primary-btn"
                            :class="{ 'is-loading': isSubmitting, 'is-disabled': !canSubmitStep1 }"
                            :disabled="isSubmitting"
                            @click="handleStep1"
                        >
                            <view v-if="isSubmitting" class="btn-spinner"></view>
                            <text>{{ isSubmitting ? t('login.sending') : t('login.send') }}</text>
                        </button>
                    </view>
                </view>

                <!-- 第二步：输入6位验证码（OTP） -->
                <view class="step-card-panel" v-else-if="currentIndex === 1">
                    <view class="title-section">
                        <view class="hero-icon-wrap">
                            <mdi-icon path="/static/icons/security.svg" size="32px" color="#e5322d"></mdi-icon>
                        </view>
                        <text class="main-title">{{ t('login.enterOtpTitle') }}</text>
                        <text class="sub-title">{{ tp('login.enterOtpSubtitle') || '验证码已发送至你的邮箱' }}</text>
                        <text class="email-badge">{{ step1Form.contact }}</text>
                    </view>

                    <!-- 隐式单输入框 + 6个独立验证码格子 -->
                    <view class="otp-container" @click="focusOtpInput">
                        <!-- 真实单输入框（透明置底，捕获原生键盘事件、退格与一键粘贴） -->
                        <input
                            class="hidden-otp-input"
                            type="number"
                            maxlength="6"
                            v-model="otpCode"
                            :focus="isOtpFocused"
                            @input="onOtpInputChange"
                            @focus="isOtpFocused = true"
                            @blur="isOtpFocused = false"
                        />
                        <!-- 6个独立的现代扁平数字格 -->
                        <view class="otp-boxes">
                            <view
                                class="otp-box"
                                v-for="i in 6"
                                :key="i"
                                :class="{
                                    active: isOtpFocused && otpCode.length === i - 1,
                                    filled: otpCode.length >= i
                                }"
                            >
                                <text class="otp-digit">{{ otpCode[i - 1] || '' }}</text>
                                <view class="otp-cursor" v-if="isOtpFocused && otpCode.length === i - 1"></view>
                            </view>
                        </view>
                    </view>

                    <view class="submit-section">
                        <button
                            class="primary-btn"
                            :class="{ 'is-loading': isSubmitting, 'is-disabled': otpCode.length < 6 }"
                            :disabled="isSubmitting"
                            @click="handleStep2"
                        >
                            <view v-if="isSubmitting" class="btn-spinner"></view>
                            <text>{{ isSubmitting ? t('login.verifying') : t('login.verify') }}</text>
                        </button>
                    </view>

                    <view class="resend-section">
                        <text class="resend-text">{{ t('login.didntGetOtp') }}</text>
                        <text
                            class="resend-link"
                            :class="{ disabled: isResendDisabled }"
                            @click="handleResend"
                        >
                            {{ isResendDisabled ? tp('login.resendIn', { seconds: countdown }) : t('login.resendOtp') }}
                        </text>
                    </view>
                </view>

                <!-- 第三步：重置新密码 -->
                <view class="step-card-panel" v-else-if="currentIndex === 2">
                    <view class="title-section">
                        <view class="hero-icon-wrap">
                            <mdi-icon path="/static/icons/lock-open.svg" size="32px" color="#e5322d"></mdi-icon>
                        </view>
                        <text class="main-title">{{ t('login.resetPasswordTitle') }}</text>
                        <text class="sub-title">{{ t('login.resetPasswordSubtitle') }}</text>
                    </view>

                    <view class="form-card">
                        <!-- 新密码 -->
                        <view class="input-box" :class="{ focused: isFocused === 'new' }">
                            <mdi-icon path="/static/icons/lock.svg" size="18px" :color="isFocused === 'new' ? '#e5322d' : iconMutedColor" class="input-icon"></mdi-icon>
                            <input
                                class="field-input"
                                :type="showPassword ? 'text' : 'password'"
                                :placeholder="t('login.newPasswordPlaceholder')"
                                placeholder-class="placeholder-style"
                                v-model="step3Form.newPassword"
                                @focus="isFocused = 'new'"
                                @blur="isFocused = ''"
                            />
                            <view class="eye-btn" @click.stop="togglePassword">
                                <mdi-icon
                                    :path="showPassword ? '/static/icons/eye-off.svg' : '/static/icons/eye.svg'"
                                    size="20px"
                                    :color="iconMutedColor"
                                ></mdi-icon>
                            </view>
                        </view>

                        <view class="input-divider"></view>

                        <!-- 确认新密码 -->
                        <view class="input-box" :class="{ focused: isFocused === 'confirm' }">
                            <mdi-icon path="/static/icons/lock.svg" size="18px" :color="isFocused === 'confirm' ? '#e5322d' : iconMutedColor" class="input-icon"></mdi-icon>
                            <input
                                class="field-input"
                                :type="showConfirmPassword ? 'text' : 'password'"
                                :placeholder="t('login.confirmPasswordPlaceholder')"
                                placeholder-class="placeholder-style"
                                v-model="step3Form.confirmPassword"
                                @focus="isFocused = 'confirm'"
                                @blur="isFocused = ''"
                            />
                            <view class="eye-btn" @click.stop="toggleConfirmPassword">
                                <mdi-icon
                                    :path="showConfirmPassword ? '/static/icons/eye-off.svg' : '/static/icons/eye.svg'"
                                    size="20px"
                                    :color="iconMutedColor"
                                ></mdi-icon>
                            </view>
                        </view>
                    </view>

                    <!-- 密码规则实时提示条 -->
                    <view class="rules-hint-box">
                        <view class="rule-hint-item" :class="{ met: isMinLengthMet }">
                            <mdi-icon
                                :path="isMinLengthMet ? '/static/icons/check.svg' : '/static/icons/close.svg'"
                                size="14px"
                                :color="isMinLengthMet ? '#10b981' : iconMutedColor"
                            ></mdi-icon>
                            <text class="rule-hint-text">{{ t('login.passwordMin6') }}</text>
                        </view>
                        <view class="rule-hint-item" v-if="step3Form.confirmPassword.length" :class="{ met: isMatchMet }">
                            <mdi-icon
                                :path="isMatchMet ? '/static/icons/check.svg' : '/static/icons/close.svg'"
                                size="14px"
                                :color="isMatchMet ? '#10b981' : '#ef4444'"
                            ></mdi-icon>
                            <text class="rule-hint-text">{{ isMatchMet ? t('login.passwordMatch') : t('login.confirmPasswordError') }}</text>
                        </view>
                    </view>

                    <view class="submit-section">
                        <button
                            class="primary-btn"
                            :class="{ 'is-loading': isSubmitting, 'is-disabled': !canSubmitStep3 }"
                            :disabled="isSubmitting"
                            @click="handleStep3"
                        >
                            <view v-if="isSubmitting" class="btn-spinner"></view>
                            <text>{{ isSubmitting ? t('login.resetting') : t('login.resetPassword') }}</text>
                        </button>
                    </view>
                </view>

                <!-- 完成步骤：成功状态页（闭环体验） -->
                <view class="step-card-panel success-panel" v-else>
                    <view class="success-icon-hero">
                        <mdi-icon path="/static/icons/check.svg" size="36px" color="#ffffff"></mdi-icon>
                    </view>
                    <text class="success-title">{{ t('login.resetSuccessTitle') }}</text>
                    <text class="success-desc">{{ t('login.resetSuccessDesc') }}</text>

                    <view class="submit-section" style="margin-top: 60rpx;">
                        <button class="primary-btn" @click="goToSignIn">
                            {{ t('login.goToSignIn') }}
                        </button>
                    </view>
                </view>
            </view>
        </scroll-view>

        <!-- 步骤指示器（成功页不展示） -->
        <view class="indicator-wrapper" v-if="currentIndex < 3">
            <view
                class="indicator-dot"
                v-for="(item, index) in 3"
                :key="index"
                :class="{ active: currentIndex === index }"
            ></view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, onUnmounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTranslateParams } from '@/utils/i18n.js';
import { getStatusBarHeight } from '@/utils/layout.js';
import { apiPostSendEmailCode, apiPostVerifyCode, apiPostResetPassword } from '@/api/wallpaper.js';
import { useSettingsStore } from '@/stores/settings.js';

const { t } = useI18n();
const { tp } = useTranslateParams();
const settingsStore = useSettingsStore();

const statusBarHeight = ref(getStatusBarHeight() || 0);
const backIconColor = computed(() => (settingsStore.isDark ? '#e5e7eb' : '#1e293b'));
const iconMutedColor = computed(() => (settingsStore.isDark ? '#94a3b8' : '#9ca3af'));

const currentIndex = ref(0);
const isSubmitting = ref(false);
const isFocused = ref('');
const isOtpFocused = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// 验证码倒计时
const isResendDisabled = ref(false);
const countdown = ref(60);
let timer = null;

// 表单数据
const step1Form = ref({ contact: '' });
const otpCode = ref('');
const resetToken = ref('');
const step3Form = ref({
    newPassword: '',
    confirmPassword: '',
});

// 顶部标题
const pageTitle = computed(() => {
    if (currentIndex.value === 0) return t('login.forgetPasswordTitle');
    if (currentIndex.value === 1) return t('login.enterOtpTitle');
    if (currentIndex.value === 2) return t('login.resetPasswordTitle');
    return t('login.resetSuccessTitle');
});

// 第一步邮箱格式校验
const canSubmitStep1 = computed(() => {
    const contact = step1Form.value.contact.trim();
    return Boolean(contact && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact));
});

// 第三步表单校验与规则实时反馈
const isMinLengthMet = computed(() => step3Form.value.newPassword.length >= 6);
const isMatchMet = computed(() => {
    return (
        step3Form.value.confirmPassword.length > 0 &&
        step3Form.value.newPassword === step3Form.value.confirmPassword
    );
});
const canSubmitStep3 = computed(() => {
    return isMinLengthMet.value && isMatchMet.value;
});

// 聚焦隐藏 OTP 输入框
const focusOtpInput = () => {
    isOtpFocused.value = true;
};

const onOtpInputChange = (e) => {
    const val = String(e.detail?.value || '');
    otpCode.value = val.slice(0, 6);

    // 输满 6 位自动触发验证
    if (otpCode.value.length === 6) {
        handleStep2();
    }
};

const togglePassword = () => {
    showPassword.value = !showPassword.value;
};

const toggleConfirmPassword = () => {
    showConfirmPassword.value = !showConfirmPassword.value;
};

// 倒计时管理
const startCountdown = () => {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    isResendDisabled.value = true;
    countdown.value = 60;

    timer = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
            clearInterval(timer);
            timer = null;
            isResendDisabled.value = false;
        }
    }, 1000);
};

// 步骤 1：发送验证码
const handleStep1 = async () => {
    if (isSubmitting.value) return;
    const email = step1Form.value.contact.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        uni.showToast({
            title: t('login.emailError'),
            icon: 'none',
        });
        return;
    }

    isSubmitting.value = true;
    try {
        await apiPostSendEmailCode({ email });

        uni.showToast({
            title: t('login.otpSentSuccess'),
            icon: 'success',
            duration: 1500,
        });

        setTimeout(() => {
            otpCode.value = '';
            currentIndex.value = 1;
            startCountdown();
            nextTick(() => {
                isOtpFocused.value = true;
            });
        }, 800);
    } catch (error) {
        console.error('发送验证码失败:', error);
        uni.showToast({
            title: error.message || error.data?.error || t('login.sendOtpFailed'),
            icon: 'none',
        });
    } finally {
        isSubmitting.value = false;
    }
};

// 重新发送验证码
const handleResend = () => {
    if (isResendDisabled.value) return;
    handleStep1();
};

// 步骤 2：验证 OTP
const handleStep2 = async () => {
    if (isSubmitting.value) return;
    const code = String(otpCode.value || '').trim();
    if (code.length < 6) {
        uni.showToast({
            title: t('login.otpIncomplete'),
            icon: 'none',
        });
        return;
    }

    isSubmitting.value = true;
    try {
        const res = await apiPostVerifyCode({
            email: step1Form.value.contact.trim().toLowerCase(),
            code: code,
        });

        if (res.data?.reset_token) {
            resetToken.value = res.data.reset_token;
        }

        uni.showToast({
            title: t('login.otpVerifiedSuccess'),
            icon: 'success',
            duration: 1200,
        });

        setTimeout(() => {
            currentIndex.value = 2;
        }, 700);
    } catch (error) {
        console.error('验证码验证失败:', error);
        uni.showToast({
            title: error.message || error.data?.error || t('login.invalidOtp'),
            icon: 'none',
        });
    } finally {
        isSubmitting.value = false;
    }
};

// 步骤 3：重置密码
const handleStep3 = async () => {
    if (isSubmitting.value) return;
    const { newPassword, confirmPassword } = step3Form.value;

    if (!newPassword || newPassword.length < 6) {
        uni.showToast({
            title: t('login.passwordError'),
            icon: 'none',
        });
        return;
    }

    if (newPassword !== confirmPassword) {
        uni.showToast({
            title: t('login.confirmPasswordError'),
            icon: 'none',
        });
        return;
    }

    isSubmitting.value = true;
    try {
        await apiPostResetPassword({
            reset_token: resetToken.value,
            new_password: newPassword,
            confirm_password: confirmPassword,
        });

        uni.showToast({
            title: t('login.passwordResetSuccess'),
            icon: 'success',
            duration: 1500,
        });

        setTimeout(() => {
            currentIndex.value = 3; // 切换到成功状态页
        }, 600);
    } catch (error) {
        console.error('重置密码失败:', error);
        uni.showToast({
            title: error.message || error.data?.error || t('login.resetPasswordFailed'),
            icon: 'none',
        });
    } finally {
        isSubmitting.value = false;
    }
};

// 跳转到登录页并预填邮箱
const goToSignIn = () => {
    const email = encodeURIComponent(step1Form.value.contact.trim());
    uni.redirectTo({
        url: `/pages/auth/signin?email=${email}`,
        fail: () => {
            uni.reLaunch({ url: '/pages/auth/signin' });
        },
    });
};

// 导航返回
const goBack = () => {
    if (currentIndex.value === 0 || currentIndex.value === 3) {
        uni.navigateBack({
            fail: () => {
                uni.redirectTo({ url: '/pages/auth/signin' });
            },
        });
    } else {
        currentIndex.value -= 1;
    }
};

onUnmounted(() => {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
});
</script>

<style lang="scss" scoped>
.reset-container {
    min-height: 100vh;
    background: var(--page-background);
    display: flex;
    flex-direction: column;
}

/* 顶部导航 */
.nav-header {
    width: 100%;
    background: var(--page-background);
    position: sticky;
    top: 0;
    z-index: 100;
}

.nav-bar {
    height: 100rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32rpx;

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

    .nav-title {
        font-size: 34rpx;
        font-weight: 700;
        color: var(--text-primary);
        flex: 1;
        text-align: center;
    }

    .nav-placeholder {
        width: 60rpx;
        height: 60rpx;
    }
}

.scroll-host {
    flex: 1;
}

.scroll-inner {
    padding: 40rpx 48rpx 160rpx;
    box-sizing: border-box;
}

/* 步骤主体动画卡片 */
.step-card-panel {
    animation: panelFadeSlide 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
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

.title-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-bottom: 56rpx;

    .hero-icon-wrap {
        width: 110rpx;
        height: 110rpx;
        border-radius: 55rpx;
        background: rgba(229, 50, 45, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 24rpx;
        animation: iconBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .main-title {
        font-size: 44rpx;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 12rpx;
    }

    .sub-title {
        font-size: 26rpx;
        color: var(--text-secondary);
        line-height: 38rpx;
        max-width: 520rpx;
    }

    .email-badge {
        margin-top: 16rpx;
        font-size: 24rpx;
        font-weight: 600;
        color: #e5322d;
        background: rgba(229, 50, 45, 0.08);
        padding: 6rpx 20rpx;
        border-radius: 999rpx;
    }
}

@keyframes iconBounce {
    0% {
        transform: scale(0.6);
        opacity: 0;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* 扁平输入表单卡片 */
.form-card {
    background: var(--page-background-secondary);
    border-radius: 28rpx;
    overflow: hidden;
    margin-bottom: 48rpx;
}

.input-box {
    width: 100%;
    height: 104rpx;
    background: transparent;
    border-radius: 28rpx;
    padding: 0 28rpx;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 16rpx;
    border: 2rpx solid transparent;
    transition: all 0.2s ease;

    &.focused {
        border-color: #e5322d;
    }
}

.input-divider {
    height: 1rpx;
    background: var(--panel-border);
    margin: 0 28rpx;
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
    font-size: 28rpx;
    color: var(--text-primary);
    background: transparent;
    caret-color: #e5322d;
}

.placeholder-style {
    color: var(--text-tertiary);
    font-size: 28rpx;
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

/* 6位 OTP 验证码现代交互 */
.otp-container {
    position: relative;
    width: 100%;
    margin-bottom: 56rpx;
}

.hidden-otp-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    z-index: 10;
    color: transparent;
    background: transparent;
}

.otp-boxes {
    display: flex;
    justify-content: space-between;
    gap: 16rpx;
    width: 100%;
}

.otp-box {
    flex: 1;
    height: 108rpx;
    background: var(--page-background-secondary);
    border: 2rpx solid transparent;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all 0.2s ease;

    &.active {
        border-color: #e5322d;
        background: var(--page-background-secondary);
        transform: scale(1.04);
    }

    &.filled {
        background: var(--page-background-secondary);
    }
}

.otp-digit {
    font-size: 40rpx;
    font-weight: 700;
    color: var(--text-primary);
}

.otp-cursor {
    position: absolute;
    width: 4rpx;
    height: 40rpx;
    background: #e5322d;
    border-radius: 2rpx;
    animation: cursorBlink 1s infinite;
}

@keyframes cursorBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}

/* 重新发送区 */
.resend-section {
    margin-top: 36rpx;
    text-align: center;
    font-size: 26rpx;

    .resend-text {
        color: var(--text-secondary);
    }

    .resend-link {
        color: #e5322d;
        font-weight: 600;
        cursor: pointer;
        margin-left: 8rpx;

        &.disabled {
            color: var(--text-tertiary);
            cursor: not-allowed;
            font-weight: 400;
        }
    }
}

/* 密码规则实时提示条 */
.rules-hint-box {
    display: flex;
    flex-direction: column;
    gap: 14rpx;
    margin-top: -24rpx;
    margin-bottom: 44rpx;
    padding: 0 16rpx;

    .rule-hint-item {
        display: flex;
        align-items: center;
        gap: 12rpx;
        color: var(--text-tertiary);
        font-size: 24rpx;
        transition: color 0.2s ease;

        &.met {
            color: #10b981;
        }

        .rule-hint-text {
            line-height: 1.4;
        }
    }
}

/* 扁平品牌主按钮 */
.submit-section {
    width: 100%;
}

.primary-btn {
    width: 100%;
    height: 100rpx;
    border-radius: 24rpx;
    background: #e5322d !important;
    border: none;
    color: #ffffff !important;
    font-size: 30rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    box-shadow: none;
    transition: all 0.2s ease;
    cursor: pointer;

    &::after {
        border: none;
    }

    &:active:not(.is-disabled) {
        transform: scale(0.98);
        opacity: 0.9;
    }

    &.is-disabled,
    &:disabled,
    &[disabled] {
        background: #e5322d !important;
        color: #ffffff !important;
        opacity: 0.38 !important;
        cursor: not-allowed;
    }

    &.is-loading {
        opacity: 0.85 !important;
    }
}

.btn-spinner {
    width: 32rpx;
    height: 32rpx;
    border: 4rpx solid rgba(255, 255, 255, 0.35);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: btnSpin 0.7s linear infinite;
}

@keyframes btnSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* 成功完成页 */
.success-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding-top: 60rpx;

    .success-icon-hero {
        width: 128rpx;
        height: 128rpx;
        border-radius: 64rpx;
        background: #e5322d;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 36rpx;
        animation: iconPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
    }

    .success-title {
        font-size: 40rpx;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 16rpx;
    }

    .success-desc {
        font-size: 26rpx;
        color: var(--text-secondary);
        line-height: 40rpx;
        max-width: 520rpx;
    }
}

@keyframes iconPop {
    0% { transform: scale(0.5); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
}

/* 底部步骤指示条 */
.indicator-wrapper {
    position: fixed;
    bottom: 60rpx;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 16rpx;
    z-index: 10;
}

.indicator-dot {
    width: 14rpx;
    height: 14rpx;
    border-radius: 7rpx;
    background: var(--panel-border);
    transition: all 0.3s ease;

    &.active {
        width: 44rpx;
        background: #e5322d;
    }
}

/* 暗色模式适配 */
.theme-dark {
    .form-card,
    .otp-box {
        background: #1e1e22;
    }

    .input-box.focused,
    .otp-box.active {
        background: #18181c;
        border-color: #ef4444;
    }

    .input-divider {
        background: rgba(255, 255, 255, 0.05);
    }
}
</style>
