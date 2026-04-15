<template>
    <view class="homeLayout pageBackground">
        <nav-bar :title="$t('index.title')"></nav-bar>

        <view class="banner">
            <swiper indicator-dots indicator-color="rgba(255,255,255,0.5)" indicator-active-color="#fff" autoplay circular>
                <swiper-item v-for="item in bannerList" :key="item.id">
                    <navigator
                        v-if="item.target == 'miniProgram'"
                        :url="item.url"
                        target="miniProgram"
                        :app-id="item.appid"
                        :class="['banner-card', item.accentClass]"
                    >
                        <image :src="item.picurl" mode="aspectFill"></image>
                        <view class="banner-card__overlay"></view>
                        <view class="banner-card__content">
                            <view class="banner-card__tag-row">
                                <view class="banner-card__tag">{{ item.badge }}</view>
                                <view class="banner-card__target">{{ item.targetLabel }}</view>
                            </view>
                            <view class="banner-card__title">{{ item.title }}</view>
                            <view class="banner-card__desc">{{ item.desc }}</view>
                            <view class="banner-card__meta">
                                <view class="banner-card__meta-chip">{{ item.metaLabel }}</view>
                                <view class="banner-card__meta-arrow">
                                    <uni-icons type="right" size="14" color="#e8eef8"></uni-icons>
                                </view>
                            </view>
                        </view>
                    </navigator>

                    <view v-else :class="['banner-card', item.accentClass]" @click="goBannerPreview(item)">
                        <image :src="item.mediumPicurl" mode="aspectFill"></image>
                        <view class="banner-card__overlay"></view>
                        <view class="banner-card__content">
                            <view class="banner-card__tag-row">
                                <view class="banner-card__tag">{{ item.badge }}</view>
                                <view class="banner-card__target">{{ item.targetLabel }}</view>
                            </view>
                            <view class="banner-card__title">{{ item.title }}</view>
                            <view class="banner-card__desc">{{ item.desc }}</view>
                            <view class="banner-card__meta">
                                <view class="banner-card__meta-chip">{{ item.metaLabel }}</view>
                                <view class="banner-card__meta-arrow">
                                    <uni-icons type="right" size="14" color="#e8eef8"></uni-icons>
                                </view>
                            </view>
                        </view>
                    </view>
                </swiper-item>
            </swiper>
        </view>

        <view class="notice">
            <view class="left">
                <uni-icons type="sound-filled" size="20" color="#28B389"></uni-icons>
                <text class="text">{{ $t('index.notice') }}</text>
            </view>

            <view class="center">
                <swiper vertical interval="1500" duration="300" autoplay circular>
                    <swiper-item v-for="item in noticeList" :key="item.id">
                        <navigator :url="`/pages/app/notice-detail?id=${item.id}&name=${item.title}`">
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
            <view class="select-watermark">Daily</view>
            <index-title>
                <template #name>{{ $t('index.dailyRecommend') }}</template>
                <template #custom>
                    <view class="date">
                        <button class="button is-spotlight" size="mini" @click="refreshRandom" plain>{{ $t('common.refresh') }}</button>
                        <uni-icons type="calendar" size="18" color="#666"></uni-icons>
                        <view class="text">
                            {{ new Date().getDate().toString().padStart(2, '0') }}{{ $t('common.day') }}
                        </view>
                    </view>
                </template>
            </index-title>

            <view class="content">
                <rotate-loading v-if="!randomDailyList.length" style="height: 100%"></rotate-loading>
                <scroll-view scroll-x>
                    <view
                        class="box"
                        v-for="(item, idx) in randomDailyList"
                        :key="item.id"
                        :class="{ 'is-hero': idx === 0 }"
                        @click="goPreview(item.id, randomDailyList)"
                    >
                        <image :src="idx === 0 ? (item.mediumPicurl || item.picurl) : item.smallPicurl" mode="aspectFill"></image>
                        <block v-if="idx === 0">
                            <view class="box-hero-overlay"></view>
                            <view class="box-hero-content">
                                <view class="day-tag">{{ new Date().getDate() }}</view>
                                <view class="pick-text">PICK OF THE DAY</view>
                            </view>
                        </block>
                        <view v-else class="box-info">
                            <view class="label">Today</view>
                            <view class="value">{{ $t('index.dailyRecommend') }}</view>
                        </view>
                    </view>
                </scroll-view>
            </view>
        </view>

        <view class="select">
            <view class="select-watermark">Latest</view>
            <index-title>
                <template #name>{{ $t('index.latestRelease') }}</template>
                <template #custom>
                    <navigator class="box" url="/pages/app/timeline">
                        <button size="mini" plain class="btn is-default">{{ $t('common.seeAll') }}</button>
                    </navigator>
                </template>
            </index-title>

            <view class="content">
                <rotate-loading v-if="!latestList.length" style="height: 100%"></rotate-loading>
                <scroll-view scroll-x>
                    <view class="box" v-for="(item, idx) in latestPreviewList" :key="item.id" @click="goPreview(item.id, latestList)">
                        <image :src="item.smallPicurl" mode="aspectFill"></image>
                        <view v-if="idx < 3" class="box-badge">New</view>
                        <view class="box-info">
                            <view class="label">Explore</view>
                            <view class="value">{{ $t('index.latestRelease') }}</view>
                        </view>
                    </view>
                </scroll-view>
            </view>
        </view>

        <navigator class="top-entry" url="/pages/app/topN">
            <view class="top-entry__content">
                <!-- <view class="top-entry__eyebrow">Top N</view> -->
                <view class="top-entry__title">{{ $t('top10.title') }}</view>
                <view class="top-entry__desc">{{ $t('top10.descViews') }}</view>
                <view class="top-entry__action">
                    <text class="top-entry__action-text">{{ $t('common.seeAll') }}</text>
                    <uni-icons type="right" size="18" color="#ffffff"></uni-icons>
                </view>
            </view>
            <image
                class="top-entry__visual"
                src="/static/images/inset/1699281368061_2-removebg-preview.png"
                mode="heightFix"
            ></image>
        </navigator>

        <view class="select" v-for="(classify, idx) in randomRecommendComputed" :key="classify.id">
            <view class="select-watermark">{{ classify.name }}</view>
            <index-title>
                <template #name>{{ classify.name }}</template>
                <template #custom>
                    <navigator class="box" :url="'/pages/app/classlist?id=' + classify.id + '&name=' + classify.name">
                        <button size="mini" plain class="btn" :class="themeClasses[idx % themeClasses.length]">
                            {{ $t('common.seeAll') }}
                        </button>
                    </navigator>
                </template>
            </index-title>

            <view class="content">
                <rotate-loading v-if="!classify" style="height: 100%"></rotate-loading>
                <scroll-view scroll-x>
                    <view class="box" v-for="item in classify.data" :key="item.id" @click="goPreview(item.id, classify.data)">
                        <image :src="item.smallPicurl" mode="aspectFill"></image>
                        <view class="box-info">
                            <view class="label">Collection</view>
                            <view class="value">{{ classify.name }}</view>
                        </view>
                    </view>
                </scroll-view>
            </view>

            <view v-if="idx % 3 === 0" class="ad-slot" :class="{ ready: adVisibleMap[`mid-${idx}`] }">
                <custom-ad-banner @load="onAdLoad(`mid-${idx}`)" @error="onAdError(`mid-${idx}`)"></custom-ad-banner>
            </view>
        </view>

        <view class="classify">
            <index-title>
                <template #name>{{ $t('index.categoryRecommend') }}</template>
                <template #custom>
                    <navigator url="/pages/app/classify" open-type="reLaunch" class="more">{{ $t('common.more') }}+</navigator>
                </template>
            </index-title>

            <rotate-loading v-if="!classifyList.length" style="height: 100%"></rotate-loading>

            <view class="content classify-grid" v-if="classifyList.length">
                <classify-item
                    v-for="(item, idx) in classifyPreviewList"
                    :key="item.id"
                    :item="item"
                    :layout-style="getLayoutStyleForIndex(idx)"
                ></classify-item>
                <!-- <classify-item :isMore="true" :layout-style="getLayoutStyleMore()"></classify-item> -->
            </view>
        </view>

        <view class="ad-slot ad-slot-bottom" :class="{ ready: adVisibleMap.bottom }">
            <custom-ad-banner @load="onAdLoad('bottom')" @error="onAdError('bottom')"></custom-ad-banner>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { onLoad, onPullDownRefresh, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import {
    apiGetBanner,
    apiGetRandomDay,
    apiGetRandomRecommend,
    apiGetNotice,
    apiGetClassify,
    apiGetClassList,
} from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const bannerList = ref([]);
const randomDailyList = ref([]);
const randomRecommendList = ref([]);
const latestList = ref([]);
const noticeList = ref([]);
const classifyList = ref([]);
const adVisibleMap = reactive({});
const themeClasses = ['is-collection', 'is-keyword', 'is-spotlight', 'is-default'];

const randomRecommendComputed = computed(() => {
    return randomRecommendList.value.map((item) => ({
        ...item,
        name: uni.getLocale() === 'en' ? item.name_en : item.name,
    }));
});

const classifyComputed = computed(() => {
    return classifyList.value.map((item) => ({
        ...item,
        name: uni.getLocale() === 'en' ? item.name_en : item.name,
    }));
});

const classifyPreviewList = computed(() => classifyComputed.value.slice(0, 8));
const latestPreviewList = computed(() => latestList.value.slice(0, 10));

// 与 classify 页一致：前 6 个 2×3（左高格跨 2 行）+ 第 6 个通栏，第 7、8 个占第 5 行两列，「更多」通栏第 6 行
const getLayoutStyleForIndex = (idx) => {
    if (idx === 0) return { gridColumn: '1', gridRow: '1' };
    if (idx === 1) return { gridColumn: '2', gridRow: '1' };
    if (idx === 2) return { gridColumn: '1', gridRow: '2 / span 2' };
    if (idx === 3) return { gridColumn: '2', gridRow: '2' };
    if (idx === 4) return { gridColumn: '2', gridRow: '3' };
    if (idx === 5) return { gridColumn: '1 / -1', gridRow: '4' };
    if (idx === 6) return { gridColumn: '1', gridRow: '5' };
    if (idx === 7) return { gridColumn: '2', gridRow: '5' };
    return {};
};

const getLayoutStyleMore = () => ({ gridColumn: '1 / -1', gridRow: '6' });

const getBannerTextMeta = (item) => {
    const url = String(item.url || '');
    const decodedUrl = decodeURIComponent(url);
    const nameMatch = decodedUrl.match(/name=([^&]+)/);
    const keywordMatch = decodedUrl.match(/keyword=([^&]+)/);
    const isClassify = url.includes('/pages/app/classlist');
    const isSearch = url.includes('/wall/search/');
    const isPreview = url.includes('/preview');
    const rawTitle = nameMatch?.[1] || (keywordMatch?.[1] ? `#${keywordMatch[1]}` : '');
    const isBing = rawTitle.includes('必应') || rawTitle.toLowerCase().includes('bing');

    const title = rawTitle || (item.target === 'miniProgram' ? t('index.banner.discoverMore') : t('index.banner.defaultTitle'));

    const desc =
        item.description ||
        (isBing
            ? t('index.banner.bingDesc')
            : isClassify
              ? t('index.banner.classifyDesc')
              : isSearch
                ? t('index.banner.searchDesc')
                : isPreview
                  ? t('index.banner.previewDesc')
                  : t('index.banner.defaultDesc'));

    const badge = isClassify
        ? t('index.banner.badge.classify')
        : isSearch
          ? t('index.banner.badge.search')
          : isPreview
            ? t('index.banner.badge.spotlight')
            : item.target === 'miniProgram'
              ? t('index.banner.badge.miniProgram')
              : t('index.banner.badge.default');
    const targetLabel =
        item.target === 'self'
            ? t('index.banner.target.self')
            : item.target === 'miniProgram'
              ? t('index.banner.target.miniProgram')
              : t('index.banner.target.external');
    const metaLabel = isClassify
        ? t('index.banner.meta.classify')
        : isSearch
          ? t('index.banner.meta.search')
          : isPreview
            ? t('index.banner.meta.preview')
            : t('index.banner.meta.default');
    const accentClass = isClassify ? 'is-collection' : isSearch ? 'is-keyword' : isPreview ? 'is-spotlight' : 'is-default';

    return {
        title,
        desc,
        badge,
        targetLabel,
        metaLabel,
        accentClass,
    };
};

const getBanner = async () => {
    let res = await apiGetBanner();
    // bannerList.value = res.data.map(item => {
    //     // 增加picurl字段，存储大图的url地址
    //     return {
    //         ...item,
    //         picurl: item.smallPicurl.replace("_small.webp", ".jpg")
    //     }
    // })
    bannerList.value = res.data.map((item) => {
        const normalized = handlePicUrl(item);
        return {
            ...normalized,
            ...getBannerTextMeta(item),
        };
    });
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
            data: classify.data.map((item) => handlePicUrl(item)),
        };
    });
};

