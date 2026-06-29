<template>
    <view class="layout" :class="isDark ? 'theme-dark' : 'theme-light'">
        <view class="header" :style="{ paddingTop: statusBarHeight + 'px', height: titleBarHeight + 'px' }">
            <view class="header-inner" :style="{ height: titleBarHeight + 'px' }">
                <view class="back-btn" @click="goBack">
                    <uni-icons type="back" size="18" :color="backIconColor"></uni-icons>
                </view>
                <text class="header-title">{{ t('feedback.title') }}</text>
                <view class="header-placeholder"></view>
            </view>
        </view>

        <view class="content">
            <view class="section">
                <text class="section-title">{{ t('feedback.type') }}</text>
                <view class="chip-group">
                    <view
                        class="chip"
                        :class="{ active: feedbackForm.type === t('feedback.typeBug') }"
                        @click="selectType(t('feedback.typeBug'))"
                    >
                        {{ t('feedback.typeBug') }}
                    </view>
                    <view
                        class="chip"
                        :class="{ active: feedbackForm.type === t('feedback.typeSuggestion') }"
                        @click="selectType(t('feedback.typeSuggestion'))"
                    >
                        {{ t('feedback.typeSuggestion') }}
                    </view>
                    <view
                        class="chip"
                        :class="{ active: feedbackForm.type === t('feedback.typeOther') }"
                        @click="selectType(t('feedback.typeOther'))"
                    >
                        {{ t('feedback.typeOther') }}
                    </view>
                </view>
            </view>

            <view class="section">
                <text class="section-title">{{ t('feedback.content') }}</text>
                <view class="card">
                    <textarea
                        class="textarea"
                        v-model="feedbackForm.content"
                        :placeholder="t('feedback.contentPlaceholder')"
                        maxlength="500"
                        :show-confirm-bar="false"
                    ></textarea>
                    <view class="char-row">
                        <text class="char-count">{{ feedbackForm.content.length }}/500</text>
                    </view>
                </view>
            </view>

            <view class="section">
                <text class="section-title">{{ t('feedback.images') }}</text>
                <view class="card">
                    <view class="image-list">
                        <view class="image-item" v-for="(image, index) in imageList" :key="index">
                            <image class="image-preview" :src="image" mode="aspectFill" @click="previewImage(index)"></image>
                            <view class="image-delete" @click="removeImage(index)">
                                <uni-icons type="close" size="14" color="#fff"></uni-icons>
                            </view>
                        </view>
                        <view class="image-add" v-if="imageList.length < maxImages" @click="chooseImage">
                            <uni-icons type="plus" size="26" color="#9CA3AF"></uni-icons>
                            <text class="add-text">{{ t('feedback.addImage') }}</text>
                        </view>
                    </view>
                    <view class="image-tip" v-if="imageList.length > 0">
                        {{ tp('feedback.imageTip', { count: imageList.length, max: maxImages }) }}
                    </view>
                </view>
            </view>

            <view class="section">
                <text class="section-title">{{ t('feedback.contact') }}</text>
                <view class="card">
                    <input
                        class="input"
                        v-model="feedbackForm.contact"
                        :placeholder="t('feedback.contactPlaceholder')"
                        type="text"
                        :adjust-position="true"
                        :hold-keyboard="false"
                    />
                </view>
            </view>

            <view class="submit-wrap">
                <button
                    class="submit-btn"
                    :class="{ disabled: !canSubmit }"
                    :disabled="!canSubmit"
                    :loading="isSubmitting"
                    @click="handleSubmit"
                >
                    {{ isSubmitting ? t('feedback.submitting') : t('feedback.submit') }}
                </button>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTranslateParams } from '@/utils/i18n.js';
import { useUserStore } from '@/stores/user';
import { apiPostFeedback, apiUploadFeedback } from '@/api/wallpaper.js';
import { getStatusBarHeight, getTitleBarHeight } from '@/utils/system.js';
import { useSettingsStore } from '@/stores/settings.js';
// #ifdef APP-PLUS
import { chooseSystemMedia } from '@/uni_modules/uni-chooseSystemImage';
// #endif

const { t } = useI18n();
const { tp } = useTranslateParams();
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const isDark = computed(() => settingsStore.isDark);
const backIconColor = computed(() => (isDark.value ? '#e5e7eb' : '#374151'));

