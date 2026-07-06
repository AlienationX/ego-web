<template>
    <scroll-view
        scroll-y
        class="rt-scroll"
        :scroll-top="scrollTop"
        scroll-with-animation
        @scroll="onScroll"
        @scrolltolower="onReachLower"
    >
        <view class="rt-container" :style="{ paddingTop: headerHeight + 'px' }">
            <!-- 骨架屏 -->
            <view v-if="isLoading && images.length === 0" class="rt-skeleton">
                <view class="rt-sk-col">
                    <view class="rt-sk-card rt-sk-card--tall"></view>
                    <view class="rt-sk-card rt-sk-card--short"></view>
                    <view class="rt-sk-card rt-sk-card--medium"></view>
                    <view class="rt-sk-card rt-sk-card--tall"></view>
                </view>
                <view class="rt-sk-col">
                    <view class="rt-sk-card rt-sk-card--short"></view>
                    <view class="rt-sk-card rt-sk-card--tall"></view>
                    <view class="rt-sk-card rt-sk-card--medium"></view>
                    <view class="rt-sk-card rt-sk-card--short"></view>
                </view>
            </view>

            <!-- 瀑布流 -->
            <view class="rt-layout" :style="{ position: 'relative', height: waterfallHeight + 'px', padding: gap + 'px' }">
                <view
                    v-for="item in images"
                    :key="item.id"
                    class="rt-box"
                    :class="{ 'rt-box--loaded': item.loaded }"
                    :style="item.position"
                    @click="openPreview(item.id)"
                >
                    <image
                        class="rt-img"
                        :class="{ 'rt-img--loaded': item.loaded }"
                        :src="item.smallPicurl"
                        mode="widthFix"
                        lazy-load
                    ></image>
                    <view class="rt-overlay"></view>
                    <view class="rt-lock" :class="{ 'rt-lock--visible': item.is_locked && item.loaded }">
                        <uni-icons
                            v-if="item.is_locked && item.loaded"
                            type="locked-filled"
                            :size="20"
                            color="#F9E9B5"
                        ></uni-icons>
                    </view>
                    <view class="rt-info">
                        <view class="rt-info__title">
                            {{ item.description || item.classify_name || '壁纸 #' + item.id }}
                        </view>
                        <view class="rt-info__footer">
                            <view class="rt-info__classify">{{ item.classify_name || '壁纸' }}</view>
                            <view class="rt-info__score">
                                <mdi-icon path="/static/icons/star.svg" size="14px" color="#ffbf66"></mdi-icon>
                                <text>{{ item.score ?? '--' }}</text>
                            </view>
                        </view>
                    </view>
                </view>
            </view>

            <!-- 加载更多 -->
            <view v-if="images.length > 0" class="rt-status">
                <uni-load-more :status="noMore ? 'noMore' : isLoading ? 'loading' : 'more'"></uni-load-more>
            </view>

            <!-- 空状态 -->
            <view v-if="!isLoading && images.length === 0" class="rt-empty">
                <image src="/static/images/photos_empty.svg" mode="aspectFit" class="rt-empty__img"></image>
                <text class="rt-empty__text">暂无推荐内容</text>
            </view>

            <view class="rt-safe-bottom"></view>
        </view>
    </scroll-view>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiPostRecommend } from '@/api/wallpaper.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useAppStore } from '@/stores/app.js';
import { handlePicUrl } from '@/utils/common.js';

const { locale } = useI18n();
const settingsStore = useSettingsStore();

const props = defineProps({
    headerHeight: {
        type: Number,
        default: 0,
    },
});

const emit = defineEmits(['scroll']);

const isDark = computed(() => settingsStore.isDark);

// ── 瀑布流参数 ──
const colCount = 2;
const gap = 12;
const { screenWidth } = uni.getSystemInfoSync();
const colWidth = (screenWidth - (colCount + 1) * gap) / colCount;

// ── 数据状态 ──
const images = ref([]);
const pageNum = ref(1);
const isLoading = ref(false);
const noMore = ref(false);
const waterfallHeight = ref(0);
const scrollTop = ref(0);
const oldScrollTop = ref(0);
const showBackTop = ref(false);

const columnHeights = ref([]);

const resetColumns = () => {
    columnHeights.value = new Array(colCount).fill(0);
    waterfallHeight.value = 0;
};

// ── 瀑布流位置计算 ──
const calcPositions = (list) => {
    for (const item of list) {
        const w = item.width || 300;
        const h = item.height || 600;
        const scaledH = (h * colWidth) / w;

        // 找最短列
        const minH = Math.min(...columnHeights.value);
        const colIdx = columnHeights.value.indexOf(minH);

        item.position = {
            position: 'absolute',
            width: `${colWidth}px`,
            height: `${scaledH}px`,
            left: `${colIdx * (colWidth + gap) + gap}px`,
            top: `${columnHeights.value[colIdx] + gap}px`,
            borderRadius: '42rpx',
            transition: 'all 0.4s ease',
        };

        columnHeights.value[colIdx] += scaledH + gap;
        waterfallHeight.value = Math.max(...columnHeights.value);
        item.loaded = true;
    }
};