const getNotice = async () => {
    let res = await apiGetNotice();
    noticeList.value = res.data;
};

const getClassify = async () => {
    let res = await apiGetClassify({
        select: true,
    });
    classifyList.value = res.data.map((item) => handlePicUrl(item));
};

const getLatest = async () => {
    let res = await apiGetClassList({
        ordering: '-created',
        page_size: 20,
    });
    latestList.value = (res.data || []).map((item) => handlePicUrl(item));
};

const goBannerPreview = (data) => {
    if (data.wall) {
        const wallList = handlePicUrl(data.wall);
        uni.setStorageSync('wallList', [wallList]); // banner预览存储单个壁纸
    }
    uni.navigateTo({ url: data.url });
};

const goPreview = (id, data) => {
    uni.setStorageSync('wallList', data); // 预览存储多个壁纸
    uni.navigateTo({
        url: '/pages/app/preview?id=' + id,
    });
};

const onAdLoad = (key) => {
    adVisibleMap[key] = true;
};

const onAdError = (key) => {
    adVisibleMap[key] = false;
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
    getLatest();
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
        path: '/pages/app/index',
    };
});

//分享朋友圈
onShareTimeline(() => {
    return {
        title: '本我壁纸 - 探索壁纸，亦探索自我',
    };
});
</script>

