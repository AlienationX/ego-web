<template>
    <view class="layout">
        <view class="status-bar-bg" :style="{ height: `${statusBarHeight}px` }"></view>

        <view class="search-shell" :style="{ top: `${statusBarHeight}px`, height: `${titleBarHeight}px` }">
            <view class="search-shell__back" @click="goBack">
                <mdi-icon path="/static/icons/arrow-left.svg" size="20px" color="#eef5ff"></mdi-icon>
            </view>
            <view class="search-box search-box--shell">
                <view class="search-box__icon">
                    <uni-icons type="search" size="18" color="#7f94b8"></uni-icons>
                </view>
                <input
                    v-model="queryParams.keyword"
                    class="search-box__input"
                    :placeholder="t('common.search')"
                    confirm-type="search"
                    @confirm="onSearch"
                />
                <view v-if="queryParams.keyword" class="search-box__clear" @click="clearKeyword">
                    <uni-icons type="clear" size="16" color="#7f94b8"></uni-icons>
                </view>
            </view>
        </view>

        <view class="fill" :style="{ height: `${navBarHeight}px` }"></view>

        <view class="page-wrap">
            <view v-if="showInitialLoading" class="search-loading-wrap">
                <view class="preview-loading">
                    <view class="preview-loading__glow"></view>
                    <rotate-loading :size="88"></rotate-loading>
                    <view class="preview-loading__text">{{ t('message.loading') }}</view>
                </view>
            </view>

            <template v-else>
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

                <view v-if="noResult" class="noResult">
                    <view class="noResult__icon">
                        <uni-icons type="search" size="56" color="#619aef"></uni-icons>
                    </view>
                    <view class="noResult__title">{{ t('search.noResultTitle') }}</view>
                    <view class="noResult__text">{{ t('common.noResult') }}</view>
                    <view class="noResult__code">Error Code: 404_NOT_FOUND</view>
                </view>

                <template v-if="classList.length">
                    <view class="toolbar" :style="{ top: `${navBarHeight}px` }">
                        <scroll-view scroll-x class="toolbar__chips" show-scrollbar="false">
                            <view class="toolbar__chips-inner">
                                <view
                                    class="toolbar__chip"
                                    :class="{ 'is-active': activeButton === 'recommend' }"
                                    @click="onRecommend"
                                >
                                    {{ t('common.recommend') }}
                                </view>
                                <view class="toolbar__chip" :class="{ 'is-active': activeButton === 'score' }" @click="onScore">
                                    {{ t('common.score') }}
                                </view>
                                <view
                                    class="toolbar__chip"
                                    :class="{ 'is-active': activeButton === 'date' }"
                                    @click="onDateSort"
                                >
                                    <text>{{ t('common.publishDate') }}</text>
                                    <uni-icons
                                        v-if="activeButton === 'date'"
                                        :type="dateSortAsc ? 'arrow-up' : 'arrow-down'"
                                        size="13"
                                        color="#dce8ff"
                                    ></uni-icons>
                                </view>
                            </view>
                        </scroll-view>

                        <view class="toolbar__actions">
                            <view class="toolbar__action" @click="onChangeColumn">
                                <image
                                    class="toolbar__action-icon"
                                    v-if="settingsStore.options.column === 3"
                                    src="/static/icons/numeric-3-box.svg"
                                    mode="aspectFit"
                                ></image>
                                <image
                                    class="toolbar__action-icon"
                                    v-else
                                    src="/static/icons/numeric-2-box.svg"
                                    mode="aspectFit"
                                ></image>
                            </view>
                            <view class="toolbar__action" @click="onChangeView">
                                <image
                                    class="toolbar__action-icon"
                                    v-if="settingsStore.options.view === 'window'"
                                    src="/static/icons/view-grid.svg"
                                    mode="aspectFit"
                                ></image>
                                <image
                                    class="toolbar__action-icon"
                                    v-else
                                    src="/static/icons/view-dashboard.svg"
                                    mode="aspectFit"
                                ></image>
                            </view>
                        </view>
                    </view>

                    <pics-view :classList="classList"></pics-view>

                    <view class="loadingLayout" v-if="noData || classList.length">
                        <uni-load-more :status="noData ? 'noMore' : 'loading'" />
                    </view>
                </template>
            </template>
        </view>

        <back-to-top ref="backToTopRef"></back-to-top>
        <custom-ad-banner v-if="!noResult && !classList.length" class="bottom-ad"></custom-ad-banner>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onUnload, onReachBottom, onPageScroll } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { apiGetSearchData } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { useSettingsStore } from '@/stores/settings.js';
