<template>
    <view class="tabbed-container" :class="isDark ? 'theme-dark' : 'theme-light'">
        <!-- 标签栏 (支持吸顶逻辑) -->
        <view
            v-if="
                showHeader &&
                (!hideHeaderIfEmpty || tabStates[currentIndex]?.images.length > 0 || tabStates[currentIndex]?.isLoading)
            "
            class="header-bar"
            :style="{
                transform: `translateY(${Math.max(stickyTop, headerHeight - headerScrollTop)}px)`,
                position: 'absolute',
                top: 0,
                zIndex: 100,
            }"
        >
            <scroll-view
                v-if="tabs.length > 1"
                scroll-x
                class="tabs-scroll"
                :scroll-into-view="'tab-' + (currentIndex > 1 ? currentIndex - 1 : 0)"
                scroll-with-animation
            >
                <view class="tabs-list">
                    <view v-for="(tab, index) in tabs" :key="index" :id="'tab-' + index" class="tab-btn-wrapper">
                        <button size="mini" plain :class="{ active: currentIndex === index }" @click="handleTabClick(index)">
                            {{ tab.label }}
                            <!-- 日期排序图标 (仅在激活且是日期标签时显示) -->
                            <view class="sort-icon" v-if="tab.isDate && currentIndex === index">
                                <uni-icons
                                    :type="dateSortAsc ? 'arrow-up' : 'arrow-down'"
                                    size="12"
                                    :color="isDark ? '#ffffff' : '#ffffff'"
                                ></uni-icons>
                            </view>
                        </button>
                    </view>
                </view>
            </scroll-view>

            <!-- 3. 工具栏 (复位列数/视图切换) -->
            <view class="tool-actions" :class="{ 'is-single': tabs.length <= 1 }">
                <view class="action-btn" @click="onChangeView">
                    <image
                        class="icon-svg"
                        v-if="settingsStore.options.view === 'window'"
                        src="@/static/icons/view-grid.svg"
                        mode="aspectFit"
                    ></image>
                    <image class="icon-svg" v-else src="@/static/icons/view-dashboard.svg" mode="aspectFit"></image>
                </view>
            </view>
        </view>

        <!-- 3. 内容容器 Swiper -->
        <swiper class="content-swiper" :current="currentIndex" @change="onSwiperChange" duration="300">
            <swiper-item v-for="(tab, index) in tabs" :key="index">
                <scroll-view
                    scroll-y
                    class="tab-scroll-view"
                    :scroll-top="tabStates[index].scrollTop"
                    scroll-with-animation
                    @scroll="onScroll($event, index)"
                    @scrolltolower="onReachLower(index)"
                >
                    <view class="container" :style="{ minHeight: `calc(100% + ${headerHeight}px)` }">
                        <!-- 顶部占位，留给可滚动头部 -->
                        <view :style="{ height: topSpacerHeight + 'px' }"></view>

                        <!-- 首次加载骨架屏：仅在 images 为空且正在加载时显示 -->
                        <template v-if="tabStates[index]?.isLoading && tabStates[index]?.images.length === 0">
                            <!-- 瀑布流骨架：两列，高度错落，每列4张共8张 -->
                            <view v-if="isWaterfall" class="sk-waterfall">
                                <view class="sk-col">
                                    <view class="sk-card sk-card--tall"></view>
                                    <view class="sk-card sk-card--short"></view>
                                    <view class="sk-card sk-card--medium"></view>
                                    <view class="sk-card sk-card--tall"></view>
                                </view>
                                <view class="sk-col">
                                    <view class="sk-card sk-card--short"></view>
                                    <view class="sk-card sk-card--tall"></view>
                                    <view class="sk-card sk-card--medium"></view>
                                    <view class="sk-card sk-card--short"></view>
                                </view>
                            </view>
                            <!-- 网格骨架：2列，等高，共8张 -->
                            <view v-else class="sk-grid">
                                <view v-for="i in 8" :key="i" class="sk-card sk-card--grid"></view>
                            </view>
                        </template>
                        <!-- 布局渲染层 -->
                        <view class="layout" :style="getLayoutStyle(index)">
                            <template v-for="(item, idx) in tabStates[index]?.images" :key="item.id">
                                <view
                                    class="box"
                                    :class="{ 'loaded-glow': item.loaded }"
                                    :style="[getBoxStyle(index), isWaterfall ? item.position : '']"
                                    @click="openPreview(item.id, index)"
                                >
                                    <image
                                        :class="['img', { loaded: item.loaded }]"
                                        :style="getImgStyle()"
                                        :src="item.smallPicurl"
                                        :mode="item.imageMode || imageMode"
                                        lazy-load
                                    ></image>
                                    <view class="card-overlay" :class="{ 'always-visible': showCardMeta }"></view>
                                    <view :class="['lock', { loaded: item.loaded }]" :style="getLockStyle()">
                                        <uni-icons
                                            v-if="item.is_locked && item.loaded"
                                            type="locked-filled"
                                            :size="lockedSize"
                                            color="#F9E9B5"
                                        ></uni-icons>
                                    </view>
                                    <view class="card-info" :class="{ 'always-visible': showCardMeta }">
                                        <view class="card-info__title">
                                            {{ getLocalizedItem(item).description || getLocalizedItem(item).classify_name || ('壁纸 #' + item.id) }}
                                        </view>
                                        <view class="card-info__footer">
                                            <view class="card-info__classify">
                                                {{ getLocalizedItem(item).classify_name || '壁纸' }}
                                            </view>
                                            <view class="card-info__score">
                                                <mdi-icon path="/static/icons/star.svg" size="14px" color="#ffbf66"></mdi-icon>
                                                <text>{{ item.score ?? '--' }}</text>
                                            </view>
                                        </view>
                                    </view>
                                </view>

                                <!-- 广告注入 -->
                                <view
                                    v-if="(idx + 1) % 12 === 0 && canShowAd"
                                    class="ad-row"
                                    :class="{ 'ad-row--ready': tabStates[index].adLoadMap[`slot-${idx}`] }"
                                >
                                    <custom-ad-banner
                                        @load="onAdLoad(index, `slot-${idx}`)"
                                        @error="onAdError(index, `slot-${idx}`)"
                                    ></custom-ad-banner>
                                </view>
                            </template>
                        </view>

                        <!-- 加载状态 -->
                        <view class="status-wrap" v-if="tabStates[index]?.images.length > 0">
                            <uni-load-more
                                :status="
                                    tabStates[index].noMoreData ? 'noMore' : tabStates[index].isLoading ? 'loading' : 'more'
                                "
                            ></uni-load-more>
                        </view>

                        <!-- 空状态 -->
                        <view class="empty-wrap" v-if="!tabStates[index]?.isLoading && tabStates[index]?.images.length === 0">
                            <slot name="empty" :index="index">
                                <view class="default-empty">
                                    <image
                                        src="/static/images/pics/empty.png"
                                        mode="aspectFit"
                                        class="default-empty__img"
                                    ></image>
                                    <text class="default-empty__text">暂无相关内容</text>
                                </view>
                            </slot>
                        </view>

                        <view class="safe-area-bottom" :style="{ height: `${bottomSafeSpace}rpx` }"></view>
                    </view>
                </scroll-view>
            </swiper-item>
        </swiper>

        <!-- 4. 返回顶部按钮 -->
        <view class="back-top" :class="{ show: tabStates[currentIndex]?.showBackTop }" @click="handleBackTop">
            <uni-icons type="arrow-up" size="24" color="#fff"></uni-icons>
        </view>
    </view>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiGetClassList, apiGetSearchData, apiGetActions, apiPostRecommend } from '@/api/wallpaper.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserStore } from '@/stores/user.js';
