<template>
    <view class="searchLayout">
        <view class="search">
            <uni-search-bar @confirm="onSearch" @cancel="onClear" @clear="onClear" focus placeholder="搜索"
                v-model="queryParams.keyword">
            </uni-search-bar>
        </view>


        <view v-if="!classList.length || noSearch">
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


        <view class="noSearch" v-if="noSearch">
            <image class="empty-image"
                src="/common/images/pics/NoImages.svg"
                mode="aspectFit"></image>
            <text class="text">抱歉，没有找到您想要的搜索结果</text>
            <!-- <uv-empty mode="search" icon="http://cdn.uviewui.com/uview/empty/search.png"></uv-empty> -->
            <!-- <l-empty image="search" description="没有找到相关内容" /> -->
        </view>

        <view v-else>
            <view class="list">
                <navigator :url="`/pages/preview/preview?id=${item.id}`" class="item" v-for="item in classList"
                    :key="item.id">
                    <image :src="item.smallPicurl" mode="aspectFill"></image>
                </navigator>
            </view>
            <view class="loadingLayout" v-if="noData || classList.length">
                <uni-load-more :status="noData?'noMore':'loading'" />
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
        onReachBottom
    } from "@dcloudio/uni-app";
    import {
        apiSearchData
    } from "@/api/wallpaper.js"
    import {
        addSmallPicurl
    } from "@/utils/common.js";

    //查询参数
    const queryParams = ref({
        pageNum: 1,
        pageSize: 12,
        keyword: ""
    })

    //搜索历史词
    const searchHistory = ref(uni.getStorageSync("searchHistory") || []);

    //热门搜索词
    const recommendList = ref(["美女", "帅哥", "宠物", "卡通"]);

    //没有更多
    const noData = ref(false);
    //没有搜索结果
    const noSearch = ref(false);

    //搜索结果列表
    const classList = ref([]);


    //点击搜索
    const onSearch = () => {
        uni.showLoading()
        searchHistory.value = [...new Set([queryParams.value.keyword, ...searchHistory.value])].slice(0, 10);

        uni.setStorageSync("searchHistory", searchHistory.value);
        initParams(queryParams.value.keyword);
        searchData();
    }

    //点击清除按钮
    const onClear = () => {
        initParams();
    }

    //点击标签进行搜索
    const clickTab = (value) => {
        initParams(value);
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
        try {
            let res = await apiSearchData(queryParams.value);
            let fullData = res.data.map(item => addSmallPicurl(item))
            // classList.value = [...classList.value, ...fullData];
            classList.value.push(...fullData)
            uni.setStorageSync("wallList", classList.value);
            if (queryParams.value.pageSize > res.data.length) noData.value = true;
            if (res.data.length == 0 && classList.value.length == 0) noSearch.value = true;
        } finally {
            uni.hideLoading()
        }

    }

    const initParams = (value = '') => {
        classList.value = [];
        noData.value = false;
        noSearch.value = false;
        queryParams.value = {
            pageNum: 1,
            pageSize: 12,
            keyword: value || ""
        }
    }

    //触底加载更多
    onReachBottom(() => {
        if (noData.value) return;
        queryParams.value.pageNum++
        searchData();
    })

    //关闭有页面
    onUnload(() => {
        uni.removeStorageSync("wallList", classList.value);
    })
</script>

<style lang="scss" scoped>
    .searchLayout {
        .search {
            padding: 0 10rpx;
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

        .noSearch {
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

        .list {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10rpx;
            padding: 10rpx;

            .item {
                height: 440rpx;
                
                image {
                    width: 100%;
                    height: 100%;
                    display: block;
                    border-radius: 10rpx;
                }
            }
        }
    }
</style>