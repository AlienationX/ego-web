<template>
    <view class="layout" :class="isDark ? 'theme-dark' : 'theme-light'">
        <view class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>

        <view class="header">
            <view class="back-btn" @click="onBack">
                <mdi-icon path="/static/icons/arrow-left.svg" size="18px" :color="backIconColor"></mdi-icon>
            </view>
            <text class="header-title">{{ headerTitle }}</text>
            <view class="header-placeholder"></view>
        </view>

        <view class="content">
            <view class="panel" v-if="step === 'warn'">
                <view class="warn-hero">
                    <view class="hero-icon">
                        <mdi-icon path="/static/icons/account-remove.svg" size="40px" color="#E5322D"></mdi-icon>
                    </view>
                    <text class="hero-title">{{ t('deactivate.warnTitle') }}</text>
                    <text class="hero-desc">{{ t('deactivate.warnDesc') }}</text>
                </view>

                <text class="section-title">{{ t('deactivate.happenTitle') }}</text>
                <view class="list-card">
                    <view
                        class="list-row"
                        v-for="(item, idx) in happenList"
                        :key="item.title"
                        :class="{ last: idx === happenList.length - 1 }"
                    >
                        <view class="list-icon">
                            <mdi-icon :path="item.icon" size="20px" :color="listIconColor"></mdi-icon>
                        </view>
                        <view class="list-text">
                            <text class="list-title">{{ item.title }}</text>
                            <text class="list-desc">{{ item.desc }}</text>
                        </view>
                    </view>
                </view>

                <text class="section-title">{{ t('deactivate.reasonTitle') }}</text>
                <view class="list-card">
                    <view
                        class="list-row selectable"
                        v-for="(reasonItem, idx) in reasonList"
                        :key="reasonItem"
                        :class="{ last: idx === reasonList.length - 1 }"
                        @click="reason = reasonItem"
                    >
                        <text class="reason-text" :class="{ active: reason === reasonItem }">{{ reasonItem }}</text>
                        <view class="radio" :class="{ on: reason === reasonItem }">
                            <view v-if="reason === reasonItem" class="radio-dot"></view>
                        </view>
                    </view>
                </view>

                <view class="btn-group">
                    <button class="primary-btn" @click="step = 'confirm'">
                        <mdi-icon path="/static/icons/alert-box.svg" size="20px" color="#fff"></mdi-icon>
                        <text>{{ t('deactivate.continue') }}</text>
                    </button>
                    <button class="secondary-btn" @click="onBack">{{ t('deactivate.keep') }}</button>
                </view>
            </view>

            <view class="panel" v-else-if="step === 'confirm'">
                <view class="warning-card">
                    <view class="warning-icon">
                        <mdi-icon path="/static/icons/alert-box.svg" size="20px" color="#dc2626"></mdi-icon>
                    </view>
                    <view class="warning-text">
                        <text class="warning-title">{{ t('deactivate.warningTitle') }}</text>
                        <text class="warning-desc">{{ t('deactivate.warningDesc') }}</text>
                    </view>
                </view>

                <text class="section-title">{{ t('deactivate.typeToConfirm') }}</text>
                <view class="confirm-card" :class="{ confirmed: isConfirmed }">
                    <input
                        v-model="confirmText"
                        class="confirm-input"
                        :placeholder="t('deactivate.placeholder')"
                        placeholder-style="color: rgba(156, 163, 175, 0.5); font-weight: 500;"
                        @input="onConfirmInput"
                    />

                    <view class="check-line" @click="agree = !agree">
                        <view class="check-box" :class="{ on: agree }">
                            <mdi-icon v-if="agree" path="/static/icons/check.svg" size="20px" color="#fff"></mdi-icon>
                        </view>
                        <text class="check-text">{{ t('deactivate.agree') }}</text>
                    </view>
                </view>

                <view class="btn-group">
                    <button class="primary-btn" :disabled="!canSubmit" @click="onDeactivate">
                        <mdi-icon path="/static/icons/account-remove.svg" size="20px" color="#fff"></mdi-icon>
                        <text>{{ t('deactivate.button') }}</text>
                    </button>
                    <button class="secondary-btn" @click="onBack">{{ t('deactivate.cancel') }}</button>
                </view>
            </view>

            <view class="panel" v-else>
                <view class="done-hero">
                    <view class="done-icon">
                        <mdi-icon path="/static/icons/check.svg" size="20px" color="#22c55e"></mdi-icon>
                    </view>
                    <text class="done-title">{{ t('deactivate.doneTitle') }}</text>
                    <text class="done-desc">{{ t('deactivate.doneDesc') }}</text>
                </view>

                <view class="done-card">
                    <text class="done-card-title">{{ t('deactivate.doneNextTitle') }}</text>
                    <view class="done-item" v-for="item in doneList" :key="item">
                        <view class="dot"></view>
                        <text class="done-item-text">{{ item }}</text>
                    </view>
                </view>

                <button class="dark-btn" @click="onBack">{{ t('deactivate.backSettings') }}</button>
            </view>
        </view>
    </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user.js';