import { useAppStore } from '@/stores/app.js';
import { handlePicUrl } from '@/utils/common.js';

const { t, locale } = useI18n();
const settingsStore = useSettingsStore();
const userStore = useUserStore();
const isDark = computed(() => settingsStore.isDark);
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
    tabs: { type: Array, required: true },
    initialIndex: { type: Number, default: 0 },
    showHeader: { type: Boolean, default: true },
    apiType: { type: String, default: 'classList' },
    hideHeaderIfEmpty: { type: Boolean, default: false },
    headerHeight: { type: Number, default: 0 },
    tabsHeight: { type: Number, default: 44 },
    stickyTop: { type: Number, default: 0 },
    layoutMode: { type: String, default: '' },
    showCardMeta: { type: Boolean, default: false },
    bottomSafeSpace: { type: Number, default: 60 },
});

const emit = defineEmits(['update', 'change', 'scroll']);

const currentIndex = ref(props.initialIndex);
const headerScrollTop = ref(0);
const dateSortAsc = ref(true);
const canShowAd = computed(() => !userStore.isVip && userStore.showAd);
const isWaterfall = computed(() =>
    props.layoutMode ? props.layoutMode === 'waterfall' : settingsStore.options.view !== 'window',
);
const imageMode = computed(() => (isWaterfall.value ? 'widthFix' : 'aspectFill'));
const lockedSize = computed(() => (settingsStore.options.column === 3 ? 18 : 22));

