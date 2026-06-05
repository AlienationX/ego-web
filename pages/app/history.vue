<template>
    <view class="layout" :class="isDark ? 'theme-dark' : 'theme-light'">
        <view class="nav-container">
            <view class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>
            <view class="header" :style="{ height: `${titleBarHeight}px`, paddingRight: titlebarPaddingRight }">
                <view class="back-btn" @click="goBack">
                    <mdi-icon
                        path="/static/icons/arrow-left.svg"
                        size="18px"
                        :color="isDark ? '#e5e7eb' : '#374151'"
                    ></mdi-icon>
                </view>
                <text class="header-title">{{ t('historyPage.title') }}</text>
            </view>
        </view>
        <view class="nav-placeholder" :style="{ height: `${statusBarHeight + titleBarHeight}px` }"></view>

        <scroll-view scroll-y class="content" @scrolltolower="loadMore">
            <view v-if="libraryStore.recentViewed.length === 0" class="empty-state">
                <image class="empty-icon" src="/static/images/photos_empty.svg" mode="aspectFit"></image>
                <text class="empty-title">{{ t('historyPage.empty') }}</text>
                <text class="empty-desc">{{ t('historyPage.emptyDesc') }}</text>
                <button class="browse-btn" @click="goHome">{{ t('historyPage.goBrowse') }}</button>
            </view>

            <view v-else class="history-list">
                <view class="list-header">
                    <view class="retention-hint">
                        <mdi-icon
                            path="/static/icons/information-outline.svg"
                            size="16px"
                            :color="isDark ? '#6b7280' : '#9ca3af'"
                        ></mdi-icon>
                        <text class="retention-hint__text">{{ t('historyPage.retentionHint') }}</text>
                    </view>

                    <view class="clear-all" v-if="libraryStore.recentViewed.length" @click="clearAllHistory">
                        <!-- <mdi-icon
                            path="/static/icons/delete-empty.svg"
                            size="16px"
                            :color="isDark ? '#ff6b6b' : '#ef4444'"
                        ></mdi-icon> -->
                        <text class="clear-all__text" :style="{ color: isDark ? '#ff6b6b' : '#ef4444' }">{{
                            t('historyPage.clearAll')
                        }}</text>
                    </view>
                </view>

                <view v-for="day in visibleDays" :key="day.dateStr" class="day-section">
                    <view class="day-header">
                        <text class="day-title">{{ day.label }}</text>
                        <view class="day-clear" @click="clearDayHistory(day.dateStr)">
                            <mdi-icon
                                path="/static/icons/delete-empty.svg"
                                size="18px"
                                :color="isDark ? '#6b7280' : '#9ca3af'"
                            ></mdi-icon>
                            <text class="clear-text">{{ t('historyPage.clear') }}</text>
                        </view>
                    </view>

                    <view class="day-grid">
                        <view v-for="item in day.items" :key="item.id" class="card-item" @click="goPreview(item.id, day.items)">
                            <image class="card-img" :src="item.smallPicurl" mode="aspectFill" lazy-load></image>
                            <view class="card-overlay"></view>
                        </view>
                    </view>
                </view>

                <view class="load-more-status" v-if="groupedDays.length > 0">
                    <text class="status-text">{{ hasMore ? t('historyPage.loading') : t('historyPage.loadedAll') }}</text>
                </view>
            </view>
        </scroll-view>

        <popup-navigation-dialog
            ref="deleteDialogRef"
            :title="dialogState.title"
            :description="dialogState.description"
            :confirm-text="dialogState.confirmText"
            :cancel-text="dialogState.cancelText"
            @confirm="dialogState.onConfirm"
        ></popup-navigation-dialog>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLibraryStore } from '@/stores/library.js';
import { useSettingsStore } from '@/stores/settings.js';
import { getStatusBarHeight, getTitleBarHeight } from '@/utils/system.js';
import { formatDateKey, formatHistoryDayLabel } from '@/utils/common.js';

