<template>
    <view class="layout">
        <view class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>
        <view class="header">
            <view class="back-btn" @click="goBack">
                <uni-icons type="back" size="18" color="#374151"></uni-icons>
            </view>
            <text class="header-title">{{ t('editProfile1.title') }}</text>
            <view class="header-placeholder"></view>
        </view>

        <scroll-view scroll-y class="content">
            <view class="avatar-area">
                <view class="avatar-wrap">
                    <image class="avatar" :src="form.avatar" mode="aspectFill"></image>
                    <view class="camera-btn" @click="chooseAvatar">
                        <uni-icons type="camera-filled" size="13" color="#fff"></uni-icons>
                    </view>
                </view>
                <text class="avatar-tip">{{ t('editProfile1.changePhoto') }}</text>
            </view>

            <view class="section-title">{{ t('editProfile1.personalInfo') }}</view>
            <view class="card">
                <view class="field">
                    <text class="field-label">{{ t('editProfile1.fullName') }}</text>
                    <input v-model="form.nickname" class="field-input" :placeholder="t('editProfile1.placeholders.fullName')" />
                </view>
                <view class="field">
                    <text class="field-label">{{ t('editProfile1.email') }}</text>
                    <input
                        v-model="form.email"
                        class="field-input"
                        :placeholder="t('editProfile1.placeholders.email')"
                        disabled
                    />
                </view>
                <view class="field field-last">
                    <text class="field-label">{{ t('editProfile1.phone') }}</text>
                    <input
                        v-model="form.phone_number"
                        class="field-input"
                        :placeholder="t('editProfile1.placeholders.phone')"
                    />
                </view>
            </view>

            <view class="section-title">{{ t('editProfile1.workInfo') }}</view>
            <view class="card">
                <view class="field">
                    <text class="field-label">{{ t('editProfile1.region') }}</text>
                    <input v-model="form.region" class="field-input" :placeholder="t('editProfile1.placeholders.region')" />
                </view>
                <view class="field field-last">
                    <text class="field-label">{{ t('editProfile1.description') }}</text>
                    <input
                        v-model="form.description"
                        class="field-input"
                        :placeholder="t('editProfile1.placeholders.description')"
                    />
                    <!-- <textarea
                        v-model="form.description"
                        class="field-textarea"
                        :placeholder="t('editProfile1.placeholders.description')"
                        rows="2"
                    /> -->
                </view>
            </view>

            <button class="save-btn" @click="handleSave">
                <uni-icons v-if="saved" type="checkmarkempty" size="16" color="#fff"></uni-icons>
                <text>{{ saved ? t('editProfile1.profileSaved') : t('editProfile1.saveChanges') }}</text>
            </button>
        </scroll-view>
    </view>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user.js';
import { apiPostProfile, apiUploadProfile } from '@/api/wallpaper.js';
import { getStatusBarHeight } from '@/utils/system.js';

const userStore = useUserStore();
const { t } = useI18n();
const statusBarHeight = ref(getStatusBarHeight() || 0);
const saved = ref(false);

const form = reactive({
    avatar: userStore.userinfo?.profile?.avatar || '/static/images/pics/default_avatar.svg',
    nickname: userStore.userinfo?.profile?.nickname || userStore.userinfo?.nickname || '',
    email: userStore.userinfo?.email || '',
    phone_number: userStore.userinfo?.profile?.phone_number || '',
    region: userStore.userinfo?.profile?.region || '',
    description: userStore.userinfo?.profile?.description || '',
});

const chooseAvatar = () => {
    uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
            const file = res.tempFilePaths?.[0];
            if (!file) return;
            form.avatar = file;
        },
    });
};

const handleSave = async () => {
    if (!form.nickname.trim()) {
        uni.showToast({ title: t('editProfile1.enterName'), icon: 'none' });
        return;
    }

    try {
        const payload = {
            nickname: form.nickname.trim(),
            region: form.region.trim(),
            description: form.description.trim(),
        };

        // 头像变更时优先走上传接口
        if (String(form.avatar || '').startsWith('http') || String(form.avatar || '').startsWith('/static/')) {
            await apiPostProfile(payload);
        } else {
            await apiUploadProfile({
                ...payload,
                avatar: form.avatar,
            });
        }

        userStore.userinfo = {
            ...userStore.userinfo,
            profile: {
                ...userStore.userinfo.profile,
                avatar: form.avatar,
                nickname: form.nickname,
                phone_number: form.phone_number,
                region: form.region,
                description: form.description,
            },
        };

        // 显示成功提示
        uni.showToast({
            title: t('user.profile.saveSuccess'),
            icon: 'none',
        });

        // 延迟返回上一页
        setTimeout(() => {
            uni.navigateBack({
                fail: () => uni.reLaunch({ url: '/pages/settings/settings' }),
            });
        }, 1000);
    } catch (error) {
        uni.showToast({
            title: t('editProfile1.saveFailed'),
            icon: 'none',
        });
    }
};

const goBack = () => {
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
}

.status-holder {
    width: 100%;
}

.header {
    height: 112rpx;
    background: #f5f6f8;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32rpx;
}

.back-btn {
    width: 72rpx;
    height: 72rpx;
    border-radius: 16rpx;
    background: #fff;
    border: 1px solid #f0f1f3;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-title {
    font-size: 36rpx;
    font-weight: 700;
    color: #111827;
    flex: 1;
    text-align: center;
}

.header-placeholder {
    width: 72rpx;
    height: 72rpx;
}

.save-mini-btn {
    height: 72rpx;
    padding: 0 28rpx;
    border-radius: 16rpx;
    background: #e5322d;
    color: #fff;
    border: none;
    display: flex;
    align-items: center;
    gap: 12rpx;
    font-size: 26rpx;
    font-weight: 600;
}

.content {
    height: calc(100vh - 112rpx);
    box-sizing: border-box;
    padding-top: 16rpx;
    padding-bottom: 80rpx;
}

.avatar-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 48rpx;
    padding-bottom: 56rpx;
}

.avatar-wrap {
    position: relative;
}

.avatar {
    width: 176rpx;
    height: 176rpx;
    border-radius: 88rpx;
}

.camera-btn {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 56rpx;
    height: 56rpx;
    border-radius: 28rpx;
    background: #e5322d;
    border: 2px solid #f5f6f8;
    display: flex;
    align-items: center;
    justify-content: center;
}

.avatar-tip {
    margin-top: 20rpx;
    font-size: 24rpx;
    color: #e5322d;
    font-weight: 500;
}

.section-title {
    padding: 0 32rpx;
    margin-bottom: 16rpx;
    font-size: 22rpx;
    font-weight: 600;
    color: #9ca3af;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    display: block;
}

.card {
    background: #fff;
    border-radius: 24rpx;
    border: 1px solid #f0f1f3;
    margin: 0 32rpx 48rpx;
    overflow: hidden;
}

.field {
    padding: 24rpx 32rpx;
    border-bottom: 1px solid #f3f4f6;
}

.field-last {
    border-bottom: none;
}

.field-label {
    display: block;
    margin-bottom: 10rpx;
    font-size: 22rpx;
    font-weight: 600;
    color: #9ca3af;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.field-input {
    width: 100%;
    font-size: 30rpx;
    font-weight: 500;
    color: #111827;
    background: transparent;
}

.save-btn {
    margin: 0 32rpx;
    height: 100rpx;
    border-radius: 24rpx;
    background: #e5322d;
    color: #fff;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    font-size: 30rpx;
    font-weight: 600;
}
</style>