// ── 数据请求 ──
const fetchData = async (init = false) => {
    if (isLoading.value || (noMore.value && !init)) return;

    if (init) {
        pageNum.value = 1;
        noMore.value = false;
        images.value = [];
        resetColumns();
    }

    try {
        isLoading.value = true;

        const params = {
            ordering: '-updated_at',
            pageNum: pageNum.value,
            pageSize: 12,
        };

        if (images.value.length > 0) {
            params.exclude_ids = images.value.map((img) => img.id);
        }

        const res = await apiPostRecommend(params);
        const newData = (res.data || []).map((item) => ({
            ...handlePicUrl(item),
            loaded: false,
            position: {},
        }));

        if (init) images.value = newData;
        else images.value.push(...newData);

        calcPositions(newData);

        if (pageNum.value >= (res.pagination?.total_pages || 1)) {
            noMore.value = true;
        }
    } catch (e) {
        console.error('推荐加载失败:', e);
    } finally {
        isLoading.value = false;
    }
};

// ── 滚动 ──
const onScroll = (e) => {
    const st = e.detail.scrollTop;
    oldScrollTop.value = st;
    showBackTop.value = st > 400;
    emit('scroll', {
        scrollTop: st,
    });
};

const onReachLower = () => {
    if (!noMore.value && !isLoading.value) {
        pageNum.value++;
        fetchData();
    }
};

// ── 预览 ──
const openPreview = (id) => {
    const appStore = useAppStore();
    appStore.wallList = images.value;
    uni.navigateTo({
        url: `/pages/app/preview?id=${id}`,
    });
};

// ── 初始化 ──
onMounted(() => {
    fetchData(true);
});
</script>

<style lang="scss" scoped>
.rt-scroll {
    height: 100%;
    width: 100%;
    background: var(--page-background);
}

.rt-container {
    box-sizing: border-box;
}

// ── 骨架屏 ──
.rt-skeleton {
    display: flex;
    gap: 12px;
    padding: 12px;
    width: 100%;
    box-sizing: border-box;
}

.rt-sk-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

%rt-sk-base {
    border-radius: 24rpx;
    background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.04) 0%,
        rgba(255, 255, 255, 0.1) 50%,
        rgba(255, 255, 255, 0.04) 100%
    );
    background-size: 200% 100%;
    animation: rt-shimmer 1.5s ease-in-out infinite;
    width: 100%;
}

@keyframes rt-shimmer {
    0% {
        background-position: 200% 0;
    }

    100% {
        background-position: -200% 0;
    }
}

.rt-sk-card {
    @extend %rt-sk-base;

    &--tall {
        height: 360rpx;
    }

    &--short {
        height: 240rpx;
    }

    &--medium {
        height: 300rpx;
    }

    .theme-light & {
        background: linear-gradient(90deg, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.08) 50%, rgba(0, 0, 0, 0.04) 100%);
        background-size: 200% 100%;
    }
}

// ── 瀑布流盒子 ──
.rt-box {
    background: rgba(255, 255, 255, 0.02);
    overflow: hidden;
    cursor: pointer;

    &--loaded {
        box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.3);
    }

    &:active .rt-img--loaded {
        transform: scale(1.06);
    }

    &:active .rt-overlay,
    &:active .rt-info {
        opacity: 1;
    }

    @media (hover: hover) and (pointer: fine) {
        &:hover .rt-img--loaded {
            transform: scale(1.06);
        }

        &:hover .rt-overlay,
        &:hover .rt-info {
            opacity: 1;
        }
    }

    .theme-light & {
        background: rgba(0, 0, 0, 0.02);

        &--loaded {
            box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
        }
    }
}

.rt-img {
    width: 100%;
    display: block;
    opacity: 0;
    filter: blur(10rpx) saturate(0.82);
    transform: translateY(22rpx);
    transition:
        opacity 0.55s ease,
        filter 0.65s ease,
        transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1);

    &--loaded {
        opacity: 1;
        filter: blur(0) saturate(1);
        transform: translateY(0);
        transition:
            opacity 0.55s ease,
            filter 0.65s ease,
            transform 0.35s cubic-bezier(0.25, 1, 0.5, 1);
    }
}

// ── 覆盖层 & 信息 ──
.rt-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(8, 11, 18, 0) 0%, rgba(8, 11, 18, 0) 50%, rgba(8, 11, 18, 0.88) 100%);
    pointer-events: none;
    z-index: 1;
    opacity: 1;
}

.rt-lock {
    position: absolute;
    top: 14rpx;
    right: 14rpx;
    opacity: 0;
    transform: scale(0.5);
    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 5;
    pointer-events: none;

    &--visible {
        opacity: 1;
        transform: scale(1);
    }
}

.rt-info {
    position: absolute;
    left: 22rpx;
    right: 22rpx;
    bottom: 22rpx;
    z-index: 2;
    color: #f8fafc;
    pointer-events: none;
    opacity: 1;
    transform: translateY(0);
}

.rt-info__title {
    font-size: 28rpx;
    line-height: 1.36;
    font-weight: 700;
    color: #f7fbff;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.rt-info__footer {
    margin-top: 14rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12rpx;
}

.rt-info__classify {
    display: inline-flex;
    align-items: center;
    flex: 0 1 auto;
    min-width: 0;
    max-width: calc(100% - 96rpx);
    min-height: 34rpx;
    border-radius: 999rpx;
    color: #c7dbff;
    font-size: 18rpx;
    font-weight: 700;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.rt-info__score {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 20rpx;
    font-weight: 700;
    color: #e2e8f0;
}

// ── 状态 ──
.rt-status {
    padding: 20rpx 0;
}

.rt-empty {
    padding: 160rpx 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.rt-empty__img {
    width: 200rpx;
    height: 200rpx;
    opacity: 0.6;
}

.rt-empty__text {
    margin-top: 24rpx;
    font-size: 26rpx;
    color: #eef5ff;

    .theme-light & {
        color: #64748b;
    }
}

.rt-safe-bottom {
    height: 60rpx;
}
</style>
