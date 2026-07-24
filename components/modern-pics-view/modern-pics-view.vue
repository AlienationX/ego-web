<template>
    <view class="modern-pics-container" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 头部导航 (Tabs + 工具栏) -->
        <view
            v-if="shouldShowHeader"
            class="header-bar"
            :style="{
                transform: `translateY(${Math.max(stickyTop, headerHeight - headerScrollTop)}px)`,
                top: 0,
                zIndex: 100,
            }"
        >
            <scroll-view
                v-if="tabs.length > 1"
                scroll-x
                class="tabs-scroll"
                show-scrollbar="false"
                :scroll-into-view="'tab-' + (currentIndex > 1 ? currentIndex - 1 : 0)"
                scroll-with-animation
            >
                <view class="tabs-list">
                    <view v-for="(tab, index) in tabs" :key="index" :id="'tab-' + index" class="tab-item">
                        <view 
                            class="tab-btn" 
                            :class="{ active: currentIndex === index }" 
                            @click="handleTabClick(index)"
                        >
                            {{ tab.label }}
                            <view class="sort-icon" v-if="tab.isDate && currentIndex === index">
                                <uni-icons :type="dateSortAsc ? 'arrow-up' : 'arrow-down'" size="12" :color="settingsStore.isDark ? '#181818' : '#eef1f5'"></uni-icons>
                            </view>
                        </view>
                    </view>
                </view>
            </scroll-view>

            <view class="tool-actions" :class="{ 'is-single': tabs.length <= 1 }">
                <view class="action-btn" @click="toggleViewMode">
                    <image
                        class="icon-svg"
                        v-if="!isWaterfall"
                        src="/static/icons/view-grid.svg"
                        mode="aspectFit"
                    ></image>
                    <image class="icon-svg" v-else src="/static/icons/view-dashboard.svg" mode="aspectFit"></image>
                </view>
            </view>
        </view>

        <!-- 内容区域 -->
        <swiper class="content-swiper" :current="currentIndex" @change="onSwiperChange" duration="300">
            <swiper-item v-for="(tab, index) in tabs" :key="index">
                <scroll-view
                    scroll-y
                    class="tab-scroll-view"
                    show-scrollbar="false"
                    :scroll-top="tabStates[index].scrollTop"
                    scroll-with-animation
                    @scroll="onScroll($event, index)"
                    @scrolltolower="onReachLower(index)"
                >
                    <view class="scroll-content" :style="{ minHeight: `calc(100% + ${headerHeight}px)` }">
                        <view class="top-spacer" :style="{ height: topSpacerHeight + 'px' }"></view>

                        <!-- 骨架屏加载态 -->
                        <view v-if="tabStates[index].isLoading && tabStates[index].images.length === 0" class="skeleton-wrapper">
                            <view class="sk-grid" v-if="!isWaterfall">
                                <view v-for="i in 8" :key="i" class="sk-card"></view>
                            </view>
                            <view class="sk-waterfall" v-else>
                                <view class="sk-col">
                                    <view class="sk-card" style="height: 620rpx"></view>
                                    <view class="sk-card" style="height: 480rpx"></view>
                                    <view class="sk-card" style="height: 540rpx"></view>
                                </view>
                                <view class="sk-col">
                                    <view class="sk-card" style="height: 540rpx"></view>
                                    <view class="sk-card" style="height: 620rpx"></view>
                                    <view class="sk-card" style="height: 480rpx"></view>
                                </view>
                            </view>
                        </view>

                        <!-- 实际渲染数据 -->
                        <view class="gallery-wrapper" v-else-if="tabStates[index].images.length > 0">
                            <!-- 模式 1: 网格视图 (CSS Grid) -->
                            <view class="grid-layout" :style="gridStyle" v-if="!isWaterfall">
                                <view 
                                    class="modern-card grid-card" 
                                    v-for="(item, idx) in tabStates[index].images" 
                                    :key="index + '-' + item.id + '-' + idx"
                                    @click="openPreview(item.id, index)"
                                    @longpress="handleLongPress(item, index)"
                                >
                                    <image class="card-img" :src="item.smallPicurl" mode="aspectFill" lazy-load @load="item.loaded = true" :class="{'is-loaded': item.loaded}"></image>
                                        <view class="card-overlay" v-if="showCardMeta"></view>
                                        <view class="card-meta" v-if="showCardMeta">
                                            <view class="meta-title">{{ getTitle(item) }}</view>
                                            <view class="meta-footer">
                                                <view class="meta-tag">{{ getTag(item) }}</view>
                                                <view class="meta-score"><mdi-icon path="/static/icons/star.svg" size="14px" color="#ffbf66"></mdi-icon>{{ item.score || '--' }}</view>
                                            </view>
                                        </view>
                                        <view class="card-lock" v-if="item.is_locked && item.loaded">
                                            <uni-icons type="locked-filled" size="18" color="#F9E9B5"></uni-icons>
                                        </view>
                                </view>
                            </view>

                            <!-- 模式 2: 瀑布流视图 (Flex 双列) - 彻底摆脱 absolute bug -->
                            <view class="waterfall-layout" v-else>
                                <!-- 左列 -->
                                <view class="waterfall-col">
                                    <view 
                                        class="modern-card wf-card" 
                                        v-for="(item, idx) in tabStates[index].leftCol" 
                                        :key="index + '-l-' + item.id + '-' + idx"
                                        :class="{ 'is-deleting': item.is_deleting }"
                                        @click="openPreview(item.id, index)"
                                        @longpress="handleLongPress(item, index)"
                                    >
                                        <image class="card-img" :src="item.smallPicurl" mode="widthFix" lazy-load @load="item.loaded = true" :class="{'is-loaded': item.loaded}"></image>
                                        <view class="card-overlay" v-if="showCardMeta"></view>
                                        <view class="card-meta" v-if="showCardMeta">
                                            <view class="meta-title">{{ getTitle(item) }}</view>
                                            <view class="meta-footer">
                                                <view class="meta-tag">{{ getTag(item) }}</view>
                                                <view class="meta-score"><mdi-icon path="/static/icons/star.svg" size="14px" color="#ffbf66"></mdi-icon>{{ item.score || '--' }}</view>
                                            </view>
                                        </view>
                                        <view class="card-lock" v-if="item.is_locked && item.loaded">
                                            <uni-icons type="locked-filled" size="18" color="#F9E9B5"></uni-icons>
                                        </view>
                                    </view>
                                </view>
                                <!-- 右列 -->
                                <view class="waterfall-col">
                                    <view 
                                        class="modern-card wf-card" 
                                        v-for="(item, idx) in tabStates[index].rightCol" 
                                        :key="index + '-r-' + item.id + '-' + idx"
                                        :class="{ 'is-deleting': item.is_deleting }"
                                        @click="openPreview(item.id, index)"
                                        @longpress="handleLongPress(item, index)"
                                    >
                                        <image class="card-img" :src="item.smallPicurl" mode="widthFix" lazy-load @load="item.loaded = true" :class="{'is-loaded': item.loaded}"></image>
                                        <view class="card-overlay" v-if="showCardMeta"></view>
                                        <view class="card-meta" v-if="showCardMeta">
                                            <view class="meta-title">{{ getTitle(item) }}</view>
                                            <view class="meta-footer">
                                                <view class="meta-tag">{{ getTag(item) }}</view>
                                                <view class="meta-score"><mdi-icon path="/static/icons/star.svg" size="14px" color="#ffbf66"></mdi-icon>{{ item.score || '--' }}</view>
                                            </view>
                                        </view>
                                        <view class="card-lock" v-if="item.is_locked && item.loaded">
                                            <uni-icons type="locked-filled" size="18" color="#F9E9B5"></uni-icons>
                                        </view>
                                    </view>
                                </view>
                            </view>
                        </view>

                        <!-- 空状态 -->
                        <view class="empty-state" v-if="!tabStates[index].isLoading && tabStates[index].images.length === 0">
                            <slot name="empty" :index="index">
                                <image src="/static/images/photos_empty.svg" mode="aspectFit" class="empty-img"></image>
                                <text class="empty-text">暂无相关壁纸</text>
                            </slot>
                        </view>

                        <!-- 底部加载状态 -->
                        <view class="status-footer" v-if="tabStates[index].images.length > 0">
                            <uni-load-more :status="tabStates[index].noMoreData ? 'noMore' : tabStates[index].isLoading ? 'loading' : 'more'"></uni-load-more>
                        </view>

                        <view class="safe-area-bottom" :style="{ height: `${bottomSafeSpace}rpx` }"></view>
                    </view>
                </scroll-view>
            </swiper-item>
        </swiper>

        <!-- 返回顶部悬浮按钮 -->
        <view
            class="fab-back-top"
            :class="{ show: tabStates[currentIndex]?.showBackTop, 'is-embedded': props.embedded }"
            :style="fabBackTopStyle"
            @click="handleBackTop"
        >
            <uni-icons type="arrow-up" size="24" color="#fff"></uni-icons>
        </view>
    </view>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiGetClassList, apiGetSearchData, apiGetActions, apiPostRecommend } from '@/api/wallpaper.js';
