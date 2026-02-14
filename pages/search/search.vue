<template>
    <view class="layout">
        <view class="status-bar-bg" :style="{ height: getStatusBarHeight() + 'px' }"></view>

        <view class="search" :style="{ top: getStatusBarHeight() + 'px', height: getTitleBarHeight() + 'px' }">
            <view class="navbar">
                <view class="left" :style="{ height: getTitleBarHeight() + 'px' }">
                    <view class="back" @click="goBack">
                        <uni-icons type="back" color="#333" size="20"></uni-icons>
                    </view>
                    <!-- 搜索框 默认高度是56px -->
                    <uni-search-bar
                        class="bar"
                        @confirm="onSearch"
                        @cancel="onClear"
                        @clear="onClear"
                        focus
                        :placeholder="$t('common.search')"
                        cancelButton="none"
                        v-model="queryParams.keyword"
                        bgColor="#ffffff"
                    ></uni-search-bar>
                </view>
            </view>
        </view>
        

        <view v-show="showWordBoard" :style="{ marginTop: getNavBarHeight() + 'px' }">
            <view class="history" v-if="searchHistory.length">
                <view class="topTitle">
                    <view class="text">{{ $t('common.recentSearch') }}</view>
                    <view class="icon" @click="removeHistory">
                        <uni-icons type="trash" size="25"></uni-icons>
                    </view>
                </view>
                <view class="tabs">
                    <view class="tab" v-for="tab in searchHistory" :key="tab" @click="clickTab(tab)">{{ tab }}</view>
                </view>
            </view>

            <view class="recommend">
                <view class="topTitle">
                    <view class="text">{{ $t('common.hotSearch') }}</view>
                </view>
                <view class="tabs">
                    <view class="tab" v-for="tab in recommendList" :key="tab" @click="clickTab(tab)">{{ tab }}</view>
                </view>
            </view>
        </view>

        <view v-if="noResult" class="noResult" :style="{ marginTop: getNavBarHeight() + 'px' }">
            <image class="empty-image" src="/static/images/pics/NoImages.svg" mode="aspectFit"></image>
            <text class="text">{{ $t('common.noResult') }}</text>
        </view>

        <view v-show="classList.length" :style="{ marginTop: getNavBarHeight() + 'px' }">
            <!-- <view class="filter">
                <view class="left">
                    <button size="mini" plain :class="{ active: activeButton === 'recommend' }" @click="onRecommend">推荐</button>
                    <button size="mini" plain :class="{ active: activeButton === 'score' }" @click="onSroce">评分</button>
                    <button size="mini" plain :class="{ active: activeButton === 'date' }" @click="onDateSort">
                        发布日期
                        <view class="icon" v-if="activeButton === 'date'">
                            <uni-icons :type="dateSortAsc ? 'arrow-up' : 'arrow-down'" size="14" color="#28B389"></uni-icons>
                        </view>
                    </button>
                </view>
                <view class="right" @click="onChange">
                    <uni-icons :type="settingsStore.switchViewIcon" size="18" color="#28B389"></uni-icons>
                </view>
            </view> -->

            <!-- 自定义组件，传入多个值的参考例子 -->
            <!-- <FilterBar
                :activeButton="activeButton"
                :dateSortAsc="dateSortAsc"
                :switchViewIcon="settingsStore.switchViewIcon"
                :top="searchHeight + 'px'"
                @recommend="onRecommend"
                @score="onSroce"
                @dateSort="onDateSort"
                @change="onChange"
            /> -->

            <query-panel ref="queryPanelRef" :top="getNavBarHeight() + 'px'" @onQuery="onQuery" />

            <!-- <view class="list">
                <navigator :url="`/pages/preview/preview?id=${item.id}`" class="item" v-for="item in classList"
                    :key="item.id">
                    <image :src="item.smallPicurl" mode="aspectFill"></image>
                </navigator>
            </view> -->

            <!-- <window-view :classList="classList"></window-view> -->

            <!-- <window-view v-if="settingsStore.options.view === 'window'" :classList="classList"></window-view>
            <waterfall-view1 v-else :classList="classList"></waterfall-view1> -->
            
            <pics-view :classList="classList" :style="{ marginTop: picsViewTop + 'px'}"></pics-view>

            <view class="loadingLayout" v-if="noData || classList.length">
                <uni-load-more :status="noData ? 'noMore' : 'loading'" />
            </view>
        </view>

        <back-to-top ref="backToTopRef"></back-to-top>
        <custom-ad-banner v-if="!noResult && !classList.length" style="padding: 30rpx;"></custom-ad-banner>
    </view>
