<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <view class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>

        <template v-if="!saved">
            <view class="header">
                <view class="back-btn" @click="goBack">
                    <mdi-icon path="/static/icons/arrow-left.svg" size="20px" :color="backIconColor"></mdi-icon>
                </view>
                <text class="header-title">{{ t('changePasswordPage.title') }}</text>
                <view class="header-placeholder"></view>
            </view>

            <view class="content">
                <view class="info-banner">
                    <view class="info-icon">
                        <mdi-icon path="/static/icons/lock.svg" size="18px" color="#0284c7"></mdi-icon>
                    </view>
                    <text class="info-text">
                        {{ t('changePasswordPage.banner') }}
                    </text>
                </view>

                <!-- 当前密码卡片 -->
                <view class="card">
                    <view class="field-item">
                        <text class="field-label">{{ t('changePasswordPage.fields.current') }}</text>
                        <view class="input-box" :class="{ focused: focusKey === 'current' }">
                            <mdi-icon path="/static/icons/lock.svg" size="18px" :color="focusKey === 'current' ? '#e5322d' : iconMutedColor" class="input-icon"></mdi-icon>
                            <input
                                class="field-input"
                                :type="showCurrent ? 'text' : 'password'"
                                v-model="current"
                                :focus="isCurrentFocused"
                                :placeholder="t('changePasswordPage.placeholders.current')"
                                placeholder-class="placeholder-style"
                                @focus="focusKey = 'current'"
                                @blur="onBlurCurrent"
                            />
                            <view class="eye-btn" @click.stop="showCurrent = !showCurrent">
                                <mdi-icon
                                    :path="showCurrent ? '/static/icons/eye-off.svg' : '/static/icons/eye.svg'"
                                    size="20px"
                                    :color="iconMutedColor"
                                ></mdi-icon>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- 新密码及确认卡片 -->
                <view class="card">
                    <view class="field-item">
                        <text class="field-label">{{ t('changePasswordPage.fields.next') }}</text>
                        <view class="input-box" :class="{ focused: focusKey === 'next' }">
                            <mdi-icon path="/static/icons/lock.svg" size="18px" :color="focusKey === 'next' ? '#e5322d' : iconMutedColor" class="input-icon"></mdi-icon>
                            <input
                                class="field-input"
                                :type="showNext ? 'text' : 'password'"
                                v-model="next"
                                :placeholder="t('changePasswordPage.placeholders.next')"
                                placeholder-class="placeholder-style"
                                @focus="focusKey = 'next'"
                                @blur="focusKey = ''"
                            />
                            <view class="eye-btn" @click.stop="showNext = !showNext">
                                <mdi-icon
                                    :path="showNext ? '/static/icons/eye-off.svg' : '/static/icons/eye.svg'"
                                    size="20px"
                                    :color="iconMutedColor"
                                ></mdi-icon>
                            </view>
                        </view>
                    </view>

                    <view class="field-divider"></view>

                    <view class="field-item">
                        <text class="field-label">{{ t('changePasswordPage.fields.confirm') }}</text>
                        <view class="input-box" :class="{ focused: focusKey === 'confirm' }">
                            <mdi-icon path="/static/icons/lock.svg" size="18px" :color="focusKey === 'confirm' ? '#e5322d' : iconMutedColor" class="input-icon"></mdi-icon>
                            <input
                                class="field-input"
                                :type="showConfirm ? 'text' : 'password'"
                                v-model="confirm"
                                :placeholder="t('changePasswordPage.placeholders.confirm')"
                                placeholder-class="placeholder-style"
                                @focus="focusKey = 'confirm'"
                                @blur="focusKey = ''"
                            />
                            <view class="eye-btn" @click.stop="showConfirm = !showConfirm">
                                <mdi-icon
                                    :path="showConfirm ? '/static/icons/eye-off.svg' : '/static/icons/eye.svg'"
                                    size="20px"
                                    :color="iconMutedColor"
                                ></mdi-icon>
                            </view>
                        </view>
                    </view>
                </view>

                <view v-if="next.length" class="strength">
                    <view class="strength-bars">
                        <view
                            v-for="i in 5"
                            :key="i"
                            class="strength-bar"
                            :style="{ backgroundColor: i <= strength.score ? strength.color : (settingsStore.isDark ? '#27272a' : '#E5E7EB') }"
                        ></view>
                    </view>
                    <view class="strength-meta">
                        <text class="strength-label" :style="{ color: strength.color }">{{ strength.label }}</text>
                        <view v-if="confirm.length" class="strength-match" :class="{ ok: next === confirm }">
                            <template v-if="next === confirm">
                                <mdi-icon path="/static/icons/check.svg" size="18px" color="#e5322d"></mdi-icon>
                                <text>{{ t('changePasswordPage.match.ok') }}</text>
                            </template>
                            <template v-else>{{ t('changePasswordPage.match.fail') }}</template>
                        </view>
                    </view>
                </view>

                <view class="requirements">
                    <text class="requirements-title">{{ t('changePasswordPage.requirements.title') }}</text>
                    <view v-for="item in requirements" :key="item.label" class="requirements-row">
                        <view class="requirements-dot" :class="{ ok: item.met }">
                            <mdi-icon v-if="item.met" path="/static/icons/check.svg" size="16px" color="#e5322d"></mdi-icon>
                        </view>
                        <text class="requirements-text" :class="{ ok: item.met }">{{ item.label }}</text>
                    </view>
                </view>

                <view v-if="error" class="error-box">
                    <text class="error-text">{{ error }}</text>
                </view>

                <view class="submit-wrap">
                    <button
                        class="submit-btn"
                        :class="{ 'is-loading': isSubmitting, 'is-success': isSuccess, disabled: !canSave }"
                        :disabled="!canSave || isSubmitting || isSuccess"
                        @click="handleSave"
                    >
                        <view v-if="isSubmitting" class="btn-spinner"></view>
                        <view v-else-if="isSuccess" class="success-icon-wrap">
                            <mdi-icon path="/static/icons/check.svg" size="20px" color="#fff"></mdi-icon>
                        </view>
                        <text>{{ isSuccess ? t('changePasswordPage.saved') : (isSubmitting ? (t('common.processing') || '保存中...') : t('changePasswordPage.submit')) }}</text>
                    </button>
                </view>
            </view>
        </template>

        <template v-else>
            <view class="success">
                <view class="success-icon">
                    <mdi-icon path="/static/icons/shield-check.svg" size="64px" color="#e5322d"></mdi-icon>
                </view>
                <text class="success-title">{{ t('changePasswordPage.success.title') }}</text>
                <text class="success-desc">{{ t('changePasswordPage.success.desc') }}</text>
                <button class="success-btn" @click="backToSettings">{{ t('changePasswordPage.success.button') }}</button>
            </view>
        </template>
    </view>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { getStatusBarHeight } from '@/utils/layout.js';
