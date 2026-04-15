<template>
    <view class="layout">
        <view class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>

        <scroll-view
            scroll-y
            class="timeline-scroll"
            :style="{ height: contentHeight }"
            :scroll-into-view="scrollIntoViewTarget"
            @scroll="handleScroll"
            @scrolltolower="onReachLower"
        >
            <view class="timeline-wrap">
                <view id="timeline-top-anchor" class="timeline-top-anchor"></view>
                <view class="topbar">
                    <view class="topbar__back" @click="goBack">
                        <mdi-icon path="/static/icons/arrow-left.svg" size="20px" color="#f4f8ff"></mdi-icon>
                    </view>
                    <view class="topbar__brand">{{ t('timeline.brand') }}</view>
                    <view class="topbar__placeholder"></view>
                </view>

                <view class="hero">
                    <view class="hero__headline">{{ t('timeline.subtitle') }}</view>
                    <view class="hero__desc">{{ t('timeline.desc') }}</view>
                </view>

                <view v-if="isLoading" class="loading-state">
                    <rotate-loading></rotate-loading>
                </view>

                <view v-else-if="!monthGroups.length" class="empty">
                    <view class="empty__title">{{ t('timeline.empty') }}</view>
                </view>

                <view v-for="month in monthGroups" :key="month.key" class="month-section">
                    <view class="month-section__head">
                        <view class="month-section__ghost">{{ month.monthText }}</view>
                        <view class="month-section__meta">
                            <text class="month-section__year">{{ month.year }}</text>
                            <view class="month-section__line"></view>
                            <text class="month-section__tag">{{ formatRecentTag(month.count) }}</text>
                        </view>
                    </view>

                    <view v-for="day in month.days" :key="day.key" class="day-section">
                        <view class="day-section__marker">
                            <view class="day-section__number">{{ day.day }}</view>
                            <view class="day-section__divider"></view>
                            <view class="day-section__label">{{ day.label }}</view>
                        </view>

                        <view class="editorial-grid">
                            <!-- 首张且当天壁纸大于1张时，第一张为大图，现在是每天第一张都是大图 -->
                            <!-- :class="{ 'timeline-card--wide': idx === 0 && day.items.length > 1 }" -->
                            <view
                                v-for="(item, idx) in day.items"
                                :key="item.id"
                                class="timeline-card"
                                :class="{ 'timeline-card--wide': idx === 0 }"
                                @click="goPreview(item.id)"
                            >
                                <image class="timeline-card__image" :src="idx === 0 ? (item.mediumPicurl || item.picurl) : item.smallPicurl" mode="aspectFill" lazy-load></image>
                                <view class="timeline-card__overlay"></view>
                                <view class="timeline-card__content">
                                    <view class="timeline-card__classify">
                                        {{ item.classify_name || t('top10.wallpaper') }}
                                    </view>
                                    <view class="timeline-card__title">
                                        {{ item.description || item.classify_name || `#${item.id}` }}
                                    </view>
                                    <view class="timeline-card__footer">
                                        <view class="timeline-card__time">
                                            <text>{{ formatTime(item) }}</text>
                                        </view>
                                        <view class="timeline-card__score">
                                            <mdi-icon path="/static/icons/star.svg" size="14px" color="#ffbf66"></mdi-icon>
                                            <text>{{ item.score ?? '--' }}</text>
                                        </view>
                                    </view>
                                </view>
                            </view>
                        </view>
                    </view>
                </view>

                <view v-if="latestList.length" class="load-more-box">
                    <uni-load-more :status="noMoreData ? 'noMore' : (isLoading ? 'loading' : 'more')"></uni-load-more>
                </view>
            </view>
        </scroll-view>

        <view v-if="showScrollTop" class="floating-top" @click="scrollToTop">
            <mdi-icon path="/static/icons/arrow-up.svg" size="18px" color="#0d1b2f"></mdi-icon>
        </view>
    </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { apiGetClassList } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { getStatusBarHeight } from '@/utils/system.js';

const { t, locale } = useI18n();

const statusBarHeight = ref(getStatusBarHeight() || 0);
const contentHeight = computed(() => `calc(100vh - ${statusBarHeight.value}px)`);
const scrollIntoViewTarget = ref('');
const showScrollTop = ref(false);
const isLoading = ref(false);
const noMoreData = ref(false);
const latestList = ref([]);

const queryParams = ref({
    pageNum: 1,
    pageSize: 12,
    ordering: '-created',
});

const monthNamesEn = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const weekdayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const weekdayNamesZh = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

const isZh = computed(() => String(locale.value || '').startsWith('zh'));

const toDate = (item) => {
    const raw = item.updated_at || Date.now();
    return new Date(raw);
};

const getMonthText = (date) => {
    if (isZh.value) {
        return `${date.getMonth() + 1}月`;
    }
    return monthNamesEn[date.getMonth()];
};