import { getTabBarHeight } from '@/utils/layout.js';

const fabBackTopStyle = computed(() => {
    const tabH = props.embedded ? getTabBarHeight() : 0;
    const adH = props.adHeight > 0 ? props.adHeight : 0;
    return {
        bottom: `${tabH + adH + 16}px`,
    };
});
import { useSettingsStore } from '@/stores/settings.js';
import { useUserStore } from '@/stores/user.js';
import { useAppStore } from '@/stores/app.js';
import { handlePicUrl } from '@/utils/common.js';

// --- Props & Emits ---
const props = defineProps({
    tabs: { type: Array, required: true },
    initialIndex: { type: Number, default: 0 },
    showHeader: { type: Boolean, default: true },
    apiType: { type: String, default: 'classList' },
    hideHeaderIfEmpty: { type: Boolean, default: false },
    headerHeight: { type: Number, default: 0 },
    tabsHeight: { type: Number, default: 44 },
    stickyTop: { type: Number, default: 0 },
    layoutMode: { type: String, default: '' }, // '' 跟随全局, 'waterfall', 'grid'
    showCardMeta: { type: Boolean, default: false },
    showDelete: { type: Boolean, default: false }, // 显示删除按钮
    bottomSafeSpace: { type: Number, default: 60 },
    adHeight: { type: Number, default: 0 }, // 广告条高度，用于悬浮按钮位置调整
    embedded: { type: Boolean, default: false }, // 是否在 tabbar 页面内嵌入
});

