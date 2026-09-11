<template>
    <view class="nav-pills-bar" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 1. 最热榜单 -->
        <view
            class="pill-item"
            hover-class="pill-item--active"
            :hover-stay-time="120"
            @click="goHot"
        >
            <view class="pill-item__icon">
                <mdi-icon path="/static/icons/fire.svg" size="16px" color="#ffffff"></mdi-icon>
            </view>
            <text class="pill-item__label">{{ isEn ? 'Trending' : '最热' }}</text>
        </view>

        <!-- 2. 最新发布 -->
        <view
            class="pill-item"
            hover-class="pill-item--active"
            :hover-stay-time="120"
            @click="goLatest"
        >
            <view class="pill-item__icon">
                <mdi-icon path="/static/icons/flash.svg" size="16px" color="#ffffff"></mdi-icon>
            </view>
            <text class="pill-item__label">{{ isEn ? 'Recent' : '最新' }}</text>
            <view v-if="statusStore.newWallpapersCount > 0" class="pill-item__badge">
                <text class="badge-text">{{ newBadgeText }}</text>
            </view>
        </view>

        <!-- 3. 专题策划 -->
        <view
            class="pill-item"
            hover-class="pill-item--active"
            :hover-stay-time="120"
            @click="goSubjects"
        >
            <view class="pill-item__icon">
                <mdi-icon path="/static/icons/cards.svg" size="16px" color="#ffffff"></mdi-icon>
            </view>
            <text class="pill-item__label">{{ isEn ? 'Specials' : '专题策划' }}</text>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStatusStore } from '@/stores/status.js';
import { useSettingsStore } from '@/stores/settings.js';

const { t, locale } = useI18n();
const statusStore = useStatusStore();
const settingsStore = useSettingsStore();

const isEn = computed(() => locale.value === 'en');

// 今日上新徽标数字
const newBadgeText = computed(() => {
    const count = statusStore.newWallpapersCount;
    if (count > 99) return '99+';
    return count > 0 ? `${count}` : '';
});

const goHot = () => {
    uni.navigateTo({
        url: '/pages/app/top',
    });
};

const goLatest = () => {
    uni.navigateTo({
        url: `/pages/app/timeline?unreadCount=${statusStore.newWallpapersCount || 0}`,
    });
};

const goSubjects = () => {
    uni.navigateTo({
        url: '/pages/app/subjects',
    });
};
</script>

<style lang="scss" scoped>
// 放置在搜索框正下方，左右内边距保持 20rpx 与全站严格对齐，左对齐紧凑排开
.nav-pills-bar {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 16rpx;
    padding: 16rpx 20rpx;
    box-sizing: border-box;
    width: 100%;
}

// 统一黑色药丸胶囊样式：无选中态区分、非等宽自适应、左对齐
.pill-item {
    flex: none;
    height: 64rpx;
    border-radius: 999rpx;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
    padding: 0 24rpx;
    box-sizing: border-box;
    cursor: pointer;
    user-select: none;
    position: relative;
    transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s, background 0.18s;

    // 浅色模式：更淡、更优雅通透的石墨炭灰，摆脱死黑太重的压迫感
    .theme-light & {
        background: #333b48;
        color: #ffffff;
        box-shadow: 0 3rpx 10rpx rgba(15, 23, 42, 0.08);

        .pill-item__label {
            color: #ffffff;
        }
    }

    // 深色模式：暗夜黑蓝高透底 + 细腻发光描边 + 白字
    .theme-dark & {
        background: #252b38;
        color: #f8fafc;
        border: 1rpx solid rgba(255, 255, 255, 0.14);
        box-shadow: 0 4rpx 14rpx rgba(0, 0, 0, 0.25);

        .pill-item__label {
            color: #f8fafc;
        }
    }

    &--active,
    &:active {
        transform: scale(0.95);
        opacity: 0.9;
    }

    &__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        line-height: 1;
    }

    &__label {
        font-size: 23rpx;
        font-weight: 650;
        letter-spacing: -0.2rpx;
        line-height: 1;
        white-space: nowrap;
    }

    // 精巧数字徽标
    &__badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 2rpx 8rpx;
        border-radius: 999rpx;
        background: #ef4444;
        color: #ffffff;
        box-shadow: 0 2rpx 6rpx rgba(239, 68, 68, 0.35);
        line-height: 1;
        margin-left: 2rpx;

        .badge-text {
            font-size: 16rpx;
            font-weight: 850;
            line-height: 1;
            letter-spacing: 0.3rpx;
        }
    }
}
</style>
