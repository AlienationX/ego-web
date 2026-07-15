<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- The Review Journal Header -->
        <view class="journal-header" :style="{ paddingTop: statusBarHeight + 'px' }">
            <view class="header-content">
                <view class="back-btn" @click="goBack">
                    <mdi-icon path="/static/icons/arrow-left.svg" size="24px" :color="settingsStore.isDark ? '#e5e7eb' : '#1e293b'" />
                </view>
                <view class="header-title-box">
                    <text class="header-title">{{ $t('rating.superTitle') }}</text>
                    <text class="header-subtitle">{{ $t('rating.desc') }}</text>
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

            <view v-else class="journal-list">
                <view v-for="(item, index) in ratingList" :key="item.id" class="journal-card-wrapper">
                    <uni-swipe-action>
                        <uni-swipe-action-item :right-options="swipeOptions" @click="handleSwipeClick(item, index, $event)">
                            <view class="journal-card" @click="goPreview(item)">
                                <!-- Cinematic Image Header -->
                                <view class="card-hero">
                                    <image class="hero-image" :src="item.mediumPicurl || item.smallPicurl || item.picurl" mode="aspectFill"></image>
                                    <view class="hero-overlay"></view>
                                    
                                    <!-- Massive Score -->
                                    <view class="massive-score">
                                        <text class="score-num">{{ item.my_score }}</text>
                                        <text class="score-max">/5</text>
                                    </view>
                                </view>
                                
                                <!-- Journal Content -->
                                <view class="card-content">
                                    <view class="content-header">
                                        <view class="wallpaper-name">{{ getTitle(item) }}</view>
                                        <view class="rating-time" v-if="item.action_updated_at">
                                            {{ formatTime(item.action_updated_at) }}
                                        </view>
                                    </view>
                                    
                                    <view class="journal-comment" v-if="item.tabs">
                                        <text class="quote-mark">“</text>
                                        <text class="comment-text">{{ item.tabs }}</text>
                                        <text class="quote-mark">”</text>
                                    </view>
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
import { ref, computed } from 'vue';
import { onLoad, onUnload, onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app';
import { apiGetActions, apiPostActions } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { getStatusBarHeight } from '@/utils/layout.js';
import { useAppStore } from '@/stores/app.js';

const { t, locale } = useI18n();
const settingsStore = useSettingsStore();

const isEn = computed(() => locale.value === 'en');
const getTitle = (item) => isEn.value && item.description_en ? item.description_en : item.description || item.classify_name || t('rating.untitled');

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
            backgroundColor: '#ef4444',
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
    const appStore = useAppStore();
    appStore.wallList = ratingList.value;
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
            const appStore = useAppStore();
            appStore.wallList = ratingList.value;

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
                const appStore = useAppStore();
                appStore.wallList = ratingList.value;
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
    const appStore = useAppStore();
    appStore.wallList = [];
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
    background: var(--page-background-secondary); // 让卡片浮现出来
    min-height: 100vh;
    transition: background-color 0.3s ease;
    display: flex;
    flex-direction: column;

    .journal-header {
        position: sticky;
        top: 0;
        z-index: 100;
        background: rgba(var(--page-background-rgb), 0.8);
        backdrop-filter: blur(16px);
        padding-bottom: 20rpx;
        border-bottom: 1rpx solid var(--panel-border);

        .header-content {
            height: 88rpx;
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
            width: 72rpx;
            height: 72rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            
            &:active {
                opacity: 0.5;
            }
        }

        .header-title {
            font-size: 34rpx;
            font-weight: 800;
            color: var(--text-primary);
            letter-spacing: 2rpx;
            text-transform: uppercase;
        }
        
        .header-subtitle {
            font-size: 22rpx;
            color: var(--text-tertiary);
            margin-top: 4rpx;
            font-weight: 600;
        }
        
        .header-placeholder {
            width: 72rpx;
        }
    }

    .content-wrapper {
        flex: 1;
        padding: 30rpx 24rpx;
    }

    .journal-list {
        .journal-card-wrapper {
            margin-bottom: 32rpx;
            border-radius: 32rpx;
            overflow: hidden;
            box-shadow: 0 12rpx 32rpx var(--shadow-color, rgba(0,0,0,0.06));
            transform: translateZ(0); // For safari rounded corners rendering
        }

        :deep(.uni-swipe_action) {
            border-radius: 32rpx;
            overflow: hidden;
            background: transparent;
        }

        .journal-card {
            background: var(--page-background);
            display: flex;
            flex-direction: column;
            transition: all 0.25s ease;

            &:active {
                transform: scale(0.98);
            }

            .card-hero {
                position: relative;
                width: 100%;
                height: 340rpx;
                overflow: hidden;

                .hero-image {
                    width: 100%;
                    height: 100%;
                }

                .hero-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3) 100%);
                }

                .massive-score {
                    position: absolute;
                    bottom: 24rpx;
                    right: 32rpx;
                    display: flex;
                    align-items: baseline;
                    color: #fff;
                    text-shadow: 0 4rpx 16rpx rgba(0,0,0,0.5);

                    .score-num {
                        font-size: 96rpx;
                        font-weight: 900;
                        line-height: 1;
                        color: #fbbf24;
                        letter-spacing: -4rpx;
                    }

                    .score-max {
                        font-size: 32rpx;
                        font-weight: 700;
                        opacity: 0.8;
                        margin-left: 4rpx;
                    }
                }
            }

            .card-content {
                padding: 32rpx;
                display: flex;
                flex-direction: column;
                gap: 20rpx;

                .content-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;

                    .wallpaper-name {
                        font-size: 32rpx;
                        font-weight: 700;
                        color: var(--text-primary);
                        flex: 1;
                        padding-right: 20rpx;
                        line-height: 1.4;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .rating-time {
                        font-size: 24rpx;
                        color: var(--text-tertiary);
                        font-weight: 500;
                        white-space: nowrap;
                        margin-top: 6rpx;
                    }
                }

                .journal-comment {
                    font-size: 28rpx;
                    color: var(--text-secondary);
                    line-height: 1.6;
                    font-style: italic;
                    position: relative;
                    padding-left: 20rpx;
                    border-left: 6rpx solid var(--panel-border);
                    
                    .quote-mark {
                        color: var(--text-tertiary);
                        opacity: 0.5;
                        font-size: 32rpx;
                        font-family: serif;
                    }
                }
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
