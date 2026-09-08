<template>
    <uni-popup ref="popup" type="bottom" :safe-area="false" :z-index="1000" @change="onPopupChange">
        <view class="redeem-sheet" :class="{ 'theme-dark': settingsStore.isDark }">
            <!-- 顶部把手与头部 -->
            <view class="sheet-drag-handle"></view>
            <view class="sheet-header">
                <view class="sheet-title-group">
                    <text class="sheet-title">{{ t('redeem.title') }}</text>
                    <text class="sheet-subtitle">{{ t('redeem.subtitle') }}</text>
                </view>
                <view class="close-btn" @click="close">
                    <mdi-icon path="/static/icons/close.svg" size="20px"
                        :color="settingsStore.isDark ? '#94a3b8' : '#64748b'"></mdi-icon>
                </view>
            </view>

            <!-- 核心输入卡片区 -->
            <view class="input-card">
                <view class="input-icon">
                    <mdi-icon path="/static/icons/credit-card-chip.svg" size="20px" color="#d9487d"></mdi-icon>
                </view>
                <input
                    class="code-input"
                    v-model="code"
                    type="text"
                    :placeholder="t('redeem.inputPlaceholder')"
                    :placeholder-style="placeholderStyle"
                    :maxlength="32"
                    confirm-type="done"
                    @confirm="handleRedeem"
                    @input="onInput"
                />
                <!-- 清空按钮 -->
                <view v-if="code" class="clear-btn" @click="clearCode">
                    <mdi-icon path="/static/icons/close-circle.svg" size="16px"
                        :color="settingsStore.isDark ? '#64748b' : '#94a3b8'"></mdi-icon>
                </view>
                <!-- 快捷粘贴按钮 -->
                <view class="paste-btn" @click="pasteFromClipboard">
                    <text>{{ t('redeem.paste') }}</text>
                </view>
            </view>

            <!-- 立即兑换按钮 -->
            <button
                class="redeem-btn"
                :class="{ 'is-disabled': !canSubmit }"
                :loading="loading"
                :disabled="loading || !canSubmit"
                @click="handleRedeem"
            >
                <text>{{ loading ? t('redeem.submitting') : t('redeem.submit') }}</text>
            </button>

            <!-- 兑换须知提示区 -->
            <view class="tips-box">
                <view class="tips-title-row">
                    <mdi-icon path="/static/icons/information-outline.svg" size="14px"
                        :color="settingsStore.isDark ? '#64748b' : '#94a3b8'"></mdi-icon>
                    <text class="tips-title">{{ t('redeem.tipTitle') }}</text>
                </view>
                <view class="tips-list">
                    <text class="tip-item">1. {{ t('redeem.tip1') }}</text>
                    <text class="tip-item">2. {{ t('redeem.tip2') }}</text>
                    <text class="tip-item">3. {{ t('redeem.tip3') }}</text>
                </view>
            </view>
        </view>
    </uni-popup>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserStore } from '@/stores/user.js';
import { apiPostRedeemCode } from '@/api/payment.js';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const userStore = useUserStore();

const emit = defineEmits(['success', 'change']);

const popup = ref(null);
const code = ref('');
const loading = ref(false);

const canSubmit = computed(() => !!code.value.trim());

const placeholderStyle = computed(() => {
    return settingsStore.isDark ? 'color: #64748b; font-size: 26rpx;' : 'color: #94a3b8; font-size: 26rpx;';
});

// 输入防呆：自动去两端空格，并转为大写
const onInput = (e) => {
    const val = e.detail.value || '';
    code.value = val.trim().toUpperCase();
};

const clearCode = () => {
    code.value = '';
};

// 从剪贴板快捷粘贴
const pasteFromClipboard = () => {
    uni.getClipboardData({
        success: (res) => {
            if (res.data) {
                code.value = String(res.data).trim().toUpperCase();
                uni.showToast({ title: '已粘贴', icon: 'none', duration: 1000 });
            }
        },
    });
};

const open = () => {
    code.value = '';
    popup.value?.open();
};

const close = () => {
    popup.value?.close();
};

const onPopupChange = (e) => {
    emit('change', e.show);
};

// 提交兑换
const handleRedeem = async () => {
    const codeVal = code.value.trim().toUpperCase();
    if (!codeVal) {
        uni.showToast({ title: t('redeem.emptyCode'), icon: 'none' });
        return;
    }

    if (!userStore.isLoggedIn) {
        uni.showToast({ title: t('user.profile.loginRequired'), icon: 'none' });
        setTimeout(() => {
            uni.navigateTo({ url: '/pages/auth/signin' });
        }, 800);
        return;
    }

    loading.value = true;
    try {
        const res = await apiPostRedeemCode({ code: codeVal });
        if (res.code === 200 || res.code === 0) {
            const rewardDays = res.data?.reward_days || 3;
            // 提示多语言文案，不依赖硬编码
            uni.showToast({
                title: t('redeem.successTip', { days: rewardDays }),
                icon: 'none',
                duration: 2500,
            });

            // 即时无感更新前端会员状态
            if (userStore.userinfo && userStore.userinfo.profile) {
                userStore.userinfo.profile.is_vip = true;
                if (res.data?.vip_expire_time) {
                    userStore.userinfo.profile.vip_expire_time = res.data.vip_expire_time;
                }
            }

            emit('success', res.data);
            setTimeout(() => {
                close();
            }, 1200);
        } else {
            uni.showToast({
                title: res.message || '兑换失败',
                icon: 'none',
            });
        }
    } catch (err) {
        const errMsg = err?.data?.message || err?.message || '兑换失败，请检查体验码是否正确';
        uni.showToast({
            title: errMsg,
            icon: 'none',
        });
    } finally {
        loading.value = false;
    }
};

