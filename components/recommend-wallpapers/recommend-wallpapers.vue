<template>
    <view class="recommend-panel">
        <view class="recommend-panel__ad">
            <custom-ad-banner></custom-ad-banner>
        </view>

        <view class="recommend-panel__head">
            <view>
                <view class="recommend-panel__title">{{ t('preview.recommend.title') }}</view>
                <view class="recommend-panel__desc">{{ t('preview.recommend.desc') }}</view>
            </view>
            <!-- <view class="recommend-panel__count">{{ t('preview.recommend.topN', { count: limit }) }}</view> -->
        </view>

        <view v-if="loading" class="recommend-panel__loading">
            <rotate-loading :size="70"></rotate-loading>
        </view>

        <view v-else-if="!list.length" class="recommend-panel__empty">{{ t('preview.recommend.empty') }}</view>

        <view v-else class="recommend-list">
            <view v-for="item in list" :key="item.id" class="recommend-card" @click="openPreview(item)">
                <image class="recommend-card__image" :src="item.smallPicurl || item.picurl" mode="aspectFill"></image>
                <view class="recommend-card__body">
                    <view class="recommend-card__title">{{ item.description || item.classify_name || `#${item.id}` }}</view>
                    <view class="recommend-card__meta">
                        <text class="recommend-card__meta-text">{{ item.classify_name || t('top10.wallpaper') }}</text>
                        <view class="recommend-card__score">
                            <mdi-icon path="/static/icons/star.svg" size="16px" color="#f4b400"></mdi-icon>
                            <text class="recommend-card__score-text">{{ item.score ?? '--' }}</text>
                        </view>
                    </view>
                </view>
                <view class="recommend-card__arrow">
                    <uni-icons type="right" size="16" color="#7c8aa5"></uni-icons>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiGetSimilarWall } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';

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
const list = ref([]);
const loading = ref(false);

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
        const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        list.value = rows
            .map((item) => handlePicUrl(item))
            .filter((item) => item.id !== currentId)
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
.recommend-panel {
    padding: 32rpx 24rpx 40rpx;
    background: #f8fafc;
}

.recommend-panel__ad {
    margin-bottom: 24rpx;
    border-radius: 24rpx;
    overflow: hidden;
    background: #eef2f7;
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
    color: #162033;
}

.recommend-panel__desc {
    margin-top: 6rpx;
    font-size: 24rpx;
    color: #7c8aa5;
}

.recommend-panel__count {
    font-size: 22rpx;
    color: #7c8aa5;
}

.recommend-panel__loading,
.recommend-panel__empty {
    min-height: 240rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #8b97ac;
    font-size: 24rpx;
}

.recommend-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.recommend-card {
    min-height: 220rpx;
    height: 220rpx;
    border-radius: 22rpx;
    background: #fff;
    border: 1rpx solid #e9edf5;
    display: flex;
    align-items: stretch;
    gap: 0;
    overflow: hidden;
    box-shadow:
        0 10rpx 24rpx rgba(15, 23, 42, 0.07),
        0 24rpx 48rpx rgba(15, 23, 42, 0.06);
    transition:
        transform 0.28s ease,
        box-shadow 0.28s ease,
        border-color 0.28s ease;
}

.recommend-card__image {
    width: 168rpx;
    height: 220rpx;
    min-height: 220rpx;
    border-radius: 0;
    flex-shrink: 0;
    align-self: stretch;
    transition: transform 0.32s ease;
}

.recommend-card__body {
    flex: 1;
    min-width: 0;
    padding: 18rpx 18rpx 18rpx 18rpx;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.recommend-card__title {
    font-size: 30rpx;
    font-weight: 600;
    color: #526173;
    line-height: 1.32;
    letter-spacing: 0.2rpx;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.recommend-card__meta {
    margin-top: 8rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    font-size: 22rpx;
    color: #7c8aa5;
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
    color: #6b7789;
    line-height: 1;
}

.recommend-card__arrow {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    margin-right: 10rpx;
}

.recommend-card:active {
    transform: scale(1.04);
    box-shadow:
        0 18rpx 36rpx rgba(15, 23, 42, 0.12),
        0 34rpx 64rpx rgba(15, 23, 42, 0.12);
    border-color: rgba(40, 179, 137, 0.3);
}

.recommend-card:active .recommend-card__image {
    transform: scale(1.08);
}

@media (hover: hover) and (pointer: fine) {
    .recommend-card:hover {
        transform: scale(1.04);
        box-shadow:
            0 18rpx 36rpx rgba(15, 23, 42, 0.12),
            0 34rpx 64rpx rgba(15, 23, 42, 0.12);
        border-color: rgba(40, 179, 137, 0.3);
    }

    .recommend-card:hover .recommend-card__image {
        transform: scale(1.08);
    }
}
</style>
