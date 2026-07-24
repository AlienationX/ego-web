<template>
    <view class="layout" :class="[settingsStore.isDark ? 'theme-dark' : 'theme-light', { 'is-embedded': embedded }]">
        <view v-if="!embedded" class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>

        <scroll-view scroll-y class="timeline-scroll" show-scrollbar="false" :style="{ height: contentHeight }"
            :scroll-into-view="scrollIntoViewTarget" @scroll="handleScroll" @scrolltolower="onReachLower">
            <view class="timeline-wrap" :style="{ paddingBottom: timelineWrapPaddingBottom }">
                <!-- Spacer for embedded titlebar -->
                <view v-if="embedded" :style="{ height: navBarHeight + 'px' }"></view>
                <view id="timeline-top-anchor" class="timeline-top-anchor"></view>
                <view v-if="!embedded" class="topbar">
                    <view class="topbar__back" @click="goBack">
                        <mdi-icon path="/static/icons/arrow-left.svg" size="20px"
                            :color="settingsStore.isDark ? '#f4f8ff' : '#374151'"></mdi-icon>
                    </view>
                    <view class="topbar__brand">{{ t('timeline.brand') }}</view>
                    <view class="topbar__placeholder"></view>
                </view>

                <view class="hero">
                    <view class="hero__headline">{{ t('timeline.subtitle') }}</view>
                    <view class="hero__desc">{{ t('timeline.desc') }}</view>
                </view>

                <view v-if="isLoading" class="skeleton-wrap">
                    <!-- 月份标题骨架 -->
                    <view class="skeleton-month-head">
                        <view class="skeleton-month-ghost"></view>
                        <view class="skeleton-month-meta">
                            <view class="skeleton-month-year"></view>
                            <view class="skeleton-month-line"></view>
                            <view class="skeleton-month-tag"></view>
                        </view>
                    </view>
                    <!-- 日期标记骨架 -->
                    <view class="skeleton-day-marker">
                        <view class="skeleton-day-number"></view>
                        <view class="skeleton-day-divider"></view>
                        <view class="skeleton-day-label"></view>
                    </view>
                    <!-- 编辑网格骨架：一大 + 两小 -->
                    <view class="skeleton-grid">
                        <view class="skeleton-card skeleton-card--wide"></view>
                        <view class="skeleton-grid-row">
                            <view class="skeleton-card skeleton-card--small"></view>
                            <view class="skeleton-card skeleton-card--small"></view>
                        </view>
                    </view>
                    <!-- 第二组日期 + 两小卡 -->
                    <view class="skeleton-day-marker" style="margin-top: 48rpx;">
                        <view class="skeleton-day-number"></view>
                        <view class="skeleton-day-divider"></view>
                        <view class="skeleton-day-label"></view>
                    </view>
                    <view class="skeleton-grid">
                        <view class="skeleton-grid-row">
                            <view class="skeleton-card skeleton-card--small"></view>
                            <view class="skeleton-card skeleton-card--small"></view>
                        </view>
                    </view>
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
                            <template v-for="(item, idx) in day.items" :key="item.id">
                                <view class="timeline-card" :class="{ 'timeline-card--wide': idx === 0 }"
                                    @click="goPreview(item.id)">
                                    <image class="timeline-card__image"
                                        :src="idx === 0 ? item.mediumPicurl || item.picurl : item.smallPicurl"
                                        mode="aspectFill" lazy-load></image>
                                    <view class="timeline-card__lock" v-if="item.is_locked">
                                        <uni-icons type="locked-filled" size="18" color="#F9E9B5"></uni-icons>
                                    </view>
                                    <view class="timeline-card__overlay"></view>
                                    <view class="timeline-card__content">
                                        <view class="timeline-card__classify">
                                            {{ getLocalizedItem(item).classify_name || t('top10.wallpaper') }}
                                        </view>
                                        <view class="timeline-card__title">
                                            {{
                                                getLocalizedItem(item).description ||
                                                getLocalizedItem(item).classify_name ||
                                                `#${item.id}`
                                            }}
                                        </view>
                                        <view class="timeline-card__footer">
                                            <view class="timeline-card__footer-left">
                                                <view class="timeline-card__time">
                                                    <text>{{ formatTime(item) }}</text>
                                                </view>
                                            </view>
                                            <view class="timeline-card__score">
                                                <mdi-icon path="/static/icons/star.svg" size="14px"
                                                    color="#ffbf66"></mdi-icon>
                                                <text>{{ item.score ?? '--' }}</text>
                                            </view>
                                        </view>
                                    </view>
                                </view>

                                <!-- 上次浏览标记 -->
                                <view v-if="item.isLastViewedBoundary" class="last-viewed-divider">
                                    <view class="last-viewed-divider__line"></view>
                                    <view class="last-viewed-divider__text">{{ t('timeline.aboveNewWallpapers') }}
                                    </view>
                                    <view class="last-viewed-divider__line"></view>
                                </view>
                            </template>
                        </view>
                    </view>
                </view>

                <view v-if="latestList.length" class="load-more-box">
                    <uni-load-more :status="noMoreData ? 'noMore' : isLoading ? 'loading' : 'more'"></uni-load-more>
                </view>
            </view>
        </scroll-view>

        <custom-ad-banner v-if="!embedded" @height-change="onAdHeightChange"></custom-ad-banner>

        <fab-back-top :show="showScrollTop" :embedded="embedded" :ad-height="adHeight" @click="scrollToTop" />
    </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { apiGetClassList } from '@/api/wallpaper.js';
