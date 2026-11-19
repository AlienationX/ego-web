<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 沉浸式顶部导航栏 -->
        <view class="nav-header" :style="{ paddingTop: statusBarHeight + 'px' }">
            <view class="nav-bar">
                <view class="back-btn" @click="goBack">
                    <mdi-icon path="/static/icons/arrow-left.svg" size="20px"
                        :color="settingsStore.isDark ? '#e5e7eb' : '#1e293b'"></mdi-icon>
                </view>
                <text class="nav-title">{{ t('feedback.title') }}</text>
                <view class="nav-placeholder"></view>
            </view>
        </view>

        <!-- 滚动表单内容 -->
        <scroll-view class="feedback-scroll" scroll-y :show-scrollbar="false">
            <view class="feedback-content">
                <!-- 反馈类型 -->
                <view class="section">
                    <view class="section-header">
                        <text class="section-title">{{ t('feedback.type') }}</text>
                    </view>
                    <view class="chip-group">
                        <view
                            v-for="item in feedbackTypes"
                            :key="item"
                            class="chip"
                            :class="{ active: feedbackForm.type === item }"
                            @click="selectType(item)"
                        >
                            <text class="chip-text">{{ item }}</text>
                        </view>
                    </view>
                </view>

                <!-- 反馈内容 -->
                <view class="section">
                    <view class="section-header">
                        <text class="section-title">{{ t('feedback.content') }}</text>
                        <text class="section-badge" :class="{ 'is-met': canSubmit }">
                            {{ canSubmit ? `${feedbackForm.content.trim().length}/500` : tp('feedback.needMoreChars', { count: 10 - feedbackForm.content.trim().length }) }}
                        </text>
                    </view>
                    <view class="flat-card" :class="{ 'is-focused': isContentFocused }">
                        <textarea
                            class="textarea"
                            v-model="feedbackForm.content"
                            :placeholder="t('feedback.contentPlaceholder')"
                            placeholder-class="placeholder-text"
                            maxlength="500"
                            :show-confirm-bar="false"
                            @focus="isContentFocused = true"
                            @blur="isContentFocused = false"
                        ></textarea>
                    </view>
                </view>

                <!-- 截图上传 -->
                <view class="section">
                    <view class="section-header">
                        <text class="section-title">{{ t('feedback.images') }}</text>
                        <text class="section-counter">{{ imageList.length }}/{{ maxImages }}</text>
                    </view>
                    <view class="image-grid">
                        <view class="image-box" v-for="(image, index) in imageList" :key="index">
                            <image class="image-thumb" :src="image" mode="aspectFill" @click="previewImage(index)"></image>
                            <view class="image-del-btn" @click.stop="removeImage(index)">
                                <mdi-icon path="/static/icons/close.svg" size="14px" color="#ffffff"></mdi-icon>
                            </view>
                        </view>
                        <view class="image-add-box" v-if="imageList.length < maxImages" @click="chooseImage">
                            <mdi-icon path="/static/icons/camera.svg" size="26px" :color="settingsStore.isDark ? '#9ca3af' : '#9ca3af'"></mdi-icon>
                            <text class="image-add-label">{{ t('feedback.addImage') }}</text>
                        </view>
                    </view>
                    <text class="image-tip-text" v-if="imageList.length > 0">
                        {{ tp('feedback.imageTip', { count: imageList.length, max: maxImages }) }}
                    </text>
                </view>

                <!-- 联系方式 -->
                <view class="section">
                    <view class="section-header">
                        <text class="section-title">{{ t('feedback.contact') }}</text>
                    </view>
                    <view class="flat-card contact-card" :class="{ 'is-focused': isContactFocused }">
                        <view class="contact-icon">
                            <mdi-icon path="/static/icons/email.svg" size="18px" :color="settingsStore.isDark ? '#9ca3af' : '#9ca3af'"></mdi-icon>
                        </view>
                        <input
                            class="contact-input"
                            v-model="feedbackForm.contact"
                            :placeholder="t('feedback.contactPlaceholder')"
                            placeholder-class="placeholder-text"
                            type="text"
                            :adjust-position="true"
                            :hold-keyboard="false"
                            @focus="isContactFocused = true"
                            @blur="isContactFocused = false"
                        />
                    </view>
                </view>

                <!-- 提交按钮 -->
                <view class="submit-section">
                    <button
                        class="submit-btn"
                        :class="{
                            'is-ready': canSubmit && !isSubmitting,
                            'is-disabled': !canSubmit && !isSubmitting,
                            'is-submitting': isSubmitting,
                            'is-shake': isShaking,
                        }"
                        :disabled="isSubmitting"
                        @click="handleSubmit"
                    >
                        <view class="submit-inner">
                            <view v-if="isSubmitting" class="loading-spinner"></view>
                            <text class="submit-text">
                                {{ isSubmitting ? t('feedback.submitting') : t('feedback.submit') }}
                            </text>
                        </view>
                    </button>
                </view>
            </view>
        </scroll-view>
    </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTranslateParams } from '@/utils/i18n.js';
