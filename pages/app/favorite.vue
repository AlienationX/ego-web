<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 沉浸式高级头部 (The Inspiration Gallery Header) -->
        <view class="gallery-header" :style="{ paddingTop: statusBarHeight + 'px' }">
            <view class="nav-bar">
                <view class="back-btn" @click="goBack">
                    <mdi-icon path="/static/icons/arrow-left.svg" size="24px" :color="settingsStore.isDark ? '#e5e7eb' : '#0f172a'" />
                </view>
            </view>
            <view class="header-titles">
                <text class="super-title">{{ $t('favorite.superTitle') }}</text>
                <text class="main-title">{{ $t('user.profile.myFavorite') }}</text>
                <text class="desc">{{ $t('favorite.desc') }}</text>
            </view>
        </view>

        <view class="content-wrapper">
            <modern-pics-view 
                ref="picsRef" 
                :show-header="false" 
                :tabs="tabs" 
                api-type="actions" 
                :show-delete="true" 
                layoutMode="waterfall"
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
        label: t('user.profile.myFavorite'),
        query: {
            action_key: 'favorite',
        },
    },
]);

const handleRemove = ({ item, tabIndex }) => {
    itemToRemove.value = item;
    tabIndexToRemove.value = tabIndex;
    dialogTitle.value = t('user.profile.unfavoriteTitle');
    dialogDesc.value = t('user.profile.unfavoriteDesc');
    dialogRef.value?.open();
};

const onConfirmRemove = async () => {
    if (!itemToRemove.value) return;
    try {
        await apiPostActions({ wall_id: itemToRemove.value.id, action_key: 'favorite', action_value: 0 });
        picsRef.value?.removeItem(tabIndexToRemove.value, itemToRemove.value.id);
        uni.showToast({ title: t('user.profile.unfavoriteSuccess'), icon: 'none' });
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

    .gallery-header {
        position: relative;
        z-index: 100;
        padding-bottom: 40rpx;
        background: linear-gradient(180deg, var(--page-background) 0%, rgba(255,255,255,0) 100%);
        .theme-dark & {
            background: linear-gradient(180deg, var(--page-background) 0%, rgba(15,23,42,0) 100%);
        }

        .nav-bar {
            height: 88rpx;
            display: flex;
            align-items: center;
            padding: 0 40rpx;

            .back-btn {
                width: 72rpx;
                height: 72rpx;
                border-radius: 50%;
                background: var(--panel-background, #f8fafc);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4rpx 12rpx var(--shadow-color, rgba(0,0,0,0.05));
                transition: all 0.2s;
                
                &:active {
                    transform: scale(0.9);
                }
            }
        }

        .header-titles {
            padding: 40rpx 40rpx 0;
            display: flex;
            flex-direction: column;

            .super-title {
                font-size: 24rpx;
                text-transform: uppercase;
                letter-spacing: 4rpx;
                color: $wp-theme-color;
                font-weight: 800;
                margin-bottom: 8rpx;
            }

            .main-title {
                font-size: 64rpx;
                font-weight: 900;
                color: var(--text-primary, #0f172a);
                line-height: 1.1;
                letter-spacing: -1rpx;
                margin-bottom: 16rpx;
            }

            .desc {
                font-size: 28rpx;
                color: var(--text-secondary, #64748b);
                max-width: 80%;
                line-height: 1.5;
            }
        }
    }

    .content-wrapper {
        flex: 1;
        height: 0;
        padding: 0;
        /* Customizing modern-pics-view from outside if possible */
        :deep(.gallery-wrapper) {
            padding-top: 0;
        }
    }
}
</style>
