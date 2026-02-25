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
                {{ new Date().getHours().toString().padStart(2, '0') }}:{{
                    new Date().getMinutes().toString().padStart(2, '0')
                }}
            </view>
            <view class="date">
                <!-- <uni-dateformat :date="new Date()" format="MM月dd日"></uni-dateformat> -->
                {{ (new Date().getMonth() + 1).toString().padStart(2, '0') }}/{{
                    new Date().getDate().toString().padStart(2, '0')
                }}
            </view>
            <view class="footer" v-if="previewType === 'classic'">
                <view class="box" @click="openInfo">
                    <uni-icons type="info-filled" size="28"></uni-icons>
                    <view class="text">{{ t('common.information') }}</view>
                </view>
                <view class="box" @click="toggleCollect">
                    <uni-icons type="heart-filled" size="28"></uni-icons>
                    <view class="text">{{ currentInfo.is_collect ? t('preview.collected') : t('preview.collect') }}</view>
                </view>
                <view class="box" @click="openScore">
                    <uni-icons type="star-filled" size="28"></uni-icons>
                    <view class="text">{{ currentInfo.score }}</view>
                </view>
                <view class="box" @click="clickDownload">
                    <uni-icons v-if="currentInfo.is_locked" type="locked-filled" size="28"></uni-icons>
                    <uni-icons v-else type="download-filled" size="28"></uni-icons>
                    <view class="text">{{ t('common.download') }}</view>
                </view>
            </view>

            <view class="footer-floating" v-else>
                <view class="right-actions">
                    <view class="action-item" @click="toggleCollect">
                        <uni-icons type="heart-filled" size="36" color="#ffffff"></uni-icons>
                        <view class="action-text">{{ currentInfo.is_collect ? t('preview.collected') : t('preview.collect') }}</view>
                    </view>
                    <view class="action-item" @click="openScore">
                        <uni-icons type="star-filled" size="36" color="#ffffff"></uni-icons>
                        <view class="action-text">{{ currentInfo.score }}</view>
                    </view>
                    <view class="action-item" @click="openInfo">
                        <uni-icons type="info-filled" size="36" color="#ffffff"></uni-icons>
                        <view class="action-text">{{ t('common.information') }}</view>
                    </view>
                    <view class="action-item" @click="clickDownload">
                        <uni-icons v-if="currentInfo.is_locked" type="locked-filled" size="36" color="#ffffff"></uni-icons>
                        <uni-icons v-else type="download-filled" size="36" color="#ffffff"></uni-icons>
                        <view class="action-text">{{ t('common.download') }}</view>
                    </view>
                </view>

                <view class="left-meta">
                    <view class="meta-user">
                        <image class="meta-avatar" :src="publisherAvatar" mode="aspectFill"></image>
                        <text class="meta-user-name">{{ publisherName }}</text>
                    </view>
                    <view class="meta-desc">{{ currentInfo.description || currentInfo.classify_name || '' }}</view>
                </view>
            </view>
        </view>

        <!-- safe-area安全区域设置为false，手机显示底部就不回有空白 -->
        <uni-popup ref="infoPopup" type="bottom" :safe-area="false">
            <view class="infoPopup">
                <view class="popHeader">
                    <view></view>
                    <view class="title">{{ t('preview.wallpaperInfo') }}</view>
                    <view class="close">
                        <uni-icons class="close" type="clear" size="32" @click="closeInfo"></uni-icons>
                    </view>
                </view>
                <scroll-view scroll-y>
                    <view class="content">
                        <view class="row">
                            <view class="label">{{ t('preview.wallpaperId') }}</view>
                            <view class="value" selectable>{{ currentInfo.id }}</view>
                        </view>
                        <view class="row" v-if="currentInfo.classify_name">
                            <view class="label">{{ t('preview.category') }}</view>
                            <view class="value classify">{{ currentInfo.classify_name }}</view>
                        </view>
                        <view class="row" v-if="currentInfo.publisher">
                            <view class="label">{{ t('preview.publisher') }}</view>
                            <view class="value classify">{{ currentInfo.publisher }}</view>
                            <!-- <view class="value classify">{{currentInfo.nickname}}</view> -->
                        </view>
                        <view class="row">
                            <view class="label">{{ t('preview.score') }}</view>
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
                            <view class="label">{{ t('preview.description') }}</view>
                            <view class="value" selectable>{{ currentInfo.description }}</view>
                        </view>
                        <view class="row">
                            <view class="label">{{ t('preview.tags') }}</view>
                            <view class="value tabs">
                                <view class="tab" v-for="tab in currentInfo.tabs_list" :key="tab">
                                    {{ tab }}
                                </view>
                            </view>
                        </view>
                        <view class="copyright">{{ t('message.copyrightStatement') }}</view>

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
                    <view class="title">{{ t('preview.wallpaperRating') }}</view>
                    <uni-icons class="close" type="clear" size="32" @click="closeScore"></uni-icons>
                </view>

                <view class="content">
                    <uni-rate v-model="userScore" allowHalf></uni-rate>
                    <text class="text">{{ userScore }} {{ t('preview.points') }}</text>
                </view>

                <view class="footer">
                    <button type="default" size="mini" plain :disabled="!userScore" @click="submitScore">
                        {{ t('preview.confirmRating') }}
                    </button>
                </view>
            </view>
        </uni-popup>

        <popup-ad-prompt ref="adPopup" :picurl="currentInfo.picurl" :id="currentInfo.id"></popup-ad-prompt>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { onLoad, onUnload, onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app';
import { getStatusBarHeight } from '@/utils/system.js';
import { useAdIntersititial, useAdRewardedVideo } from '@/hooks/useAd.js';
import { downloadPic } from '@/common/core.js';
import { apiPostIncrementViews, apiPostIncrementDownloads, apiPostActions } from '@/api/wallpaper.js';
import { useSettingsStore } from '@/stores/settings.js';

import { useUserStore } from '@/stores/user.js';
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const avatarSeedSalt = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const { t, locale } = useI18n();
const previewType = computed(() => settingsStore.options.previewType || 'classic');
const publisherName = computed(() => currentInfo.value?.publisher || t('common.appName'));
const publisherAvatar = computed(() => {
    const rawPublisher = String(currentInfo.value?.publisher || '')
        .trim()
        .toLowerCase();
    if (rawPublisher === 'bing') return '/static/icons/brands/microsoft-bing.svg';
    if (rawPublisher === 'pokemon') return '/static/icons/pokeball.svg';
    const seed = `${publisherName.value}-${currentInfo.value?.id || 'wall'}-${avatarSeedSalt}`;
    return `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
});

const classList = ref([]);
const wallList = uni.getStorageSync('wallList') || [];
classList.value = wallList.map((item) => {
    // 增加tabs_list字段，将字符串转换成数组
    return {
        ...item,
        is_collect: !!item.is_collect,
        tabs_list: item.tabs.split(','),
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
        return 24;
    }
    return getStatusBarHeight();
};
const goBack = () => {
    uni.navigateBack({
        success: () => {},
        fail: (err) => {
            // 返回失败，直接跳转回首页
            uni.reLaunch({
                url: '/pages/index/index',
            });
        },
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
};
const closeInfo = () => {
    infoPopup.value.close();
    displayAd.value = false;
};

// 点击评分弹窗
const scorePopup = ref(null);
const userScore = ref(0);
const openScore = () => {
    // 如果未登录，跳转到登录，或增加友好提示
    if (Object.keys(userStore.userinfo).length === 0) {
        uni.showModal({
            title: t('common.information'),
            content: t('preview.loginPrompt'),
            cancelText: t('preview.cancel'),
            confirmText: t('preview.login'),
            success: (res) => {
                if (res.confirm) {
                    uni.navigateTo({ url: '/pages/login/login' });
                }
            },
        });
        return; // 未登录时直接返回，不执行后续操作
    }

    userScore.value = currentInfo.value.userScore || 0;
    scorePopup.value.open();
};
const closeScore = () => {
    scorePopup.value.close();
};

const toggleCollect = async () => {
    // 如果未登录，跳转到登录，或增加友好提示
    if (Object.keys(userStore.userinfo).length === 0) {
        uni.showModal({
            title: t('common.information'),
            content: t('preview.loginPrompt'),
            cancelText: t('preview.cancel'),
            confirmText: t('preview.login'),
            success: (res) => {
                if (res.confirm) {
                    uni.navigateTo({ url: '/pages/login/login' });
                }
            },
        });
        return;
    }

    const nextCollect = !currentInfo.value.is_collect;
    try {
        await apiPostActions({
            wall_id: currentInfo.value.id,
            is_collect: nextCollect,
        });

        currentInfo.value.is_collect = nextCollect;
        if (classList.value[currentIndex.value]) {
            classList.value[currentIndex.value].is_collect = nextCollect;
        }

        uni.showToast({
            title: nextCollect ? t('preview.collectSuccess') : t('preview.uncollectSuccess'),
            icon: 'none',
        });
    } catch (error) {
        uni.showToast({
            title: t('preview.collectFailed'),
            icon: 'none',
        });
    }
};

const submitScore = async () => {
    // TODO
    // 接口获取用户评分，没有评分的用户默认为0分
    // userScore.value =
    // let userid = ...  // 获取用户id
    // let {classid, _id: wallId} = currentInfo.value;  // 获取分类id和图片id
    // 然后调用接口请求进行增删改等操作
    const data = {
        wall_id: currentInfo.value.id,
        pic_score: userScore.value,
    };
    try {
        let res = await apiPostActions(data);

        // 图片信息增加用户当前评分。不修改当前壁纸的评分
        // classList.value[currentIndex.value].userScore = userScore.value;
        // uni.setStorageSync('wallList', classList.value);
        uni.showToast({
            title: t('preview.ratingSuccess'),
            icon: 'none',
        });
        closeScore();
    } catch (error) {
        uni.showToast({
            title: t('preview.ratingFailed'),
            icon: 'none',
        });
    }
};

// 点击下载弹窗观看广告
const adPopup = ref(null);

const { createInterstitialAd, showInterstitialAd, destroyInterstitialAd } = useAdIntersititial();
// const { createRewardedVideoAd, showRewardedVideoAd, destroyRewardedVideoAd } = useAdRewardedVideo();
const clickDownload = async () => {
    // #ifdef WEB
    uni.showModal({
        content: t('preview.savePrompt'),
        showCancel: false,
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

    // downloadPic(currentInfo.value.picurl);

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

        // 如果已登录，写入 我的下载 的数据
        if (Object.keys(userStore.userinfo).length > 0) {
            let data = {
                wall_id: currentInfo.value.id,
                is_download: true,
            };

            let res = await apiPostActions(data);
        }
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
        title: t('common.appName'),
        path: '/pages/preview/preview?id=' + currentId.value + '&type=share',
    };
});

//分享朋友圈
onShareTimeline(() => {
    return {
        title: t('common.appName'),
        query: 'id=' + currentId.value + '&type=share',
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
            width: 82vw;
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

        .footer-floating {
            position: absolute;
            bottom: calc(env(safe-area-inset-bottom) + 28rpx);
            width: auto !important;
            height: 420rpx;
            padding: 30rpx 0;

            &::before {
                content: '';
                position: absolute;
                left: -18rpx;
                right: -18rpx;
                bottom: -28rpx;
                height: 240rpx;
                background: linear-gradient(to top, rgba(0, 0, 0, 0.68) 0%, rgba(0, 0, 0, 0.4) 54%, transparent 100%);
                pointer-events: none;
                z-index: 0;
            }

            .right-actions {
                position: absolute;
                right: 8rpx;
                bottom: 48rpx;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 30rpx;
                min-width: 128rpx;
                color: #fff;
                z-index: 2;

                .action-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 8rpx;
                    width: 100%;
                }

                .action-text {
                    font-size: 24rpx;
                    font-weight: 500;
                    text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.5);
                    text-align: center;
                    white-space: nowrap;
                }

                :deep(.uni-icons) {
                    color: #fff !important;
                }
            }

            .left-meta {
                position: absolute;
                left: 44rpx;
                bottom: 88rpx;
                right: 170rpx;
                max-width: none;
                color: #fff;
                text-shadow: 0 3rpx 10rpx rgba(0, 0, 0, 0.55);
                z-index: 2;

                .meta-user {
                    display: flex;
                    align-items: center;
                    gap: 12rpx;
                    margin-bottom: 12rpx;

                    .meta-avatar {
                        width: 44rpx;
                        height: 44rpx;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.95);
                        border: 1rpx solid rgba(255, 255, 255, 0.7);
                    }

                    .meta-user-name {
                        font-size: 30rpx;
                        font-weight: 600;
                        line-height: 1.35;
                        letter-spacing: 0.2rpx;
                    }
                }

                .meta-desc {
                    font-size: 28rpx;
                    line-height: 44rpx;
                    height: 88rpx;
                    font-weight: 400;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    opacity: 0.95;
                }
            }
        }
    }

    .infoPopup {
        background: #fff;
        padding: 30rpx;
        border-radius: 30rpx 30rpx 0 0;
        overflow: hidden;

        // padding-bottom: 30rpx !important; // safe-area关闭后，手动增加相应高度

        .popHeader {
            display: flex;
            justify-content: center;
            align-items: center;

            .title {
                color: $wp-font-color-2;
                font-size: 32rpx;
                font-weight: 600;
                padding: 16rpx 0;
            }

            .close {
                position: absolute;
                top: 18rpx;
                right: 18rpx;
            }
        }

        scroll-view {
            max-height: 60vh;

            .content {
                .row {
                    display: flex;
                    flex-direction: row;
                    align-items: flex-start;
                    padding: 10rpx 0;
                    font-size: 32rpx;
                    line-height: 1.7em;
                    // border-bottom: 1rpx solid #f0f0f0;

                    &:last-child {
                        border-bottom: none;
                    }

                    .label {
                        color: #999;
                        text-align: left;
                        font-size: 28rpx;
                        margin-right: 20rpx;
                        flex-shrink: 0;
                        min-width: 140rpx;
                        font-weight: 500;
                        text-align: right;
                    }

                    .value {
                        flex: 1;
                        text-align: left;
                        font-size: 28rpx;
                        color: #333;
                        line-height: 1.8em;
                    }

                    .classify {
                        color: $wp-theme-color;
                        font-weight: 600;
                    }

                    .rateBox {
                        display: flex;
                        align-items: center;
                        gap: 8rpx;

                        .score {
                            font-size: 28rpx;
                            color: #666;
                            font-weight: 500;
                        }
                    }

                    .tabs {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 12rpx;
                        padding-top: 4rpx;

                        .tab {
                            color: $wp-theme-color;
                            font-size: 22rpx;
                            padding: 6rpx 20rpx;
                            border: 1rpx solid $wp-theme-color;
                            border-radius: 24rpx;
                            line-height: 1.6em;
                            text-align: center;
                            background: rgba(40, 179, 137, 0.05);
                            transition: all 0.3s;
                            white-space: nowrap;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                        }
                    }
                }

                .copyright {
                    font-size: 24rpx;
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
        width: 80vw;
        max-width: 500rpx;
        border-radius: 32rpx;
        box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15);
        overflow: hidden;

        .popHeader {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 10rpx 20rpx 10rpx;
            border-bottom: 1rpx solid #f0f0f0;

            .title {
                font-size: 34rpx;
                font-weight: 700;
                color: #333;
                text-align: center;
                flex: 1;
            }

            .close {
                position: absolute;
                top: 20rpx;
                right: 20rpx;
            }
        }

        .content {
            padding: 40rpx 20rpx;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 24rpx;

            uni-rate {
                transform: scale(1.2);
                margin-bottom: 20rpx;
            }

            .text {
                color: #ffca3e;
                line-height: 1.2em;
                text-align: center;
                white-space: nowrap;
                font-size: 32rpx;
                font-weight: 700;
                background: linear-gradient(135deg, #ffca3e 0%, #ff9a3c 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
        }

        .footer {
            padding: 20rpx 0 10rpx 0;
            display: flex;
            justify-content: center;
            align-items: center;
        }
    }
}
</style>