import { useUserStore } from '@/stores/user';
import { apiPostFeedback, apiUploadFeedback } from '@/api/wallpaper.js';
import { getDeviceId } from '@/api/request.js';
import { getStatusBarHeight } from '@/utils/layout.js';
import { useSettingsStore } from '@/stores/settings.js';
import { CHANNEL } from '@/common/config.js';
import { validateTextSecurity, validateImagesSecurityBatch } from '@/utils/security.js';
// #ifdef APP-PLUS
import { chooseSystemMedia } from '@/uni_modules/uni-chooseSystemImage';
// #endif

const { t } = useI18n();
const { tp } = useTranslateParams();
const userStore = useUserStore();
const settingsStore = useSettingsStore();

const statusBarHeight = ref(getStatusBarHeight() || 0);
const isContentFocused = ref(false);
const isContactFocused = ref(false);

const feedbackTypes = computed(() => [
    t('feedback.typeBug'),
    t('feedback.typeSuggestion'),
    t('feedback.typeOther'),
]);

const feedbackForm = reactive({
    type: t('feedback.typeBug'),
    content: '',
    contact: userStore.userinfo?.email || '',
});

const imageList = ref([]);
const maxImages = 9;
const isSubmitting = ref(false);
const isShaking = ref(false);

const canSubmit = computed(() => {
    return feedbackForm.content.trim().length >= 10;
});

const triggerShake = () => {
    isShaking.value = true;
    setTimeout(() => {
        isShaking.value = false;
    }, 450);
};

const selectType = (type) => {
    if (feedbackForm.type !== type) {
        // #ifdef APP-PLUS || MP-WEIXIN
        try {
            uni.vibrateShort({ type: 'light' });
        } catch (e) {}
        // #endif
        feedbackForm.type = type;
    }
};

const chooseImage = () => {
    const remaining = maxImages - imageList.value.length;
    if (remaining <= 0) {
        uni.showToast({
            title: tp('feedback.maxImagesReached', { max: maxImages }),
            icon: 'none',
        });
        return;
    }
    selectImage(remaining);
};

const showPermissionModal = () => {
    uni.showModal({
        title: t('feedback.permissionTitle'),
        content: t('feedback.permissionContent'),
        confirmText: t('feedback.goToSettings'),
        cancelText: t('common.cancel'),
        success: (res) => {
            if (res.confirm) {
                uni.openAppAuthorizeSetting({
                    fail: () => {
                        uni.openSetting();
                    },
                });
            }
        },
    });
};

const selectImage = (count) => {
    // #ifdef APP-PLUS
    const channel = plus.runtime.channel;
    if (channel === 'google') {
        chooseSystemMedia({
            count: count,
            mediaType: ['image'],
            success: (res) => {
                imageList.value.push(...(res.filePaths || []));
            },
            fail: (err) => {
                if (err?.errCode === 2101001) return;
                if (err?.errCode === 2101005 || /permission|权限|denied|拒绝/i.test(err?.errMsg || '')) {
                    showPermissionModal();
                } else {
                    uni.showToast({ title: t('feedback.imageSelectFailed') + (err ? ' ' + JSON.stringify(err) : ''), icon: 'none' });
                }
            },
        });
        return;
    }
    // #endif

    uni.chooseImage({
        count: count,
        sizeType: ['compressed'],
        sourceType: ['camera', 'album'],
        success: async (res) => {
            const rawPaths = res.tempFilePaths || [];
            // #ifdef MP-WEIXIN
            const checkRes = await validateImagesSecurityBatch(rawPaths);
            if (!checkRes.pass) return;
            imageList.value.push(...checkRes.safePaths);
            // #endif
            // #ifndef MP-WEIXIN
            imageList.value.push(...rawPaths);
            // #endif
        },
        fail: (err) => {
            if (err.errMsg && (err.errMsg.toLowerCase().includes('permission') || err.errMsg.includes('权限'))) {
                showPermissionModal();
            } else {
                uni.showToast({ title: t('feedback.imageSelectFailed'), icon: 'none' });
            }
        },
    });
};