import { handlePicUrl, getDayLabel as commonGetDayLabel, MONTH_NAMES_UPPER_EN } from '@/utils/common.js';
import { getStatusBarHeight, getTabBarHeight } from '@/utils/layout.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useAppStore } from '@/stores/app.js';

import { USE_CUSTOM_TABBAR } from '@/config/tabbar.js';



const timelineWrapPaddingBottom = computed(() => {
    const tabH = (props.embedded && USE_CUSTOM_TABBAR) ? getTabBarHeight() : 0;
    return `${tabH + 16}px`;
});

const { t, locale } = useI18n();
const settingsStore = useSettingsStore();
const isEn = computed(() => locale.value === 'en');

const getLocalizedItem = (item) => {
    if (!item) return item;
    return {
        ...item,
        description: isEn.value && item.description_en ? item.description_en : item.description,
        classify_name: isEn.value && item.classify_name_en ? item.classify_name_en : item.classify_name,
    };
};

const props = defineProps({
    embedded: {
        type: Boolean,
        default: false,
    },
    navBarHeight: {
        type: Number,
        default: 0,
    },
    unreadCount: {
        type: Number,
        default: 0,
    },
});

const emit = defineEmits(['scroll']);

const statusBarHeight = ref(getStatusBarHeight() || 0);
const adHeight = ref(0);
const onAdHeightChange = (height) => {
    adHeight.value = Math.max(0, Number(height) || 0);
};
const contentHeight = computed(() =>
    props.embedded ? '100vh' : `calc(100vh - ${statusBarHeight.value}px - ${adHeight.value}px)`,
);
const scrollIntoViewTarget = ref('');
const showScrollTop = ref(false);
const isLoading = ref(false);
const noMoreData = ref(false);
const latestList = ref([]);

const queryParams = ref({
    pageNum: 1,
    pageSize: 12,
    ordering: '-updated_at',
});

const isZh = computed(() => String(locale.value || '').startsWith('zh'));

const toDate = (item) => {
    const raw = item.updated_at || Date.now();
    return new Date(raw);
};

const getMonthText = (date) => {
    if (isZh.value) {
        return `${date.getMonth() + 1}月`;
    }
    return MONTH_NAMES_UPPER_EN[date.getMonth()];
};

