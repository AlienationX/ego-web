<template>
    <view class="layout">
        <view class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>

        <!-- 完成页面 -->
        <template v-if="step === 'done'">
            <view class="success-content">
                <view class="success-icon-wrap">
                    <uni-icons type="checkmark" size="34" color="#22C55E"></uni-icons>
                </view>
                <text class="success-title">Account Deactivated</text>
                <text class="success-desc"
                    >Your account has been scheduled for deactivation. You'll receive a confirmation email within 24 hours. You
                    can reactivate within 30 days by contacting support.</text
                >

                <view class="confirm-card">
                    <text class="confirm-title">What happens next?</text>
                    <view v-for="(item, index) in nextSteps" :key="index" class="next-step-item">
                        <view class="step-dot"></view>
                        <text class="step-text">{{ item }}</text>
                    </view>
                </view>

                <button class="back-settings-btn" @click="backToSettings">Back to Settings</button>
            </view>
        </template>

        <!-- 确认页面 -->
        <template v-else-if="step === 'confirm'">
            <view class="header">
                <view class="back-btn" @click="setStep('warn')">
                    <uni-icons type="back" size="18" color="#374151"></uni-icons>
                </view>
                <text class="header-title">Final Confirmation</text>
                <view class="header-placeholder"></view>
            </view>

            <view class="content">
                <view class="warning-card">
                    <view class="warning-icon">
                        <uni-icons type="warn" size="18" color="#DC2626"></uni-icons>
                    </view>
                    <view class="warning-content">
                        <text class="warning-title">This action is irreversible</text>
                        <text class="warning-desc"
                            >Deactivating your account will immediately suspend your access. Your data will be held for 30 days
                            before permanent deletion.</text
                        >
                    </view>
                </view>

                <view class="input-section">
                    <text class="input-label">Type "{{ CONFIRM_TEXT }}" to confirm</text>
                    <view class="input-container" :class="{ active: input === CONFIRM_TEXT }">
                        <input
                            class="input"
                            type="text"
                            v-model="input"
                            @input="handleInput"
                            :placeholder="CONFIRM_TEXT"
                            :style="{ color: input === CONFIRM_TEXT ? '#DC2626' : '#111827' }"
                        />
                    </view>
                </view>

                <view class="btn-group">
                    <button
                        class="confirm-btn"
                        :class="{ disabled: input !== CONFIRM_TEXT }"
                        :disabled="input !== CONFIRM_TEXT"
                        @click="deactivateAccount"
                    >
                        <uni-icons type="close" size="16" :color="input === CONFIRM_TEXT ? '#FFFFFF' : '#9CA3AF'"></uni-icons>
                        <text>Deactivate My Account</text>
                    </button>
                    <button class="cancel-btn" @click="goBack">Cancel</button>
                </view>
            </view>
        </template>

        <!-- 警告页面 -->
        <template v-else>
            <view class="header">
                <view class="back-btn" @click="goBack">
                    <uni-icons type="back" size="18" color="#374151"></uni-icons>
                </view>
                <text class="header-title">Deactivate Account</text>
                <view class="header-placeholder"></view>
            </view>

            <view class="content">
                <view class="warn-section">
                    <view class="warn-icon-wrap">
                        <uni-icons type="close" size="30" color="#E5322D"></uni-icons>
                    </view>
                    <text class="warn-title">Before you go…</text>
                    <text class="warn-desc"
                        >Deactivating your account will suspend access to all features and data. Please review what will
                        happen.</text
                    >
                </view>

                <view class="section">
                    <text class="section-title">What will happen</text>
                    <view class="card">
                        <view
                            v-for="(item, index) in whatHappens"
                            :key="index"
                            class="card-item"
                            :class="{ last: index === whatHappens.length - 1 }"
                        >
                            <text class="item-icon">{{ item.icon }}</text>
                            <view class="item-content">
                                <text class="item-title">{{ item.title }}</text>
                                <text class="item-desc">{{ item.desc }}</text>
                            </view>
                        </view>
                    </view>
                </view>

                <view class="section">
                    <text class="section-title">Reason (optional)</text>
                    <view class="card">
                        <button
                            v-for="(r, index) in reasons"
                            :key="r"
                            class="reason-item"
                            :class="{ last: index === reasons.length - 1, selected: reason === r }"
                            @click="setReason(r)"
                        >
                            <text :class="{ selected: reason === r }">
                                {{ r }}
                            </text>
                            <view class="radio" :class="{ selected: reason === r }">
                                <view class="radio-dot" v-if="reason === r"></view>
                            </view>
                        </button>
                    </view>
                </view>

                <view class="btn-group">
                    <button class="continue-btn" @click="setStep('confirm')">
                        <uni-icons type="warn" size="16" color="#FFFFFF"></uni-icons>
                        <text>Continue to Deactivate</text>
                    </button>
                    <button class="keep-btn" @click="goBack">Keep My Account</button>
                </view>
            </view>
        </template>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user.js';
