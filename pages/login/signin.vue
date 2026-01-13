<template>
    <view class="signin-container">
        <!-- <menu-bar :showBorder="false">
            <template #title>{{ t('feedback.title') }}</template>
        </menu-bar> -->
        
        <!-- 内容区域 -->
        <view class="content">
            <view class="goBack" :style="{ top: getGoBackButtonTop() + 'px' }" @click="goBack">
                <uni-icons type="back" color="#e5e5e5" size="20"></uni-icons>
            </view>
            
            <!-- 标题区域 -->
            <view class="title-section">
                <view class="main-title">Sign In</view>
                <view class="sub-title">It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum.</view>
            </view>

            <!-- 社交登录按钮 -->
            <view class="social-section">
                <view class="social-buttons">
                    <view class="social-btn" @click="handleGoogleLogin">
                        <image src="/common/icons/brands/google.svg" mode="aspectFit" class="social-icon"></image>
                        <text class="social-text">Google</text>
                    </view>
                    <view class="social-btn" @click="handleFacebookLogin">
                        <image src="/common/icons/brands/facebook.svg" mode="aspectFit" class="social-icon"></image>
                        <text class="social-text">Facebook</text>
                    </view>
                </view>
            </view>

            <!-- 分割线 -->
            <view class="divider">
                <view class="divider-line"></view>
                <text class="divider-text">Or</text>
                <view class="divider-line"></view>
            </view>

            <!-- 登录表单 -->
            <view class="form-section">
                <view class="form-item">
                    <input
                        class="form-input"
                        type="text"
                        placeholder="Email"
                        v-model="form.email"
                    />
                </view>

                <view class="form-item password-item" :class="{ focused: passwordFocused }">
                    <input
                        class="form-input"
                        :type="showPassword ? 'text' : 'password'"
                        placeholder="Password"
                        v-model="form.password"
                        @focus="passwordFocused = true"
                        @blur="passwordFocused = false"
                    />
                        <view class="password-toggle" @click="togglePassword">
                            <image src="/common/icons/eye-icon.svg" mode="aspectFit"></image>
                        </view>
                </view>
                <view class="forgot-password" @click="handleForgotPassword">
                    <text>Forget Password?</text>
                </view>
            </view>

            <!-- 登录按钮 -->
            <view class="submit-section">
                <button class="submit-btn" :disabled="isSubmitting" @click="handleLogin">
                    {{ isSubmitting ? 'Logging...' : 'Log In' }}
                </button>
                <view class="signup-link">
                    <text class="normal-text">Don't have account? </text>
                    <text class="link-text" @click="goToSignup">Sign Up</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
    import { ref, reactive } from 'vue';
    import { useUserStore } from '@/stores/user.js';
    import { apiPostLogin } from '@/api/wallpaper.js';
    import { getStatusBarHeight } from '@/utils/system.js';

    const userStore = useUserStore();

    // 表单数据
    const form = reactive({
        email: '',
        password: ''
    });

    // 状态管理
    const showPassword = ref(false);
    const passwordFocused = ref(false);
    const isSubmitting = ref(false);

    // 切换密码显示
    const togglePassword = () => {
        showPassword.value = !showPassword.value;
    };

    // 忘记密码
    const handleForgotPassword = () => {
        uni.navigateTo({
            url: '/pages/login/forget-password'
        });
    };

    // Facebook登录
    const handleFacebookLogin = () => {
        uni.showToast({
            title: 'Facebook login',
            icon: 'none'
        });
    };

    // Google登录
    const handleGoogleLogin = () => {
        uni.showToast({
            title: 'Google login',
            icon: 'none'
        });
    };

    // 表单验证
    const validateForm = () => {
        if (!form.email || form.email.trim().length < 5) {
            uni.showToast({
                title: 'Please enter valid email',
                icon: 'none'
            });
            return false;
        }

        if (!form.password || form.password.length < 6) {
            uni.showToast({
                title: 'Please enter password',
                icon: 'none'
            });
            return false;
        }

        return true;
    };

    // 登录处理
    const handleLogin = async () => {
        if (!validateForm()) {
            return;
        }

        isSubmitting.value = true;
        try {
            const res = await apiPostLogin({
                username: form.email,
                password: form.password
            });

            const { access, refresh } = res.data;
            userStore.setToken(access, refresh);
            await userStore.setUserInfo();

            uni.showToast({
                title: 'Login successful',
                icon: 'success'
            });

            setTimeout(() => {
                uni.reLaunch({
                    url: '/pages/index/index'
                });
            }, 1500);
        } catch (error) {
            uni.showToast({
                title: error.message || 'Login failed',
                icon: 'none',
                duration: 2000
            });
        } finally {
            isSubmitting.value = false;
        }
    };

    // 跳转到注册页
    const goToSignup = () => {
        uni.redirectTo({
            url: '/pages/login/signup'
        });
    };
    
    // 返回按钮高度
    const getGoBackButtonTop = () => {
        if (getStatusBarHeight() === 0) {
            return 24;
        }
        return getStatusBarHeight();
    };
    const goBack = () => {
        uni.navigateBack({
            success: () => {},
            fail: (err) => {
                // 返回失败，直接跳转回首页
                uni.reLaunch({
                    url: '/pages/index/index'
                });
            }
        });
    };
</script>

<style lang="scss" scoped>
    .signin-container {
        min-height: 100vh;
        background: #ffffff;
        padding: 0 48rpx;
    }

    .content {
        // padding-top: 244rpx;
        
        .goBack {
            width: 38px;
            height: 38px;
            background: rgba(0, 0, 0, 0.5);
            left: 30rpx;
            margin-left: 0;
            border-radius: 100rpx;
            backdrop-filter: blur(10rpx);
            border-radius: 1rpx solid rgba(255, 255, 255, 0.3);
            display: flex;
            justify-content: center;
            align-items: center;
        }
    }

    .title-section {
        margin-bottom: 60rpx;
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

    .social-section {
        margin-bottom: 44rpx;

        .social-buttons {
            display: flex;
            gap: 24rpx;
        }

        .social-btn {
            flex: 1;
            height: 112rpx;
            background: #F5F9FE;
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
                color: #61677D;
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
            background: #E0E5EC;
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

            &.password-item {
                padding-right: 48rpx;

                &.focused {
                    outline: 2rpx solid #3461FD;
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
            padding-right: 24rpx;

            text {
                font-size: 24rpx;
                color: #7C8BA0;
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
                color: #3B4054;
            }

            .link-text {
                color: #3461FD;
            }
        }
    }
</style>
