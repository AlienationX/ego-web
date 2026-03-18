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
                        <svg class="icon-userx" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M6,18C6,15.79 9.58,14 12,14C14.42,14 18,15.79 18,18V20H6V18M21.73,4.27L19.46,6.54L17.19,4.27L15.78,5.68L18.05,7.95L15.78,10.22L17.19,11.63L19.46,9.36L21.73,11.63L23.14,10.22L20.87,7.95L23.14,5.68L21.73,4.27Z"
                            />
                        </svg>
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
                            <path d="M1,21H23L12,2L1,21M12,16V18H12V16M12,10H12V14H12V10Z" />
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
                            <path d="M1,21H23L12,2L1,21M12,16V18H12V16M12,10H12V14H12V10Z" />
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
                            <path
                                d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M6,18C6,15.79 9.58,14 12,14C14.42,14 18,15.79 18,18V20H6V18M21.73,4.27L19.46,6.54L17.19,4.27L15.78,5.68L18.05,7.95L15.78,10.22L17.19,11.63L19.46,9.36L21.73,11.63L23.14,10.22L20.87,7.95L23.14,5.68L21.73,4.27Z"
                            />
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
    height: 56px;
    background: #f5f6f8;
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 8px;
}

.back-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #fff;
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
}

.header-placeholder {
    width: 36px;
    height: 36px;
}

.content {
    flex: 1;
    display: flex;
    justify-content: center;
    padding: 12px 16px 40px;
}

.panel {
    width: 100%;
    max-width: 420px;
}

.icon-back {
    width: 18px;
    height: 18px;
    fill: #374151;
}

.icon-alert {
    width: 16px;
    height: 16px;
    fill: currentColor;
}

.icon-check {
    width: 18px;
    height: 18px;
    fill: currentColor;
}

.icon-userx {
    width: 30px;
    height: 30px;
    fill: currentColor;
}

.warn-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 24px 24px;
}

.hero-icon {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: #fef2f2;
    border: 2px solid #fecaca;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #e5322d;
    margin-bottom: 18px;
}

.hero-title {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
}

.hero-desc {
    font-size: 13px;
    color: #6b7280;
    line-height: 20px;
}

.section-title {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: #9ca3af;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    margin: 0 0 8px;
}

.list-card {
    background: #fff;
    border-radius: 12px;
    border: 1px solid #f0f1f3;
    overflow: hidden;
    margin-bottom: 24px;
}

.list-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 13px 16px;
    border-bottom: 1px solid #f3f4f6;
}

.list-row.last {
    border-bottom: none;
}

.list-row.selectable {
    align-items: center;
    justify-content: space-between;
}

.list-emoji {
    font-size: 18px;
    flex-shrink: 0;
}

.list-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.list-title {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
}

.list-desc {
    font-size: 12px;
    color: #9ca3af;
}

.reason-text {
    font-size: 14px;
    color: #374151;
}

.reason-text.active {
    color: #e5322d;
    font-weight: 600;
}

.radio {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #d1d5db;
    display: flex;
    align-items: center;
    justify-content: center;
}

.radio.on {
    border-color: #e5322d;
    background: #e5322d;
}

.radio-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #fff;
}

.btn-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.primary-btn {
    width: 100%;
    height: 50px;
    border-radius: 12px;
    background: #e5322d;
    border: none;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.primary-btn:disabled {
    background: #f3f4f6;
    color: #9ca3af;
}

.secondary-btn {
    width: 100%;
    height: 50px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid #e5e7eb;
    color: #374151;
    font-size: 15px;
    font-weight: 600;
}

.warning-card {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin-bottom: 24px;
    color: #dc2626;
}

.warning-icon {
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
}

.warning-text {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.warning-title {
    font-size: 14px;
    font-weight: 700;
    color: #991b1b;
}

.warning-desc {
    font-size: 12px;
    color: #b91c1c;
    line-height: 18px;
}

.confirm-card {
    background: #fff;
    border: 1px solid #f0f1f3;
    border-radius: 12px;
    padding: 14px 16px;
    margin-bottom: 28px;
}

.confirm-card.confirmed {
    border-color: #fecaca;
}

.confirm-input {
    width: 100%;
    height: 26px;
    border: none;
    background: transparent;
    font-size: 16px;
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
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.check-box {
    width: 18px;
    height: 18px;
    border-radius: 6px;
    border: 1px solid #cad3e2;
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
    font-size: 13px;
    color: #596273;
    line-height: 1.6;
}

.done-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 32px 24px 20px;
}

.done-icon {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: #dcfce7;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #22c55e;
    margin-bottom: 20px;
}

.done-title {
    font-size: 20px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 10px;
}

.done-desc {
    font-size: 14px;
    color: #6b7280;
    line-height: 22px;
}

.done-card {
    background: #fef2f2;
    border-radius: 12px;
    border: 1px solid #fecaca;
    padding: 14px 16px;
    margin-bottom: 28px;
}

.done-card-title {
    font-size: 13px;
    font-weight: 600;
    color: #991b1b;
    margin-bottom: 4px;
}

.done-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
}

.dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #e5322d;
    flex-shrink: 0;
}

.done-item-text {
    font-size: 12px;
    color: #b91c1c;
}

.dark-btn {
    width: 100%;
    height: 50px;
    border-radius: 12px;
    background: #374151;
    border: none;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
}
</style>
