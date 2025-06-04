<template>
    <view class="layout">
        <view class="search">
            <uni-search-bar @confirm="onSearch" @cancel="onClear" @clear="onClear" focus placeholder="搜索" cancelButton="none"
                v-model="queryParams.keyword">
            </uni-search-bar>
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
                    <view class="tab" v-for="tab in searchHistory" :key="tab" @click="clickTab(tab)">{{tab}}</view>
                </view>
            </view>

            <view class="recommend">
                <view class="topTitle">
                    <view class="text">热门搜索</view>
                </view>
                <view class="tabs">
                    <view class="tab" v-for="tab in recommendList" :key="tab" @click="clickTab(tab)">{{tab}}</view>
                </view>
            </view>
        </view>

        <view v-if="noResult" class="noResult">
            <image class="empty-image" src="/common/images/pics/NoImages.svg" mode="aspectFit"></image>
            <text class="text">抱歉，没有找到您想要的搜索结果</text>
        </view>

        <view v-show="classList.length">
            <view class="filter">
                <view class="left">
                    <button size="mini" plain :class="{ active: activeButton === 'recommend' }"
                        @click="onRecommend">推荐</button>
                    <button size="mini" plain :class="{ active: activeButton === 'score' }" @click="onSroce">评分</button>
                    <button size="mini" plain :class="{ active: activeButton === 'date' }" @click="onDateSort">
                        发布日期
                        <view class="icon" v-if="activeButton === 'date'">
                            <uni-icons :type="dateSortAsc ? 'arrow-up' : 'arrow-down'" size="14"
                                color="#28b389"></uni-icons>
                        </view>
                    </button>
                </view>
                <view class="right" @click="onChange">
                    <uni-icons :type="settingStore.switchViewIcon" size="18" color="#28b389"></uni-icons>
                </view>
            </view>

            <!-- <view class="list">
                <navigator :url="`/pages/preview/preview?id=${item.id}`" class="item" v-for="item in classList"
                    :key="item.id">
                    <image :src="item.smallPicurl" mode="aspectFill"></image>
                </navigator>
            </view> -->
            <window-view v-if=" settingStore.options.view === 'window' " :classList="classList"></window-view>
            <waterfall-view v-else :classList="classList"></waterfall-view>
            
            <view class="loadingLayout" v-if="noData || classList.length">
                <uni-load-more :status="noData?'noMore':'loading'" />
            </view>

            <!-- 返回顶部按钮 -->
            <view v-if="showBackToTop" class="backToTop" @click="scrollToTop">
                <uni-icons type="up" size="18" color="#ffffff"></uni-icons>
            </view>
        </view>

    </view>
</template>

