<template>
    <view class="top10-page">
        <view class="top10-status" :style="{ height: `${statusBarHeight}px` }"></view>

        <scroll-view scroll-y class="top10-scroll">
            <view class="top10-wrap">
                <view class="top10-header">
                    <view class="top10-header__left">
                        <view class="top10-header__back" @click="goBack">
                            <uni-icons type="back" size="20" color="#f8fafc"></uni-icons>
                        </view>
                        <view class="top10-header__title">{{ $t('top10.title') }}</view>
                    </view>
                </view>

                <view class="metric-switch">
                    <view
                        class="metric-switch__item"
                        :class="{ 'is-active': activeMetric === 'views' }"
                        @click="switchMetric('views')"
                    >
                        {{ $t('top10.tabs.views') }}
                    </view>
                    <view
                        class="metric-switch__item"
                        :class="{ 'is-active': activeMetric === 'downloads' }"
                        @click="switchMetric('downloads')"
                    >
                        {{ $t('top10.tabs.downloads') }}
                    </view>
                </view>

                <view class="top10-intro">
                    <view class="top10-intro__badge">{{ metricBadge }}</view>
                    <view class="top10-intro__desc">{{ metricDescription }}</view>
                </view>

                <rotate-loading v-if="loading" style="height: 360rpx"></rotate-loading>

                <template v-else-if="rankedList.length">
                    <view class="hero-section">
                        <view class="hero-card hero-card--first" @click="goPreview(rankedList[0].id)">
                            <image class="hero-card__image" :src="rankedList[0].picurl" mode="aspectFill"></image>
                            <view class="hero-card__overlay"></view>
                            <view class="hero-card__rank hero-card__rank--first">1</view>
                            <view class="hero-card__content">
                                <view class="hero-card__tag">{{ $t('top10.heroTag') }}</view>
                                <view class="hero-card__title">{{ rankedList[0].description || rankedList[0].classify_name || rankedList[0].id }}</view>
                                <view class="hero-card__meta">
                                    <view class="hero-card__meta-item">
                                        <uni-icons type="eye" size="14" color="#cbd5e1"></uni-icons>
                                        <text>{{ formatCount(rankedList[0].views) }}</text>
                                    </view>
                                    <view class="hero-card__meta-item">
                                        <uni-icons type="download" size="14" color="#cbd5e1"></uni-icons>
                                        <text>{{ formatCount(rankedList[0].downloads) }}</text>
                                    </view>
                                </view>
                            </view>
                        </view>

                        <view class="hero-grid" v-if="rankedList.length > 1">
                            <view
                                v-for="(item, idx) in rankedList.slice(1, 3)"
                                :key="item.id"
                                class="hero-card hero-card--secondary"
                                @click="goPreview(item.id)"
                            >
                                <image class="hero-card__image" :src="item.picurl" mode="aspectFill"></image>
                                <view class="hero-card__overlay hero-card__overlay--soft"></view>
                                <view class="hero-card__rank" :class="{ 'hero-card__rank--second': idx === 0 }">{{ idx + 2 }}</view>
                                <view class="hero-card__content hero-card__content--compact">
                                    <view class="hero-card__title hero-card__title--compact">
                                        {{ item.description || item.classify_name || item.id }}
                                    </view>
                                    <view class="hero-card__sub">{{ formatMetric(item) }}</view>
                                </view>
                            </view>
                        </view>
                    </view>

                    <view class="rank-section" v-if="rankedList.length > 3">
                        <view class="rank-section__title">
                            {{ $t('top10.listTitle') }}
                            <view class="rank-section__line"></view>
                        </view>

                        <view class="rank-list">
                            <view v-for="(item, idx) in rankedList.slice(3)" :key="item.id" class="rank-item" @click="goPreview(item.id)">
                                <view class="rank-item__media">
                                    <image class="rank-item__thumb" :src="item.smallPicurl || item.picurl" mode="aspectFill"></image>
                                    <view class="rank-item__index">{{ idx + 4 }}</view>
                                </view>
                                <view class="rank-item__body">
                                    <view class="rank-item__title">{{ item.description || item.classify_name || item.id }}</view>
                                    <view class="rank-item__meta">
                                        <text class="rank-item__category">{{ item.classify_name || $t('top10.wallpaper') }}</text>
                                        <text class="rank-item__metric">{{ formatMetric(item) }}</text>
                                    </view>
                                </view>
                                <view class="rank-item__action">
                                    <uni-icons type="right" size="16" color="#9fb4d1"></uni-icons>
                                </view>
                            </view>
                        </view>
                    </view>
                </template>

                <view v-else class="top10-empty">
                    <view class="top10-empty__title">{{ $t('top10.empty') }}</view>
                    <view class="top10-empty__desc">{{ $t('top10.emptyDesc') }}</view>
                </view>
            </view>
        </scroll-view>
    </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { apiGetClassList, apiGetTopWall } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { getStatusBarHeight } from '@/utils/system.js';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const activeMetric = ref('views');
