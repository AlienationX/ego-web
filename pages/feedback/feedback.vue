<template>
    <view class="layout">
        <menu-bar>
            <template #title>{{ t('feedback.title') }}</template>
        </menu-bar>
        
        <view class="container">
            <view class="form">
                <!-- 反馈类型 -->
                <view class="form-item">
                    <view class="label">{{ t('feedback.type') }}</view>
                    <view class="type-selector">
                        <view 
                            class="type-item" 
                            :class="{ active: feedbackForm.type === 'bug' }"
                            @click="selectType('bug')"
                        >
                            {{ t('feedback.typeBug') }}
                        </view>
                        <view 
                            class="type-item" 
                            :class="{ active: feedbackForm.type === 'suggestion' }"
                            @click="selectType('suggestion')"
                        >
                            {{ t('feedback.typeSuggestion') }}
                        </view>
                        <view 
                            class="type-item" 
                            :class="{ active: feedbackForm.type === 'other' }"
                            @click="selectType('other')"
                        >
                            {{ t('feedback.typeOther') }}
                        </view>
                    </view>
                </view>

                <!-- 反馈内容 -->
                <view class="form-item">
                    <view class="label">{{ t('feedback.content') }}</view>
                    <textarea 
                        class="textarea"
                        v-model="feedbackForm.content"
                        :placeholder="t('feedback.contentPlaceholder')"
                        maxlength="500"
                        :show-confirm-bar="false"
                    ></textarea>
                    <view class="char-count">{{ feedbackForm.content.length }}/500</view>
                </view>

                <!-- 图片上传 -->
                <view class="form-item">
                    <view class="label">{{ t('feedback.images') }}</view>
                    <view class="image-upload">
                        <view class="image-list">
                            <view 
                                class="image-item" 
                                v-for="(image, index) in imageList" 
                                :key="index"
                            >
                                <image 
                                    class="image-preview" 
                                    :src="image" 
                                    mode="aspectFill"
                                    @click="previewImage(index)"
                                ></image>
                                <view class="image-delete" @click="removeImage(index)">
                                    <uni-icons type="close" size="16" color="#fff"></uni-icons>
                                </view>
                            </view>
                            <view 
                                class="image-add" 
                                v-if="imageList.length < maxImages"
                                @click="chooseImage"
                            >
                                <uni-icons type="plus" size="32" color="#999"></uni-icons>
                                <text class="add-text">{{ t('feedback.addImage') }}</text>
                            </view>
                        </view>
                        <view class="image-tip" v-if="imageList.length > 0">
                            {{ t('feedback.imageTip').replace('{count}', imageList.length).replace('{max}', maxImages) }}
                        </view>
                    </view>
                </view>

                <!-- 联系方式 -->
                <view class="form-item">
                    <view class="label">{{ t('feedback.contact') }}</view>
                    <input 
                        class="input"
                        v-model="feedbackForm.contact"
                        :placeholder="t('feedback.contactPlaceholder')"
                        type="text"
                        :adjust-position="true"
                        :hold-keyboard="false"
                    />
                </view>

                <!-- 提交按钮 -->
                <view class="submit-btn-wrapper">
                    <button 
                        class="submit-btn" 
                        :disabled="isSubmitting || !canSubmit"
                        :loading="isSubmitting"
                        @click="handleSubmit"
                    >
                        {{ isSubmitting ? t('feedback.submitting') : t('feedback.submit') }}
                    </button>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
    import { ref, reactive, computed } from 'vue';
    import { onLoad } from '@dcloudio/uni-app';
    import { useI18n } from 'vue-i18n';
    import { apiPostFeedback } from '@/api/wallpaper.js';

    const { t } = useI18n();

    const feedbackForm = reactive({
        type: 'bug', // bug, suggestion, other
        content: '',
        contact: ''
    });

    const imageList = ref([]);
    const maxImages = 9; // 最多上传9张图片
    const isSubmitting = ref(false);

    const canSubmit = computed(() => {
        return feedbackForm.content.trim().length >= 10;
    });

    const selectType = (type) => {
        feedbackForm.type = type;
    };

    // 选择图片
    const chooseImage = () => {
        const remaining = maxImages - imageList.value.length;
        if (remaining <= 0) {
            uni.showToast({
                title: t('feedback.maxImagesReached').replace('{max}', maxImages),
                icon: 'none'
            });
            return;
        }

        uni.chooseImage({
            count: remaining,
            sizeType: ['compressed'], // 压缩图片
            sourceType: ['camera', 'album'], // 可以从相机或相册选择
            success: (res) => {
                const tempFilePaths = res.tempFilePaths;
                imageList.value.push(...tempFilePaths);
            },
            fail: (err) => {
                console.error('选择图片失败:', err);
            }
        });
    };

    // 预览图片
    const previewImage = (index) => {
        uni.previewImage({
            urls: imageList.value,
            current: index
        });
    };

    // 删除图片
    const removeImage = (index) => {
        imageList.value.splice(index, 1);
    };

    const handleSubmit = async () => {
        // 验证反馈内容
        if (!feedbackForm.content.trim()) {
            uni.showToast({
                title: t('feedback.contentRequired'),
                icon: 'none'
            });
            return;
        }

        if (feedbackForm.content.trim().length < 10) {
            uni.showToast({
                title: t('feedback.contentMinLength'),
                icon: 'none'
            });
            return;
        }

        isSubmitting.value = true;

        try {
            // 处理图片：转换为 base64 或上传到服务器
            let images = [];
            if (imageList.value.length > 0) {
                // 将图片转换为 base64
                for (const imagePath of imageList.value) {
                    try {
                        const base64 = await new Promise((resolve, reject) => {
                            uni.getFileSystemManager().readFile({
                                filePath: imagePath,
                                encoding: 'base64',
                                success: (res) => {
                                    resolve(`data:image/jpeg;base64,${res.data}`);
                                },
                                fail: reject
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
                images: images.length > 0 ? images : undefined
            };

            await apiPostFeedback(data);

            uni.showToast({
                title: t('feedback.submitSuccess'),
                icon: 'success',
                duration: 2000
            });

            // 清空表单
            feedbackForm.content = '';
            feedbackForm.contact = '';
            feedbackForm.type = 'bug';
            imageList.value = [];

            // 延迟返回上一页
            setTimeout(() => {
                uni.navigateBack();
            }, 2000);
        } catch (error) {
            console.error('提交反馈失败:', error);
            uni.showToast({
                title: t('feedback.submitFailed'),
                icon: 'none'
            });
        } finally {
            isSubmitting.value = false;
        }
    };

</script>

<style lang="scss" scoped>
    .layout {
        background-color: #f5f5f5;
        min-height: 100vh;
        
        .container {
            padding: 40rpx 30rpx;
            position: relative;
            z-index: 1;
            
            .form {
                .form-item {
                    margin-bottom: 50rpx;
                    position: relative;
                    
                    &:last-child {
                        margin-bottom: 0;
                    }
                    
                    .label {
                        font-size: 32rpx;
                        color: #333;
                        font-weight: 600;
                        margin-bottom: 24rpx;
                    }
                    
                    .type-selector {
                        display: flex;
                        gap: 20rpx;
                        flex-wrap: wrap;
                        
                        .type-item {
                            flex: 1;
                            min-width: 180rpx;
                            padding: 24rpx 30rpx;
                            text-align: center;
                            border-radius: 16rpx;
                            font-size: 28rpx;
                            color: #666;
                            background: #fff;
                            transition: all 0.3s;
                            
                            &:active {
                                transform: scale(0.98);
                            }
                            
                            &.active {
                                background: #28b389;
                                color: #fff;
                                font-weight: 500;
                            }
                        }
                    }
                    
                    .textarea {
                        width: 100%;
                        min-height: 320rpx;
                        padding: 24rpx;
                        border-radius: 16rpx;
                        font-size: 28rpx;
                        color: #333;
                        background: #fff;
                        box-sizing: border-box;
                        line-height: 1.8;
                        
                        &:focus {
                            background: #fff;
                        }
                    }
                    
                    .char-count {
                        text-align: right;
                        font-size: 24rpx;
                        color: #999;
                        margin-top: 12rpx;
                    }
                    
                    .input {
                        width: 100%;
                        min-height: 88rpx;
                        padding: 24rpx;
                        border-radius: 16rpx;
                        font-size: 28rpx;
                        color: #333;
                        background: #fff;
                        box-sizing: border-box;
                        position: relative;
                        z-index: 2;
                        -webkit-user-select: text;
                        user-select: text;
                        
                        &:focus {
                            background: #fff;
                        }
                    }
                    
                    .image-upload {
                        .image-list {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 20rpx;
                            
                            .image-item {
                                position: relative;
                                width: 200rpx;
                                height: 200rpx;
                                border-radius: 16rpx;
                                overflow: hidden;
                                
                                .image-preview {
                                    width: 100%;
                                    height: 100%;
                                }
                                
                                .image-delete {
                                    position: absolute;
                                    top: 8rpx;
                                    right: 8rpx;
                                    width: 48rpx;
                                    height: 48rpx;
                                    background: rgba(0, 0, 0, 0.6);
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                }
                            }
                            
                            .image-add {
                                width: 200rpx;
                                height: 200rpx;
                                border-radius: 16rpx;
                                background: #fff;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                border: 2rpx dashed #ddd;
                                
                                .add-text {
                                    margin-top: 12rpx;
                                    font-size: 24rpx;
                                    color: #999;
                                }
                                
                                &:active {
                                    background: #f8f8f8;
                                }
                            }
                        }
                        
                        .image-tip {
                            margin-top: 16rpx;
                            font-size: 24rpx;
                            color: #999;
                        }
                    }
                }
                
                .submit-btn-wrapper {
                    margin-top: 80rpx;
                    
                    .submit-btn {
                        width: 100%;
                        height: 96rpx;
                        line-height: 96rpx;
                        background: #28b389;
                        color: #fff;
                        font-size: 32rpx;
                        font-weight: 500;
                        border-radius: 16rpx;
                        border: none;
                        
                        &:active {
                            opacity: 0.9;
                            transform: scale(0.99);
                        }
                        
                        &:disabled {
                            background: #d0d0d0;
                            opacity: 1;
                            transform: none;
                        }
                        
                        &::after {
                            border: none;
                        }
                    }
                }
            }
        }
    }
</style>