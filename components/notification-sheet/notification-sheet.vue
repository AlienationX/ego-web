<template>
    <uni-popup ref="popupRef" type="top" :safe-area="false" @change="onPopupChange">
        <view
            class="notification-sheet notification-sheet--top"
            :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'"
            :style="{ paddingTop: sheetPaddingTop }"
        >
            <!-- 头部标题栏 -->
            <view class="sheet-header">
                <view class="sheet-header__left">
                    <mdi-icon path="/static/icons/bell.svg" size="22px" color="var(--text-primary)"></mdi-icon>
                    <text class="title">{{ t('index.notificationCenter') }}</text>
                    <view v-if="hasUnread" class="unread-badge"></view>
                </view>
                <view class="close-btn" @click="close">
                    <mdi-icon path="/static/icons/close.svg" size="20px" color="var(--text-secondary)"></mdi-icon>
                </view>
            </view>

            <!-- 分类选项卡 -->
            <view class="tab-segment">
                <view class="tab-item" :class="{ 'is-active': activeTab === 'all' }" @click="activeTab = 'all'">
                    {{ t('common.all') }}
                </view>
                <view class="tab-item" :class="{ 'is-active': activeTab === 'wallpapers' }" @click="activeTab = 'wallpapers'">
                    {{ t('index.newWallpapersNoticeTitle') }}
                    <text v-if="statusStore.newWallpapersCount > 0" class="tab-count">{{ statusStore.newWallpapersCount }}</text>
                </view>
                <view class="tab-item" :class="{ 'is-active': activeTab === 'notices' }" @click="activeTab = 'notices'">
                    {{ t('index.notice') }}
                </view>
            </view>

            <!-- 滚动内容区 -->
            <scroll-view scroll-y class="sheet-body" show-scrollbar="false">
                <!-- 1. 壁纸更新卡片 (当展示全部或壁纸更新且有更新时) -->
                <view
                    v-if="(activeTab === 'all' || activeTab === 'wallpapers') && statusStore.newWallpapersCount > 0"
                    class="notify-card notify-card--wallpaper"
                    @click="goTimeline"
                >
                    <view class="notify-card__icon-wrap">
                        <mdi-icon path="/static/icons/image.svg" size="24px" color="#3b82f6"></mdi-icon>
                    </view>
                    <view class="notify-card__content">
                        <view class="notify-card__row">
                            <text class="notify-card__title">{{ t('index.newWallpapersNoticeTitle') }}</text>
                            <text class="notify-card__badge">{{ statusStore.newWallpapersCount }}P</text>
                        </view>
                        <text class="notify-card__desc">
                            {{ tp('index.newWallpapersNoticeDesc', { count: statusStore.newWallpapersCount }) }}
                        </text>
                    </view>
                    <view class="notify-card__arrow">
                        <mdi-icon path="/static/icons/chevron-right.svg" size="18px" color="var(--text-tertiary)"></mdi-icon>
                    </view>
                </view>

                <!-- 2. 系统公告列表 -->
                <view
                    v-if="activeTab === 'all' || activeTab === 'notices'"
                    class="notices-section"
                >
                    <view
                        v-for="item in noticeList"
                        :key="item.id"
                        class="notify-card notify-card--notice"
                        @click="goNoticeDetail(item)"
                    >
                        <view class="notify-card__icon-wrap notify-card__icon-wrap--notice">
                            <mdi-icon path="/static/icons/alert-box.svg" size="22px" color="#f59e0b"></mdi-icon>
                        </view>
                        <view class="notify-card__content">
                            <view class="notify-card__row">
                                <text class="notify-card__title">{{ getNoticeTitle(item) }}</text>
                                <text v-if="item.created_at || item.publish_date" class="notify-card__time">
                                    {{ formatTime(item.publish_date || item.created_at) }}
                                </text>
                            </view>
                            <text class="notify-card__desc">{{ getNoticeDesc(item) }}</text>
                        </view>
                        <view class="notify-card__arrow">
                            <mdi-icon path="/static/icons/chevron-right.svg" size="18px" color="var(--text-tertiary)"></mdi-icon>
                        </view>
                    </view>
                </view>

                <!-- 空状态 -->
                <view
                    v-if="isListEmpty"
                    class="empty-state"
                >
                    <mdi-icon path="/static/icons/bell.svg" size="48px" color="var(--text-tertiary)"></mdi-icon>
                    <text class="empty-state__text">{{ t('common.noData') }}</text>
                </view>
            </scroll-view>

            <!-- 底部拖拽收起指示条 -->
            <view class="sheet-drag-bar sheet-drag-bar--bottom" @click="close"></view>
        </view>
    </uni-popup>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTranslateParams } from '@/utils/i18n.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useStatusStore } from '@/stores/status.js';
import { apiGetNotice } from '@/api/wallpaper.js';
import { getStatusBarHeight } from '@/utils/layout.js';

const { t, locale } = useI18n();
const isEn = computed(() => locale.value === 'en');
const { tp } = useTranslateParams();
const settingsStore = useSettingsStore();
const statusStore = useStatusStore();

const statusBarHeight = ref(getStatusBarHeight() || 0);
const sheetPaddingTop = computed(() => `${statusBarHeight.value + 12}px`);

const popupRef = ref(null);
const activeTab = ref('all');
const noticeList = ref([]);

const getNoticeTitle = (item) => {
    if (!item) return '';
    if (isEn.value && item.title_en) {
        return item.title_en;
    }
    return item.title || '';
};