const previewImage = (index) => {
    uni.previewImage({
        urls: imageList.value,
        current: index,
    });
};

const removeImage = (index) => {
    imageList.value.splice(index, 1);
};

const goBack = () => {
    uni.navigateBack({
        fail: () => uni.redirectTo({ url: '/pages/settings/settings' }),
    });
};

const handleSubmit = async () => {
    if (isSubmitting.value) return;

    const trimmedContent = feedbackForm.content.trim();

    if (!trimmedContent) {
        // #ifdef APP-PLUS || MP-WEIXIN
        try {
            uni.vibrateShort({ type: 'light' });
        } catch (e) {}
        // #endif
        triggerShake();
        uni.showToast({
            title: t('feedback.contentRequired'),
            icon: 'none',
        });
        isContentFocused.value = true;
        return;
    }

    if (trimmedContent.length < 10) {
        // #ifdef APP-PLUS || MP-WEIXIN
        try {
            uni.vibrateShort({ type: 'light' });
        } catch (e) {}
        // #endif
        triggerShake();
        const needCount = 10 - trimmedContent.length;
        uni.showToast({
            title: tp('feedback.needMoreChars', { count: needCount }),
            icon: 'none',
        });
        isContentFocused.value = true;
        return;
    }

    // #ifdef MP-WEIXIN
    const isContentSafe = await validateTextSecurity(trimmedContent);
    if (!isContentSafe) return;
    if (imageList.value.length > 0) {
        const checkRes = await validateImagesSecurityBatch(imageList.value);
        if (!checkRes.pass) return;
    }
    // #endif

    // #ifdef APP-PLUS || MP-WEIXIN
    try {
        uni.vibrateShort({ type: 'medium' });
    } catch (e) {}
    // #endif

    isSubmitting.value = true;

    try {
        const data = {
            channel: CHANNEL,
            device_id: getDeviceId(),
            fb_type: feedbackForm.type,
            type: feedbackForm.type,
            content: trimmedContent,
            contact: feedbackForm.contact.trim(),
        };

        if (imageList.value.length > 0) {
            data.images = imageList.value;
            await apiUploadFeedback(data);
        } else {
            await apiPostFeedback(data);
        }

        // #ifdef APP-PLUS || MP-WEIXIN
        try {
            uni.vibrateShort({ type: 'heavy' });
        } catch (e) {}
        // #endif

        uni.showToast({
            title: t('feedback.submitSuccess'),
            icon: 'none',
            duration: 2000,
        });

        feedbackForm.content = '';
        feedbackForm.contact = userStore.userinfo?.email || '';
        feedbackForm.type = t('feedback.typeBug');
        imageList.value = [];

        setTimeout(() => {
            goBack();
        }, 1500);
    } catch (error) {
        console.error('提交反馈失败:', error);
        uni.showToast({
            title: error?.message || error?.detail || t('feedback.submitFailed'),
            icon: 'none',
        });
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: var(--page-background);
    display: flex;
    flex-direction: column;
}

/* 顶部导航栏 (与 widgets.vue / rotate.vue 保持完全一致) */
.nav-header {
    width: 100%;
    background: var(--page-background);
    position: sticky;
    top: 0;
    z-index: 100;
}

.nav-bar {
    height: 100rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32rpx;

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

    .nav-title {
        font-size: 34rpx;
        font-weight: 700;
        color: var(--text-primary);
        flex: 1;
        text-align: center;
    }

    .nav-placeholder {
        width: 60rpx;
        height: 60rpx;
    }
}

.feedback-scroll {
    flex: 1;
}

.feedback-content {
    padding: 24rpx 32rpx 80rpx;
    display: flex;
    flex-direction: column;
    gap: 36rpx;
    box-sizing: border-box;
}

/* 分组标题与指示 */
.section {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4rpx;
}

.section-title {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--text-secondary);
}

.section-badge {
    font-size: 22rpx;
    color: var(--text-tertiary);
    font-weight: 500;
    transition: color 0.2s ease;

    &.is-met {
        color: #10b981;
    }
}

