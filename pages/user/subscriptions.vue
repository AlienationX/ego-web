<template>
    <view class="layout" :class="isDark ? 'theme-dark' : 'theme-light'">
        <page-header
            :title="t('subscriptionPage.title')"
            :subtitle="t('subscriptionPage.subtitle')"
            :right-text="hasAnySubscription ? t('subscriptionPage.clear') : ''"
            @right-click="clearAllSubscriptions"
        ></page-header>

        <scroll-view scroll-y class="content">
            <view class="summary-card">
                <view class="summary-item">
                    <view class="summary-value">{{ libraryStore.subscriptions.classifyIds.length }}</view>
                    <view class="summary-label">{{ t('subscriptionPage.classifyTitle') }}</view>
                </view>
                <view class="summary-item">
                    <view class="summary-value">{{ libraryStore.subscriptions.tags.length }}</view>
                    <view class="summary-label">{{ t('subscriptionPage.tagTitle') }}</view>
                </view>
            </view>

            <view class="section">
                <view class="section-title">{{ t('subscriptionPage.classifyTitle') }}</view>
                <view class="section-desc">{{ t('subscriptionPage.classifyDesc') }}</view>
                <view class="chip-wrap">
                    <view
                        v-for="item in classifyList"
                        :key="item.id"
                        class="chip"
                        :class="{ active: isClassifySubscribed(item.id) }"
                        @click="toggleClassify(item)"
                    >
                        {{ item.name }}
                    </view>
                </view>
            </view>

            <view class="section">
                <view class="section-title">{{ t('subscriptionPage.tagTitle') }}</view>
                <view class="section-desc">{{ t('subscriptionPage.tagDesc') }}</view>

                <empty-state
                    v-if="!tagOptions.length"
                    icon-path="/static/icons/tag.svg"
                    :title="t('subscriptionPage.emptyTags')"
                    :description="t('subscriptionPage.emptyTagsDesc')"
                    :action-text="t('historyPage.goBrowse')"
                    @action="goBrowse"
                ></empty-state>

                <view v-else class="chip-wrap">
                    <view
                        v-for="tag in tagOptions"
                        :key="tag"
                        class="chip chip--soft"
                        :class="{ active: isTagSubscribed(tag) }"
                        @click="toggleTag(tag)"
                    >
                        {{ tag }}
                    </view>
                </view>
            </view>
        </scroll-view>
    </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { apiGetClassify } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { useLibraryStore } from '@/stores/library.js';
import { useUserStore } from '@/stores/user.js';
import { useSettingsStore } from '@/stores/settings.js';

const { t } = useI18n();
const libraryStore = useLibraryStore();
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const isDark = computed(() => settingsStore.isDark);
const classifyList = ref([]);

const hasAnySubscription = computed(
    () => libraryStore.subscriptions.classifyIds.length > 0 || libraryStore.subscriptions.tags.length > 0,
);

const tagOptions = computed(() => {
    const tags = [...libraryStore.subscriptions.tags, ...libraryStore.preferredTags];
    return [...new Set(tags)].filter(Boolean);
});

const isClassifySubscribed = (id) => libraryStore.subscriptions.classifyIds.includes(id);
const isTagSubscribed = (tag) => libraryStore.subscriptions.tags.includes(tag);

const toggleClassify = (item) => {
    const subscribed = libraryStore.toggleSubscription('classifyIds', item.id);
    uni.showToast({
        title: subscribed ? t('subscriptionPage.subscribed') : t('subscriptionPage.unsubscribed'),
        icon: 'none',
    });
};

const toggleTag = (tag) => {
    const subscribed = libraryStore.toggleSubscription('tags', tag);
    if (subscribed) {
        libraryStore.bumpPreferredTag(tag);
    }
    uni.showToast({
        title: subscribed ? t('subscriptionPage.subscribed') : t('subscriptionPage.unsubscribed'),
        icon: 'none',
    });
};

const clearAllSubscriptions = () => {
    libraryStore.clearSubscriptions();
    uni.showToast({
        title: t('subscriptionPage.cleared'),
        icon: 'none',
    });
};

const goBrowse = () => {
    uni.switchTab({ url: '/pages/app/index' });
};

onLoad(async () => {
    if (!userStore.isAdmin) {
        uni.showToast({ title: '该功能仍在测试中', icon: 'none' });
        uni.switchTab({ url: '/pages/app/index' });
        return;
    }
    const res = await apiGetClassify({ pageSize: 100 });
    classifyList.value = (res.data || []).map((item) => handlePicUrl(item));
});
</script>

<style lang="scss" scoped>
@import '@/static/styles/theme-variables.scss';

.layout {
    min-height: 100vh;
    background: linear-gradient(180deg, #f8fafc 0%, #f2f6fb 100%);

    &.theme-dark {
        background: linear-gradient(180deg, var(--page-background) 0%, #111 100%);
    }
}

.content {
    height: calc(100vh - 180rpx);
    box-sizing: border-box;
    padding: 8rpx 24rpx 48rpx;
}

.summary-card {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18rpx;
    margin-bottom: 28rpx;
}

.summary-item,
.section {
    background: rgba(255, 255, 255, 0.92);
    border: 1rpx solid rgba(15, 23, 42, 0.06);
    border-radius: 28rpx;
    box-shadow: 0 14rpx 30rpx rgba(148, 163, 184, 0.1);

    .theme-dark & {
        background: var(--panel-background);
        border: 1rpx solid var(--panel-border);
        box-shadow: 0 14rpx 30rpx rgba(0, 0, 0, 0.2);
    }
}

.summary-item {
    padding: 28rpx 24rpx;
}

.summary-value {
    font-size: 44rpx;
    font-weight: 800;
    color: #0f172a;

    .theme-dark & {
        color: var(--text-primary);
    }
}

.summary-label {
    margin-top: 8rpx;
    font-size: 22rpx;
    color: #64748b;

    .theme-dark & {
        color: var(--text-tertiary);
    }
}

.section {
    padding: 28rpx 24rpx;
    margin-bottom: 24rpx;
}

.section-title {
    font-size: 28rpx;
    font-weight: 800;
    color: #0f172a;

    .theme-dark & {
        color: var(--text-primary);
    }
}

.section-desc {
    margin-top: 8rpx;
    font-size: 23rpx;
    line-height: 1.7;
    color: #64748b;

    .theme-dark & {
        color: var(--text-tertiary);
    }
}

.chip-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    margin-top: 22rpx;
}

.chip {
    min-height: 64rpx;
    padding: 0 24rpx;
    border-radius: 999rpx;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
    font-weight: 600;
    color: #334155;
    background: #f8fafc;
    border: 1rpx solid #dbe4ee;

    .theme-dark & {
        color: var(--text-secondary);
        background: var(--panel-background);
        border: 1rpx solid var(--panel-border);
    }
}

.chip.active {
    color: #fff;
    background: #18202a;
    border-color: #18202a;
    box-shadow: 0 14rpx 30rpx rgba(24, 32, 42, 0.18);

    .theme-dark & {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.2);
        box-shadow: 0 14rpx 30rpx rgba(0, 0, 0, 0.3);
    }
}

.chip--soft.active {
    background: #28b389;
    border-color: #28b389;

    .theme-dark & {
        background: #28b389;
        border-color: #28b389;
    }
}
</style>
