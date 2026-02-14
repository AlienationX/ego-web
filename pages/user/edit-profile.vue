<template>
    <view class="layout">
        <menu-bar>
            <template #title>{{ t('user.profile.editProfile') }}</template>
        </menu-bar>

        <view class="content">
            <form>
                <!-- 头像 -->
                <view class="avatar-section">
                    <view class="avatar-wrapper" @click="chooseAvatar">
                        <image :src="userinfo.profile.avatar" mode="aspectFill" class="avatar-image"></image>
                        <view class="avatar-overlay">
                            <uni-icons type="camera-filled" size="32" color="#fff"></uni-icons>
                            <text class="avatar-tip">{{ t('user.profile.changeAvatar') }}</text>
                        </view>
                    </view>
                    <text class="avatar-hint">{{ t('user.profile.avatarHint') }}</text>
                </view>

                <!-- 昵称 -->
                <view class="form-item">
                    <view class="label">{{ t('user.profile.nickname') }}</view>
                    <input
                        v-model="formData.nickname"
                        type="text"
                        class="input"
                        :placeholder="t('user.profile.nicknamePlaceholder')"
                        maxlength="20"
                    />
                </view>

                <!-- 邮箱 -->
                <view class="form-item">
                    <view class="label">{{ t('user.profile.email') }}</view>
                    <input
                        v-model="formData.email"
                        type="email"
                        class="input"
                        :placeholder="t('user.profile.emailPlaceholder')"
                        disabled
                    />
                </view>

                <!-- 地区 -->
                <view class="form-item">
                    <view class="label">{{ t('user.profile.region') }}</view>
                    <input
                        v-model="formData.region"
                        type="text"
                        class="input"
                        :placeholder="t('user.profile.regionPlaceholder')"
                    />
                </view>

                <!-- 个人描述 -->
                <view class="form-item">
                    <view class="label">{{ t('user.profile.description') }}</view>
                    <textarea
                        v-model="formData.description"
                        class="textarea"
                        :placeholder="t('user.profile.descriptionPlaceholder')"
                        maxlength="200"
                        rows="4"
                    ></textarea>
                    <view class="char-count">{{ formData.description.length }}/200</view>
                </view>

                <!-- 保存按钮 -->
                <button class="save-btn" @click="saveProfile">
                    {{ t('user.profile.save') }}
                </button>
            </form>
        </view>
    </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { apiUploadProfile } from '@/api/wallpaper.js';
import { useUserStore } from '@/stores/user.js';
import { API_BASE_URL } from '@/common/config';
import { decrypt } from '@/utils/encryption.js';

const { t } = useI18n();
const userStore = useUserStore();
const userinfo = reactive(userStore.userinfo);

const formData = ref({
    avatar: '',
    nickname: '',
    email: '',
    region: '',
    description: '',
});

const data = ref({});

onLoad(() => {
    // 从用户Store加载当前信息
    formData.value = {
        avatar: userinfo.profile.avatar,
        nickname: userinfo.profile.nickname || '',
        email: userinfo.email || '',
        region: userinfo.profile.region || '',
        description: userinfo.profile.description || '',
    };
});

const chooseAvatar = () => {
    uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
            const tempFilePath = res.tempFilePaths[0];
            formData.value.avatar = tempFilePath;
        },
        fail: (err) => {
            uni.showToast({
                title: t('user.profile.chooseAvatarFailed'),
                icon: 'none',
            });
        },
    });
};

