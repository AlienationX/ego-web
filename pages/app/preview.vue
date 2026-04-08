<template>
    <scroll-view v-if="currentInfo?.id" scroll-y class="previewScroll" @scroll="handlePreviewScroll">
        <view class="preview">
            <view class="previewHero">
                <swiper
                    :circular="!disableSwipe && classList.length > 1"
                    :disable-touch="disableSwipe"
                    :current="currentIndex"
                    @change="swiperChange"
                >
                    <swiper-item v-for="(item, index) in classList" :key="item.id">
                        <view class="preview-slide">
                            <view v-if="readImgs.includes(index) && !isImageLoaded(index)" class="preview-loading">
                                <view class="preview-loading__glow"></view>
                                <rotate-loading :size="88"></rotate-loading>
                                <view class="preview-loading__text">{{ t('message.loading') }}</view>
                            </view>
                            <image
                                v-if="readImgs.includes(index)"
                                class="preview-slide__image"
                                :class="{ 'is-loaded': isImageLoaded(index) }"
                                @click="maskChange"
                                @load="handleImageLoad(index)"
                                @error="handleImageLoad(index)"
                                :src="item.picurl"
                                mode="aspectFill"
                            ></image>
                        </view>
                    </swiper-item>
                </swiper>

                <view class="mask" v-if="maskState">
                    <view class="goBack" :style="{ top: getGoBackButtonTop() + 'px' }" @click="goBack">
                        <mdi-icon path="/static/icons/arrow-left.svg" size="20px" color="#fff"></mdi-icon>
                    </view>
                    <view class="top-actions" :style="{ top: getGoBackButtonTop() + 'px' }">
                        <view v-if="isAdmin" class="icon-btn" @click="openEdit">
                            <mdi-icon path="/static/icons/pencil.svg" size="20px" color="#fff"></mdi-icon>
                        </view>
                        <view v-if="isAdmin" class="icon-btn" @click="toggleLock">
                            <mdi-icon
                                :path="currentInfo.is_locked ? '/static/icons/lock.svg' : '/static/icons/lock-open.svg'"
                                size="20px"
                                color="#fff"
                            ></mdi-icon>
                        </view>
                        <button class="icon-btn share-btn" open-type="share" @click="handleShare">
                            <mdi-icon path="/static/icons/share-variant.svg" size="20px" color="#fff"></mdi-icon>
                        </button>
                        <view v-if="previewType === 'classic'" class="icon-btn" @click="openInfo">
                            <mdi-icon path="/static/icons/information-symbol.svg" size="32px" color="#fff"></mdi-icon>
                        </view>
                    </view>

                    <view v-if="!disableSwipe" class="count">{{ currentIndex + 1 }} / {{ classList.length }}</view>
                    <view class="time">{{ timeText }}</view>
                    <view class="date">{{ dateText }}</view>

                    <view v-if="showScrollHint" class="scrollHint">
                        <uni-icons type="down" size="18" color="#ffffff"></uni-icons>
                        <uni-icons type="down" size="18" color="#ffffff"></uni-icons>
                    </view>

                    <view class="footer" v-if="previewType === 'classic'">
                        <view class="box" @click="toggleCollect">
                            <uni-icons type="heart-filled" size="28"></uni-icons>
                            <view class="text">{{
                                currentInfo.is_collect ? t('preview.collected') : t('preview.collect')
                            }}</view>
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

                    <template v-else>
                        <view class="right-actions">
                            <view class="action-item" @click="openInfo">
                                <uni-icons type="info-filled" size="36" color="#ffffff"></uni-icons>
                                <view class="action-text">{{ t('common.information') }}</view>
                            </view>
                            <view class="action-item" @click="openScore">
                                <uni-icons type="star-filled" size="36" color="#ffffff"></uni-icons>
                                <view class="action-text">{{ currentInfo.score }}</view>
                            </view>
                            <view class="action-item" @click="toggleCollect">
                                <uni-icons type="heart-filled" size="36" color="#ffffff"></uni-icons>
                                <view class="action-text">{{
                                    currentInfo.is_collect ? t('preview.collected') : t('preview.collect')
                                }}</view>
                            </view>
                            <view class="action-item" @click="clickDownload">
                                <uni-icons
                                    v-if="currentInfo.is_locked"
                                    type="locked-filled"
                                    size="36"
                                    color="#ffffff"
                                ></uni-icons>
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
                    </template>
                </view>
            </view>
            <recommend-wallpapers :key="currentInfo.id" :current-info="currentInfo"></recommend-wallpapers>
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

        <uni-popup ref="editPopup" type="bottom" :safe-area="false">
            <view class="editPopup">
                <view class="popHeader">
                    <view></view>
                    <view class="title">{{ t('preview.adminEdit') }}</view>
                    <view class="close">
                        <uni-icons class="close" type="clear" size="32" @click="closeEdit"></uni-icons>
                    </view>
                </view>
                <scroll-view scroll-y>
                    <view class="content">
                        <view class="row">
                            <view class="label">{{ t('preview.description') }}</view>
                            <textarea v-model="editForm.description" class="input-textarea" :auto-height="true"></textarea>
                        </view>
                        <view class="row">
                            <view class="label">{{ t('preview.tags') }}</view>
                            <input v-model="editForm.tabs" class="input" />
                        </view>
                        <view class="row">
                            <view class="label">{{ t('preview.category') }}</view>
                            <picker
                                :range="classifyList"
                                range-key="classify_name"
                                @change="onClassifyChange"
                                :value="getClassifyIndex()"
                            >
                                <view class="input picker-input">
                                    {{ getClassifyName() || t('preview.selectCategory') }}
                                </view>
                            </picker>
                        </view>
                        <view class="row">
                            <view class="label">{{ t('preview.publisher') }}</view>
                            <input v-model="editForm.publisher" class="input" />
                        </view>
                        <view class="row row-inline">
                            <view class="inline-item">
                                <view class="label">{{ t('preview.active') }}</view>
                                <switch color="#E5322D" :checked="editForm.is_active" @change="onEditActiveChange" />
                            </view>
                            <view class="inline-item">
                                <view class="label">{{ t('preview.lock') }}</view>
                                <switch color="#E5322D" :checked="editForm.is_locked" @change="onEditLockChange" />
                            </view>
                        </view>
                        <view class="edit-actions">
                            <button class="btn-primary" @click="saveEdit">{{ t('preview.adminSave') }}</button>
                            <button class="btn-danger" @click="deleteWall">{{ t('preview.adminDelete') }}</button>
                        </view>
                    </view>
                </scroll-view>
            </view>
        </uni-popup>

        <popup-ad-prompt ref="adPopup" :picurl="currentInfo.picurl" :id="currentInfo.id"></popup-ad-prompt>
    </scroll-view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { onLoad, onUnload, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import { getStatusBarHeight } from '@/utils/system.js';
import { useAdIntersititial, useAdRewardedVideo } from '@/hooks/useAd.js';
import { downloadPic } from '@/common/core.js';
import {
    apiPostIncrementViews,
    apiPostIncrementDownloads,
    apiPostActions,
    apiPostUpdateWall,
    apiGetClassify,
} from '@/api/wallpaper.js';
import { useSettingsStore } from '@/stores/settings.js';

import { useUserStore } from '@/stores/user.js';
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const avatarSeedSalt = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
const PREVIEW_SCROLL_HINT_KEY = 'hasSeenHint';

const { t, locale } = useI18n();
const weekNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const weekNamesZh = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const monthNamesEn = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];
const timeText = computed(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
});
const dateText = computed(() => {
    const now = new Date();
    const isZh = String(locale.value || '').startsWith('zh');
    const week = isZh ? weekNamesZh[now.getDay()] : weekNamesEn[now.getDay()];
    if (isZh) {
        return `${week} ${now.getMonth() + 1}月${now.getDate()}日`;
    }
    return `${week}, ${monthNamesEn[now.getMonth()]} ${now.getDate()}`;
});
const previewType = computed(() => settingsStore.options.previewType || 'classic');
const isAdmin = computed(() => !!userStore.isAdmin);
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
        tabs_list: typeof item.tabs === 'string' ? item.tabs.split(',') : item.tabs_list || [],
    };
});
const disableSwipe = ref(false);
const showScrollHint = ref(!uni.getStorageSync(PREVIEW_SCROLL_HINT_KEY));

