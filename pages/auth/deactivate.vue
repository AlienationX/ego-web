<template>
    <view class="layout">
        <view class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>

        <view class="header">
            <view class="back-btn" @click="onBack">
                <svg class="icon-back" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
                </svg>
            </view>
            <text class="header-title">{{ headerTitle }}</text>
            <view class="header-placeholder"></view>
        </view>

        <view class="content">
            <view class="panel" v-if="step === 'warn'">
                <view class="warn-hero">
                    <view class="hero-icon">
                        <image src="/static/icons/user-x.svg" mode="aspectFit" style="width: 64rpx; height: 64rpx"></image>
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
                        <text class="list-emoji">{{ item.icon }}</text>
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
                        <svg class="icon-alert" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                            />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <text>{{ t('deactivate.continue') }}</text>
                    </button>
                    <button class="secondary-btn" @click="onBack">{{ t('deactivate.keep') }}</button>
                </view>
            </view>

            <view class="panel" v-else-if="step === 'confirm'">
                <view class="warning-card">
                    <view class="warning-icon">
                        <svg class="icon-alert" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                            />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
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
                        @input="onConfirmInput"
                    />

                    <view class="check-line" @click="agree = !agree">
                        <view class="check-box" :class="{ on: agree }">
                            <svg v-if="agree" class="icon-check" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M9,16.17L4.83,12L3.41,13.41L9,19L21,7L19.59,5.59L9,16.17Z" />
                            </svg>
                        </view>
                        <text class="check-text">{{ t('deactivate.agree') }}</text>
                    </view>
                </view>

                <view class="btn-group">
                    <button class="primary-btn" :disabled="!canSubmit" @click="onDeactivate">
                        <svg class="icon-userx" viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="12" cy="7" r="4" />
                            <path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
                            <line x1="17" y1="14" x2="22" y2="19" />
                            <line x1="22" y1="14" x2="17" y2="19" />
                        </svg>
                        <text>{{ t('deactivate.button') }}</text>
                    </button>
                    <button class="secondary-btn" @click="onBack">{{ t('deactivate.cancel') }}</button>
                </view>
            </view>

            <view class="panel" v-else>
                <view class="done-hero">
                    <view class="done-icon">
                        <svg class="icon-check" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M9,16.17L4.83,12L3.41,13.41L9,19L21,7L19.59,5.59L9,16.17Z" />
                        </svg>
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

const { t } = useI18n();
const userStore = useUserStore();
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
    { icon: t('deactivate.happen1Icon'), title: t('deactivate.happen1Title'), desc: t('deactivate.happen1Desc') },
    { icon: t('deactivate.happen2Icon'), title: t('deactivate.happen2Title'), desc: t('deactivate.happen2Desc') },
    { icon: t('deactivate.happen3Icon'), title: t('deactivate.happen3Title'), desc: t('deactivate.happen3Desc') },
    { icon: t('deactivate.happen4Icon'), title: t('deactivate.happen4Title'), desc: t('deactivate.happen4Desc') },
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
    color: #111827;
    margin-bottom: 16rpx;
}

.hero-desc {
    font-size: 26rpx;
    color: #6b7280;
    line-height: 40rpx;
}

.section-title {
    display: block;
    font-size: 22rpx;
    font-weight: 600;
    color: #9ca3af;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    margin: 0 0 16rpx;
}

.list-card {
    background: #fff;
    border-radius: 24rpx;
    border: 2rpx solid #f0f1f3;
    overflow: hidden;
    margin-bottom: 48rpx;
}

.list-row {
    display: flex;
    align-items: flex-start;
    gap: 24rpx;
    padding: 26rpx 32rpx;
    border-bottom: 2rpx solid #f3f4f6;
}

.list-row.last {
    border-bottom: none;
}

.list-row.selectable {
    align-items: center;
    justify-content: space-between;
}

.list-emoji {
    font-size: 36rpx;
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
    color: #111827;
}

.list-desc {
    font-size: 24rpx;
    color: #9ca3af;
}

.reason-text {
    font-size: 28rpx;
    color: #374151;
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
}

.primary-btn:disabled {
    background: #f3f4f6;
    color: #9ca3af;
}

.secondary-btn {
    width: 100%;
    height: 100rpx;
    border-radius: 24rpx;
    background: #fff;
    border: 2rpx solid #e5e7eb;
    color: #374151;
    font-size: 30rpx;
    font-weight: 600;
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
    background: #fff;
    border: 2rpx solid #f0f1f3;
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
    color: #111827;
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
    color: #596273;
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
    color: #111827;
    margin-bottom: 20rpx;
}

.done-desc {
    font-size: 28rpx;
    color: #6b7280;
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
    background: #374151;
    border: none;
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
}
</style>
