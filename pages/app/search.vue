<template>
    <view class="layout" :class="isDark ? 'theme-dark' : 'theme-light'">
        <view class="status-bar-bg" :style="{ height: `${statusBarHeight}px` }"></view>

        <view class="search-shell" :style="{ top: `${statusBarHeight}px`, height: `${titleBarHeight}px` }">
            <view class="search-shell__back" @click="goBack">
                <mdi-icon path="/static/icons/arrow-left.svg" size="20px" :color="isDark ? '#eef5ff' : '#15171c'"></mdi-icon>
            </view>
            <view class="search-box search-box--shell">
                <view class="search-box__icon">
                    <uni-icons type="search" size="18" color="#7f94b8"></uni-icons>
                </view>
                <input
                    v-model="queryParams.keyword"
                    class="search-box__input"
                    :placeholder="t('common.search')"
                    :placeholder-style="isDark ? 'color: #7f94b8' : 'color: rgba(21, 23, 28, 0.4)'"
                    confirm-type="search"
                    @confirm="onSearch"
                />
                <view v-if="queryParams.keyword" class="search-box__clear" @click="clearKeyword">
                    <uni-icons type="clear" size="16" color="#7f94b8"></uni-icons>
                </view>
            </view>
        </view>

        <view class="fill" :style="{ height: `${titleBarHeight}px` }"></view>

        <view class="page-wrap">
            <view v-if="showWordBoard" class="explore-board">
                <view class="section-head">
                    <view class="section-head__title">{{ t('common.hotSearch') }}</view>
                    <uni-icons type="fire-filled" size="16" color="#619aef"></uni-icons>
                </view>
                <view class="keyword-cloud">
                    <view class="keyword-chip" v-for="tab in recommendList" :key="tab" @click="clickTab(tab)">
                        {{ tab }}
                    </view>
                </view>

                <view v-if="searchHistory.length" class="history-block">
                    <view class="section-head">
                        <view class="section-head__title section-head__title--muted">{{ t('common.recentSearch') }}</view>
                        <view class="section-head__action" @click="removeHistory">{{ t('search.clearAll') }}</view>
                    </view>
                    <view class="history-list">
                        <view class="history-item" v-for="tab in searchHistory" :key="tab" @click="clickTab(tab)">
                            <view class="history-item__left">
                                <uni-icons type="refreshempty" size="16" color="#7788a6"></uni-icons>
                                <text>{{ tab }}</text>
                            </view>
                            <uni-icons type="top" size="13" color="#607089"></uni-icons>
                        </view>
                    </view>
                </view>
            </view>

            <view v-else class="list-container">
                <tabbed-pics-view
                    :show-header="true"
                    :tabs="tabs"
                    api-type="search"
                    :hide-header-if-empty="true"
                    @update="onListUpdate"
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
                </tabbed-pics-view>
            </view>
        </view>

        <custom-ad-banner v-if="showWordBoard" class="bottom-ad"></custom-ad-banner>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onUnload, onReachBottom, onPageScroll } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { apiGetSearchData } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useLibraryStore } from '@/stores/library.js';
import { useUserStore } from '@/stores/user.js';
import { getStatusBarHeight, getTitleBarHeight, getNavBarHeight } from '@/utils/system.js';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const isDark = computed(() => settingsStore.options.theme === 'dark');
const libraryStore = useLibraryStore();
const userStore = useUserStore();
const isAdmin = computed(() => !!userStore.isAdmin);

const backToTopRef = ref(null);
const statusBarHeight = ref(getStatusBarHeight() || 0);
const titleBarHeight = ref(56);
const navBarHeight = ref(getNavBarHeight() || 88);

const queryParams = ref({
    pageNum: 1,
    pageSize: 12,
    keyword: '',
    sortord: '',
});
const searchHistory = ref(uni.getStorageSync('searchHistory') || []);
const showWordBoard = ref(true);
const noResult = ref(false);
const activeButton = ref('');
const dateSortAsc = ref(true);
const classList = ref([]);

const onListUpdate = (e) => {
    classList.value = e.images;
};