const loading = ref(false);
const rankedList = ref([]);
const statusBarHeight = ref(getStatusBarHeight() || 0);

const metricBadge = computed(() => (activeMetric.value === 'views' ? t('top10.badgeViews') : t('top10.badgeDownloads')));
const metricDescription = computed(() =>
    activeMetric.value === 'views' ? t('top10.descViews') : t('top10.descDownloads'),
);

const getType = () => (activeMetric.value === 'views' ? 'views' : 'downloads');

const getTopList = async () => {
    loading.value = true;
    try {
        const res = await apiGetTopWall({
            type: getType(),
            n: 10,
        });
        const list = (res.data || []).map((item) => handlePicUrl(item));
        rankedList.value = list
            .sort((a, b) => {
                const aValue = Number(activeMetric.value === 'views' ? a.views : a.downloads) || 0;
                const bValue = Number(activeMetric.value === 'views' ? b.views : b.downloads) || 0;
                return bValue - aValue;
            })
            .slice(0, 10);
    } catch (error) {
        rankedList.value = [];
    } finally {
        loading.value = false;
    }
};

const switchMetric = async (metric) => {
    if (activeMetric.value === metric) return;
    activeMetric.value = metric;
    await getTopList();
};

const formatCount = (value) => {
    const num = Number(value) || 0;

    if (typeof Intl !== 'undefined' && Intl?.NumberFormat) {
        return new Intl.NumberFormat(locale.value === 'zh-Hans' ? 'zh-CN' : 'en-US', {
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(num);
    }

    const isZh = locale.value === 'zh-Hans';
    if (isZh) {
        if (num >= 100000000) return `${(num / 100000000).toFixed(num >= 1000000000 ? 0 : 1).replace(/\.0$/, '')}亿`;
        if (num >= 10000) return `${(num / 10000).toFixed(num >= 100000 ? 0 : 1).replace(/\.0$/, '')}万`;
        return `${num}`;
    }

    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return `${num}`;
};

const formatMetric = (item) => {
    const count = activeMetric.value === 'views' ? item.views : item.downloads;
    return `${formatCount(count)} ${activeMetric.value === 'views' ? t('top10.metricViews') : t('top10.metricDownloads')}`;
};

const goPreview = (id) => {
    uni.setStorageSync('wallList', rankedList.value);
    uni.navigateTo({
        url: `/pages/app/preview?id=${id}`,
    });
};

const goBack = () => {
    uni.navigateBack({
        fail: () => {
            uni.switchTab({ url: '/pages/app/index' });
        },
    });
};

onLoad(() => {
    getTopList();
});
</script>

<style lang="scss" scoped>
.top10-page {
    min-height: 100vh;
    background:
        radial-gradient(circle at top center, rgba(43, 140, 238, 0.22), transparent 24%),
        radial-gradient(circle at 20% 18%, rgba(244, 114, 182, 0.16), transparent 22%),
        linear-gradient(180deg, #101922 0%, #13202c 36%, #0c1218 100%);
}

.top10-status {
    width: 100%;
}

.top10-scroll {
    height: calc(100vh - 1rpx);
}

.top10-wrap {
    max-width: 860rpx;
    margin: 0 auto;
    padding: 26rpx 24rpx 56rpx;
}

.top10-header {
    margin-bottom: 26rpx;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 18rpx;
}

.top10-header__left {
    display: flex;
    align-items: center;
    gap: 16rpx;
    min-width: 0;
}

.top10-header__back {
    width: 68rpx;
    height: 68rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.08);
    border: 1rpx solid rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(20rpx);
    box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;

    &:active {
        transform: scale(0.9);
        background: rgba(255, 255, 255, 0.15);
    }
}

.top10-header__title {
    font-size: 40rpx;
    font-weight: 800;
    color: #60a5fa;
    line-height: 1.2;
}

.metric-switch {
    margin: 0 auto 24rpx;
    padding: 8rpx;
    width: fit-content;
    display: flex;
    align-items: center;
    gap: 10rpx;
    border-radius: 999rpx;
    background: rgba(17, 25, 34, 0.9);
    border: 1rpx solid rgba(148, 163, 184, 0.14);
    box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.04);
}

.metric-switch__item {
    min-width: 220rpx;
    height: 74rpx;
    padding: 0 26rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    font-size: 24rpx;
    font-weight: 700;
}

.metric-switch__item.is-active {
    color: #fff;
    background: linear-gradient(135deg, #2b8cee, #1f6fd1);
    box-shadow: 0 10rpx 24rpx rgba(43, 140, 238, 0.24);
}

.top10-intro {
    margin-bottom: 28rpx;
}

.top10-intro__badge {
    display: inline-flex;
    height: 40rpx;
    padding: 0 14rpx;
    align-items: center;
    border-radius: 999rpx;
    background: rgba(43, 140, 238, 0.16);
    color: #7dd3fc;
    font-size: 18rpx;
    font-weight: 800;
    letter-spacing: 2rpx;
    margin-bottom: 16rpx;
}

.top10-intro__desc {
    font-size: 24rpx;
    line-height: 1.8;
    color: #94a3b8;
}

.hero-section {
    margin-bottom: 40rpx;
}

.hero-card {
    position: relative;
    overflow: hidden;
    border-radius: 32rpx;
    background: #182431;
    box-shadow: 0 24rpx 56rpx rgba(0, 0, 0, 0.28);
    transition:
        transform 0.28s ease,
        box-shadow 0.28s ease;
}

.hero-card--first {
    aspect-ratio: 16 / 10;
    margin-bottom: 30rpx;
}

.hero-grid {
    margin-top: 18rpx;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 30rpx;
}

.hero-card--secondary {
    aspect-ratio: 3 / 4;
}

.hero-card__image {
    width: 100%;
    height: 100%;
    transition: transform 0.32s ease;
}

.hero-card__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(6, 12, 18, 0) 0%, rgba(6, 12, 18, 0) 48%, rgba(6, 12, 18, 0.9) 100%);
}