/** 顶部占位：有 header 时为 hero+tabs；无 header 时仅用 headerHeight（如首页顶栏 inset） */
const topSpacerHeight = computed(() => {
    if (props.showHeader) {
        return props.headerHeight + props.tabsHeight;
    }
    return props.headerHeight || 0;
});

const tabStates = reactive(
    props.tabs.map(() => ({
        images: [],
        pageNum: 1,
        isLoading: false,
        noMoreData: false,
        scrollTop: 0,
        oldScrollTop: 0,
        showBackTop: false,
        adErrorMap: {},
        adLoadMap: {},
        waterfall: { height: 0, columnHeights: [] },
    })),
);

const fetchData = async (index, init = false) => {
    const state = tabStates[index];
    if (!state || state.isLoading || (state.noMoreData && !init)) return;

    if (init) {
        state.pageNum = 1;
        state.noMoreData = false;
        state.images = [];
        state.waterfall.height = 0;
        state.waterfall.columnHeights = [];
    }

    try {
        state.isLoading = true;
        if (props.apiType === 'local') {
            const localData = props.tabs[index].data || [];
            const newData = localData.map((item) => ({
                ...item,
                loaded: false,
                position: {},
            }));
            state.images = newData;
            state.noMoreData = true;
            await processImages(index, newData);
            return;
        }

        const requestParams = {
            ...props.tabs[index].query,
            pageNum: state.pageNum,
            pageSize: 12,
        };

        if (props.tabs[index].isDate) {
            requestParams.sortord = dateSortAsc.value ? 'date_asc' : 'date_desc';
        }

        let res;
        if (props.apiType === 'search') {
            if (!requestParams.keyword) {
                state.isLoading = false;
                return;
            }
            res = await apiGetSearchData(requestParams);
        } else if (props.apiType === 'actions') {
            res = await apiGetActions(requestParams);
        } else if (props.apiType === 'recommend') {
            // exclude_ids 放 body（POST），避免 URL 超长限制
            if (state.images.length > 0) {
                requestParams.exclude_ids = state.images.map((img) => img.id);
            }
            res = await apiPostRecommend(requestParams);
        } else {
            if (props.apiType === 'classList' && requestParams.classify_id !== undefined && isNaN(requestParams.classify_id)) {
                state.isLoading = false;
                return;
            }
            res = await apiGetClassList(requestParams);
        }
        const newData = (res.data || []).map((item) => ({
            ...handlePicUrl(item),
            loaded: false,
            position: {},
        }));

        if (init) state.images = newData;
        else state.images.push(...newData);

        await processImages(index, newData);

        if (index === currentIndex.value) {
            emit('update', { images: state.images, index });
        }

        if (state.pageNum >= (res.pagination?.total_pages || 1)) {
            state.noMoreData = true;
        }
    } catch (e) {
        console.error('Fetch Error:', e);
    } finally {
        state.isLoading = false;
    }
};

const handleTabClick = (index) => {
    if (currentIndex.value === index) {
        if (props.tabs[index].isDate) {
            dateSortAsc.value = !dateSortAsc.value;
            fetchData(index, true);
        }
    } else {
        currentIndex.value = index;
    }
};

const onSwiperChange = (e) => {
    currentIndex.value = e.detail.current;
    emit('change', currentIndex.value);
    emit('update', { images: tabStates[currentIndex.value].images, index: currentIndex.value });
};

