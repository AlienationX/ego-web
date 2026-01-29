<template>
    <view class="signup-container">
        <!-- 主要内容区域 -->
        <view class="content">
            <!-- 标题区域 -->
            <view class="title-section">
                <view class="main-title">Sign Up</view>
                <view class="sub-title">It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum.</view>
            </view>

            <!-- 社交登录按钮 -->
            <view class="social-section">
                <view class="social-buttons">
                    <view class="social-btn" @click="handleGoogleLogin">
                        <image src="/static/icons/brands/google.svg" mode="aspectFit" class="social-icon"></image>
                        <text class="social-text">Google</text>
                    </view>
                    <view class="social-btn" @click="handleFacebookLogin">
                        <image src="/static/icons/brands/facebook.svg" mode="aspectFit" class="social-icon"></image>
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

            <!-- 注册表单 -->
            <view class="form-section">
                <view class="form-item">
                    <input
                        class="form-input"
                        type="text"
                        placeholder="Name"
                        v-model="form.name"
                    />
                </view>

                <view class="form-item">
                    <input
                        class="form-input"
                        type="text"
                        placeholder="Email/Phone Number"
                        v-model="form.email"
                    />
                </view>

                <view class="form-item password-item">
                    <input
                        class="form-input"
                        :type="showPassword ? 'text' : 'password'"
                        placeholder="Password"
                        v-model="form.password"
                    />
                        <view class="password-toggle" @click="togglePassword">
                            <image src="/static/icons/eye-icon.svg" mode="aspectFit"></image>
                        </view>
                </view>
            </view>

            <!-- 协议复选框 -->
            <view class="agreement-section">
                <view class="agreement-content" @click="toggleAgreement">
                    <view class="checkbox-wrapper">
                        <view class="checkbox" :class="{ checked: isAgreed }">
                            <view class="checkbox-inner" v-if="isAgreed">
                                <image src="/static/icons/check-icon.svg" mode="aspectFit"></image>
                            </view>
                        </view>
                    </view>
                    <view class="agreement-text">
                        <text class="normal-text">I'm agree to the </text>
                        <text class="link-text" @click.stop="openTerms">Tarms of Service</text>
                        <text class="normal-text"> and </text>
                        <text class="link-text" @click.stop="openPrivacy">Privasy Policy</text>
                    </view>
                </view>
            </view>

            <!-- 创建账号按钮 -->
            <view class="submit-section">
                <button class="submit-btn" :disabled="!isAgreed || isSubmitting" @click="handleSignup">
                    {{ isSubmitting ? 'Creating...' : 'Creat Account' }}
                </button>
                <view class="login-link">
                    <text class="normal-text">Do you have account? </text>
                    <text class="link-text" @click="goToLogin">Sign In</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
    import { ref, reactive } from 'vue';
    import { useUserStore } from '@/stores/user.js';
    import { apiPostRegister } from '@/api/wallpaper.js';

    const userStore = useUserStore();

    // 表单数据
    const form = reactive({
        name: '',
        email: '',
        password: ''
    });

    // 状态管理
    const showPassword = ref(false);
    const isAgreed = ref(false);
    const isSubmitting = ref(false);

    // 切换密码显示
    const togglePassword = () => {
        showPassword.value = !showPassword.value;
    };

    // 切换协议同意状态
    const toggleAgreement = () => {
        isAgreed.value = !isAgreed.value;
    };

    // 返回上一页
    const goBack = () => {
        uni.navigateBack({
            success: () => {},
            fail: (err) => {
                uni.reLaunch({
                    url: '/pages/index/index'
                });
            }
        });
    };

    // 跳转到登录页
    const goToLogin = () => {
        uni.redirectTo({
            url: '/pages/login/signin'
        });
    };

    // 打开服务条款
    const openTerms = () => {
        // #ifdef MP-WEIXIN
        uni.navigateTo({
            url: '/pages/webview/webview?url=https://yourdomain.com/terms'
        });
        // #endif

        // #ifndef MP-WEIXIN
        uni.navigateTo({
            url: '/pages/notice/detail?id=1&name=服务条款'
        });
        // #endif
    };

    // 打开隐私政策
    const openPrivacy = () => {
        // #ifdef MP-WEIXIN
        uni.navigateTo({
            url: '/pages/webview/webview?url=https://yourdomain.com/privacy'
        });
        // #endif

        // #ifndef MP-WEIXIN
        uni.navigateTo({
            url: '/pages/notice/detail?id=2&name=隐私政策'
        });
        // #endif
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
        if (!form.name || form.name.trim().length < 2) {
            uni.showToast({
                title: 'Please enter your name',
                icon: 'none'
            });
            return false;
        }

        if (!form.email || form.email.trim().length < 5) {
            uni.showToast({
                title: 'Please enter valid email',
                icon: 'none'
            });
            return false;
        }

        if (!form.password || form.password.length < 6) {
            uni.showToast({
                title: 'Password must be at least 6 characters',
                icon: 'none'
            });
            return false;
        }

        return true;
    };

    // 注册处理
    const handleSignup = async () => {
        if (!validateForm()) {
            return;
        }

        if (!isAgreed.value) {
            uni.showToast({
                title: 'Please agree to the terms',
                icon: 'none'
            });
            return;
        }

        isSubmitting.value = true;
        try {
            await apiPostRegister({
                username: form.email,
                email: form.email,
                nickname: form.name,
                password: form.password
            });

            uni.showToast({
                title: 'Registration successful',
                icon: 'success'
            });

            setTimeout(() => {
                uni.redirectTo({
                    url: '/pages/login/login'
                });
            }, 1500);
        } catch (error) {
            uni.showToast({
                title: error.message || 'Registration failed',
                icon: 'none',
                duration: 2000
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
        padding-top: 244rpx;
    }

    .title-section {
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
        margin-top: 60rpx;

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

        .form-item {
            height: 120rpx;
            background: #F5F9FE;
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
            align-items: flex-start;
            gap: 16rpx;

            .checkbox-wrapper {
                flex-shrink: 0;
                padding-top: 4rpx;

                .checkbox {
                    width: 48rpx;
                    height: 48rpx;
                    border: 2rpx solid #D0D5DD;
                    border-radius: 8rpx;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;

                    &.checked {
                        background: #3461FD;
                        border-color: #3461FD;

                        .checkbox-inner {
                            width: 32rpx;
                            height: 32rpx;

                            image {
                                width: 32rpx;
                                height: 32rpx;
                            }
                        }
                    }
                }
            }

            .agreement-text {
                flex: 1;
                font-size: 24rpx;
                line-height: 1.6;

                .normal-text {
                    color: #3B4054;
                }

                .link-text {
                    color: #3461FD;
                }
            }
        }
    }

    .submit-section {
        margin-top: 44rpx;

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

        .login-link {
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
