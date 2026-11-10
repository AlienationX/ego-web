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
                            {{ canSubmit ? `${feedbackForm.content.trim().length}/500` : `还需 ${10 - feedbackForm.content.trim().length} 字` }}
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
                            <mdi-icon path="/static/icons/camera.svg" size="26px" :color="settingsStore.isDark ? '#6b7280' : '#9ca3af'"></mdi-icon>
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
                            <mdi-icon path="/static/icons/email.svg" size="18px" :color="settingsStore.isDark ? '#6b7280' : '#9ca3af'"></mdi-icon>
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
                        :class="{ disabled: !canSubmit || isSubmitting }"
                        :disabled="!canSubmit || isSubmitting"
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
import { getStatusBarHeight } from '@/utils/layout.js';
import { useSettingsStore } from '@/stores/settings.js';
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

const canSubmit = computed(() => {
    return feedbackForm.content.trim().length >= 10;
});

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
        title: t('feedback.permissionTitle') || '需要访问相册',
        content: t('feedback.permissionContent') || '为了选择本地图片，需要访问您的相册权限。请在设置中开启相册权限。',
        confirmText: t('feedback.goToSettings') || '去设置',
        cancelText: t('common.cancel') || '取消',
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
                    uni.showToast({ title: t('feedback.imageSelectFailed') || '选择图片失败' + JSON.stringify(err), icon: 'none' });
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
                uni.showToast({ title: t('feedback.imageSelectFailed') || '选择图片失败', icon: 'none' });
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
    if (!feedbackForm.content.trim()) {
        uni.showToast({
            title: t('feedback.contentRequired'),
            icon: 'none',
        });
        return;
    }

    // #ifdef MP-WEIXIN
    const isContentSafe = await validateTextSecurity(feedbackForm.content.trim());
    if (!isContentSafe) return;
    if (imageList.value.length > 0) {
        const checkRes = await validateImagesSecurityBatch(imageList.value);
        if (!checkRes.pass) return;
    }
    // #endif

    if (feedbackForm.content.trim().length < 10) {
        uni.showToast({
            title: t('feedback.contentMinLength'),
            icon: 'none',
        });
        return;
    }

    // #ifdef APP-PLUS || MP-WEIXIN
    try {
        uni.vibrateShort({ type: 'medium' });
    } catch (e) {}
    // #endif

    isSubmitting.value = true;

    try {
        const data = {
            type: feedbackForm.type,
            content: feedbackForm.content.trim(),
            contact: feedbackForm.contact.trim(),
        };

        if (imageList.value.length > 0) {
            data.images = imageList.value;
            await apiUploadFeedback(data);
        } else {
            await apiPostFeedback(data);
        }

        uni.showToast({
            title: t('feedback.submitSuccess'),
            icon: 'success',
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
            title: t('feedback.submitFailed'),
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
    background: var(--page-background-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    cursor: pointer;

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

        .chip-text {
            color: #ffffff;
            font-weight: 600;
        }
    }
}

/* 扁平输入卡片 */
.flat-card {
    background: var(--page-background-secondary);
    border-radius: 24rpx;
    border: 2rpx solid transparent;
    transition: border-color 0.2s ease, background 0.2s ease;
    overflow: hidden;
    box-sizing: border-box;

    &.is-focused {
        border-color: #e5322d;
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
    background: var(--page-background-secondary);

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
    background: var(--page-background-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 0.2s ease, transform 0.2s ease;

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
    margin-top: 24rpx;
    padding-bottom: env(safe-area-inset-bottom);
}

.submit-btn {
    width: 100%;
    height: 96rpx;
    border-radius: 24rpx;
    background: #e5322d;
    color: #ffffff;
    font-size: 30rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    transition: all 0.2s ease;
    cursor: pointer;

    &::after {
        border: none;
    }

    &:active:not(.disabled) {
        transform: scale(0.98);
        opacity: 0.9;
    }

    &.disabled {
        background: var(--page-background-secondary);
        color: var(--text-tertiary);
        opacity: 0.6;
        cursor: not-allowed;
    }
}

.submit-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
}

.submit-text {
    font-size: 30rpx;
    font-weight: 600;
}

.loading-spinner {
    width: 32rpx;
    height: 32rpx;
    border: 3rpx solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

/* 暗色模式微调 */
.theme-dark {
    .flat-card {
        background: var(--page-background-secondary);
    }
}
</style>