const emit = defineEmits(['update', 'change', 'scroll', 'remove']);

// 长按删除
const handleLongPress = (item, index) => {
    if (!props.showDelete) return;
    emit('remove', { item, tabIndex: index });
};

// 外部调用：从本地状态移除指定项
const removeItem = (tabIndex, wallId) => {
    const state = tabStates[tabIndex];
    if (!state) return;

    // 先标记为删除，触发 CSS 过渡动画
    const markDeleted = (arr) => {
        const item = arr.find(i => i.id === wallId);
        if (item) item.is_deleting = true;
    };
    markDeleted(state.leftCol);
    markDeleted(state.rightCol);

    // 延时等待动画完成后真正移除数据
    setTimeout(() => {
        const removeFrom = (arr) => {
            const idx = arr.findIndex(i => i.id === wallId);
            if (idx !== -1) arr.splice(idx, 1);
        };
        removeFrom(state.images);
        removeFrom(state.leftCol);
        removeFrom(state.rightCol);
    }, 350);
};

defineExpose({ removeItem });

// --- Store & State ---
const { locale } = useI18n();
const settingsStore = useSettingsStore();
const userStore = useUserStore();

const isEn = computed(() => locale.value === 'en');
const currentIndex = ref(props.initialIndex);
const headerScrollTop = ref(0);
const dateSortAsc = ref(true);

