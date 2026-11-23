<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 统一固定在顶部的毛玻璃搜索外壳 (单行一体化常驻吸顶) -->
        <view class="search-top-wrapper" :class="{ 'is-exploring': showWordBoard }">
            <view class="search-top-bg"></view>
            <view class="status-bar-bg" :style="{ height: `${statusBarHeight}px` }"></view>
            <!-- #ifdef MP-WEIXIN -->
            <!-- 微信小程序端：未搜索时双行探索，搜索结果时单行一体化对齐胶囊 -->
            <view class="mp-search-container" :class="{ 'is-result': !showWordBoard }">
                <template v-if="showWordBoard">
                    <!-- 探索态第 1 行：导航行 (左侧扁平返回键，右侧胶囊对齐) -->
                    <view class="mp-nav-bar" :style="{ height: `${capsuleRowHeight}px` }">
                        <view class="nav-back-btn nav-back-btn--flat" @click="goBack">
                            <mdi-icon
                                path="/static/icons/arrow-left.svg"
                                size="22px"
                                :color="backIconColor"
                            ></mdi-icon>
                        </view>
                    </view>

                    <!-- 探索态第 2 行：独立全宽搜索框行 -->
                    <view class="mp-search-field-row">
                        <view class="search-box search-box--full">
                            <view class="search-box__left">
                                <mdi-icon
                                    path="/static/icons/magnify.svg"
                                    size="20px"
                                    :color="searchIconColor"
                                ></mdi-icon>
                                <input
                                    v-model="queryParams.keyword"
                                    class="search-box__input"
                                    :placeholder="searchPlaceholder"
                                    :placeholder-style="placeholderStyle"
                                    confirm-type="search"
                                    @confirm="onSearch"
                                    @input="onInput"
                                />
                            </view>
                            <view v-if="queryParams.keyword" class="search-box__clear" @click="clearKeyword">
                                <uni-icons type="clear" size="18" :color="clearIconColor"></uni-icons>
                            </view>
                        </view>
                    </view>
                </template>

                <!-- 搜索结果态：单行一体化，避让微信胶囊 -->
                <template v-else>
                    <view class="search-shell search-shell--mp" :style="mpSearchShellStyle">
                        <view class="nav-back-btn nav-back-btn--flat" @click="goBack">
                            <mdi-icon
                                path="/static/icons/arrow-left.svg"
                                size="20px"
                                :color="backIconColor"
                            ></mdi-icon>
                        </view>
                        <view class="search-box search-box--shell search-box--compact">
                            <view class="search-box__left">
                                <mdi-icon
                                    path="/static/icons/magnify.svg"
                                    size="18px"
                                    :color="searchIconColor"
                                ></mdi-icon>
                                <input
                                    v-model="queryParams.keyword"
                                    class="search-box__input"
                                    :placeholder="searchPlaceholder"
                                    :placeholder-style="placeholderStyle"
                                    confirm-type="search"
                                    @confirm="onSearch"
                                    @input="onInput"
                                />
                            </view>
                            <view v-if="queryParams.keyword" class="search-box__clear" @click="clearKeyword">
                                <uni-icons type="clear" size="16" :color="clearIconColor"></uni-icons>
                            </view>
                        </view>
                        <!-- 排序触发器 -->
                        <view class="sort-trigger" @click="toggleSortMenu">
                            <text class="sort-trigger__text">{{ currentSortLabel }}</text>
                            <mdi-icon
                                :path="isSortMenuOpen ? '/static/icons/chevron-up.svg' : '/static/icons/chevron-down.svg'"
                                size="12px"
                                :color="triggerIconColor"
                            ></mdi-icon>
                        </view>
                        <!-- 视图切换 -->
                        <view class="view-toggle-btn" @click="toggleViewMode">
                            <mdi-icon
                                :path="!isWaterfall ? '/static/icons/view-grid.svg' : '/static/icons/view-dashboard.svg'"
                                size="16px"
                                :color="triggerIconColor"
                            ></mdi-icon>
                        </view>
                    </view>
                </template>
            </view>
            <!-- #endif -->

            <!-- #ifndef MP-WEIXIN -->
            <!-- APP / H5 端：单行满血一体化紧凑布局 -->
            <view class="search-shell" :style="searchShellStyle">
                <view class="nav-back-btn nav-back-btn--flat" @click="goBack">
                    <mdi-icon
                        path="/static/icons/arrow-left.svg"
                        size="22px"
                        :color="backIconColor"
                    ></mdi-icon>
                </view>
                <view class="search-box search-box--shell" :class="{ 'search-box--compact': !showWordBoard }">
                    <view class="search-box__left">
                        <mdi-icon
                            path="/static/icons/magnify.svg"
                            size="20px"
                            :color="searchIconColor"
                        ></mdi-icon>
                        <input
                            v-model="queryParams.keyword"
                            class="search-box__input"
                            :placeholder="searchPlaceholder"
                            :placeholder-style="placeholderStyle"
                            confirm-type="search"
                            @confirm="onSearch"
                            @input="onInput"
                        />
                    </view>
                    <view v-if="queryParams.keyword" class="search-box__clear" @click="clearKeyword">
                        <uni-icons type="clear" size="18" :color="clearIconColor"></uni-icons>
                    </view>
                </view>
                <!-- 仅在搜索结果态展现一体化排序与视图切换 -->
                <template v-if="!showWordBoard">
                    <view class="sort-trigger" @click="toggleSortMenu">
                        <text class="sort-trigger__text">{{ currentSortLabel }}</text>
                        <mdi-icon
                            :path="isSortMenuOpen ? '/static/icons/chevron-up.svg' : '/static/icons/chevron-down.svg'"
                            size="14px"
                            :color="triggerIconColor"
                        ></mdi-icon>
                    </view>
                    <view class="view-toggle-btn" @click="toggleViewMode">
                        <mdi-icon
                            :path="!isWaterfall ? '/static/icons/view-grid.svg' : '/static/icons/view-dashboard.svg'"
                            size="18px"
                            :color="triggerIconColor"
                        ></mdi-icon>
                    </view>
                </template>
            </view>
            <!-- #endif -->
        </view>

        <!-- 排序气泡下拉菜单独立浮层（置于页面顶层，杜绝点击穿透与父级溢出截断） -->
        <view v-if="isSortMenuOpen" class="sort-popover-layer">
            <!-- 全屏透明点击遮罩 -->
            <view class="sort-popover-mask" @click="closeSortMenu"></view>
            <!-- 气泡下拉菜单本体 -->
            <view class="sort-popover" :style="sortPopoverStyle" @click.stop>
                <view
                    v-for="(item, idx) in sortOptions"
                    :key="idx"
                    class="sort-popover__item"
                    :class="{ 'is-active': currentTabIndex === idx }"
                    @click.stop="selectSort(idx)"
                >
                    <text class="sort-popover__label">{{ item.label }}</text>
                    <view class="sort-popover__indicator">
                        <template v-if="item.isDate && currentTabIndex === idx">
                            <mdi-icon
                                :path="dateSortAsc ? '/static/icons/arrow-up.svg' : '/static/icons/arrow-down.svg'"
                                size="14px"
                                :color="activeSortColor"
                            ></mdi-icon>
                        </template>
                        <mdi-icon
                            v-else-if="currentTabIndex === idx"
                            path="/static/icons/check.svg"
                            size="16px"
                            :color="activeSortColor"
                        ></mdi-icon>
                    </view>
                </view>
            </view>
        </view>

        <!-- 探索面板（未搜索状态展示） -->
        <view v-show="showWordBoard" class="explore-wrap" :style="exploreWrapStyle">
            <view class="search-top-fill" :style="{ height: `${navBarHeight}px` }"></view>
            <view class="explore-board">
                <view class="section-head">
                    <view class="section-head__left">
                        <uni-icons type="fire-filled" size="16" color="#ff4d4f"></uni-icons>
                        <view class="section-head__title">{{ t('common.hotSearch') }}</view>
                    </view>
                </view>
                <view class="keyword-cloud">
                    <view class="keyword-chip" v-for="tab in recommendList" :key="tab" @click="clickTab(tab)">
                        <text class="keyword-chip__text">#{{ tab }}</text>
                    </view>
                </view>

                <view v-if="searchHistory.length" class="history-block">
                    <view class="section-head">
                        <view class="section-head__left">
                            <uni-icons type="refreshempty" size="16" color="var(--text-secondary)"></uni-icons>
                            <view class="section-head__title section-head__title--muted">{{ t('common.recentSearch') }}
                            </view>
                        </view>
                        <view class="section-head__actions">
                            <view class="section-head__action" @click="toggleEditHistory">
                                {{ isEditingHistory ? t('common.done') : t('common.edit') }}
                            </view>
                            <view class="section-head__action" @click="removeHistory">
                                {{ t('search.clearAll') }}
                            </view>
                        </view>
                    </view>
                    <view class="history-tags">
                        <view class="history-chip" :class="{ 'is-editing': isEditingHistory }"
                            v-for="tab in searchHistory" :key="tab" @click="clickTab(tab)">
                            <text class="history-chip__text">{{ tab }}</text>
                            <view v-if="isEditingHistory" class="history-chip__delete"
                                @click.stop="deleteHistoryItem(tab)">
                                <uni-icons type="closeempty" size="10" color="var(--text-tertiary)"></uni-icons>
                            </view>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <!-- 搜索结果列表（页面级自然流排版，单行一体化沉浸呈现） -->
        <view v-show="!showWordBoard" class="list-container" :style="{ paddingTop: `${navBarHeight}px` }">
            <modern-pics-view
                ref="picsViewRef"
                :show-header="false"
                :tabs="tabs"
                api-type="search"
                :hide-header-if-empty="true"
                :header-height="0"
                :tabs-height="0"
                :sticky-top="0"
                @change="onTabChange"
            >
                <template #empty>
                    <view class="noResult">
                        <view class="noResult__icon">
                            <uni-icons type="search" size="56" color="#619aef"></uni-icons>
                        </view>
                        <view class="noResult__title">{{ t('search.noResultTitle') }}</view>
                        <view class="noResult__text">{{ t('common.noResult') }}</view>
                        <view class="noResult__code">404_NOT_FOUND</view>
                    </view>
                </template>
            </modern-pics-view>
        </view>

        <!-- 吸底广告（未搜索时展示，搜索结果展示时通过 visible 隐藏，永不卸载以防底层 RAF 崩溃） -->
        <custom-ad-banner :visible="showWordBoard" @height-change="onAdHeightChange"></custom-ad-banner>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onUnload, onReachBottom, onPageScroll } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { useAppStore } from '@/stores/app.js';
