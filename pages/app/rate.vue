<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- Custom Beautiful Header -->
        <view class="custom-header" :style="{ paddingTop: statusBarHeight + 'px' }">
            <view class="header-content">
                <view class="back-btn" @click="goBack">
                    <mdi-icon path="/static/icons/arrow-left.svg" size="24px" :color="settingsStore.isDark ? '#e5e7eb' : '#1e293b'" />
                </view>
                <view class="header-title-box">
                    <text class="header-title">{{ t('user.profile.myScore') }}</text>
                    <text class="header-subtitle">My Rating</text>
                </view>
                <view class="header-placeholder"></view> <!-- For flex centering -->
            </view>
        </view>

        <view class="content-wrapper">
            <empty-state
                v-if="ratingList.length === 0 && !isRunning"
                icon-path="/static/icons/star.svg"
                :title="t('rating.empty')"
                :action-text="t('rating.goBrowse')"
                @action="goBrowse"
            ></empty-state>

            <view v-else class="rating-list">
                <view v-for="(item, index) in ratingList" :key="item.id" class="rating-swipe-item">
                    <uni-swipe-action>
                        <uni-swipe-action-item :right-options="swipeOptions" @click="handleSwipeClick(item, index, $event)">
                            <view class="rating-item" @click="goPreview(item)">
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
                                    <uni-icons type="right" size="16" :color="settingsStore.isDark ? '#4b5563' : '#cbd5e1'"></uni-icons>
                                </view>
                            </view>
                        </uni-swipe-action-item>
                    </uni-swipe-action>
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
import { apiGetActions, apiPostActions } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { getStatusBarHeight } from '@/utils/system.js';

const { t } = useI18n();
const settingsStore = useSettingsStore();

const statusBarHeight = ref(getStatusBarHeight() || 0);

const backToTopRef = ref(null);
const isRunning = ref(false);
const noData = ref(false);
const ratingList = ref([]);

const goBack = () => {
    uni.navigateBack({
        fail: () => {
            uni.switchTab({ url: '/pages/user/user' });
        }
    });
};

const swipeOptions = ref([
    {
        text: t('rating.delete'),
        style: {
            backgroundColor: '#e74c3c',
        },
    },
]);

const queryParams = ref({
    pageNum: 1,
    pageSize: 12,
    action_key: 'rate',
});

const getRatingList = async () => {
    try {
        if (queryParams.value.pageNum === 1) {
            uni.showLoading();
        }
        isRunning.value = true;

        let res = await apiGetActions(queryParams.value);
        let rows = Array.isArray(res?.data) ? res.data : [];
        let fullData = rows.map((item) => handlePicUrl(item));

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
        url: '/pages/app/preview?id=' + item.id,
    });
};

const goBrowse = () => {
    uni.switchTab({
        url: '/pages/app/index',
    });
};

const handleSwipeClick = (item, index, e) => {
    if (e?.content?.text !== t('rating.delete')) return;

    uni.showModal({
        title: t('common.tip'),
        content: t('rating.deleteConfirm'),
        success: async (res) => {
            if (!res.confirm) return;

            const prevItem = ratingList.value[index];
            ratingList.value.splice(index, 1);
            uni.setStorageSync('wallList', ratingList.value);

            try {
                await apiPostActions({
                    wall_id: item.id,
                    action_key: 'rate',
                    action_value: 0,
                });
                uni.showToast({
                    title: t('rating.deleteSuccess'),
                    icon: 'none',
                });
            } catch (error) {
                ratingList.value.splice(index, 0, prevItem);
                uni.setStorageSync('wallList', ratingList.value);
                uni.showToast({
                    title: t('rating.deleteFailed'),
                    icon: 'none',
                });
            }
        },
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
@import '@/static/styles/theme-variables.scss';

.layout {
    background: var(--page-background);
    min-height: 100vh;
    transition: background-color 0.3s ease;
    display: flex;
    flex-direction: column;

    .custom-header {
        position: relative;
        z-index: 100;
        padding-bottom: 20rpx;

        .header-content {
            height: 110rpx;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 30rpx;
        }
        
        .header-title-box {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .back-btn {
            width: 84rpx;
            height: 84rpx;
            border-radius: 28rpx;
            background: var(--panel-background, #ffffff);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10rpx 30rpx var(--shadow-color, rgba(0, 0, 0, 0.03));
            border: 1rpx solid var(--panel-border, rgba(0, 0, 0, 0.03));
            transition: transform 0.2s ease, background 0.2s ease;
            
            &:active {
                transform: scale(0.92);
                background: var(--panel-background-strong, #f1f5f9);
            }
        }

        .header-title {
            font-size: 36rpx;
            font-weight: 800;
            color: var(--text-primary, #1e293b);
            letter-spacing: 1rpx;
        }
        
        .header-subtitle {
            font-size: 22rpx;
            color: var(--text-tertiary, #94a3b8);
            margin-top: 6rpx;
            letter-spacing: 2rpx;
            text-transform: uppercase;
            font-weight: 600;
        }
        
        .header-placeholder {
            width: 84rpx;
        }
    }

    .content-wrapper {
        padding: 30rpx 24rpx;
    }

    .rating-list {
        .rating-swipe-item {
            margin-bottom: 24rpx;
            box-shadow: 0 8rpx 24rpx var(--shadow-color, rgba(19, 25, 39, 0.03));
            border-radius: 24rpx;
            overflow: hidden;
            border: 1rpx solid var(--panel-border, rgba(17, 17, 17, 0.05));
        }

        .rating-swipe-item:last-child {
            margin-bottom: 0;
        }

        :deep(.uni-swipe_action) {
            border-radius: 24rpx;
            overflow: hidden;
        }

        .rating-item {
            display: flex;
            align-items: center;
            background: var(--panel-background-strong, #fff);
            border-radius: 24rpx;
            padding: 24rpx;
            transition: all 0.25s ease-in-out;

            &:active {
                transform: scale(0.985);
                opacity: 0.92;
                background: var(--panel-background, #f8fafc);
            }

            .rating-image {
                width: 150rpx;
                height: 150rpx;
                border-radius: 16rpx;
                overflow: hidden;
                flex-shrink: 0;
                border: 1rpx solid var(--panel-border, rgba(17, 17, 17, 0.05));

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
                    color: var(--text-primary, #1e293b);
                    font-weight: 700;
                    margin-bottom: 12rpx;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .rating-meta {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 10rpx;

                    .score-section {
                        display: flex;
                        align-items: center;
                        gap: 8rpx;

                        .score-text {
                            font-size: 28rpx;
                            color: #ffb300;
                            font-weight: 700;
                        }
                    }

                    .rating-time {
                        font-size: 22rpx;
                        color: var(--text-tertiary, #94a3b8);
                    }
                }

                .rating-comment {
                    font-size: 25rpx;
                    color: var(--text-secondary, #64748b);
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
