<template>
    <view class="homeLayout pageBackground">
        <custom-nav-bar title="推荐"></custom-nav-bar>

        <view class="banner">
            <swiper indicator-dots indicator-color="rgba(255,255,255,0.5)" indicator-active-color="#fff" autoplay
                circular>

                <swiper-item v-for="item in bannerList" :key="item.id">

                    <navigator v-if="item.target == 'miniProgram'" :url="item.url" target="miniProgram"
                        :app-id="item.appid">
                        <image :src="item.picurl" mode="aspectFill"></image>
                    </navigator>

                    <navigator v-else :url="`/pages/classlist/classlist?${item.url}`">
                        <image :src="item.picurl" mode="aspectFill"></image>
                    </navigator>

                </swiper-item>
            </swiper>
        </view>

        <view class="notice">
            <view class="left">
                <uni-icons type="sound-filled" size="20" color="#28b389"></uni-icons>
                <text class="text">公告</text>
            </view>

            <view class="center">
                <swiper vertical interval="1500" duration="300" autoplay circular>
                    <swiper-item v-for="item in noticeList" :key="item.id">
                        <navigator :url="`/pages/notice/detail?id=${item.id}`">
                            {{item.title}}
                        </navigator>
                    </swiper-item>
                </swiper>
            </view>

            <view class="right">
                <uni-icons type="right" size="16" color="#333"></uni-icons>
            </view>
        </view>

        <view class="select">
            <index-title>
                <template #name>每日推荐</template>
                <template #custom>
                    <view class="date">
                        <!-- <navigator class="button" style="padding-right: 20rpx;" url="/pages/test/ad-inter">ad1</navigator> -->
                        <!-- <navigator class="button" url="/pages/test/ad-rewarded">ad2</navigator> -->
                        
                        <button class="button" size="mini" @click="refreshRandom" plain>换一批</button>
                        <uni-icons type="calendar" size="18" color="#28b389"></uni-icons>
                        <view class="text">
                            <uni-dateformat :date="Date.now()" format="dd日"></uni-dateformat>
                        </view>
                    </view>
                </template>
            </index-title>
            <view class="content">
                <scroll-view scroll-x>
                    <view class="box" v-for="item in randomList" :key="item.id" @click="goPriview(item.id)">
                        <image :src="item.smallPicurl" mode="aspectFill"></image>
                    </view>
                </scroll-view>
            </view>
        </view>
        
        <!-- <view class="select">
            <index-title>
                <template #name>专题精选</template>
                <template #custom>
                    <view class="date">
                        <button class="button" size="mini" @click="refreshRandom" plain>换一批</button>
                        <uni-icons type="calendar" size="18" color="#28b389"></uni-icons>
                        <view class="text">
                            <uni-dateformat :date="Date.now()" format="dd日"></uni-dateformat>
                        </view>
                    </view>
                </template>
            </index-title>
            <view class="content">
                <scroll-view scroll-x>
                    <view class="box" v-for="item in randomList" :key="item.id" @click="goPriview(item.id)">
                        <image :src="item.smallPicurl" mode="aspectFill"></image>
                    </view>
                </scroll-view>
            </view>
        </view> -->

        <view class="classify">
            <index-title>
                <template #name>分类推荐</template>
                <template #custom>
                    <navigator url="/pages/classify/classify" open-type="reLaunch" class="more">更多+</navigator>
                </template>
            </index-title>
            <view class="content">
                <!-- :item="item",第一个item是和组件绑定传参，第二个item是for循环遍历的值-->
                <classify-item v-for="item in classifyList" :key="item.id" :item="item"></classify-item>
                <classify-item :isMore="true"></classify-item>
            </view>
        </view>

    </view>
</template>

