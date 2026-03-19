<template>
    <view class="layout">
        <view class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>
        <view class="header">
            <view class="back-btn" @click="goBack">
                <uni-icons type="back" size="18" color="#374151"></uni-icons>
            </view>
            <text class="header-title">{{ t('feedback.title') }}</text>
            <view class="header-placeholder"></view>
        </view>

        <scroll-view scroll-y class="content" :style="{ height: contentHeight }">
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
                        {{ t('feedback.imageTip').replace('{count}', imageList.length).replace('{max}', maxImages) }}
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
        </scroll-view>
    </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiPostFeedback } from '@/api/wallpaper.js';
import { getStatusBarHeight } from '@/utils/system.js';

const { t } = useI18n();

const statusBarHeight = ref(getStatusBarHeight() || 0);
const contentHeight = computed(() => `calc(100vh - ${statusBarHeight.value}px - 56px)`);

const feedbackForm = reactive({
    type: t('feedback.typeBug'),
    content: '',
    contact: '',
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
            title: t('feedback.maxImagesReached').replace('{max}', maxImages),
            icon: 'none',
        });
        return;
    }
    selectImage(remaining);
};

const selectImage = (count) => {
    uni.chooseImage({
        count: count,
        sizeType: ['compressed'],
        sourceType: ['camera', 'album'],
        success: (res) => {
            const tempFilePaths = res.tempFilePaths;
            imageList.value.push(...tempFilePaths);
        },
        fail: (err) => {
            console.error('选择图片失败:', err);
            // #ifdef APP-PLUS
            const errMsg = err.errMsg || '';
            if (
                errMsg.includes('permission') ||
                errMsg.includes('权限') ||
                errMsg.includes('denied') ||
                errMsg.includes('拒绝')
            ) {
                uni.showModal({
                    title: t('feedback.permissionTitle') || '需要访问相册',
                    content:
                        t('feedback.permissionContent') || '为了上传反馈图片，需要访问您的相册权限。请在设置中开启相册权限。',
                    confirmText: t('feedback.goToSettings') || '去设置',
                    cancelText: t('common.cancel') || '取消',
                    success: (res) => {
                        if (res.confirm) {
                            // #ifdef APP-PLUS
                            if (typeof plus !== 'undefined' && plus.runtime) {
                                plus.runtime.openURL('app-settings:');
                            } else {
                                uni.openSetting();
                            }
                            // #endif
                        }
                    },
                });
            } else {
                uni.showToast({
                    title: t('feedback.imageSelectFailed') || '选择图片失败',
                    icon: 'none',
                });
            }
            // #endif

            // #ifdef MP
            if (err.errMsg && (err.errMsg.includes('permission') || err.errMsg.includes('权限'))) {
                uni.showModal({
                    title: t('feedback.permissionTitle') || '需要访问相册',
                    content:
                        t('feedback.permissionContent') || '为了上传反馈图片，需要访问您的相册权限。请在设置中开启相册权限。',
                    confirmText: t('feedback.goToSettings') || '去设置',
                    cancelText: t('common.cancel') || '取消',
                    success: (res) => {
                        if (res.confirm) {
                            uni.openSetting({
                                success: (settingRes) => {
                                    if (settingRes.authSetting['scope.album']) {
                                        selectImage(count);
                                    }
                                },
                            });
                        }
                    },
                });
            } else {
                uni.showToast({
                    title: t('feedback.imageSelectFailed') || '选择图片失败',
                    icon: 'none',
                });
            }
            // #endif

            // #ifndef APP-PLUS || MP
            uni.showToast({
                title: t('feedback.imageSelectFailed') || '选择图片失败',
                icon: 'none',
            });
            // #endif
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
        fail: () => uni.reLaunch({ url: '/pages/settings/settings' }),
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
        let images = [];
        if (imageList.value.length > 0) {
            for (const imagePath of imageList.value) {
                console.log('upload imagePath:', imagePath);
                try {
                    const base64 = await new Promise((resolve, reject) => {
                        uni.getFileSystemManager().readFile({
                            filePath: imagePath,
                            encoding: 'base64',
                            success: (res) => {
                                resolve(`data:image/jpeg;base64,${res.data}`);
                            },
                            fail: reject,
                        });
                    });
                    images.push(base64);
                } catch (error) {
                    console.error('图片转换失败:', error);
                }
            }
        }

        const data = {
            type: feedbackForm.type,
            content: feedbackForm.content.trim(),
            contact: feedbackForm.contact.trim() || undefined,
            images: images.length > 0 ? images : undefined,
        };

        await apiPostFeedback(data);

        uni.showToast({
            title: t('feedback.submitSuccess'),
            icon: 'success',
            duration: 2000,
        });

        feedbackForm.content = '';
        feedbackForm.contact = '';
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
    color: #9ca3af;
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
    border: 2rpx solid #e5e7eb;
    background: #fff;
    font-size: 26rpx;
    color: #6b7280;
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
    background: #fff;
    border: 2rpx solid #f0f1f3;
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
    color: #111827;
    line-height: 44rpx;
    box-sizing: border-box;
}

.char-row {
    border-top: 2rpx solid #f3f4f6;
    padding: 16rpx 32rpx;
    display: flex;
    justify-content: flex-end;
}

.char-count {
    font-size: 22rpx;
    color: #9ca3af;
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
    border: 2rpx dashed #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background: #f9fafb;
    overflow: hidden;
}

.image-item {
    border-style: solid;
    background: #fff;
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
    color: #9ca3af;
    margin-top: 12rpx;
}

.image-tip {
    padding: 0 24rpx 24rpx;
    font-size: 24rpx;
    color: #9ca3af;
}

.input {
    width: 100%;
    height: 92rpx;
    border: none;
    background: transparent;
    padding: 0 32rpx;
    font-size: 28rpx;
    color: #111827;
    box-sizing: border-box;
    display: block;
}

.submit-wrap {
    margin-top: 16rpx;
}

.submit-btn {
    width: 100%;
    height: 100rpx;
    border-radius: 24rpx;
    background: #e5322d;
    border: none;
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
}

.submit-btn.disabled {
    background: #f3f4f6;
    color: #9ca3af;
}
</style>
