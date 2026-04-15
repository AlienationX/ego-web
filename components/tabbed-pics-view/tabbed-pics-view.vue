<template>
    <view class="tabbed-container">
        <!-- 1. 顶部导航栏 (复刻经典 3 按钮布局 + 日期切换) -->
        <view class="header-bar">
            <scroll-view scroll-x class="tabs-scroll" :scroll-into-view="'tab-' + (currentIndex > 1 ? currentIndex - 1 : 0)" scroll-with-animation>
                <view class="tabs-list">
                    <view 
                        v-for="(tab, index) in tabs" 
                        :key="index" 
                        :id="'tab-' + index"
                        class="tab-btn-wrapper"
                    >
                        <button 
                            size="mini" 
                            plain 
                            :class="{ active: currentIndex === index }" 
                            @click="handleTabClick(index)"
                        >
                            {{ tab.label }}
                            <!-- 日期排序图标 (仅在激活且是日期标签时显示) -->
                            <view class="sort-icon" v-if="tab.isDate && currentIndex === index">
                                <uni-icons 
                                    :type="dateSortAsc ? 'arrow-up' : 'arrow-down'" 
                                    size="12" 
                                    color="#ffffff"
                                ></uni-icons>
                            </view>
                        </button>
                    </view>
                </view>
            </scroll-view>

            <!-- 2. 工具栏 (复位列数/视图切换) -->
            <view class="tool-actions">
                <view class="action-btn" @click="onChangeColumn">
                    <image class="icon-svg" v-if="settingsStore.options.column === 3" src="@/static/icons/numeric-3-box.svg" mode="aspectFit"></image>
                    <image class="icon-svg" v-else src="@/static/icons/numeric-2-box.svg" mode="aspectFit"></image>
                </view>
                <view class="action-btn" @click="onChangeView">
                    <image class="icon-svg" v-if="settingsStore.options.view === 'window'" src="@/static/icons/view-grid.svg" mode="aspectFit"></image>
                    <image class="icon-svg" v-else src="@/static/icons/view-dashboard.svg" mode="aspectFit"></image>
                </view>
            </view>
        </view>

        <!-- 3. 内容容器 Swiper -->
        <swiper 
            class="content-swiper" 
            :current="currentIndex" 
            @change="onSwiperChange"
            duration="300"
        >
            <swiper-item v-for="(tab, index) in tabs" :key="index">
                <scroll-view
                    scroll-y
                    class="tab-scroll-view"
                    @scrolltolower="onReachLower(index)"
                    :refresher-enabled="true"
                    :refresher-triggered="tabStates[index]?.isRefreshing"
                    @refresherrefresh="onRefresh(index)"
                >
                    <view class="container">
                        <!-- 布局渲染层 -->
                        <view class="layout" :style="getLayoutStyle(index)">
                            <template v-for="(item, idx) in tabStates[index]?.images" :key="item.id">
                                <view
                                    class="box"
                                    :style="[getBoxStyle(index), isWaterfall ? item.position : '']"
                                    @click="openPreview(item.id, index)"
                                >
                                    <image
                                        :class="['img', { loaded: item.loaded, shadow: item.loaded }]"
                                        :style="getImgStyle()"
                                        :src="item.smallPicurl"
                                        :mode="item.imageMode || imageMode"
                                        lazy-load
                                    ></image>
                                    <view :class="['lock', { loaded: item.loaded }]" :style="getLockStyle()">
                                        <uni-icons
                                            v-if="item.is_locked && item.loaded"
                                            type="locked-filled"
                                            :size="lockedSize"
                                            color="#F9E9B5"
                                        ></uni-icons>
                                    </view>
                                </view>

                                <!-- 广告注入 -->
                                <view v-if="(idx + 1) % 12 === 0 && canShowAd && !tabStates[index].adErrorMap[`slot-${idx}`]" class="ad-row">
                                    <custom-ad-banner @error="onAdError(index, `slot-${idx}`)"></custom-ad-banner>
                                </view>
                            </template>
                        </view>

                        <!-- 加载状态 -->
                        <view class="status-wrap" v-if="tabStates[index]?.images.length > 0">
                            <uni-load-more :status="tabStates[index].noMoreData ? 'noMore' : (tabStates[index].isLoading ? 'loading' : 'more')"></uni-load-more>
                        </view>
                        
                        <!-- 空状态 -->
                        <view class="empty-wrap" v-if="!tabStates[index]?.isLoading && tabStates[index]?.images.length === 0">
                            <image src="/static/images/pics/empty.png" mode="aspectFit"></image>
                            <text>换个排序试试，也许有惊喜</text>
                        </view>
                        
                        <view class="safe-area-bottom"></view>
                    </view>
                </scroll-view>
            </swiper-item>
        </swiper>
    </view>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted, nextTick } from 'vue';