const getDayLabel = (date) => commonGetDayLabel(date, isZh.value);

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

    latestList.value.forEach((item, index) => {
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

        // 判断是否为新旧壁纸边界
        const markedItem = { ...item };
        if (props.unreadCount > 0 && index === props.unreadCount - 1) {
            markedItem.isLastViewedBoundary = true;
        }

        monthItem.dayMap.get(dayKey).items.push(markedItem);
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
    const appStore = useAppStore();
    appStore.wallList = latestList.value;
    uni.navigateTo({
        url: `/pages/app/preview?id=${id}`,
    });
};

const goBack = () => {
    uni.navigateBack({
        fail: () => uni.reLaunch({ url: '/pages/app/index' }),
    });
};

const currentScrollTop = ref(0);

const handleScroll = (e) => {
    const top = Number(e?.detail?.scrollTop || 0);
    currentScrollTop.value = top;
    const windowHeight = uni.getWindowInfo().windowHeight || 0;
    const nextVisible = top > windowHeight / 2;
    if (showScrollTop.value !== nextVisible) {
        showScrollTop.value = nextVisible;
    }
    emit('scroll', { scrollTop: top });
};

const scrollToTop = () => {
    scrollIntoViewTarget.value = 'timeline-top-anchor';
    showScrollTop.value = false;
    currentScrollTop.value = 0;
    setTimeout(() => {
        scrollIntoViewTarget.value = '';
    }, 80);
};

onMounted(() => {
    if (!latestList.value.length) {
        getLatest();
    }
});

onShow(() => {
    const windowHeight = uni.getWindowInfo().windowHeight || 0;
    if (currentScrollTop.value > windowHeight / 2) {
        showScrollTop.value = true;
    }
});
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: var(--page-background);
    color: #eaf0fb;

    &.theme-light {
        color: var(--text-primary);
    }
}

.layout.is-embedded {
    min-height: 0;
    width: 100%;
    height: 100vh;
    overflow: hidden;
}

.layout.is-embedded .timeline-wrap {
    padding-top: 18rpx;
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
    background: rgba(255, 255, 255, 0.16);
    border: 1rpx solid rgba(255, 255, 255, 0.22);
    transition: all 0.2s ease;

    &:active {
        background: rgba(255, 255, 255, 0.28);
        transform: scale(0.92);
    }

    .theme-light & {
        background: #ffffff;
        border: 1rpx solid rgba(17, 24, 39, 0.08);
        box-shadow: 0 4rpx 14rpx rgba(15, 23, 42, 0.06);
        backdrop-filter: none;

        &:active {
            background: #f1f5f9;
        }
    }
}

.topbar__brand {
    font-size: 28rpx;
    font-weight: 800;
    letter-spacing: 8rpx;
    color: #ffffff;
    padding-left: 8rpx;

    .theme-light & {
        color: var(--text-primary);
    }
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

    .theme-light & {
        color: var(--text-primary);
        text-shadow: none;
    }
}

.hero__desc {
    margin-top: 18rpx;
    width: 100%;
    font-size: 28rpx;
    line-height: 1.9;
    color: rgba(214, 223, 239, 0.9);
    padding: 0 8rpx;

    .theme-light & {
        color: var(--text-secondary);
    }
}

.empty {
    min-height: 360rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 32rpx;
    background: rgba(18, 28, 41, 0.72);
    border: 1rpx solid rgba(255, 255, 255, 0.05);

    .theme-light & {
        background: rgba(241, 245, 249, 0.8);
        border: 1rpx solid rgba(0, 0, 0, 0.06);
    }
}

.empty__title {
    font-size: 26rpx;
    color: rgba(226, 232, 240, 0.9);

    .theme-light & {
        color: var(--text-secondary);
    }
}

.month-section {
    margin-bottom: 60rpx;
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

    .theme-light & {
        color: rgba(148, 163, 184, 0.2);
    }
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

    .theme-light & {
        color: var(--text-primary);
    }
}

