<template>
    <view class="modern-pics-container" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 头部导航 (Tabs + 工具栏) -->
        <view v-if="shouldShowHeader" class="header-bar" :style="{
            transform: `translateY(${Math.max(stickyTop, headerHeight - headerScrollTop)}px)`,
            top: 0,
            zIndex: 100,
        }">
            <scroll-view v-if="tabs.length > 1" scroll-x class="tabs-scroll" show-scrollbar="false"
                :scroll-into-view="'tab-' + (currentIndex > 1 ? currentIndex - 1 : 0)" scroll-with-animation>
                <view class="tabs-list">
                    <view v-for="(tab, index) in tabs" :key="index" :id="'tab-' + index" class="tab-item">
                        <view class="tab-btn" :class="{ active: currentIndex === index }"
                            @click="handleTabClick(index)">
                            {{ tab.label }}
                            <view class="sort-icon" v-if="tab.isDate && currentIndex === index">
                                <uni-icons :type="dateSortAsc ? 'arrow-up' : 'arrow-down'" size="12"
                                    :color="settingsStore.isDark ? '#181818' : '#eef1f5'"></uni-icons>
                            </view>
                        </view>
                    </view>
                </view>
            </scroll-view>

            <view class="tool-actions" :class="{ 'is-single': tabs.length <= 1 }">
                <view class="action-btn" @click="toggleViewMode">
                    <image class="icon-svg" v-if="!isWaterfall" src="/static/icons/view-grid.svg" mode="aspectFit">
                    </image>
                    <image class="icon-svg" v-else src="/static/icons/view-dashboard.svg" mode="aspectFit"></image>
                </view>
            </view>
        </view>

        <!-- 内容区域 -->
        <swiper class="content-swiper" :current="currentIndex" @change="onSwiperChange" duration="300">
            <swiper-item v-for="(tab, index) in tabs" :key="index">
                <scroll-view scroll-y class="tab-scroll-view" show-scrollbar="false"
                    :scroll-into-view="tabStates[index].scrollIntoViewId" @scroll="onScroll($event, index)"
                    @scrolltolower="onReachLower(index)">
                    <view class="scroll-content" :style="{ minHeight: `calc(100% + ${headerHeight}px)` }">
                        <view :id="`tab-top-anchor-${index}`" class="top-spacer"
                            :style="{ height: topSpacerHeight + 'px' }"></view>

                        <!-- 骨架屏加载态 -->
                        <view v-if="tabStates[index].isLoading && tabStates[index].images.length === 0"
                            class="skeleton-wrapper">
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
                                    :class="{ 'is-ad-card': item.is_ad, 'is-loaded': item.adLoaded }"
                                    v-for="(item, idx) in tabStates[index].gridItems"
                                    :key="item._uniqueKey || (item.is_ad ? item.id : (index + '-' + item.id + '-' + idx))"
                                    @click="!item.is_ad && openPreview(item.id, index)"
                                >
                                    <!-- A. 穿插的卡片广告 (横跨整行通栏展示，宽度>200px满足微信规范) -->
                                    <template v-if="item.is_ad">
                                        <view class="ad-custom-card">
                                            <custom-ad
                                                direction="horizontal"
                                                @load="onCustomAdLoad(item, $event)"
                                                @error="onCustomAdError(item, $event)"
                                                @close="onCustomAdClose(item, $event)"
                                            />
                                        </view>
                                    </template>

                                    <!-- B. 正常壁纸卡片 -->
                                    <template v-else>
                                        <image class="card-img" :src="item.smallPicurl" mode="aspectFill" lazy-load
                                            @load="item.loaded = true" @error="item.loaded = true" :class="{ 'is-loaded': item.loaded }"></image>
                                        <view class="card-overlay" v-if="showCardMeta"></view>
                                        <view class="card-meta" v-if="showCardMeta">
                                            <view class="meta-title">{{ getTitle(item) }}</view>
                                            <view class="meta-footer">
                                                <view class="meta-tag">{{ getTag(item) }}</view>
                                                <view class="meta-score">
                                                    <mdi-icon path="/static/icons/star.svg" size="14px" color="#ffbf66"></mdi-icon>
                                                    <text class="score-text">{{ item.score || '--' }}</text>
                                                </view>
                                            </view>
                                        </view>
                                        <view class="card-lock" v-if="item.is_locked && item.loaded">
                                            <uni-icons
                                                v-if="item.effective_access_level === 2 || item.unlock_type === 'vip_only' || item.access_level === 2"
                                                type="vip-filled" size="18" color="#F9E9B5"></uni-icons>
                                                <uni-icons v-else type="locked-filled" size="18" color="#F9E9B5"></uni-icons>
                                        </view>
                                    </template>
                                </view>
                            </view>

                            <!-- 模式 2: 真实的双列动态平衡瀑布流 (单列穿插原生模板广告卡片) -->
                            <view class="waterfall-layout" v-else>
                                <!-- 左列 -->
                                <view class="waterfall-col">
                                    <view
                                        class="modern-card wf-card"
                                        :class="{ 'is-ad-card': item.is_ad, 'is-loaded': item.adLoaded }"
                                        v-for="(item, idx) in tabStates[index].leftCol"
                                        :key="item._uniqueKey || (item.is_ad ? item.id : ('w-l-' + item.id + '-' + idx))"
                                        @click="!item.is_ad && openPreview(item.id, index)"
                                    >
                                        <template v-if="item.is_ad">
                                            <view class="ad-custom-card">
                                                <custom-ad
                                                    direction="vertical"
                                                    @load="onCustomAdLoad(item, $event)"
                                                    @error="onCustomAdError(item, $event)"
                                                    @close="onCustomAdClose(item, $event)"
                                                />
                                            </view>
                                        </template>
                                        <template v-else>
                                            <image class="card-img" :src="item.smallPicurl" mode="widthFix" lazy-load
                                                @load="item.loaded = true" @error="item.loaded = true" :class="{ 'is-loaded': item.loaded }"></image>
                                            <view class="card-overlay" v-if="showCardMeta"></view>
                                            <view class="card-meta" v-if="showCardMeta">
                                                <view class="meta-title">{{ getTitle(item) }}</view>
                                                <view class="meta-footer">
                                                    <view class="meta-tag">{{ getTag(item) }}</view>
                                                    <view class="meta-score">
                                                        <mdi-icon path="/static/icons/star.svg" size="14px" color="#ffbf66"></mdi-icon>
                                                        <text class="score-text">{{ item.score || '--' }}</text>
                                                    </view>
                                                </view>
                                            </view>
                                            <view class="card-lock" v-if="item.is_locked && item.loaded">
                                                <uni-icons
                                                    v-if="item.effective_access_level === 2 || item.unlock_type === 'vip_only' || item.access_level === 2"
                                                    type="vip-filled" size="18" color="#F9E9B5"></uni-icons>
                                                <uni-icons v-else type="locked-filled" size="18" color="#F9E9B5"></uni-icons>
                                            </view>
                                        </template>
                                    </view>
                                </view>
                                <!-- 右列 -->
                                <view class="waterfall-col">
                                    <view
                                        class="modern-card wf-card"
                                        :class="{ 'is-ad-card': item.is_ad, 'is-loaded': item.adLoaded }"
                                        v-for="(item, idx) in tabStates[index].rightCol"
                                        :key="item._uniqueKey || (item.is_ad ? item.id : ('w-r-' + item.id + '-' + idx))"
                                        @click="!item.is_ad && openPreview(item.id, index)"
                                    >
                                        <template v-if="item.is_ad">
                                            <view class="ad-custom-card">
                                                <custom-ad
                                                    direction="vertical"
                                                    @load="onCustomAdLoad(item, $event)"
                                                    @error="onCustomAdError(item, $event)"
                                                    @close="onCustomAdClose(item, $event)"
                                                />
                                            </view>
                                        </template>
                                        <template v-else>
                                            <image class="card-img" :src="item.smallPicurl" mode="widthFix" lazy-load
                                                @load="item.loaded = true" @error="item.loaded = true" :class="{ 'is-loaded': item.loaded }"></image>
                                            <view class="card-overlay" v-if="showCardMeta"></view>
                                            <view class="card-meta" v-if="showCardMeta">
                                                <view class="meta-title">{{ getTitle(item) }}</view>
                                                <view class="meta-footer">
                                                    <view class="meta-tag">{{ getTag(item) }}</view>
                                                    <view class="meta-score">
                                                        <mdi-icon path="/static/icons/star.svg" size="14px" color="#ffbf66"></mdi-icon>
                                                        <text class="score-text">{{ item.score || '--' }}</text>
                                                    </view>
                                                </view>
                                            </view>
                                            <view class="card-lock" v-if="item.is_locked && item.loaded">
                                                <uni-icons
                                                    v-if="item.effective_access_level === 2 || item.unlock_type === 'vip_only' || item.access_level === 2"
                                                    type="vip-filled" size="18" color="#F9E9B5"></uni-icons>
                                                <uni-icons v-else type="locked-filled" size="18" color="#F9E9B5"></uni-icons>
                                            </view>
                                        </template>
                                    </view>
                                </view>
                            </view>
                        </view>

                        <!-- 空状态占位（保持 flex 高度，实际内容由外层 overlay 展示） -->

                        <!-- 底部加载状态 -->
                        <view class="status-footer" v-if="tabStates[index].images.length > 0">
                            <uni-load-more
                                :status="tabStates[index].noMoreData ? 'noMore' : tabStates[index].isLoading ? 'loading' : 'more'"></uni-load-more>
                        </view>

                        <view class="safe-area-bottom" :style="{ height: `${bottomSafeSpace}rpx` }"></view>
                    </view>
                </scroll-view>
            </swiper-item>
        </swiper>

        <!-- 空状态 overlay（absolute 覆盖，不受 scroll-view 内布局影响） -->
        <view class="empty-overlay"
            v-if="!tabStates[currentIndex]?.isLoading && tabStates[currentIndex]?.images.length === 0 && tabStates[currentIndex]?.hasLoaded">
            <slot name="empty" :index="currentIndex">
                <view class="empty-state">
                    <image src="/static/images/photos_empty.svg" mode="aspectFit" class="empty-img"></image>
                    <text class="empty-text">暂无相关壁纸</text>
                </view>
            </slot>
        </view>

        <!-- 返回顶部悬浮按钮 -->
        <fab-back-top :show="tabStates[currentIndex]?.showBackTop" :embedded="props.embedded"
            :ad-height="props.adHeight" @click="handleBackTop" />
    </view>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiGetClassList, apiGetSearchData, apiPostRecommend } from '@/api/wallpaper.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserStore } from '@/stores/user.js';