const processImages = async (index, list) => {
    const state = tabStates[index];
    const { screenWidth } = uni.getSystemInfoSync();
    const colCount = settingsStore.options.column;
    const gap = colCount === 3 ? 12 : 12;
    const colWidth = (screenWidth - (colCount + 1) * gap) / colCount;

    if (state.waterfall.columnHeights.length !== colCount) {
        state.waterfall.columnHeights = new Array(colCount).fill(0);
    }

    await Promise.all(list.map(async (item) => {
        if (!item.width || !item.height) {
            try {
                const info = await getImageInfo(item.smallPicurl);
                item.width = info.width || 300;
                item.height = info.height || 600;
            } catch (e) {
                item.width = 300;
                item.height = 600;
                item._fetchError = true;
            }
        }
    }));

    for (const item of list) {
        let w = item.width;
        let h = item.height;
        let mode = isWaterfall.value ? 'widthFix' : 'aspectFill';
        if (item._fetchError && isWaterfall.value) mode = 'aspectFill';

        item.width = w;
        item.height = h;
        item.imageMode = mode;
        item.loaded = true;

        if (isWaterfall.value) {
            const scaledH = (h * colWidth) / w;
            const minH = Math.min(...state.waterfall.columnHeights);
            const colIdx = state.waterfall.columnHeights.indexOf(minH);

            item.position = {
                width: `${colWidth}px`,
                height: `${scaledH}px`,
                left: `${colIdx * (colWidth + gap) + gap}px`,
                top: `${state.waterfall.columnHeights[colIdx] + gap}px`,
            };
            state.waterfall.columnHeights[colIdx] += scaledH + gap;
            state.waterfall.height = Math.max(...state.waterfall.columnHeights);
        }
    }
};

const getLayoutStyle = (index) => {
    const colCount = settingsStore.options.column;
    const gap = colCount === 3 ? 12 : 12;
    if (!isWaterfall.value)
        return { display: 'grid', gridTemplateColumns: `repeat(${colCount}, 1fr)`, gap: `${gap}px`, padding: `${gap}px` };
    return { position: 'relative', height: `${tabStates[index]?.waterfall.height || 0}px`, padding: `${gap}px` };
};

const getBoxStyle = (index) => {
    const colCount = settingsStore.options.column;
    const style = {
        borderRadius: colCount === 3 ? '24rpx' : '42rpx',
        transition: 'all 0.4s ease',
        position: isWaterfall.value ? 'absolute' : 'relative',
    };
    if (!isWaterfall.value) style.height = colCount === 3 ? '480rpx' : '560rpx';
    return style;
};

const getImgStyle = () => ({ borderRadius: settingsStore.options.column === 3 ? '24rpx' : '42rpx' });
const getLockStyle = () => ({
    top: settingsStore.options.column === 3 ? '8rpx' : '14rpx',
    right: settingsStore.options.column === 3 ? '8rpx' : '14rpx',
});

const getImageInfo = (src) => new Promise((resolve, reject) => uni.getImageInfo({ src, success: resolve, fail: reject }));
const onReachLower = (index) => {
    const state = tabStates[index];
    if (!state.noMoreData && !state.isLoading) {
        state.pageNum++;
        fetchData(index);
    }
};
const onScroll = (e, index) => {
    const state = tabStates[index];
    const scrollTop = e.detail.scrollTop;
    state.oldScrollTop = scrollTop;
    state.showBackTop = scrollTop > 400;

    if (index === currentIndex.value) {
        headerScrollTop.value = Math.min(scrollTop, props.headerHeight);
    }

    emit('scroll', { scrollTop, index });
};
const handleBackTop = () => {
    const state = tabStates[currentIndex.value];
    state.scrollTop = state.oldScrollTop;
    nextTick(() => {
        state.scrollTop = 0;
    });
};

const onChangeView = () => (settingsStore.options.view = settingsStore.options.view === 'window' ? 'waterfall' : 'window');
const onAdLoad = (index, slotKey) => {
    tabStates[index].adLoadMap[slotKey] = true;
};
const onAdError = (index, slotKey) => {
    tabStates[index].adLoadMap[slotKey] = false;
    tabStates[index].adErrorMap[slotKey] = true;
};
const openPreview = (id, index) => {
    const appStore = useAppStore();
    appStore.wallList = tabStates[index].images;
    uni.navigateTo({ url: `/pages/app/preview?id=${id}` });
};