import { getStatusBarHeight, getTitleBarHeight } from '@/utils/layout.js';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const appStore = useAppStore();

// 胶囊避让与两端布局测量
const isWeixin = ref(false);
const capsuleWidth = ref(87);
const capsuleHeight = ref(32);
const capsuleRowHeight = ref(44);
const searchRowHeight = ref(56); // 搜索卡片高度 88rpx (~44px) + 上下间距 12px
const statusBarHeight = ref(getStatusBarHeight() || 0);
const titleBarHeight = ref(44);

const updateCapsuleMetrics = () => {
    statusBarHeight.value = getStatusBarHeight() || 0;
    // #ifdef MP-WEIXIN
    isWeixin.value = true;
    try {
        if (uni.getMenuButtonBoundingClientRect) {
            const menuBtn = uni.getMenuButtonBoundingClientRect();
            if (menuBtn && menuBtn.width && menuBtn.top) {
                capsuleWidth.value = menuBtn.width || 87;
                capsuleHeight.value = menuBtn.height || 32;

                const sHeight = getStatusBarHeight() || 0;
                statusBarHeight.value = sHeight;

                // 微信第1行：导航栏高度严格对称包裹胶囊，让返回键与胶囊水平中轴平齐
                const topGap = Math.max(4, menuBtn.top - sHeight);
                capsuleRowHeight.value = capsuleHeight.value + topGap * 2;

                // 微信探索态第2行：独立全宽搜索框行高度 (44px 卡片 + 12px 上下间距)
                searchRowHeight.value = 56;

                // 微信探索态总高度 = 胶囊行高度 + 独立搜索框行高度
                titleBarHeight.value = capsuleRowHeight.value + searchRowHeight.value;
                return;
            }
        }
    } catch (e) {}
    // #endif

    // 非微信端（APP / H5）单行紧凑布局严格对齐标准导航栏 44px (88rpx)
    titleBarHeight.value = 44;
};