import { useAppStore } from '@/stores/app.js';
import { handlePicUrl } from '@/utils/common.js';
import { AD_CONFIG } from '@/common/config.js';

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
    bottomSafeSpace: { type: Number, default: 60 },
    adHeight: { type: Number, default: 0 }, // 广告条高度，用于悬浮按钮位置调整
    embedded: { type: Boolean, default: false }, // 是否在 tabbar 页面内嵌入
    active: { type: Boolean, default: true }, // 是否当前可见（用于 v-show 切换时恢复滚动位置）
});

const emit = defineEmits(['update', 'change', 'scroll']);

// --- Store & State ---
const { locale } = useI18n();
const settingsStore = useSettingsStore();
const userStore = useUserStore();

const isEn = computed(() => locale.value === 'en');
const currentIndex = ref(props.initialIndex);
const headerScrollTop = ref(0);
const dateSortAsc = ref(true);

// 卡片广告位配置（网格通栏横版广告 / 瀑布流单列竖屏广告）
const hasHorizontalAdConfig = computed(() => {
    // #ifdef MP-WEIXIN
    return !!AD_CONFIG.weixin?.customHorizontalUnitId;
    // #endif
    // #ifdef APP
    return !!AD_CONFIG.app?.customHorizontalAdpid;
    // #endif
    // #ifndef MP-WEIXIN || APP
    return false;
    // #endif
});