import { getStatusBarHeight } from '@/utils/system.js';
import { useSettingsStore } from '@/stores/settings.js';

const { t } = useI18n();
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const isDark = computed(() => settingsStore.isDark);
const backIconColor = computed(() => (isDark.value ? '#e5e7eb' : '#374151'));
const listIconColor = computed(() => (isDark.value ? '#94a3b8' : '#475569'));
const statusBarHeight = ref(getStatusBarHeight() || 0);
const step = ref('warn');
const confirmText = ref('');
const agree = ref(false);
const reason = ref('');

const headerTitle = computed(() => {
    if (step.value === 'confirm') return t('deactivate.finalTitle');
    if (step.value === 'done') return t('deactivate.doneHeader');
    return t('deactivate.title');
});

const isConfirmed = computed(() => confirmText.value.trim().toUpperCase() === 'DEACTIVATE');
const canSubmit = computed(() => isConfirmed.value && agree.value);

const happenList = computed(() => [
    { icon: '/static/icons/account-remove.svg', title: t('deactivate.happen1Title'), desc: t('deactivate.happen1Desc') },
    { icon: '/static/icons/database-refresh.svg', title: t('deactivate.happen2Title'), desc: t('deactivate.happen2Desc') },
    { icon: '/static/icons/email.svg', title: t('deactivate.happen3Title'), desc: t('deactivate.happen3Desc') },
    { icon: '/static/icons/autorenew.svg', title: t('deactivate.happen4Title'), desc: t('deactivate.happen4Desc') },
]);

const reasonList = computed(() => [
    t('deactivate.reason1'),
    t('deactivate.reason2'),
    t('deactivate.reason3'),
    t('deactivate.reason4'),
    t('deactivate.reason5'),
    t('deactivate.reason6'),
]);

const doneList = computed(() => [t('deactivate.done1'), t('deactivate.done2'), t('deactivate.done3'), t('deactivate.done4')]);

const onConfirmInput = (e) => {
    const value = typeof e === 'string' ? e : e?.detail?.value;
    if (typeof value === 'string') {
        confirmText.value = value.toUpperCase();
    }
};

const onDeactivate = () => {
    if (!canSubmit.value) return;
    userStore.clearUserData();
    step.value = 'done';
};

const onBack = () => {
    if (step.value === 'confirm') {
        step.value = 'warn';
        return;
    }
    uni.navigateBack({
        fail: () => {
            uni.reLaunch({ url: '/pages/settings/settings' });
        },
    });
};
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
    background: var(--page-background);
    display: flex;
    align-items: center;
    padding: 0 32rpx;
    gap: 16rpx;
}