<script setup>
    import {
        ref
    } from "vue";
    import {
        onPullDownRefresh,
        onShareAppMessage,
        onShareTimeline
    } from "@dcloudio/uni-app"
    import {
        apiGetBanner,
        apiGetDayRandom,
        apiGetNotice,
        apiGetClassify
    } from "@/api/wallpaper.js";
    import { picurlHandle } from "@/utils/common.js";
    import { PICS_BASE_URL } from "@/common/config.js";

    const bannerList = ref([]);
    const randomList = ref([]);
    const noticeList = ref([]);
    const classifyList = ref([]);

    const getBanner = async () => {
        let res = await apiGetBanner();
        // bannerList.value = res.data.map(item => {
        //     // 增加picurl字段，存储大图的url地址
        //     return {
        //         ...item,
        //         picurl: item.smallPicurl.replace("_small.webp", ".jpg")
        //     }
        // })
        bannerList.value = res.data.map(item => picurlHandle(item, PICS_BASE_URL));
    }

    const getRandom = async () => {
        let res = await apiGetDayRandom();
        randomList.value = res.data.map(item => picurlHandle(item, PICS_BASE_URL));
    }

    const getNotice = async () => {
        let res = await apiGetNotice({
            select: true
        });
        noticeList.value = res.data;
    }

    const getClassify = async () => {
        let res = await apiGetClassify({
            select: true
        });
        classifyList.value = res.data.map(item => picurlHandle(item, PICS_BASE_URL));;
    }

    const goPriview = (id) => {
        uni.setStorageSync("wallList", randomList.value);
        uni.navigateTo({
            url: "/pages/preview/preview?id=" + id
        })
    }

    const refreshRandom = () => {
        getRandom();
    }

    getBanner();
    getNotice();
    getRandom();
    getClassify();
    
    // 下拉刷新
    onPullDownRefresh(() => {
        console.log("onPullDownRefresh");
        
        // getBanner();
        // getNotice();
        getRandom();
        // getClassify();
    
        // uni.hideNavigationBarLoading();
        uni.stopPullDownRefresh();
    })

    //分享给好友
    onShareAppMessage((e) => {
        return {
            title: "本我壁纸，好看的手机壁纸应用",
            path: "/pages/index/index"
        }
    })

    //分享朋友圈
    onShareTimeline(() => {
        return {
            title: "本我壁纸，好看的手机壁纸应用"
        }
    })
</script>

<style lang="scss" scoped>
    .homeLayout {
        .banner {
            width: 750rpx;
            padding: 30rpx 0;

            swiper {
                width: 750rpx;
                height: 340rpx;

                &-item {
                    width: 100%;
                    height: 100%;
                    padding: 0 30rpx;

                    navigator {
                        width: 100%;
                        height: 100%;

                        image {
                            width: 100%;
                            height: 100%;
                            border-radius: 10rpx;
                        }
                    }
                }
            }

        }

        .notice {
            width: 690rpx;
            height: 80rpx;
            line-height: 80rpx;
            background: #f9f9f9;
            margin: 0 auto;
            border-radius: 80rpx;
            display: flex;

            .left {
                width: 140rpx;
                display: flex;
                align-items: center;
                justify-content: center;

                .text {
                    color: #28b389;
                    font-weight: 600;
                    font-size: 28rpx;
                }
            }

            .center {
                flex: 1;

                swiper {
                    height: 100%;

                    &-item {
                        height: 100%;
                        font-size: 30rpx;
                        color: #666;
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                    }
                }
            }

            .right {
                width: 70rpx;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        }

        .select {
            padding-top: 50rpx;

            .date {
                color: #28b389;
                display: flex;
                align-items: center;

                .button {
                    border: 0;
                    font-size: 28rpx;
                    color: #28b389;
                }

                .text {
                    margin-left: 5rpx;
                    font-size: 28rpx;
                }
            }

            .content {
                width: 720rpx;
                margin-top: 30rpx;
                margin-left: 30rpx;

                scroll-view {
                    white-space: nowrap;

                    .box {
                        width: 200rpx;
                        height: 430rpx;
                        display: inline-block;
                        margin-right: 15rpx;
                        box-shadow: 0 16rpx 32rpx rgba(40, 179, 137, 0.18); // 增加阴影
                        

                        image {
                            width: 100%;
                            height: 100%;
                            border-radius: 10rpx;
                        }
                    }

                    // 最后一个元素的右边距为30rpx，保持一致
                    .box:last-child {
                        margin-right: 30rpx;
                    }

                }
            }
        }
        
        .subject {
            
        }

        .classify {
            padding: 50rpx 0;

            .more {
                font-size: 28rpx;
                color: #888;
            }

            .content {
                margin-top: 30rpx;
                padding: 0 30rpx;
                display: grid;
                gap: 15rpx;
                grid-template-columns: repeat(3, 1fr);
            }
        }
    }
</style>