</template>

<script setup>
    import { ref, nextTick, computed } from 'vue';
    import { onLoad, onUnload, onReachBottom, onPageScroll } from '@dcloudio/uni-app';
    import { apiSearchData } from '@/api/wallpaper.js';
    import { handlePicUrl } from '@/utils/common.js';
    import { useSettingsStore } from '@/stores/settings.js';
    import { getStatusBarHeight, getTitleBarHeight, getNavBarHeight, getLeftIconWidth } from '@/utils/system.js';
    import { useI18n } from 'vue-i18n';

    const { t } = useI18n();

    const settingsStore = useSettingsStore();

    const queryPanelRef = ref(null); // 创建子组件query_panel的引用
    const backToTopRef = ref(null);

    // 定义一个计算属性来安全地计算 marginTop
    const picsViewTop = computed(() => {
        // 如果 classList 为空，则 marginTop 为 '0'
        if (!classList.value.length) {
            return '0';
        }
        // 如果 classList 不为空，但子组件尚未挂载或未暴露 height，则安全地访问
        // 可选链操作符 ?. 可以确保当 queryPanelRef.value 为 null/undefined 时不报错
        console.log("getNavBarHeight", getNavBarHeight());
        console.log("queryPanelRef", queryPanelRef.value?.height);
        console.log("queryPanelRef px", uni.upx2px(queryPanelRef.value?.height || 0));
        console.log('queryPanelRef.value?.height', getNavBarHeight() + uni.upx2px(queryPanelRef.value?.height || 0));
        return getNavBarHeight() + uni.upx2px(queryPanelRef.value?.height || 0);
    });

    // 查询参数
    const queryParams = ref({
        pageNum: 1,
        pageSize: 12,
        keyword: '',
        sortord: ''
    });
    // 上一次的关键字
    const lastKeyword = ref('');

    // 搜索历史词
    const searchHistory = ref(uni.getStorageSync('searchHistory') || []);

    // 热门搜索词
    const recommendList = computed(() => {
        const keywordsString = t('common.hotKeywords');
        return keywordsString.split(',');
    });

    // 没有单词板
    const showWordBoard = ref(true);
    // 没有搜索结果
    const noResult = ref(false);
    // 没有更多
    const noData = ref(false);

    // 搜索结果最终展示列表
    const classList = ref([]);
    // 搜索结果临时列表，主要是为了解决 filter 按钮切换导致 图片列表 有1秒的空白的问题
    const pendingList = ref([]);

    const init = (keyword = '', resetShowWordBoard = true, resetNoResult = false, resetClassList = new Array()) => {
        queryParams.value = {
            pageNum: 1,
            pageSize: 12,
            keyword: keyword,
            sortord: ''
        };
        showWordBoard.value = resetShowWordBoard;
        noResult.value = resetNoResult;
        noData.value = false;
        classList.value = resetClassList;
    };

    //点击搜索
    const onSearch = () => {
        searchHistory.value = [...new Set([queryParams.value.keyword, ...searchHistory.value])].slice(0, 10);
        uni.setStorageSync('searchHistory', searchHistory.value);

        // 如果上次的关键字和当前关键字不同，则清空之前的数据
        if (lastKeyword.value !== queryParams.value.keyword) {
            queryPanelRef.value.reset(); // 重置查询面板
            pendingList.value = [];
            uni.removeStorageSync('wallList');
        }

        init(queryParams.value.keyword);
        searchData();

        lastKeyword.value = queryParams.value.keyworkd;
    };

    //点击清除按钮
    const onClear = () => {
        init();
        queryPanelRef.value.reset(); // 重置查询面板
        pendingList.value = [];
        uni.removeStorageSync('wallList');
    };

    //点击标签进行搜索
    const clickTab = (value) => {
        init(value);
        onSearch();
    };

    //点击清空搜索记录
    const removeHistory = () => {
        uni.showModal({
            title: t('common.clearHistory'),
            success: (res) => {
                if (res.confirm) {
                    uni.removeStorageSync('searchHistory');
                    searchHistory.value = [];
                }
            }
        });
    };

    const searchData = async () => {
        try {
            uni.showLoading(); // 屏幕中间黑方框中间转圈效果

            let res = await apiSearchData(queryParams.value);
            let fullData = res.data.map((item) => handlePicUrl(item));
            // pendingList.value.value = [...pendingList.value.value, ...fullData];
            pendingList.value.push(...fullData);
            classList.value = [...pendingList.value];

            uni.setStorageSync('wallList', pendingList.value);

            if (queryParams.value.pageNum >= res.pagination.total_pages) noData.value = true;
            if (res.data.length === 0 && pendingList.value.length === 0) {
                showWordBoard.value = true;
                noResult.value = true;
            } else {
                showWordBoard.value = false;
                noResult.value = false;
            }
        } finally {
            uni.hideLoading();
        }
    };

    // 传递给query-panel的方法，供子组件调用
    const onQuery = (sortord) => {
        init(queryParams.value.keyword, showWordBoard.value, noResult.value, [...pendingList.value]);
        queryParams.value.sortord = sortord; // order by 字段：random / score / date_asc /date_desc
        pendingList.value = [];
        searchData();
        backToTopRef.value.scrollToTop();
    };

    const goBack = () => {
        uni.navigateBack();
        // uni.switchTab({
        //     url: '/pages/index/index'
        // });
    };

    //触底加载更多
    onReachBottom(() => {
        if (noData.value) return;
        queryParams.value.pageNum++;
        searchData();
    });

    onLoad(() => {
        // 移除异步获取searchHeight的代码，现在直接使用变量值
    });

    // 关闭页面
    onUnload(() => {
        uni.removeStorageSync('wallList');
    });

    // 监听滚动事件，仅用于显示返回顶部按钮
    onPageScroll((e) => {
        // 当滚动距离超过200px时显示返回顶部按钮
        backToTopRef.value.showBackToTop = e.scrollTop > 200;
    });
