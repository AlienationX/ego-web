<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- Custom Beautiful Header -->
        <view class="custom-header" :style="{ paddingTop: statusBarHeight + 'px' }">
            <view class="header-content">
                <view class="back-btn" @click="goBack">
                    <mdi-icon path="/static/icons/arrow-left.svg" size="24px" :color="settingsStore.isDark ? '#e5e7eb' : '#1e293b'" />
                </view>
                <view class="header-title-box">
                    <text class="header-title">{{ $t('user.profile.myDownload') }}</text>
                    <text class="header-subtitle">Downloads</text>
                </view>
                <view class="header-placeholder"></view> <!-- For flex centering -->
            </view>
        </view>

        <view class="content-wrapper">
            <tabbed-pics-view :show-header="false" :tabs="tabs" api-type="actions"></tabbed-pics-view>
        </view>
    </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { getStatusBarHeight } from '@/utils/system.js';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const statusBarHeight = ref(getStatusBarHeight() || 0);

const tabs = computed(() => [
    {
        label: t('user.profile.myDownload'),
        query: {
            action_key: 'download',
        },
    },
]);

const goBack = () => {
    uni.navigateBack({
        fail: () => {
            uni.switchTab({ url: '/pages/user/user' });
        }
    });
};
</script>

<style lang="scss" scoped>
.layout {
    background: var(--page-background);
    min-height: 100vh;
    transition: background-color 0.3s ease;

    .custom-header {
        position: relative;
        z-index: 100;
        padding-bottom: 20rpx;

        .header-content {
            height: 110rpx;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 30rpx;
        }
        
        .header-title-box {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .back-btn {
            width: 84rpx;
            height: 84rpx;
            border-radius: 28rpx;
            background: var(--panel-background, #ffffff);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10rpx 30rpx var(--shadow-color, rgba(0, 0, 0, 0.03));
            border: 1rpx solid var(--panel-border, rgba(0, 0, 0, 0.03));
            transition: transform 0.2s ease, background 0.2s ease;
            
            &:active {
                transform: scale(0.92);
                background: var(--panel-background-strong, #f1f5f9);
            }
        }

        .header-title {
            font-size: 36rpx;
            font-weight: 800;
            color: var(--text-primary, #1e293b);
            letter-spacing: 1rpx;
        }
        
        .header-subtitle {
            font-size: 22rpx;
            color: var(--text-tertiary, #94a3b8);
            margin-top: 6rpx;
            letter-spacing: 2rpx;
            text-transform: uppercase;
            font-weight: 600;
        }
        
        .header-placeholder {
            width: 84rpx;
        }
    }

    .content-wrapper {
        height: calc(100vh - 130rpx - env(safe-area-inset-top));
        padding: 0;
    }
}
</style>
