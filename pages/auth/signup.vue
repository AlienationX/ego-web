<template>
    <view class="signup-container">
        <view class="back-btn" :style="{ top: backTop + 'px' }" @click="goBack">
            <uni-icons type="back" color="#4a5670" size="20"></uni-icons>
        </view>

        <!-- 主要内容区域 -->
        <view class="content">
            <!-- 标题区域 -->
            <view class="title-section">
                <view class="main-title">{{ t('login.signUpTitle') }}</view>
                <view class="sub-title">{{ t('login.signUpSubtitle') }}</view>
            </view>

            <!-- 社交登录按钮 -->
            <view class="social-section">
                <view class="social-buttons">
                    <view class="social-btn" @click="handleGoogleLogin">
                        <image src="/static/icons/brands/google.svg" mode="aspectFit" class="social-icon"></image>
                        <text class="social-text">{{ t('login.google') }}</text>
                    </view>
                    <view class="social-btn" @click="handleFacebookLogin">
                        <image src="/static/icons/brands/facebook.svg" mode="aspectFit" class="social-icon"></image>
                        <text class="social-text">{{ t('login.facebook') }}</text>
                    </view>
                </view>
            </view>

            <!-- 分割线 -->
            <view class="divider">
                <view class="divider-line"></view>
                <text class="divider-text">{{ t('login.or') }}</text>
                <view class="divider-line"></view>
            </view>

            <!-- 注册表单 -->
            <view class="form-section">
                <view class="form-item">
                    <input class="form-input" type="text" :placeholder="t('login.emailPlaceholder')" v-model="form.email" />
                </view>

                <view class="form-item password-item">
                    <input
                        class="form-input"
                        type="text"
                        :password="!showPassword"
                        :placeholder="t('login.passwordPlaceholder')"
                        v-model="form.password"
                    />
                    <view class="password-toggle" @click="togglePassword">
                        <mdi-icon
                            :path="showPassword ? '/static/icons/eye-off.svg' : '/static/icons/eye.svg'"
                            size="20px"
                            color="#94a3b8"
                        ></mdi-icon>
                    </view>
                </view>

                <view class="form-item password-item">
                    <input
                        class="form-input"
                        type="text"
                        :password="!showConfirmPassword"
                        :placeholder="t('login.confirmPasswordPlaceholder')"
                        v-model="form.confirmPassword"
                    />
                    <view class="password-toggle" @click="toggleConfirmPassword">
                        <mdi-icon
                            :path="showConfirmPassword ? '/static/icons/eye-off.svg' : '/static/icons/eye.svg'"
                            size="20px"
                            color="#94a3b8"
                        ></mdi-icon>
                    </view>
                </view>
            </view>

            <!-- 协议复选框 -->
            <view class="agreement-section">
                <view class="agreement-content" @click="toggleAgreement">
                    <view class="checkbox-wrapper">
                        <view class="checkbox" :class="{ checked: isAgreed }">
                            <view class="checkbox-inner" v-if="isAgreed">
                                <uni-icons type="checkmarkempty" color="#ffffff" size="16"></uni-icons>
                            </view>
                        </view>
                    </view>
                    <view class="agreement-text">
                        <text class="normal-text">{{ t('login.agreePrefix') }}</text>
                        <text class="link-text" @click.stop="openTerms">{{ t('login.termsOfService') }}</text>
                        <text class="normal-text"> {{ t('login.and') }} </text>
                        <text class="link-text" @click.stop="openPrivacy">{{ t('login.privacyPolicy') }}</text>
                    </view>
                </view>
            </view>

            <!-- 创建账号按钮 -->
            <view class="submit-section">
                <button class="submit-btn" :disabled="!isAgreed || isSubmitting" @click="handleSignup">
                    {{ isSubmitting ? t('login.creating') : t('login.createAccount') }}
                </button>
                <view class="login-link">
                    <text class="normal-text">{{ t('login.haveAccount') }}</text>
                    <text class="link-text" @click="goToLogin">{{ t('login.login') }}</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiPostRegister } from '@/api/wallpaper.js';
import { getStatusBarHeight } from '@/utils/system.js';
const { t } = useI18n();

// 表单数据
const form = reactive({
    email: '',
    password: '',
    confirmPassword: '',
});

// 状态管理
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isAgreed = ref(false);
const isSubmitting = ref(false);
const backTop = ref((getStatusBarHeight() || 0) + 10);

// 切换密码显示
const togglePassword = () => {
    showPassword.value = !showPassword.value;
};
const toggleConfirmPassword = () => {
    showConfirmPassword.value = !showConfirmPassword.value;
};

// 切换协议同意状态
const toggleAgreement = () => {
    isAgreed.value = !isAgreed.value;
};

// 跳转到登录页
const goToLogin = () => {
    uni.navigateTo({
        url: '/pages/auth/signin',
    });
};

const goBack = () => {
    uni.navigateBack({
        fail: () => uni.reLaunch({ url: '/pages/app/index' }),
    });
};

// 打开服务条款
const openTerms = () => {
    uni.navigateTo({
        url: '/pages/webview/webview?url=user_agreement',
    });
};

// 打开隐私政策
const openPrivacy = () => {
    uni.navigateTo({
        url: '/pages/webview/webview?url=privacy_agreement',
    });
};

