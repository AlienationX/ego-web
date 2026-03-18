<template>
    <view class="layout">
        <view class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>
        <view class="header">
            <view class="back-btn" @click="goBack">
                <uni-icons type="back" size="18" color="#374151"></uni-icons>
            </view>
            <text class="header-title">{{ $t('latest.title') }}</text>
            <view class="header-placeholder"></view>
        </view>

        <scroll-view scroll-y class="content" :style="{ height: contentHeight }">
            <view class="intro">
                <text class="intro-title">{{ $t('latest.subtitle') }}</text>
                <text class="intro-desc">{{ $t('latest.desc') }}</text>
            </view>

            <view v-if="!latestGroups.length" class="empty">
                <text class="empty-text">{{ $t('latest.empty') }}</text>
            </view>

            <view v-for="group in latestGroups" :key="group.dateKey" class="timeline-group">
                <view class="timeline-date">{{ group.label }}</view>
                <view class="card-grid">
                    <view v-for="item in group.items" :key="item.id" class="card-item" @click="goPreview(item.id)">
                        <image class="card-thumb" :src="item.smallPicurl" mode="aspectFill"></image>
                        <view class="card-meta">
                            <text class="card-title">{{ item.description }}</text>
                            <view class="card-footer">
                                <view class="card-score">
                                    <uni-icons type="star-filled" size="24" color="#E3B341"></uni-icons>
                                    <text class="score-text">{{ item.score ?? '--' }}</text>
                                </view>
                                <!-- <text class="card-time">{{ formatTime(item) }}</text> -->
                                <text class="card-time">{{ item.classify_name }}</text>
                            </view>
                        </view>
                    </view>
                </view>
            </view>
        </scroll-view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { apiGetClassList } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { getStatusBarHeight } from '@/utils/system.js';

const statusBarHeight = ref(getStatusBarHeight() || 0);
const contentHeight = computed(() => `calc(100vh - ${statusBarHeight.value}px - 56px)`);

const latestList = ref([]);

const toDate = (item) => {
    const raw = item.created_at || item.created || item.create_time || item.update_time || item.updated_at || Date.now();
    return new Date(raw);
};

const formatDateLabel = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const formatTime = (item) => {
    const date = toDate(item);
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
};

const latestGroups = computed(() => {
    const groups = [];
    const map = new Map();
    latestList.value.forEach((item) => {
        const date = toDate(item);
        const key = formatDateLabel(date);
        if (!map.has(key)) {
            map.set(key, { dateKey: key, label: key, items: [] });
            groups.push(map.get(key));
        }
        map.get(key).items.push(item);
    });
    return groups;
});

const getLatest = async () => {
    const res = await apiGetClassList({
        ordering: '-created',
        page_size: 60,
    });
    latestList.value = (res.data || [])
        .map((item) => handlePicUrl(item))
        .sort((a, b) => toDate(b).getTime() - toDate(a).getTime());
};

const goPreview = (id) => {
    uni.setStorageSync('wallList', latestList.value);
    uni.navigateTo({ url: `/pages/preview/preview?id=${id}` });
};

const goBack = () => {
    uni.navigateBack({
        fail: () => uni.reLaunch({ url: '/pages/index/index' }),
    });
};

onLoad(() => {
    getLatest();
});
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: #f6f4ef;
    display: flex;
    flex-direction: column;
}

.status-holder {
    width: 100%;
}

.header {
    height: 112rpx;
    background: #f6f4ef;
    display: flex;
    align-items: center;
    padding: 0 32rpx;
    gap: 16rpx;
}

.back-btn {
    width: 72rpx;
    height: 72rpx;
    border-radius: 16rpx;
    background: #fff;
    border: 2rpx solid #f0f1f3;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-title {
    flex: 1;
    text-align: center;
    font-size: 36rpx;
    font-weight: 700;
    color: #111827;
}

.header-placeholder {
    width: 72rpx;
    height: 72rpx;
}

.content {
    padding: 24rpx 32rpx 72rpx;
    box-sizing: border-box;
}

.intro {
    margin-bottom: 36rpx;
    padding: 28rpx 32rpx;
    background: linear-gradient(135deg, rgba(229, 50, 45, 0.12), rgba(255, 224, 178, 0.55));
    border: 2rpx solid rgba(229, 50, 45, 0.18);
    border-radius: 28rpx;
}

.intro-title {
    display: block;
    font-size: 38rpx;
    font-weight: 700;
    color: #111827;
    margin-bottom: 12rpx;
}

.intro-desc {
    display: block;
    font-size: 24rpx;
    color: #6b7280;
}

.empty {
    padding: 80rpx 0;
    text-align: center;
}

.empty-text {
    font-size: 26rpx;
    color: #9ca3af;
}

.timeline-group {
    margin-bottom: 44rpx;
}

.timeline-date {
    font-size: 22rpx;
    font-weight: 700;
    color: #7c6f63;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    margin-bottom: 20rpx;
    padding-left: 8rpx;
}

.card-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 28rpx;  
}

.card-item {
    background: #fff;
    border: 2rpx solid rgba(0, 0, 0, 0.04);
    border-radius: 32rpx;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 16rpx 40rpx rgba(16, 24, 40, 0.08);
    transform: translateZ(0);
}

.card-thumb {
    width: 100%;
    height: 480rpx;
}

.card-meta {
    padding: 20rpx;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(249, 250, 251, 1));
}

.card-title {
    display: block;
    font-size: 28rpx;
    font-weight: 700;
    color: #111827;
    margin-bottom: 12rpx;
    letter-spacing: 0.2px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.card-time {
    display: block;
    font-size: 24rpx;
    color: #8b7e73;
    padding-right: 10rpx;
    text-align: right;
}

.card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12rpx;
}

.card-score {
    display: flex;
    align-items: center;
    gap: 8rpx;
    color: #9a8c7a;
}

.score-text {
    font-size: 24rpx;
    color: #9a8c7a;
}
</style>
