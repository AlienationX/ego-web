<template>
    <view class="preview" v-if="currentInfo">
        <swiper circular :current="currentIndex" @change="swiperChange">
            <swiper-item v-for="(item, index) in classList" :key="item.id">
                <image v-if="readImgs.includes(index)" @click="maskChange" :src="item.picurl" mode="aspectFill"></image>
            </swiper-item>
        </swiper>

        <view class="mask" v-if="maskState">
            <view class="goBack" :style="{ top: getGoBackButtonTop() + 'px' }" @click="goBack">
                <uni-icons type="back" color="#fff" size="20"></uni-icons>
            </view>
            <view class="count">{{ currentIndex + 1 }} / {{ classList.length }}</view>
            <view class="time">
                <!-- <uni-dateformat :date="new Date()" format="hh:mm"></uni-dateformat> -->
                {{ new Date().getHours().toString().padStart(2, '0') }}:{{ new Date().getMinutes().toString().padStart(2, '0') }}
            </view>
            <view class="date">
                <!-- <uni-dateformat :date="new Date()" format="MM月dd日"></uni-dateformat> -->
                {{ (new Date().getMonth() + 1).toString().padStart(2, '0') }}/{{ new Date().getDate().toString().padStart(2, '0') }}
            </view>
            <view class="footer">
                <view class="box" @click="openInfo">
                    <uni-icons type="info-filled" size="28"></uni-icons>
                    <view class="text">{{ $t('common.information') }}</view>
                </view>
                <view class="box" @click="openScore">
                    <uni-icons type="star-filled" size="28"></uni-icons>
                    <view class="text">{{ currentInfo.score }}</view>
                </view>
                <view class="box" @click="clickDownload">
                    <uni-icons v-if="currentInfo.is_locked" type="locked-filled" size="28"></uni-icons>
                    <uni-icons v-else type="download-filled" size="28"></uni-icons>
                    <view class="text">{{ $t('common.download') }}</view>
                </view>
            </view>
        </view>

        <!-- safe-area安全区域设置为false，手机显示底部就不回有空白 -->
        <uni-popup ref="infoPopup" type="bottom" :safe-area="false">
            <view class="infoPopup">
                <view class="popHeader">
                    <view></view>
                    <view class="title">壁纸信息</view>
                    <view class="close">
                        <uni-icons type="closeempty" size="18" color="#999" @click="closeInfo"></uni-icons>
                    </view>
                </view>
                <scroll-view scroll-y>
                    <view class="content">
                        <view class="row">
                            <view class="label">壁纸ID：</view>
                            <view class="value" selectable>{{ currentInfo.id }}</view>
                        </view>
                        <view class="row" v-if="currentInfo.classify_name">
                            <view class="label">分类：</view>
                            <view class="value classify">{{ currentInfo.classify_name }}</view>
                        </view>
                        <view class="row" v-if="currentInfo.publisher">
                            <view class="label">发布者：</view>
                            <view class="value classify">{{ currentInfo.publisher }}</view>
                            <!-- <view class="value classify">{{currentInfo.nickname}}</view> -->
                        </view>
                        <view class="row">
                            <view class="label">评分：</view>
                            <view class="value rateBox">
                                <uni-rate readonly touchable :value="currentInfo.score"></uni-rate>
                                <text class="score">{{ currentInfo.score }}</text>
                            </view>
                        </view>
                        <!-- <view class="row">
                            <view class="label">预览：</view>
                            <view class="value">{{ currentInfo.views }}</view>
                        </view>
                        <view class="row">
                            <view class="label">下载：</view>
                            <view class="value">{{ currentInfo.downloads }}</view>
                        </view> -->
                        <view class="row" v-if="currentInfo.description">
                            <view class="label">描述：</view>
                            <view class="value" selectable>{{ currentInfo.description }}</view>
                        </view>
                        <view class="row">
                            <view class="label">标签：</view>
                            <view class="value tabs">
                                <view class="tab" v-for="tab in currentInfo.tabs_list" :key="tab">
                                    {{ tab }}
                                </view>
                            </view>
                        </view>
                        <!-- <view class="copyright">{{ $t('message.copyrightStatement') }}</view> -->
                        <view class="copyright">声明：本图片来源于网络，如有侵权可以拷贝壁纸ID及相关证明反馈到邮箱735003439@qq.com，管理员将删除侵权壁纸，维护您的权益。</view>

                        <view v-if="displayAd" class="ad-row">
                            <custom-ad-banner></custom-ad-banner>
                        </view>
                    </view>
                </scroll-view>
            </view>
        </uni-popup>

        <uni-popup ref="scorePopup" :is-mask-click="false">
            <view class="scorePopup">
                <view class="popHeader">
                    <view></view>
                    <view class="title">壁纸评分</view>
                    <view class="close">
                        <uni-icons type="closeempty" size="18" color="#999" @click="closeScore"></uni-icons>
                    </view>
                </view>

                <view class="content">
                    <uni-rate v-model="userScore" allowHalf></uni-rate>
                    <text class="text">{{ userScore }}分</text>
                </view>

                <view class="footer">
                    <button type="default" size="mini" plain :disabled="!userScore" @click="submitScore">确认评分</button>
                </view>
            </view>
        </uni-popup>

        <popup-ad-prompt ref="adPopup" :picurl="currentInfo.picurl" :id="currentInfo.id"></popup-ad-prompt>
    </view>