import { apiGetClassList } from '@/api/wallpaper.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserStore } from '@/stores/user.js';
import { handlePicUrl } from '@/utils/common.js';

const settingsStore = useSettingsStore();
const userStore = useUserStore();

const props = defineProps({
    tabs: { type: Array, required: true },
    initialIndex: { type: Number, default: 0 }
});

const currentIndex = ref(props.initialIndex);
const dateSortAsc = ref(true); // 时间排序方向标识 (true: 升序, false: 降序)
const canShowAd = computed(() => !userStore.isVip && userStore.showAd);
const isWaterfall = computed(() => settingsStore.options.view !== 'window');
const imageMode = computed(() => isWaterfall.value ? 'widthFix' : 'aspectFill');
const lockedSize = computed(() => settingsStore.options.column === 3 ? 18 : 22);

// 状态深度分区存储
const tabStates = reactive(props.tabs.map(() => ({
    images: [],
    pageNum: 1,
    isLoading: false,
    isRefreshing: false,
    noMoreData: false,
    adErrorMap: {},
    waterfall: { height: 0, columnHeights: [] }
})));

// 1. 数据获取核心
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
        // 动态合并请求参数
        const requestParams = {
            ...props.tabs[index].query,
            pageNum: state.pageNum,
            pageSize: 12
        };
        
        // 特殊处理日期 Tab 的排序动态性
        if (props.tabs[index].isDate) {
            requestParams.sortord = dateSortAsc.value ? 'date_asc' : 'date_desc';
        }

        const res = await apiGetClassList(requestParams);
        const newData = (res.data || []).map(item => ({
            ...handlePicUrl(item),
            loaded: false,
            position: {}
        }));

        if (init) state.images = newData;
        else state.images.push(...newData);

        await processImages(index, newData);

        if (state.pageNum >= (res.pagination?.total_pages || 1)) {
            state.noMoreData = true;
        }
    } catch (e) {
        console.error('Fetch Error:', e);
    } finally {
        state.isLoading = false;
        state.isRefreshing = false;
    }
};

