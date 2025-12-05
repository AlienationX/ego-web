<template>
    <view class="homeLayout pageBackground">
        <nav-bar :title="$t('index.title')"></nav-bar>

        <view class="banner">
            <swiper indicator-dots indicator-color="rgba(255,255,255,0.5)" indicator-active-color="#fff" autoplay circular>
                <swiper-item v-for="item in bannerList" :key="item.id">
                    <navigator v-if="item.target == 'miniProgram'" :url="item.url" target="miniProgram" :app-id="item.appid">
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
                <text class="text">{{ $t('index.notice') }}</text>
            </view>

            <view class="center">
                <swiper vertical interval="1500" duration="300" autoplay circular>
                    <swiper-item v-for="item in noticeList" :key="item.id">
                        <navigator :url="`/pages/notice/detail?id=${item.id}`">
                            {{ item.title }}
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
                <template #name>{{ $t('index.dailyRecommend') }}</template>
                <template #custom>
                    <view class="date">
                        <!-- <navigator class="button" style="padding-right: 20rpx" url="/pages/access/access">Access</navigator>
                        <navigator class="button" url="/pages/login/login">Login</navigator> -->

                        <button class="button" size="mini" @click="refreshRandom" plain>{{ $t('common.refresh') }}</button>
                        <uni-icons type="calendar" size="18" color="#28b389"></uni-icons>
                        <view class="text">
                            <!-- <uni-dateformat :date="Date.now()" locale='en' format="dd日"></uni-dateformat> -->
                            {{ new Date().getDate().toString().padStart(2, '0') }}{{ $t('common.day') }}
                        </view>
                    </view>
                </template>
            </index-title>

            <view class="content">
                <rotate-loading v-if="!randomDailyList.length" style="height: 100%"></rotate-loading>
                <scroll-view scroll-x>
                    <view class="box" v-for="item in randomDailyList" :key="item.id" @click="goPriview(item.id, randomDailyList)">
                        <image :src="item.smallPicurl" mode="aspectFill"></image>
                    </view>
                </scroll-view>
            </view>
        </view>

        <view class="select" v-for="(classify, idx) in randomRecommendComputed" :key="classify.id">
            <index-title>
                <template #name>{{ classify.name }}</template>
                <template #custom>
                    <navigator class="box" :url="'/pages/classlist/classlist?id=' + classify.id + '&name=' + classify.name">
                        <!-- <view class="text">{{ $t('common.seeAll') }}</view> -->
                        <!-- <uni-icons class="text" type="arrow-right" size="22" color="#999" @click="goClassList(classify.id, classify.name)"></uni-icons> -->
                        <button size="mini" plain class="btn" :class="{ active: false }">{{ $t('common.seeAll') }}</button>
                    </navigator>
                </template>
            </index-title>

            <view class="content">
                <rotate-loading v-if="!classify" style="height: 100%"></rotate-loading>
                <scroll-view scroll-x>
                    <view class="box" v-for="item in classify.data" :key="item.id" @click="goPriview(item.id, classify.data)">
                        <image :src="item.smallPicurl" mode="aspectFill"></image>
                    </view>
                </scroll-view>
            </view>

            <view v-if="idx % 3 === 0">
                <custom-ad-banner style="padding: 30rpx 30rpx 0"></custom-ad-banner>
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
                <template #name>{{ $t('index.categoryRecommend') }}</template>
                <template #custom>
                    <navigator url="/pages/classify/classify" open-type="reLaunch" class="more">{{ $t('common.more') }}+</navigator>
                </template>
            </index-title>

            <rotate-loading v-if="!classifyList.length" style="height: 100%"></rotate-loading>

            <view class="content" v-if="classifyList.length">
                <!-- :item="item",第一个item是和组件绑定传参，第二个item是for循环遍历的值-->
                <classify-item v-for="item in classifyComputed" :key="item.id" :item="item"></classify-item>
                <classify-item :isMore="true"></classify-item>
            </view>
        </view>

        <custom-ad-banner style="padding: 0 30rpx 30rpx"></custom-ad-banner>
    </view>
</template>