const isWaterfall = computed(() => 
    props.layoutMode ? props.layoutMode === 'waterfall' : settingsStore.options.view !== 'window'
);

const colCount = computed(() => settingsStore.options.column || 2);
const gridStyle = computed(() => ({
    gridTemplateColumns: `repeat(${colCount.value}, 1fr)`
}));

// --- Utils ---
const getTitle = (item) => isEn.value && item.description_en ? item.description_en : item.description || item.classify_name || `Wall #${item.id}`;
const getTag = (item) => isEn.value && item.classify_name_en ? item.classify_name_en : item.classify_name || '壁纸';

// --- Header Logic ---
const shouldShowHeader = computed(() => {
    if (!props.showHeader) return false;
    if (!props.hideHeaderIfEmpty) return true;
    const currentTab = tabStates[currentIndex.value];
    return currentTab?.images.length > 0 || currentTab?.isLoading;
});

const topSpacerHeight = computed(() => props.showHeader ? props.headerHeight + props.tabsHeight : props.headerHeight || 0);

// --- State Management ---
const createTabState = () => ({
    images: [], // 扁平化数据供 Grid 使用
    leftCol: [], // 供双列瀑布流左列使用
    rightCol: [], // 供双列瀑布流右列使用
    leftHeight: 0,
    rightHeight: 0,
    pageNum: 1,
    isLoading: false,
    noMoreData: false,
    scrollTop: null,
    oldScrollTop: 0,
    showBackTop: false,
    lastQueryStr: '',
    hasLoaded: false,
});

const tabStates = reactive(props.tabs.map(() => createTabState()));

// --- Data Fetching & Layout Engine ---
const distributeItems = async (index, newItems) => {
    const state = tabStates[index];
    
    // 确保有尺寸信息用于计算瀑布流
    // 因为后端必定返回宽高，所以这个兜底操作暂时关闭
    // await Promise.all(newItems.map(async (item) => {
    //     if (!item.width || !item.height) {
    //         try {
    //             const info = await new Promise((res, rej) => uni.getImageInfo({ src: item.smallPicurl, success: res, fail: rej }));
    //             item.width = info.width || 300;
    //             item.height = info.height || 600;
    //         } catch (e) {
    //             item.width = 300;
    //             item.height = 600;
    //         }
    //     }
    // }));

    // Flex 双列动态分发算法
    newItems.forEach(item => {
        const virtualHeight = (item.height / item.width) * 100; // 计算相对高度贡献
        if (state.leftHeight <= state.rightHeight) {
            state.leftCol.push(item);
            state.leftHeight += virtualHeight;
        } else {
            state.rightCol.push(item);
            state.rightHeight += virtualHeight;
        }
        state.images.push(item);
    });
};

const fetchData = async (index, init = false) => {
    const state = tabStates[index];
    if (!state || state.isLoading || (state.noMoreData && !init)) return;

    if (init) {
        Object.assign(state, { images: [], leftCol: [], rightCol: [], leftHeight: 0, rightHeight: 0, pageNum: 1, noMoreData: false, hasLoaded: true });
    }

    try {
        state.isLoading = true;

        if (props.apiType === 'local') {
            const rawData = props.tabs[index].data || [];
            const newItems = rawData.map(item => ({ ...item, loaded: false }));
            await distributeItems(index, newItems);
            state.noMoreData = true;
            return;
        }

        const params = { ...props.tabs[index].query, pageNum: state.pageNum, pageSize: 12 };
        if (props.tabs[index].isDate) params.sortord = dateSortAsc.value ? 'date_asc' : 'date_desc';

        let res;
        if (props.apiType === 'search') {
            if (!params.keyword) { state.isLoading = false; return; }
            res = await apiGetSearchData(params);
        } else if (props.apiType === 'actions') {
            res = await apiGetActions(params);
        } else if (props.apiType === 'recommend') {
            if (state.images.length > 0) params.exclude_ids = state.images.map(i => i.id);
            res = await apiPostRecommend(params);
        } else {
            if (params.classify_id !== undefined && isNaN(params.classify_id)) { state.isLoading = false; return; }
            res = await apiGetClassList(params);
        }

        const newItems = (res.data || []).map(item => ({ ...handlePicUrl(item), loaded: false }));
        await distributeItems(index, newItems);

        if (index === currentIndex.value) emit('update', { images: state.images, index });
        if (state.pageNum >= (res.pagination?.total_pages || 1)) state.noMoreData = true;
        
    } catch (e) {
        console.error('Fetch error:', e);
    } finally {
        state.isLoading = false;
    }
};

