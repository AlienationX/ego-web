<template>
    <view
        v-if="currentInfo && currentInfo.id"
        class="preview-page"
        :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'"
    >
        <view
            class="preview-statusbar"
            :style="{
                height: `${statusBarHeight}px`,
                opacity: statusBarFillOpacity,
            }"
        ></view>
        <scroll-view
            scroll-y
            class="previewScroll"
            show-scrollbar="false"
            :style="previewScrollStyle"
            @scroll="handlePreviewScroll"
        >
            <view class="previewLayout" :style="previewLayoutStyle">
                <view class="previewHero">
                    <!-- swiper and mask content unchanged -->
                    <swiper
                        class="preview-swiper"
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
                                    @load="handleImageLoad(index, $event)"
                                    @error="handleImageLoad(index)"
                                    :src="item.picurl"
                                    mode="aspectFill"
                                ></image>
                            </view>
                        </swiper-item>
                    </swiper>

                    <view class="mask" :class="{ 'mask--loading': isCurrentSlideLoading }" v-if="maskState">
                        <view class="goBack" :style="{ top: backButtonTop + 'px' }" @click="goBack">
                            <mdi-icon path="/static/icons/arrow-left.svg" size="20px" color="#fff"></mdi-icon>
                        </view>
                        <view class="top-actions" :style="{ top: backButtonTop + 'px', right: capsuleRightOffset + 'px' }">
                            <view v-if="isAdmin" class="icon-btn" @click="toggleWatchLater">
                                <mdi-icon
                                    :path="isCurrentInWatchLater ? '/static/icons/check.svg' : '/static/icons/bookmark.svg'"
                                    size="20px"
                                    color="#fff"
                                ></mdi-icon>
                            </view>
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
                            <view class="icon-btn" @click="openClockStyle">
                                <mdi-icon path="/static/icons/clock.svg" size="20px" color="#fff"></mdi-icon>
                            </view>
                            <!-- #ifdef MP-WEIXIN -->
                            <button class="icon-btn" open-type="share" @click="handleShare">
                                <mdi-icon path="/static/icons/share-variant.svg" size="20px" color="#fff"></mdi-icon>
                            </button>
                            <!-- #endif -->
                            <view v-if="currentPreviewType === 'classic'" class="icon-btn" @click="openInfo">
                                <mdi-icon path="/static/icons/information-symbol.svg" size="32px" color="#fff"></mdi-icon>
                            </view>
                        </view>

                        <view v-if="!disableSwipe" class="count">{{ currentIndex + 1 }} / {{ classList.length }}</view>
                        <lock-screen-overlay :clockStyle="tempClockStyle || activeSessionClockStyle" />

                        <view v-if="showScrollHint" class="scrollHint">
                            <uni-icons type="up" size="22" color="#ffffff" class="hint-icon"></uni-icons>
                            <uni-icons type="up" size="22" color="#ffffff" class="hint-icon second"></uni-icons>
                            <view class="hint-text">{{ t('previewPage.swipeUpToView') }}</view>
                        </view>

                        <view class="footer" v-if="currentPreviewType === 'classic'">
                            <view class="box" @click="toggleCollect">
                                <uni-icons type="heart-filled" size="28"></uni-icons>
                                <view class="text">{{
                                    currentInfo.is_favorited ? t('previewPage.favorited') : t('previewPage.favorite')
                                }}</view>
                            </view>
                            <view class="box" @click="openScore">
                                <uni-icons type="star-filled" size="28"></uni-icons>
                                <view class="text">{{ currentInfo.score || '-' }}</view>
                            </view>
                            <view class="box" @click="clickDownload">
                                <uni-icons v-if="currentInfo.is_locked" type="locked-filled" size="28"></uni-icons>
                                <uni-icons v-else type="download-filled" size="28"></uni-icons>
                                <view class="text">{{ t('common.download') }}</view>
                            </view>
                        </view>

                        <template v-else>
                            <view class="right-actions">
                                <!-- <view class="action-item" @click="openClockStyle">
                                    <mdi-icon path="/static/icons/clock.svg" size="36px" color="#ffffff"></mdi-icon>
                                    <view class="action-text">{{ t('previewPage.clockStyle') }}</view>
                                </view> -->
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
                                        currentInfo.is_favorited ? t('previewPage.favorited') : t('previewPage.favorite')
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
                                <view class="meta-desc">{{
                                    getLocalizedItem(currentInfo).description ||
                                    getLocalizedItem(currentInfo).classify_name ||
                                    ''
                                }}</view>
                            </view>
                        </template>
                    </view>
                </view>
                <!-- 作品参数指标与免责声明面板（3行2列扁平化布局） -->
                <view class="preview-extra-panel" v-if="currentInfo">
                    <!-- 第一行：免责声明 -->
                    <view class="extra-disclaimer">
                        <text class="disclaimer-text" user-select>{{ tp('message.copyrightStatement', { email: SERVICE_EMAIL }) }}</text>
                    </view>

                    <!-- 第二行与第三行：2列网格指标数据 -->
                    <view class="extra-grid">
                        <!-- 第二行：浏览量 & 下载量 -->
                        <view class="grid-cell">
                            <mdi-icon path="/static/icons/fire.svg" size="16px" color="#94a3b8"></mdi-icon>
                            <text class="cell-label">{{ t('common.views') }}</text>
                            <text class="cell-value">{{ currentInfo.views ?? 0 }}</text>
                        </view>
                        <view class="grid-cell">
                            <mdi-icon path="/static/icons/download.svg" size="16px" color="#94a3b8"></mdi-icon>
                            <text class="cell-label">{{ t('common.downloads') }}</text>
                            <text class="cell-value">{{ currentInfo.downloads ?? 0 }}</text>
                        </view>

                        <!-- 第三行：尺寸(分辨率) & 大小(文件体积) -->
                        <view class="grid-cell">
                            <mdi-icon path="/static/icons/information-outline.svg" size="16px" color="#94a3b8"></mdi-icon>
                            <text class="cell-label">{{ t('previewPage.resolution').replace(':', '') }}</text>
                            <text class="cell-value">{{ currentInfo.width && currentInfo.height ? `${currentInfo.width}×${currentInfo.height}` : '--' }}</text>
                        </view>
                        <view class="grid-cell">
                            <mdi-icon path="/static/icons/image.svg" size="16px" color="#94a3b8"></mdi-icon>
                            <text class="cell-label">{{ t('previewPage.fileSize').replace(':', '') }}</text>
                            <text class="cell-value">{{ formatFileSize(currentInfo.file_size) }}</text>
                        </view>
                    </view>
                </view>

                <recommend-wallpapers :key="currentInfo.id" :current-info="currentInfo"></recommend-wallpapers>
            </view>
        </scroll-view>

        <!-- ad广告无法在<swiper>、<scroll-view> 中使用，因此保持在滚动容器外固定展示 -->
        <custom-ad-banner v-if="IS_INTERNATIONAL && shouldShowBottomAd" @height-change="onAdHeightChange"></custom-ad-banner>

        <!-- safe-area安全区域设置为false，手机显示底部就不回有空白 -->
        <uni-popup ref="infoPopup" type="bottom" :safe-area="false">
            <view class="infoPopup">
                <view class="popHeader">
                    <view></view>
                    <view class="title">{{ t('previewPage.wallpaperInfo') }}</view>
                    <view class="close">
                        <uni-icons class="close" type="clear" size="32" @click="closeInfo"></uni-icons>
                    </view>
                </view>
                <scroll-view class="info-scroll-view" scroll-y>
                    <view class="content">
                        <view class="row">
                            <view class="label">{{ t('previewPage.wallpaperId') }}</view>
                            <view class="value" selectable>{{ currentInfo.id }}</view>
                        </view>
                        <view class="row" v-if="getLocalizedItem(currentInfo).classify_name">
                            <view class="label">{{ t('previewPage.category') }}</view>
                            <view class="value classify">{{ getLocalizedItem(currentInfo).classify_name }}</view>
                        </view>
                        <view class="row" v-if="currentInfo.publisher">
                            <view class="label">{{ t('previewPage.publisher') }}</view>
                            <view class="value classify">{{ publisherName }}</view>
                            <!-- <view class="value classify">{{currentInfo.nickname}}</view> -->
                        </view>
                        <view class="row">
                            <view class="label">{{ t('previewPage.score') }}</view>
                            <view class="value rateBox">
                                <uni-rate readonly touchable :value="currentInfo.score"></uni-rate>
                                <text class="score">{{ currentInfo.score }}</text>
                            </view>
                        </view>
                        <view class="row" v-if="publishDateText">
                            <view class="label">{{ t('previewPage.publishDate') }}</view>
                            <view class="value">{{ publishDateText }}</view>
                        </view>
                        <!-- <view class="row meta-row">
                            <view class="label">{{ t('previewPage.views') }}</view>
                            <view class="value">{{ currentInfo.views ?? 0 }}</view>
                        </view>
                        <view class="row meta-row">
                            <view class="label">{{ t('previewPage.downloads') }}</view>
                            <view class="value">{{ currentInfo.downloads ?? 0 }}</view>
                        </view>
                        <view class="row" v-if="resolutionText">
                            <view class="label">{{ t('previewPage.resolution') }}</view>
                            <view class="value">{{ resolutionText }}</view>
                        </view>
                        <view class="row" v-if="aspectRatioText">
                            <view class="label">{{ t('previewPage.aspectRatio') }}</view>
                            <view class="value">{{ aspectRatioText }}</view>
                        </view> -->
                        <view class="row" v-if="getLocalizedItem(currentInfo).description">
                            <view class="label">{{ t('previewPage.description') }}</view>
                            <view class="value" selectable>{{ getLocalizedItem(currentInfo).description }}</view>
                        </view>
                        <view class="row">
                            <view class="label">{{ t('previewPage.tags') }}</view>
                            <view class="value tags">
                                <view class="tag" v-for="tag in currentTags" :key="tag" @click="goSearchByTag(tag)">
                                    {{ tag }}
                                </view>
                            </view>
                        </view>
                        <text class="copyright" user-select>{{ tp('message.copyrightStatement', { email: SERVICE_EMAIL }) }}</text>
                    </view>
                </scroll-view>
            </view>
        </uni-popup>

        <uni-popup ref="scorePopup" :is-mask-click="false">
            <view class="scorePopup" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
                <view class="popHeader">
                    <view class="title">{{ t('previewPage.wallpaperRating') }}</view>
                    <uni-icons
                        class="close"
                        type="clear"
                        size="32"
                        color="var(--text-tertiary)"
                        @click="closeScore"
                    ></uni-icons>
                </view>

                <view class="content">
                    <uni-rate v-model="userScore" allowHalf></uni-rate>
                    <text class="text">{{ userScore }} {{ t('previewPage.points') }}</text>
                </view>

                <view class="footer">
                    <button class="confirm-btn" :disabled="!userScore" @click="submitScore">
                        {{ t('previewPage.confirmRating') }}
                    </button>
                </view>
            </view>
        </uni-popup>

        <uni-popup ref="editPopup" type="bottom" :safe-area="false">
            <view class="editPopup">
                <view class="popHeader">
                    <view></view>
                    <view class="title">{{ t('previewPage.adminEdit') }}</view>
                    <view class="close">
                        <uni-icons class="close" type="clear" size="32" @click="closeEdit"></uni-icons>
                    </view>
                </view>
                <scroll-view class="info-scroll-view" scroll-y>
                    <view class="content">
                        <view class="row">
                            <view class="label">{{ t('previewPage.description') }}</view>
                            <textarea v-model="editForm.description" class="input-textarea" :auto-height="true"></textarea>
                        </view>
                        <view class="row">
                            <view class="label">{{ t('previewPage.tags') }}</view>
                            <input v-model="editForm.tags" class="input" />
                        </view>
                        <view class="row">
                            <view class="label">{{ t('previewPage.category') }}</view>
                            <picker
                                :range="classifyList"
                                range-key="classify_name"
                                @change="onClassifyChange"
                                :value="getClassifyIndex()"
                            >
                                <view class="input picker-input">
                                    {{ getClassifyName() || t('previewPage.selectCategory') }}
                                </view>
                            </picker>
                        </view>
                        <view class="row">
                            <view class="label">{{ t('previewPage.publisher') }}</view>
                            <input v-model="editForm.publisher" class="input" />
                        </view>
                        <view class="row row-field">
                            <view class="label">{{ t('previewPage.score') }}</view>
                            <view class="rate-input">
                                <uni-rate v-model="editForm.score" allowHalf></uni-rate>
                                <text class="rate-input__text">{{ editForm.score || 0 }}</text>
                            </view>
                        </view>
                        <view class="row row-inline">
                            <view class="inline-item inline-item--metric">
                                <view class="label">{{ t('previewPage.views') }}</view>
                                <input v-model="editForm.views" class="input stat-input" type="number" />
                            </view>
                            <view class="inline-item inline-item--metric">
                                <view class="label">{{ t('previewPage.downloads') }}</view>
                                <input v-model="editForm.downloads" class="input stat-input" type="number" />
                            </view>
                        </view>
                        <view class="row row-inline">
                            <view class="inline-item">
                                <view class="label">{{ t('previewPage.active') }}</view>
                                <switch color="#E5322D" :checked="editForm.is_active" @change="onEditActiveChange" />
                            </view>
                            <view class="inline-item">
                                <view class="label">{{ t('previewPage.lock') }}</view>
                                <switch color="#E5322D" :checked="editForm.is_locked" @change="onEditLockChange" />
                            </view>
                        </view>
                        <view class="edit-actions">
                            <button class="btn-primary" @click="saveEdit">{{ t('previewPage.adminSave') }}</button>
                            <button class="btn-danger" @click="deleteWall">{{ t('previewPage.adminDelete') }}</button>
                        </view>
                    </view>
                </scroll-view>
            </view>
        </uni-popup>

        <popup-ad-prompt ref="adPopup" :picurl="currentInfo.picurl" :id="currentInfo.id"></popup-ad-prompt>

        <!-- 通用导航对话框 -->
        <popup-navigation-dialog
            ref="navDialog"
            :title="dialogState.title"
            :description="dialogState.description"
            :confirmText="dialogState.confirmText"
            :cancelText="dialogState.cancelText"
            :showCancel="dialogState.showCancel"
            @confirm="dialogState.onConfirm"
            @cancel="dialogState.onCancel"
        ></popup-navigation-dialog>

        <!-- Clock Style Popup -->
        <uni-popup ref="clockStylePopup" type="bottom" :safe-area="false" @change="onClockStylePopupChange">
            <view class="clockStylePopup-container" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
                <view class="header">
                    <text class="title">{{ t('previewPage.clockStyle') }}</text>
                    <uni-icons type="closeempty" size="24" :color="settingsStore.isDark ? '#ffffff' : '#333333'" @click="closeClockStyle"></uni-icons>
                </view>
                <scroll-view scroll-x class="style-list" :show-scrollbar="false">
                    <view class="style-scroll-content">
                        <view 
                            class="style-item" 
                            v-for="item in clockStyles" 
                            :key="item.value"
                            :class="{ active: tempClockStyle === item.value }"
                            @click="selectClockStyle(item)"
                        >
                            <view class="style-preview" :class="item.value">
                                <view v-if="item.isVip" class="vip-tag">VIP</view>
                                <!-- Mini clock visuals -->
                                <view class="mini-clock-layout">
                                    <template v-if="item.value === 'default'">
                                        <view class="mc-time default-time">09:41</view>
                                        <view class="mc-date default-date">10/24</view>
                                    </template>
                                    <template v-else-if="item.value === 'ios-classic'">
                                        <view class="mc-date">10/24</view>
                                        <view class="mc-time ios-time">09:41</view>
                                    </template>
                                    <template v-else-if="item.value === 'android-stock'">
                                        <view class="mc-time android-time">09:41</view>
                                        <view class="mc-date android-date">Tue, Oct 24</view>
                                    </template>
                                    <template v-else-if="item.value === 'hyperos-magazine'">
                                        <view class="mc-date hyper-date">OCT 24</view>
                                        <view class="mc-time hyper-time">
                                            <text>09</text>
                                            <text style="color: rgba(255,255,255,0.6); margin-left: 20rpx;">41</text>
                                        </view>
                                    </template>
                                    <template v-else-if="item.value === 'harmonyos'">
                                        <view class="mc-date harmony-date">10/24</view>
                                        <view class="mc-time harmony-time">09:41</view>
                                    </template>
                                    <template v-else-if="item.value === 'modern-left'">
                                        <view class="mc-time modern-time">
                                            <text>09</text>
                                            <text>41</text>
                                        </view>
                                        <view class="mc-date modern-date">10/24</view>
                                    </template>
                                    <template v-else-if="item.value === 'elegant-serif'">
                                        <view class="mc-time elegant-time">09:41</view>
                                        <view class="mc-date elegant-date">10/24</view>
                                    </template>
                                    <template v-else-if="item.value === 'tech-digital'">
                                        <view class="mc-time tech-time">09:41</view>
                                        <view class="mc-date tech-date">OCT 24</view>
                                    </template>
                                </view>
                                <text class="style-name">{{ t('previewPage.styleNames.' + item.value) }}</text>
                            </view>
                        </view>
                    </view>
                </scroll-view>
                
                <view class="action-bar">
                    <!-- 选中的是当前已激活的样式 -->
                    <template v-if="!tempClockStyle || tempClockStyle === activeSessionClockStyle">
                        <view class="free-hint">{{ t('previewPage.currentStyle') }}</view>
                        <button class="apply-btn apply-btn--disabled" disabled>{{ t('previewPage.applyStyle') }}</button>
                    </template>
                    <!-- 选中了新样式，且是 VIP 样式 -->
                    <template v-else-if="selectedClockStyleItem?.isVip && !userStore.isVip">
                        <view class="vip-hint">{{ t('previewPage.vipStyleHint') }}</view>
                        <button class="apply-btn" @click="applyTempClockStyle">{{ t('previewPage.unlockBtnVip') }}</button>
                    </template>
                    <!-- 选中了新样式，免费或已是 VIP -->
                    <template v-else>
                        <view class="free-hint">{{ t('previewPage.applyStyleHint') }}</view>
                        <button class="apply-btn" @click="applyTempClockStyle">{{ t('previewPage.applyStyle') }}</button>
                    </template>
                </view>
            </view>
        </uni-popup>
    </view>