<script setup>
    import { ref, computed } from 'vue';
    import { onLoad, onPullDownRefresh, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
    import { apiGetBanner, apiGetRandomDay, apiGetRandomRecommend, apiGetNotice, apiGetClassify } from '@/api/wallpaper.js';
    import { handlePicUrl } from '@/utils/common.js';

    const bannerList = ref([]);
    const randomDailyList = ref([]);
    const randomRecommendList = ref([]);
    const noticeList = ref([]);
    const classifyList = ref([]);

    const randomRecommendComputed = computed(() => {
        return randomRecommendList.value.map((item) => ({
            ...item,
            name: uni.getLocale() === 'en' ? item.name_en : item.name
        }));
    });

    const classifyComputed = computed(() => {
        return classifyList.value.map((item) => ({
            ...item,
            name: uni.getLocale() === 'en' ? item.name_en : item.name
        }));
    });

    const getBanner = async () => {
        let res = await apiGetBanner();
        // bannerList.value = res.data.map(item => {
        //     // 增加picurl字段，存储大图的url地址
        //     return {
        //         ...item,
        //         picurl: item.smallPicurl.replace("_small.webp", ".jpg")
        //     }
        // })
        bannerList.value = res.data.map((item) => handlePicUrl(item));
    };

    const getRandom = async () => {
        let res = await apiGetRandomDay();
        randomDailyList.value = res.data.map((item) => handlePicUrl(item));
    };

    const getRandomRecommend = async () => {
        let res = await apiGetRandomRecommend({ classify_ids: '30,62,2,3,10,12' });
        randomRecommendList.value = res.data.map((classify) => {
            return {
                ...classify,
                data: classify.data.map((item) => handlePicUrl(item))
            };
        });
    };

    const getNotice = async () => {
        let res = await apiGetNotice();
        noticeList.value = res.data;
    };

    const getClassify = async () => {
        let res = await apiGetClassify({
            select: true
        });
        classifyList.value = res.data.map((item) => handlePicUrl(item));
    };

    const goPriview = (id, data) => {
        uni.setStorageSync('wallList', data);
        uni.navigateTo({
            url: '/pages/preview/preview?id=' + id
        });
    };

    const refreshRandom = () => {
        getRandom();
        getRandomRecommend();
    };

    onLoad(() => {
        getBanner();
        getNotice();
        getRandom();
        getRandomRecommend();
        getClassify();
    });

    // 下拉刷新
    onPullDownRefresh(() => {
        console.log('onPullDownRefresh');

        // getBanner();
        // getNotice();
        getRandom();
        getRandomRecommend();
        // getClassify();

        // uni.hideNavigationBarLoading();
        uni.stopPullDownRefresh();
    });

    //分享给好友
    onShareAppMessage((e) => {
        return {
            title: '本我壁纸 - 探索壁纸，亦探索自我',
            path: '/pages/index/index'
        };
    });

    //分享朋友圈
    onShareTimeline(() => {
        return {
            title: '本我壁纸 - 探索壁纸，亦探索自我'
        };
    });
</script>

<style lang="scss" scoped>
    .homeLayout {
        .banner {
            width: 750rpx;
            padding: 0 0 16rpx;

            swiper {
                width: 750rpx;
                height: 360rpx;

                &-item {
                    width: 100%;
                    height: 100%;
                    padding: 20rpx 30rpx;

                    navigator {
                        width: 100%;
                        height: 100%;

                        image {
                            width: 100%;
                            height: 100%;
                            border-radius: 10rpx;
                            // x 偏移量 | y 偏移量 | 阴影模糊半径 | 阴影颜色 */
                            // box-shadow: 0 8px 24rpx rgba(0,0,0,0.15);
                            box-shadow: 0 0 20rpx rgba(0, 0, 0, 0.65);
                        }
                    }
                }
            }
        }

        .notice {
            width: 690rpx;
            height: 72rpx;
            line-height: 80rpx;
            background: #f9f9f9;
            margin: 0 auto;
            border-radius: 80rpx;
            display: flex;
            // x 偏移量 | y 偏移量 | 阴影模糊半径 | 阴影颜色 */
            box-shadow: 0 0px 6rpx rgba(0, 0, 0, 0.05);

            .left {
                width: 140rpx;
                display: flex;
                align-items: center;
                justify-content: center;

                .text {
                    color: $wp-theme-color;
                    font-weight: 600;
                    font-size: 28rpx;
                }
            }

            .center {
                flex: 1;

                swiper {
                    height: 100%;

                    &-item {
                        display: flex;
                        align-items: center;
                        justify-content: left;

                        height: 100%;
                        font-size: 30rpx;
                        color: #666;
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                    }

                    navigator {
                        width: 100%;
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
            padding: 30rpx 0 0 0;

            .date {
                color: #28b389;
                display: flex;
                align-items: center;

                .button {
                    border: 0;
                    font-size: 28rpx;
                    color: $wp-theme-color;
                }

                .text {
                    margin-left: 5rpx;
                    font-size: 28rpx;
                }
            }

            // .text {
            //     margin-left: 5rpx;
            //     color: $uni-text-color-grey;;
            //     font-size: 24rpx;
            // }
            .btn {
                padding: 0rpx 16rpx;
                background-color: $uni-bg-color-grey;
                height: 42rpx;

                border: none;
                border-radius: 40rpx;
                display: flex;
                align-items: center;
                // gap: 5rpx;
                // transition: background-color 0.3s ease, color 0.3s ease;

                &.active {
                    color: #ffffff;
                    background-color: $wp-theme-color;
                    //     font-weight: bold;
                }
            }

            .content {
                width: 720rpx;
                height: 520rpx;
                margin-top: 28rpx;
                margin-left: 30rpx;

                scroll-view {
                    white-space: nowrap;
                    height: 100%;

                    .box {
                        width: 240rpx;
                        height: 100%;
                        display: inline-flex;
                        justify-content: center; /* 水平居中 */
                        align-items: center; /* 垂直居中 */
                        margin-right: 15rpx;

                        image {
                            width: 95%;
                            height: 98%;
                            border-radius: 24rpx;
                            // x 偏移量 | y 偏移量 | 阴影模糊半径 | 阴影颜色 */
                            // box-shadow: 0 8px 24rpx rgba(0,0,0,0.15);
                            box-shadow: 0 0 6rpx rgba(0, 0, 0, 0.85);
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
            padding: 30rpx 0;

            .content {
                margin-top: 30rpx;
                padding: 0 30rpx;
                display: grid;
                gap: 15rpx;
                grid-template-columns: repeat(3, 1fr);
            }

            .more {
                font-size: 28rpx;
                color: $uni-text-color-grey;
            }
        }
    }
</style>
