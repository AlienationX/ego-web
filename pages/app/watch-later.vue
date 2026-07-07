<template>
    <view class="layout">
        <page-header :title="t('historyPage.watchLaterTitle')" :subtitle="t('historyPage.watchLaterSubtitle')"></page-header>

        <view class="content-wrapper">
            <modern-pics-view :show-header="false" :tabs="tabs" api-type="local"></modern-pics-view>

            <view class="page-actions" v-if="libraryStore.watchLater.length">
                <button class="ghost-btn" @click="clearWatchLater">{{ t('historyPage.clearSaved') }}</button>
            </view>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLibraryStore } from '@/stores/library.js';

const { t } = useI18n();
const libraryStore = useLibraryStore();

const tabs = computed(() => [
    {
        label: t('historyPage.watchLaterTitle'),
        data: libraryStore.watchLater,
    },
]);

const clearWatchLater = () => {
    uni.showModal({
        title: t('common.clearHistory'),
        success: (res) => {
            if (res.confirm) {
                libraryStore.clearWatchLater();
                uni.showToast({
                    title: t('historyPage.savedCleared'),
                    icon: 'none',
                });
            }
        },
    });
};
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: #0b1017;
}

.content-wrapper {
    height: calc(100vh - 120rpx);
    display: flex;
    flex-direction: column;
}

.page-actions {
    padding: 20rpx 30rpx 48rpx;
    background: #0b1017;

    .ghost-btn {
        background: rgba(255, 255, 255, 0.05);
        color: #94a3b8;
        font-size: 24rpx;
        border-radius: 12rpx;
        &::after {
            border: none;
        }
    }
}
</style>