.section-counter {
    font-size: 22rpx;
    color: var(--text-tertiary);
}

/* 扁平化药丸标签 */
.chip-group {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.chip {
    padding: 16rpx 32rpx;
    border-radius: 999rpx;
    background: var(--panel-background-solid);
    border: 2rpx solid var(--panel-border);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    cursor: pointer;
    box-sizing: border-box;

    .chip-text {
        font-size: 26rpx;
        font-weight: 500;
        color: var(--text-secondary);
        transition: color 0.2s ease;
    }

    &:active {
        transform: scale(0.96);
        opacity: 0.85;
    }

    &.active {
        background: #e5322d;
        border-color: #e5322d;
        box-shadow: 0 4rpx 14rpx rgba(229, 50, 45, 0.3);

        .chip-text {
            color: #ffffff;
            font-weight: 600;
        }
    }
}

/* 扁平输入卡片 */
.flat-card {
    background: var(--panel-background-solid);
    border-radius: 24rpx;
    border: 2rpx solid var(--panel-border);
    transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
    overflow: hidden;
    box-sizing: border-box;

    &.is-focused {
        border-color: #e5322d;
        box-shadow: 0 0 0 2rpx rgba(229, 50, 45, 0.2);
    }
}

.textarea {
    width: 100%;
    min-height: 240rpx;
    border: none;
    background: transparent;
    padding: 24rpx 28rpx;
    font-size: 28rpx;
    color: var(--text-primary);
    line-height: 44rpx;
    box-sizing: border-box;
}

.placeholder-text {
    color: var(--text-tertiary);
    font-size: 26rpx;
}

/* 图片九宫格 */
.image-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16rpx;
}

.image-box {
    position: relative;
    width: 100%;
    padding-bottom: 100%;
    border-radius: 20rpx;
    overflow: hidden;
    background: var(--panel-background-solid);
    border: 2rpx solid var(--panel-border);
    box-sizing: border-box;

    .image-thumb {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    .image-del-btn {
        position: absolute;
        top: 10rpx;
        right: 10rpx;
        width: 44rpx;
        height: 44rpx;
        border-radius: 22rpx;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8rpx);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
        transition: transform 0.15s ease;

        &:active {
            transform: scale(0.85);
        }
    }
}

.image-add-box {
    position: relative;
    width: 100%;
    padding-bottom: 100%;
    border-radius: 20rpx;
    background: var(--panel-background-solid);
    border: 2rpx dashed var(--panel-border);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 0.2s ease, transform 0.2s ease, border-color 0.2s ease;

    &:active {
        opacity: 0.8;
        transform: scale(0.97);
    }

    // 内部定位使其居中
    & > * {
        position: absolute;
    }

    :deep(.mdi-icon) {
        top: 32%;
    }

    .image-add-label {
        bottom: 22%;
        font-size: 22rpx;
        font-weight: 500;
        color: var(--text-tertiary);
    }
}

.image-tip-text {
    font-size: 22rpx;
    color: var(--text-tertiary);
    padding: 0 4rpx;
}

/* 联系方式输入框 */
.contact-card {
    display: flex;
    align-items: center;
    height: 96rpx;
    padding: 0 24rpx;
    gap: 16rpx;
}

.contact-icon {
    display: flex;
    align-items: center;
    justify-content: center;
}

.contact-input {
    flex: 1;
    height: 100%;
    border: none;
    background: transparent;
    font-size: 28rpx;
    color: var(--text-primary);
    box-sizing: border-box;
}