.back-btn {
    width: 64rpx;
    height: 64rpx;
    border-radius: 16rpx;
    background: var(--page-background-secondary);
    border: 2rpx solid var(--panel-border);
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-title {
    flex: 1;
    text-align: center;
    font-size: 36rpx;
    font-weight: 700;
    color: var(--text-primary);
}

.header-placeholder {
    width: 72rpx;
    height: 72rpx;
}

.content {
    flex: 1;
    display: flex;
    justify-content: center;
    padding: 24rpx 32rpx 80rpx;
}

.panel {
    width: 100%;
    max-width: 840rpx;
}

.icon-back {
    width: 36rpx;
    height: 36rpx;
    fill: #374151;
}

.icon-alert {
    width: 32rpx;
    height: 32rpx;
    fill: none;
    stroke: currentColor;
    stroke-width: 4rpx;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.icon-check {
    width: 36rpx;
    height: 36rpx;
    fill: currentColor;
}

.icon-userx {
    width: 32rpx;
    height: 32rpx;
    fill: none;
    stroke: currentColor;
    stroke-width: 4rpx;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.warn-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 48rpx 48rpx;
}

.hero-icon {
    width: 164rpx;
    height: 164rpx;
    border-radius: 50%;
    background: #fef2f2;
    border: 4rpx solid #fecaca;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #e5322d;
    margin-bottom: 36rpx;
}

.hero-title {
    font-size: 36rpx;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 16rpx;
}

.hero-desc {
    font-size: 26rpx;
    color: var(--text-secondary);
    line-height: 40rpx;
}

.section-title {
    display: block;
    font-size: 22rpx;
    font-weight: 600;
    color: var(--text-tertiary);
    letter-spacing: 0.07em;
    text-transform: uppercase;
    margin: 0 0 16rpx;
}

.list-card {
    background: var(--page-background-secondary);
    border-radius: 24rpx;
    border: 2rpx solid var(--panel-border);
    overflow: hidden;
    margin-bottom: 48rpx;
}

.list-row {
    display: flex;
    align-items: flex-start;
    gap: 24rpx;
    padding: 26rpx 32rpx;
    border-bottom: 2rpx solid var(--panel-border);
}

.list-row.last {
    border-bottom: none;
}

.list-row.selectable {
    align-items: center;
    justify-content: space-between;
}

.list-icon {
    width: 56rpx;
    height: 56rpx;
    border-radius: 16rpx;
    background: var(--panel-background);
    border: 2rpx solid var(--panel-border);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.list-text {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
}

.list-title {
    font-size: 28rpx;
    font-weight: 600;
    color: var(--text-primary);
}

.list-desc {
    font-size: 24rpx;
    color: var(--text-tertiary);
}

.reason-text {
    font-size: 28rpx;
    color: var(--text-secondary);
}

.reason-text.active {
    color: #e5322d;
    font-weight: 600;
}

.radio {
    width: 36rpx;
    height: 36rpx;
    border-radius: 50%;
    border: 4rpx solid #d1d5db;
    display: flex;
    align-items: center;
    justify-content: center;
}

.radio.on {
    border-color: #e5322d;
    background: #e5322d;
}

.radio-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: #fff;
}

.btn-group {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.primary-btn {
    width: 100%;
    height: 100rpx;
    border-radius: 24rpx;
    background: #e5322d;
    border: none;
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;

    &::after {
        border: none;
    }
}

.primary-btn:disabled {
    background: var(--panel-background);
    color: var(--text-tertiary);
}

.secondary-btn {
    width: 100%;
    height: 100rpx;
    border-radius: 24rpx;
    background: var(--page-background-secondary);
    border: 2rpx solid var(--panel-border);
    color: var(--text-primary);
    font-size: 30rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
        border: none;
    }
}

.warning-card {
    background: #fef2f2;
    border: 2rpx solid #fecaca;
    border-radius: 24rpx;
    padding: 32rpx;
    display: flex;
    gap: 20rpx;
    align-items: flex-start;
    margin-bottom: 48rpx;
    color: #dc2626;
}

.warning-icon {
    width: 36rpx;
    height: 36rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2rpx;
}

.warning-icon .icon-alert {
    width: 36rpx;
    height: 36rpx;
}

.warning-text {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.warning-title {
    font-size: 28rpx;
    font-weight: 700;
    color: #991b1b;
}

.warning-desc {
    font-size: 24rpx;
    color: #b91c1c;
    line-height: 36rpx;
}

.confirm-card {
    background: var(--page-background-secondary);
    border: 2rpx solid var(--panel-border);
    border-radius: 24rpx;
    padding: 28rpx 32rpx;
    margin-bottom: 56rpx;
}

.confirm-card.confirmed {
    border-color: #fecaca;
}

.confirm-input {
    width: 100%;
    height: 52rpx;
    border: none;
    background: transparent;
    font-size: 32rpx;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: 0.1em;
    caret-color: #e5322d;
    outline: none;
    box-sizing: border-box;
}

.confirm-card.confirmed .confirm-input {
    color: #dc2626;
}

.check-line {
    margin-top: 24rpx;
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.check-box {
    width: 36rpx;
    height: 36rpx;
    border-radius: 12rpx;
    border: 2rpx solid #cad3e2;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.check-box.on {
    background: #e5322d;
    border-color: #e5322d;
    color: #fff;
}

.check-text {
    font-size: 26rpx;
    color: var(--text-secondary);
    line-height: 1.6;
}

.done-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 64rpx 48rpx 40rpx;
}

.done-icon {
    width: 144rpx;
    height: 144rpx;
    border-radius: 50%;
    background: #dcfce7;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #22c55e;
    margin-bottom: 40rpx;
}

.done-title {
    font-size: 40rpx;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 20rpx;
}

.done-desc {
    font-size: 28rpx;
    color: var(--text-secondary);
    line-height: 44rpx;
}

.done-card {
    background: #fef2f2;
    border-radius: 24rpx;
    border: 2rpx solid #fecaca;
    padding: 28rpx 32rpx;
    margin-bottom: 56rpx;
}

.done-card-title {
    font-size: 26rpx;
    font-weight: 600;
    color: #991b1b;
    margin-bottom: 8rpx;
}

.done-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-top: 16rpx;
}

.dot {
    width: 8rpx;
    height: 8rpx;
    border-radius: 50%;
    background: #e5322d;
    flex-shrink: 0;
}

.done-item-text {
    font-size: 24rpx;
    color: #b91c1c;
}

.dark-btn {
    width: 100%;
    height: 100rpx;
    border-radius: 24rpx;
    background: var(--text-primary);
    border: none;
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
        border: none;
    }
}
</style>

<style lang="scss" scoped>
// ── 暗色模式覆盖 ──
.theme-dark {
    &.layout {
        background: #111114;
    }

    .header {
        background: #111114;
    }

    .back-btn {
        background: rgba(255, 255, 255, 0.07);
        border: none;
        box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.08);
    }

    .hero-icon {
        background: rgba(229, 50, 45, 0.12);
        border-color: rgba(229, 50, 45, 0.24);
    }

    .list-card {
        background: #1e1e22;
        border: none;
        box-shadow:
            inset 0 1rpx 0 rgba(255, 255, 255, 0.06),
            0 8rpx 24rpx rgba(0, 0, 0, 0.28);
    }

    .list-row {
        border-bottom-color: rgba(255, 255, 255, 0.06);
    }

    .list-icon {
        background: rgba(255, 255, 255, 0.07);
        border: none;
    }

    .secondary-btn {
        background: #1e1e22;
        border: none;
        box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.06);
    }

    .warning-card {
        background: rgba(220, 38, 38, 0.1);
        border-color: rgba(220, 38, 38, 0.2);
        color: #fca5a5;
    }

    .warning-title {
        color: #fca5a5;
    }

    .warning-desc {
        color: rgba(252, 165, 165, 0.8);
    }

    .confirm-card {
        background: #1e1e22;
        border: none;
        box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.06);
    }

    .confirm-card.confirmed {
        box-shadow:
            inset 0 1rpx 0 rgba(255, 255, 255, 0.06),
            inset 0 0 0 1rpx rgba(229, 50, 45, 0.4);
    }

    .check-box {
        border-color: rgba(255, 255, 255, 0.2);
    }

    .done-card {
        background: rgba(229, 50, 45, 0.1);
        border-color: rgba(229, 50, 45, 0.2);
    }

    .done-card-title {
        color: #fca5a5;
    }

    .done-item-text {
        color: rgba(252, 165, 165, 0.8);
    }

    .done-icon {
        background: rgba(34, 197, 94, 0.12);
    }

    .dark-btn {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
        box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.08);
    }
}
</style>
