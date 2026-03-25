<template>
    <view class="reset-password-container">
        <!-- 返回按钮 -->
        <view class="back-btn" :style="{ top: backTop + 'px' }" @click="goBack">
            <mdi-icon path="/static/icons/arrow-left.svg" size="20px" color="#4a5670"></mdi-icon>
        </view>

        <view class="step-host">
            <!-- 第一步：忘记密码 -->
            <view :class="['step-page', stepAnimClass]" v-if="currentIndex === 0" :key="`step-0-${animTick}`">
                <view class="content">
                    <view class="title-section">
                        <view class="main-title">{{ t('login.forgetPasswordTitle') }}</view>
                        <view class="sub-title">{{ t('login.forgetPasswordSubtitle') }}</view>
                    </view>

                    <view class="form-section">
                        <view class="form-item">
                            <input
                                class="form-input"
                                type="text"
                                :placeholder="t('login.emailPhonePlaceholder')"
                                v-model="step1Form.contact"
                            />
                        </view>
                    </view>

                    <view class="submit-section">
                        <button class="submit-btn" :disabled="isSubmitting" @click="handleStep1">
                            {{ isSubmitting ? t('login.sending') : t('login.send') }}
                        </button>
                    </view>
                </view>
            </view>

            <!-- 第二步：验证OTP -->
            <view :class="['step-page', stepAnimClass]" v-else-if="currentIndex === 1" :key="`step-1-${animTick}`">
                <view class="content">
                    <view class="title-section">
                        <view class="main-title">{{ t('login.enterOtpTitle') }}</view>
                        <view class="sub-title">{{ t('login.enterOtpSubtitle') }}</view>
                    </view>

                    <view class="otp-section">
                        <view class="otp-inputs">
                            <view
                                class="otp-input-box"
                                v-for="(digit, index) in otpDigits"
                                :key="index"
                                :class="{ filled: digit }"
                                @click="focusOtp(index)"
                            >
                                <input
                                    :focus="activeIndex === index && currentIndex === 1"
                                    v-model="otpDigits[index]"
                                    type="text"
                                    maxlength="1"
                                    class="otp-input"
                                    @input="onOtpInput(index, $event)"
                                    @focus="onOtpFocus(index)"
                                    @blur="onOtpBlur(index)"
                                />
                            </view>
                        </view>
                    </view>

                    <view class="submit-section">
                        <button class="submit-btn" :disabled="!isOtpComplete || isSubmitting" @click="handleStep2">
                            {{ isSubmitting ? t('login.verifying') : t('login.verify') }}
                        </button>
                    </view>

                    <view class="resend-section">
                        <text class="resend-text">{{ t('login.didntGetOtp') }}</text>
                        <text class="resend-link" :class="{ disabled: isResendDisabled }" @click="handleResend">
                            {{ isResendDisabled ? t('login.resendIn', { seconds: countdown }) : t('login.resendOtp') }}
                        </text>
                    </view>
                </view>
            </view>

            <!-- 第三步：重置密码 -->
            <view :class="['step-page', stepAnimClass]" v-else :key="`step-2-${animTick}`">
                <view class="content">
                    <view class="title-section">
                        <view class="main-title">{{ t('login.resetPasswordTitle') }}</view>
                        <view class="sub-title">{{ t('login.resetPasswordSubtitle') }}</view>
                    </view>

                    <view class="form-section">
                        <view class="form-item">
                            <input
                                class="form-input"
                                :type="showPassword ? 'text' : 'password'"
                                :placeholder="t('login.newPasswordPlaceholder')"
                                v-model="step3Form.newPassword"
                            />
                            <view class="password-toggle" @click="togglePassword">
                                <mdi-icon
                                    :path="showPassword ? '/static/icons/eye-off.svg' : '/static/icons/eye.svg'"
                                    size="48"
                                    color="#9ca3af"
                                ></mdi-icon>
                            </view>
                        </view>

                        <view class="form-item">
                            <input
                                class="form-input"
                                type="password"
                                :placeholder="t('login.confirmPasswordPlaceholder')"
                                v-model="step3Form.confirmPassword"
                            />
                        </view>
                    </view>

                    <view class="submit-section">
                        <button class="submit-btn" :disabled="isSubmitting" @click="handleStep3">
                            {{ isSubmitting ? t('login.resetting') : t('login.resetPassword') }}
                        </button>
                    </view>
                </view>
            </view>
        </view>

        <!-- 指示器 -->
        <view class="indicator-wrapper">
            <view
                class="indicator-dot"
                v-for="(item, index) in [1, 2, 3]"
                :key="index"
                :class="{ active: currentIndex === index }"
            ></view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { getStatusBarHeight } from '@/utils/system.js';
