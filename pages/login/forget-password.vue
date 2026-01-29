<template>
    <view class="reset-password-container">
        <!-- 返回按钮 -->
        <view class="back-btn" @click="goBack">
            <image src="/static/icons/arrow-left.svg" mode="aspectFit"></image>
        </view>

        <swiper
            class="swiper"
            :indicator-dots="false"
            :autoplay="false"
            :circular="false"
            :duration="300"
            :current="currentIndex"
            @change="onSwiperChange"
        >
            <!-- 第一步：忘记密码 -->
            <swiper-item class="swiper-item">
                <view class="step-page">
                    <view class="content">
                        <!-- 标题区域 -->
                        <view class="title-section">
                            <view class="main-title">Forget Password</view>
                            <view class="sub-title">Enter your email or phone number to reset your password</view>
                        </view>

                        <!-- 输入表单 -->
                        <view class="form-section">
                            <view class="form-item">
                                <input
                                    class="form-input"
                                    type="text"
                                    placeholder="Email or Phone Number"
                                    v-model="step1Form.contact"
                                />
                            </view>
                        </view>

                        <!-- 发送按钮 -->
                        <view class="submit-section">
                            <button class="submit-btn" :disabled="isSubmitting" @click="handleStep1">
                                {{ isSubmitting ? 'Sending...' : 'Send' }}
                            </button>
                        </view>
                    </view>
                </view>
            </swiper-item>

            <!-- 第二步：验证OTP -->
            <swiper-item class="swiper-item">
                <view class="step-page">
                    <view class="content">
                        <!-- 标题区域 -->
                        <view class="title-section">
                            <view class="main-title">Enter OTP</view>
                            <view class="sub-title">Enter OTP code we just sent you on your registered Email/Phone number</view>
                        </view>

                        <!-- OTP输入框 -->
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
                                        v-model="otpDigits[index]"
                                        type="tel"
                                        maxlength="1"
                                        class="otp-input"
                                        @input="onOtpInput(index, $event)"
                                        @focus="onOtpFocus(index)"
                                        @blur="onOtpBlur(index)"
                                    />
                                </view>
                            </view>
                        </view>

                        <!-- 验证按钮 -->
                        <view class="submit-section">
                            <button class="submit-btn" :disabled="!isOtpComplete || isSubmitting" @click="handleStep2">
                                {{ isSubmitting ? 'Verifying...' : 'Verify' }}
                            </button>
                        </view>

                        <!-- 重新发送OTP -->
                        <view class="resend-section">
                            <text class="resend-text">Didn't get OTP? </text>
                            <text class="resend-link" :class="{ disabled: isResendDisabled }" @click="handleResend">
                                {{ isResendDisabled ? `Resend in ${countdown}s` : 'Resend OTP' }}
                            </text>
                        </view>
                    </view>
                </view>
            </swiper-item>

            <!-- 第三步：重置密码 -->
            <swiper-item class="swiper-item">
                <view class="step-page">
                    <view class="content">
                        <!-- 标题区域 -->
                        <view class="title-section">
                            <view class="main-title">Reset Password</view>
                            <view class="sub-title">Enter your new password</view>
                        </view>

                        <!-- 密码表单 -->
                        <view class="form-section">
                            <view class="form-item">
                                <input
                                    class="form-input"
                                    :type="showPassword ? 'text' : 'password'"
                                    placeholder="New Password"
                                    v-model="step3Form.newPassword"
                                />
                                <view class="password-toggle" @click="togglePassword">
                                    <image src="/static/icons/eye-icon.svg" mode="aspectFit"></image>
                                </view>
                            </view>

                            <view class="form-item">
                                <input
                                    class="form-input"
                                    type="password"
                                    placeholder="Confirm Password"
                                    v-model="step3Form.confirmPassword"
                                />
                            </view>
                        </view>

                        <!-- 确认按钮 -->
                        <view class="submit-section">
                            <button class="submit-btn" :disabled="isSubmitting" @click="handleStep3">
                                {{ isSubmitting ? 'Resetting...' : 'Reset Password' }}
                            </button>
                        </view>
                    </view>
                </view>
            </swiper-item>
        </swiper>

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
    import { ref, computed, onMounted, onUnmounted } from 'vue';

    const currentIndex = ref(0);
    const isSubmitting = ref(false);
    const showPassword = ref(false);
    const isResendDisabled = ref(false);
    const countdown = ref(60);
    let timer = null;

    // 第一步表单
    const step1Form = ref({
        contact: ''
    });

    // 第三步表单
    const step3Form = ref({
        newPassword: '',
        confirmPassword: ''
    });

    // OTP数据
    const otpDigits = ref(['', '', '', '']);
    const activeIndex = ref(0);

    // 计算OTP是否完整
    const isOtpComplete = computed(() => {
        return otpDigits.value.every(digit => digit !== '');
    });

    // Swiper切换事件
    const onSwiperChange = (e) => {
        currentIndex.value = e.detail.current;

        // 切换到第二步（OTP）时开始倒计时
        if (currentIndex.value === 1 && !isResendDisabled.value) {
            startCountdown();
        }
    };

    // 第一步：发送OTP
    const handleStep1 = async () => {
        if (!step1Form.value.contact || step1Form.value.contact.trim().length < 5) {
            uni.showToast({
                title: 'Please enter email or phone number',
                icon: 'none'
            });
            return;
        }

        isSubmitting.value = true;
        try {
            // 调用发送OTP的API
            // await apiSendOtp({ contact: step1Form.value.contact });

            uni.showToast({
                title: 'OTP sent successfully',
                icon: 'success'
            });

            // 自动跳转到下一步
            setTimeout(() => {
                swiperToStep(1);
            }, 1500);
        } catch (error) {
            uni.showToast({
                title: error.message || 'Failed to send OTP',
                icon: 'none',
                duration: 2000
            });
        } finally {
            isSubmitting.value = false;
        }
    };

    // 第二步：验证OTP
    const handleStep2 = async () => {
        if (!isOtpComplete.value) {
            uni.showToast({
                title: 'Please enter complete OTP',
                icon: 'none'
            });
            return;
        }

        const otp = otpDigits.value.join('');

        isSubmitting.value = true;
        try {
            // 调用验证OTP的API
            // await apiVerifyOtp({ otp });

            uni.showToast({
                title: 'OTP verified successfully',
                icon: 'success'
            });

            // 验证成功后，自动跳转到下一步
            setTimeout(() => {
                swiperToStep(2);
            }, 1500);
        } catch (error) {
            uni.showToast({
                title: error.message || 'Invalid OTP',
                icon: 'none',
                duration: 2000
            });
        } finally {
            isSubmitting.value = false;
        }
    };

    // 第三步：重置密码
    const handleStep3 = async () => {
        if (!step3Form.value.newPassword || step3Form.value.newPassword.length < 6) {
            uni.showToast({
                title: 'Password must be at least 6 characters',
                icon: 'none'
            });
            return;
        }

        if (step3Form.value.newPassword !== step3Form.value.confirmPassword) {
            uni.showToast({
                title: 'Passwords do not match',
                icon: 'none'
            });
            return;
        }

        isSubmitting.value = true;
        try {
            // 调用重置密码的API
            // await apiResetPassword({ password: step3Form.value.newPassword });

            uni.showToast({
                title: 'Password reset successfully',
                icon: 'success'
            });

            // 重置成功后，跳转到登录页
            setTimeout(() => {
                uni.reLaunch({
                    url: '/pages/login/signin'
                });
            }, 1500);
        } catch (error) {
            uni.showToast({
                title: error.message || 'Failed to reset password',
                icon: 'none',
                duration: 2000
            });
        } finally {
            isSubmitting.value = false;
        }
    };

    // 切换到指定步骤
    const swiperToStep = (index) => {
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
        const digits = value.split('');

        // 自动填充下一个输入框
        if (digits.length > 1) {
            digits.forEach((digit, i) => {
                if (index + i < otpDigits.value.length) {
                    otpDigits.value[index + i] = digit;
                }
            });
        } else {
            otpDigits.value[index] = value;
        }

        // 自动跳转到下一个输入框
        if (value && index < otpDigits.value.length - 1) {
            activeIndex.value = index + 1;
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
        isResendDisabled.value = true;
        countdown.value = 60;

        timer = setInterval(() => {
            countdown.value--;
            if (countdown.value <= 0) {
                clearInterval(timer);
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
        uni.showToast({
            title: 'OTP resent',
            icon: 'success'
        });

        // 重新开始倒计时
        startCountdown();
    };

    // 返回上一页
    const goBack = () => {
        if (currentIndex.value === 0) {
            // 第一步，返回到登录页
            uni.navigateBack();
        } else {
            // 其他步骤，返回到上一步
            swiperToStep(currentIndex.value - 1);
        }
    };

    // 组件卸载时清除定时器
    onUnmounted(() => {
        if (timer) {
            clearInterval(timer);
        }
    });
</script>

<style lang="scss" scoped>
    .reset-password-container {
        width: 100%;
        height: 100vh;
        background: #ffffff;
        overflow: hidden;
        position: relative;
    }

    .back-btn {
        position: fixed;
        top: 88rpx;
        left: 48rpx;
        width: 48rpx;
        height: 48rpx;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;

        image {
            width: 48rpx;
            height: 48rpx;
        }
    }

    .swiper {
        width: 100%;
        height: 100%;
    }

    .swiper-item {
        width: 100%;
        height: 100%;
    }

    .step-page {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .content {
        width: 100%;
        padding: 0 48rpx;
        padding-top: 160rpx;
    }

    .title-section {
        margin-bottom: 80rpx;
        text-align: center;

        .main-title {
            font-size: 64rpx;
            font-weight: 600;
            background: linear-gradient(135deg, #2A4ECA 0%, #4A6FD4 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 24rpx;
        }

        .sub-title {
            font-size: 28rpx;
            color: #61677D;
            line-height: 1.6;
            opacity: 0.8;
        }
    }

    .form-section {
        display: flex;
        flex-direction: column;
        gap: 24rpx;
        margin-bottom: 60rpx;

        .form-item {
            height: 120rpx;
            background: #F5F9FE;
            border-radius: 28rpx;
            display: flex;
            align-items: center;
            padding: 0 48rpx;

            .form-input {
                flex: 1;
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
            background: #3461FD;
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

        .otp-inputs {
            display: flex;
            gap: 24rpx;
            justify-content: center;
        }

        .otp-input-box {
            width: 112rpx;
            height: 140rpx;
            background: #F5F9FE;
            border-radius: 24rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;

            &.filled {
                background: #3461FD;
                outline: 2rpx solid #3461FD;
                outline-offset: -2rpx;

                .otp-input {
                    color: #ffffff;
                }
            }

            .otp-input {
                width: 100%;
                height: 100%;
                font-size: 48rpx;
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
        text-align: center;
        font-size: 28rpx;

        .resend-text {
            color: #3B4054;
        }

        .resend-link {
            color: #3461FD;

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
            background: #3461FD;
            border-radius: 8rpx;
        }
    }
</style>