const hasVerticalAdConfig = computed(() => {
    // #ifdef MP-WEIXIN
    return !!AD_CONFIG.weixin?.customVerticalUnitId;
    // #endif
    // #ifdef APP
    return !!AD_CONFIG.app?.customVerticalAdpid;
    // #endif
    // #ifndef MP-WEIXIN || APP
    return false;
    // #endif
});

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

// 每 8 张壁纸后穿插 1 个原生模板广告
const AD_INTERVAL = 8;
// 记录加载失败/无填充的原生广告 ID，确保数据层直接排除不展示
const failedAdIds = reactive(new Set());

// --- State Management ---
const createTabState = () => ({
    images: [],         // 纯壁纸数据源
    gridItems: [],      // 网格展示数据（包含穿插的单列广告）
    leftCol: [],        // 瀑布流左列数据（含穿插的单列广告）
    rightCol: [],       // 瀑布流右列数据（含穿插的单列广告）
    pageNum: 1,
    isLoading: false,
    noMoreData: false,
    scrollIntoViewId: '', // 用于 scroll-into-view 跳转（如返回顶部）
    oldScrollTop: 0,
    showBackTop: false,
    lastQueryStr: '',
    hasLoaded: false,
});

const tabStates = reactive(props.tabs.map(() => createTabState()));