.hero-card__overlay--soft {
    background: linear-gradient(180deg, rgba(6, 12, 18, 0) 0%, rgba(6, 12, 18, 0) 50%, rgba(6, 12, 18, 0.74) 100%);
}

.hero-card__rank {
    position: absolute;
    top: 22rpx;
    left: 22rpx;
    width: 72rpx;
    height: 72rpx;
    border-radius: 999rpx;
    background: rgba(30, 41, 59, 0.92);
    color: #fff;
    font-size: 30rpx;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 14rpx 30rpx rgba(0, 0, 0, 0.24);
}

.hero-card__rank--first {
    background: linear-gradient(135deg, #2b8cee, #60a5fa);
}

.hero-card__rank--second {
    background: linear-gradient(135deg, #38bdf8, #0ea5e9);
}

.hero-card__content {
    position: absolute;
    left: 28rpx;
    right: 28rpx;
    bottom: 28rpx;
    z-index: 1;
}

.hero-card__content--compact {
    left: 20rpx;
    right: 20rpx;
    bottom: 20rpx;
}

.hero-card__tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 36rpx;
    padding: 0 14rpx;
    border-radius: 999rpx;
    background: rgba(43, 140, 238, 0.18);
    border: 1rpx solid rgba(125, 211, 252, 0.22);
    color: #7dd3fc;
    font-size: 18rpx;
    font-weight: 800;
    margin-bottom: 14rpx;
}

.hero-card__title {
    font-size: 42rpx;
    line-height: 1.2;
    font-weight: 800;
    color: #e2e8f0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.hero-card__title--compact {
    font-size: 28rpx;
    line-height: 1.38;
}

.hero-card__meta {
    margin-top: 16rpx;
    display: flex;
    align-items: center;
    gap: 24rpx;
}

.hero-card__meta-item,
.hero-card__sub {
    display: flex;
    align-items: center;
    gap: 8rpx;
    color: #cbd5e1;
    font-size: 22rpx;
}

.hero-card:active {
    transform: scale(1.03);
    box-shadow:
        0 18rpx 36rpx rgba(0, 0, 0, 0.26),
        0 32rpx 64rpx rgba(0, 0, 0, 0.22);
}

.hero-card:active .hero-card__image {
    transform: scale(1.08);
}

.rank-section__title {
    margin-bottom: 18rpx;
    display: flex;
    align-items: center;
    gap: 14rpx;
    color: #94a3b8;
    font-size: 18rpx;
    font-weight: 800;
    letter-spacing: 4rpx;
    text-transform: uppercase;
}

.rank-section__line {
    flex: 1;
    height: 1rpx;
    background: rgba(51, 65, 85, 0.8);
}

.rank-list {
    display: flex;
    flex-direction: column;
    gap: 30rpx;
}

.rank-item {
    height: 280rpx;
    border-radius: 28rpx;
    background: rgba(24, 36, 49, 0.92);
    border: 1rpx solid rgba(51, 65, 85, 0.56);
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
}

.rank-item__media {
    position: relative;
    width: 214rpx;
    height: 280rpx;
    flex-shrink: 0;
}

.rank-item__thumb {
    width: 214rpx;
    height: 280rpx;
    display: block;
}

.rank-item__index {
    position: absolute;
    top: 14rpx;
    left: 14rpx;
    width: 56rpx;
    height: 56rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(13, 19, 30, 0.9);
    border: 1rpx solid rgba(191, 219, 254, 0.18);
    color: #f8fafc;
    font-size: 24rpx;
    font-weight: 800;
    box-shadow: 0 12rpx 24rpx rgba(0, 0, 0, 0.24);
}

.rank-item__body {
    flex: 1;
    min-width: 0;
    padding: 22rpx 18rpx;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.rank-item__title {
    color: #dce4ee;
    font-size: 28rpx;
    font-weight: 600;
    line-height: 1.38;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.rank-item__meta {
    margin-top: 8rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    color: #94a3b8;
    font-size: 22rpx;
}

.rank-item__category {
    color: #9fb4d1;
    min-width: 0;
    flex: 1;
}

.rank-item__metric {
    flex-shrink: 0;
}

.rank-item__action {
    width: 48rpx;
    height: 48rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(159, 180, 209, 0.08);
    align-self: center;
    margin-right: 10rpx;
}

.rank-item:active {
    transform: scale(1.03);
    box-shadow:
        0 18rpx 36rpx rgba(0, 0, 0, 0.26),
        0 32rpx 64rpx rgba(0, 0, 0, 0.22);
    border-color: rgba(125, 211, 252, 0.28);
}

.rank-item:active .rank-item__thumb {
    transform: scale(1.08);
}

.rank-item__thumb {
    transition: transform 0.32s ease;
}

@media (hover: hover) and (pointer: fine) {
    .hero-card:hover {
        transform: scale(1.03);
        box-shadow:
            0 18rpx 36rpx rgba(0, 0, 0, 0.26),
            0 32rpx 64rpx rgba(0, 0, 0, 0.22);
    }

    .hero-card:hover .hero-card__image {
        transform: scale(1.08);
    }

    .rank-item:hover {
        transform: scale(1.03);
        box-shadow:
            0 18rpx 36rpx rgba(0, 0, 0, 0.26),
            0 32rpx 64rpx rgba(0, 0, 0, 0.22);
        border-color: rgba(125, 211, 252, 0.28);
    }

    .rank-item:hover .rank-item__thumb {
        transform: scale(1.08);
    }
}

.top10-empty {
    padding: 140rpx 30rpx;
    text-align: center;
}

.top10-empty__title {
    font-size: 34rpx;
    color: #f8fafc;
    font-weight: 700;
}

.top10-empty__desc {
    margin-top: 14rpx;
    font-size: 24rpx;
    line-height: 1.8;
    color: #94a3b8;
}
</style>