// tabs 变化监听（放在 fetchData 定义之后，避免 immediate watch 时引用未初始化的 const）
watch(() => props.tabs, (newTabs) => {
    if (newTabs.length > tabStates.length) {
        for (let i = tabStates.length; i < newTabs.length; i++) {
            tabStates.push(createTabState());
        }
    } else if (newTabs.length < tabStates.length) {
        tabStates.splice(newTabs.length);
    }

    let activeQueryChanged = false;

    newTabs.forEach((tab, index) => {
        const state = tabStates[index];
        if (!state) return;
        const queryStr = JSON.stringify(tab.query || {});

        if (state.lastQueryStr === queryStr) return;

        if (state.hasLoaded) {
            if (props.apiType === 'search') {
                Object.assign(state, createTabState(), { lastQueryStr: queryStr });
                if (index === currentIndex.value) activeQueryChanged = true;
            } else {
                fetchData(index, true);
            }
        } else {
            state.lastQueryStr = queryStr;
        }
    });

    if (props.apiType === 'local') tabStates.forEach((_, i) => fetchData(i, true));

    if (props.apiType === 'search' && activeQueryChanged) {
        fetchData(currentIndex.value, true);
    }

    if (props.apiType !== 'search' && props.apiType !== 'local') {
        const activeState = tabStates[currentIndex.value];
        if (activeState && !activeState.hasLoaded && !activeState.isLoading) {
            fetchData(currentIndex.value, true);
        }
    }
}, { deep: true, immediate: true });

// --- Interactions ---
const handleTabClick = (index) => {
    if (currentIndex.value === index) {
        if (props.tabs[index].isDate) {
            dateSortAsc.value = !dateSortAsc.value;
            fetchData(index, true);
        }
    } else {
        currentIndex.value = index;
        // 懒加载：切换到未加载的 tab 时拉取数据
        const state = tabStates[index];
        if (state && state.images.length === 0 && !state.isLoading) {
            fetchData(index, true);
        }
    }
};

const toggleViewMode = () => {
    settingsStore.options.view = settingsStore.options.view === 'window' ? 'waterfall' : 'window';
};

const onSwiperChange = (e) => {
    currentIndex.value = e.detail.current;
    // 懒加载：首次进入该 tab 且未加载数据时触发拉取
    const state = tabStates[currentIndex.value];
    if (state && state.images.length === 0 && !state.isLoading) {
        fetchData(currentIndex.value, true);
    }
    emit('change', currentIndex.value);
    emit('update', { images: state.images, index: currentIndex.value });
};

const onScroll = (e, index) => {
    const st = e.detail.scrollTop;
    tabStates[index].oldScrollTop = st;
    tabStates[index].showBackTop = st > 400;
    
    if (index === currentIndex.value) {
        headerScrollTop.value = Math.min(st, props.headerHeight);
        emit('scroll', { scrollTop: st, index });
    }
};

const onReachLower = (index) => {
    if (!tabStates[index].noMoreData && !tabStates[index].isLoading) {
        tabStates[index].pageNum++;
        fetchData(index);
    }
};