<style lang="scss" scoped>
.homeLayout {
    .ad-slot {
        padding: 0;
        margin: 0;
        overflow: hidden;
        min-height: 0;

        &.ready {
            padding: 30rpx 30rpx 0;
        }
    }

    .ad-slot-bottom {
        &.ready {
            padding: 0 30rpx 30rpx;
        }
    }

    .banner {
        width: 750rpx;
        padding: 0 0 20rpx;

        swiper {
            width: 750rpx;
            height: 400rpx;
            margin: 20rpx 0rpx;

            &-item {
                width: 100%;
                height: 100%;
                padding: 0rpx 30rpx;

                .banner-card {
                    width: 100%;
                    height: 100%;
                    display: block;
                    position: relative;
                    overflow: hidden;
                    border-radius: 28rpx;

                    image {
                        width: 100%;
                        height: 100%;
                        border-radius: 28rpx;
                        box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.34);
                    }

                    .banner-card__overlay {
                        position: absolute;
                        inset: 0;
                        background: linear-gradient(
                            180deg,
                            rgba(6, 12, 18, 0.06) 0%,
                            rgba(6, 12, 18, 0.18) 34%,
                            rgba(6, 12, 18, 0.78) 100%
                        );
                    }

                    .banner-card__content {
                        position: absolute;
                        left: 28rpx;
                        right: 28rpx;
                        bottom: 26rpx;
                        z-index: 1;
                    }

                    .banner-card__tag-row {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 16rpx;
                        margin-bottom: 14rpx;
                    }

                    .banner-card__tag,
                    .banner-card__target {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 40rpx;
                        padding: 0 16rpx;
                        border-radius: 999rpx;
                        font-size: 20rpx;
                        font-weight: 700;
                        letter-spacing: 0.03em;
                    }

                    .banner-card__tag {
                        color: #7dd3fc;
                        background: rgba(43, 140, 238, 0.18);
                        border: 1rpx solid rgba(125, 211, 252, 0.22);
                    }

                    .banner-card__target {
                        color: rgba(241, 245, 249, 0.92);
                        background: rgba(15, 23, 42, 0.28);
                        border: 1rpx solid rgba(255, 255, 255, 0.14);
                    }

                    .banner-card__title {
                        font-size: 42rpx;
                        line-height: 1.18;
                        font-weight: 800;
                        color: #f8fafc;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }

                    .banner-card__desc {
                        margin-top: 10rpx;
                        font-size: 24rpx;
                        line-height: 1.5;
                        color: rgba(226, 232, 240, 0.84);
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }

                    .banner-card__meta {
                        margin-top: 18rpx;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    }

                    .banner-card__meta-chip {
                        display: inline-flex;
                        align-items: center;
                        min-height: 42rpx;
                        padding: 0 16rpx;
                        border-radius: 999rpx;
                        font-size: 22rpx;
                        color: #dbe7f5;
                        background: rgba(15, 23, 42, 0.26);
                        border: 1rpx solid rgba(255, 255, 255, 0.12);
                    }

                    .banner-card__meta-arrow {
                        width: 56rpx;
                        height: 56rpx;
                        border-radius: 16rpx;
                        background: rgba(20, 28, 39, 0.32);
                        border: 1rpx solid rgba(255, 255, 255, 0.12);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    &.is-collection {
                        .banner-card__tag {
                            color: #f3e8ff;
                            background: rgba(126, 34, 206, 0.32);
                            border-color: rgba(216, 180, 254, 0.34);
                        }

                        .banner-card__meta-chip {
                            color: #f3e8ff;
                            background: rgba(15, 23, 42, 0.38);
                            border-color: rgba(192, 132, 252, 0.24);
                        }
                    }

                    &.is-keyword {
                        .banner-card__tag {
                            color: #ecfccb;
                            background: rgba(101, 163, 13, 0.28);
                            border-color: rgba(190, 242, 100, 0.3);
                        }

                        .banner-card__meta-chip {
                            color: #ecfccb;
                            background: rgba(15, 23, 42, 0.34);
                            border-color: rgba(163, 230, 53, 0.18);
                        }
                    }

                    &.is-spotlight {
                        .banner-card__tag {
                            color: #fde68a;
                            background: rgba(245, 158, 11, 0.18);
                            border-color: rgba(253, 230, 138, 0.3);
                        }

                        .banner-card__meta-chip {
                            color: #fef3c7;
                        }
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
        margin: 0 auto 30rpx;
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
        position: relative;
        // padding: 30rpx 0 0 0;
        overflow: hidden;

        .select-watermark {
            position: absolute;
            top: -30rpx;
            right: -20rpx;
            font-size: 140rpx;
            font-weight: 900;
            color: rgba(0, 0, 0, 0.04);
            text-transform: uppercase;
            letter-spacing: -4rpx;
            pointer-events: none;
            z-index: 0;
            white-space: nowrap;
        }

        .index-title {
            position: relative;
            z-index: 1;
        }

        .date {
            display: flex;
            align-items: center;
            gap: 12rpx;

            .button {
                margin: 0;
                padding: 0 16rpx;
                height: 46rpx;
                line-height: 44rpx;
                font-size: 22rpx;
                font-weight: 700;
                border-radius: 999rpx;
                background: rgba(43, 140, 238, 0.08);
                color: $wp-theme-color;
                border: 1rpx solid rgba(40, 179, 137, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;

                &::after {
                    border: none;
                }

                &:active {
                    transform: scale(0.95);
                    opacity: 0.8;
                }

                &.is-spotlight {
                    color: #d97706;
                    background: rgba(245, 158, 11, 0.1);
                    border-color: rgba(245, 158, 11, 0.2);
                }
            }

            .text {
                font-size: 26rpx;
                font-weight: 600;
                color: #666;
                letter-spacing: 0.02em;
            }
        }

        .btn {
            margin: 0;
            padding: 0 20rpx;
            height: 46rpx;
            line-height: 44rpx;
            font-size: 22rpx;
            font-weight: 700;
            border-radius: 999rpx;
            border: 1rpx solid rgba(0, 0, 0, 0.08);
            background: #f1f5f9;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;

            &::after {
                border: none;
            }

            &:active {
                transform: scale(0.95);
                filter: brightness(0.95);
            }

            &.is-default {
                color: #0284c7;
                background: rgba(14, 165, 233, 0.1);
                border-color: rgba(14, 165, 233, 0.15);
            }

            &.is-collection {
                color: #7e22ce;
                background: rgba(168, 85, 247, 0.1);
                border-color: rgba(168, 85, 247, 0.15);
            }

            &.is-keyword {
                color: #65a30d;
                background: rgba(132, 204, 22, 0.1);
                border-color: rgba(132, 204, 22, 0.15);
            }

            &.is-spotlight {
                color: #d97706;
                background: rgba(245, 158, 11, 0.1);
                border-color: rgba(245, 158, 11, 0.2);
            }
        }

        .content {
            width: 750rpx;
            height: 580rpx;
            margin-top: 20rpx;
            position: relative;
            z-index: 1;

            scroll-view {
                white-space: nowrap;
                height: 100%;
                box-sizing: border-box;

                .box {
                    width: 280rpx;
                    height: 90%;
                    display: inline-flex;
                    justify-content: center;
                    align-items: center;
                    margin: 10rpx 24rpx 10rpx 0;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    position: relative;

                    image {
                        width: 100%;
                        height: 100%;
                        border-radius: 32rpx;
                        box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.2);
                        border: 1rpx solid rgba(255, 255, 255, 0.08);
                    }

                    // 玻璃拟态信息条
                    .box-info {
                        position: absolute;
                        left: 12rpx;
                        right: 12rpx;
                        bottom: 12rpx;
                        padding: 12rpx 16rpx;
                        background: rgba(15, 23, 42, 0.4);
                        backdrop-filter: blur(8px);
                        border-radius: 20rpx;
                        border: 1rpx solid rgba(255, 255, 255, 0.1);
                        display: flex;
                        flex-direction: column;
                        gap: 2rpx;
                        opacity: 0.9;

                        .label {
                            font-size: 18rpx;
                            color: rgba(255, 255, 255, 0.6);
                            text-transform: uppercase;
                            letter-spacing: 1rpx;
                            font-weight: 700;
                        }

                        .value {
                            font-size: 22rpx;
                            color: #fff;
                            font-weight: 600;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        }
                    }

                    // Hero 模式专属 (大图)
                    &.is-hero {
                        width: 440rpx;

                        .box-hero-overlay {
                            position: absolute;
                            inset: 0;
                            border-radius: 32rpx;
                            background: linear-gradient(
                                to bottom,
                                rgba(0, 0, 0, 0) 50%,
                                rgba(0, 0, 0, 0.7) 100%
                            );
                            pointer-events: none;
                        }

                        .box-hero-content {
                            position: absolute;
                            left: 24rpx;
                            bottom: 30rpx;
                            right: 24rpx;

                            .day-tag {
                                font-size: 64rpx;
                                font-weight: 900;
                                color: rgba(255, 255, 255, 0.95);
                                line-height: 1;
                                margin-bottom: 8rpx;
                                text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
                            }

                            .pick-text {
                                font-size: 20rpx;
                                font-weight: 800;
                                color: #fde68a;
                                text-transform: uppercase;
                                letter-spacing: 4rpx;
                            }
                        }
                    }

                    // New 微标
                    .box-badge {
                        position: absolute;
                        top: 16rpx;
                        right: 16rpx;
                        padding: 4rpx 12rpx;
                        background: rgba(40, 179, 137, 0.9);
                        color: #fff;
                        font-size: 18rpx;
                        font-weight: 800;
                        border-radius: 8rpx;
                        box-shadow: 0 4rpx 12rpx rgba(40, 179, 137, 0.4);
                        z-index: 1;
                    }

                    &:active {
                        transform: scale(0.96) translateY(4rpx);
                    }
                }

                .box:first-child{
                    margin-left: 30rpx;
                }
                .box:last-child {
                    margin-right: 30rpx;
                }
            }
        }
    }

    .subject {
    }

    .top-entry {
        position: relative;
        margin: 0 30rpx 30rpx;
        padding: 24rpx 24rpx 24rpx 28rpx;
        display: block;
        min-height: 210rpx;
        overflow: visible;
        border-radius: 28rpx;
        background: linear-gradient(180deg, #40454f 0%, #393f48 100%);
        border: 1rpx solid rgba(255, 255, 255, 0.04);
        box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.1);
        text-align: left;
    }

    .top-entry__content {
        width: 340rpx;
        min-width: 340rpx;
        padding: 4rpx 0;
        margin-left: 0;
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
        justify-content: flex-start;
    }

    .top-entry__eyebrow {
        display: block;
        width: 100%;
        font-size: 20rpx;
        line-height: 1;
        font-weight: 800;
        letter-spacing: 2rpx;
        color: rgba(255, 255, 255, 0.82);
        text-transform: uppercase;
    }

    .top-entry__title {
        display: block;
        width: 100%;
        margin-top: 10rpx;
        font-size: 34rpx;
        line-height: 1.2;
        font-weight: 800;
        color: #ffffff;
    }

    .top-entry__desc {
        display: block;
        width: 100%;
        margin-top: 10rpx;
        font-size: 24rpx;
        line-height: 1.6;
        color: rgba(255, 255, 255, 0.56);
        max-width: 320rpx;
    }

    .top-entry__action {
        margin-top: 20rpx;
        margin-left: 0;
        align-self: flex-start;
        width: 56rpx;
        height: 56rpx;
        border-radius: 16rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(20, 28, 39, 0.32);
        border: 1rpx solid rgba(255, 255, 255, 0.12);
    }

    .top-entry__action-text {
        display: none;
    }

    .top-entry__visual {
        position: absolute;
        right: 10rpx;
        bottom: -18rpx;
        height: 384rpx;
        width: auto;
        z-index: 2;
        pointer-events: none;
    }

    .classify {
        padding: 0rpx 0 30rpx;

        .content.classify-grid {
            margin-top: 30rpx;
            padding: 0 24rpx;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-auto-rows: 200rpx;
            gap: 20rpx;
        }

        .more {
            font-size: 28rpx;
            color: $uni-text-color-grey;
        }
    }
}
</style>