defineExpose({ open, close });
</script>

<style lang="scss" scoped>
.redeem-sheet {
    background: #ffffff;
    border-top-left-radius: 40rpx;
    border-top-right-radius: 40rpx;
    padding: 20rpx 36rpx calc(env(safe-area-inset-bottom, 20px) + 36rpx);
    box-shadow: 0 -16rpx 48rpx rgba(0, 0, 0, 0.12);
    transition: background 0.2s;

    &.theme-dark {
        background: #181d26;
        box-shadow: 0 -16rpx 48rpx rgba(0, 0, 0, 0.45);
    }
}

.sheet-drag-handle {
    width: 64rpx;
    height: 8rpx;
    border-radius: 100rpx;
    background: rgba(0, 0, 0, 0.1);
    margin: 8rpx auto 24rpx;

    .theme-dark & {
        background: rgba(255, 255, 255, 0.15);
    }
}

.sheet-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 36rpx;

    .sheet-title-group {
        display: flex;
        flex-direction: column;
        gap: 8rpx;

        .sheet-title {
            font-size: 38rpx;
            font-weight: 800;
            color: var(--text-primary, #0f172a);
            letter-spacing: -0.5rpx;

            .theme-dark & {
                color: #f8fafc;
            }
        }

        .sheet-subtitle {
            font-size: 24rpx;
            color: var(--text-tertiary, #64748b);

            .theme-dark & {
                color: #94a3b8;
            }
        }
    }

    .close-btn {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.04);

        .theme-dark & {
            background: rgba(255, 255, 255, 0.06);
        }

        &:active {
            opacity: 0.7;
        }
    }
}

/* 输入框卡片 */
.input-card {
    height: 104rpx;
    box-sizing: border-box;
    border-radius: 24rpx;
    padding: 0 20rpx 0 24rpx;
    background: rgba(0, 0, 0, 0.03);
    border: 2rpx solid rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 32rpx;
    transition: all 0.2s;

    .theme-dark & {
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(255, 255, 255, 0.1);
    }

    &:focus-within {
        border-color: #d9487d;
        box-shadow: 0 0 0 4rpx rgba(217, 72, 125, 0.15);
    }

    .input-icon {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .code-input {
        flex: 1;
        height: 100%;
        font-size: 30rpx;
        font-weight: 700;
        letter-spacing: 1rpx;
        color: var(--text-primary, #0f172a);

        .theme-dark & {
            color: #f8fafc;
        }
    }

    .clear-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8rpx;
    }

    .paste-btn {
        padding: 10rpx 20rpx;
        border-radius: 100rpx;
        background: rgba(217, 72, 125, 0.1);
        color: #d9487d;
        font-size: 22rpx;
        font-weight: 700;

        &:active {
            opacity: 0.8;
        }
    }
}

/* 兑换提交按钮 */
.redeem-btn {
    width: 100%;
    height: 92rpx;
    border-radius: 100rpx;
    background: linear-gradient(135deg, #d9487d 0%, #b83265 100%);
    color: #ffffff;
    font-size: 30rpx;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10rpx 24rpx rgba(217, 72, 125, 0.35);
    border: none;
    margin-bottom: 36rpx;
    transition: all 0.2s;

    &::after {
        border: none;
    }

    &:active:not(.is-disabled) {
        transform: scale(0.98);
        box-shadow: 0 6rpx 16rpx rgba(217, 72, 125, 0.25);
    }

    &.is-disabled {
        opacity: 0.45;
        box-shadow: none;
    }
}

/* 兑换须知提示 */
.tips-box {
    padding: 24rpx;
    border-radius: 20rpx;
    background: rgba(0, 0, 0, 0.02);

    .theme-dark & {
        background: rgba(255, 255, 255, 0.02);
    }

    .tips-title-row {
        display: flex;
        align-items: center;
        gap: 8rpx;
        margin-bottom: 12rpx;

        .tips-title {
            font-size: 22rpx;
            font-weight: 700;
            color: var(--text-tertiary, #64748b);

            .theme-dark & {
                color: #94a3b8;
            }
        }
    }

    .tips-list {
        display: flex;
        flex-direction: column;
        gap: 8rpx;

        .tip-item {
            font-size: 20rpx;
            color: var(--text-tertiary, #94a3b8);
            line-height: 1.5;

            .theme-dark & {
                color: #64748b;
            }
        }
    }
}
</style>
