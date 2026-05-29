<template>
    <view class="layout" :class="isDark ? 'theme-dark' : 'theme-light'">
        <page-header :title="t('historyPage.title')" :subtitle="t('historyPage.subtitle')"></page-header>

        <view class="content-wrapper">
            <tabbed-pics-view :show-header="false" :tabs="tabs" api-type="local"></tabbed-pics-view>

            <view class="page-actions" v-if="libraryStore.recentViewed.length">
                <button class="ghost-btn" @click="clearHistory">{{ t('historyPage.clear') }}</button>
            </view>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLibraryStore } from '@/stores/library.js';
import { useSettingsStore } from '@/stores/settings.js';

const { t } = useI18n();
const libraryStore = useLibraryStore();
const settingsStore = useSettingsStore();
const isDark = computed(() => settingsStore.isDark);

const tabs = computed(() => [
    {
        label: t('historyPage.title'),
        data: libraryStore.recentViewed,
    },
]);

const clearHistory = () => {
    uni.showModal({
        title: t('common.clearHistory'),
        success: (res) => {
            if (res.confirm) {
                libraryStore.clearRecentViewed();
                uni.showToast({
                    title: t('historyPage.cleared'),
                    icon: 'none',
                });
            }
        },
    });
};
</script>

<style lang="scss" scoped>
@import '@/static/styles/theme-variables.scss';

.layout {
    min-height: 100vh;
    background: #0b1017;

    &.theme-light {
        background: var(--page-background);
    }
}

.content-wrapper {
    height: calc(100vh - 120rpx);
    display: flex;
    flex-direction: column;
}

.page-actions {
    padding: 20rpx 30rpx 48rpx;
    background: #0b1017;

    .theme-light & {
        background: var(--page-background);
    }

    .ghost-btn {
        background: rgba(255, 255, 255, 0.05);
        color: #94a3b8;
        font-size: 24rpx;
        border-radius: 12rpx;

        .theme-light & {
            background: rgba(0, 0, 0, 0.04);
            color: var(--text-tertiary);
        }

        &::after {
            border: none;
        }
    }
}
</style>
