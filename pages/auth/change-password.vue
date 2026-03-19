<template>
    <view class="layout">
        <view class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>

        <template v-if="!saved">
            <view class="header">
                <view class="back-btn" @click="goBack">
                    <uni-icons type="back" size="18" color="#374151"></uni-icons>
                </view>
                <text class="header-title">Change Password</text>
                <view class="header-placeholder"></view>
            </view>

            <scroll-view scroll-y class="content">
                <view class="info-banner">
                    <text class="info-emoji">🔐</text>
                    <text class="info-text">
                        Use at least 8 characters. Mix uppercase, numbers, and symbols for a stronger password.
                    </text>
                </view>

                <view class="section-label">Current Password</view>
                <view class="card">
                    <view class="field" :class="{ focused: focusKey === 'current' }">
                        <text class="field-label">Current password</text>
                        <view class="field-row">
                            <input
                                class="field-input"
                                :type="showCurrent ? 'text' : 'password'"
                                v-model="current"
                                @focus="focusKey = 'current'"
                                @blur="focusKey = ''"
                            />
                            <view class="eye-btn" @click="showCurrent = !showCurrent">
                                <image
                                    class="eye-icon"
                                    :src="showCurrent ? '/static/icons/eye-off.svg' : '/static/icons/eye.svg'"
                                />
                            </view>
                        </view>
                        <view class="field-line"></view>
                    </view>
                </view>

                <view class="section-label">New Password</view>
                <view class="card">
                    <view class="field" :class="{ focused: focusKey === 'next' }">
                        <text class="field-label">New password</text>
                        <view class="field-row">
                            <input
                                class="field-input"
                                :type="showNext ? 'text' : 'password'"
                                v-model="next"
                                @focus="focusKey = 'next'"
                                @blur="focusKey = ''"
                            />
                            <view class="eye-btn" @click="showNext = !showNext">
                                <image
                                    class="eye-icon"
                                    :src="showNext ? '/static/icons/eye-off.svg' : '/static/icons/eye.svg'"
                                />
                            </view>
                        </view>
                        <view class="field-line"></view>
                    </view>
                    <view class="field field-last" :class="{ focused: focusKey === 'confirm' }">
                        <text class="field-label">Confirm new password</text>
                        <view class="field-row">
                            <input
                                class="field-input"
                                :type="showConfirm ? 'text' : 'password'"
                                v-model="confirm"
                                @focus="focusKey = 'confirm'"
                                @blur="focusKey = ''"
                            />
                            <view class="eye-btn" @click="showConfirm = !showConfirm">
                                <image
                                    class="eye-icon"
                                    :src="showConfirm ? '/static/icons/eye-off.svg' : '/static/icons/eye.svg'"
                                />
                            </view>
                        </view>
                        <view class="field-line"></view>
                    </view>
                </view>

                <view v-if="next.length" class="strength">
                    <view class="strength-bars">
                        <view
                            v-for="i in 5"
                            :key="i"
                            class="strength-bar"
                            :style="{ backgroundColor: i <= strength.score ? strength.color : '#E5E7EB' }"
                        ></view>
                    </view>
                    <view class="strength-meta">
                        <text class="strength-label" :style="{ color: strength.color }">{{ strength.label }}</text>
                        <view v-if="confirm.length" class="strength-match" :class="{ ok: next === confirm }">
                            <template v-if="next === confirm">
                                <image class="match-icon" src="/static/icons/check.svg" />
                                <text>Passwords match</text>
                            </template>
                            <template v-else>Passwords don't match</template>
                        </view>
                    </view>
                </view>

                <view class="requirements">
                    <text class="requirements-title">Requirements</text>
                    <view v-for="item in requirements" :key="item.label" class="requirements-row">
                        <view class="requirements-dot" :class="{ ok: item.met }">
                            <image v-if="item.met" class="check-icon" src="/static/icons/check.svg" />
                        </view>
                        <text class="requirements-text" :class="{ ok: item.met }">{{ item.label }}</text>
                    </view>
                </view>

                <view v-if="error" class="error-box">
                    <text class="error-text">{{ error }}</text>
                </view>

                <view class="submit-wrap">
                    <button class="submit-btn" :class="{ disabled: !canSave }" :disabled="!canSave" @click="handleSave">
                        Update Password
                    </button>
                </view>
            </scroll-view>
        </template>

        <template v-else>
            <view class="success">
                <view class="success-icon">
                    <image class="shield-icon" src="/static/icons/shield-check-outline.svg" />
                </view>
                <text class="success-title">Password Updated</text>
                <text class="success-desc">
                    Your password has been changed successfully. You'll need to use your new password next time you log in.
                </text>
                <button class="success-btn" @click="backToSettings">Back to Settings</button>
            </view>
        </template>
    </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { getStatusBarHeight } from '@/utils/system.js';

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

const strength = computed(() => getStrength(next.value));
const canSave = computed(() => current.value.length > 0 && next.value.length >= 8 && next.value === confirm.value);

const requirements = computed(() => [
    { label: 'At least 8 characters', met: next.value.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(next.value) },
    { label: 'One number', met: /[0-9]/.test(next.value) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(next.value) },
]);