// Facebook登录
const handleFacebookLogin = () => {
    uni.showToast({
        title: t('login.facebookLoginTip'),
        icon: 'none',
    });
};

// Google登录
const handleGoogleLogin = () => {
    uni.showToast({
        title: t('login.googleLoginTip'),
        icon: 'none',
    });
};

// 表单验证
const validateForm = () => {
    const email = form.email.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!email) {
        uni.showToast({
            title: t('login.emailError'),
            icon: 'none',
        });
        return false;
    }

    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailReg.test(email)) {
        uni.showToast({
            title: t('login.emailError'),
            icon: 'none',
        });
        return false;
    }

    if (!password || password.length < 6) {
        uni.showToast({
            title: t('login.passwordError'),
            icon: 'none',
        });
        return false;
    }

    // 至少包含字母和数字，提升密码有效性
    const passwordReg = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!passwordReg.test(password)) {
        uni.showToast({
            title: t('login.passwordRuleError'),
            icon: 'none',
        });
        return false;
    }

    if (password !== confirmPassword) {
        uni.showToast({
            title: t('login.confirmPasswordError'),
            icon: 'none',
        });
        return false;
    }

    return true;
};

// 注册处理
const handleSignup = async () => {
    if (isSubmitting.value) return;
    if (!validateForm()) {
        return;
    }

    if (!isAgreed.value) {
        uni.showToast({
            title: t('login.agreeRequired'),
            icon: 'none',
        });
        return;
    }

    isSubmitting.value = true;
    try {
        await apiPostRegister({
            username: form.email.trim(),
            email: form.email.trim(),
            nickname: form.email.trim().split('@')[0] || form.email.trim(),
            password: form.password,
        });

        uni.showToast({
            title: t('login.registerSuccess'),
            icon: 'none',
        });

        setTimeout(() => {
            uni.redirectTo({
                url: '/pages/auth/signin',
            });
        }, 1500);
    } catch (error) {
        uni.showToast({
            title: error.message || t('login.registerFailed'),
            icon: 'none',
            duration: 2000,
        });
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<style lang="scss" scoped>
.signup-container {
    min-height: 100vh;
    background: #ffffff;
    overflow: hidden;
}

.back-btn {
    position: fixed;
    left: 36rpx;
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.92);
    border: 1rpx solid rgba(214, 223, 238, 0.95);
    box-shadow: 0 8rpx 20rpx rgba(31, 44, 72, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 12;
}

.status-bar-placeholder {
    width: 100%;
    background: #ffffff;
}

.top-nav {
    width: 100%;
    background: #ffffff;
    padding: 0 48rpx;

    .nav-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 100%;

        .nav-left,
        .nav-right {
            display: flex;
            align-items: center;
            gap: 24rpx;
        }

        .nav-icon {
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

.content {
    padding: 0 48rpx;
    padding-top: 170rpx;
}

.title-section {
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
    }
}

.social-section {
    margin-top: 60rpx;

    .social-buttons {
        display: flex;
        gap: 24rpx;
    }

    .social-btn {
        flex: 1;
        height: 112rpx;
        background: #f5f9fe;
        border-radius: 28rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16rpx;
        transition: all 0.3s;

        &:active {
            opacity: 0.8;
            transform: scale(0.98);
        }

        .social-icon {
            width: 48rpx;
            height: 48rpx;
        }

        .social-text {
            font-size: 32rpx;
            font-weight: 500;
            color: #61677d;
        }
    }
}

.divider {
    display: flex;
    align-items: center;
    margin: 44rpx 0;

    .divider-line {
        flex: 1;
        height: 1rpx;
        background: #e0e5ec;
    }

    .divider-text {
        margin: 0 24rpx;
        font-size: 28rpx;
        color: #262626;
    }
}

.form-section {
    display: flex;
    flex-direction: column;
    gap: 24rpx;

    .form-item {
        height: 120rpx;
        background: #f5f9fe;
        border-radius: 28rpx;
        display: flex;
        align-items: center;
        padding: 0 48rpx;
        position: relative;

        &.password-item {
            padding-right: 48rpx;
        }

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

.agreement-section {
    margin-top: 44rpx;

    .agreement-content {
        display: flex;
        align-items: center;
        gap: 16rpx;

        .checkbox-wrapper {
            flex-shrink: 0;

            .checkbox {
                width: 32rpx;
                height: 32rpx;
                border: 2rpx solid #d0d5dd;
                border-radius: 8rpx;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;

                &.checked {
                    background: #3461fd;
                    border-color: #3461fd;

                    .checkbox-inner {
                        width: 32rpx;
                        height: 32rpx;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                }
            }
        }

        .agreement-text {
            flex: 1;
            font-size: 24rpx;
            line-height: 1.6;

            .normal-text {
                color: #3b4054;
            }

            .link-text {
                color: #3461fd;
            }
        }
    }
}

.submit-section {
    margin-top: 44rpx;

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
        margin-bottom: 32rpx;

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

    .login-link {
        text-align: center;
        font-size: 28rpx;

        .normal-text {
            color: #3b4054;
        }

        .link-text {
            color: #3461fd;
        }
    }
}
</style>
