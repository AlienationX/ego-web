<template>
    <view class="signin-container" :class="isDark ? 'theme-dark' : 'theme-light'">
        <view class="back-btn" :style="{ top: backTop + 'px' }" @click="goBack">
            <uni-icons type="back" :color="backIconColor" size="20"></uni-icons>
        </view>

        <!-- 内容区域 -->
        <view class="content">
            <!-- 标题区域 -->
            <view class="title-section">
                <view class="main-title">{{ t('login.signInTitle') }}</view>
                <view class="sub-title">{{ t('login.signInSubtitle') }}</view>
            </view>

            <!-- 微信特有快捷登录区域 (微信端第一屏优先展示，且在 showEmailForm 状态为 false 时显示) -->
            <!-- #ifdef MP-WEIXIN -->
            <view v-if="!showEmailForm" class="weixin-quick-section">
                <button class="weixin-quick-btn" @click="handleWechatLogin">
                    <image src="/static/icons/brands/wechat.svg" mode="aspectFit" class="social-icon"></image>
                    <text>微信授权一键登录</text>
                </button>
                <view class="weixin-agreement-hint">
                    点击登录即代表您已同意下方《用户服务协议》与《隐私政策》
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
                
                <view class="toggle-other-methods" @click="showEmailForm = true">
                    <text>使用邮箱/密码登录</text>
                    <uni-icons type="arrowdown" size="12" color="#3461fd"></uni-icons>
                </view>
            </view>
            <!-- #endif -->

            <view v-show="showEmailForm" class="email-form-area">
                <!-- 社交登录按钮 -->
                <view class="social-section">
                    <view class="social-buttons">
                        <view class="social-btn" @click="handleGoogleLogin">
                            <image src="/static/icons/brands/google.svg" mode="aspectFit" class="social-icon"></image>
                            <text class="social-text">{{ t('login.google') }}</text>
                        </view>
                        <view class="social-btn" @click="handleWechatLogin">
                            <image src="/static/icons/brands/wechat.svg" mode="aspectFit" class="social-icon"></image>
                            <text class="social-text">{{ t('login.wechat') }}</text>
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
                            type="text"
                            :password="!showPassword"
                            :placeholder="t('login.passwordPlaceholder')"
                            v-model="form.password"
                            @focus="passwordFocused = true"
                            @blur="passwordFocused = false"
                        />
                        <view class="password-toggle" @click="togglePassword">
                            <mdi-icon
                                :path="showPassword ? '/static/icons/eye-off.svg' : '/static/icons/eye.svg'"
                                size="20px"
                                :color="iconMutedColor"
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

                <!-- 记住密码与忘记密码 -->
                <view class="form-options-section">
                    <view class="form-options">
                        <view class="remember-option" @click="toggleRememberPassword">
                            <view class="remember-checkbox" :class="{ checked: rememberPassword }">
                                <view class="remember-inner" v-if="rememberPassword">
                                    <uni-icons type="checkmarkempty" color="#ffffff" size="16"></uni-icons>
                                </view>
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

        <!-- 通用导航对话框 -->
        <popup-navigation-dialog
            ref="navDialog"
            :title="dialogState.title"
            :description="dialogState.description"
            :confirmText="dialogState.confirmText"
            :cancelText="dialogState.cancelText"
            @confirm="dialogState.onConfirm"
            @cancel="dialogState.onCancel"
        ></popup-navigation-dialog>
    </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user.js';
import { apiPostLogin, apiPostLoginByWechat } from '@/api/wallpaper.js';
import { getStatusBarHeight } from '@/utils/system.js';
import { encrypt, decrypt } from '@/utils/encryption.js';
import { useSettingsStore } from '@/stores/settings.js';

const { t } = useI18n();
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const isDark = computed(() => settingsStore.isDark);
const backIconColor = computed(() => (isDark.value ? '#94a3b8' : '#4a5670'));
const iconMutedColor = computed(() => (isDark.value ? '#94a3b8' : '#94a3b8'));
const backTop = ref((getStatusBarHeight() || 0) + 10);
const REMEMBER_STORAGE_KEY = 'signinRemember';