/* 提交按钮 */
.submit-section {
    margin-top: 32rpx;
    padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

.submit-btn {
    width: 100%;
    height: 98rpx;
    border-radius: 28rpx;
    font-size: 30rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
    border: none;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                background 0.25s ease,
                opacity 0.22s ease;
    cursor: pointer;

    &::after {
        border: none;
    }

    // 可提交状态：活力品牌红渐变 + 柔和光晕
    &.is-ready {
        background: linear-gradient(135deg, #e5322d 0%, #ea2e29 100%);
        color: #ffffff;
        box-shadow: 0 8rpx 24rpx rgba(229, 50, 45, 0.35), 0 2rpx 8rpx rgba(229, 50, 45, 0.18);

        &:active {
            transform: scale(0.975);
            opacity: 0.92;
            box-shadow: 0 4rpx 12rpx rgba(229, 50, 45, 0.25);
        }
    }

    // 提交中状态：保持鲜明品牌色，不泛白！加入呼吸微光晕与精致转圈
    &.is-submitting {
        background: linear-gradient(135deg, #e5322d 0%, #d82b26 100%) !important;
        border-color: transparent !important;
        color: #ffffff !important;
        box-shadow: 0 8rpx 28rpx rgba(229, 50, 45, 0.45) !important;
        cursor: not-allowed;
        pointer-events: none;
        animation: submitPulse 1.8s infinite ease-in-out;
    }

    // 未达标禁用状态：清晰低饱和卡片风格
    &.is-disabled {
        background: var(--panel-background-solid);
        border: 2rpx solid var(--panel-border);
        color: var(--text-tertiary);
        box-shadow: none;
        cursor: pointer;

        &:active {
            transform: scale(0.985);
            opacity: 0.8;
        }
    }

    // 点击未满足条件的抖动反馈动画
    &.is-shake {
        animation: btnShake 0.4s ease-in-out;
    }
}

.submit-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    line-height: 1;
}

.submit-text {
    font-size: 30rpx;
    font-weight: 600;
    letter-spacing: 1rpx;
}

.loading-spinner {
    width: 32rpx;
    height: 32rpx;
    border: 3.5rpx solid rgba(255, 255, 255, 0.35);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: btnSpin 0.75s linear infinite;
}

@keyframes btnSpin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

@keyframes submitPulse {
    0%, 100% {
        box-shadow: 0 8rpx 24rpx rgba(229, 50, 45, 0.35);
    }
    50% {
        box-shadow: 0 12rpx 36rpx rgba(229, 50, 45, 0.60);
    }
}

@keyframes btnShake {
    0%, 100% {
        transform: translateX(0);
    }
    20%, 60% {
        transform: translateX(-10rpx);
    }
    40%, 80% {
        transform: translateX(10rpx);
    }
}

/* ── 暗色模式对比度增强 ── */
.theme-dark {
    .section-title {
        color: #f1f5f9;
    }

    .chip {
        background: #222228;
        border-color: rgba(255, 255, 255, 0.14);

        .chip-text {
            color: #d1d5db;
        }

        &.active {
            background: #e5322d;
            border-color: #e5322d;
            box-shadow: 0 4rpx 16rpx rgba(229, 50, 45, 0.35);

            .chip-text {
                color: #ffffff;
            }
        }
    }

    .flat-card {
        background: #222228;
        border-color: rgba(255, 255, 255, 0.14);

        &.is-focused {
            background: #26262e;
            border-color: #e5322d;
            box-shadow: 0 0 0 2rpx rgba(229, 50, 45, 0.25);
        }
    }

    .placeholder-text {
        color: rgba(247, 247, 251, 0.4);
    }

    .image-add-box {
        background: #222228;
        border-color: rgba(255, 255, 255, 0.2);

        .image-add-label {
            color: #9ca3af;
        }
    }

    .image-box {
        border-color: rgba(255, 255, 255, 0.14);
    }

    .submit-btn.is-disabled {
        background: #202026;
        border: 2rpx solid rgba(255, 255, 255, 0.12);
        color: rgba(247, 247, 251, 0.36);
        box-shadow: none;
    }
}

/* ── 浅色模式细节强化 ── */
.theme-light {
    .section-title {
        color: #334155;
    }

    .chip {
        background: #ffffff;
        border-color: rgba(0, 0, 0, 0.08);

        .chip-text {
            color: #475569;
        }

        &.active {
            background: #e5322d;
            border-color: #e5322d;

            .chip-text {
                color: #ffffff;
            }
        }
    }

    .flat-card {
        background: #ffffff;
        border-color: rgba(0, 0, 0, 0.08);
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.02);

        &.is-focused {
            border-color: #e5322d;
        }
    }

    .placeholder-text {
        color: #94a3b8;
    }

    .image-add-box {
        background: #ffffff;
        border-color: rgba(0, 0, 0, 0.14);

        .image-add-label {
            color: #64748b;
        }
    }

    .image-box {
        border-color: rgba(0, 0, 0, 0.08);
    }

    .submit-btn.is-disabled {
        background: #f1f5f9;
        border: 2rpx solid #e2e8f0;
        color: #94a3b8;
        box-shadow: none;
    }
}
</style>