import { getStatusBarHeight, getTitleBarHeight, getNavBarHeight } from '@/utils/system.js';

const { t } = useI18n();
const settingsStore = useSettingsStore();

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
const lastKeyword = ref('');
const searchHistory = ref(uni.getStorageSync('searchHistory') || []);
const showWordBoard = ref(true);
const noResult = ref(false);
const noData = ref(false);
const isLoading = ref(false);
const isPaging = ref(false);
const classList = ref([]);
const pendingList = ref([]);
const activeButton = ref('');
const dateSortAsc = ref(true);

const recommendList = computed(() => {
    const keywordsString = t('common.hotKeywords');
    return keywordsString.split(',');
});

const showInitialLoading = computed(() => isLoading.value && !isPaging.value);

const init = (keyword = '', resetShowWordBoard = true, resetNoResult = false, resetClassList = []) => {
    queryParams.value = {
        pageNum: 1,
        pageSize: 12,
        keyword,
        sortord: '',
    };
    showWordBoard.value = resetShowWordBoard;
    noResult.value = resetNoResult;
    noData.value = false;
    classList.value = resetClassList;
};

const searchData = async () => {
    try {
        isPaging.value = queryParams.value.pageNum > 1 && pendingList.value.length > 0;
        isLoading.value = true;
        const res = await apiGetSearchData(queryParams.value);
        const rows = Array.isArray(res?.data) ? res.data : [];
        const fullData = rows.map((item) => handlePicUrl(item));
        pendingList.value.push(...fullData);
        classList.value = [...pendingList.value];

        uni.setStorageSync('wallList', pendingList.value);

        const totalPages = Number(res?.pagination?.total_pages || 0);
        if (totalPages > 0) {
            noData.value = queryParams.value.pageNum >= totalPages;
        } else {
            noData.value = rows.length < queryParams.value.pageSize;
        }

        if (rows.length === 0 && pendingList.value.length === 0) {
            showWordBoard.value = true;
            noResult.value = true;
        } else {
            showWordBoard.value = false;
            noResult.value = false;
        }
    } finally {
        isLoading.value = false;
        isPaging.value = false;
    }
};

const onSearch = () => {
    if (!queryParams.value.keyword?.trim()) {
        onClear();
        return;
    }

    searchHistory.value = [...new Set([queryParams.value.keyword, ...searchHistory.value])].slice(0, 10);
    uni.setStorageSync('searchHistory', searchHistory.value);

    if (lastKeyword.value !== queryParams.value.keyword) {
        activeButton.value = '';
        dateSortAsc.value = true;
        pendingList.value = [];
        uni.removeStorageSync('wallList');
    }

    init(queryParams.value.keyword);
    searchData();
    lastKeyword.value = queryParams.value.keyword;
};

const onClear = () => {
    init();
    activeButton.value = '';
    dateSortAsc.value = true;
    pendingList.value = [];
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

const runQuery = (sortord) => {
    init(queryParams.value.keyword, showWordBoard.value, noResult.value, [...pendingList.value]);
    queryParams.value.sortord = sortord;
    pendingList.value = [];
    searchData();
    backToTopRef.value?.scrollToTop();
};

const onRecommend = () => {
    activeButton.value = 'recommend';
    dateSortAsc.value = true;
    runQuery('random');
};

const onScore = () => {
    activeButton.value = 'score';
    dateSortAsc.value = true;
    runQuery('score');
};

const onDateSort = () => {
    activeButton.value = 'date';
    dateSortAsc.value = !dateSortAsc.value;
    runQuery(dateSortAsc.value ? 'date_asc' : 'date_desc');
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
    if (noData.value || !classList.value.length) return;
    queryParams.value.pageNum++;
    searchData();
});

onLoad(() => {});