const saveProfile = async () => {
    // 1. 验证表单
    if (!formData.value.nickname.trim()) {
        uni.showToast({
            title: t('user.profile.nicknameRequired'),
            icon: 'none',
        });
        return;
    }

    if (formData.value.avatar !== userStore.userinfo.profile.avatar) {
        const { avatar, ...rest } = formData.value;
        data.value = rest;
    }
    const res = await apiUploadProfile(data.value);
    console.log(res);

    // 2. 上传文件
    // uni.uploadFile({
    //     url: `${API_BASE_URL}/user/update_profile/`,
    //     filePath: formData.value.avatar,
    //     name: 'avatar', // 关键：与后端约定的文件字段名
    //     header: {
    //         'Access-Key': 'secret-insecure-88hefbf6c!mrv5x(xa4swy-h3y41f()(8xh6syj(xi&m!!h$#b',
    //         Authorization: `Bearer ${decrypt(userStore.accessToken)}`,
    //     },
    //     formData: data,
    //     success: (res) => {
    //         if (res.code === 200) {
    //             // 更新用户信息
    //             userStore.userinfo = {
    //                 ...userStore.userinfo,
    //                 ...formData.value,
    //             };

    //             // 显示成功提示
    //             uni.showToast({
    //                 title: t('user.profile.saveSuccess'),
    //                 icon: 'none',
    //             });

    //             // 延迟返回上一页
    //             setTimeout(() => {
    //                 uni.navigateBack();
    //             }, 1000);
    //         }
    //     },
    //     fail: (err) => {
    //         console.error('修改失败:', err);
    //         uni.showToast({ title: `修改失败: {err}`, icon: 'none' });
    //     },
    // });
};
</script>

<style lang="scss" scoped>
.layout {
    background-color: #f5f5f5;
    min-height: 100vh;
    width: 100%;
    position: relative;
}

.content {
    padding: 20rpx 30rpx 40rpx;
}

.avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 40rpx;
}

.avatar-wrapper {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    border: 3rpx solid #e5e5e5;
    transition: all 0.3s;

    &:active {
        transform: scale(0.95);
    }
}

.avatar-image {
    width: 100%;
    height: 100%;
}

.avatar-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s;
}

.avatar-wrapper:hover .avatar-overlay,
.avatar-wrapper:active .avatar-overlay {
    opacity: 1;
}

.avatar-tip {
    color: #fff;
    font-size: 20rpx;
    margin-top: 8rpx;
}

.avatar-hint {
    margin-top: 16rpx;
    font-size: 24rpx;
    color: #999;
    text-align: center;
}

.form-item {
    margin-bottom: 30rpx;
    position: relative;

    &:last-child {
        margin-bottom: 40rpx;
    }
}

.label {
    font-size: 28rpx;
    color: #333;
    font-weight: 600;
    margin-bottom: 12rpx;
    display: block;
}

.input {
    width: 100%;
    height: 80rpx;
    border: 1rpx solid #e5e5e5;
    border-radius: 12rpx;
    padding: 0 24rpx;
    font-size: 28rpx;
    color: #333;
    background-color: #fafafa;
    transition: all 0.3s;
    box-sizing: border-box;

    &:focus {
        border-color: #28b389;
        background-color: #fff;
        box-shadow: 0 0 0 2rpx rgba(40, 179, 137, 0.1);
    }

    &:disabled {
        background-color: #f5f5f5;
        color: #999;
        cursor: not-allowed;
    }

    &::placeholder {
        color: #999;
        font-size: 26rpx;
    }
}

.textarea {
    width: 100%;
    border: 1rpx solid #e5e5e5;
    border-radius: 12rpx;
    padding: 24rpx;
    font-size: 28rpx;
    color: #333;
    background-color: #fafafa;
    transition: all 0.3s;
    resize: none;
    min-height: 160rpx;
    box-sizing: border-box;

    &:focus {
        border-color: #28b389;
        background-color: #fff;
        box-shadow: 0 0 0 2rpx rgba(40, 179, 137, 0.1);
    }

    &::placeholder {
        color: #999;
        font-size: 26rpx;
    }
}

.char-count {
    position: absolute;
    bottom: 12rpx;
    right: 20rpx;
    font-size: 22rpx;
    color: #999;
}

.save-btn {
    width: 100%;
    height: 80rpx;
    background: linear-gradient(135deg, #28b389 0%, #219a7a 100%);
    color: #fff;
    font-size: 32rpx;
    font-weight: 600;
    border-radius: 40rpx;
    border: none;
    transition: all 0.3s;

    &:active {
        background: linear-gradient(135deg, #219a7a 0%, #1d8b6a 100%);
        transform: scale(0.98);
    }

    &::after {
        border: none;
    }
}
</style>