function handleSave() {
    error.value = '';
    if (next.value !== confirm.value) {
        error.value = 'New passwords do not match.';
        return;
    }
    if (next.value.length < 8) {
        error.value = 'Password must be at least 8 characters.';
        return;
    }
    saved.value = true;
}

function goBack() {
    uni.navigateBack({
        fail: () => uni.reLaunch({ url: '/pages/settings/settings' }),
    });
}

function backToSettings() {
    uni.reLaunch({ url: '/pages/settings/settings' });
}

function getStrength(password) {
    if (!password) return { score: 0, label: '', color: '#E5E7EB' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    if (score <= 1) return { score, label: 'Weak', color: '#EF4444' };
    if (score <= 2) return { score, label: 'Fair', color: '#F59E0B' };
    if (score <= 3) return { score, label: 'Good', color: '#3B82F6' };
    return { score, label: 'Strong', color: '#22C55E' };
}
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: #f5f6f8;
    display: flex;
    flex-direction: column;
}

.status-holder {
    width: 100%;
}

.header {
    height: 112rpx;
    background: #f5f6f8;
    display: flex;
    align-items: center;
    padding: 0 32rpx;
    gap: 16rpx;
    flex-shrink: 0;
}

.back-btn {
    width: 72rpx;
    height: 72rpx;
    border-radius: 16rpx;
    background: #fff;
    border: 2rpx solid #f0f1f3;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-title {
    flex: 1;
    text-align: center;
    font-size: 36rpx;
    font-weight: 700;
    color: #111827;
    margin-right: 88rpx;
}

.header-placeholder {
    width: 72rpx;
}

.content {
    flex: 1;
    padding: 24rpx 0 80rpx;
}

.info-banner {
    margin: 0 32rpx 48rpx;
    background: #f0f9ff;
    border-radius: 20rpx;
    border: 2rpx solid #bae6fd;
    padding: 24rpx 28rpx;
    display: flex;
    gap: 20rpx;
}

.info-emoji {
    font-size: 30rpx;
}

.info-text {
    font-size: 24rpx;
    color: #0369a1;
    line-height: 36rpx;
}

.section-label {
    font-size: 22rpx;
    font-weight: 600;
    color: #9ca3af;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 0 32rpx 16rpx;
}

.card {
    margin: 0 32rpx 40rpx;
    background: #fff;
    border-radius: 24rpx;
    border: 2rpx solid #f0f1f3;
    overflow: hidden;
}

.field {
    padding: 24rpx 32rpx;
    border-bottom: 2rpx solid #f3f4f6;
}

.field-last {
    border-bottom: none;
}

.field-label {
    font-size: 22rpx;
    font-weight: 600;
    color: #9ca3af;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 10rpx;
}

.field-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.field-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 30rpx;
    font-weight: 500;
    color: #111827;
    background: transparent;
    padding: 0;
    caret-color: #e5322d;
}

.eye-btn {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.eye-icon {
    width: 32rpx;
    height: 32rpx;
}

.field-line {
    height: 2rpx;
    background: transparent;
    margin-top: 8rpx;
    transition: background-color 0.15s;
}

.field.focused .field-line {
    background: #e5322d;
}

.strength {
    padding: 0 32rpx 40rpx;
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
    color: #22c55e;
}

.match-icon {
    width: 24rpx;
    height: 24rpx;
}

.requirements {
    margin: 0 32rpx 48rpx;
    background: #fff;
    border-radius: 24rpx;
    border: 2rpx solid #f0f1f3;
    padding: 24rpx 28rpx;
}

.requirements-title {
    display: block;
    font-size: 22rpx;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.12em;
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
    width: 32rpx;
    height: 32rpx;
    border-radius: 50%;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
}

.requirements-dot.ok {
    background: #dcfce7;
}

.check-icon {
    width: 18rpx;
    height: 18rpx;
}

.requirements-text {
    font-size: 24rpx;
    color: #9ca3af;
}

.requirements-text.ok {
    color: #22c55e;
}

.error-box {
    margin: 0 32rpx 32rpx;
    background: #fef2f2;
    border-radius: 16rpx;
    border: 2rpx solid #fecaca;
    padding: 20rpx 28rpx;
}

.error-text {
    font-size: 26rpx;
    color: #dc2626;
}

.submit-wrap {
    padding: 0 32rpx 40rpx;
}

.submit-btn {
    width: 100%;
    height: 100rpx;
    border-radius: 24rpx;
    background: #e5322d;
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
    border: none;
}

.submit-btn.disabled {
    background: #f3f4f6;
    color: #9ca3af;
}

.success {
    flex: 1;
    padding: 64rpx 64rpx 80rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.success-icon {
    width: 144rpx;
    height: 144rpx;
    border-radius: 50%;
    background: #dcfce7;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 40rpx;
}

.shield-icon {
    width: 68rpx;
    height: 68rpx;
}

.success-title {
    font-size: 40rpx;
    font-weight: 700;
    color: #111827;
    margin-bottom: 20rpx;
}

.success-desc {
    font-size: 28rpx;
    color: #6b7280;
    line-height: 40rpx;
    margin-bottom: 64rpx;
}

.success-btn {
    width: 100%;
    height: 100rpx;
    border-radius: 24rpx;
    background: #e5322d;
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
    border: none;
}
</style>