// 2. 交互逻辑：Tab 点击处理 (含日期逻辑)
const handleTabClick = (index) => {
    if (currentIndex.value === index) {
        // 如果是日期标签且已激活，再次点击切换排序
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
};

// 3. 布局重绘与计算逻辑 (略，保持原有高性能方案)
const processImages = async (index, list) => {
    const state = tabStates[index];
    const { screenWidth } = uni.getSystemInfoSync();
    const colCount = settingsStore.options.column;
    const gap = colCount === 3 ? 12 : 18;
    const colWidth = (screenWidth - (colCount + 1) * gap) / colCount;

    if (state.waterfall.columnHeights.length !== colCount) {
        state.waterfall.columnHeights = new Array(colCount).fill(0);
    }

    for (const item of list) {
        let w = 300;
        let h = 600; // 默认降级尺寸 (1:2 比例)
        let mode = isWaterfall.value ? 'widthFix' : 'aspectFill';

        try {
            const info = await getImageInfo(item.smallPicurl);
            w = info.width || w;
            h = info.height || h;
        } catch (e) {
            // 小程序端未配置 download 域名时会导致 getImageInfo 失败
            console.warn('getImageInfo failed, using element fallback', e);
            // 关键：如果获取实际比例失败，我们强行设置盒子的比例为1:2
            // 此时必须将 mode 强制切回 aspectFill，否则图片按原比例渲染会溢出/短缺这个盒子，导致锁图标全部错位！
            if (isWaterfall.value) {
                mode = 'aspectFill';
            }
        }
        
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
    const gap = colCount === 3 ? 12 : 18;
    if (!isWaterfall.value) return { display: 'grid', gridTemplateColumns: `repeat(${colCount}, 1fr)`, gap: `${gap}px`, padding: `${gap}px` };
    return { position: 'relative', height: `${tabStates[index]?.waterfall.height || 0}px`, padding: `${gap}px` };
};

const getBoxStyle = (index) => {
    const colCount = settingsStore.options.column;
    const style = { borderRadius: colCount === 3 ? '24rpx' : '42rpx', transition: 'all 0.4s ease', position: isWaterfall.value ? 'absolute' : 'relative' };
    if (!isWaterfall.value) style.height = colCount === 3 ? '480rpx' : '560rpx';
    return style;
};

const getImgStyle = () => ({ borderRadius: settingsStore.options.column === 3 ? '24rpx' : '42rpx' });
const getLockStyle = () => ({ top: settingsStore.options.column === 3 ? '8rpx' : '14rpx', right: settingsStore.options.column === 3 ? '8rpx' : '14rpx' });

const getImageInfo = (src) => new Promise((resolve, reject) => uni.getImageInfo({ src, success: resolve, fail: reject }));
const onReachLower = (index) => {
    const state = tabStates[index];
    if (!state.noMoreData && !state.isLoading) {
        state.pageNum++;
        fetchData(index);
    }
};
const onRefresh = (index) => {
    tabStates[index].isRefreshing = true;
    fetchData(index, true);
};

const onChangeColumn = () => settingsStore.options.column = settingsStore.options.column === 3 ? 2 : 3;
const onChangeView = () => settingsStore.options.view = settingsStore.options.view === 'window' ? 'waterfall' : 'window';
const onAdError = (index, key) => tabStates[index].adErrorMap[key] = true;
const openPreview = (id, index) => {
    uni.setStorageSync('wallList', tabStates[index].images);
    uni.navigateTo({ url: `/pages/app/preview?id=${id}` });
};

// 监听与校准
const recalculateLayout = async (index) => {
    const state = tabStates[index];
    if (!state || state.images.length === 0) return;
    state.waterfall.height = 0;
    state.waterfall.columnHeights = [];
    await processImages(index, state.images);
};

watch(() => currentIndex.value, (newIdx) => {
    if (tabStates[newIdx].images.length === 0) fetchData(newIdx, true);
    else nextTick(() => recalculateLayout(newIdx));
}, { immediate: true });

watch(() => settingsStore.options.column, () => tabStates.forEach((_, i) => recalculateLayout(i)));
watch(() => settingsStore.options.view, () => tabStates.forEach((_, i) => recalculateLayout(i)));

onMounted(() => {
    if (tabStates[currentIndex.value].images.length === 0) fetchData(currentIndex.value, true);
});
</script>

<style lang="scss" scoped>
.tabbed-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #0b1017;

    .header-bar {
        height: 104rpx;
        background: rgba(15, 23, 42, 0.94);
        backdrop-filter: blur(24rpx);
        border-bottom: 1rpx solid rgba(255, 255, 255, 0.04);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 10rpx;
        position: relative;
        z-index: 100;
        
        .tabs-scroll {
            width: 0; flex: 1; height: 100%; white-space: nowrap;
            .tabs-list {
                display: flex; height: 100%; align-items: center; padding: 0 16rpx;
                .tab-btn-wrapper {
                    margin-right: 14rpx;
                    button {
                        min-height: 68rpx; padding: 0 32rpx; border-radius: 999rpx;
                        font-size: 26rpx; font-weight: 600; color: #919fac;
                        background: rgba(32, 40, 52, 0.95);
                        border: 1rpx solid rgba(255, 255, 255, 0.04);
                        transition: all 0.3s; display: flex; align-items: center; gap: 8rpx;
                        line-height: normal;

                        &.active {
                            color: #ffffff; background: #619aef;
                            border-color: rgba(97, 154, 239, 0.2);
                            box-shadow: 0 12rpx 28rpx rgba(97, 154, 239, 0.34);
                        }
                        .sort-icon { margin-left: 2rpx; display: flex; align-items: center; }
                    }
                }
            }
        }

        .tool-actions {
            flex-shrink: 0; display: flex; align-items: center; gap: 12rpx; padding: 0 20rpx;
            border-left: 1rpx solid rgba(255, 255, 255, 0.08);
            background: linear-gradient(to right, transparent, rgba(15, 23, 42, 0.8));
            
            .action-btn {
                width: 68rpx; height: 68rpx; display: flex; align-items: center; justify-content: center;
                background: rgba(41, 52, 68, 0.98); border: 1rpx solid rgba(255, 255, 255, 0.05);
                border-radius: 20rpx; transition: all 0.2s;
                .icon-svg { 
                    width: 38rpx; height: 38rpx; 
                    filter: brightness(0) saturate(100%) invert(94%) sepia(10%) saturate(473%) hue-rotate(183deg) brightness(103%) contrast(101%);
                }
                &:active { transform: scale(0.9); background: rgba(255, 255, 255, 0.05); }
            }
        }
    }

    .content-swiper { flex: 1; height: 100%; }
    .tab-scroll-view { height: 100%; width: 100%; }
    .container {
        padding-bottom: 60rpx;
        .layout { .box { background: rgba(255, 255, 255, 0.02); overflow: hidden; .img { width: 100%; height: 100%; opacity: 0; transition: all 0.7s; &.loaded { opacity: 1; } } } }
    }
    .empty-wrap { display: flex; flex-direction: column; align-items: center; padding-top: 260rpx; image { width: 180rpx; height: 180rpx; opacity: 0.2; } text { color: #5c6b7a; font-size: 26rpx; margin-top: 32rpx; } }
    .safe-area-bottom { height: env(safe-area-inset-bottom); width: 100%; }
}
</style>