</template>

<script setup>
import { ref, computed, reactive, onMounted, getCurrentInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTranslateParams } from '@/utils/i18n.js';
import { onLoad, onUnload, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import { IS_INTERNATIONAL } from '@/utils/system.js';
import { getStatusBarHeight } from '@/utils/layout.js';

import { VIDEO_REWARD_ENERGY, SERVICE_EMAIL } from '@/common/config.js';
import { downloadPic } from '@/common/core.js';
import {
    apiPostIncrementViews,
    apiPostIncrementDownloads,
    apiPostActions,
    apiPostUpdateWall,
    apiGetClassify,
    apiPostEarnEnergy,
} from '@/api/wallpaper.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useAppStore } from '@/stores/app.js';
import { useUserStore } from '@/stores/user.js';
import { useLibraryStore } from '@/stores/library.js';
import { useStatusStore } from '@/stores/status.js';
import { useAdIntersititial, useAdRewardedVideo } from '@/hooks/useAd.js';
import { formatPreviewDate, formatFileSize } from '@/utils/common.js';

const libraryStore = useLibraryStore();
const settingsStore = useSettingsStore();
const userStore = useUserStore();
const statusStore = useStatusStore();
const { createInterstitialAd, showInterstitialAd, destroyInterstitialAd } = useAdIntersititial();
const { createRewardedVideoAd, showRewardedVideoAd, destroyRewardedVideoAd } = useAdRewardedVideo();

// UI state
const hideUI = ref(false);
// 通用导航对话框控制
const navDialog = ref(null);
const dialogState = reactive({
    title: '',
    description: '',
    confirmText: '',
    cancelText: '',
    showCancel: true,
    onConfirm: () => {},
    onCancel: () => {},
});

/**
 * 显示自定义导航对话框
 * @param {Object} config 配置项 { title, content, confirmText, cancelText, onConfirm, onCancel }
 */
const showNavDialog = (config) => {
    dialogState.title = config.title || t('common.tip');
    dialogState.description = config.content || '';
    dialogState.confirmText = config.confirmText || t('common.confirm');
    dialogState.cancelText = config.cancelText || t('common.cancel');
    dialogState.showCancel = config.showCancel !== false;
    dialogState.onConfirm = () => {
        if (config.onConfirm) config.onConfirm();
        navDialog.value?.close();
    };
    dialogState.onCancel = () => {
        if (config.onCancel) config.onCancel();
        navDialog.value?.close();
    };
    navDialog.value?.open();
};

const clockStylePopup = ref(null);
const activeSessionClockStyle = ref('default');

onMounted(() => {
    let savedStyle = settingsStore.options.clockStyle || 'default';
    const savedItem = clockStyles.value.find(s => s.value === savedStyle);
    // 如果保存的是 VIP 样式，但当前用户不是 VIP，则回退为普通样式
    if (savedItem?.isVip && !userStore.isVip) {
        savedStyle = 'default';
        settingsStore.options.clockStyle = savedStyle; // 自动修复本地错误状态
    }
    activeSessionClockStyle.value = savedStyle;
});

const currentClockStyle = computed(() => activeSessionClockStyle.value);
const tempClockStyle = ref('');
const selectedClockStyleItem = computed(() => clockStyles.value.find(s => s.value === tempClockStyle.value));

const clockStyles = computed(() => [
    { value: 'default', name: 'Default', isVip: false },
    { value: 'ios-classic', name: 'iOS', isVip: false },
    { value: 'android-stock', name: 'Android', isVip: false },
    { value: 'hyperos-magazine', name: 'HyperOS', isVip: true },
    { value: 'harmonyos', name: 'HarmonyOS', isVip: true },
    { value: 'modern-left', name: 'Modern Left', isVip: true },
    { value: 'elegant-serif', name: 'Elegant Serif', isVip: true },
    { value: 'tech-digital', name: 'Tech Digital', isVip: true }
]);
const openClockStyle = () => {
    tempClockStyle.value = currentClockStyle.value;
    clockStylePopup.value?.open();
};
const closeClockStyle = () => {
    clockStylePopup.value?.close();
};

const onClockStylePopupChange = (e) => {
    // When popup closes, reset preview to saved style if user didn't apply
    if (!e.show) {
        tempClockStyle.value = '';
    }
};

const selectClockStyle = (item) => {
    tempClockStyle.value = item.value;
};

const applyTempClockStyle = async () => {
    const item = selectedClockStyleItem.value;
    if (!item) return;

    if (!userStore.isLoggedIn) {
        uni.showToast({ title: t('common.needLogin'), icon: 'none' });
        setTimeout(() => {
            uni.navigateTo({ url: '/pages/user/login' });
        }, 1000);
        return;
    }

    if (userStore.isVip || !item.isVip) {
        settingsStore.options.clockStyle = item.value;
        activeSessionClockStyle.value = item.value;
        uni.showToast({ title: 'Applied', icon: 'none' });
        closeClockStyle();
        return;
    }

    // Need energy, check if enough
    if (userStore.energy < 1) {
        const watchAdAndUnlock = () => {
            showRewardedVideoAd(null, {
                onSuccess: async () => {
                    try {
                        const adRes = await apiPostEarnEnergy({ action_type: 'watch_ad', amount: VIDEO_REWARD_ENERGY });
                        if (adRes.data?.energy !== undefined) {
                            userStore.updateEnergy(adRes.data.energy);
                            uni.showToast({ title: t('common.success'), icon: 'none' });
                        }
                    } catch (e) {
                        uni.showToast({ title: t('common.networkError'), icon: 'none' });
                    }
                }
            });
        };

        if (userStore.isAdmin) {
            uni.showActionSheet({
                itemList: [t('previewPage.watchAd'), t('membership.title')],
                success: (res) => {
                    if (res.tapIndex === 0) {
                        watchAdAndUnlock();
                    } else if (res.tapIndex === 1) {
                        uni.navigateTo({ url: '/pages/member/payment' });
                    }
                }
            });
        } else {
            uni.showModal({
                title: t('previewPage.energyNotEnoughTitle'),
                content: t('previewPage.energyNotEnoughHint'),
                confirmText: t('previewPage.watchAd'),
                cancelText: t('common.cancel'),
                success: (res) => {
                    if (res.confirm) {
                        watchAdAndUnlock();
                    }
                }
            });
        }
        return;
    }

    // Need energy, do it directly (Temporary session unlock)
    uni.showLoading({ title: t('common.loading') });
    try {
        const res = await userStore.consumeEnergy(0, 'consume_preview_style');
        if (res.data?.error) {
            uni.showToast({ title: res.data.error, icon: 'none' });
        } else {
            // 仅在当前会话生效，不保存到 settingsStore
            activeSessionClockStyle.value = item.value;
            uni.showToast({ title: t('previewPage.unlockStyleSuccess'), icon: 'none' });
            closeClockStyle();
        }
    } catch (e) {
        uni.showToast({ title: t('common.networkError'), icon: 'none' });
    } finally {
        uni.hideLoading();
    }
};

const avatarSeedSalt = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const { t, locale } = useI18n();
const { tp } = useTranslateParams();
const isEn = computed(() => locale.value === 'en');

const getLocalizedItem = (item) => {
    if (!item) return item;
    return {
        ...item,
        description: isEn.value && item.description_en ? item.description_en : item.description,
        classify_name: isEn.value && item.classify_name_en ? item.classify_name_en : item.classify_name,
    };
};

const currentTags = computed(() => {
    const item = currentInfo.value || {};
    if (isEn.value && item.tags_en_list?.length) {
        return item.tags_en_list;
    }
    return item.tags_list || [];
});
const initDate = new Date();
const timeText = computed(() => {
    const hh = String(initDate.getHours()).padStart(2, '0');
    const mm = String(initDate.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
});
const dateText = computed(() => {
    const isZh = String(locale.value || '').startsWith('zh');
    return formatPreviewDate(initDate, isZh);
});
const currentPreviewType = computed(() => settingsStore.options.previewType || 'classic');
const isAdmin = computed(() => !!userStore.isAdmin);
const isCurrentInWatchLater = computed(() => libraryStore.isInWatchLater(currentInfo.value?.id));
const publisherName = computed(() => {
    const publisher = currentInfo.value?.publisher;
    if (publisher === 'Admin') {
        return t('common.appName');
    }
    return publisher || '';
});
const imageSizeMap = ref({});
const publisherAvatar = computed(() => {
    const rawPublisher = String(currentInfo.value?.publisher || '')
        .trim()
        .toLowerCase();
    if (rawPublisher === 'bing') return '/static/icons/brands/microsoft-bing.svg';
    if (rawPublisher === 'pokemon') return '/static/icons/pokeball.svg';
    const seed = `${publisherName.value}-${currentInfo.value?.id || 'wall'}-${avatarSeedSalt}`;
    return `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
});

const getNumberField = (keys = []) => {
    for (const key of keys) {
        const value = Number(currentInfo.value?.[key]);
        if (value > 0) return value;
    }
    return 0;
};

const currentImageSize = computed(() => {
    const fromWall = {
        width: getNumberField(['width', 'image_width', 'pic_width']),
        height: getNumberField(['height', 'image_height', 'pic_height']),
    };
    if (fromWall.width && fromWall.height) return fromWall;
    return imageSizeMap.value[currentInfo.value?.id] || { width: 0, height: 0 };
});

const resolutionText = computed(() => {
    const { width, height } = currentImageSize.value;
    if (!width || !height) return '';
    return `${Math.round(width)} x ${Math.round(height)}`;
});

const getGreatestCommonDivisor = (a, b) => {
    let x = Math.abs(Math.round(a));
    let y = Math.abs(Math.round(b));
    while (y) {
        const next = x % y;
        x = y;
        y = next;
    }
    return x || 1;
};

const aspectRatioText = computed(() => {
    const { width, height } = currentImageSize.value;
    if (!width || !height) return '';
    const divisor = getGreatestCommonDivisor(width, height);
    return `${Math.round(width / divisor)}:${Math.round(height / divisor)}`;
});

const publishDateText = computed(() => {
    const raw = currentInfo.value?.created_at || currentInfo.value?.updated_at || '';
    if (!raw) return '';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
});

const classList = ref([]);
const appStore = useAppStore();
const wallList = appStore.wallList || [];
classList.value = wallList.map((item) => {
    // 增加tags_list字段，将字符串转换成数组
    return {
        ...item,
        is_favorited: !!item.is_favorited,
        tags_list: typeof item.tags === 'string' ? item.tags.split(',') : item.tags_list || [],
        tags_en_list: typeof item.tags_en === 'string' ? item.tags_en.split(',') : item.tags_en_list || [],
    };
});
const disableSwipe = ref(false);
const showScrollHint = ref(!statusStore.appStatus.hasSeenPreviewHint);
const statusBarHeight = ref(getStatusBarHeight() || 0);
// 使用新版 getWindowInfo API，搭配可选链兜底
const previewHeroHeightPx = uni.getWindowInfo?.()?.windowHeight || 667;
const previewViewportHeightPx = previewHeroHeightPx;
const statusBarFillOpacity = ref(0);

// ── 广告高度，控制预览页滚动区域 ──
const adHeight = ref(0);
const shouldShowBottomAd = ref(false);
const onAdHeightChange = (height) => {
    adHeight.value = Math.max(0, Number(height) || 0);
};
const resetBottomAdBanner = () => {
    shouldShowBottomAd.value = false;
    adHeight.value = 0;
};
const previewScrollStyle = computed(() => ({
    height: '100vh',
}));
const previewLayoutStyle = computed(() => ({
    paddingBottom: shouldShowBottomAd.value && adHeight.value > 0 ? `${adHeight.value}px` : '0px',
}));

const handlePreviewScroll = (e) => {
    const scrollTop = Number(e?.detail?.scrollTop || 0);
    const scrollHeight = Number(e?.detail?.scrollHeight || 0);

    const revealStart = previewHeroHeightPx * 0.05;
    const revealEnd = previewHeroHeightPx * 0.95;
    statusBarFillOpacity.value = Math.min(1, Math.max(0, (scrollTop - revealStart) / (revealEnd - revealStart)));

    const recommendScrollTop = Math.max(0, scrollTop - previewHeroHeightPx);
    const recommendScrollableDistance = Math.max(1, scrollHeight - previewViewportHeightPx - previewHeroHeightPx);
    const recommendProgress = Math.min(1, recommendScrollTop / recommendScrollableDistance);
    shouldShowBottomAd.value = recommendProgress >= 0.7;

    if (!showScrollHint.value) return;
    if (scrollTop > 60) {
        showScrollHint.value = false;
        statusStore.appStatus.hasSeenPreviewHint = true;
    }
};

// views字段值+1，防抖 + 请求锁，防止快速滑动时重复调用
const requestingViewIds = new Set();
let viewDebounceTimer = null;

const incrementViews = (id) => {
    // 请求锁：同一张图片正在请求中，跳过
    if (requestingViewIds.has(id)) return;

    // 防抖：清除上一次的定时器
    clearTimeout(viewDebounceTimer);

    // 设置新的定时器，滑动停止后 N ms 执行
    viewDebounceTimer = setTimeout(async () => {
        requestingViewIds.add(id);
        try {
            await apiPostIncrementViews(id);
            await apiPostActions({
                wall_id: id,
                action_key: 'view',
                action_value: 1,
            });
        } finally {
            requestingViewIds.delete(id);
        }
    }, 2000);
};

// downloads字段值+1
const incrementDownloads = async (id) => {
    let res = await apiPostIncrementDownloads(id);
    // console.log('increment downloads', res);
    await apiPostActions({
        wall_id: currentInfo.value.id,
        action_key: 'download',
        action_value: 1,
    });
};

// 胶囊避让逻辑
const capsuleRect = ref(null);
// #ifdef MP-WEIXIN
capsuleRect.value = uni.getMenuButtonBoundingClientRect();
// #endif

const backButtonTop = computed(() => {
    if (capsuleRect.value) {
        // 让返回键与胶囊垂直对齐
        return capsuleRect.value.top + (capsuleRect.value.height - 38) / 2;
    }
    if (getStatusBarHeight() === 0) return 24;
    return getStatusBarHeight();
});

const capsuleRightOffset = computed(() => {
    // #ifdef MP-WEIXIN
    if (capsuleRect.value) {
        const windowInfo = uni.getWindowInfo();
        // 计算胶囊左边缘距离页面右边缘的像素值，并加上额外间隙
        return windowInfo.windowWidth - capsuleRect.value.left + 10;
    }
    // #endif
    return 15; // H5/App 默认 30rpx 约等于 15px
});

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

const recordCurrentHistory = () => {
    if (!currentInfo.value?.id) return;
    libraryStore.recordRecentView(currentInfo.value);
};

// 点击评分弹窗
const scorePopup = ref(null);
const userScore = ref(0);
const openScore = () => {
    // 如果未登录，跳转到登录，或增加友好提示
    if (Object.keys(userStore.userinfo).length === 0) {
        showNavDialog({
            title: t('common.information'),
            content: t('previewPage.loginPrompt'),
            cancelText: t('previewPage.cancel'),
            confirmText: t('previewPage.login'),
            onConfirm: () => {
                uni.navigateTo({ url: '/pages/auth/signin' });
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
    tags: '',
    classify_id: '',
    publisher: '',
    score: 0,
    views: 0,
    downloads: 0,
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
        tags: currentInfo.value.tags || (currentInfo.value.tags_list || []).join(','),
        classify_id: currentClassify ? currentClassify.classify_id : '',
        publisher: currentInfo.value.publisher || '',
        score: currentInfo.value.score || 0,
        views: currentInfo.value.views || 0,
        downloads: currentInfo.value.downloads || 0,
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
    try {
        const payload = {
            id: currentInfo.value.id,
            ...editForm.value,
            score: Number(editForm.value.score) || 0,
            views: Number(editForm.value.views) || 0,
            downloads: Number(editForm.value.downloads) || 0,
        };
        await apiPostUpdateWall(payload);
        applyLocalUpdate({
            ...payload,
            tags_list: editForm.value.tags
                ? editForm.value.tags
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                : [],
        });
        uni.showToast({ title: t('previewPage.adminSaveSuccess'), icon: 'none' });
        closeEdit();
    } catch (error) {
        uni.showToast({ title: t('previewPage.adminSaveFailed'), icon: 'none' });
    }
};

const deleteWall = () => {
    showNavDialog({
        title: t('common.tip'),
        content: t('previewPage.adminDeleteConfirm'),
        confirmText: t('previewPage.adminDelete'),
        cancelText: t('previewPage.cancel'),
        onConfirm: async () => {
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
                uni.showToast({ title: t('previewPage.adminDeleteSuccess'), icon: 'none' });
                closeEdit();
            } catch (error) {
                uni.showToast({ title: t('previewPage.adminDeleteFailed'), icon: 'none' });
            }
        },
    });
};

const toggleLock = async () => {
    const next = !currentInfo.value.is_locked;
    try {
        await apiPostUpdateWall({ id: currentInfo.value.id, is_locked: next });
        applyLocalUpdate({ is_locked: next });
        uni.showToast({ title: t('previewPage.lockToggled'), icon: 'none' });
    } catch (error) {
        uni.showToast({ title: t('previewPage.lockToggleFailed'), icon: 'none' });
    }
};

const handleShare = () => {
    // #ifdef APP
    // TODO https://uniapp.dcloud.net.cn/api/plugins/share.html#share
    uni.share({
        provider: 'weixin',
        // WXSceneSession	分享到聊天界面
        // WXSceneTimeline	分享到朋友圈
        // WXSceneFavorite	分享到微信收藏
        scene: 'WXSceneSession',
        type: 0,
        summary: t('common.appName'),
        success: () => {
            uni.showToast({ title: t('previewPage.shareSuccess'), icon: 'success' });
        },
        fail: (e) => {
            console.log(e);
            uni.showToast({ title: t('previewPage.shareFailed'), icon: 'none' });
        },
    });
    // #endif

    // #ifdef WEB
    uni.showToast({ title: t('previewPage.shareHint'), icon: 'none' });
    // #endif
};

const toggleCollect = async () => {
    // 如果未登录，跳转到登录，或增加友好提示
    if (Object.keys(userStore.userinfo).length === 0) {
        showNavDialog({
            title: t('common.information'),
            content: t('previewPage.loginPrompt'),
            cancelText: t('previewPage.cancel'),
            confirmText: t('previewPage.login'),
            onConfirm: () => {
                uni.navigateTo({ url: '/pages/auth/signin' });
            },
        });
        return;
    }

    const nextCollect = !currentInfo.value.is_favorited;
    try {
        await apiPostActions({
            wall_id: currentInfo.value.id,
            action_key: 'favorite',
            action_value: nextCollect ? 1 : 0,
        });

        currentInfo.value.is_favorited = nextCollect;
        if (classList.value[currentIndex.value]) {
            classList.value[currentIndex.value].is_favorited = nextCollect;
        }

        uni.showToast({
            title: nextCollect ? t('previewPage.favoriteSuccess') : t('previewPage.unfavoriteSuccess'),
            icon: 'none',
        });
    } catch (error) {
        uni.showToast({
            title: t('previewPage.favoriteFailed'),
            icon: 'none',
        });
    }
};

const toggleWatchLater = () => {
    if (!currentInfo.value?.id) return;
    const saved = libraryStore.toggleWatchLater(currentInfo.value);
    uni.showToast({
        title: saved ? t('historyPage.savedToast') : t('historyPage.removedToast'),
        icon: 'none',
    });
};

const goSearchByTag = (tag) => {
    const keyword = String(tag || '').trim();
    if (!keyword) return;
    if (isAdmin.value) {
        libraryStore.bumpPreferredTag(keyword);
    }
    closeInfo();
    uni.navigateTo({
        url: `/pages/app/search?keyword=${encodeURIComponent(keyword)}`,
    });
};

const submitScore = async () => {
    // TODO
    // 接口获取用户评分，没有评分的用户默认为0分
    // userScore.value =
    // let userid = ...  // 获取用户id
    // let {classid, _id: wallId} = currentInfo.value;  // 获取分类id和图片id
    // 然后调用接口请求进行增删改等操作
    try {
        let res = await apiPostActions({
            wall_id: currentInfo.value.id,
            action_key: 'rate',
            action_value: userScore.value,
        });

        if (userStore.isAdmin) {
            apiPostEarnEnergy({ action_type: 'wallpaper_rate', amount: 1 }).then((energyRes) => {
                if (energyRes.data?.energy !== undefined) {
                    userStore.updateEnergy(energyRes.data.energy);
                }
            });
        }

        uni.showToast({
            title: t('previewPage.ratingSuccess'),
            icon: 'none',
        });
        closeScore();
    } catch (error) {
        uni.showToast({
            title: t('previewPage.ratingFailed'),
            icon: 'none',
        });
    }
};

// 点击下载弹窗观看广告
const adPopup = ref(null);

const clickDownload = async () => {
    // #ifdef WEB
    showNavDialog({
        content: t('previewPage.savePrompt'),
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

    if (currentInfo.value.is_locked) {
        if (userStore.energy > 0) {
            uni.showLoading({ title: 'Processing...', mask: true });
            const res = await userStore.consumeEnergy(currentInfo.value.id);
            uni.hideLoading();

            if (res.data?.energy !== undefined) {
                downloadPic(currentInfo.value.picurl);
                incrementDownloads(currentInfo.value.id);
            } else {
                uni.showToast({ title: res.data?.error || 'Consume energy failed', icon: 'none' });
            }
        } else {
            // 弹出观看视频提示框
            adPopup.value.open();
        }
        // adPopup.value.open();
    } else {
        // 展示插屏广告，关闭后再下载图片（不再出现广告挡住下载提示的问题）
        showInterstitialAd(currentInfo.value.picurl, {
            onSuccess: (picurl) => {
                // 广告关闭后执行下载
                downloadPic(picurl);
                incrementDownloads(currentInfo.value.id);
            },
            onFallback: (picurl) => {
                // 广告异常直接下载
                downloadPic(picurl);
                incrementDownloads(currentInfo.value.id);
            },
        });
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

const handleImageLoad = (index, event) => {
    loadedImageMap.value[index] = true;
    const item = classList.value[index];
    const width = Number(event?.detail?.width || 0);
    const height = Number(event?.detail?.height || 0);
    if (!item?.id || !width || !height) return;
    imageSizeMap.value[item.id] = { width, height };
};

// OnLoad接收参数
const currentId = ref(null);
const currentIndex = ref(0);

const isCurrentSlideLoading = computed(
    () => readImgs.value.includes(currentIndex.value) && !loadedImageMap.value[currentIndex.value],
);
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
        resetBottomAdBanner();
        readImgsFun();
        recordCurrentHistory();
        incrementViews(currentInfo.value.id);
    }

    // createInterstitialAd(); // 创建插屏广告
    // createRewardedVideoAd(); // 创建激励视频广告
});

onUnload(() => {
    clearTimeout(viewDebounceTimer);
    viewDebounceTimer = null;
    // destroyInterstitialAd(); // 销毁插屏广告
    // destroyRewardedVideoAd(); // 销毁激励视频广告
});

// 滑动事件，变化当前数字
const swiperChange = (e) => {
    if (disableSwipe.value) return;
    currentIndex.value = e.detail.current;
    currentInfo.value = classList.value[currentIndex.value];
    resetBottomAdBanner();
    readImgsFun();
    recordCurrentHistory();
    incrementViews(currentInfo.value.id);
};

//分享给好友
onShareAppMessage((e) => {
    // 分享图片奖励1点能量
    apiPostEarnEnergy({ action_type: 'share_image', amount: 1 }).then((res) => {
        if (res.data?.energy !== undefined) {
            userStore.updateEnergy(res.data.energy);
            if (res.data.msg) {
                uni.showToast({ title: res.data.msg, icon: 'none' });
            } else {
                uni.showToast({ title: '分享成功，能量+1', icon: 'none' });
            }
        }
    });

    // 读取缓存数据的话需要增加type=share，分享到的用户就可以不读缓存，直接读取数据库数据
    return {
        title: t('common.appName'),
        path: '/pages/app/preview?id=' + currentId.value + '&type=share',
    };
});

//分享朋友圈
onShareTimeline(() => {
    // 分享朋友圈奖励3点能量
    apiPostEarnEnergy({ action_type: 'share_timeline', amount: 3 }).then((res) => {
        if (res.data?.energy !== undefined) {
            userStore.updateEnergy(res.data.energy);
            if (res.data.msg) {
                uni.showToast({ title: res.data.msg, icon: 'none' });
            } else {
                uni.showToast({ title: '分享朋友圈成功，能量+3', icon: 'none' });
            }
        }
    });

    return {
        title: t('common.appName'),
        query: 'id=' + currentId.value + '&type=share',
    };
});
</script>

<style lang="scss" scoped>
.preview-page {
    position: relative;
    height: 100vh;
}

.preview-statusbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 120;
    pointer-events: none;
    background: var(--page-background);
    transition: opacity 0.22s ease;
}

.previewLayout {
    width: 100%;
    position: relative;
    min-height: 100vh;
    background: var(--page-background);
}

.previewScroll {
    height: 100vh;
}

.previewHero {
    width: 100%;
    height: 100vh;
    position: relative;

    .preview-swiper {
        width: 100%;
        height: 100%;

        .preview-slide {
            width: 100%;
            height: 100%;
            position: relative;
            background: var(--page-background);
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
                radial-gradient(circle at center, rgba(64, 100, 138, 0.08), transparent 28%),
                linear-gradient(180deg, var(--page-background) 0%, var(--page-background-secondary) 100%);
            z-index: 1;

            .theme-dark & {
                background:
                    radial-gradient(circle at center, rgba(64, 100, 138, 0.18), transparent 28%),
                    linear-gradient(180deg, #0a0f15 0%, #0d141d 100%);
            }
        }

        .preview-loading__glow {
            position: absolute;
            width: 360rpx;
            height: 360rpx;
            border-radius: 999rpx;
            background: radial-gradient(circle, rgba(110, 168, 255, 0.12) 0%, rgba(110, 168, 255, 0) 72%);
            filter: blur(10rpx);

            .theme-dark & {
                background: radial-gradient(circle, rgba(110, 168, 255, 0.18) 0%, rgba(110, 168, 255, 0) 72%);
            }
        }

        .preview-loading__text {
            position: relative;
            z-index: 1;
            font-size: 24rpx;
            color: var(--text-secondary);
            letter-spacing: 1rpx;

            .theme-dark & {
                color: rgba(255, 255, 255, 0.72);
            }
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
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
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
            font-size: 168rpx;
            font-weight: 400;
            letter-spacing: 2rpx;
            color: rgba(255, 255, 255, 0.95);
            line-height: 1em;
            // 多层文字阴影：近距重阴影提升对比 + 大模糊光晕扩散，任he背景道可读
            text-shadow:
                0 2rpx 6rpx rgba(0, 0, 0, 0.55),
                0 6rpx 20rpx rgba(0, 0, 0, 0.4),
                0 16rpx 48rpx rgba(0, 0, 0, 0.28);
        }

        .date {
            top: calc(12vh + 280rpx);
            font-size: 30rpx;
            font-weight: 500;
            letter-spacing: 1rpx;
            color: rgba(255, 255, 255, 0.9);
            text-shadow:
                0 1rpx 4rpx rgba(0, 0, 0, 0.6),
                0 4rpx 14rpx rgba(0, 0, 0, 0.4);
        }

        .scrollHint {
            z-index: 100;
            bottom: calc(env(safe-area-inset-bottom) + 20rpx);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4rpx;
            animation: preview-bounce 1.5s ease-in-out infinite;
            opacity: 0.85;

            .hint-text {
                font-size: 22rpx;
                color: #ffffff;
                font-weight: 500;
                letter-spacing: 2rpx;
                text-shadow: 
                    0 2rpx 8rpx rgba(0, 0, 0, 0.8),
                    0 0 4rpx rgba(0, 0, 0, 0.8);
                margin-top: 4rpx;
            }

            :deep(.uni-icons) {
                color: #ffffff !important;
                filter: drop-shadow(0 2rpx 6rpx rgba(0, 0, 0, 0.8));
                height: 24rpx;
                line-height: 24rpx;
            }

            .hint-icon {
                opacity: 0.9;
                
                // &.second {
                //     opacity: 0.5;
                //     margin-top: -8rpx;
                // }
            }
        }

        .footer {
            background: rgba(255, 255, 255, 0.85);
            bottom: 10vh;
            width: 80vw;
            height: 120rpx;
            border-radius: 120rpx;
            color: #1a1a1a;
            display: flex;
            justify-content: space-around;
            align-items: center;
            /* 增强阴影和细微边框，确保在全白背景下也能看清药丸轮廓 */
            box-shadow:
                0 4rpx 24rpx rgba(0, 0, 0, 0.12),
                0 2rpx 8rpx rgba(0, 0, 0, 0.08);
            border: 1rpx solid rgba(0, 0, 0, 0.04);
            backdrop-filter: blur(20rpx);

            :deep(.uni-icons) {
                color: #1a1a1a !important;
                text-shadow: none;
            }

            .box {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                padding: 2rpx 12rpx;
                gap: 4rpx;

                .text {
                    font-size: 26rpx;
                    font-weight: 500;
                    color: #1a1a1a;
                    text-shadow: none;
                }
            }
        }

        .right-actions {
            position: absolute;
            right: 8rpx;
            // bottom: calc(env(safe-area-inset-bottom) + 76rpx);
            bottom: 88rpx;
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
                font-weight: 600;
                text-align: center;
                white-space: nowrap;
                color: rgba(255, 255, 255, 0.95);
                // 苹果风格：近距描边光晕 + 中距阴影 + 大范围扩散
                text-shadow:
                    0 0 2rpx rgba(0, 0, 0, 0.6),
                    0 1rpx 4rpx rgba(0, 0, 0, 0.5),
                    0 4rpx 14rpx rgba(0, 0, 0, 0.4),
                    0 10rpx 28rpx rgba(0, 0, 0, 0.3);
            }

            :deep(.uni-icons) {
                color: #fff !important;
                // 给图标也加同款阴影，浅色背景下轮廓清晰
                filter: drop-shadow(0 0 2rpx rgba(0, 0, 0, 0.55)) drop-shadow(0 2rpx 6rpx rgba(0, 0, 0, 0.45))
                    drop-shadow(0 6rpx 18rpx rgba(0, 0, 0, 0.3));
            }
        }

        .left-meta {
            position: absolute;
            left: 44rpx;
            bottom: 0;
            right: 170rpx;
            width: auto;
            min-width: 0;
            max-width: none;
            color: #fff;
            text-shadow: 0 3rpx 10rpx rgba(0, 0, 0, 0.55);
            z-index: 2;
            padding: 20rpx 20rpx 100rpx;
            margin: 0;

            &::before {
                content: '';
                position: absolute;
                left: -44rpx;
                right: -170rpx;
                bottom: 0;
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
                font-weight: 400;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                line-clamp: 2;
                word-break: break-word;
                overflow-wrap: anywhere;
                overflow: hidden;
                text-overflow: ellipsis;
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

    .info-scroll-view {
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

                .tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12rpx;
                    padding-top: 4rpx;

                    .tag {
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
        }
    }
}

.scorePopup {
    background: var(--popup-background, #fff);
    padding: 30rpx;
    width: 80vw;
    max-width: 500rpx;
    border-radius: 32rpx;
    box-shadow: 0 20rpx 60rpx var(--popup-shadow, rgba(0, 0, 0, 0.15));
    overflow: hidden;

    .popHeader {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 10rpx 20rpx 10rpx;
        border-bottom: 1rpx solid var(--panel-border, #f0f0f0);

        .title {
            font-size: 34rpx;
            font-weight: 700;
            color: var(--text-primary, #333);
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

    .confirm-btn {
        height: 76rpx;
        padding: 0 48rpx;
        border-radius: 999rpx;
        border: 1rpx solid var(--popup-border, rgba(17, 17, 17, 0.08));
        background: var(--text-primary, #15171c);
        color: var(--popup-background, #fff);
        font-size: 28rpx;
        font-weight: 700;
    }

    .confirm-btn[disabled] {
        opacity: 0.4;
    }

    .confirm-btn::after {
        border: none;
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

    .edit-scroll-view {
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

        .row-field {
            flex-direction: row;
            align-items: center;
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

        .inline-item--metric {
            min-height: 88rpx;
        }

        .inline-item--metric .label {
            width: 132rpx;
            flex: 0 0 132rpx;
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

        .stat-input {
            flex: 1;
            width: auto;
            height: 40rpx;
            min-height: 40rpx;
            padding: 0;
            background: transparent;
            border-radius: 0;
            text-align: right;
            line-height: 40rpx;
        }

        .rate-input {
            display: flex;
            align-items: center;
            gap: 16rpx;
            min-height: 80rpx;
            flex: 1;
            // justify-content: flex-end;
        }

        .rate-input__text {
            font-size: 28rpx;
            color: $wp-font-color-2;
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
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 0;
            line-height: 1;
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
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 0;
            line-height: 1;
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
.clockStylePopup-container {
    background: #ffffff;
    border-radius: 32rpx 32rpx 0 0;
    padding: 40rpx;
    
    &.theme-dark {
        background: #1a1a1a;
        .header .title { color: #ffffff; }
        // uni-icons closeempty 按钮需要 filter 让其变白
        .header .uni-icons { color: #ffffff !important; filter: brightness(10); }
        .style-item .style-preview { background: #2a2a2a; border-color: #333; }
        .style-item.active .style-preview { border-color: #007aff; }
        .style-item .style-name { color: #cccccc; }
        .style-item.active .style-name { color: #ffffff; }
        // minimalist-art 在 dark 下保持更深背景以区分
        .style-item .style-preview.minimalist-art {
            background: #0e0e12;
            .mini-clock-layout { color: rgba(255,255,255,0.85); }
            .style-name { color: rgba(255,255,255,0.6); }
        }
    }
    
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10rpx;
        
        .title {
            font-size: 36rpx;
            font-weight: 600;
            color: #1a1a1a;
        }
    }
    
    .style-list {
        width: 100%;
        white-space: nowrap;
        
        .style-scroll-content {
            display: inline-flex;
            gap: 24rpx;
            padding: 10rpx;
        }
        
        .style-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 180rpx;
            
            .style-preview {
                width: 100%;
                height: 320rpx;
                background: #f0f2f5;
                border: 4rpx solid transparent;
                border-radius: 24rpx;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-end;
                position: relative;
                transition: all 0.3s ease;
                overflow: hidden;

                .vip-tag {
                    position: absolute;
                    top: 12rpx;
                    right: 12rpx;
                    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%);
                    color: #e91e63;
                    font-size: 18rpx;
                    font-weight: 800;
                    padding: 2rpx 10rpx;
                    border-radius: 12rpx;
                    z-index: 2;
                }

                .mini-clock-layout {
                    position: absolute;
                    top: 40rpx;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    color: #333;
                    text-shadow: none;

                    .mc-date { font-size: 18rpx; }
                    .mc-time { font-size: 48rpx; font-weight: bold; line-height: 1; }

                    .default-time { font-weight: 400; font-size: 56rpx; line-height: 1em; letter-spacing: 2rpx; margin-top: 6rpx; }
                    .default-date { font-weight: 500; font-size: 16rpx; letter-spacing: 1rpx; margin-top: 10rpx; opacity: 0.9; }

                    .ios-time { font-weight: 800; font-size: 52rpx; margin-top: 4rpx; }
                    .android-time { font-weight: 300; font-size: 46rpx; }
                    .android-date { opacity: 0.9; margin-top: 4rpx; font-size: 16rpx;}
                    
                    .hyper-date { font-weight: 800; letter-spacing: 2rpx; font-size: 16rpx; margin-bottom: -4rpx; }
                    .hyper-time { display: flex; flex-direction: column; font-weight: 900; line-height: 0.85; font-size: 54rpx; margin-left: 20rpx;}
                    
                    .harmony-date { background: rgba(0,0,0,0.05); padding: 2rpx 12rpx; border-radius: 20rpx; margin-top: 8rpx; }
                    .harmony-time { font-weight: 500; font-size: 50rpx; }

                    .modern-time { display: flex; flex-direction: column; font-weight: 600; font-size: 48rpx; line-height: 0.85; align-items: flex-start; left: 24rpx; position: absolute; margin-top: 10rpx;}
                    .modern-date { writing-mode: vertical-rl; position: absolute; left: 78rpx; top: 12rpx; font-size: 14rpx; font-weight: 600; letter-spacing: 2rpx; }
                    
                    .elegant-time { font-family: serif; font-weight: 500; font-size: 52rpx; margin-top: 10rpx; }
                    .elegant-date { font-family: serif; font-style: italic; font-size: 16rpx; margin-top: 4rpx; }
                    
                    .tech-time { font-family: monospace; font-weight: 300; font-size: 46rpx; letter-spacing: -2rpx; margin-top: 10rpx;}
                    .tech-date { font-family: monospace; font-size: 14rpx; letter-spacing: 2rpx; margin-top: 6rpx; background: rgba(128,128,128,0.1); padding: 2rpx 6rpx; border: 1px solid rgba(128,128,128,0.2); }
                }
                
                .style-name {
                    font-size: 22rpx;
                    color: #666;
                    font-weight: 500;
                    white-space: normal;
                    text-align: center;
                    padding: 12rpx 10rpx;
                    width: 100%;
                    background: transparent;
                }
            }
            
            &.active .style-preview {
                border-color: #007aff;
                background: rgba(0, 122, 255, 0.05);
                transform: scale(1.02);
                box-shadow: 0 8rpx 24rpx rgba(0, 122, 255, 0.15);
                
                &.minimalist-art {
                    background: #1e2535;
                    .mini-clock-layout { color: rgba(255,255,255,0.88); }
                    .style-name { color: rgba(255,255,255,0.7); }
                }
            }
        }
    }

    .action-bar {
        margin-top: 30rpx;
        padding-top: 20rpx;
        border-top: 1rpx solid #eee;

        .vip-hint {
            font-size: 20rpx;
            color: #999;
            text-align: center;
            margin-bottom: 16rpx;
        }

        .apply-btn {
            background: #007aff;
            color: #fff;
            border-radius: 40rpx;
            font-size: 30rpx;
            font-weight: 600;
            border: none;
            height: 80rpx;
            line-height: 80rpx;
            
            &:active {
                opacity: 0.8;
            }
        }
    }
    
    .is-hidden {
        visibility: hidden;
    }
    
    .free-hint {
        font-size: 20rpx;
        color: #999;
        text-align: center;
        margin-bottom: 16rpx;
    }
    
    .apply-btn--disabled {
        background: #e0e0e0 !important;
        color: #aaa !important;
        cursor: not-allowed;
    }
}
.theme-dark .clockStylePopup-container {
    .style-item {
        .style-preview {
            background: #2a2b2e;
            .mini-clock-layout {
                color: #fff;
                .harmony-date { background: rgba(255,255,255,0.1); }
            }
            .style-name {
                color: #aaa;
            }
        }
        .style-preview.minimalist-art {
            background: #0e0e12 !important;
            .mini-clock-layout { color: rgba(255,255,255,0.85) !important; }
            .style-name { color: rgba(255,255,255,0.6) !important; }
        }
        &.active .style-preview {
            background: rgba(0, 122, 255, 0.15);
        }
        &.active .style-preview.minimalist-art {
            background: #1a2040 !important;
        }
    }
    .action-bar {
        border-color: #333;
        .free-hint, .vip-hint { color: #888; }
        .apply-btn--disabled {
            background: #333 !important;
            color: #666 !important;
        }
    }
}

.preview-extra-panel {
    padding: 24rpx 36rpx 30rpx 36rpx;
    background: transparent;

    .extra-disclaimer {
        display: flex;
        align-items: flex-start;
        gap: 12rpx;
        padding-bottom: 24rpx;
        margin-bottom: 24rpx;
        border-bottom: 1px dashed rgba(255, 255, 255, 0.1);

        .theme-light & {
            border-bottom-color: rgba(0, 0, 0, 0.08);
        }

        .disclaimer-icon {
            flex-shrink: 0;
            margin-top: 2rpx;
        }

        .disclaimer-text {
            font-size: 22rpx;
            color: #94a3b8;
            line-height: 1.5;

            .theme-light & {
                color: #64748b;
            }
        }
    }

    .extra-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20rpx 32rpx;

        .grid-cell {
            display: flex;
            align-items: center;
            gap: 12rpx;

            .cell-label {
                font-size: 24rpx;
                color: #94a3b8;
                flex-shrink: 0;

                .theme-light & {
                    color: #64748b;
                }
            }

            .cell-value {
                font-size: 24rpx;
                font-weight: 600;
                color: #f1f5f9;
                margin-left: auto;

                .theme-light & {
                    color: #0f172a;
                }
            }
        }
    }
}
</style>
