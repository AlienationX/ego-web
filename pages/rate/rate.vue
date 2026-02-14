<template>
    <view class="layout">
        <menu-bar>
            <template #title>{{ t('user.profile.myScore') }}</template>
        </menu-bar>

        <view class="content-wrapper">
            <view v-if="ratingList.length === 0 && !isRunning" class="empty-state">
                <!-- <image src="/static/images/pics/empty.svg" mode="aspectFit" class="empty-image"></image> -->
                <text class="empty-text">{{ t('rating.empty') }}</text>
                <button class="go-browse-btn" @click="goBrowse">{{ t('rating.goBrowse') }}</button>
            </view>

            <view v-else class="rating-list">
                <view class="rating-item" v-for="item in ratingList" :key="item.id" @click="goPreview(item)">
                    <view class="rating-image">
                        <image :src="item.smallPicurl || item.picurl" mode="aspectFill"></image>
                    </view>
                    <view class="rating-info">
                        <view class="wallpaper-name">{{ item.description || t('rating.untitled') }}</view>
                        <view class="rating-meta">
                            <view class="score-section">
                                <uni-rate readonly :value="item.my_score" size="14" margin="8"></uni-rate>
                                <text class="score-text">{{ item.my_score }}</text>
                            </view>
                            <view class="rating-time" v-if="item.action_updated_at">
                                {{ formatTime(item.action_updated_at) }}
                            </view>
                        </view>
                        <view class="rating-comment" v-if="item.tabs">
                            {{ item.tabs }}
                        </view>
                    </view>
                    <view class="rating-arrow">
                        <uni-icons type="right" size="16" color="#ccc"></uni-icons>
                    </view>
                </view>

                <view class="loadingLayout" v-show="noData || isRunning">
                    <uni-load-more :status="noData ? 'noMore' : 'loading'"></uni-load-more>
                </view>
            </view>

            <back-to-top ref="backToTopRef"></back-to-top>

            <view class="safe-area-inset-bottom"></view>
        </view>
    </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onUnload, onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app';
import { apiGetActions } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { getNavBarHeight } from '@/utils/system.js';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const backToTopRef = ref(null);
const isRunning = ref(false);
const noData = ref(false);
const ratingList = ref([]);

const queryParams = ref({
    pageNum: 1,
    pageSize: 12,
    action_type: 'rate',
});

const getRatingList = async () => {
    try {
        if (queryParams.value.pageNum === 1) {
            uni.showLoading();
        }
        isRunning.value = true;

        let res = await apiGetActions(queryParams.value);
        let fullData = res.data.map((item) => handlePicUrl(item));

        if (queryParams.value.pageNum === 1) {
            ratingList.value = fullData;
        } else {
            ratingList.value.push(...fullData);
        }

        if (queryParams.value.pageNum >= res.pagination.total_pages) noData.value = true;
    } finally {
        uni.hideLoading();
        isRunning.value = false;
    }
};

const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('rating.justNow');
    if (minutes < 60) return `${minutes}${t('rating.minutesAgo')}`;
    if (hours < 24) return `${hours}${t('rating.hoursAgo')}`;
    if (days < 7) return `${days}${t('rating.daysAgo')}`;

    return date.toLocaleDateString();
};

const goPreview = (item) => {
    uni.setStorageSync('wallList', ratingList.value);
    uni.navigateTo({
        url: '/pages/preview/preview?id=' + item.id,
    });
};

const goBrowse = () => {
    uni.switchTab({
        url: '/pages/index/index',
    });
};

const init = () => {
    queryParams.value = {
        pageNum: 1,
        pageSize: 12,
        action_type: 'rate',
    };
    noData.value = false;
    ratingList.value = [];
};

onLoad(() => {
    getRatingList();
});

onUnload(() => {
    uni.removeStorageSync('wallList');
});

onReachBottom(() => {
    if (noData.value || isRunning.value) return;
    queryParams.value.pageNum++;
    getRatingList();
});

onPullDownRefresh(() => {
    init();
    getRatingList().finally(() => {
        uni.stopPullDownRefresh();
    });
});
</script>

<style lang="scss" scoped>
.layout {
    background-color: #f5f5f5;
    min-height: 100vh;

    .content-wrapper {
        padding: 20rpx;
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 200rpx 0;

        .empty-image {
            width: 400rpx;
            height: 400rpx;
            margin-bottom: 40rpx;
            opacity: 0.5;
        }

        .empty-text {
            font-size: 32rpx;
            color: #999;
            margin-bottom: 60rpx;
        }

        .go-browse-btn {
            width: 300rpx;
            height: 80rpx;
            background: linear-gradient(135deg, $wp-theme-color 0%, darken($wp-theme-color, 8%) 100%);
            color: #fff;
            font-size: 32rpx;
            border-radius: 40rpx;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;

            &::after {
                border: none;
            }

            &:active {
                transform: scale(0.95);
                opacity: 0.9;
            }
        }
    }

    .rating-list {
        .rating-item {
            display: flex;
            align-items: center;
            background: #fff;
            border-radius: 16rpx;
            padding: 24rpx;
            margin-bottom: 20rpx;
            transition: all 0.3s;

            &:active {
                transform: scale(0.99);
                opacity: 0.9;
            }

            .rating-image {
                width: 160rpx;
                height: 160rpx;
                border-radius: 12rpx;
                overflow: hidden;
                flex-shrink: 0;

                image {
                    width: 100%;
                    height: 100%;
                }
            }

            .rating-info {
                flex: 1;
                padding: 0 24rpx;
                overflow: hidden;

                .wallpaper-name {
                    font-size: 30rpx;
                    color: #333;
                    font-weight: 500;
                    margin-bottom: 16rpx;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .rating-meta {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 12rpx;

                    .score-section {
                        display: flex;
                        align-items: center;
                        gap: 8rpx;

                        .score-text {
                            font-size: 28rpx;
                            color: #ffc107;
                            font-weight: 600;
                        }
                    }

                    .rating-time {
                        font-size: 24rpx;
                        color: #999;
                    }
                }

                .rating-comment {
                    font-size: 26rpx;
                    color: #999;
                    line-height: 1.5;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }

            .rating-arrow {
                flex-shrink: 0;
            }
        }
    }

    .loadingLayout {
        padding: 30rpx 0;
    }

    .safe-area-inset-bottom {
        height: constant(safe-area-inset-bottom);
        height: env(safe-area-inset-bottom);
    }
}
</style>