const { t, locale } = useI18n();
const libraryStore = useLibraryStore();
const settingsStore = useSettingsStore();
const isDark = computed(() => settingsStore.isDark);
const isZh = computed(() => String(locale.value || '').startsWith('zh'));
const statusBarHeight = ref(getStatusBarHeight() || 0);
const titleBarHeight = ref(getTitleBarHeight() || 44);

const titlebarPaddingRight = computed(() => {
    // #ifdef MP-WEIXIN
    const menuButtonInfo = uni.getMenuButtonBoundingClientRect ? uni.getMenuButtonBoundingClientRect() : null;
    if (menuButtonInfo) {
        const sysInfo = uni.getSystemInfoSync();
        return sysInfo.windowWidth - menuButtonInfo.left + 10 + 'px';
    }
    // #endif
    return '32rpx';
});

const visibleDaysCount = ref(5);
const deleteDialogRef = ref(null);
const dialogState = ref({
    title: '',
    description: '',
    confirmText: '',
    cancelText: '',
    onConfirm: () => {},
});

const showDeleteDialog = (config) => {
    dialogState.value = {
        title: config.title || t('common.tip') || '提示',
        description: config.description || '',
        confirmText: config.confirmText || t('common.confirm') || '确定',
        cancelText: config.cancelText || t('common.cancel') || '取消',
        onConfirm: config.onConfirm || (() => {}),
    };
    deleteDialogRef.value?.open();
};

const goBack = () => {
    uni.navigateBack();
};

const goHome = () => {
    uni.reLaunch({
        url: '/pages/app/index',
    });
};

const goPreview = (id, data) => {
    uni.setStorageSync('wallList', data);
    uni.navigateTo({
        url: '/pages/app/preview?id=' + id,
    });
};

const getDayLabel = (dateStr) => {
    const today = new Date();
    const todayStr = formatDateKey(today);

    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = formatDateKey(yesterday);

    if (dateStr === todayStr) {
        return t('common.today') || '今天';
    } else if (dateStr === yesterdayStr) {
        return t('common.yesterday') || '昨天';
    }

    return formatHistoryDayLabel(dateStr, isZh.value);
};

const groupedDays = computed(() => {
    const groups = {};
    libraryStore.recentViewed.forEach((item) => {
        const dateStr = formatDateKey(new Date(item.viewed_at || Date.now()));
        if (!groups[dateStr]) {
            groups[dateStr] = {
                dateStr,
                label: getDayLabel(dateStr),
                items: [],
            };
        }
        groups[dateStr].items.push(item);
    });

    return Object.values(groups).sort((a, b) => b.dateStr.localeCompare(a.dateStr));
});

const visibleDays = computed(() => {
    return groupedDays.value.slice(0, visibleDaysCount.value);
});

const hasMore = computed(() => {
    return visibleDaysCount.value < groupedDays.value.length;
});

const loadMore = () => {
    if (hasMore.value) {
        visibleDaysCount.value += 5;
    }
};

const clearDayHistory = (dateStr) => {
    showDeleteDialog({
        title: t('common.tip') || '提示',
        description:
            t('historyPage.clearDayConfirm', { date: getDayLabel(dateStr) }) ||
            `确定要清除 ${getDayLabel(dateStr)} 的浏览记录吗？`,
        onConfirm: () => {
            libraryStore.recentViewed = libraryStore.recentViewed.filter(
                (item) => formatDateKey(new Date(item.viewed_at || Date.now())) !== dateStr,
            );
            uni.showToast({
                title: t('historyPage.clearDaySuccess') || '已清除该天记录',
                icon: 'none',
            });
        },
    });
};

const clearAllHistory = () => {
    showDeleteDialog({
        title: t('historyPage.clearAll') || '全部清空',
        description: t('historyPage.clearAllConfirm') || '确定要清空所有的浏览记录吗？此操作不可撤销。',
        onConfirm: () => {
            libraryStore.clearRecentViewed();
            uni.showToast({
                title: t('historyPage.clearAllSuccess') || '已清空浏览记录',
                icon: 'none',
            });
        },
    });
};
</script>

<style lang="scss" scoped>
@import '@/static/styles/theme-variables.scss';

.layout {
    min-height: 100vh;
    background: var(--page-background);
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
}