import { apiPostSendEmailCode, apiPostVerifyCode, apiPostResetPassword } from '@/api/wallpaper.js';

const { t } = useI18n();
const currentIndex = ref(0);
const stepAnimClass = ref('step-anim-left');
const animTick = ref(0);
const maxUnlockedStep = ref(0);
const isSubmitting = ref(false);
const showPassword = ref(false);
const isResendDisabled = ref(false);
const countdown = ref(60);
let timer = null;

// 第一步表单
const step1Form = ref({ contact: '' });

// 第二步OTP数据
const otpDigits = ref(['', '', '', '', '', '']);
const resetToken = ref('');

// 第三步表单
const step3Form = ref({
    newPassword: '',
    confirmPassword: '',
});

const activeIndex = ref(0);
const backTop = ref((getStatusBarHeight() || 0) + 10);

// 计算OTP是否完整
const isOtpComplete = computed(() => {
    return otpDigits.value.every((digit) => digit !== '');
});

// 第一步：发送OTP
const handleStep1 = async () => {
    if (isSubmitting.value) return;
    if (!step1Form.value.contact || step1Form.value.contact.trim().length < 5) {
        uni.showToast({
            title: t('login.contactError'),
            icon: 'none',
        });
        return;
    }

    isSubmitting.value = true;
    try {
        // 调用发送OTP的API
        await apiPostSendEmailCode({ email: step1Form.value.contact });

        uni.showToast({
            title: t('login.otpSentSuccess'),
            icon: 'none',
        });

        // 自动跳转到下一步
        setTimeout(() => {
            otpDigits.value = ['', '', '', '', '', ''];
            activeIndex.value = 0;
            maxUnlockedStep.value = 1;
            swiperToStep(1);
            if (!isResendDisabled.value) {
                startCountdown();
            }
        }, 1500);
    } catch (error) {
        uni.showToast({
            title: error.message || t('login.sendOtpFailed'),
            icon: 'none',
            duration: 2000,
        });
    } finally {
        isSubmitting.value = false;
    }
};

// 第二步：验证OTP
const handleStep2 = async () => {
    if (isSubmitting.value) return;
    if (!isOtpComplete.value) {
        uni.showToast({
            title: t('login.otpIncomplete'),
            icon: 'none',
        });
        return;
    }

    const otp = otpDigits.value.join('');

    isSubmitting.value = true;
    try {
        // 调用验证OTP的API
        const res = await apiPostVerifyCode({ email: step1Form.value.contact, code: otp });
        if (res.code !== 200) {
            error.value = res.data.error || t('login.invalidOtp');
            throw new Error(res.data.error);
        } else {
            resetToken.value = res.data.reset_token;
        }

        uni.showToast({
            title: t('login.otpVerifiedSuccess'),
            icon: 'none',
        });

        // 验证成功后，自动跳转到下一步
        setTimeout(() => {
            maxUnlockedStep.value = 2;
            swiperToStep(2);
        }, 1500);
    } catch (error) {
        uni.showToast({
            title: error.message || t('login.invalidOtp'),
            icon: 'none',
            duration: 2000,
        });
    } finally {
        isSubmitting.value = false;
    }
};