// 获取壁纸的相对高度比例，用于左右列动态平衡计算
const getItemRatio = (item) => {
    const w = Number(item.width) || 0;
    const h = Number(item.height) || 0;
    if (w > 0 && h > 0) {
        return Math.max(1.1, Math.min(1.8, h / w));
    }
    // 若未返回宽高，使用基于 ID 的确定性自然落差，使左右列自然交错而不死板
    const hash = ((Number(item.id) || 1) * 7) % 5;
    const ratios = [1.42, 1.6, 1.35, 1.68, 1.48];
    return ratios[hash];
};

// 核心分发排版：同时生成 Grid 与 Waterfall 双列数据
const updateDisplayData = (index) => {
    const state = tabStates[index];
    if (!state) return;

    const rawImages = state.images || [];
    const isVip = userStore.isVip;
    const canShowGridAd = !isVip && hasHorizontalAdConfig.value;
    const canShowWfAd = !isVip && hasVerticalAdConfig.value;

    // 1. 构建 Grid 展示数据（广告作为通栏卡片占满整行）
    const gridItems = [];
    let count = 0;
    for (let i = 0; i < rawImages.length; i++) {
        const item = rawImages[i];
        item._uniqueKey = `wall_${item.id}_${i}`;
        gridItems.push(item);
        count++;

        if (canShowGridAd && count > 0 && count % AD_INTERVAL === 0) {
            const adIndex = Math.floor(count / AD_INTERVAL);
            const adId = `grid_ad_${index}_${adIndex}`;
            if (!failedAdIds.has(adId)) {
                gridItems.push({
                    is_ad: true,
                    id: adId,
                    _uniqueKey: adId,
                    adLoaded: false,
                    adError: false,
                });
            }
        }
    }
    state.gridItems = gridItems;

    // 2. 构建 Waterfall 双列平衡数据（竖屏广告直接作为单列卡片穿插进入较短列）
    const leftCol = [];
    const rightCol = [];
    let leftH = 0;
    let rightH = 0;
    let wfCount = 0;

    for (let i = 0; i < rawImages.length; i++) {
        const item = rawImages[i];
        item._uniqueKey = `wall_${item.id}_${i}`;
        const ratio = getItemRatio(item);

        if (leftH <= rightH) {
            leftCol.push(item);
            leftH += ratio;
        } else {
            rightCol.push(item);
            rightH += ratio;
        }
        wfCount++;

        // 每 8 张壁纸后穿插 1 个单列竖屏原生模板卡片广告
        if (canShowWfAd && wfCount > 0 && wfCount % AD_INTERVAL === 0) {
            const adIndex = Math.floor(wfCount / AD_INTERVAL);
            const adId = `wf_ad_${index}_${adIndex}`;
            if (!failedAdIds.has(adId)) {
                const adItem = {
                    is_ad: true,
                    id: adId,
                    _uniqueKey: adId,
                    adLoaded: false,
                    adError: false,
                };
                const adRatio = 1.5; // 竖屏原生模板卡片预估高宽比
                if (leftH <= rightH) {
                    leftCol.push(adItem);
                    leftH += adRatio;
                } else {
                    rightCol.push(adItem);
                    rightH += adRatio;
                }
            }
        }
    }
    state.leftCol = leftCol;
    state.rightCol = rightCol;
};