updateCapsuleMetrics();

// 动态有效导航栏高度：微信端搜索结果态变为单行 capsuleRowHeight
const effectiveTitleBarHeight = computed(() => {
    // #ifdef MP-WEIXIN
    if (showWordBoard.value) {
        return capsuleRowHeight.value + searchRowHeight.value;
    }
    return capsuleRowHeight.value;
    // #endif
    // #ifndef MP-WEIXIN
    return 44;
    // #endif
});

const navBarHeight = computed(() => statusBarHeight.value + effectiveTitleBarHeight.value);

const searchShellStyle = computed(() => ({
    height: '44px',
}));

const mpSearchShellStyle = computed(() => {
    const pr = capsuleWidth.value > 0 ? capsuleWidth.value + 12 : 100;
    return {
        height: `${capsuleRowHeight.value}px`,
        paddingRight: `${pr}px`,
    };
});

const backIconColor = computed(() => {
    return settingsStore.isDark ? '#f8fbff' : '#1e293b';
});

const searchIconColor = computed(() => {
    return settingsStore.isDark ? 'rgba(247, 247, 251, 0.45)' : 'rgba(30, 41, 59, 0.45)';
});

const clearIconColor = computed(() => {
    return settingsStore.isDark ? 'rgba(247, 247, 251, 0.45)' : 'rgba(30, 41, 59, 0.45)';
});