const handlePreviewScroll = (e) => {
    if (!showScrollHint.value) return;
    const scrollTop = Number(e?.detail?.scrollTop || 0);
    if (scrollTop > 60) {
        showScrollHint.value = false;
        uni.setStorageSync(PREVIEW_SCROLL_HINT_KEY, true);
    }
};

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
                url: '/pages/app/index',
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
                    uni.navigateTo({ url: '/pages/auth/login' });
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

const editPopup = ref(null);
const classifyList = ref([]);
const editForm = ref({
    description: '',
    tabs: '',
    classify_id: '',
    publisher: '',
    is_active: true,
    is_locked: false,
});

const openEdit = async () => {
    const res = await apiGetClassify();
    classifyList.value = res.data.map((item) => ({
        classify_id: item.id,
        classify_name: item.name,
    }));
    const currentClassify = classifyList.value.find((item) => item.classify_name === currentInfo.value.classify_name);
    editForm.value = {
        description: currentInfo.value.description || '',
        tabs: currentInfo.value.tabs || (currentInfo.value.tabs_list || []).join(','),
        classify_id: currentClassify ? currentClassify.classify_id : '',
        publisher: currentInfo.value.publisher || '',
        is_active: !!currentInfo.value.is_active,
        is_locked: !!currentInfo.value.is_locked,
    };
    editPopup.value.open();
};