// 原生模板广告加载成功回调
const onCustomAdLoad = (item, e) => {
    if (item) item.adLoaded = true;
};

// 原生模板广告错误回调 (优雅折叠消除白块与占位)
const onCustomAdError = (item, e) => {
    console.warn('[Ad] 原生模板卡片广告加载失败/未填充，自动隐藏占位:', item?.id, e?.detail);
    if (item?.id) {
        item.adError = true;
        setTimeout(() => {
            failedAdIds.add(item.id);
            tabStates.forEach((_, idx) => updateDisplayData(idx));
        }, 500);
    }
};

// 原生模板广告关闭回调 (App端关闭)
const onCustomAdClose = (item, e) => {
    if (item?.id) {
        setTimeout(() => {
            failedAdIds.add(item.id);
            tabStates.forEach((_, idx) => updateDisplayData(idx));
        }, 500);
    }
};

// --- Data Fetching & Layout Engine ---
const distributeItems = async (index, newItems) => {
    const state = tabStates[index];
    newItems.forEach(item => {
        state.images.push(item);
    });
    updateDisplayData(index);
};

const fetchData = async (index, init = false) => {
    const state = tabStates[index];
    if (!state || state.isLoading || (state.noMoreData && !init)) return;

    if (init) {
        Object.assign(state, {
            images: [],
            gridItems: [],
            leftCol: [],
            rightCol: [],
            pageNum: 1,
            noMoreData: false,
            hasLoaded: true,
        });
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

        if (props.apiType === 'search') {
            // search 类型：只要 query 变化就重置状态，无论当前是否有数据
            Object.assign(state, createTabState(), { lastQueryStr: queryStr });
            if (index === currentIndex.value) activeQueryChanged = true;
        } else if (state.hasLoaded && state.images.length > 0) {
            state.lastQueryStr = queryStr;
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
    const idx = currentIndex.value;
    const state = tabStates[idx];
    // 用 scroll-into-view 跳到顶部锚点，无需操控响应式 scrollTop
    state.scrollIntoViewId = `tab-top-anchor-${idx}`;
    state.oldScrollTop = 0;
    state.showBackTop = false;
    // 跳转生效后清空，避免再次触发
    setTimeout(() => { state.scrollIntoViewId = ''; }, 100);
};

const openPreview = (id, index) => {
    const appStore = useAppStore();
    // 纯壁纸列表（过滤剔除广告对象）
    appStore.wallList = (tabStates[index].images || []).filter(item => !item.is_ad);
    uni.navigateTo({ url: `/pages/app/preview?id=${id}` });
};

// 监听视图模式/列数/VIP 状态变更，重新排版
watch(() => [isWaterfall.value, colCount.value, userStore.isVip], () => {
    tabStates.forEach((_, idx) => {
        updateDisplayData(idx);
    });
});

// --- Lifecycle ---
watch(() => currentIndex.value, (newIdx) => {
    const currentScroll = tabStates[newIdx]?.oldScrollTop || 0;
    headerScrollTop.value = Math.min(currentScroll, props.headerHeight);
    emit('scroll', { scrollTop: currentScroll, index: newIdx });

    if (tabStates[newIdx].images.length === 0) fetchData(newIdx, true);
}, { immediate: true });

import { onShow } from '@dcloudio/uni-app';

onShow(() => {
    const state = tabStates[currentIndex.value];
    if (state && (state.oldScrollTop || 0) > 400) {
        state.showBackTop = true;
    }
});

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

/* 头部 Header (沉浸式毛玻璃 Tabs 工具栏) */
.header-bar {
    position: absolute;
    width: 100%;
    height: 88rpx;
    display: flex;
    align-items: center;
    background: var(--page-background);
    border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);
    will-change: transform;

    .theme-dark & {
        background: var(--page-background);
        border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
        box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.35);
    }
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

            .sort-icon {
                margin-left: 6rpx;
            }
        }
    }
}

