<template>
    <view class="signin-container">
        <view class="back-btn" :style="{ top: backTop + 'px' }" @click="goBack">
            <uni-icons type="back" color="#4a5670" size="20"></uni-icons>
        </view>

        <!-- 内容区域 -->
        <view class="content">
            <!-- 标题区域 -->
            <view class="title-section">
                <view class="main-title">{{ t('login.signInTitle') }}</view>
                <view class="sub-title">{{ t('login.signInSubtitle') }}</view>
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

            <!-- 登录表单 -->
            <view class="form-section">
                <view class="form-item">
                    <input class="form-input" type="text" :placeholder="t('login.emailPlaceholder')" v-model="form.email" />
                </view>

                <view class="form-item password-item" :class="{ focused: passwordFocused }">
                    <input
                        class="form-input"
                        :type="showPassword ? 'text' : 'password'"
                        :placeholder="t('login.passwordPlaceholder')"
                        v-model="form.password"
                        @focus="passwordFocused = true"
                        @blur="passwordFocused = false"
                    />
                    <view class="password-toggle" @click="togglePassword">
                        <image src="/static/icons/eye-icon.svg" mode="aspectFit"></image>
                    </view>
                </view>
                <view class="form-options">
                    <view class="remember-option" @click="toggleRememberPassword">
                        <view class="remember-checkbox" :class="{ checked: rememberPassword }">
                            <view class="remember-dot"></view>
                        </view>
                        <text class="remember-text">{{ t('login.rememberPassword') }}</text>
                    </view>
                    <view class="forgot-password" @click="handleForgotPassword">
                        <text>{{ t('login.forgotPassword') }}</text>
                    </view>
                </view>
            </view>

            <!-- 登录按钮 -->
            <view class="submit-section">
                <button class="submit-btn" :disabled="isSubmitting" @click="handleLogin">
                    {{ isSubmitting ? t('login.loggingIn') : t('login.login') }}
                </button>
                <view class="signup-link">
                    <text class="normal-text">{{ t('login.noAccount') }}</text>
                    <text class="link-text" @click="goToSignup">{{ t('login.register') }}</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user.js';
import { apiPostLogin } from '@/api/wallpaper.js';
import { getStatusBarHeight } from '@/utils/system.js';

const { t } = useI18n();
const userStore = useUserStore();
const backTop = ref((getStatusBarHeight() || 0) + 10);
const REMEMBER_STORAGE_KEY = 'signinRemember';

// 表单数据
const form = reactive({
    email: '',
    password: '',
});

// 状态管理
const showPassword = ref(false);
const passwordFocused = ref(false);
const isSubmitting = ref(false);
const rememberPassword = ref(false);

onMounted(() => {
    const saved = uni.getStorageSync(REMEMBER_STORAGE_KEY);
    if (!saved || typeof saved !== 'object') return;
    rememberPassword.value = !!saved.remember;
    if (rememberPassword.value) {
        form.email = saved.email || '';
        form.password = saved.password || '';
    }
});

// 切换密码显示
const togglePassword = () => {
    showPassword.value = !showPassword.value;
};

const toggleRememberPassword = () => {
    rememberPassword.value = !rememberPassword.value;
    if (!rememberPassword.value) {
        uni.removeStorageSync(REMEMBER_STORAGE_KEY);
    }
};

// 忘记密码
const handleForgotPassword = () => {
    uni.navigateTo({
        url: '/pages/auth/forget-password',
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
    if (!form.email || form.email.trim().length < 5) {
        uni.showToast({
            title: t('login.emailError'),
            icon: 'none',
        });
        return false;
    }

    if (!form.password || form.password.length < 6) {
        uni.showToast({
            title: t('login.passwordError'),
            icon: 'none',
        });
        return false;
    }

    return true;
};

// 登录处理
const handleLogin = async () => {
    if (isSubmitting.value) return;
    if (!validateForm()) {
        return;
    }

    isSubmitting.value = true;
    try {
        const res = await apiPostLogin({
            email: form.email.trim(),
            password: form.password,
        });

        const { access, refresh } = res.data;
        userStore.setToken(access, refresh);
        await userStore.setUserInfo();

        if (rememberPassword.value) {
            uni.setStorageSync(REMEMBER_STORAGE_KEY, {
                remember: true,
                email: form.email.trim(),
                password: form.password,
            });
        } else {
            uni.removeStorageSync(REMEMBER_STORAGE_KEY);
        }

        uni.showToast({
            title: t('login.loginSuccess'),
            icon: 'success',
        });

        setTimeout(() => {
            uni.reLaunch({
                url: '/pages/user/user',
            });
        }, 1500);
    } catch (error) {
        uni.showToast({
            title: error.message || t('login.loginFailed'),
            icon: 'none',
            duration: 2000,
        });
    } finally {
        isSubmitting.value = false;
    }
};

// 跳转到注册页
const goToSignup = () => {
    uni.navigateTo({
        url: '/pages/auth/signup',
    });
};

const goBack = () => {
    uni.navigateBack({
        fail: () => uni.reLaunch({ url: '/pages/app/index' }),
    });
};
</script>

<style lang="scss" scoped>
.signin-container {
    min-height: 100vh;
    background: #ffffff;
    padding: 0 48rpx;
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

.content {
    padding-top: 170rpx;
}

.title-section {
    margin-bottom: 60rpx;
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
    margin-bottom: 44rpx;

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
    margin-bottom: 44rpx;

    .form-item {
        height: 120rpx;
        background: #f5f9fe;
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

        &.password-item {
            padding-right: 48rpx;

            &.focused {
                outline: 2rpx solid #3461fd;
                outline-offset: -2rpx;
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

    .forgot-password {
        text-align: right;

        text {
            font-size: 24rpx;
            color: #7c8ba0;
        }
    }

    .form-options {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 8rpx;
    }

    .remember-option {
        display: flex;
        align-items: center;
        gap: 12rpx;
    }

    .remember-checkbox {
        width: 32rpx;
        height: 32rpx;
        border-radius: 50%;
        border: 2rpx solid #c8d3e7;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;

        .remember-dot {
            width: 16rpx;
            height: 16rpx;
            border-radius: 50%;
            background: transparent;
        }

        &.checked {
            border-color: #3461fd;

            .remember-dot {
                background: #3461fd;
            }
        }
    }

    .remember-text {
        font-size: 24rpx;
        color: #7c8ba0;
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

    .signup-link {
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