const triggerIconColor = computed(() => {
    return settingsStore.isDark ? 'rgba(247, 247, 251, 0.78)' : '#334155';
});

const activeSortColor = computed(() => '#619aef');

const searchPlaceholder = computed(() => {
    return t('search.placeholder') || t('common.search') || '搜索壁纸、分类、标签...';
});

const placeholderStyle = computed(() => {
    return settingsStore.isDark
        ? 'color: rgba(247, 247, 251, 0.4); font-size: 26rpx;'
        : 'color: rgba(30, 41, 59, 0.45); font-size: 26rpx;';
});

const queryParams = ref({
    pageNum: 1,
    pageSize: 12,
    keyword: '',
    sortord: '',
});
const searchHistory = ref(uni.getStorageSync('searchHistory') || []);
const showWordBoard = ref(true);
const lastSearchedKeyword = ref('');
const isEditingHistory = ref(false);
const picsViewRef = ref(null);

// ── 单行一体化排序与视图模式 ──
const currentTabIndex = ref(0);
const dateSortAsc = ref(false);
const isSortMenuOpen = ref(false);

const sortOptions = computed(() => [
    { label: t('common.random') || '随机', isDate: false },
    { label: t('common.score') || '评分', isDate: false },
    { label: t('common.publishDate') || '最新', isDate: true },
]);

const currentSortLabel = computed(() => {
    const item = sortOptions.value[currentTabIndex.value];
    if (!item) return '';
    if (item.isDate) {
        return item.label + (dateSortAsc.value ? ' ↑' : ' ↓');
    }
    return item.label;
});

const toggleSortMenu = () => {
    isSortMenuOpen.value = !isSortMenuOpen.value;
};

const closeSortMenu = () => {
    isSortMenuOpen.value = false;
};

const selectSort = (idx) => {
    if (currentTabIndex.value === idx) {
        if (sortOptions.value[idx].isDate) {
            dateSortAsc.value = !dateSortAsc.value;
            picsViewRef.value?.handleTabClick(idx);
        }
    } else {
        currentTabIndex.value = idx;
        picsViewRef.value?.handleTabClick(idx);
    }
    closeSortMenu();
};

const onTabChange = (e) => {
    if (e && typeof e.index === 'number') {
        currentTabIndex.value = e.index;
        if (typeof e.isDateAsc === 'boolean') {
            dateSortAsc.value = e.isDateAsc;
        }
    }
};

const isWaterfall = computed(() => settingsStore.options.view !== 'window');
const toggleViewMode = () => {
    settingsStore.options.view = settingsStore.options.view === 'window' ? 'waterfall' : 'window';
};