.tool-actions {
    padding: 0 20rpx;
    border-left: 1rpx solid rgba(0, 0, 0, 0.05);

    .theme-dark & {
        border-left: 1rpx solid rgba(255, 255, 255, 0.06);
    }

    &.is-single {
        border-left: none;
        width: 100%;
        justify-content: flex-end;
        display: flex;
    }

    .action-btn {
        width: 56rpx;
        height: 56rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 16rpx;
        background: rgba(120, 120, 128, 0.08);
        border: 1rpx solid rgba(0, 0, 0, 0.05);
        transition: transform 0.2s;

        .theme-dark & {
            background: rgba(255, 255, 255, 0.08);
            border: 1rpx solid rgba(255, 255, 255, 0.08);
        }

        &:active {
            transform: scale(0.9);
        }

        .icon-svg {
            width: 34rpx;
            height: 34rpx;
            filter: grayscale(1);
            opacity: 0.8;
        }

        .theme-dark & .icon-svg {
            filter: invert(1) grayscale(1);
        }
    }
}

/* 核心内容区 */
.content-swiper {
    flex: 1;
    width: 100%;
    height: 100%;
}

.tab-scroll-view {
    height: 100%;
    width: 100%;
}

.scroll-content {
    display: flex;
    flex-direction: column;
}

.gallery-wrapper {
    padding: 20rpx;
}

/* 网格布局 */
.grid-layout {
    display: grid;
    gap: 20rpx;
}

/* 瀑布流双列 Flex 布局 */
.waterfall-layout {
    display: flex;
    justify-content: space-between;
    gap: 20rpx;
    align-items: flex-start;

    .waterfall-col {
        flex: 1;
        width: calc(50% - 10rpx);
        display: flex;
        flex-direction: column;
        gap: 20rpx;
    }
}

.ad-custom-card {
    width: 100%;
    border-radius: 28rpx;
    overflow: hidden;
}