const handleBackTop = () => {
    const state = tabStates[currentIndex.value];
    state.scrollTop = state.oldScrollTop;
    nextTick(() => { state.scrollTop = 0; });
};

const openPreview = (id, index) => {
    const appStore = useAppStore();
    appStore.wallList = tabStates[index].images;
    uni.navigateTo({ url: `/pages/app/preview?id=${id}` });
};

// --- Lifecycle ---
watch(() => currentIndex.value, (newIdx) => {
    const currentScroll = tabStates[newIdx]?.oldScrollTop || 0;
    
    // Smooth header sync on tab switch
    if (headerScrollTop.value >= props.headerHeight && currentScroll < props.headerHeight) {
        tabStates[newIdx].scrollTop = currentScroll;
        setTimeout(() => {
            tabStates[newIdx].scrollTop = props.headerHeight;
            tabStates[newIdx].oldScrollTop = props.headerHeight;
        }, 50);
        headerScrollTop.value = props.headerHeight;
    } else {
        headerScrollTop.value = Math.min(currentScroll, props.headerHeight);
    }
    emit('scroll', { scrollTop: currentScroll, index: newIdx });

    if (tabStates[newIdx].images.length === 0) fetchData(newIdx, true);
}, { immediate: true });

</script>

<style lang="scss" scoped>
.modern-pics-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--page-background);
    color: var(--text-primary);
}

/* 头部 Header */
.header-bar {
    position: absolute;
    width: 100%;
    height: 88rpx;
    display: flex;
    align-items: center;
    background: var(--page-background);
    border-bottom: 1rpx solid var(--panel-border);
    will-change: transform;
}

.tabs-scroll {
    flex: 1;
    width: 0;
    height: 100%;
    white-space: nowrap;
    
    .tabs-list {
        display: flex;
        height: 100%;
        align-items: center;
        padding: 0 20rpx;
        
        .tab-item {
            padding: 0 10rpx;
            display: inline-block;
        }
        
        .tab-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 56rpx;
            padding: 0 32rpx;
            border-radius: 999rpx;
            font-size: 26rpx;
            font-weight: 600;
            color: var(--text-tertiary);
            background: var(--panel-background-strong);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            
            &.active {
                color: var(--page-background);
                background: var(--text-primary);
                box-shadow: 0 8rpx 20rpx var(--shadow-color);
            }
            .sort-icon { margin-left: 6rpx; }
        }
    }
}

.tool-actions {
    padding: 0 24rpx;
    border-left: 1rpx solid var(--panel-border);
    &.is-single { border-left: none; width: 100%; justify-content: flex-end; display: flex;}
    
    .action-btn {
        width: 56rpx;
        height: 56rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 16rpx;
        background: var(--panel-background);
        border: 1rpx solid var(--panel-border);
        transition: transform 0.2s;
        
        &:active { transform: scale(0.9); }
        .icon-svg { width: 34rpx; height: 34rpx; filter: grayscale(1); opacity: 0.8; }
        .theme-dark & .icon-svg { filter: invert(1) grayscale(1); }
    }
}

/* 核心内容区 */
.content-swiper { flex: 1; width: 100%; height: 100%; }
.tab-scroll-view { height: 100%; width: 100%; }
.scroll-content { display: flex; flex-direction: column; }
.gallery-wrapper { padding: 24rpx; }

/* 网格布局 */
.grid-layout {
    display: grid;
    gap: 24rpx;
}

/* 瀑布流双列 Flex 布局 */
.waterfall-layout {
    display: flex;
    justify-content: space-between;
    gap: 24rpx;
    align-items: flex-start;
    
    .waterfall-col {
        flex: 1;
        width: calc(50% - 12rpx);
        display: flex;
        flex-direction: column;
        gap: 24rpx;
    }
}