// 第三步：重置密码
const handleStep3 = async () => {
    if (isSubmitting.value) return;
    if (!step3Form.value.newPassword || step3Form.value.newPassword.length < 6) {
        uni.showToast({
            title: t('login.passwordError'),
            icon: 'none',
        });
        return;
    }

    if (step3Form.value.newPassword !== step3Form.value.confirmPassword) {
        uni.showToast({
            title: t('login.confirmPasswordError'),
            icon: 'none',
        });
        return;
    }

    isSubmitting.value = true;
    try {
        // 调用重置密码的API
        const res = await apiPostResetPassword({
            reset_token: resetToken.value,
            new_password: step3Form.value.newPassword,
            confirm_password: step3Form.value.confirmPassword,
        });
        if (res.code !== 200) {
            error.value = res.data.error || t('login.resetPasswordFailed');
            throw new Error(res.data.error);
        }

        uni.showToast({
            title: t('login.passwordResetSuccess'),
            icon: 'none',
        });

        // 重置成功后，跳转到登录页
        setTimeout(() => {
            uni.reLaunch({
                url: '/pages/user/user',
            });
        }, 1500);
    } catch (error) {
        uni.showToast({
            title: error.message || t('login.resetPasswordFailed'),
            icon: 'none',
            duration: 2000,
        });
    } finally {
        isSubmitting.value = false;
    }
};

// 切换到指定步骤
const swiperToStep = (index) => {
    if (index > maxUnlockedStep.value) {
        uni.showToast({
            title: t('login.completeCurrentStepFirst'),
            icon: 'none',
        });
        return;
    }
    if (index === currentIndex.value) {
        return;
    }
    stepAnimClass.value = index > currentIndex.value ? 'step-anim-left' : 'step-anim-right';
    animTick.value += 1;
    currentIndex.value = index;
};

// 切换密码显示
const togglePassword = () => {
    showPassword.value = !showPassword.value;
};

// 聚焦到指定OTP输入框
const focusOtp = (index) => {
    activeIndex.value = index;
};

// OTP输入处理
const onOtpInput = (index, event) => {
    const value = event.detail.value;
    const digits = String(value || '').split('');

    // 自动填充下一个输入框
    if (digits.length > 1) {
        digits.forEach((digit, i) => {
            if (index + i < otpDigits.value.length) {
                otpDigits.value[index + i] = digit;
            }
        });
        const nextIndex = Math.min(index + digits.length, otpDigits.value.length - 1);
        if (!isOtpComplete.value) activeIndex.value = nextIndex;
    } else {
        otpDigits.value[index] = value;
        if (value && index < otpDigits.value.length - 1) {
            activeIndex.value = index + 1;
        }
    }

    // 如果所有输入框都已填写，自动提交
    if (isOtpComplete.value) {
        // 延迟一点让最后一个输入框先完成渲染
        setTimeout(() => {
            handleStep2();
        }, 100);
    }
};

// OTP聚焦处理
const onOtpFocus = (index) => {
    activeIndex.value = index;
};

// OTP失焦处理
const onOtpBlur = (index) => {
    // 失焦时如果值为空，保持原样
};

// 倒计时
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

// 重新发送OTP
const handleResend = () => {
    if (isResendDisabled.value) {
        return;
    }

    // 调用发送OTP的API
    handleStep1();
    uni.showToast({
        title: t('login.otpResent'),
        icon: 'none',
    });

    // 重新开始倒计时
    startCountdown();
};

// 返回上一页
const goBack = () => {
    if (currentIndex.value === 0) {
        // 第一步，返回到登录页
        uni.navigateBack({
            fail: () => {
                uni.reLaunch({
                    url: '/pages/auth/signin',
                });
            },
        });
    } else {
        // 其他步骤，返回到上一步
        swiperToStep(currentIndex.value - 1);
    }
};

// 组件卸载时清除定时器
onUnmounted(() => {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
});
</script>

<style lang="scss" scoped>
.reset-password-container {
    width: 750rpx;
    max-width: 100%;
    height: 100vh;
    background: #ffffff;
    overflow-x: hidden;
    overflow-y: hidden;
    position: relative;
    box-sizing: border-box;
}

