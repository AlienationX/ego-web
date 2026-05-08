<template>
    <view class="layout">
        <page-header :title="t('preferencePage.title')" :subtitle="t('preferencePage.subtitle')"></page-header>

        <scroll-view scroll-y class="content">
            <view class="section">
                <view class="section-title">{{ t('preferencePage.preferredTitle') }}</view>
                <view class="section-desc">{{ t('preferencePage.preferredDesc') }}</view>

                <empty-state
                    v-if="!libraryStore.preferredTags.length"
                    icon-path="/static/icons/tag.svg"
                    :title="t('preferencePage.emptyPreferred')"
                    :description="t('preferencePage.emptyPreferredDesc')"
                    :action-text="t('history.goBrowse')"
                    @action="goBrowse"
                ></empty-state>

                <view v-else class="tag-list">
                    <view v-for="tag in libraryStore.preferredTags" :key="tag" class="tag-row">
                        <view class="tag-name">{{ tag }}</view>
                        <view class="tag-actions">
                            <view class="tag-btn" @click="pinTag(tag)">{{ t('preferencePage.pin') }}</view>
                            <view class="tag-btn tag-btn--warn" @click="hideTag(tag)">{{ t('preferencePage.hide') }}</view>
                            <view class="tag-btn" @click="removeTag(tag)">{{ t('preferencePage.remove') }}</view>
                        </view>
                    </view>
                </view>
            </view>

            <view class="section">
                <view class="section-title">{{ t('preferencePage.hiddenTitle') }}</view>
                <view class="section-desc">{{ t('preferencePage.hiddenDesc') }}</view>

                <view v-if="libraryStore.hiddenTags.length" class="chip-wrap">
                    <view v-for="tag in libraryStore.hiddenTags" :key="tag" class="chip chip--hidden" @click="restoreTag(tag)">
                        {{ tag }}
                    </view>
                </view>
                <view v-else class="empty-inline">{{ t('preferencePage.emptyHidden') }}</view>
            </view>

            <view class="section">
                <view class="section-title">{{ t('preferencePage.shortcutsTitle') }}</view>
                <view class="shortcut-list">
                    <view class="shortcut-row" @click="openLanguage">
                        <view class="shortcut-name">{{ t('settings.items.language.label') }}</view>
                        <view class="shortcut-value">{{ locale === 'en' ? t('settings.items.language.valueEn') : t('settings.items.language.valueZh') }}</view>
                    </view>
                    <view class="shortcut-row" @click="openPreviewType">
                        <view class="shortcut-name">{{ t('settings.items.previewType.label') }}</view>
                        <view class="shortcut-value">
                            {{ settingsStore.options.previewType === 'floating' ? t('settings.preview.floating') : t('settings.preview.classic') }}
                        </view>
                    </view>
                </view>
            </view>
        </scroll-view>
    </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { useLibraryStore } from '@/stores/library.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserStore } from '@/stores/user.js';

const { t, locale } = useI18n();
const libraryStore = useLibraryStore();
const settingsStore = useSettingsStore();
const userStore = useUserStore();

const pinTag = (tag) => {
    libraryStore.bumpPreferredTag(tag);
    uni.showToast({ title: t('preferencePage.pinned'), icon: 'none' });
};

const hideTag = (tag) => {
    libraryStore.hideTag(tag);
    uni.showToast({ title: t('preferencePage.hiddenToast'), icon: 'none' });
};

const restoreTag = (tag) => {
    libraryStore.restoreHiddenTag(tag);
    uni.showToast({ title: t('preferencePage.restoredToast'), icon: 'none' });
};

const removeTag = (tag) => {
    libraryStore.removePreferredTag(tag);
    uni.showToast({ title: t('preferencePage.removedToast'), icon: 'none' });
};

const goBrowse = () => {
    uni.switchTab({ url: '/pages/app/index' });
};

const openLanguage = () => {
    uni.navigateTo({ url: '/pages/settings/settings' });
};

const openPreviewType = () => {
    uni.navigateTo({ url: '/pages/settings/settings' });
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

.content {
    height: calc(100vh - 180rpx);
    box-sizing: border-box;
    padding: 8rpx 24rpx 48rpx;
}

.section {
    background: rgba(255, 255, 255, 0.92);
    border: 1rpx solid rgba(15, 23, 42, 0.06);
    border-radius: 28rpx;
    box-shadow: 0 14rpx 30rpx rgba(148, 163, 184, 0.1);
    padding: 28rpx 24rpx;
    margin-bottom: 24rpx;
}

.section-title {
    font-size: 28rpx;
    font-weight: 800;
    color: #0f172a;
}

.section-desc {
    margin-top: 8rpx;
    font-size: 23rpx;
    line-height: 1.7;
    color: #64748b;
}

.tag-list {
    margin-top: 22rpx;
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.tag-row,
.shortcut-row {
    min-height: 84rpx;
    padding: 0 18rpx;
    border-radius: 20rpx;
    background: #f8fafc;
    border: 1rpx solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
}

.tag-name,
.shortcut-name {
    font-size: 25rpx;
    font-weight: 700;
    color: #1e293b;
}

.tag-actions {
    display: flex;
    align-items: center;
    gap: 12rpx;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.tag-btn {
    min-height: 52rpx;
    padding: 0 18rpx;
    border-radius: 999rpx;
    background: #fff;
    border: 1rpx solid #dbe4ee;
    color: #475569;
    font-size: 22rpx;
    display: inline-flex;
    align-items: center;
}

.tag-btn--warn {
    color: #b45309;
    background: #fff7ed;
    border-color: #fed7aa;
}

.chip-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    margin-top: 22rpx;
}

.chip {
    min-height: 62rpx;
    padding: 0 22rpx;
    border-radius: 999rpx;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 23rpx;
    font-weight: 600;
}

.chip--hidden {
    color: #64748b;
    background: #f8fafc;
    border: 1rpx dashed #cbd5e1;
}

.empty-inline,
.shortcut-value {
    margin-top: 20rpx;
    font-size: 23rpx;
    color: #64748b;
}

.shortcut-list {
    margin-top: 22rpx;
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.shortcut-value {
    margin-top: 0;
    color: #334155;
}
</style>
