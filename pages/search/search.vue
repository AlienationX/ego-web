<template>
    <view class="layout">
        <view class="search" v-show="showSearch">
            <uni-search-bar @confirm="onSearch" @cancel="onClear" @clear="onClear" focus placeholder="搜索" cancelButton="none" v-model="queryParams.keyword"></uni-search-bar>
        </view>

        <view v-show="showWordBoard">
            <view class="history" v-if="searchHistory.length">
                <view class="topTitle">
                    <view class="text">最近搜索</view>
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
                    <view class="text">热门搜索</view>
                </view>
                <view class="tabs">
                    <view class="tab" v-for="tab in recommendList" :key="tab" @click="clickTab(tab)">{{ tab }}</view>
                </view>
            </view>
        </view>

        <view v-if="noResult" class="noResult">
            <image class="empty-image" src="/common/images/pics/NoImages.svg" mode="aspectFit"></image>
            <text class="text">抱歉，没有找到您想要的搜索结果</text>
        </view>

        <view v-show="classList.length">
            <!-- <view class="filter">
                <view class="left">
                    <button size="mini" plain :class="{ active: activeButton === 'recommend' }" @click="onRecommend">推荐</button>
                    <button size="mini" plain :class="{ active: activeButton === 'score' }" @click="onSroce">评分</button>
                    <button size="mini" plain :class="{ active: activeButton === 'date' }" @click="onDateSort">
                        发布日期
                        <view class="icon" v-if="activeButton === 'date'">
                            <uni-icons :type="dateSortAsc ? 'arrow-up' : 'arrow-down'" size="14" color="#28b389"></uni-icons>
                        </view>
                    </button>
                </view>
                <view class="right" @click="onChange">
                    <uni-icons :type="settingsStore.switchViewIcon" size="18" color="#28b389"></uni-icons>
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

            <query-panel ref="queryPanelRef" :top="searchHeight + 'px'" @onQuery="onQuery" />

            <!-- <view class="list">
                <navigator :url="`/pages/preview/preview?id=${item.id}`" class="item" v-for="item in classList"
                    :key="item.id">
                    <image :src="item.smallPicurl" mode="aspectFill"></image>
                </navigator>
            </view> -->

            <window-view :classList="classList"></window-view>

            <!-- <window-view v-if=" settingsStore.options.view === 'window' " :classList="classList"></window-view>
            <waterfall-view v-else :classList="classList"></waterfall-view> -->

            <view class="loadingLayout" v-if="noData || classList.length">
                <uni-load-more :status="noData ? 'noMore' : 'loading'" />
            </view>
        </view>

        <back-to-top ref="backToTopRef"></back-to-top>
        <custom-ad-banner v-if="!noResult && !classList.length"></custom-ad-banner>
    </view>
</template>

<script setup>
    import { ref, nextTick } from 'vue';
    import { onLoad, onUnload, onReachBottom, onPageScroll } from '@dcloudio/uni-app';
    import { apiSearchData } from '@/api/wallpaper.js';
    import { handlePicUrl } from '@/utils/common.js';
    import { PICS_BASE_URL } from '@/common/config.js';

    const queryPanelRef = ref(null); // 创建子组件query_panel的引用
    const backToTopRef = ref(null);

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
    const recommendList = ref(['美女', '帅哥', '宠物', '卡通']);

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
            title: '是否清空历史搜索？',
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
            let fullData = res.data.map((item) => handlePicUrl(item, PICS_BASE_URL));
            // pendingList.value.value = [...pendingList.value.value, ...fullData];
            pendingList.value.push(...fullData);
            classList.value = [...pendingList.value];

            uni.setStorageSync('wallList', pendingList.value);

            if (queryParams.value.pageSize > res.data.length) noData.value = true;
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

    //触底加载更多
    onReachBottom(() => {
        if (noData.value) return;
        queryParams.value.pageNum++;
        searchData();
    });

    const searchHeight = ref(0);
    onLoad(() => {
        // 等待 DOM 渲染完成
        nextTick(() => {
            uni.createSelectorQuery()
                .select('.search')
                .boundingClientRect((rect) => {
                    if (rect) {
                        searchHeight.value = rect.height;
                        // 你可以在这里做后续处理，比如设置 filter 的 top
                        console.log('search高度:', searchHeight.value);
                        // 第一种方式使用v-bind方式在css处绑定：v-bind 语法仅在 <style scoped> 并配合 <script setup> 的 CSS 变量时有效
                        // 第二种方式使用內联style样式绑定：<view class="filter" :style="{top: searchHeight + 'px'}">
                    }
                })
                .exec();

            uni.createSelectorQuery()
                .select('div.uni-page-head')
                .boundingClientRect((rect) => {
                    if (rect) {
                        searchHeight.value = rect.height;
                        // 你可以在这里做后续处理，比如设置 filter 的 top
                        console.log('uni-page-head高度:', searchHeight.value);
                        // 第一种方式使用v-bind方式在css处绑定：v-bind 语法仅在 <style scoped> 并配合 <script setup> 的 CSS 变量时有效
                        // 第二种方式使用內联style样式绑定：<view class="filter" :style="{top: searchHeight + 'px'}">
                    }
                })
                .exec();
        });
    });

    //关闭页面
    onUnload(() => {
        uni.removeStorageSync('wallList');
    });

    // TODO 监听滚动事件，向下滚动隐藏搜索框显示查询面板，向上滚动显示搜索框和查询面板
    const showSearch = ref(true);
    let lastScrollTop = 0;
    let lastDirection = 'up'; // 记录上一次滚动方向

    onPageScroll((e) => {
        // TODO 向下浏览：隐藏搜索框，固定筛选器，向上浏览：固定搜索栏，固定筛选器
        backToTopRef.value.showBackToTop = e.scrollTop > 200; // 当滚动距离超过200px时显示按钮
    });
</script>

<style lang="scss" scoped>
    .layout {
        .search {
            padding: 0 10rpx;
            // background-color: #f8f8f8;
            /* 与筛选器颜色一致 */
            // border-bottom: 1rpx solid #e0e0e0;
            // box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);

            position: sticky;
            top: 0;
            z-index: 20;
            background: #ffffff;
            // /* 可选：加阴影提升层次 */
            // box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.06);
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
                background: #f4f4f4;
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