/* 卡片 UI (Glassmorphism + 交互) */
.modern-card {
    position: relative;
    width: 100%;
    background: var(--panel-background);
    border-radius: 36rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 16rpx var(--shadow-color);
    transform: translateZ(0);

    &.grid-card {
        height: 580rpx;

        &.is-ad-card {
            grid-column: 1 / -1;
            width: 100%;
            height: auto;
            min-height: 0;
            background: transparent;
            box-shadow: none;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }

    &.wf-card {
        height: auto;

        &.is-ad-card {
            width: 100%;
            height: auto;
            min-height: 0;
            background: transparent;
            box-shadow: none;
            overflow: hidden;
        }
    }

    &.is-ad-card {
        &:not(.is-loaded) {
            position: absolute;
            opacity: 0;
            pointer-events: none;
            height: 0 !important;
            min-height: 0 !important;
            max-height: 0 !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
        }

        &.is-loaded {
            position: relative;
            opacity: 1;
            transition: opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .ad-custom-card {
            width: 100%;
            border-radius: 28rpx;
            overflow: hidden;
        }
    }

    /* 开启 GPU 加速与平滑过渡 */
    transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
                box-shadow 0.25s ease;
    max-height: 2000rpx;
    opacity: 1;
    transform-origin: center center;

    &:active {
        .card-img {
            transform: scale(1.06);
        }
    }

    @media (hover: hover) {
        &:hover {
            .card-img {
                transform: scale(1.06);
            }
        }
    }

    .card-img {
        width: 100%;
        display: block;
        opacity: 0;
        filter: blur(8px);
        transition: opacity 0.4s ease, filter 0.4s ease, transform 0.35s cubic-bezier(0.25, 1, 0.5, 1);

        &.is-loaded {
            opacity: 1;
            filter: blur(0);
        }
    }

    &.grid-card:not(.is-ad-card) .card-img {
        height: 100%;
    }

    .card-overlay {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 160rpx;
        // 贴底极简柔和渐变：仅覆盖底部2行文字保护区，上方完全通透无阴影
        background: linear-gradient(to top, rgba(0, 0, 0, 0.58) 0%, rgba(0, 0, 0, 0.18) 55%, rgba(0, 0, 0, 0) 100%);
        pointer-events: none;

        .theme-light & {
            background: linear-gradient(to top, rgba(0, 0, 0, 0.46) 0%, rgba(0, 0, 0, 0.12) 55%, rgba(0, 0, 0, 0) 100%);
        }
    }

    .card-meta {
        position: absolute;
        left: 18rpx;
        right: 18rpx;
        bottom: 18rpx;
        z-index: 2;
        pointer-events: none;
        color: rgba(248, 250, 252, 0.92);

        .meta-title {
            font-size: 24rpx;
            font-weight: 600;
            line-height: 1.34;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.45);
        }

        .meta-footer {
            margin-top: 10rpx;
            display: flex;
            justify-content: space-between;
            align-items: center;

            .meta-tag {
                background: rgba(15, 23, 42, 0.36);
                border: 1rpx solid rgba(255, 255, 255, 0.14);
                backdrop-filter: blur(8px);
                padding: 3rpx 12rpx;
                border-radius: 20rpx;
                font-size: 18rpx;
                font-weight: 600;
                color: rgba(241, 245, 249, 0.88);
            }

            .meta-score {
                display: flex;
                align-items: center;
                gap: 6rpx;
                font-size: 20rpx;
                color: rgba(203, 213, 225, 0.76);

                .score-text {
                    color: rgba(203, 213, 225, 0.76);
                }
            }
        }
    }

    .card-lock {
        position: absolute;
        top: 20rpx;
        right: 20rpx;
        width: 52rpx;
        height: 52rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(4px);
        z-index: 5;
        box-sizing: border-box;
    }
}

/* 骨架屏 */
.skeleton-wrapper {
    padding: 20rpx;
}

.sk-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20rpx;
}

.sk-waterfall {
    display: flex;
    gap: 20rpx;

    .sk-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 20rpx;
    }
}

.sk-card {
    border-radius: 36rpx;
    background: linear-gradient(90deg, var(--panel-background) 25%, var(--panel-background-strong) 50%, var(--panel-background) 75%);
    background-size: 200% 100%;
    animation: sk-shimmer 1.5s infinite linear;

    &.sk-grid .sk-card {
        height: 500rpx;
    }
}

@keyframes sk-shimmer {
    0% {
        background-position: 200% 0;
    }

    100% {
        background-position: -200% 0;
    }
}

/* 辅助与状态 */
.empty-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;
    pointer-events: none;
}

.empty-state {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100rpx 0;
    box-sizing: border-box;

    .empty-img {
        width: 240rpx;
        height: 240rpx;
    }

    .empty-text {
        margin-top: 24rpx;
        font-size: 28rpx;
        color: var(--text-tertiary);
    }
}

.status-footer {
    padding: 24rpx 0;
}
</style>