onUnload(() => {
    uni.removeStorageSync('wallList');
});

onPageScroll((e) => {
    backToTopRef.value.showBackToTop = e.scrollTop > 200;
});
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background:
        radial-gradient(circle at top right, rgba(97, 154, 239, 0.18), transparent 24%),
        linear-gradient(180deg, #0b1017 0%, #10161f 32%, #0b1017 100%);
}

.status-bar-bg {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 101;
    background: #0b1017;
}

.search-shell {
    position: fixed;
    left: 0;
    right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 0 24rpx;
    background: #0b1017;
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
}

.search-shell__back {
    width: 68rpx;
    height: 68rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(97, 154, 239, 0.12);
    border: 1rpx solid rgba(97, 154, 239, 0.16);
    flex-shrink: 0;
}

.fill {
    height: 1rpx;
}

.page-wrap {
    padding: 0 0 60rpx;
}

.search-box {
    position: relative;
    min-height: 96rpx;
    display: flex;
    align-items: center;
    border-radius: 24rpx;
    background: rgba(29, 37, 49, 0.96);
    border: 1rpx solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 18rpx 40rpx rgba(0, 0, 0, 0.14);
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
    color: #eef5ff;
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
    color: rgba(97, 154, 239, 0.88);
    text-transform: uppercase;
}

.section-head__title--muted {
    color: rgba(191, 203, 222, 0.72);
}

.section-head__action {
    font-size: 18rpx;
    font-weight: 700;
    color: rgba(151, 164, 186, 0.72);
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
    color: #dbe7ff;
    background: rgba(39, 46, 57, 0.92);
    border: 1rpx solid rgba(255, 255, 255, 0.06);
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
    background: rgba(20, 26, 36, 0.4);
}

.history-item__left {
    display: flex;
    align-items: center;
    gap: 16rpx;
    font-size: 26rpx;
    color: #edf4ff;
}

.noResult {
    margin: 52rpx 24rpx 0;
    padding: 54rpx 28rpx;
    border: 2rpx dashed rgba(97, 154, 239, 0.4);
    background: rgba(97, 154, 239, 0.06);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.noResult__icon {
    margin-bottom: 24rpx;
}

.noResult__title {
    font-size: 32rpx;
    font-weight: 800;
    color: #eef5ff;
    text-transform: uppercase;
}

.noResult__text {
    margin-top: 12rpx;
    font-size: 24rpx;
    color: rgba(190, 202, 220, 0.76);
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
    background: #0b1017;
    border-top: 1rpx solid rgba(255, 255, 255, 0.03);
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.03);
}

.toolbar__chips {
    flex: 1;
    white-space: nowrap;
}

.toolbar__chips-inner {
    display: inline-flex;
    align-items: center;
    gap: 14rpx;
    padding-right: 16rpx;
}

.toolbar__chip {
    min-height: 68rpx;
    padding: 0 26rpx;
    border-radius: 999rpx;
    display: inline-flex;
    align-items: center;
    gap: 8rpx;
    font-size: 24rpx;
    font-weight: 600;
    color: #c2cfdf;
    background: rgba(32, 40, 52, 0.92);
    border: 1rpx solid rgba(255, 255, 255, 0.05);
}

.toolbar__chip.is-active {
    color: #f8fbff;
    background: #619aef;
    border-color: rgba(97, 154, 239, 0.24);
    box-shadow: 0 14rpx 30rpx rgba(97, 154, 239, 0.24);
}

.toolbar__actions {
    display: flex;
    align-items: center;
    gap: 12rpx;
    flex-shrink: 0;
}

.toolbar__action {
    width: 64rpx;
    height: 64rpx;
    border-radius: 18rpx;
    background: rgba(41, 52, 68, 0.96);
    border: 1rpx solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
}

.toolbar__action-icon {
    width: 38rpx;
    height: 38rpx;
    filter: brightness(0) saturate(100%) invert(94%) sepia(10%) saturate(473%) hue-rotate(183deg) brightness(103%)
        contrast(101%);
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
    background:
        radial-gradient(circle at center, rgba(64, 100, 138, 0.18), transparent 28%),
        linear-gradient(180deg, #0a0f15 0%, #0d141d 100%);
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