const getDayLabel = (date) => {
    if (isZh.value) {
        return `${weekdayNamesZh[date.getDay()]} ${date.getMonth() + 1}月`;
    }
    return `${weekdayNamesEn[date.getDay()]} / ${monthNamesEn[date.getMonth()].slice(0, 3)}`;
};

const getMonthKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}`;
const getDayKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

const formatTime = (item) => {
    const date = toDate(item);
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
};

const formatRecentTag = (count) => {
    if (isZh.value) {
        return `最新 ${count} 张`;
    }
    return `LATEST ${count}`;
};

const monthGroups = computed(() => {
    const list = [];
    const monthMap = new Map();

    latestList.value.forEach((item) => {
        const date = toDate(item);
        const monthKey = getMonthKey(date);
        const dayKey = getDayKey(date);

        if (!monthMap.has(monthKey)) {
            const monthItem = {
                key: monthKey,
                year: date.getFullYear(),
                monthText: getMonthText(date),
                count: 0,
                days: [],
                dayMap: new Map(),
            };
            monthMap.set(monthKey, monthItem);
            list.push(monthItem);
        }

        const monthItem = monthMap.get(monthKey);
        monthItem.count += 1;

        if (!monthItem.dayMap.has(dayKey)) {
            const dayItem = {
                key: dayKey,
                day: String(date.getDate()).padStart(2, '0'),
                label: getDayLabel(date),
                items: [],
            };
            monthItem.dayMap.set(dayKey, dayItem);
            monthItem.days.push(dayItem);
        }

        monthItem.dayMap.get(dayKey).items.push(item);
    });

    return list;
});

const getLatest = async (isAppend = false) => {
    if (isLoading.value || (isAppend && noMoreData.value)) return;

    try {
        isLoading.value = true;
        const res = await apiGetClassList(queryParams.value);
        const newData = (res.data || []).map((item) => handlePicUrl(item));

        if (isAppend) {
            latestList.value.push(...newData);
        } else {
            latestList.value = newData;
        }

        // 统一排序确保时间轴逻辑严密
        latestList.value.sort((a, b) => toDate(b).getTime() - toDate(a).getTime());

        if (queryParams.value.pageNum >= res.pagination.total_pages) {
            noMoreData.value = true;
        }
    } catch (error) {
        console.error('Failed to fetch timeline:', error);
    } finally {
        isLoading.value = false;
    }
};

const onReachLower = () => {
    if (noMoreData.value || isLoading.value) return;
    queryParams.value.pageNum++;
    getLatest(true);
};

const goPreview = (id) => {
    uni.setStorageSync('wallList', latestList.value);
    uni.navigateTo({
        url: `/pages/app/preview?id=${id}`,
    });
};

const goBack = () => {
    uni.navigateBack({
        fail: () => uni.reLaunch({ url: '/pages/app/index' }),
    });
};

const handleScroll = (e) => {
    const top = Number(e?.detail?.scrollTop || 0);
    const windowHeight = uni.getSystemInfoSync().windowHeight || 0;
    const nextVisible = top > windowHeight / 2;
    if (showScrollTop.value !== nextVisible) {
        showScrollTop.value = nextVisible;
    }
};

const scrollToTop = () => {
    scrollIntoViewTarget.value = 'timeline-top-anchor';
    showScrollTop.value = false;
    setTimeout(() => {
        scrollIntoViewTarget.value = '';
    }, 80);
};

onLoad(() => {
    getLatest();
});
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background:
        radial-gradient(circle at 78% 12%, rgba(90, 145, 255, 0.18), transparent 24%),
        radial-gradient(circle at 18% 16%, rgba(255, 187, 106, 0.12), transparent 20%),
        linear-gradient(180deg, #0a1018 0%, #0f1621 42%, #0a0f16 100%);
    color: #eaf0fb;
}

.status-holder {
    width: 100%;
}

.timeline-scroll {
    width: 100%;
}

.timeline-wrap {
    max-width: 860rpx;
    margin: 0 auto;
    padding: 18rpx 24rpx 72rpx;
    position: relative;
}

.loading-state {
    padding: 120rpx 0;
    display: flex;
    justify-content: center;
    align-items: center;
}

.timeline-top-anchor {
    width: 100%;
    height: 1rpx;
}

.topbar {
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28rpx;
}

.topbar__back,
.topbar__placeholder {
    width: 74rpx;
    height: 74rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(18rpx);
}

.topbar__back {
    background: rgba(255, 255, 255, 0.08);
    border: 1rpx solid rgba(220, 228, 243, 0.08);
}

.topbar__brand {
    font-size: 28rpx;
    font-weight: 800;
    letter-spacing: 8rpx;
    color: rgba(220, 228, 243, 0.92);
    padding-left: 8rpx;
}

.hero {
    margin-bottom: 52rpx;
    padding: 10rpx 8rpx 0;
}

.hero__headline {
    font-size: 82rpx;
    line-height: 1.06;
    font-weight: 900;
    color: #f5f8ff;
    letter-spacing: -2.5rpx;
    white-space: pre-line;
    text-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.22);
}

.hero__desc {
    margin-top: 18rpx;
    width: 100%;
    font-size: 28rpx;
    line-height: 1.9;
    color: rgba(214, 223, 239, 0.9);
    padding: 0 8rpx;
}

.empty {
    min-height: 360rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 32rpx;
    background: rgba(18, 28, 41, 0.72);
    border: 1rpx solid rgba(255, 255, 255, 0.05);
}

.empty__title {
    font-size: 26rpx;
    color: rgba(226, 232, 240, 0.9);
}

.month-section {
    margin-bottom: 80rpx;
}

.month-section__head {
    margin-bottom: 28rpx;
}

.month-section__ghost {
    font-size: 86rpx;
    line-height: 1;
    font-weight: 900;
    color: rgba(148, 163, 184, 0.45);
    letter-spacing: -2rpx;
}

.month-section__meta {
    margin-top: -22rpx;
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.month-section__year {
    font-size: 38rpx;
    font-weight: 800;
    color: #f5f8ff;
}

.month-section__line {
    flex: 1;
    height: 1rpx;
    background: rgba(115, 130, 154, 0.34);
}

.month-section__tag {
    font-size: 20rpx;
    font-weight: 800;
    letter-spacing: 3rpx;
    color: #619aef;
    text-transform: uppercase;
}

.day-section {
    margin-bottom: 50rpx;
}

.day-section__marker {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 20rpx;
}

.day-section__number {
    font-size: 54rpx;
    line-height: 1;
    font-weight: 900;
    color: #f5f8ff;
}

.day-section__divider {
    width: 4rpx;
    height: 52rpx;
    border-radius: 999rpx;
    background: linear-gradient(180deg, #79a8ff, rgba(121, 168, 255, 0.2));
}

.day-section__label {
    font-size: 20rpx;
    line-height: 1.5;
    font-weight: 700;
    letter-spacing: 2rpx;
    color: rgba(226, 232, 240, 0.88);
    text-transform: uppercase;
}

.editorial-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 30rpx;
}

.timeline-card {
    position: relative;
    overflow: hidden;
    border-radius: 28rpx;
    background: #18222f;
    box-shadow:
        0 18rpx 40rpx rgba(0, 0, 0, 0.24),
        inset 0 1rpx 0 rgba(255, 255, 255, 0.06);
    transition:
        transform 0.28s ease,
        box-shadow 0.28s ease;
}

.timeline-card--wide {
    grid-column: 1 / -1;
    aspect-ratio: 16 / 10;
    height: auto;
}

.editorial-grid .timeline-card:not(.timeline-card--wide) {
    height: 620rpx;
}

.timeline-card__image {
    width: 100%;
    height: 100%;
}

.timeline-card__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(8, 11, 18, 0) 0%, rgba(8, 11, 18, 0) 66%, rgba(8, 11, 18, 0.88) 100%);
}

.timeline-card__content {
    position: absolute;
    left: 22rpx;
    right: 22rpx;
    bottom: 22rpx;
    z-index: 1;
}

.timeline-card__classify {
    display: inline-flex;
    align-items: center;
    min-height: 34rpx;
    padding: 0 12rpx;
    margin-bottom: 12rpx;
    border-radius: 999rpx;
    background: rgba(97, 154, 239, 0.16);
    border: 1rpx solid rgba(97, 154, 239, 0.2);
    color: #c7dbff;
    font-size: 18rpx;
    font-weight: 700;
    max-width: 100%;
}

.timeline-card__title {
    font-size: 28rpx;
    line-height: 1.36;
    font-weight: 700;
    color: #f7fbff;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
}

.timeline-card__footer {
    margin-top: 14rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12rpx;
}

.timeline-card__time,
.timeline-card__score {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 20rpx;
    color: #e2e8f0;
}

.timeline-card:active {
    transform: scale(1.02);
}

@media (hover: hover) and (pointer: fine) {
    .timeline-card:hover {
        transform: translateY(-6rpx) scale(1.02);
        box-shadow:
            0 28rpx 52rpx rgba(0, 0, 0, 0.3),
            inset 0 1rpx 0 rgba(255, 255, 255, 0.08);
    }
}

.floating-top {
    position: fixed;
    right: 28rpx;
    bottom: calc(env(safe-area-inset-bottom) + 32rpx);
    width: 86rpx;
    height: 86rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #619aef;
    box-shadow: 0 20rpx 44rpx rgba(97, 154, 239, 0.32);
    z-index: 20;
}
</style>