const recalculateLayout = async (index) => {
    const state = tabStates[index];
    if (!state || state.images.length === 0) return;
    state.waterfall.height = 0;
    state.waterfall.columnHeights = [];
    await processImages(index, state.images);
};

watch(
    () => currentIndex.value,
    (newIdx) => {
        // Synchronize headerScrollTop immediately to prevent blank gap after switching tabs
        const currentScroll = tabStates[newIdx]?.oldScrollTop || 0;

        if (headerScrollTop.value >= props.headerHeight && currentScroll < props.headerHeight) {
            // If the hero image was already hidden, keep it hidden on the new tab
            tabStates[newIdx].scrollTop = currentScroll;
            setTimeout(() => {
                tabStates[newIdx].scrollTop = props.headerHeight;
                tabStates[newIdx].oldScrollTop = props.headerHeight;
            }, 50);
            headerScrollTop.value = props.headerHeight;
        } else {
            headerScrollTop.value = Math.min(currentScroll, props.headerHeight);
        }

        // Also emit scroll event so that the parent (classlist.vue) can update its parallax hero animation
        emit('scroll', { scrollTop: headerScrollTop.value, index: newIdx });

        if (tabStates[newIdx].images.length === 0) fetchData(newIdx, true);
        else nextTick(() => recalculateLayout(newIdx));
    },
    { immediate: true },
);

watch(
    () => props.tabs,
    (newTabs) => {
        if (newTabs.length !== tabStates.length) {
            if (newTabs.length > tabStates.length) {
                for (let i = tabStates.length; i < newTabs.length; i++) {
                    tabStates.push({
                        images: [],
                        pageNum: 1,
                        isLoading: false,
                        noMoreData: false,
                        scrollTop: 0,
                        oldScrollTop: 0,
                        showBackTop: false,
                        adErrorMap: {},
                        adLoadMap: {},
                        waterfall: { height: 0, columnHeights: [] },
                    });
                }
            } else {
                tabStates.splice(newTabs.length);
            }
        }
        if (props.apiType === 'local') {
            tabStates.forEach((_, i) => fetchData(i, true));
        }
    },
    { deep: true },
);

watch(
    () => props.tabs[currentIndex.value]?.query,
    (newQuery, oldQuery) => {
        if (!newQuery || !oldQuery) {
            if (newQuery !== oldQuery) fetchData(currentIndex.value, true);
            return;
        }
        const keys1 = Object.keys(newQuery);
        const keys2 = Object.keys(oldQuery);
        if (keys1.length !== keys2.length || keys1.some((k) => newQuery[k] !== oldQuery[k])) {
            fetchData(currentIndex.value, true);
        }
    },
    { deep: true },
);

watch(
    () => settingsStore.options.column,
    () => tabStates.forEach((_, i) => recalculateLayout(i)),
);
watch(
    () => settingsStore.options.view,
    () => {
        if (!props.layoutMode) tabStates.forEach((_, i) => recalculateLayout(i));
    },
);

onMounted(() => {
    if (tabStates[currentIndex.value].images.length === 0) fetchData(currentIndex.value, true);
});
</script>

<style lang="scss" scoped>
.tabbed-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--page-background);
}

.content-swiper {
    flex: 1;
    height: 100%;
    background: var(--page-background);
}

.header-slot {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 10;
    pointer-events: auto;
    overflow: hidden;
    will-change: transform, opacity;
}