<script setup>
    import {
        ref
    } from "vue";
    import {
        onLoad,
        onUnload,
        onReachBottom,
        onPageScroll
    } from "@dcloudio/uni-app";
    import {
        apiSearchData
    } from "@/api/wallpaper.js"
    import {
        picurlHandle
    } from "@/utils/common.js";
    import {PICS_BASE_URL} from "@/common/config.js";
    
    import {
        useSettingStore
    } from '@/stores/setting.js';
    const settingStore = useSettingStore();

    // 查询参数
    const queryParams = ref({
        pageNum: 1,
        pageSize: 12,
        keyword: "",
        sortord: ""
    })
    // 上一次的关键字
    const lastKeyword = ref("");

    // 搜索历史词
    const searchHistory = ref(uni.getStorageSync("searchHistory") || []);

    // 热门搜索词
    const recommendList = ref(["美女", "帅哥", "宠物", "卡通"]);

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

    // 筛选条的激活按钮
    const activeButton = ref("");
    // 筛选条的时间排序按钮
    const dateSortAsc = ref(true);

    const init = (keyword = '', resetShowWordBoard = true, resetNoResult = false, resetClassList = new Array()) => {
        queryParams.value = {
            pageNum: 1,
            pageSize: 12,
            keyword: keyword,
            sortord: ""
        };
        showWordBoard.value = resetShowWordBoard;
        noResult.value = resetNoResult;
        noData.value = false;
        classList.value = resetClassList;

        activeButton.value = "";
    }

    //点击搜索
    const onSearch = () => {
        searchHistory.value = [...new Set([queryParams.value.keyword, ...searchHistory.value])].slice(0, 10);
        uni.setStorageSync("searchHistory", searchHistory.value);
        
        // 如果上次的关键字和当前关键字不同，则清空之前的数据
        if (lastKeyword.value !== queryParams.value.keyword) {
           dateSortAsc.value = true;
           pendingList.value = []
           uni.removeStorageSync("wallList");
        }
        
        init(queryParams.value.keyword);
        searchData();
        
        lastKeyword.value = queryParams.value.keyworkd;
    }

    //点击清除按钮
    const onClear = () => {
        init();
        dateSortAsc.value = true;
        pendingList.value = []
        uni.removeStorageSync("wallList");
    }

    //点击标签进行搜索
    const clickTab = (value) => {
        init(value);
        onSearch();
    }

    //点击清空搜索记录
    const removeHistory = () => {
        uni.showModal({
            title: "是否清空历史搜索？",
            success: res => {
                if (res.confirm) {
                    uni.removeStorageSync("searchHistory");
                    searchHistory.value = []
                }
            }
        })
    }

    const searchData = async () => {
        uni.showLoading()
        try {
            let res = await apiSearchData(queryParams.value);
            let fullData = res.data.map(item => picurlHandle(item, PICS_BASE_URL))
            // pendingList.value.value = [...pendingList.value.value, ...fullData];
            pendingList.value.push(...fullData)
            classList.value = [...pendingList.value]

            uni.setStorageSync("wallList", pendingList.value);

            if (queryParams.value.pageSize > res.data.length) noData.value = true;
            if (res.data.length === 0 && pendingList.value.length === 0) {
                showWordBoard.value = true;
                noResult.value = true;
            } else {
                showWordBoard.value = false;
                noResult.value = false;
            }
        } finally {
            uni.hideLoading()
        }
    }


    const useFilter = () => {

        const onRecommend = () => {
            init(queryParams.value.keyword, showWordBoard.value, noResult.value, [...pendingList.value]);
            queryParams.value.sortord = "random"
            activeButton.value = "recommend";
            dateSortAsc.value = true; // 重置箭头默认向上，不显示

            pendingList.value = []
            searchData()
            scrollToTop()
        }

        const onSroce = () => {
            init(queryParams.value.keyword, showWordBoard.value, noResult.value, [...pendingList.value]);
            queryParams.value.sortord = "score"
            activeButton.value = "score";
            dateSortAsc.value = true; // 重置箭头默认向上，不显示

            pendingList.value = []
            searchData()
            scrollToTop()
        }

        const onDateSort = () => {
            init(queryParams.value.keyword, showWordBoard.value, noResult.value, [...pendingList.value]);
            queryParams.value.sortord = !dateSortAsc.value === true ? "date_asc" : "date_desc"
            activeButton.value = "date"; // 点击，箭头取反
            dateSortAsc.value = !dateSortAsc.value;

            pendingList.value = []
            searchData()
            scrollToTop()
        }

        const onChange = () => {
            settingStore.options.view = settingStore.options.view === "window" ? "waterfall" : "window";
            uni.setStorageSync("view", settingStore.options.view)
        }

        return {
            onRecommend,
            onSroce,
            onDateSort,
            onChange
        };
    }

    const {
        view,
        onRecommend,
        onSroce,
        onDateSort,
        onChange
    } = useFilter();

    //触底加载更多
    onReachBottom(() => {
        if (noData.value) return;
        queryParams.value.pageNum++
        searchData();
    })
    
    //关闭页面
    onUnload(() => {
        uni.removeStorageSync("wallList");
    })


    // 返回到顶部的代码
    const useBackToTop = ()=> {
        // 控制返回顶部按钮的显示
        const showBackToTop = ref(false);
        // 返回顶部
        const scrollToTop = () => {
            uni.pageScrollTo({
                scrollTop: 0,
                duration: 300 // 滚动动画持续时间
            });
        };
        
        return {showBackToTop, scrollToTop};
    }
    const {showBackToTop, scrollToTop} = useBackToTop();
    
    
    // 监听滚动事件
    onPageScroll((e) => {
        // console.log(e.scrollTop, showBackToTop.value);
        showBackToTop.value = e.scrollTop > 200; // 当滚动距离超过200px时显示按钮
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
                background: #F4F4F4;
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

        .filter {
            position: sticky;
            top: 0;
            z-index: 10;
            background-color: #ffffff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 2rpx 8rpx;
            border-top: 1rpx solid #e0e0e0;
            // box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);

            .left {
                display: flex;

                button {
                    // background-color: #f4f4f4;
                    // color: #333;
                    font-size: 28rpx;
                    padding: 10rpx 20rpx;
                    border: none;
                    border-radius: 20rpx;
                    cursor: pointer;
                    margin-right: 10rpx;
                    display: flex;
                    align-items: center;
                    gap: 5rpx;
                    transition: background-color 0.3s ease, color 0.3s ease;

                    // &:hover {
                    //     background-color: #e0e0e0;
                    // }

                    &.active {
                        // background-color: #ffffff;
                        color: #28b389;
                        /* 激活状态文字颜色为绿色 */
                    }

                    .icon {
                        font-size: 24rpx;
                    }
                }
            }

            .right {
                display: flex;
                align-items: center;

                uni-icons {
                    padding-right: 20rpx;
                }
            }
        }

        .backToTop {
            position: fixed;
            bottom: 60rpx;
            right: 30rpx;
            width: 80rpx;
            height: 80rpx;
            background-color: #28b389;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.2);
            cursor: pointer;
            z-index: 1000;
            transition: opacity 0.3s ease;

            &:hover {
                background-color: #1e8a6d;
            }
        }
    }
</style>