import { getStatusBarHeight } from '@/utils/system.js';

const { t } = useI18n();
const userStore = useUserStore();
const statusBarHeight = ref(getStatusBarHeight() || 0);

// 常量
const CONFIRM_TEXT = 'DEACTIVATE';

// 状态管理
const step = ref('warn'); // 'warn', 'confirm', 'done'
const input = ref('');
const reason = ref('');

// 数据
const reasons = [
    'I no longer need this account',
    'I have a duplicate account',
    'Privacy concerns',
    'Switching to a different service',
    'Taking a break',
    'Other',
];

const whatHappens = [
    { icon: '🚫', title: 'Immediate access suspension', desc: "You'll be signed out across all devices." },
    { icon: '💾', title: 'Data held for 30 days', desc: 'Reports, tasks, and history are retained.' },
    { icon: '📧', title: 'Confirmation email sent', desc: 'A receipt will be sent to your registered email.' },
    { icon: '↩️', title: 'Reactivation possible', desc: 'Contact support within 30 days to restore.' },
];

const nextSteps = [
    'Access is suspended immediately',
    'Data retained for 30 days',
    'Email confirmation will be sent',
    'Contact support to reactivate',
];

// 方法
const handleInput = (e) => {
    input.value = e.target.value.toUpperCase();
};

const setReason = (r) => {
    reason.value = r;
};

const setStep = (s) => {
    step.value = s;
};

const deactivateAccount = () => {
    if (input.value === CONFIRM_TEXT) {
        // 这里可以添加实际的账户停用逻辑
        userStore.clearUserData();
        setStep('done');
    }
};

const goBack = () => {
    uni.navigateBack({
        fail: () => {
            uni.reLaunch({ url: '/pages/test/settings1' });
        },
    });
};

const backToSettings = () => {
    uni.reLaunch({ url: '/pages/test/settings1' });
};
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: #f5f6f8;
    display: flex;
    flex-direction: column;
    font-family: 'Inter', sans-serif;
}

.status-holder {
    width: 100%;
}

/* 头部 */
.header {
    height: 56px;
    background: #f5f6f8;
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 8px;
    flex-shrink: 0;
}

.back-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #ffffff;
    border: 1px solid #f0f1f3;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-title {
    flex: 1;
    text-align: center;
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin-right: 44px;
}

.header-placeholder {
    width: 36px;
    height: 36px;
}

/* 内容区域 */
.content {
    flex: 1;
    padding-top: 12px;
    padding-bottom: 40px;
    overflow-y: auto;
}

/* 警告页面 */
.warn-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 32px;
    text-align: center;
}

.warn-icon-wrap {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: #fef2f2;
    border: 2px solid #fecaca;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 18px;
}

.warn-title {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
}

.warn-desc {
    font-size: 13px;
    color: #6b7280;
    line-height: 20px;
}

/* 通用区域样式 */
.section {
    margin-bottom: 24px;
}