.back-btn {
    position: fixed;
    left: 36rpx;
    width: 72rpx;
    height: 72rpx;
    z-index: 12;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.92);
    border: 1rpx solid rgba(214, 223, 238, 0.95);
    box-shadow: 0 8rpx 20rpx rgba(31, 44, 72, 0.12);
}

.step-host {
    width: 750rpx;
    max-width: 100%;
    height: 100%;
    box-sizing: border-box;
}

.step-page {
    width: 750rpx;
    max-width: 100%;
    min-height: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
    background: #ffffff;
}

.step-anim-left {
    animation: step-slide-in-left 0.28s ease both;
}

.step-anim-right {
    animation: step-slide-in-right 0.28s ease both;
}

@keyframes step-slide-in-left {
    from {
        transform: translateX(56rpx);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes step-slide-in-right {
    from {
        transform: translateX(-56rpx);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.content {
    padding: 0 48rpx;
    padding-top: 170rpx;
    box-sizing: border-box;
    overflow-x: hidden;
}

.title-section {
    margin-bottom: 80rpx;
    text-align: center;

    .main-title {
        font-size: 64rpx;
        font-weight: 600;
        background: linear-gradient(135deg, #2a4eca 0%, #4a6fd4 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 24rpx;
    }

    .sub-title {
        font-size: 28rpx;
        color: #61677d;
        line-height: 1.6;
        opacity: 0.8;
        white-space: normal;
        word-break: break-word;
        overflow-wrap: anywhere;
    }
}

.form-section {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
    margin-bottom: 60rpx;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;

    .form-item {
        width: 100%;
        max-width: 100%;
        height: 120rpx;
        background: #f5f9fe;
        border-radius: 28rpx;
        display: flex;
        align-items: center;
        padding: 0 48rpx;
        box-sizing: border-box;

        .form-input {
            flex: 1;
            width: 0;
            min-width: 0;
            font-size: 32rpx;
            color: #333;
            background: transparent;
        }

        .password-toggle {
            width: 48rpx;
            height: 48rpx;
            display: flex;
            align-items: center;
            justify-content: center;

            image {
                width: 48rpx;
                height: 48rpx;
            }
        }
    }
}

.submit-section {
    .submit-btn {
        width: 100%;
        height: 120rpx;
        background: #3461fd;
        border-radius: 28rpx;
        color: #ffffff;
        font-size: 32rpx;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        transition: all 0.3s;

        &:active {
            opacity: 0.9;
            transform: scale(0.98);
        }

        &[disabled] {
            background: #ccc;
            opacity: 0.6;
        }

        &::after {
            border: none;
        }
    }
}

.otp-section {
    margin-bottom: 80rpx;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;

    .otp-inputs {
        display: flex;
        gap: 12rpx;
        justify-content: space-between;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
    }

    .otp-input-box {
        flex: 1;
        min-width: 0;
        max-width: 96rpx;
        height: 120rpx;
        background: #f5f9fe;
        border-radius: 24rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;

        &.filled {
            background: #3461fd;
            outline: 2rpx solid #3461fd;
            outline-offset: -2rpx;

            .otp-input {
                color: #ffffff;
            }
        }

        .otp-input {
            width: 100%;
            height: 100%;
            font-size: 44rpx;
            font-weight: 600;
            color: #333;
            text-align: center;
            background: transparent;
            border: none;
            outline: none;
        }
    }
}

.resend-section {
    padding: 48rpx;
    text-align: center;
    font-size: 28rpx;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    white-space: normal;
    word-break: break-word;
    overflow-wrap: anywhere;

    .resend-text {
        color: #3b4054;
    }

    .resend-link {
        color: #3461fd;

        &.disabled {
            color: #999;
        }
    }
}

.indicator-wrapper {
    position: fixed;
    bottom: 80rpx;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 16rpx;
    z-index: 10;
}

.indicator-dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    background: rgba(102, 97, 173, 0.4);
    transition: all 0.3s;

    &.active {
        width: 40rpx;
        background: #3461fd;
        border-radius: 8rpx;
    }
}
</style>