// 通用导航对话框控制
const navDialog = ref(null);
const dialogState = ref({
    title: '',
    description: '',
    confirmText: '',
    cancelText: '',
    onConfirm: () => {},
    onCancel: () => {},
});

/**
 * 显示自定义导航对话框
 * @param {Object} config 配置项 { title, content, confirmText, cancelText, onConfirm, onCancel }
 */
const showNavDialog = (config) => {
    dialogState.value = {
        title: config.title || t('common.tip'),
        description: config.content || '',
        confirmText: config.confirmText || t('common.confirm'),
        cancelText: config.cancelText || t('common.cancel'),
        onConfirm: () => {
            if (config.onConfirm) config.onConfirm();
        },
        onCancel: () => {
            if (config.onCancel) config.onCancel();
        },
    };
    navDialog.value?.open();
};

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
const isAgreed = ref(false);

// 控制邮箱密码表单显隐：微信小程序环境默认不展开邮箱表单以优先展示微信一键登录，其他端默认直接显示
const showEmailForm = ref(true);
// #ifdef MP-WEIXIN
showEmailForm.value = false;
// #endif

onMounted(() => {
    // 1. 如果已登录，直接跳转到用户页
    if (userStore.isLoggedIn) {
        uni.reLaunch({ url: '/pages/user/user' });
        return;
    }

    // 2. 检查是否有记住的账号信息
    const saved = uni.getStorageSync(REMEMBER_STORAGE_KEY);
    if (!saved || typeof saved !== 'object') return;

    rememberPassword.value = !!saved.remember;
    if (rememberPassword.value) {
        form.email = saved.email || '';
        // 安全项：解密后回填
        if (saved.password) {
            form.password = decrypt(saved.password) || '';
        }
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

// 协议相关
const toggleAgreement = () => {
    isAgreed.value = !isAgreed.value;
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

// 忘记密码
const handleForgotPassword = () => {
    uni.navigateTo({
        url: '/pages/auth/forget-password',
    });
};

// 微信登录
const handleWechatLogin = () => {
    // #ifndef MP-WEIXIN
    uni.showToast({
        title: '请在微信环境中使用',
        icon: 'none',
    });
    return;
    // #endif

    // 切换到微信登录tab
    if (showEmailForm.value) {
        showEmailForm.value = false;
        return;
    }

    // 协议校验
    if (!isAgreed.value) {
        uni.showToast({
            title: t('login.agreeRequired'),
            icon: 'none',
        });
        return;
    }

    uni.login({
        provider: 'weixin',
        onlyAuthorize: true, // 微信登录仅请求授权认证
        success: async (loginRes) => {
            try {
                const res = await apiPostLoginByWechat({
                    code: loginRes.code,
                });
                // 登录成功，保存用户信息并跳转
                const { access, refresh } = res.data;
                userStore.setToken(access, refresh);
                await userStore.setUserInfo();

                uni.showToast({
                    title: t('login.loginSuccess'),
                    icon: 'success',
                });
                // 跳转到用户页
                uni.reLaunch({ url: '/pages/user/user' });
            } catch (error) {
                uni.showToast({
                    title: error.message || t('login.loginFailed'),
                    icon: 'none',
                });
            }
        },
        fail: (err) => {
            uni.showToast({
                title: t('login.wechatLoginFailed'),
                icon: 'none',
            });
        },
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

    if (!isAgreed.value) {
        uni.showToast({
            title: t('login.agreeTerms'),
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
                // 安全防线：加密存储密码
                password: encrypt(form.password),
            });
        } else {
            uni.removeStorageSync(REMEMBER_STORAGE_KEY);
        }

        uni.showToast({
            title: t('login.loginSuccess'),
            icon: 'success',
        });
        
        goBack();
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
        fail: () => uni.reLaunch({ url: '/pages/user/user' }),
    });
};
</script>

<style lang="scss" scoped>
.signin-container {
    min-height: 100vh;
    background: var(--page-background);
    padding: 0 48rpx;
}

/* 微信特有快捷一键登录样式 */
.weixin-quick-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 40rpx 0 60rpx;
    width: 100%;

    .weixin-quick-btn {
        width: 100%;
        height: 108rpx;
        background: var(--page-background-secondary);
        border: 2rpx solid var(--panel-border);
        color: var(--text-primary);
        font-size: 32rpx;
        font-weight: 600;
        border-radius: 28rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 18rpx;
        box-shadow: 0 8rpx 20rpx var(--shadow-color);
        transition: all 0.28s ease;

        &::after {
            border: none;
        }

        &:active {
            transform: scale(0.98);
            opacity: 0.9;
        }

        .social-icon {
            width: 48rpx;
            height: 48rpx;
        }
    }

    .weixin-agreement-hint {
        font-size: 22rpx;
        color: var(--text-tertiary);
        margin-top: 36rpx;
        text-align: center;
        line-height: 1.4;
    }

    .toggle-other-methods {
        margin-top: 48rpx;
        display: flex;
        align-items: center;
        gap: 8rpx;
        font-size: 26rpx;
        font-weight: 600;
        color: #3461fd;
        cursor: pointer;
        padding: 10rpx 20rpx;
        transition: opacity 0.2s;

        &:active {
            opacity: 0.75;
        }
    }
}

.weixin-back-btn {
    width: 100%;
    height: 120rpx;
    background: transparent;
    border: 2rpx solid var(--panel-border);
    color: var(--text-secondary);
    font-size: 32rpx;
    font-weight: 500;
    border-radius: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
    margin-bottom: 32rpx;

    &::after {
        border: none;
    }

    &:active {
        opacity: 0.9;
        transform: scale(0.98);
    }
}

.back-btn {
    position: fixed;
    left: 36rpx;
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    background: var(--page-background-secondary);
    border: 1rpx solid var(--panel-border);
    box-shadow: 0 8rpx 20rpx var(--shadow-color);
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
        color: var(--text-secondary);
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
        background: var(--page-background-secondary);
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
            color: var(--text-secondary);
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
        background: var(--panel-border);
    }

    .divider-text {
        margin: 0 24rpx;
        font-size: 28rpx;
        color: var(--text-primary);
    }
}

.form-section {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
    margin-bottom: 44rpx;

    .form-item {
        height: 120rpx;
        background: var(--page-background-secondary);
        border-radius: 28rpx;
        display: flex;
        align-items: center;
        padding: 0 48rpx;

        .form-input {
            flex: 1;
            font-size: 32rpx;
            color: var(--text-primary);
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
}

.forgot-password {
    text-align: right;

    text {
        font-size: 24rpx;
        color: var(--text-tertiary);
    }
}

.form-options-section {
    margin-top: 24rpx;
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
    gap: 16rpx;
}

.remember-checkbox {
    width: 32rpx;
    height: 32rpx;
    border-radius: 8rpx;
    border: 2rpx solid #d0d5dd;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;

    &.checked {
        background: #3461fd;
        border-color: #3461fd;
    }
}

.remember-inner {
    width: 32rpx;
    height: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.remember-text {
    font-size: 24rpx;
    color: var(--text-tertiary);
}

.agreement-section {
    margin: 32rpx 0;
}

.agreement-content {
    display: flex;
    align-items: flex-start;
    padding: 0 8rpx;
    gap: 16rpx;
}

.checkbox-wrapper {
    margin-top: 4rpx;
}

.checkbox {
    width: 32rpx;
    height: 32rpx;
    border-radius: 8rpx;
    border: 2rpx solid #d0d5dd;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;

    &.checked {
        background: #3461fd;
        border-color: #3461fd;
    }
}

.checkbox-inner {
    width: 32rpx;
    height: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.agreement-text {
    flex: 1;
    font-size: 24rpx;
    line-height: 1.5;

    .normal-text {
        color: var(--text-tertiary);
    }

    .link-text {
        color: #3461fd;
        text-decoration: underline;
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

    .signup-link {
        text-align: center;
        font-size: 28rpx;

        .normal-text {
            color: var(--text-secondary);
        }

        .link-text {
            color: #3461fd;
        }
    }
}
</style>
