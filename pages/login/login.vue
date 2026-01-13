<template>
    <view class="layout">
        <menu-bar>
            <template #title>{{ isLogin ? t('login.title') : t('login.register') }}</template>
        </menu-bar>

        <view class="container">
            <!-- Logo区域 -->
            <view class="logo-section">
                <view class="logo-wrapper">
                    <image class="logo" src="/static/logo.svg" mode="aspectFit"></image>
                </view>
                <view class="app-name">{{ t('common.appName') }}</view>
            </view>

            <!-- 切换标签 -->
            <view class="tab-wrapper">
                <view 
                    class="tab-item" 
                    :class="{ active: isLogin }"
                    @click="switchToLogin"
                >
                    <text class="tab-text">{{ t('login.login') }}</text>
                    <view class="tab-indicator" v-if="isLogin"></view>
                </view>
                <view 
                    class="tab-item" 
                    :class="{ active: !isLogin }"
                    @click="switchToRegister"
                >
                    <text class="tab-text">{{ t('login.register') }}</text>
                    <view class="tab-indicator" v-if="!isLogin"></view>
                </view>
            </view>

            <!-- 登录表单 -->
            <view class="form-wrapper" v-if="isLogin">
                <view class="form-item">
                    <view class="input-wrapper">
                        <uni-icons class="input-icon" type="person" size="20" color="#999"></uni-icons>
                        <input 
                            class="input" 
                            type="text" 
                            :placeholder="t('login.usernamePlaceholder')"
                            v-model="loginForm.username"
                            :adjust-position="true"
                        />
                    </view>
                </view>

                <view class="form-item">
                    <view class="input-wrapper">
                        <uni-icons class="input-icon" type="locked" size="20" color="#999"></uni-icons>
                        <input 
                            class="input" 
                            :type="showLoginPassword ? 'text' : 'password'"
                            :placeholder="t('login.passwordPlaceholder')"
                            v-model="loginForm.password"
                            :adjust-position="true"
                        />
                        <view class="password-toggle" @click="togglePasswordVisibility('login')">
                            <uni-icons 
                                :type="showLoginPassword ? 'eye-slash' : 'eye'" 
                                size="20" 
                                color="#999"
                            ></uni-icons>
                        </view>
                    </view>
                </view>

                <view class="form-options">
                    <view class="remember-me">
                        <checkbox-group @change="onRememberChange">
                            <label class="checkbox-label">
                                <checkbox value="remember" :checked="rememberMe" />
                                <text>{{ t('login.rememberMe') }}</text>
                            </label>
                        </checkbox-group>
                    </view>
                    <view class="forgot-password" @click="handleForgotPassword">
                        {{ t('login.forgotPassword') }}
                    </view>
                </view>

                <button 
                    class="submit-btn" 
                    :disabled="isSubmitting"
                    @click="handleLogin"
                >
                    {{ isSubmitting ? t('login.loggingIn') : t('login.login') }}
                </button>
            </view>

            <!-- 注册表单 -->
            <view class="form-wrapper" v-else>
                <view class="form-item">
                    <view class="input-wrapper">
                        <uni-icons class="input-icon" type="person" size="20" color="#999"></uni-icons>
                        <input 
                            class="input" 
                            type="text" 
                            :placeholder="t('login.usernamePlaceholder')"
                            v-model="registerForm.username"
                            :adjust-position="true"
                        />
                    </view>
                    <view class="error-text" v-if="registerErrors.username">
                        {{ registerErrors.username }}
                    </view>
                </view>

                <view class="form-item">
                    <view class="input-wrapper">
                        <uni-icons class="input-icon" type="email" size="20" color="#999"></uni-icons>
                        <input 
                            class="input" 
                            type="text" 
                            :placeholder="t('login.emailPlaceholder')"
                            v-model="registerForm.email"
                            :adjust-position="true"
                        />
                    </view>
                    <view class="error-text" v-if="registerErrors.email">
                        {{ registerErrors.email }}
                    </view>
                </view>

                <view class="form-item">
                    <view class="input-wrapper">
                        <uni-icons class="input-icon" type="locked" size="20" color="#999"></uni-icons>
                        <input 
                            class="input" 
                            :type="showRegisterPassword ? 'text' : 'password'"
                            :placeholder="t('login.passwordPlaceholder')"
                            v-model="registerForm.password"
                            :adjust-position="true"
                        />
                        <view class="password-toggle" @click="togglePasswordVisibility('register')">
                            <uni-icons 
                                :type="showRegisterPassword ? 'eye-slash' : 'eye'" 
                                size="20" 
                                color="#999"
                            ></uni-icons>
                        </view>
                    </view>
                    <view class="error-text" v-if="registerErrors.password">
                        {{ registerErrors.password }}
                    </view>
                </view>

                <view class="form-item">
                    <view class="input-wrapper">
                        <uni-icons class="input-icon" type="locked" size="20" color="#999"></uni-icons>
                        <input 
                            class="input" 
                            type="password" 
                            :placeholder="t('login.confirmPasswordPlaceholder')"
                            v-model="registerForm.confirmPassword"
                            :adjust-position="true"
                        />
                    </view>
                    <view class="error-text" v-if="registerErrors.confirmPassword">
                        {{ registerErrors.confirmPassword }}
                    </view>
                </view>

                <button 
                    class="submit-btn" 
                    :disabled="isSubmitting"
                    @click="handleRegister"
                >
                    {{ isSubmitting ? t('login.registering') : t('login.register') }}
                </button>
            </view>

            <!-- 分割线 -->
            <view class="divider">
                <view class="divider-line"></view>
                <text class="divider-text">{{ t('login.or') }}</text>
                <view class="divider-line"></view>
            </view>

            <!-- 第三方登录 -->
            <view class="social-login">
                <!-- <view class="social-title">{{ t('login.socialLogin') }}</view> -->
                <view class="social-buttons">
                    <view class="social-btn wechat" @click="handleWechatLogin">
                        <image class="social-icon" src="/common/icons/brands/wechat.svg" mode="aspectFit"></image>
                        <text class="social-text">{{ t('login.wechat') }}</text>
                    </view>
                    <view class="social-btn google" @click="handleGoogleLogin">
                        <image class="social-icon" src="/common/icons/brands/google.svg" mode="aspectFit"></image>
                        <text class="social-text">{{ t('login.google') }}</text>
                    </view>
                    <view class="social-btn apple" @click="handleAppleLogin">
                        <image class="social-icon" src="/common/icons/brands/apple.svg" mode="aspectFit"></image>
                        <text class="social-text">{{ t('login.apple') }}</text>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
    import { ref, reactive } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useUserStore } from '@/stores/user';
    import { apiPostLogin, apiPostRegister, apiPostLoginByWechat } from '@/api/wallpaper.js';

    const { t } = useI18n();
    const userStore = useUserStore();

    // 表单状态
    const isLogin = ref(true);
    const isSubmitting = ref(false);
    const rememberMe = ref(false);
    const showLoginPassword = ref(false);
    const showRegisterPassword = ref(false);

    // 登录表单
    const loginForm = reactive({
        username: '',
        password: ''
    });

    // 注册表单
    const registerForm = reactive({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // 注册表单错误
    const registerErrors = reactive({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // 切换登录/注册
    const switchToLogin = () => {
        isLogin.value = true;
        clearRegisterErrors();
    };

    const switchToRegister = () => {
        isLogin.value = false;
        clearRegisterErrors();
    };

    // 清除注册错误
    const clearRegisterErrors = () => {
        registerErrors.username = '';
        registerErrors.email = '';
        registerErrors.password = '';
        registerErrors.confirmPassword = '';
    };

    // 切换密码显示
    const togglePasswordVisibility = (type) => {
        if (type === 'login') {
            showLoginPassword.value = !showLoginPassword.value;
        } else {
            showRegisterPassword.value = !showRegisterPassword.value;
        }
    };

    // 记住我
    const onRememberChange = (e) => {
        rememberMe.value = e.detail.value.includes('remember');
    };

    // 忘记密码
    const handleForgotPassword = () => {
        uni.showToast({
            title: t('login.forgotPasswordTip'),
            icon: 'none'
        });
    };

    // 验证注册表单
    const validateRegisterForm = () => {
        clearRegisterErrors();
        let isValid = true;

        if (!registerForm.username || registerForm.username.length < 3) {
            registerErrors.username = t('login.usernameError');
            isValid = false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!registerForm.email || !emailRegex.test(registerForm.email)) {
            registerErrors.email = t('login.emailError');
            isValid = false;
        }

        if (!registerForm.password || registerForm.password.length < 6) {
            registerErrors.password = t('login.passwordError');
            isValid = false;
        }

        if (registerForm.password !== registerForm.confirmPassword) {
            registerErrors.confirmPassword = t('login.confirmPasswordError');
            isValid = false;
        }

        return isValid;
    };

    // 登录
    const handleLogin = async () => {
        if (!loginForm.username || !loginForm.password) {
            uni.showToast({
                title: t('login.fillAllFields'),
                icon: 'none'
            });
            return;
        }

        isSubmitting.value = true;
        try {
            const res = await apiPostLogin({
                email: loginForm.username,
                password: loginForm.password
            });

            const { access, refresh } = res.data;
            userStore.setToken(access, refresh);
            await userStore.setUserInfo();

            uni.showToast({
                title: t('login.loginSuccess'),
                icon: 'success'
            });

            setTimeout(() => {
                uni.navigateBack();
            }, 1500);
        } catch (error) {
            uni.showToast({
                title: error.message || t('login.loginFailed'),
                icon: 'none',
                duration: 2000
            });
        } finally {
            isSubmitting.value = false;
        }
    };

    // 注册
    const handleRegister = async () => {
        if (!validateRegisterForm()) {
            return;
        }

        isSubmitting.value = true;
        try {
            await apiPostRegister({
                username: registerForm.username,
                email: registerForm.email,
                password: registerForm.password
            });

            uni.showToast({
                title: t('login.registerSuccess'),
                icon: 'success'
            });

            // 注册成功后切换到登录
            setTimeout(() => {
                switchToLogin();
                registerForm.username = registerForm.email;
                registerForm.password = '';
                registerForm.confirmPassword = '';
            }, 1500);
        } catch (error) {
            uni.showToast({
                title: error.message || t('login.registerFailed'),
                icon: 'none',
                duration: 2000
            });
        } finally {
            isSubmitting.value = false;
        }
    };

    // 微信登录
    const handleWechatLogin = () => {
        uni.login({
            success: async (loginRes) => {
                try {
                    const res = await apiPostLoginByWechat({
                        code: loginRes.code
                    });
                    const { access, refresh } = res.data;
                    userStore.setToken(access, refresh);
                    await userStore.setUserInfo();

                    uni.showToast({
                        title: t('login.loginSuccess'),
                        icon: 'success'
                    });

                    setTimeout(() => {
                        uni.navigateBack();
                    }, 1500);
                } catch (error) {
                    uni.showToast({
                        title: error.message || t('login.loginFailed'),
                        icon: 'none'
                    });
                }
            },
            fail: () => {
                uni.showToast({
                    title: t('login.wechatLoginFailed'),
                    icon: 'none'
                });
            }
        });
    };

    // Google登录
    const handleGoogleLogin = () => {
        uni.showToast({
            title: t('login.googleLoginTip'),
            icon: 'none'
        });
    };

    // Apple登录
    const handleAppleLogin = () => {
        uni.showToast({
            title: t('login.appleLoginTip'),
            icon: 'none'
        });
    };
</script>

<style lang="scss" scoped>
    .layout {
        min-height: 100vh;
        background: #f5f5f5;
    }

    .container {
        padding: 60rpx 60rpx 40rpx;
    }

    .logo-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 80rpx;
    }

    .logo-wrapper {
        width: 160rpx;
        height: 160rpx;
        background: #fff;
        border-radius: 32rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 24rpx;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
        overflow: hidden;
    }

    .logo {
        width: 100%;
        height: 100%;
    }

    .app-name {
        font-size: 36rpx;
        font-weight: 600;
        color: #333;
    }

    .tab-wrapper {
        display: flex;
        background: transparent;
        margin-bottom: 60rpx;
        position: relative;
        padding-bottom: 20rpx;
        border-bottom: 2rpx solid #f0f0f0;
    }

    .tab-item {
        flex: 1;
        text-align: center;
        padding: 20rpx 0;
        position: relative;
        transition: all 0.3s;

        .tab-text {
            font-size: 32rpx;
            color: #999;
            transition: all 0.3s;
        }

        &.active {
            .tab-text {
                color: $wp-theme-color;
                font-weight: 600;
            }
        }

        .tab-indicator {
            position: absolute;
            bottom: -20rpx;
            left: 50%;
            transform: translateX(-50%);
            width: 60rpx;
            height: 4rpx;
            background: $wp-theme-color;
            border-radius: 2rpx;
        }
    }

    .form-wrapper {
        margin-bottom: 40rpx;
    }

    .form-item {
        margin-bottom: 32rpx;
    }

    .input-wrapper {
        display: flex;
        align-items: center;
        background: transparent;
        border-bottom: 2rpx solid #e0e0e0;
        padding: 0 0 20rpx 0;
        margin-bottom: 40rpx;
        transition: all 0.3s;

        &:focus-within {
            border-bottom-color: $wp-theme-color;
        }
    }

    .input-icon {
        margin-right: 16rpx;
        flex-shrink: 0;
    }

    .input {
        flex: 1;
        font-size: 32rpx;
        color: #333;
        height: 100%;
    }

    .password-toggle {
        padding: 8rpx;
        flex-shrink: 0;
    }

    .error-text {
        margin-top: 8rpx;
        padding-left: 24rpx;
        font-size: 24rpx;
        color: #ff4757;
    }

    .form-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 40rpx;
        padding: 0 8rpx;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        font-size: 28rpx;
        color: #666;
    }

    .forgot-password {
        font-size: 28rpx;
        color: $wp-theme-color;
    }

    .submit-btn {
        width: 100%;
        height: 96rpx;
        background: $wp-theme-color;
        color: #fff;
        font-size: 36rpx;
        font-weight: 600;
        border-radius: 48rpx;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
        margin-top: 60rpx;

        &:active {
            background: darken($wp-theme-color, 5%);
            opacity: 0.9;
        }

        &[disabled] {
            background: #ccc;
            color: #999;
        }

        &::after {
            border: none;
        }
    }

    .divider {
        display: flex;
        align-items: center;
        margin: 80rpx 0 40rpx;
    }

    .divider-line {
        flex: 1;
        height: 1rpx;
        background: #e0e0e0;
    }

    .divider-text {
        margin: 0 24rpx;
        font-size: 28rpx;
        color: #999;
    }

    .social-login {
        margin-top: 40rpx;
    }

    .social-title {
        text-align: center;
        font-size: 28rpx;
        color: #666;
        margin-bottom: 32rpx;
    }

    .social-buttons {
        display: flex;
        gap: 24rpx;
        justify-content: center;
    }

    .social-btn {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24rpx;
        border-radius: 16rpx;
        background: transparent;
        transition: all 0.3s;
        border: none;
        box-shadow: none;

        &:active {
            opacity: 0.8;
        }

        .social-icon {
            width: 64rpx;
            height: 64rpx;
            margin-bottom: 8rpx;
        }

        .social-text {
            font-size: 24rpx;
            color: #666;
        }

        &.wechat .social-text {
            color: #07c160;
        }

        &.google .social-text {
            color: #C62828;
        }

        &.apple .social-text {
            color: #000;
        }
    }
</style>