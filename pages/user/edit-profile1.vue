<template>
    <view class="layout">
        <view class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>
        <view class="header">
            <view class="back-btn" @click="goBack">
                <uni-icons type="back" size="18" color="#374151"></uni-icons>
            </view>
            <text class="header-title">{{ t('editProfile1.title') }}</text>
            <button class="save-mini-btn" @click="handleSave">
                <uni-icons v-if="saved" type="checkmarkempty" size="14" color="#fff"></uni-icons>
                <text>{{ saved ? t('editProfile1.saved') : t('editProfile1.save') }}</text>
            </button>
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
                    <input v-model="form.name" class="field-input" :placeholder="t('editProfile1.placeholders.fullName')" />
                </view>
                <view class="field">
                    <text class="field-label">{{ t('editProfile1.email') }}</text>
                    <input v-model="form.email" class="field-input" :placeholder="t('editProfile1.placeholders.email')" disabled />
                </view>
                <view class="field field-last">
                    <text class="field-label">{{ t('editProfile1.phone') }}</text>
                    <input v-model="form.phone" class="field-input" :placeholder="t('editProfile1.placeholders.phone')" />
                </view>
            </view>

            <view class="section-title">{{ t('editProfile1.workInfo') }}</view>
            <view class="card">
                <view class="field">
                    <text class="field-label">{{ t('editProfile1.jobTitle') }}</text>
                    <input v-model="form.jobTitle" class="field-input" :placeholder="t('editProfile1.placeholders.jobTitle')" />
                </view>
                <view class="field field-last">
                    <text class="field-label">{{ t('editProfile1.department') }}</text>
                    <input v-model="form.department" class="field-input" :placeholder="t('editProfile1.placeholders.department')" />
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
    name: userStore.userinfo?.profile?.nickname || userStore.userinfo?.nickname || '',
    email: userStore.userinfo?.email || '',
    phone: userStore.userinfo?.profile?.phone || '',
    jobTitle: userStore.userinfo?.profile?.description || '',
    department: userStore.userinfo?.profile?.region || '',
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

const markSaved = () => {
    saved.value = true;
    setTimeout(() => {
        saved.value = false;
    }, 1800);
};

const handleSave = async () => {
    if (!form.name.trim()) {
        uni.showToast({ title: t('editProfile1.enterName'), icon: 'none' });
        return;
    }

    try {
        const payload = {
            nickname: form.name.trim(),
            region: form.department.trim(),
            description: form.jobTitle.trim(),
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
                nickname: form.name,
                phone: form.phone,
                region: form.department,
                description: form.jobTitle,
            },
        };

        markSaved();
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
            uni.reLaunch({ url: '/pages/test/settings1' });
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
    height: 56px;
    background: #f5f6f8;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
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
    font-size: 18px;
    font-weight: 700;
    color: #111827;
}

.save-mini-btn {
    height: 36px;
    padding: 0 14px;
    border-radius: 8px;
    background: #e5322d;
    color: #fff;
    border: none;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
}

.content {
    height: calc(100vh - 56px);
    box-sizing: border-box;
    padding-top: 8px;
    padding-bottom: 40px;
}

.avatar-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 24px;
    padding-bottom: 28px;
}

.avatar-wrap {
    position: relative;
}

.avatar {
    width: 88px;
    height: 88px;
    border-radius: 44px;
}

.camera-btn {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 28px;
    height: 28px;
    border-radius: 14px;
    background: #e5322d;
    border: 2px solid #f5f6f8;
    display: flex;
    align-items: center;
    justify-content: center;
}

.avatar-tip {
    margin-top: 10px;
    font-size: 12px;
    color: #e5322d;
    font-weight: 500;
}

.section-title {
    padding: 0 16px;
    margin-bottom: 8px;
    font-size: 11px;
    font-weight: 600;
    color: #9ca3af;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    display: block;
}

.card {
    background: #fff;
    border-radius: 12px;
    border: 1px solid #f0f1f3;
    margin: 0 16px 24px;
    overflow: hidden;
}

.field {
    padding: 12px 16px;
    border-bottom: 1px solid #f3f4f6;
}

.field-last {
    border-bottom: none;
}

.field-label {
    display: block;
    margin-bottom: 5px;
    font-size: 11px;
    font-weight: 600;
    color: #9ca3af;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.field-input {
    width: 100%;
    font-size: 15px;
    font-weight: 500;
    color: #111827;
    background: transparent;
}

.save-btn {
    margin: 0 16px;
    height: 50px;
    border-radius: 12px;
    background: #e5322d;
    color: #fff;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
}
</style>