import { apiPostChangePassword } from '@/api/wallpaper.js';
import { useSettingsStore } from '@/stores/settings.js';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const backIconColor = computed(() => (settingsStore.isDark ? '#e5e7eb' : '#374151'));
const iconMutedColor = computed(() => (settingsStore.isDark ? '#94a3b8' : '#9ca3af'));
const statusBarHeight = ref(getStatusBarHeight() || 0);

const current = ref('');
const next = ref('');
const confirm = ref('');
const showCurrent = ref(false);
const showNext = ref(false);
const showConfirm = ref(false);
const saved = ref(false);
const error = ref('');
const focusKey = ref('');
const isSubmitting = ref(false);
const isSuccess = ref(false);
const isCurrentFocused = ref(false);

const strength = computed(() => getStrength(next.value));
const canSave = computed(() => current.value.length > 0 && next.value.length >= 8 && next.value === confirm.value);

const requirements = computed(() => [
    { label: t('changePasswordPage.requirements.length'), met: next.value.length >= 8 },
    { label: t('changePasswordPage.requirements.uppercase'), met: /[A-Z]/.test(next.value) },
    { label: t('changePasswordPage.requirements.number'), met: /[0-9]/.test(next.value) },
    { label: t('changePasswordPage.requirements.special'), met: /[^A-Za-z0-9]/.test(next.value) },
]);