.header-bar {
    width: 100%;
    height: 88rpx;
    z-index: 100;
    background: var(--page-background);
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.04);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10rpx;
    will-change: transform;

    .theme-light & {
        border-bottom: 1rpx solid var(--panel-border);
    }

    .tabs-scroll {
        width: 0;
        flex: 1;
        height: 100%;
        white-space: nowrap;
        .tabs-list {
            display: flex;
            height: 100%;
            align-items: center;
            padding: 0 16rpx;
            .tab-btn-wrapper {
                margin-right: 14rpx;
                button {
                    min-height: 58rpx;
                    padding: 0 32rpx;
                    border-radius: 999rpx;
                    font-size: 26rpx;
                    font-weight: 600;
                    color: #919fac;
                    background: rgba(32, 40, 52, 0.95);
                    border: 1rpx solid rgba(255, 255, 255, 0.04);
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8rpx;
                    line-height: normal;

                    &::after {
                        border: none;
                    }

                    &.active {
                        color: #ffffff;
                        background: #2b8cee;
                        border-color: rgba(43, 140, 238, 0.2);
                        box-shadow: 0 12rpx 28rpx rgba(43, 140, 238, 0.34);
                    }

                    .theme-light & {
                        color: #64748b;
                        background: #e8ecf2;
                        border: 1rpx solid rgba(17, 24, 39, 0.06);

                        &.active {
                            color: #ffffff;
                            background: #2b8cee;
                            border-color: rgba(43, 140, 238, 0.2);
                            box-shadow: 0 12rpx 28rpx rgba(43, 140, 238, 0.2);
                        }
                    }

                    .sort-icon {
                        margin-left: 2rpx;
                        display: flex;
                        align-items: center;
                    }
                }
            }
        }
    }

    .tool-actions {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 12rpx;
        padding: 0 20rpx;
        border-left: 1rpx solid rgba(255, 255, 255, 0.08);

        &.is-single {
            border-left: none;
            width: 100%;
            justify-content: flex-end;
        }

        .theme-light & {
            border-left: 1rpx solid var(--panel-border);
        }

        .action-btn {
            width: 58rpx;
            height: 58rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(41, 52, 68, 0.98);
            border: 1rpx solid rgba(255, 255, 255, 0.05);
            border-radius: 20rpx;
            transition: all 0.2s;
            .icon-svg {
                width: 38rpx;
                height: 38rpx;
                filter: brightness(0) saturate(100%) invert(94%) sepia(10%) saturate(473%) hue-rotate(183deg) brightness(103%)
                    contrast(101%);
            }
            &:active {
                transform: scale(0.9);
                background: rgba(255, 255, 255, 0.05);
            }

            .theme-light & {
                background: #e8ecf2;
                border: 1rpx solid rgba(17, 24, 39, 0.06);

                .icon-svg {
                    filter: brightness(0) saturate(100%) invert(20%) sepia(10%) saturate(500%) hue-rotate(183deg)
                        brightness(60%) contrast(90%);
                }

                &:active {
                    background: #dde3eb;
                }
            }
        }
    }
}

.tab-scroll-view {
    height: 100%;
    width: 100%;
    background: var(--page-background);
}

