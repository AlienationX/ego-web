<template>
    <view class="layout">
        <page-header :title="t('history.watchLaterTitle')" :subtitle="t('history.watchLaterSubtitle')"></page-header>

        <view class="content-wrapper">
            <empty-state
                v-if="!list.length"
                icon-path="/static/icons/bookmark.svg"
                :title="t('history.watchLaterEmpty')"
                :description="t('history.watchLaterEmptyDesc')"
                :action-text="t('history.goBrowse')"
                @action="goBrowse"
            ></empty-state>

            <template v-else>
                <pics-view :classList="list"></pics-view>
                <view class="page-actions">
                    <button class="ghost-btn" @click="clearWatchLater">{{ t('history.clearSaved') }}</button>
                </view>
            </template>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { useLibraryStore } from '@/stores/library.js';
import { useUserStore } from '@/stores/user.js';

const { t } = useI18n();
const libraryStore = useLibraryStore();
const userStore = useUserStore();

const list = computed(() => libraryStore.watchLater);

const goBrowse = () => {
    uni.switchTab({ url: '/pages/app/index' });
};

const clearWatchLater = () => {
    libraryStore.clearWatchLater();
    uni.showToast({
        title: t('history.savedCleared'),
        icon: 'none',
    });
};

onLoad(() => {
    if (userStore.isAdmin) return;
    uni.showToast({ title: '该功能仍在测试中', icon: 'none' });
    uni.switchTab({ url: '/pages/app/index' });
});
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: linear-gradient(180deg, #f8fafc 0%, #f2f6fb 100%);
}

.content-wrapper {
    padding-top: 16rpx;
}

.page-actions {
    padding: 12rpx 30rpx 48rpx;
}

.ghost-btn {
    height: 76rpx;
    border-radius: 999rpx;
    background: rgba(255, 255, 255, 0.92);
    border: 1rpx solid rgba(16, 24, 40, 0.08);
    color: #344054;
    font-size: 26rpx;
    font-weight: 700;

    &::after {
        border: none;
    }
}
</style>