const closeEdit = () => {
    editPopup.value.close();
};

const onEditLockChange = (e) => {
    editForm.value.is_locked = !!e.detail.value;
};

const onEditActiveChange = (e) => {
    editForm.value.is_active = !!e.detail.value;
};

const onClassifyChange = (e) => {
    const index = e.detail.value;
    if (index >= 0 && index < classifyList.value.length) {
        editForm.value.classify_id = classifyList.value[index].classify_id;
    }
};

const getClassifyIndex = () => {
    return classifyList.value.findIndex((item) => item.classify_id === editForm.value.classify_id);
};

const getClassifyName = () => {
    const item = classifyList.value.find((item) => item.classify_id === editForm.value.classify_id);
    return item ? item.classify_name : '';
};

const applyLocalUpdate = (payload) => {
    const next = { ...currentInfo.value, ...payload };
    currentInfo.value = next;
    if (classList.value[currentIndex.value]) {
        classList.value[currentIndex.value] = { ...classList.value[currentIndex.value], ...payload };
    }
};

const saveEdit = async () => {
    // const selectedClassify = classifyList.value.find((item) => item.classify_id === editForm.value.classify_id);
    // const payload = {
    //     description: editForm.value.description,
    //     tabs: editForm.value.tags,
    //     classify_id: editForm.value.classify_id,
    //     publisher: editForm.value.publisher,
    //     is_active: editForm.value.is_active,
    //     is_locked: editForm.value.is_locked,
    // };
    try {
        await apiPostUpdateWall({ id: currentInfo.value.id, ...editForm.value });
        applyLocalUpdate({
            ...editForm.value,
            tabs_list: editForm.value.tags
                ? editForm.value.tags
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                : [],
        });
        uni.showToast({ title: t('preview.adminSaveSuccess'), icon: 'none' });
        closeEdit();
    } catch (error) {
        uni.showToast({ title: t('preview.adminSaveFailed'), icon: 'none' });
    }
};

const deleteWall = () => {
    uni.showModal({
        title: t('common.tip'),
        content: t('preview.adminDeleteConfirm'),
        confirmText: t('preview.adminDelete'),
        cancelText: t('preview.cancel'),
        success: async (res) => {
            if (!res.confirm) return;
            try {
                await apiPostUpdateWall({ id: currentInfo.value.id, is_active: false });
                classList.value = classList.value.filter((item) => item.id !== currentInfo.value.id);
                if (!classList.value.length) {
                    goBack();
                    return;
                }
                if (currentIndex.value >= classList.value.length) {
                    currentIndex.value = classList.value.length - 1;
                }
                currentInfo.value = classList.value[currentIndex.value];
                uni.showToast({ title: t('preview.adminDeleteSuccess'), icon: 'none' });
                closeEdit();
            } catch (error) {
                uni.showToast({ title: t('preview.adminDeleteFailed'), icon: 'none' });
            }
        },
    });
};

const toggleLock = async () => {
    const next = !currentInfo.value.is_locked;
    try {
        await apiPostUpdateWall({ id: currentInfo.value.id, is_locked: next });
        applyLocalUpdate({ is_locked: next });
        uni.showToast({ title: t('preview.lockToggled'), icon: 'none' });
    } catch (error) {
        uni.showToast({ title: t('preview.lockToggleFailed'), icon: 'none' });
    }
};