.container {
    .layout {
        .box {
            background: rgba(255, 255, 255, 0.02);
            overflow: hidden;
            position: relative;

            &.loaded-glow {
                box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.3);
            }

            .theme-light & {
                background: rgba(0, 0, 0, 0.02);

                &.loaded-glow {
                    box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
                }
            }

            .img {
                width: 100%;
                height: 100%;
                opacity: 0;
                filter: blur(10rpx) saturate(0.82);
                transform: translateY(22rpx);
                transition:
                    opacity 0.55s ease,
                    filter 0.65s ease,
                    transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1);
                &.loaded {
                    opacity: 1;
                    filter: blur(0) saturate(1);
                    transform: translateY(0);
                    // Add smooth transition for hover scale
                    transition:
                        opacity 0.55s ease,
                        filter 0.65s ease,
                        transform 0.35s cubic-bezier(0.25, 1, 0.5, 1);
                }
            }

            .lock {
                position: absolute;
                opacity: 0;
                transform: scale(0.5);
                transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                z-index: 5;
                pointer-events: none;
                &.loaded {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            .card-overlay {
                position: absolute;
                inset: 0;
                background: linear-gradient(180deg, rgba(8, 11, 18, 0) 0%, rgba(8, 11, 18, 0) 50%, rgba(8, 11, 18, 0.88) 100%);
                pointer-events: none;
                z-index: 1;
                opacity: 0;
                transition: opacity 0.35s ease;

                &.always-visible {
                    opacity: 1;
                }
            }

            .card-info {
                position: absolute;
                left: 22rpx;
                right: 22rpx;
                bottom: 22rpx;
                z-index: 2;
                color: #f8fafc;
                pointer-events: none;
                opacity: 0;
                transform: translateY(15rpx);
                transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.25, 1, 0.5, 1);

                &.always-visible {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            // Interactive Hover & Click Active Styles
            &:active {
                .img.loaded {
                    transform: scale(1.06);
                }
                .card-overlay:not(.always-visible) {
                    opacity: 1;
                }
                .card-info:not(.always-visible) {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @media (hover: hover) and (pointer: fine) {
                &:hover {
                    .img.loaded {
                        transform: scale(1.06);
                    }
                    .card-overlay:not(.always-visible) {
                        opacity: 1;
                    }
                    .card-info:not(.always-visible) {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            }

            .card-info__title {
                font-size: 28rpx;
                line-height: 1.36;
                font-weight: 700;
                color: #f7fbff;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .card-info__footer {
                margin-top: 14rpx;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12rpx;
            }

            .card-info__classify {
                display: inline-flex;
                align-items: center;
                flex: 0 1 auto;
                min-width: 0;
                max-width: calc(100% - 96rpx);
                min-height: 34rpx;
                // padding: 0 12rpx;
                border-radius: 999rpx;
                // background: rgba(97, 154, 239, 0.16);
                // border: 1rpx solid rgba(97, 154, 239, 0.2);
                color: #c7dbff;
                font-size: 18rpx;
                font-weight: 700;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }

            .card-info__score {
                flex-shrink: 0;
                display: flex;
                align-items: center;
                gap: 8rpx;
                font-size: 20rpx;
                font-weight: 700;
                color: #e2e8f0;
            }
        }
    }
}
.empty-wrap {
    padding: 160rpx 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.default-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0.3;
}

.default-empty__img {
    width: 180rpx;
    height: 180rpx;
    margin-bottom: 24rpx;
}

.default-empty__text {
    font-size: 26rpx;
    color: #eef5ff;

    .theme-light & {
        color: #64748b;
    }
}
.safe-area-bottom {
    width: 100%;
}

.ad-row {
    grid-column: 1 / -1;
    min-height: 0;

    // &--ready {
    //     margin: 0 30rpx 20rpx;
    // }
}

.back-top {
    position: fixed;
    right: 40rpx;
    bottom: calc(60rpx + env(safe-area-inset-bottom));
    width: 90rpx;
    height: 90rpx;
    background: rgba(43, 140, 238, 0.85);
    backdrop-filter: blur(10rpx);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.35);
    opacity: 0;
    transform: translateY(100rpx) scale(0.5);
    transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 1000;
    border: 1rpx solid rgba(255, 255, 255, 0.1);

    &.show {
        opacity: 1;
        transform: translateY(0) scale(1);
    }

    &:active {
        transform: scale(0.9);
        background: rgba(43, 140, 238, 1);
    }

    .theme-light & {
        background: rgba(43, 140, 238, 0.9);
        border: 1rpx solid rgba(43, 140, 238, 0.2);
        box-shadow: 0 12rpx 32rpx rgba(43, 140, 238, 0.2);

        &:active {
            background: rgba(43, 140, 238, 1);
        }
    }
}

// ── 首次加载骨架屏 ──
@keyframes sk-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

%sk-card-base {
    border-radius: 24rpx;
    background: linear-gradient(
        90deg,
        rgba(148, 163, 184, 0.10) 25%,
        rgba(148, 163, 184, 0.20) 50%,
        rgba(148, 163, 184, 0.10) 75%
    );
    background-size: 200% 100%;
    animation: sk-shimmer 1.6s infinite linear;
}

// 瀑布流骨架
.sk-waterfall {
    display: flex;
    gap: 12px;
    padding: 12px;
    width: 100%;
    box-sizing: border-box;
}

.sk-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

// 网格骨架
.sk-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 12px;
    width: 100%;
    box-sizing: border-box;
}

.sk-card {
    @extend %sk-card-base;
    width: 100%;

    // 瀑布流卡片高度
    &--tall   { height: 620rpx; }
    &--medium { height: 540rpx; }
    &--short  { height: 480rpx; }

    // 网格卡片高度（等高）
    &--grid   { height: 540rpx; }
}
</style>