const sortPopoverStyle = computed(() => {
    // #ifdef MP-WEIXIN
    const rightOffset = capsuleWidth.value > 0 ? capsuleWidth.value + 16 : 100;
    return {
        top: `${navBarHeight.value + 6}px`,
        right: `${rightOffset}px`,
    };
    // #endif
    // #ifndef MP-WEIXIN
    return {
        top: `${navBarHeight.value + 6}px`,
        right: '24rpx',
    };
    // #endif
});

onReachBottom(() => {
    picsViewRef.value?.loadMore();
});

onPageScroll((e) => {
    picsViewRef.value?.onPageScroll(e);
});

const toggleEditHistory = () => {
    isEditingHistory.value = !isEditingHistory.value;
};

// ── 广告高度，控制底部留白 ──
const adHeight = ref(0);
const onAdHeightChange = (height) => {
    adHeight.value = Math.max(0, Number(height) || 0);
};
const exploreWrapStyle = computed(() => ({
    paddingBottom: showWordBoard.value && adHeight.value > 0 ? `${adHeight.value}px` : '0px',
}));

const tabs = computed(() => [
    {
        label: t('common.random'),
        query: {
            keyword: queryParams.value.keyword,
            sortord: 'random',
        },
    },
    {
        label: t('common.score'),
        query: {
            keyword: queryParams.value.keyword,
            sortord: 'score',
        },
    },
    {
        label: t('common.publishDate'),
        query: {
            keyword: queryParams.value.keyword,
            sortord: 'date_desc',
        },
        isDate: true,
    },
]);

const recommendList = computed(() => {
    const keywordsString = t('common.hotKeywords');
    return keywordsString.split(',');
});

// Loading state managed by tabbed-pics-view

const init = (keyword = '', resetShowWordBoard = true) => {
    queryParams.value.keyword = keyword;
    queryParams.value.pageNum = 1;
    showWordBoard.value = resetShowWordBoard;
};

const searchData = async () => {
    showWordBoard.value = false;
};

const onInput = (e) => {
    const val = (e.detail?.value || queryParams.value.keyword || '').trim();
    if (!val) {
        onClear();
    }
};

const onSearch = () => {
    const keyword = queryParams.value.keyword?.trim() || '';

    if (!keyword) {
        onClear();
        return;
    }

    if (!showWordBoard.value && lastSearchedKeyword.value === keyword) return;

    queryParams.value.keyword = keyword;
    lastSearchedKeyword.value = keyword;

    searchHistory.value = [...new Set([keyword, ...searchHistory.value])].slice(0, 20);
    uni.setStorageSync('searchHistory', searchHistory.value);

    init(keyword, false);
    searchData();
};

const onClear = () => {
    init();
    lastSearchedKeyword.value = '';
    appStore.wallList = [];
    adHeight.value = 0;
};

const clearKeyword = () => {
    queryParams.value.keyword = '';
    onClear();
};

const clickTab = (value) => {
    queryParams.value.keyword = value;
    onSearch();
};

const deleteHistoryItem = (keyword) => {
    searchHistory.value = searchHistory.value.filter((item) => item !== keyword);
    uni.setStorageSync('searchHistory', searchHistory.value);
};

const removeHistory = () => {
    uni.showModal({
        title: t('common.clearHistory'),
        success: (res) => {
            if (res.confirm) {
                uni.removeStorageSync('searchHistory');
                searchHistory.value = [];
            }
        },
    });
};

const goBack = () => {
    uni.navigateBack();
};

onLoad((options) => {
    updateCapsuleMetrics();
    const keyword = decodeURIComponent(options?.keyword || '').trim();
    if (!keyword) return;
    queryParams.value.keyword = keyword;
    onSearch();
});

onUnload(() => {
    appStore.wallList = [];
});
</script>