const statusBarHeight = ref(getStatusBarHeight() || 0);
const titleBarHeight = ref(getTitleBarHeight() || 44);
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
    feedbackForm.type = type;
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
        // 由于受google play 照片和视频权限政策的影响，使用uni.chooseImage选择图片会调用READ_MEDIA_IMAGES/READ_MEDIA_VIDEO权限，该权限需在Google Play Console中申请
        chooseSystemMedia({
            count: count,
            mediaType: ['image'],
            success: (res) => {
                imageList.value.push(...(res.filePaths || []));
            },
            fail: (err) => {
                // 2101001	用户取消
                if (err?.errCode === 2101001) return;

                // 2101005	权限申请失败
                if (err?.errCode === 2101005 || /permission|权限|denied|拒绝/i.test(err?.errMsg || '')) {
                    showPermissionModal();
                } else {
                    uni.showToast({ title: t('feedback.imageSelectFailed') || '选择图片失败'+JSON.stringify(err), icon: 'none' });
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
        success: (res) => {
            imageList.value.push(...res.tempFilePaths);
        },
        fail: (err) => {
            // console.log("XXXXX", err)
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

    if (feedbackForm.content.trim().length < 10) {
        uni.showToast({
            title: t('feedback.contentMinLength'),
            icon: 'none',
        });
        return;
    }

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

.header {
    width: 100%;
    background: var(--page-background);
    display: flex;
    align-items: center;
}

.header-inner {
    width: 100%;
    padding: 0 32rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
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
    flex-shrink: 0;
}

.header-title {
    flex: 1;
    text-align: center;
    font-size: 32rpx;
    font-weight: 700;
    color: var(--text-primary);
}

.header-placeholder {
    width: 64rpx;
    height: 64rpx;
    flex-shrink: 0;
}

.content {
    padding: 24rpx 32rpx 72rpx;
    box-sizing: border-box;
}

.section {
    margin-bottom: 40rpx;
}

.section-title {
    display: block;
    font-size: 22rpx;
    font-weight: 600;
    color: var(--text-tertiary);
    letter-spacing: 0.07em;
    text-transform: uppercase;
    margin-bottom: 16rpx;
}

.chip-group {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.chip {
    height: 68rpx;
    padding: 0 28rpx;
    border-radius: 40rpx;
    border: 2rpx solid var(--panel-border);
    background: var(--page-background-secondary);
    font-size: 26rpx;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
}

.chip.active {
    background: #e5322d;
    border-color: #e5322d;
    color: #fff;
    font-weight: 600;
}

.card {
    background: var(--page-background-secondary);
    border: 2rpx solid var(--panel-border);
    border-radius: 24rpx;
    overflow: hidden;
    width: 100%;
    box-sizing: border-box;
}

.textarea {
    width: 100%;
    min-height: 320rpx;
    border: none;
    background: transparent;
    padding: 28rpx 32rpx;
    font-size: 28rpx;
    color: var(--text-primary);
    line-height: 44rpx;
    box-sizing: border-box;
}

.char-row {
    border-top: 2rpx solid var(--panel-border);
    padding: 16rpx 32rpx;
    display: flex;
    justify-content: flex-end;
}

.char-count {
    font-size: 22rpx;
    color: var(--text-tertiary);
}

.image-list {
    display: flex;
    flex-wrap: wrap;
    gap: 24rpx;
    padding: 24rpx;
}

.image-item,
.image-add {
    width: 176rpx;
    height: 176rpx;
    border-radius: 24rpx;
    border: 2rpx dashed var(--panel-border);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background: var(--panel-background);
    overflow: hidden;
}

.image-item {
    border-style: solid;
    background: var(--page-background-secondary);
}

.image-preview {
    width: 100%;
    height: 100%;
}

.image-delete {
    position: absolute;
    top: 12rpx;
    right: 12rpx;
    width: 44rpx;
    height: 44rpx;
    border-radius: 22rpx;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
}

.add-text {
    font-size: 22rpx;
    color: var(--text-tertiary);
    margin-top: 12rpx;
}

.image-tip {
    padding: 0 24rpx 24rpx;
    font-size: 24rpx;
    color: var(--text-tertiary);
}

.input {
    width: 100%;
    height: 92rpx;
    border: none;
    background: transparent;
    padding: 0 32rpx;
    font-size: 28rpx;
    color: var(--text-primary);
    box-sizing: border-box;
    display: block;
}

.submit-wrap {
    margin: 32rpx 0;
    padding-bottom: env(safe-area-inset-bottom);
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
    margin: 0;
    padding: 0;
    line-height: 1;
    box-sizing: border-box;

    &::after {
        border: none;
    }
}

.submit-btn.disabled {
    background: var(--panel-background);
    color: var(--text-tertiary);
    border: 2rpx solid var(--panel-border);
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

    .chip {
        background: #1e1e22;
        border: none;
        box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.6);
    }

    .chip.active {
        background: #e5322d;
        box-shadow: 0 4rpx 16rpx rgba(229, 50, 45, 0.3);
        color: #fff;
    }

    .card {
        background: #1e1e22;
        border: none;
        box-shadow:
            inset 0 1rpx 0 rgba(255, 255, 255, 0.06),
            0 8rpx 24rpx rgba(0, 0, 0, 0.28);
    }

    .char-row {
        border-top-color: rgba(255, 255, 255, 0.06);
    }

    .image-item,
    .image-add {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.08);
    }

    .submit-btn.disabled {
        background: rgba(255, 255, 255, 0.07);
        border: none;
        color: rgba(255, 255, 255, 0.3);
    }
}
</style>