onMounted(() => {
    const sb = getStatusBarHeight();
    if (sb > 0) {
        statusBarHeight.value = sb;
    }
    // 延迟 250ms 自动聚焦当前密码，确保页面过渡动画完成
    setTimeout(() => {
        isCurrentFocused.value = true;
        focusKey.value = 'current';
    }, 250);
});

const onBlurCurrent = () => {
    isCurrentFocused.value = false;
    if (focusKey.value === 'current') {
        focusKey.value = '';
    }
};

async function handleSave() {
    if (!canSave.value || isSubmitting.value || isSuccess.value) return;
    error.value = '';
    if (next.value !== confirm.value) {
        error.value = t('changePasswordPage.errors.notMatch');
        return;
    }
    if (next.value.length < 8) {
        error.value = t('changePasswordPage.errors.minLength');
        return;
    }

    try {
        isSubmitting.value = true;
        const res = await apiPostChangePassword({
            old_password: current.value,
            new_password: next.value,
            confirm_password: confirm.value,
        });
        if (res.code === 200) {
            isSubmitting.value = false;
            isSuccess.value = true;
            // #ifdef APP-PLUS || MP-WEIXIN
            try {
                uni.vibrateShort({ type: 'light' });
            } catch (e) {}
            // #endif
            setTimeout(() => {
                saved.value = true;
                isSuccess.value = false;
            }, 500);
        } else {
            isSubmitting.value = false;
            error.value = res.data?.error || res?.message || t('changePasswordPage.errors.failed');
        }
    } catch (e) {
        isSubmitting.value = false;
        error.value = e?.message || t('common.networkError') || '修改失败，请重试';
    }
}

function goBack() {
    uni.navigateBack({
        fail: () => uni.reLaunch({ url: '/pages/settings/settings' }),
    });
}

function backToSettings() {
    uni.redirectTo({ url: '/pages/settings/settings' });
}

function getStrength(password) {
    if (!password) return { score: 0, label: '', color: '#E5E7EB' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    if (score <= 1) return { score, label: t('changePasswordPage.strength.weak'), color: '#EF4444' };
    if (score <= 2) return { score, label: t('changePasswordPage.strength.fair'), color: '#F59E0B' };
    if (score <= 3) return { score, label: t('changePasswordPage.strength.good'), color: '#3B82F6' };
    return { score, label: t('changePasswordPage.strength.strong'), color: '#22C55E' };
}
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
    flex-shrink: 0;
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
    padding: 24rpx 0 80rpx;
}

.info-banner {
    margin: 0 30rpx 36rpx;
    background: rgba(3, 105, 161, 0.08);
    border-radius: 24rpx;
    border: none;
    box-shadow: none;
    padding: 24rpx 28rpx;
    display: flex;
    gap: 20rpx;
    align-items: center;
}