<style lang="scss" scoped>
.layout {
    &.theme-light {
        --search-bg: var(--page-background);
        --search-bg-secondary: #ffffff;
        --search-panel: #ffffff;
        --search-border: rgba(30, 41, 59, 0.06);
        --search-text-main: #15171c;
        --search-text-secondary: rgba(21, 23, 28, 0.72);
        --search-text-muted: rgba(21, 23, 28, 0.52);
        --search-chip-bg: rgba(0, 0, 0, 0.05);
        --search-history-bg: rgba(0, 0, 0, 0.03);
        --search-accent: #619aef;
        --search-icon-color: #619aef;
        --search-shadow: rgba(19, 25, 39, 0.12);
    }

    &.theme-dark {
        --search-bg: var(--page-background);
        --search-bg-secondary: #16161a;
        --search-panel: #222228;
        --search-border: rgba(255, 255, 255, 0.08);
        --search-text-main: #eef5ff;
        --search-text-secondary: rgba(191, 203, 222, 0.72);
        --search-text-muted: rgba(151, 164, 186, 0.72);
        --search-chip-bg: rgba(39, 46, 57, 0.92);
        --search-history-bg: rgba(20, 26, 36, 0.4);
        --search-accent: #619aef;
        --search-icon-color: #619aef;
        --search-shadow: rgba(0, 0, 0, 0.28);
    }

    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--page-background);
}

.search-top-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
}

.search-top-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    backdrop-filter: blur(32rpx) saturate(180%);
    -webkit-backdrop-filter: blur(32rpx) saturate(180%);
    border: none !important;
    box-shadow: none !important;

    .theme-light & {
        background: rgba(238, 241, 244, 0.85);
        border: none !important;
        box-shadow: none !important;
    }

    .theme-dark & {
        background: rgba(24, 24, 24, 0.85);
        border: none !important;
        box-shadow: none !important;
    }
}

.status-bar-bg {
    position: relative;
    z-index: 1;
    width: 100%;
    background: transparent;
}

/* 微信端双行布局容器 */
.mp-search-container {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
}

.mp-nav-bar {
    position: relative;
    display: flex;
    align-items: center;
    padding: 0 24rpx;
    box-sizing: border-box;
}

.mp-search-field-row {
    padding: 6rpx 24rpx 18rpx;
    box-sizing: border-box;
}

/* APP / H5 端单行满血一体化容器 */
.search-shell {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 0 24rpx;
    box-sizing: border-box;
    height: 88rpx;
    min-height: 88rpx;

    &--mp {
        width: 100%;
        gap: 12rpx;
        padding-left: 20rpx;
    }
}

/* 排序触发按钮 (纯净扁平化，去除厚重胶囊底板) */
.sort-trigger {
    display: flex;
    align-items: center;
    gap: 6rpx;
    height: 64rpx;
    padding: 0 16rpx;
    border-radius: 999rpx;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    flex-shrink: 0;
    cursor: pointer;
    transition: opacity 0.2s ease, transform 0.2s ease;

    &:active {
        opacity: 0.55;
        transform: scale(0.94);
    }

    &__text {
        font-size: 26rpx;
        font-weight: 500;
        color: var(--text-primary);
        white-space: nowrap;
    }
}

/* 视图模式切换按钮 (纯净扁平纯图标，无背景无边框) */
.view-toggle-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    flex-shrink: 0;
    cursor: pointer;
    transition: opacity 0.2s ease, transform 0.2s ease;

    &:active {
        opacity: 0.5;
        transform: scale(0.92);
    }
}

/* 排序气泡下拉菜单浮层 (独立置于全屏顶层，杜绝点击失效与穿透) */
.sort-popover-layer {
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: auto;
}

.sort-popover-mask {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: rgba(0, 0, 0, 0.001); // 微透明保障移动端触摸精准捕获
}

.sort-popover {
    position: absolute;
    z-index: 2;
    min-width: 230rpx;
    padding: 12rpx;
    border-radius: 24rpx;
    background: var(--popup-background);
    border: 1rpx solid var(--popup-border);
    box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(36rpx);
    -webkit-backdrop-filter: blur(36rpx);
    animation: popover-fade-in 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    transform-origin: top right;

    &__item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 72rpx;
        padding: 0 20rpx;
        border-radius: 16rpx;
        cursor: pointer;
        transition: background-color 0.15s ease;

        &:active {
            background: rgba(0, 0, 0, 0.04);
            .theme-dark & {
                background: rgba(255, 255, 255, 0.06);
            }
        }

        &.is-active {
            background: rgba(97, 154, 239, 0.12);

            .sort-popover__label {
                color: #619aef;
                font-weight: 600;
            }
        }
    }

    &__label {
        font-size: 26rpx;
        color: var(--text-primary);
        font-weight: 500;
    }

    &__indicator {
        display: flex;
        align-items: center;
        margin-left: 16rpx;
    }
}

