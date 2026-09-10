<template>
    <view class="nav-tiles" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <view
            v-for="tile in tiles"
            :key="tile.key"
            class="tile-card"
            hover-class="tile-card--active"
            :hover-stay-time="120"
            @click="onTileClick(tile)"
        >
            <!-- 右上角精致微标签 (小巧克制，不抢占视觉) -->
            <view v-if="tile.badge" class="tile-card__badge" :class="tile.badgeClass">
                <text class="badge-text">{{ tile.badge }}</text>
            </view>
            <view v-else-if="tile.key === 'latest' && statusStore.newWallpapersCount > 0" class="tile-card__dot"></view>

            <!-- 图标区域 -->
            <view class="tile-card__icon-wrap">
                <mdi-icon
                    :path="tile.icon"
                    size="22px"
                    :color="settingsStore.isDark ? '#cbd5e1' : '#334155'"
                ></mdi-icon>
            </view>

            <!-- 标题区域 -->
            <text class="tile-card__title">{{ tile.label }}</text>
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

const tiles = computed(() => [
    {
        key: 'hot',
        label: t('index.tabs.hot') || '最热榜单',
        icon: '/static/icons/fire.svg',
        path: '/pages/app/top',
        badge: 'HOT',
        badgeClass: 'badge--hot',
    },
    {
        key: 'latest',
        label: t('index.tabs.latest') || '最新发布',
        icon: '/static/icons/flash.svg',
        path: '/pages/app/timeline',
        badge: statusStore.newWallpapersCount > 0 ? `${statusStore.newWallpapersCount > 99 ? '99+' : statusStore.newWallpapersCount}` : '',
        badgeClass: 'badge--new',
    },
    {
        key: 'subjects',
        label: t('index.subjectRecommend') || '专题策划',
        icon: '/static/icons/cards.svg',
        path: '/pages/app/subjects',
        badge: 'SPECIAL',
        badgeClass: 'badge--special',
    },
]);

const onTileClick = (tile) => {
    if (!tile.path) return;
    if (tile.key === 'latest') {
        uni.navigateTo({
            url: `/pages/app/timeline?unreadCount=${statusStore.newWallpapersCount || 0}`,
        });
        return;
    }
    uni.navigateTo({
        url: tile.path,
    });
};
</script>

<style lang="scss" scoped>
// 左右 padding 严格与搜索栏、Banner 统一为 32rpx
.nav-tiles {
    display: flex;
    align-items: stretch;
    gap: 16rpx;
    padding: 6rpx 32rpx 28rpx;
    box-sizing: border-box;
}

// 精巧微浮岛卡片 (高度缩减至 120rpx，半透明柔和底色，告别死白与突兀)
.tile-card {
    flex: 1;
    position: relative;
    height: 120rpx;
    background: rgba(255, 255, 255, 0.68);
    backdrop-filter: blur(16rpx);
    -webkit-backdrop-filter: blur(16rpx);
    border-radius: 24rpx;
    border: 1rpx solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 4rpx 16rpx rgba(30, 41, 59, 0.03);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4rpx;
    padding: 0 6rpx;
    box-sizing: border-box;
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s;

    .theme-dark & {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.08);
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.2);
    }

    &--active,
    &:active {
        transform: scale(0.95);
        background: rgba(255, 255, 255, 0.85);

        .theme-dark & {
            background: rgba(255, 255, 255, 0.09);
        }
    }

    &__icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48rpx;
        height: 48rpx;
    }

    &__title {
        font-size: 22rpx;
        line-height: 1.2;
        font-weight: 600;
        color: #334155;
        letter-spacing: -0.2rpx;
        white-space: nowrap;
        text-align: center;

        .theme-dark & {
            color: #e2e8f0;
        }
    }

    // ── 右上角微型胶囊标签 ──
    &__badge {
        position: absolute;
        top: 6rpx;
        right: 8rpx;
        padding: 2rpx 8rpx;
        border-radius: 999rpx;
        font-size: 14rpx;
        font-weight: 800;
        letter-spacing: 0.5rpx;
        line-height: 1;

        .badge-text {
            line-height: 1;
        }

        &.badge--hot {
            background: rgba(239, 68, 68, 0.12);
            color: #ef4444;
            border: 1rpx solid rgba(239, 68, 68, 0.2);
        }

        &.badge--new {
            background: #ef4444;
            color: #ffffff;
            box-shadow: 0 2rpx 6rpx rgba(239, 68, 68, 0.3);
        }

        &.badge--special {
            background: #facc15;
            color: #1c1917;
            box-shadow: 0 2rpx 6rpx rgba(250, 204, 21, 0.25);
        }
    }

    &__dot {
        position: absolute;
        top: 10rpx;
        right: 12rpx;
        width: 12rpx;
        height: 12rpx;
        border-radius: 50%;
        background: #ef4444;
        box-shadow: 0 0 6rpx rgba(239, 68, 68, 0.4);
    }
}
</style>