/* 瀑布流动画 */
.waterfall-anim-move,
.waterfall-anim-enter-active,
.waterfall-anim-leave-active {
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.waterfall-anim-enter-from,
.waterfall-anim-leave-to {
    opacity: 0;
    transform: scale(0.9) translateY(40rpx);
}
.waterfall-anim-leave-active {
    position: absolute !important;
    width: 100%;
}

/* 卡片 UI (Glassmorphism + 交互) */
.modern-card {
    position: relative;
    width: 100%;
    background: var(--panel-background);
    border-radius: 36rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 16rpx var(--shadow-color);
    transform: translateZ(0); /* 开启 GPU 加速 */
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    max-height: 2000rpx;
    opacity: 1;
    transform-origin: center center;
    
    &.grid-card { height: 580rpx; }
    
    &.is-deleting {
        opacity: 0;
        max-height: 0 !important;
        margin-top: 0 !important;
        margin-bottom: 0 !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        border: 0 !important;
        transform: scale(0.8);
    }
    
    &:active { .card-img { transform: scale(1.08); } }
    @media (hover: hover) {
        &:hover { .card-img { transform: scale(1.08); } }
    }
    
    .card-img {
        width: 100%;
        height: 100%;
        display: block;
        opacity: 0;
        filter: blur(10px);
        transition: opacity 0.5s ease, filter 0.6s ease, transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        
        &.is-loaded {
            opacity: 1;
            filter: blur(0);
        }
    }
    
    .card-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%);
        pointer-events: none;
        opacity: 0.8;
    }
    
    .card-meta {
        position: absolute;
        left: 20rpx;
        right: 20rpx;
        bottom: 20rpx;
        z-index: 2;
        pointer-events: none;
        color: #fff;
        
        .meta-title {
            font-size: 26rpx;
            font-weight: bold;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.5);
        }
        
        .meta-footer {
            margin-top: 12rpx;
            display: flex;
            justify-content: space-between;
            align-items: center;
            
            .meta-tag {
                background: rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(8px);
                padding: 4rpx 12rpx;
                border-radius: 20rpx;
                font-size: 18rpx;
                font-weight: 600;
            }
            
            .meta-score {
                display: flex;
                align-items: center;
                gap: 4rpx;
                font-size: 20rpx;
                font-weight: bold;
            }
        }
    }
    
    .card-lock {
        position: absolute;
        top: 20rpx;
        right: 20rpx;
        background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(4px);
        border-radius: 50%;
        padding: 8rpx;
        z-index: 5;
    }
}

/* 骨架屏 */
.skeleton-wrapper { padding: 24rpx; }
.sk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24rpx; }
.sk-waterfall { display: flex; gap: 24rpx; .sk-col { flex: 1; display: flex; flex-direction: column; gap: 24rpx; } }
.sk-card {
    border-radius: 36rpx;
    background: linear-gradient(90deg, var(--panel-background) 25%, var(--panel-background-strong) 50%, var(--panel-background) 75%);
    background-size: 200% 100%;
    animation: sk-shimmer 1.5s infinite linear;
    &.sk-grid .sk-card { height: 500rpx; }
}
@keyframes sk-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* 辅助与状态 */
.empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 160rpx;
    opacity: 0.6;
    
    .empty-img { width: 240rpx; height: 240rpx; }
    .empty-text { margin-top: 24rpx; font-size: 28rpx; color: var(--text-tertiary); }
}

.status-footer { padding: 24rpx 0; }

.fab-back-top {
    position: fixed;
    right: 32rpx;
    bottom: calc(32rpx + env(safe-area-inset-bottom));
    width: 88rpx;
    height: 88rpx;
    background: #2b8cee;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 12rpx 32rpx rgba(43, 140, 238, 0.4);
    opacity: 0;
    transform: translateY(100rpx) scale(0.5);
    transition:
        opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
        transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
        bottom 0.3s ease;
    z-index: 1000;
    
    &.show { opacity: 1; transform: translateY(0) scale(1); }
    &:active { transform: scale(0.9); }

    &.is-embedded {
        bottom: 32rpx;
    }
}
</style>