@keyframes popover-fade-in {
    from {
        opacity: 0;
        transform: translateY(-8rpx) scale(0.94);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* 纯净扁平返回按钮 (无背景、无边框、无阴影，仅留纯图标与交互透明度反馈) */
.nav-back-btn--flat {
    width: 68rpx;
    height: 68rpx;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    cursor: pointer;
    flex-shrink: 0;
    transition: opacity 0.2s ease, transform 0.2s ease;

    &:active {
        opacity: 0.5;
        transform: scale(0.92);
    }
}

.search-top-fill {
    width: 100%;
    flex-shrink: 0;
}

.explore-wrap {
    flex: 1;
    width: 100%;
    box-sizing: border-box;
    background: var(--page-background);
}

.list-container {
    position: relative;
    width: 100%;
    min-height: 100vh;
    box-sizing: border-box;
    background: var(--page-background);
}

.list-container :deep(.empty-overlay) {
    top: 40rpx;
}

/* 微信端独立全宽搜索卡片 (扁平极简风格) */
.search-box--full {
    width: 100%;
    height: 84rpx;
    min-height: 84rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20rpx 0 28rpx;
    box-sizing: border-box;
    transition: all 0.2s ease;

    .theme-light & {
        background: rgba(0, 0, 0, 0.04);
        border: 1rpx solid rgba(0, 0, 0, 0.04);
        box-shadow: none;
    }

    .theme-dark & {
        background: rgba(255, 255, 255, 0.08);
        border: 1rpx solid rgba(255, 255, 255, 0.05);
        box-shadow: none;
    }

    &:focus-within {
        border-color: rgba(97, 154, 239, 0.5);
        box-shadow: none !important;
    }
}

/* APP端单行搜索卡片 (扁平极简风格) */
.search-box--shell {
    flex: 1;
    min-width: 0;
    height: 76rpx;
    min-height: 76rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20rpx 0 24rpx;
    box-sizing: border-box;
    transition: all 0.25s cubic-bezier(0.2, 0.9, 0.3, 1);

    &.search-box--compact {
        height: 64rpx;
        min-height: 64rpx;
        padding: 0 16rpx 0 20rpx;
    }

    .theme-light & {
        background: rgba(0, 0, 0, 0.04);
        border: 1rpx solid rgba(0, 0, 0, 0.04);
        box-shadow: none;
    }

    .theme-dark & {
        background: rgba(255, 255, 255, 0.08);
        border: 1rpx solid rgba(255, 255, 255, 0.05);
        box-shadow: none;
    }

    &:focus-within {
        border-color: rgba(97, 154, 239, 0.5);
        box-shadow: none !important;
    }
}

.search-box__left {
    display: flex;
    align-items: center;
    gap: 16rpx;
    flex: 1;
    min-width: 0;
    height: 100%;
}

.search-box__input {
    flex: 1;
    min-width: 0;
    height: 100%;
    font-size: 28rpx;
    font-weight: 500;
    color: var(--search-text-main);
    background: transparent;
    border: none;
}

.search-box__clear {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
    border-radius: 50%;
    margin-left: 8rpx;

    &:active {
        opacity: 0.7;
    }
}

.explore-board {
    margin: 40rpx 24rpx 0;
}

.section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
}

.section-head__left {
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.section-head__title {
    font-size: 26rpx;
    font-weight: 700;
    color: var(--text-secondary);
    letter-spacing: 0.5rpx;
}

.section-head__title--muted {
    color: var(--text-secondary);
}

.section-head__action {
    font-size: 22rpx;
    font-weight: 700;
    color: var(--search-text-muted);
    letter-spacing: 1rpx;
    cursor: pointer;
    transition: opacity 0.2s;

    &:active {
        opacity: 0.7;
    }

    &--danger {
        color: #ff4d4f;
    }
}

.section-head__actions {
    display: flex;
    align-items: center;
    gap: 20rpx;
}

.keyword-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.keyword-chip {
    height: 56rpx;
    box-sizing: border-box;
    padding: 0 24rpx;
    border-radius: 100rpx;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
    font-weight: 600;
    color: var(--text-primary);
    background: var(--panel-background);
    border: 1rpx solid var(--panel-border);
    box-shadow: 0 4rpx 10rpx var(--shadow-color);
    transition: transform 0.2s, opacity 0.2s;
    cursor: pointer;
    white-space: nowrap;

    .theme-dark & {
        background: rgba(255, 255, 255, 0.08);
        border: none;
        box-shadow: none;
    }

    &:active {
        transform: scale(0.95);
        opacity: 0.85;
    }

    &__text {
        line-height: 1;
    }
}

.history-block {
    margin-top: 46rpx;
}

.history-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.history-chip {
    height: 56rpx;
    box-sizing: border-box;
    padding: 0 24rpx;
    border-radius: 100rpx;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    font-size: 24rpx;
    font-weight: 600;
    color: var(--text-primary);
    background: var(--panel-background);
    border: 1rpx solid var(--panel-border);
    box-shadow: 0 4rpx 10rpx var(--shadow-color);
    transition: transform 0.2s, opacity 0.2s, padding 0.2s;
    cursor: pointer;
    white-space: nowrap;

    .theme-dark & {
        background: rgba(255, 255, 255, 0.08);
        border: none;
        box-shadow: none;
    }

    &.is-editing {
        padding: 0 16rpx 0 24rpx;
    }

    &:active {
        transform: scale(0.95);
        opacity: 0.85;
    }

    &__text {
        line-height: 1;
    }

    &__delete {
        width: 28rpx;
        height: 28rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.03);
        transition: background 0.2s;
        flex-shrink: 0;

        .theme-dark & {
            background: rgba(255, 255, 255, 0.08);
        }

        &:active {
            background: rgba(0, 0, 0, 0.1);

            .theme-dark & {
                background: rgba(255, 255, 255, 0.2);
            }
        }
    }
}

.noResult {
    pointer-events: auto;
    margin: 0 24rpx;
    padding: 24rpx 28rpx 40rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 620rpx;
    align-self: center;
    transform: translateY(-32rpx);
}

.noResult__icon {
    margin-bottom: 24rpx;
}

.noResult__title {
    font-size: 42rpx;
    font-weight: 800;
    color: var(--search-text-main);
    text-transform: uppercase;
}

.noResult__text {
    margin-top: 12rpx;
    font-size: 24rpx;
    color: var(--search-text-secondary);
}

.noResult__code {
    margin-top: 18rpx;
    padding: 8rpx 18rpx;
    border: 1rpx solid rgba(97, 154, 239, 0.5);
    background: rgba(97, 154, 239, 0.12);
    font-size: 18rpx;
    color: #619aef;
    letter-spacing: 1rpx;
}

.toolbar {
    position: sticky;
    z-index: 80;
    margin-top: 0;
    margin-bottom: 8rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    padding: 18rpx 24rpx 20rpx;
    background: var(--search-bg);
    border-top: 1rpx solid var(--search-border);
    border-bottom: 1rpx solid var(--search-border);
}

.loadingLayout {
    padding: 26rpx 0 0;
}

.search-loading-wrap {
    min-height: 360rpx;
    position: relative;
    margin: 24rpx 24rpx 0;
}

.preview-loading {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18rpx;
    background: var(--search-bg-secondary);
    z-index: 1;
    border-radius: 28rpx;
}

.preview-loading__glow {
    position: absolute;
    width: 360rpx;
    height: 360rpx;
    border-radius: 999rpx;
    background: radial-gradient(circle, rgba(110, 168, 255, 0.18) 0%, rgba(110, 168, 255, 0) 72%);
    filter: blur(10rpx);
}

.preview-loading__text {
    position: relative;
    z-index: 1;
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.72);
    letter-spacing: 1rpx;
}
</style>