.info-icon {
    width: 48rpx;
    height: 48rpx;
    border-radius: 14rpx;
    background: rgba(3, 105, 161, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.info-text {
    font-size: 24rpx;
    color: #0284c7;
    line-height: 36rpx;
}

.card {
    margin: 0 30rpx 36rpx;
    background: var(--page-background-secondary);
    border-radius: 28rpx;
    border: none;
    box-shadow: none;
    overflow: hidden;
}

.field-item {
    padding: 24rpx 30rpx;
}

.field-divider {
    height: 1rpx;
    background: var(--panel-border);
    margin: 0 30rpx;
}

.field-label {
    display: block;
    font-size: 26rpx;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 16rpx;
}

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
}

.field-input {
    flex: 1;
    height: 100%;
    border: none;
    outline: none;
    font-size: 28rpx;
    font-weight: 500;
    color: var(--text-primary);
    background: transparent;
    caret-color: #e5322d;
}

:deep(.placeholder-style),
.placeholder-style {
    color: var(--text-tertiary);
    font-size: 26rpx;
    font-weight: 400;
}

.eye-btn {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.2s ease;

    &:active {
        opacity: 0.7;
    }
}

.strength {
    padding: 0 30rpx 36rpx;
}

.strength-bars {
    display: flex;
    gap: 8rpx;
    margin-bottom: 12rpx;
}

.strength-bar {
    flex: 1;
    height: 8rpx;
    border-radius: 4rpx;
}

.strength-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.strength-label {
    font-size: 24rpx;
    font-weight: 600;
}

.strength-match {
    font-size: 24rpx;
    color: #ef4444;
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.strength-match.ok {
    color: #e5322d;
}

.requirements {
    margin: 0 30rpx 44rpx;
    background: var(--page-background-secondary);
    border-radius: 28rpx;
    border: none;
    box-shadow: none;
    padding: 28rpx 32rpx;
}

.requirements-title {
    display: block;
    font-size: 22rpx;
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 20rpx;
}

.requirements-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 14rpx;
}

.requirements-row:last-child {
    margin-bottom: 0;
}

.requirements-dot {
    width: 36rpx;
    height: 36rpx;
    border-radius: 12rpx;
    background: var(--page-background);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.requirements-dot.ok {
    background: rgba(229, 50, 45, 0.12);
}

.requirements-text {
    font-size: 24rpx;
    color: var(--text-tertiary);
    transition: color 0.2s ease;
}

.requirements-text.ok {
    color: var(--text-primary);
    font-weight: 500;
}

.error-box {
    margin: 0 30rpx 32rpx;
    background: rgba(220, 38, 38, 0.08);
    border-radius: 20rpx;
    border: none;
    padding: 20rpx 28rpx;
}

.error-text {
    font-size: 26rpx;
    color: #dc2626;
}

.submit-wrap {
    padding: 0 30rpx 40rpx;
}

.submit-btn {
    width: 100%;
    height: 100rpx;
    border-radius: 24rpx;
    background: #e5322d;
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    box-sizing: border-box;
    border: none;
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

    &.disabled {
        background: var(--panel-background);
        color: var(--text-tertiary);
        border: none;
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

.success {
    flex: 1;
    padding: 64rpx 48rpx 80rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    animation: fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.success-icon {
    width: 144rpx;
    height: 144rpx;
    border-radius: 50%;
    background: rgba(229, 50, 45, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #e5322d;
    margin-bottom: 40rpx;
    animation: successBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

.success-title {
    font-size: 40rpx;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 20rpx;
    animation: fadeSlideUp 0.4s 0.08s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.success-desc {
    font-size: 28rpx;
    color: var(--text-secondary);
    line-height: 44rpx;
    margin-bottom: 64rpx;
    animation: fadeSlideUp 0.4s 0.16s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.success-btn {
    width: 100%;
    height: 100rpx;
    border-radius: 24rpx;
    background: var(--text-primary);
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeSlideUp 0.4s 0.24s cubic-bezier(0.16, 1, 0.3, 1) both;

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
        opacity: 0;
        transform: scale(0.3);
    }
    60% {
        opacity: 1;
        transform: scale(1.2);
    }
    100% {
        transform: scale(1);
    }
}

@keyframes saveSuccessPulse {
    0% {
        transform: scale(1);
    }
    40% {
        transform: scale(1.03);
    }
    100% {
        transform: scale(1);
    }
}

@keyframes fadeSlideUp {
    from {
        opacity: 0;
        transform: translateY(20rpx);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>

<style lang="scss" scoped>
// ── 暗色模式覆盖 ──
.theme-dark {
    .header {
        background: transparent;
    }

    .info-banner {
        background: rgba(3, 105, 161, 0.12);
        border: none;
    }

    .info-icon {
        background: rgba(3, 105, 161, 0.18);
    }

    .info-text {
        color: #7dd3fc;
    }

    .card {
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

    .field-divider {
        background: rgba(255, 255, 255, 0.05);
    }

    .requirements {
        background: #1e1e22;
        border: none;
        box-shadow: none;
    }

    .requirements-dot {
        background: rgba(255, 255, 255, 0.06);
    }

    .requirements-dot.ok {
        background: rgba(229, 50, 45, 0.15);
    }

    .error-box {
        background: rgba(220, 38, 38, 0.12);
        border: none;
    }

    .error-text {
        color: #fca5a5;
    }

    .submit-btn.disabled {
        background: rgba(255, 255, 255, 0.06);
        border: none;
        color: rgba(255, 255, 255, 0.28);
    }

    .success-icon {
        background: rgba(229, 50, 45, 0.12);
        color: #ef4444;
    }

    .success-btn {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
    }
}
</style>