</script>

<style lang="scss" scoped>
    .layout {
        background-color: #f5f5f5;
        min-height: 100vh;
        
        .status-bar-bg {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            z-index: 101;
            background: #f5f5f5;
        }

        .search {
            position: fixed;
            left: 0;
            right: 0;
            top: 0;
            z-index: 20;
            background: #f5f5f5;
            // padding: 10rpx 0;
            box-shadow: 0 8rpx 8rpx -4rpx rgba(0, 0, 0, 0.02);
            // border-bottom: 1rpx solid #e8e8e8;

            .navbar {
                display: flex;
                justify-content: space-between;
                align-items: center;

                .left {
                    display: flex;
                    align-items: center;
                    flex: 1;
                    min-width: 0;

                    .back {
                        width: 64rpx;
                        height: 64rpx;
                        background: #fff;
                        border-radius: 50%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        flex-shrink: 0;
                        margin: 0 10rpx 0 30rpx;
                        transition: all 0.3s;
                        
                        &:active {
                            background: #f0f0f0;
                            transform: scale(0.95);
                        }
                    }

                    .bar {
                        flex: 1;
                    }
                }
            }
        }

        .topTitle {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 32rpx;
            color: #999;
        }

        .history {
            padding: 30rpx;
        }

        .recommend {
            padding: 30rpx;
        }

        .tabs {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            padding-top: 20rpx;

            .tab {
                background: #e8e8e8;
                font-size: 28rpx;
                color: #333;
                padding: 10rpx 28rpx;
                border-radius: 50rpx;
                margin-right: 20rpx;
                margin-top: 20rpx;
            }
        }

        .noResult {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: top;
            // min-height: 80vh; /* 确保占据足够空间[1](@ref) */
            opacity: 0.8;
            padding: 40rpx;

            .text {
                font-size: 26rpx;
                color: #999;
            }
        }
    }
</style>