const getNoticeDesc = (item) => {
    if (!item) return '';
    if (isEn.value) {
        return item.summary_en || item.title_en || item.summary || item.title || '';
    }
    return item.summary || item.title || '';
};

const hasUnread = computed(() => {
    return statusStore.newWallpapersCount > 0 || noticeList.value.length > 0;
});

const isListEmpty = computed(() => {
    if (activeTab.value === 'wallpapers') {
        return statusStore.newWallpapersCount <= 0;
    }
    if (activeTab.value === 'notices') {
        return noticeList.value.length === 0;
    }
    return statusStore.newWallpapersCount <= 0 && noticeList.value.length === 0;
});

const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${m < 10 ? '0' + m : m}-${d < 10 ? '0' + d : d}`;
};

const fetchNotices = async () => {
    try {
        const res = await apiGetNotice();
        if (res?.data) {
            noticeList.value = Array.isArray(res.data) ? res.data : [];
        }
    } catch (e) {
        console.warn('fetchNotices error:', e);
    }
};

const open = () => {
    popupRef.value?.open();
    fetchNotices();
};

const close = () => {
    popupRef.value?.close();
};

const onPopupChange = (e) => {
    if (!e.show) {
        // 关闭时做清理
    }
};

const goTimeline = () => {
    close();
    uni.navigateTo({
        url: `/pages/app/timeline?unreadCount=${statusStore.newWallpapersCount || 0}`,
    });
};

const goNoticeDetail = (item) => {
    close();
    const title = getNoticeTitle(item);
    uni.navigateTo({
        url: `/pages/app/notice-detail?id=${item.id}&name=${encodeURIComponent(title)}`,
    });
};

defineExpose({
    open,
    close,
});
</script>

<style lang="scss" scoped>
.notification-sheet {
    background: var(--card-bg, #ffffff);
    border-bottom-left-radius: 44rpx;
    border-bottom-right-radius: 44rpx;
    padding: 20rpx 36rpx 24rpx;
    max-height: 75vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20rpx 50rpx rgba(0, 0, 0, 0.16);

    &.theme-dark {
        background: #18181b;
        box-shadow: 0 20rpx 50rpx rgba(0, 0, 0, 0.5);
    }
}

.sheet-drag-bar {
    width: 72rpx;
    height: 8rpx;
    background: rgba(120, 120, 128, 0.3);
    border-radius: 4rpx;
    align-self: center;
    margin-top: 20rpx;
    margin-bottom: 8rpx;
    cursor: pointer;
}

.sheet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;

    &__left {
        display: flex;
        align-items: center;
        gap: 14rpx;
        position: relative;
    }

    .title {
        font-size: 36rpx;
        font-weight: 700;
        color: var(--text-primary);
        letter-spacing: 0.5rpx;
    }

    .unread-badge {
        width: 12rpx;
        height: 12rpx;
        background: #ef4444;
        border-radius: 50%;
    }

    .close-btn {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        background: rgba(120, 120, 128, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;

        &:active {
            transform: scale(0.92);
        }
    }
}

.tab-segment {
    display: flex;
    background: var(--bg-secondary, rgba(120, 120, 128, 0.08));
    border-radius: 20rpx;
    padding: 6rpx;
    margin-bottom: 28rpx;

    .tab-item {
        flex: 1;
        text-align: center;
        padding: 14rpx 0;
        font-size: 26rpx;
        font-weight: 600;
        color: var(--text-secondary);
        border-radius: 16rpx;
        transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8rpx;

        &.is-active {
            background: var(--card-bg, #ffffff);
            color: var(--text-primary);
            box-shadow: 0 4rpx 14rpx rgba(0, 0, 0, 0.08);

            .theme-dark & {
                background: #27272a;
                box-shadow: 0 4rpx 14rpx rgba(0, 0, 0, 0.3);
            }
        }

        .tab-count {
            padding: 2rpx 10rpx;
            background: #ef4444;
            color: #ffffff;
            font-size: 20rpx;
            font-weight: 700;
            border-radius: 20rpx;
        }
    }
}

.sheet-body {
    max-height: 55vh;
}

.notify-card {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 24rpx;
    background: var(--card-subtle-bg, rgba(120, 120, 128, 0.05));
    border-radius: 24rpx;
    margin-bottom: 20rpx;
    border: 1rpx solid rgba(120, 120, 128, 0.1);
    transition: transform 0.2s, background 0.2s;

    .theme-dark & {
        border: none;
    }

    &:last-child {
        margin-bottom: 0;
    }

    &:active {
        transform: scale(0.98);
        background: rgba(120, 120, 128, 0.1);
    }

    &__icon-wrap {
        width: 80rpx;
        height: 80rpx;
        border-radius: 20rpx;
        background: rgba(59, 130, 246, 0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &--notice {
            background: rgba(245, 158, 11, 0.12);
        }
    }

    &__content {
        flex: 1;
        overflow: hidden;
    }

    &__row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8rpx;
    }

    &__title {
        font-size: 28rpx;
        font-weight: 600;
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__badge {
        font-size: 20rpx;
        font-weight: 700;
        color: #3b82f6;
        background: rgba(59, 130, 246, 0.12);
        padding: 2rpx 12rpx;
        border-radius: 12rpx;
    }

    &__time {
        font-size: 22rpx;
        color: var(--text-tertiary);
    }

    &__desc {
        font-size: 24rpx;
        color: var(--text-secondary);
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    &__arrow {
        flex-shrink: 0;
        display: flex;
        align-items: center;
    }
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80rpx 0;
    gap: 20rpx;

    &__text {
        font-size: 26rpx;
        color: var(--text-tertiary);
    }
}
</style>