const handleShare = () => {
    // #ifdef APP-PLUS
    uni.share({
        provider: 'weixin',
        scene: 'WXSceneSession',
        type: 0,
        summary: t('common.appName'),
        success: () => {
            uni.showToast({ title: t('preview.shareSuccess'), icon: 'success' });
        },
        fail: () => {
            uni.showToast({ title: t('preview.shareFailed'), icon: 'none' });
        },
    });
    // #endif

    // #ifdef H5
    uni.showToast({ title: t('preview.shareHint'), icon: 'none' });
    // #endif
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
                    uni.navigateTo({ url: '/pages/auth/login' });
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
const loadedImageMap = ref({});

function readImgsFun() {
    readImgs.value.push(
        currentIndex.value <= 0 ? classList.value.length - 1 : currentIndex.value - 1,
        currentIndex.value,
        currentIndex.value >= classList.value.length ? 0 : currentIndex.value + 1,
    );
    // 去重
    readImgs.value = [...new Set(readImgs.value)];
}

const isImageLoaded = (index) => !!loadedImageMap.value[index];

const handleImageLoad = (index) => {
    loadedImageMap.value = {
        ...loadedImageMap.value,
        [index]: true,
    };
};

// OnLoad接收参数
const currentId = ref(null);
const currentIndex = ref(0);
const currentInfo = ref(null);
onLoad((e) => {
    currentId.value = e.id;
    disableSwipe.value = e.mode === 'recommend' || e.disableSwipe === '1';
    if (e.type === 'share') {
        // TODO
        console.log('分享页接收到的用户需要发送api请求，自己获取数据');
        // let res = apiDetailWall({id: currentId.value});
        // classList.value = res.data;
    }
    currentIndex.value = classList.value.findIndex((item) => item.id === parseInt(currentId.value));
    if (currentIndex.value < 0) {
        currentIndex.value = 0;
    }
    currentInfo.value = classList.value[currentIndex.value];
    if (currentInfo.value) {
        readImgsFun();
        incrementViews(currentInfo.value.id);
    }

    // createInterstitialAd(); // 创建插屏广告
    // createRewardedVideoAd(); // 创建激励视频广告
});

onUnload(() => {
    // destroyInterstitialAd(); // 销毁插屏广告
    // destroyRewardedVideoAd(); // 销毁激励视频广告
});

// 滑动事件，变化当前数字
const swiperChange = (e) => {
    if (disableSwipe.value) return;
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
        path: '/pages/app/preview?id=' + currentId.value + '&type=share',
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
    position: relative;
    min-height: 100vh;
    background: #0b0f14;
}

.previewScroll {
    height: 100vh;
}

.previewHero {
    width: 100%;
    height: 100vh;
    position: relative;

    swiper {
        width: 100%;
        height: 100%;

        .preview-slide {
            width: 100%;
            height: 100%;
            position: relative;
            background: #0b0f14;
        }

        .preview-slide__image {
            width: 100%;
            height: 100%;
            opacity: 0;
            transition: opacity 0.28s ease;
        }

        .preview-slide__image.is-loaded {
            opacity: 1;
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
    }

    .mask {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;

        & > view {
            // goBack\count\time\date\footer都需要绝对定位，统一在这里设
            position: absolute;
            width: fit-content;
            left: 0;
            right: 0;
            margin: auto;
            color: #fff;
            pointer-events: auto;
        }

        .goBack {
            width: 76rpx;
            height: 76rpx;
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

        .top-actions {
            position: absolute;
            right: 30rpx;
            display: flex;
            align-items: center;
            gap: 16rpx;
            left: auto;
            margin: 0;
            pointer-events: auto;
        }

        .icon-btn {
            width: 76rpx;
            height: 76rpx;
            border-radius: 100rpx;
            background: rgba(0, 0, 0, 0.55);
            border: 1rpx solid rgba(255, 255, 255, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
        }

        .share-btn {
            border: none;
            background: rgba(0, 0, 0, 0.55);

            &::after {
                border: none;
            }
        }

        .count {
            top: 12vh;
            background: rgba(0, 0, 0, 0.25);
            font-size: 26rpx;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.78);
            border-radius: 40rpx;
            padding: 8rpx 28rpx;
            // backdrop-filter: blur(10rpx);  // 磨砂
        }

        .time {
            top: calc(12vh + 80rpx);
            font-size: 120rpx;
            font-weight: 400;
            letter-spacing: 2rpx;
            color: rgba(255, 255, 255, 0.95);
            line-height: 1em;
            text-shadow: 0 4rpx rgba(0, 0, 0, 0.3);
        }

        .date {
            top: calc(12vh + 230rpx);
            font-size: 30rpx;
            font-weight: 500;
            letter-spacing: 1rpx;
            color: rgba(255, 255, 255, 0.9);
            text-shadow: 0 2rpx rgba(0, 0, 0, 0.3);
        }

        .scrollHint {
            bottom: calc(env(safe-area-inset-bottom) + 24rpx);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0;
            animation: preview-bounce 1.2s ease-in-out infinite;
            opacity: 0.9;

            :deep(.uni-icons) {
                color: #fff !important;
            }
        }

        .footer {
            background: rgba(255, 255, 255, 0.8);
            bottom: 10vh;
            width: 80vw;
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

        .right-actions {
            position: absolute;
            right: 8rpx;
            bottom: calc(env(safe-area-inset-bottom) + 76rpx);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 30rpx;
            min-width: 128rpx;
            color: #fff;
            z-index: 10;
            margin: 0;
            left: auto;

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
            bottom: calc(env(safe-area-inset-bottom) + 100rpx);
            right: 170rpx;
            width: auto;
            min-width: 0;
            max-width: none;
            color: #fff;
            text-shadow: 0 3rpx 10rpx rgba(0, 0, 0, 0.55);
            z-index: 2;
            padding: 20rpx;
            margin: 0;

            &::before {
                content: '';
                position: absolute;
                left: -44rpx;
                right: -170rpx;
                bottom: -100rpx;
                top: -20rpx;
                background: linear-gradient(to top, rgba(0, 0, 0, 0.68) 0%, rgba(0, 0, 0, 0.4) 54%, transparent 100%);
                pointer-events: none;
                z-index: -1;
            }

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
                max-height: 88rpx;
                font-weight: 400;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                line-clamp: 2;
                word-break: break-word;
                overflow-wrap: anywhere;
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
    z-index: 100;

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

.editPopup {
    background: #fff;
    padding: 30rpx;
    border-radius: 30rpx 30rpx 0 0;
    overflow: hidden;
    z-index: 100;

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
        max-height: 70vh;
    }

    .content {
        .row {
            display: flex;
            flex-direction: column;
            gap: 10rpx;
            padding: 12rpx 0;
            font-size: 28rpx;
            line-height: 1.6em;
        }

        .row-inline {
            flex-direction: row;
            justify-content: space-between;
            gap: 24rpx;
        }

        .inline-item {
            flex: 1;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 12rpx;
            background: #f7f7f9;
            border-radius: 16rpx;
            padding: 16rpx 20rpx;
            box-sizing: border-box;
        }

        .label {
            font-size: 26rpx;
            color: $wp-font-color-2;
            font-weight: 600;
        }

        .input,
        .input-textarea {
            width: 100%;
            background: #f7f7f9;
            border-radius: 16rpx;
            padding: 16rpx 20rpx;
            font-size: 28rpx;
            color: #333;
            box-sizing: border-box;
            min-height: 80rpx;
            line-height: 1.5;
        }

        .picker-input {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .picker-input::after {
            content: '▼';
            font-size: 20rpx;
            color: #999;
        }

        .input-textarea {
            min-height: 80rpx;
            line-height: 1.6;
        }

        .edit-actions {
            margin-top: 20rpx;
            display: flex;
            flex-direction: column;
            gap: 16rpx;
        }

        .btn-primary {
            width: 100%;
            height: 84rpx;
            border-radius: 16rpx;
            background: $wp-theme-color;
            color: #fff;
            font-size: 30rpx;
            font-weight: 600;
            border: none;

            &::after {
                border: none;
            }
        }

        .btn-danger {
            width: 100%;
            height: 84rpx;
            border-radius: 16rpx;
            background: #fef2f2;
            color: #e5322d;
            font-size: 30rpx;
            font-weight: 600;
            border: 1rpx solid #fecaca;

            &::after {
                border: none;
            }
        }
    }
}

@keyframes preview-bounce {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(12rpx);
    }
}
</style>