const tabs = computed(() => [
    {
        label: t('common.recommend'),
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

const syncSearchSortState = () => {
    settingsStore.options.searchSortKey = activeButton.value;
    settingsStore.options.searchDateAsc = dateSortAsc.value;
};

const restoreSearchSortState = () => {
    activeButton.value = settingsStore.options.searchSortKey || '';
    dateSortAsc.value = typeof settingsStore.options.searchDateAsc === 'boolean' ? settingsStore.options.searchDateAsc : false;
};

const recommendList = computed(() => {
    const keywordsString = t('common.hotKeywords');
    return keywordsString.split(',');
});

// Loading state managed by tabbed-pics-view

const init = (keyword = '', resetShowWordBoard = true, resetNoResult = false) => {
    queryParams.value.keyword = keyword;
    queryParams.value.pageNum = 1;
    showWordBoard.value = resetShowWordBoard;
    noResult.value = resetNoResult;
};

const searchData = async () => {
    showWordBoard.value = false;
    noResult.value = false;
};

const onSearch = () => {
    if (!queryParams.value.keyword?.trim()) {
        onClear();
        return;
    }

    searchHistory.value = [...new Set([queryParams.value.keyword, ...searchHistory.value])].slice(0, 10);
    uni.setStorageSync('searchHistory', searchHistory.value);

    init(queryParams.value.keyword);
    searchData();
};

const onClear = () => {
    init();
    uni.removeStorageSync('wallList');
};

const clearKeyword = () => {
    queryParams.value.keyword = '';
    onClear();
};

const clickTab = (value) => {
    queryParams.value.keyword = value;
    onSearch();
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

const onSortQuery = (key) => {
    if (key === 'date') {
        activeButton.value = 'date';
        dateSortAsc.value = !dateSortAsc.value;
    } else {
        activeButton.value = key;
        dateSortAsc.value = false;
    }
    syncSearchSortState();
};

const onChangeColumn = () => {
    settingsStore.options.column = settingsStore.options.column === 3 ? 2 : 3;
};

const onChangeView = () => {
    settingsStore.options.view = settingsStore.options.view === 'window' ? 'waterfall' : 'window';
};

const goBack = () => {
    uni.navigateBack();
};

onReachBottom(() => {
    // 逻辑由 tabbed-pics-view 接管
});

onLoad((options) => {
    if (isAdmin.value) {
        restoreSearchSortState();
    }
    const keyword = decodeURIComponent(options?.keyword || '').trim();
    if (!keyword) return;
    queryParams.value.keyword = keyword;
    onSearch();
});

onUnload(() => {
    uni.removeStorageSync('wallList');
});

onPageScroll(() => {});
</script>

<style lang="scss" scoped>
@import '@/static/styles/theme-variables.scss';

.status-bar-bg {
    background: var(--search-bg);
}

.layout {
    &.theme-light {
        --search-bg: var(--page-background);
        --search-bg-secondary: #ffffff;
        --search-panel: rgba(255, 255, 255, 0.96);
        --search-border: rgba(17, 17, 17, 0.08);
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
        --search-panel: rgba(29, 37, 49, 0.96);
        --search-border: rgba(255, 255, 255, 0.06);
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
    height: 100vh;
    overflow: hidden;
    background: var(--search-bg);
}

.search-shell {
    flex-shrink: 0;
    position: fixed;
    left: 0;
    right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 0 24rpx;
    background: var(--search-bg);
    border-bottom: 1rpx solid var(--search-border);
}

.page-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

.list-container {
    flex: 1;
    min-height: 0;
}

.search-box {
    position: relative;
    min-height: 96rpx;
    display: flex;
    align-items: center;
    border-radius: 24rpx;
    background: var(--search-panel);
    border: 1rpx solid var(--search-border);
    box-shadow: 0 18rpx 40rpx var(--search-shadow);
    padding: 0 22rpx;
}

.search-box--shell {
    flex: 1;
    min-width: 0;
    min-height: 74rpx;
    height: 74rpx;
    border-radius: 20rpx;
    box-shadow: none;
}

.search-box__icon {
    margin-right: 14rpx;
}

.search-box__input {
    flex: 1;
    min-width: 0;
    height: 96rpx;
    color: var(--search-text-main);
    font-size: 28rpx;
}

.search-box--shell .search-box__input {
    height: 74rpx;
    font-size: 26rpx;
}

.search-box__clear {
    width: 40rpx;
    height: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.explore-board {
    margin: 40rpx 24rpx 0;
}

.section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14rpx;
    margin-bottom: 18rpx;
}

.section-head__title {
    font-size: 20rpx;
    font-weight: 800;
    letter-spacing: 4rpx;
    color: var(--search-accent);
    text-transform: uppercase;
}

.section-head__title--muted {
    color: var(--search-text-secondary);
}

.section-head__action {
    font-size: 18rpx;
    font-weight: 700;
    color: var(--search-text-muted);
    text-transform: uppercase;
    letter-spacing: 2rpx;
}

.keyword-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.keyword-chip {
    min-height: 72rpx;
    padding: 0 26rpx;
    border-radius: 999rpx;
    display: inline-flex;
    align-items: center;
    font-size: 24rpx;
    font-weight: 600;
    color: var(--search-text-main);
    background: var(--search-chip-bg);
    border: 1rpx solid var(--search-border);
}

.history-block {
    margin-top: 46rpx;
}

.history-list {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
}

.history-item {
    min-height: 82rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12rpx;
    border-radius: 20rpx;
    background: var(--search-history-bg);
}

.history-item__left {
    display: flex;
    align-items: center;
    gap: 16rpx;
    font-size: 26rpx;
    color: var(--search-text-main);
}

.noResult {
    margin: 52rpx 24rpx 0;
    padding: 54rpx 28rpx;
    // border: 2rpx dashed rgba(97, 154, 239, 0.4);
    // background: rgba(97, 154, 239, 0.06);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    // min-width: 500rpx;
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

.bottom-ad {
    padding: 30rpx;
}
</style>
