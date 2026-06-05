<template>
    <view class="recommend-panel" :class="isDark ? 'theme-dark' : 'theme-light'">
        <view class="recommend-panel__ad">
            <custom-ad-banner></custom-ad-banner>
        </view>

        <view class="recommend-panel__head">
            <view>
                <view class="recommend-panel__title">{{ t('previewPage.recommend.title') }}</view>
                <view class="recommend-panel__desc">{{ t('previewPage.recommend.desc') }}</view>
            </view>
            <!-- <view class="recommend-panel__count">{{ t('previewPage.recommend.topN', { count: limit }) }}</view> -->
        </view>

        <view v-if="loading" class="recommend-panel__loading">
            <rotate-loading :size="70"></rotate-loading>
        </view>

        <view v-else-if="!list.length" class="recommend-panel__empty">{{ t('previewPage.recommend.empty') }}</view>

        <view v-else class="recommend-list">
            <view v-for="item in list" :key="item.id" class="recommend-card" @click="openPreview(item)">
                <image class="recommend-card__image" :src="item.smallPicurl || item.picurl" mode="aspectFill"></image>
                <view class="recommend-card__body">
                    <!-- <view v-if="item.reason" class="recommend-card__reason">{{ item.reason }}</view> -->
                    <view class="recommend-card__title">{{ item.description || `#${item.id}` }}</view>
                    <view class="recommend-card__meta">
                        <text class="recommend-card__meta-text">{{ item.classify_name || t('top10.wallpaper') }}</text>
                        <view class="recommend-card__score">
                            <mdi-icon path="/static/icons/star.svg" size="16px" color="#f4b400"></mdi-icon>
                            <text class="recommend-card__score-text">{{ item.score ?? '--' }}</text>
                        </view>
                    </view>
                </view>
                <view class="recommend-card__arrow">
                    <uni-icons type="right" size="16" :color="arrowIconColor"></uni-icons>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiGetSimilarWall } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { useLibraryStore } from '@/stores/library.js';
import { useUserStore } from '@/stores/user.js';
import { useSettingsStore } from '@/stores/settings.js';

const props = defineProps({
    currentInfo: {
        type: Object,
        default: () => ({}),
    },
    limit: {
        type: Number,
        default: 8,
    },
});

const { t } = useI18n();
const libraryStore = useLibraryStore();
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const list = ref([]);
const loading = ref(false);
const isAdmin = computed(() => !!userStore.isAdmin);
const isDark = computed(() => settingsStore.isDark);
const arrowIconColor = computed(() => (isDark.value ? '#94a3b8' : '#7c8aa5'));

const normalizeTags = (wall = {}) => {
    if (Array.isArray(wall.tabs_list)) return wall.tabs_list.filter(Boolean);
    if (typeof wall.tabs === 'string') {
        return wall.tabs
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
};

const getRecommendReason = (item = {}, current = {}) => {
    const itemTags = normalizeTags(item);
    const currentTags = normalizeTags(current);
    const matchedTag = itemTags.find((tag) => currentTags.includes(tag));
    if (matchedTag) {
        return t('previewPage.recommend.reasonTag', { tag: matchedTag });
    }

    if (item.classify_name && current.classify_name && item.classify_name === current.classify_name) {
        return t('previewPage.recommend.reasonCategory');
    }

    const itemScore = Number(item.score);
    const currentScore = Number(current.score);
    if (!Number.isNaN(itemScore) && !Number.isNaN(currentScore) && Math.abs(itemScore - currentScore) <= 0.5) {
        return t('previewPage.recommend.reasonScore');
    }

    return t('previewPage.recommend.reasonStyle');
};

const loadRecommend = async () => {
    const current = props.currentInfo || {};
    const currentId = Number(current.id) || current.id;

    if (!currentId) {
        list.value = [];
        return;
    }

    loading.value = true;
    try {
        const res = await apiGetSimilarWall(currentId);
        // 必须添加id字段，否则会报错，因为id字段是必填项
        list.value = res.data
            .map((item) => {
                const normalized = handlePicUrl({ ...item, id: item.wall_id });
                return {
                    ...normalized,
                    reason: getRecommendReason(normalized, current),
                };
            })
            .filter((item) => !isAdmin.value || !libraryStore.isWallHidden(item))
            .slice(0, props.limit);
    } catch (error) {
        list.value = [];
    } finally {
        loading.value = false;
    }
};

const openPreview = (item) => {
    uni.setStorageSync('wallList', [item]);
    uni.navigateTo({
        url: `/pages/app/preview?id=${item.id}&mode=recommend`,
    });
};

watch(
    () => props.currentInfo?.id,
    () => {
        loadRecommend();
    },
    { immediate: true },
);
</script>

<style lang="scss" scoped>
@import '@/static/styles/theme-variables.scss';

.recommend-panel {
    padding: 32rpx 24rpx 40rpx;
    background: var(--page-background);
}

.recommend-panel__ad {
    margin-bottom: 24rpx;
    border-radius: 24rpx;
    overflow: hidden;
    background: var(--panel-background);

    .theme-light & {
        background: rgba(0, 0, 0, 0.03);
    }
}

.recommend-panel__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20rpx;
    margin-bottom: 20rpx;
}

