<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 极简工作室风格头部 (The Studio Library Header) -->
        <view class="studio-header" :style="{ paddingTop: statusBarHeight + 'px' }">
            <view class="nav-bar">
                <view class="left-section">
                    <view class="back-btn" @click="goBack">
                        <mdi-icon path="/static/icons/arrow-left.svg" size="20px" :color="settingsStore.isDark ? '#e5e7eb' : '#1e293b'" />
                    </view>
                    <view class="header-titles">
                        <text class="main-title">{{ $t('user.profile.myDownload') }}</text>
                        <text class="sub-title">{{ $t('download.superTitle') }}</text>
                    </view>
                </view>
                <!-- 这里可以预留批量选择按钮 -->
                <!-- <view class="action-btn">
                    <text>Select</text>
                </view> -->
            </view>
        </view>

        <view class="content-wrapper">
            <modern-pics-view 
                ref="picsRef" 
                :show-header="false" 
                :tabs="tabs" 
                api-type="actions" 
                :show-delete="true"
                layoutMode="grid"
                :showCardMeta="false"
                @remove="handleRemove"
            ></modern-pics-view>
        </view>
        
        <popup-navigation-dialog
            ref="dialogRef"
            :title="dialogTitle"
            :description="dialogDesc"
            @confirm="onConfirmRemove"
        />
    </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { apiPostActions } from '@/api/wallpaper.js';
import { getStatusBarHeight } from '@/utils/layout.js';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const statusBarHeight = ref(getStatusBarHeight() || 0);
const picsRef = ref(null);
const dialogRef = ref(null);
const dialogTitle = ref('');
const dialogDesc = ref('');
const itemToRemove = ref(null);
const tabIndexToRemove = ref(null);

const tabs = computed(() => [
    {
        label: t('user.profile.myDownload'),
        query: {
            action_key: 'download',
        },
    },
]);

const handleRemove = ({ item, tabIndex }) => {
    itemToRemove.value = item;
    tabIndexToRemove.value = tabIndex;
    dialogTitle.value = t('user.profile.clearDownloadTitle');
    dialogDesc.value = t('user.profile.clearDownloadDesc');
    dialogRef.value?.open();
};

const onConfirmRemove = async () => {
    if (!itemToRemove.value) return;
    try {
        await apiPostActions({ wall_id: itemToRemove.value.id, action_key: 'download', action_value: 0 });
        picsRef.value?.removeItem(tabIndexToRemove.value, itemToRemove.value.id);
        uni.showToast({ title: t('user.profile.clearDownloadSuccess'), icon: 'none' });
    } catch (e) {
        uni.showToast({ title: t('user.profile.operationFailed'), icon: 'none' });
    }
};

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
    height: 100vh;
    transition: background-color 0.3s ease;
    display: flex;
    flex-direction: column;

    .studio-header {
        position: relative;
        z-index: 100;
        background: var(--page-background);
        border-bottom: 1rpx solid var(--panel-border);

        .nav-bar {
            height: 100rpx;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 30rpx;

            .left-section {
                display: flex;
                align-items: center;
                gap: 20rpx;
            }

            .back-btn {
                width: 60rpx;
                height: 60rpx;
                display: flex;
                align-items: center;
                justify-content: center;
                
                &:active {
                    opacity: 0.7;
                }
            }

            .header-titles {
                display: flex;
                flex-direction: column;
                
                .main-title {
                    font-size: 32rpx;
                    font-weight: 700;
                    color: var(--text-primary);
                    letter-spacing: 0.5rpx;
                }
                
                .sub-title {
                    font-size: 20rpx;
                    color: var(--text-tertiary);
                    text-transform: uppercase;
                    letter-spacing: 1rpx;
                    margin-top: 4rpx;
                }
            }

            .action-btn {
                font-size: 26rpx;
                font-weight: 600;
                color: $wp-theme-color;
                padding: 10rpx 20rpx;
                background: rgba($wp-theme-color, 0.1);
                border-radius: 40rpx;
                
                &:active {
                    opacity: 0.7;
                }
            }
        }
    }

    .content-wrapper {
        flex: 1;
        height: 0;
        padding: 0;
        
        /* 强制覆盖 modern-pics-view 为 1:1 正方形相册风格 */
        :deep(.gallery-wrapper) {
            padding: 16rpx;
        }

        :deep(.grid-layout) {
            gap: 16rpx !important;
            grid-template-columns: repeat(3, 1fr) !important; /* 强制3列相册 */
        }

        :deep(.modern-card.grid-card) {
            height: auto !important;
            aspect-ratio: 1 / 1 !important;
            border-radius: 8rpx !important; /* 减小圆角更像照片 */
            box-shadow: none !important;
            border: 1rpx solid rgba(0,0,0,0.05);
            .theme-dark & {
                border-color: rgba(255,255,255,0.05);
            }
        }
    }
}
</style>