.nav-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background-color: var(--page-background);
}

.status-holder {
    width: 100%;
    background-color: var(--page-background);
}

.header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32rpx;
    background-color: var(--page-background);
    border-bottom: 1rpx solid var(--panel-border);
    box-sizing: border-box;

    .back-btn {
        width: 64rpx;
        height: 64rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.3s;
        position: relative;
        z-index: 2;

        &:active {
            background-color: var(--panel-border);
        }
    }

    .header-title {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        font-size: 34rpx;
        font-weight: 700;
        color: var(--text-primary);
        z-index: 1;
        pointer-events: none;
    }
}

.content {
    flex: 1;
    height: 0;
}

.list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16rpx 32rpx;
}

.retention-hint {
    display: flex;
    align-items: center;
    gap: 8rpx;

    &__text {
        font-size: 24rpx;
        color: var(--text-tertiary);
    }
}

.clear-all {
    height: 56rpx;
    padding: 0 24rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6rpx;
    background: var(--page-background-secondary);
    border: 1rpx solid var(--panel-border);
    box-sizing: border-box;
    transition: all 0.2s;
    box-shadow: 0 2rpx 8rpx var(--shadow-color);

    &:active {
        transform: scale(0.97);
        opacity: 0.8;
    }

    &__text {
        font-size: 22rpx;
        font-weight: 600;
    }
}

.day-section {
    padding: 30rpx 30rpx 10rpx;

    .day-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20rpx;

        .day-title {
            font-size: 30rpx;
            font-weight: 700;
            color: var(--text-primary);
            position: relative;
            padding-left: 20rpx;

            &::before {
                content: '';
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 6rpx;
                height: 24rpx;
                background-color: #28b389;
                border-radius: 4rpx;
            }
        }

        .day-clear {
            display: flex;
            align-items: center;
            gap: 6rpx;
            padding: 8rpx 16rpx;
            background-color: var(--page-background-secondary);
            border: 1rpx solid var(--panel-border);
            border-radius: 30rpx;
            transition: all 0.3s;

            &:active {
                opacity: 0.8;
                transform: scale(0.95);
            }

            .clear-text {
                font-size: 22rpx;
                color: var(--text-tertiary);
            }
        }
    }

    .day-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16rpx;
    }
}

.card-item {
    position: relative;
    border-radius: 20rpx;
    overflow: hidden;
    aspect-ratio: 9 / 16;
    background-color: var(--page-background-secondary);
    box-shadow: 0 4rpx 12rpx var(--shadow-color);
    transition:
        transform 0.3s,
        box-shadow 0.3s;

    &:active {
        transform: scale(0.96);
    }

    .card-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .card-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.3) 0%, transparent 40%);
        pointer-events: none;
    }
}

@media (hover: hover) {
    .card-item:hover {
        transform: translateY(-4rpx);
        box-shadow: 0 10rpx 20rpx var(--shadow-color);
    }
}

.load-more-status {
    padding: 40rpx 0 60rpx;
    text-align: center;

    .status-text {
        font-size: 24rpx;
        color: var(--text-tertiary);
    }
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 180rpx 60rpx;
    text-align: center;

    .empty-icon {
        width: 320rpx;
        height: 320rpx;
        margin-bottom: 40rpx;
        opacity: 0.8;
    }

    .empty-title {
        font-size: 32rpx;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 16rpx;
    }

    .empty-desc {
        font-size: 26rpx;
        color: var(--text-tertiary);
        margin-bottom: 48rpx;
        line-height: 1.5;
    }

    .browse-btn {
        padding: 0 60rpx;
        height: 88rpx;
        line-height: 88rpx;
        background: linear-gradient(135deg, #28b389 0%, #1e8767 100%);
        color: #ffffff;
        font-size: 28rpx;
        font-weight: 600;
        border-radius: 44rpx;
        box-shadow: 0 8rpx 20rpx rgba(40, 179, 137, 0.3);
        border: none;

        &:active {
            opacity: 0.9;
            transform: scale(0.98);
        }

        &::after {
            border: none;
        }
    }
}
</style>