.section-title {
    font-size: 11px;
    font-weight: 600;
    color: #9ca3af;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    padding: 0 16px;
    margin-bottom: 8px;
}

.card {
    margin: 0 16px;
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #f0f1f3;
    overflow: hidden;
}

.card-item {
    padding: 13px 16px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    border-bottom: 1px solid #f3f4f6;

    &.last {
        border-bottom: none;
    }
}

.item-icon {
    font-size: 18px;
    flex-shrink: 0;
}

.item-content {
    flex: 1;
}

.item-title {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 2px;
}

.item-desc {
    display: block;
    font-size: 12px;
    color: #9ca3af;
}

/* 原因选择 */
.reason-item {
    width: 100%;
    padding: 13px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: transparent;
    border: none;
    border-bottom: 1px solid #f3f4f6;
    text-align: left;
    cursor: pointer;

    &.last {
        border-bottom: none;
    }

    text {
        font-size: 14px;
        color: #374151;
        font-weight: 400;

        &.selected {
            color: #e5322d;
            font-weight: 600;
        }
    }
}

.radio {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #d1d5db;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.selected {
        border-color: #e5322d;
        background: #e5322d;
    }
}

.radio-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ffffff;
}

/* 确认页面 */
.warning-card {
    margin: 0 16px 24px;
    background: #fef2f2;
    border-radius: 12px;
    border: 1px solid #fecaca;
    padding: 16px;
    display: flex;
    gap: 10px;
    align-items: flex-start;
}

.warning-icon {
    flex-shrink: 0;
    margin-top: 1px;
}

.warning-content {
    flex: 1;
}

.warning-title {
    display: block;
    font-size: 14px;
    font-weight: 700;
    color: #991b1b;
    margin-bottom: 6px;
}

.warning-desc {
    display: block;
    font-size: 12px;
    color: #b91c1c;
    line-height: 18px;
}

.input-section {
    margin-bottom: 28px;
}

.input-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: #9ca3af;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    padding: 0 16px;
    margin-bottom: 8px;
}

.input-container {
    margin: 0 16px;
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #f0f1f3;
    overflow: hidden;

    &.active {
        border-color: #fecaca;
    }
}

.input {
    width: 100%;
    border: none;
    outline: none;
    font-size: 16px;
    font-weight: 600;
    background: transparent;
    padding: 14px 16px;
    letter-spacing: 0.1em;
    box-sizing: border-box;
    caret-color: #e5322d;

    &::placeholder {
        color: #9ca3af;
    }
}

/* 按钮组 */
.btn-group {
    padding: 0 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.continue-btn,
.confirm-btn {
    width: 100%;
    height: 50px;
    border-radius: 12px;
    background: #e5322d;
    border: none;
    color: #ffffff;
    font-size: 15px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background-color 0.15s;
}

.confirm-btn {
    &.disabled {
        background: #f3f4f6;
        color: #9ca3af;
        cursor: not-allowed;
    }
}

.keep-btn,
.cancel-btn {
    width: 100%;
    height: 50px;
    border-radius: 12px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    color: #374151;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
}

/* 完成页面 */
.success-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
}

.success-icon-wrap {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: #dcfce7;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
}

.success-title {
    font-size: 20px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 10px;
    text-align: center;
}

.success-desc {
    font-size: 14px;
    color: #6b7280;
    line-height: 22px;
    text-align: center;
    margin-bottom: 32px;
}

.confirm-card {
    width: 100%;
    background: #fef2f2;
    border-radius: 12px;
    border: 1px solid #fecaca;
    padding: 14px 16px;
    margin-bottom: 28px;
}

.confirm-title {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #991b1b;
    margin-bottom: 4px;
}

.next-step-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
}

.step-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #e5322d;
    flex-shrink: 0;
}

.step-text {
    font-size: 12px;
    color: #b91c1c;
}

.back-settings-btn {
    width: 100%;
    height: 50px;
    border-radius: 12px;
    background: #374151;
    border: none;
    color: #ffffff;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
}
</style>