.month-section__line {
    flex: 1;
    height: 1rpx;
    background: rgba(115, 130, 154, 0.34);

    .theme-light & {
        background: rgba(0, 0, 0, 0.08);
    }
}

.month-section__tag {
    font-size: 20rpx;
    font-weight: 800;
    letter-spacing: 3rpx;
    color: #619aef;
    text-transform: uppercase;
}

.day-section {
    margin-bottom: 40rpx;
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

    .theme-light & {
        color: var(--text-primary);
    }
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

    .theme-light & {
        color: var(--text-tertiary);
    }
}

.editorial-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20rpx;
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

    .theme-light & {
        background: #ffffff;
        box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
    }
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

    .theme-light & {
        background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 60%, rgba(0, 0, 0, 0.6) 100%);
    }
}

.timeline-card__lock {
    position: absolute;
    top: 20rpx;
    right: 20rpx;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(4px);
    border-radius: 50%;
    padding: 8rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;
}

.last-viewed-divider {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20rpx;
    margin: 40rpx 0;

    &__line {
        flex: 1;
        height: 1px;
        background: rgba(115, 130, 154, 0.34);

        .theme-light & {
            background: rgba(0, 0, 0, 0.08);
        }
    }

    &__text {
        font-size: 24rpx;
        color: rgba(226, 232, 240, 0.88);
        font-weight: 500;
        letter-spacing: 2rpx;

        .theme-light & {
            color: var(--text-tertiary);
        }
    }
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

.timeline-card__footer-left {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 12rpx;
    min-width: 0;
    flex: 1;
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



// ── 骨架屏 ──
@mixin shimmer {
    background: linear-gradient(90deg,
            rgba(255, 255, 255, 0.06) 25%,
            rgba(255, 255, 255, 0.12) 50%,
            rgba(255, 255, 255, 0.06) 75%);
    background-size: 200% 100%;
    animation: timeline-shimmer 1.6s infinite linear;

    .theme-light & {
        background: linear-gradient(90deg,
                rgba(0, 0, 0, 0.06) 25%,
                rgba(0, 0, 0, 0.1) 50%,
                rgba(0, 0, 0, 0.06) 75%);
        background-size: 200% 100%;
        animation: timeline-shimmer 1.6s infinite linear;
    }
}

.skeleton-wrap {
    padding: 0;
}

.skeleton-month-head {
    margin-bottom: 28rpx;
}

.skeleton-month-ghost {
    width: 40%;
    height: 86rpx;
    border-radius: 12rpx;
    @include shimmer;
}

.skeleton-month-meta {
    margin-top: -22rpx;
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.skeleton-month-year {
    width: 100rpx;
    height: 38rpx;
    border-radius: 10rpx;
    @include shimmer;
}

.skeleton-month-line {
    flex: 1;
    height: 1rpx;
    background: rgba(115, 130, 154, 0.2);
}

.skeleton-month-tag {
    width: 120rpx;
    height: 20rpx;
    border-radius: 6rpx;
    @include shimmer;
}

.skeleton-day-marker {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 20rpx;
}

.skeleton-day-number {
    width: 72rpx;
    height: 54rpx;
    border-radius: 12rpx;
    @include shimmer;
}

.skeleton-day-divider {
    width: 4rpx;
    height: 52rpx;
    border-radius: 999rpx;
    background: rgba(121, 168, 255, 0.15);
}

.skeleton-day-label {
    width: 100rpx;
    height: 20rpx;
    border-radius: 6rpx;
    @include shimmer;
}

.skeleton-grid {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
}

.skeleton-grid-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20rpx;
}

.skeleton-card {
    border-radius: 28rpx;
    @include shimmer;

    &--wide {
        width: 100%;
        aspect-ratio: 16 / 10;
    }

    &--small {
        height: 620rpx;
    }
}

@keyframes timeline-shimmer {
    0% {
        background-position: 200% 0;
    }

    100% {
        background-position: -200% 0;
    }
}
</style>