</template>

<script setup>
    import { ref, computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { onLoad, onUnload, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
    import { getStatusBarHeight } from '@/utils/system.js';
    import { useAdIntersititial, useAdRewardedVideo } from '@/hooks/useAd.js';
    import { downloadPic } from '@/common/core.js';
    import { apiPostIncrementViews, apiPostIncrementDownloads } from '@/api/wallpaper.js';

    import { useUserStore } from '@/stores/user.js';
    const userStore = useUserStore();
    
    const { t, locale } = useI18n();

    const classList = ref([]);
    const wallList = uni.getStorageSync('wallList') || [];
    classList.value = wallList.map((item) => {
        // 增加tabs_list字段，将字符串转换成数组
        return {
            ...item,
            tabs_list: item.tabs.split(',')
        };
    });

    // views字段值+1，请求太频繁，labmda次数不够用，暂时搁置
    const incrementViews = async (id) => {
        // let res = await apiPostIncrementViews(id);
        // console.log('increment views', res);
    };

    // views字段值+1
    const incrementDownloads = async (id) => {
        let res = await apiPostIncrementDownloads(id);
        // console.log('increment downloads', res);
    };

    // 返回按钮高度
    const getGoBackButtonTop = () => {
        if (getStatusBarHeight() === 0) {
            return 15;
        }
        return getStatusBarHeight();
    };
    const goBack = () => {
        uni.navigateBack({
            success: () => {},
            fail: (err) => {
                // 返回失败，直接跳转回首页
                uni.reLaunch({
                    url: '/pages/index/index'
                });
            }
        });
    };

    // 遮罩状态
    const maskState = ref(true);
    const maskChange = () => {
        maskState.value = !maskState.value;
    };

    // 点击信息弹窗
    const infoPopup = ref(null);
    const displayAd = ref(false);
    const openInfo = () => {
        infoPopup.value.open();
        displayAd.value = true;
        console.log(displayAd.value);
    };
    const closeInfo = () => {
        infoPopup.value.close();
        displayAd.value = false;
        console.log(displayAd.value);
    };

    // 点击评分弹窗
    const scorePopup = ref(null);
    const userScore = ref(0);
    const openScore = () => {
        console.log('test open score');
        // userScore.value = currentInfo.value.userScore || 0;
        // scorePopup.value.open();
    };
    const closeScore = () => {
        scorePopup.value.close();
    };
    const submitScore = () => {
        // TODO
        // 接口获取用户评分，没有评分的用户默认为0分
        // userScore.value =
        // let userid = ...  // 获取用户id
        // let {classid, _id: wallId} = currentInfo.value;  // 获取分类id和图片id
        // 然后调用接口请求进行增删改等操作

        console.log(userScore.value);
        // 图片信息增加用户当前评分
        classList.value[currentIndex.value].userScore = userScore.value;
        uni.setStorageSync('wallList', classList.value);
        uni.showToast({
            title: '评分成功',
            icon: 'none'
        });
        closeScore();
    };

    // 点击下载弹窗观看广告
    const adPopup = ref(null);

    const { createInterstitialAd, showInterstitialAd, destroyInterstitialAd } = useAdIntersititial();
    // const { createRewardedVideoAd, showRewardedVideoAd, destroyRewardedVideoAd } = useAdRewardedVideo();
    const clickDownload = () => {
        // #ifdef WEB
        uni.showModal({
            content: '请长按或右键菜单保存壁纸',
            showCancel: false
        });
        // #endif

        // #ifndef WEB
        // 弹出广告，除以5余1的直接下载，除以5的整数倍弹出 激励视频广告，其他弹出 插屏广告-半屏
        // 重启应用，重新计算
        // userStore.downloadCntAdd();
        // if (userStore.downloadCnt % 5 === 1) {
        //     console.log('直接下载');
        //     // showRewardedVideoAd();
        // } else if (userStore.downloadCnt % 5 === 0) {
        //     console.log('弹出 激励视频广告');
        //     showRewardedVideoAd();
        // } else {
        //     console.log('弹出 插屏广告-半屏');
        //     showInterstitialAd();
        // }

        if (currentInfo.value.is_locked) {
            // 弹出观看视频提示框
            adPopup.value.open();
            // downloadPic(currentInfo.value.picurl)
        } else {
            // 展示插屏广告，之后下载图片
            createInterstitialAd(); // 创建插屏广告
            showInterstitialAd(currentInfo.value.picurl);
            destroyInterstitialAd(); // 销毁插屏广告

            incrementDownloads(currentInfo.value.id);
        }
        // #endif
    };

    // 图片节流
    const readImgs = ref([]);

    function readImgsFun() {
        readImgs.value.push(
            currentIndex.value <= 0 ? classList.value.length - 1 : currentIndex.value - 1,
            currentIndex.value,
            currentIndex.value >= classList.value.length ? 0 : currentIndex.value + 1
        );
        // 去重
        readImgs.value = [...new Set(readImgs.value)];
    }

    // OnLoad接收参数
    const currentId = ref(null);
    const currentIndex = ref(0);
    const currentInfo = ref({});
    onLoad((e) => {
        currentId.value = e.id;
        if (e.type === 'share') {
            // TODO
            console.log('分享页接收到的用户需要发送api请求，自己获取数据');
            // let res = apiDetailWall({id: currentId.value});
            // classList.value = res.data;
        }
        currentIndex.value = classList.value.findIndex((item) => item.id === parseInt(currentId.value));
        currentInfo.value = classList.value[currentIndex.value];
        readImgsFun();

        incrementViews(currentInfo.value.id);

        // createInterstitialAd(); // 创建插屏广告
        // createRewardedVideoAd(); // 创建激励视频广告
    });

    onUnload(() => {
        // destroyInterstitialAd(); // 销毁插屏广告
        // destroyRewardedVideoAd(); // 销毁激励视频广告
    });

    // 滑动事件，变化当前数字
    const swiperChange = (e) => {
        currentIndex.value = e.detail.current;
        currentInfo.value = classList.value[currentIndex.value];
        readImgsFun();

        incrementViews(currentInfo.value.id);
    };

    //分享给好友
    onShareAppMessage((e) => {
        // 读取缓存数据的话需要增加type=share，分享到的用户就可以不读缓存，直接读取数据库数据
        return {
            title: '本我壁纸',
            path: '/pages/preview/preview?id=' + currentId.value + '&type=share'
        };
    });

    //分享朋友圈
    onShareTimeline(() => {
        return {
            title: '本我壁纸',
            query: 'id=' + currentId.value + '&type=share'
        };
    });
</script>

<style lang="scss" scoped>
    .preview {
        width: 100%;
        height: 100vh;
        position: relative;

        swiper {
            width: 100%;
            height: 100%;

            image {
                width: 100%;
                height: 100%;
            }
        }

        .mask {
            & > view {
                // goBack\count\time\date\footer都需要绝对定位，统一在这里设
                position: absolute;
                width: fit-content;
                left: 0;
                right: 0;
                margin: auto;
                color: #fff;
            }

            .goBack {
                width: 38px;
                height: 38px;
                background: rgba(0, 0, 0, 0.5);
                left: 30rpx;
                margin-left: 0;
                border-radius: 100rpx;
                backdrop-filter: blur(10rpx);
                border-radius: 1rpx solid rgba(255, 255, 255, 0.3);
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .count {
                top: 10vh;
                background: rgba(0, 0, 0, 0.3);
                font-size: 28rpx;
                border-radius: 40rpx;
                padding: 8rpx 28rpx;
                // backdrop-filter: blur(10rpx);  // 磨砂
            }

            .time {
                top: calc(10vh + 80rpx);
                font-size: 140rpx;
                font-weight: 300;
                line-height: 1em;
                text-shadow: 0 4rpx rgba(0, 0, 0, 0.3);
            }

            .date {
                top: calc(10vh + 230rpx);
                font-size: 34rpx;
                text-shadow: 0 2rpx rgba(0, 0, 0, 0.3);
            }

            .footer {
                background: rgba(255, 255, 255, 0.8);
                bottom: 10vh;
                width: 65vw;
                height: 120rpx;
                border-radius: 120rpx;
                color: #000;
                display: flex;
                justify-content: space-around;
                align-items: center;
                box-shadow: 0 2rpx rgba(0, 0, 0, 0.1);
                backdrop-filter: blur(20rpx);

                .box {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 2rpx 12rpx;

                    // vue深度选择器，强制使用css修改图标颜色
                    :deep() {
                        .uni-icons {
                            // color: $wp-font-color-2 !important;
                        }
                    }

                    .text {
                        font-size: 26rpx;
                        // color: $wp-font-color-2;
                    }
                }
            }
        }

        .popHeader {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .title {
                color: $wp-font-color-2;
                font-size: 28rpx;
            }

            .close {
                // padding: 2px 6rpx;
            }
        }

        .infoPopup {
            background: #fff;
            padding: 30rpx;
            border-radius: 30rpx 30rpx 0 0;
            overflow: hidden;

            padding-bottom: 30rpx !important; // safe-area关闭后，手动增加相应高度

            scroll-view {
                max-height: 60vh;

                .content {
                    .row {
                        display: flex;
                        padding: 16rpx 0;
                        font-size: 32rpx;
                        line-height: 1.7em; // 行高

                        .label {
                            color: $wp-font-color-3;
                            width: 140rpx;
                            text-align: right;
                            font-size: 30rpx;
                        }

                        .value {
                            flex: 1;
                            width: 0;
                        }

                        .classify {
                            color: $wp-theme-color;
                        }

                        .rateBox {
                            display: flex;
                            align-items: center;

                            .score {
                                font-size: 30rpx;
                                color: $wp-font-color-2;
                                padding-left: 10rpx;
                            }
                        }

                        .tabs {
                            display: flex;
                            flex-wrap: wrap;

                            .tab {
                                color: $wp-theme-color;
                                font-size: 22rpx;
                                padding: 10rpx 30rpx;
                                border: 1rpx solid $wp-theme-color;
                                border-radius: 40rpx;
                                line-height: 1em;
                                margin: 0 10rpx 10rpx 0;
                            }
                        }
                    }

                    .copyright {
                        font-size: 28rpx;
                        padding: 20rpx;
                        background: #f6f6f6;
                        color: #666;
                        border-radius: 10rpx;
                        margin: 20rpx 0;
                        line-height: 1.6em;
                    }

                    .ad-row {
                        // width: 100%;
                        // height: 100%;
                    }
                }
            }
        }

        .scorePopup {
            background: #fff;
            padding: 30rpx;
            width: 70vw;
            border-radius: 30rpx;

            .content {
                padding: 30rpx 0;
                display: flex;
                justify-content: center;
                align-items: center;

                .text {
                    color: #ffca3e;
                    padding-left: 10rpx;
                    width: 80rpx;
                    line-height: 1em;
                    text-align: right;
                }
            }

            .footer {
                padding: 10rpx 0;
                display: flex;
                justify-content: center;
                align-items: center;
            }
        }
    }
</style>
