<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <view class="nav-container">
            <view class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>
            <view class="header" :style="{ height: `${titleBarHeight}px`, paddingRight: titlebarPaddingRight }">
                <view class="back-btn" @click="goBack">
                    <mdi-icon
                        path="/static/icons/arrow-left.svg"
                        size="18px"
                        :color="settingsStore.isDark ? '#e5e7eb' : '#374151'"
                    ></mdi-icon>
                </view>
                <text class="header-title">{{ t('historyPage.title') }}</text>
            </view>
        </view>
        <view class="nav-placeholder" :style="{ height: `${statusBarHeight + titleBarHeight}px` }"></view>

        <view class="content">
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
                            :color="settingsStore.isDark ? '#6b7280' : '#9ca3af'"
                        ></mdi-icon>
                        <text class="retention-hint__text">{{ t('historyPage.retentionHint') }}</text>
                    </view>
                </view>

                <view v-for="day in visibleDays" :key="day.dateStr" class="day-section">
                    <view class="day-header">
                        <text class="day-title">{{ day.label }}</text>
                        <view class="day-clear" @click="clearDayHistory(day.dateStr)">
                            <mdi-icon
                                path="/static/icons/delete-empty.svg"
                                size="18px"
                                :color="settingsStore.isDark ? '#6b7280' : '#9ca3af'"
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
        </view>

        <view class="bottom-action-area" v-if="libraryStore.recentViewed.length">
            <view class="clear-floating-btn" @click="clearAllHistory">
                <mdi-icon
                    path="/static/icons/delete-empty.svg"
                    size="18px"
                    :color="settingsStore.isDark ? '#f87171' : '#ef4444'"
                ></mdi-icon>
                <text class="clear-floating-btn__text">{{ t('historyPage.clearAll') }}</text>
            </view>
        </view>

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
import { onReachBottom } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { useTranslateParams } from '@/utils/i18n.js';
import { useLibraryStore } from '@/stores/library.js';
import { useSettingsStore } from '@/stores/settings.js';
import { getStatusBarHeight, getTitleBarHeight } from '@/utils/layout.js';
import { formatDateKey, formatHistoryDayLabel } from '@/utils/common.js';
import { useAppStore } from '@/stores/app.js';

const { t, locale } = useI18n();
const { tp } = useTranslateParams();
const libraryStore = useLibraryStore();
const settingsStore = useSettingsStore();
const isZh = computed(() => String(locale.value || '').startsWith('zh'));
const statusBarHeight = ref(getStatusBarHeight() || 0);
const titleBarHeight = ref(getTitleBarHeight() || 44);

const titlebarPaddingRight = computed(() => {
    // #ifdef MP-WEIXIN
    const menuButtonInfo = uni.getMenuButtonBoundingClientRect ? uni.getMenuButtonBoundingClientRect() : null;
    if (menuButtonInfo) {
        return uni.getWindowInfo().windowWidth - menuButtonInfo.left + 10 + 'px';
    }
    // #endif
    return '16px';
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
    const appStore = useAppStore();
    appStore.wallList = data;
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

onReachBottom(() => loadMore());

const clearDayHistory = (dateStr) => {
    showDeleteDialog({
        title: t('common.tip') || '提示',
        description:
            tp('historyPage.clearDayConfirm', { date: getDayLabel(dateStr) }) ||
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
    padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx 30rpx 0;
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

.bottom-action-area {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 99;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: calc(36rpx + env(safe-area-inset-bottom));
    pointer-events: none;
}

.clear-floating-btn {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    height: 76rpx;
    padding: 0 40rpx;
    border-radius: 999rpx;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1rpx solid rgba(239, 68, 68, 0.2);
    box-shadow:
        0 10rpx 32rpx rgba(0, 0, 0, 0.08),
        0 2rpx 8rpx rgba(239, 68, 68, 0.08);
    transition:
        transform 0.2s cubic-bezier(0.2, 0, 0, 1),
        opacity 0.2s ease,
        box-shadow 0.2s ease;

    &:active {
        opacity: 0.85;
        transform: scale(0.94);
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
    }

    &__text {
        font-size: 28rpx;
        font-weight: 600;
        color: #ef4444;
        letter-spacing: 0.5rpx;
    }
}

.theme-dark {
    .clear-floating-btn {
        background: rgba(28, 28, 34, 0.78);
        border: 1rpx solid rgba(248, 113, 113, 0.28);
        box-shadow:
            0 12rpx 36rpx rgba(0, 0, 0, 0.45),
            0 2rpx 8rpx rgba(248, 113, 113, 0.1);

        &__text {
            color: #f87171;
        }
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
    padding: 40rpx 0 160rpx;
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
        align-self: center;
        padding: 0 60rpx;
        height: 84rpx;
        line-height: 84rpx;
        background: var(--text-primary);
        color: var(--page-background-secondary);
        font-size: 30rpx;
        font-weight: 800;
        border-radius: 999rpx;
        border: 1rpx solid var(--panel-border);
        box-shadow: none;
        letter-spacing: 0.4rpx;
        transition:
            transform 0.28s ease,
            background-color 0.28s ease,
            color 0.28s ease;

        &:active {
            opacity: 0.9;
            transform: scale(0.97);
        }

        &::after {
            border: none;
        }
    }
}
</style>