.recommend-panel__title {
    font-size: 34rpx;
    font-weight: 700;
    color: var(--text-primary);
}

.recommend-panel__desc {
    margin-top: 6rpx;
    font-size: 24rpx;
    color: var(--text-secondary);
}

.recommend-panel__count {
    font-size: 22rpx;
    color: var(--text-tertiary);
}

.recommend-panel__loading,
.recommend-panel__empty {
    min-height: 240rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-tertiary);
    font-size: 24rpx;
}

.recommend-list {
    display: flex;
    flex-direction: column;
    gap: 30rpx;
}

.recommend-card {
    height: 280rpx;
    min-height: 280rpx;
    border-radius: 28rpx;
    background: rgba(24, 36, 49, 0.92);
    display: flex;
    align-items: stretch;
    gap: 0;
    overflow: hidden;
    box-shadow:
        0 10rpx 24rpx rgba(0, 0, 0, 0.2),
        0 24rpx 48rpx rgba(0, 0, 0, 0.16);
    transition:
        transform 0.28s ease,
        box-shadow 0.28s ease,
        border-color 0.28s ease;

    .theme-light & {
        background: #f8fafc;
        box-shadow: 0 6rpx 18rpx rgba(15, 23, 42, 0.05);
    }
}

.recommend-card__image {
    width: 214rpx;
    height: 280rpx;
    min-height: 280rpx;
    border-radius: 0;
    flex-shrink: 0;
    align-self: stretch;
    transition: transform 0.32s ease;
}

.recommend-card__body {
    flex: 1;
    min-width: 0;
    padding: 22rpx 18rpx;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.recommend-card__reason {
    align-self: flex-start;
    min-height: 38rpx;
    max-width: 100%;
    padding: 0 14rpx;
    border-radius: 999rpx;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(40, 179, 137, 0.1);
    border: 1rpx solid rgba(40, 179, 137, 0.14);
    color: #15805f;
    font-size: 20rpx;
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 10rpx;
}

.recommend-card__title {
    color: #dce4ee;
    font-size: 28rpx;
    font-weight: 600;
    line-height: 1.38;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;

    .theme-light & {
        color: var(--text-primary);
    }
}

.recommend-card__meta {
    margin-top: 8rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    font-size: 22rpx;
    color: #94a3b8;

    .theme-light & {
        color: var(--text-tertiary);
    }
}

.recommend-card__meta-text {
    min-width: 0;
    flex: 1;
}

.recommend-card__score {
    display: flex;
    align-items: center;
    gap: 8rpx;
    flex-shrink: 0;
}

.recommend-card__score-text {
    font-size: 24rpx;
    font-weight: 600;
    color: var(--text-tertiary);
    line-height: 1;
}

.recommend-card__arrow {
    width: 48rpx;
    height: 48rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(159, 180, 209, 0.08);
    align-self: center;
    margin-right: 10rpx;

    .theme-light & {
        background: rgba(0, 0, 0, 0.04);
    }
}

.recommend-card:active {
    transform: scale(1.03);
    box-shadow:
        0 18rpx 36rpx rgba(0, 0, 0, 0.26),
        0 32rpx 64rpx rgba(0, 0, 0, 0.22);
    border-color: rgba(125, 211, 252, 0.28);
}

.recommend-card:active .recommend-card__image {
    transform: scale(1.08);
}

@media (hover: hover) and (pointer: fine) {
    .recommend-card:hover {
        transform: scale(1.03);
        box-shadow:
            0 18rpx 36rpx rgba(0, 0, 0, 0.26),
            0 32rpx 64rpx rgba(0, 0, 0, 0.22);
        border-color: rgba(125, 211, 252, 0.28);
    }

    .recommend-card:hover .recommend-card__image {
        transform: scale(1.08);
    }
}
</style>
