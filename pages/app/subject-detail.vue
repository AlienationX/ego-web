<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- Studio 展厅聚光柔光漫反射背景 (纯净、高级、永不过时) -->
        <view class="studio-backdrop"></view>

        <!-- 顶部沉浸式毛玻璃导航条 -->
        <view class="top-nav" :style="{ paddingTop: `${statusBarHeight}px` }">
            <view class="nav-bar" :style="{ height: `${titleBarHeight}px` }">
                <view class="nav-btn" @click="goBack">
                    <mdi-icon
                        path="/static/icons/arrow-left.svg"
                        size="20px"
                        :color="settingsStore.isDark ? '#ffffff' : '#0f172a'"
                    ></mdi-icon>
                </view>

                <view class="nav-center">
                    <view class="subject-badge" v-if="currentSubject?.is_locked">
                        <uni-icons type="vip-filled" size="12" color="#f59e0b"></uni-icons>
                        <text class="badge-text">VIP ONLY</text>
                    </view>
                    <text class="subject-title">{{ heroTitle }}</text>
                </view>

                <view class="nav-btn" @click="handleShare">
                    <mdi-icon
                        path="/static/icons/share-variant.svg"
                        size="18px"
                        :color="settingsStore.isDark ? '#ffffff' : '#0f172a'"
                    ></mdi-icon>
                </view>
            </view>
        </view>

        <!-- 骨架屏加载状态 -->
        <view class="loading-state" v-if="isLoading">
            <view class="skeleton-card"></view>
            <view class="skeleton-line skeleton-line--short"></view>
            <view class="skeleton-line"></view>
        </view>

        <!-- 空数据状态 -->
        <view class="empty-state" v-else-if="wallpaperList.length === 0">
            <mdi-icon path="/static/icons/image-outline.svg" size="56px" :color="settingsStore.isDark ? '#64748b' : '#94a3b8'"></mdi-icon>
            <text class="empty-text">{{ t('common.noData') || '该专题暂无壁纸' }}</text>
            <button class="empty-btn" @click="goBack">{{ t('common.back') || '返回上一页' }}</button>
        </view>

        <!-- 核心 3D 景深卡片轮播 (Cover Flow: 1:1 还原视频两侧露出比例) -->
        <view class="gallery-wrapper" v-else>
            <swiper
                class="gallery-swiper"
                :current="currentIndex"
                previous-margin="116rpx"
                next-margin="116rpx"
                :circular="wallpaperList.length > 2"
                @change="onSwiperChange"
            >
                <swiper-item
                    v-for="(item, index) in wallpaperList"
                    :key="item.id || index"
                    class="swiper-item-box"
                >
                    <view
                        class="gallery-card"
                        :class="{ 'is-active': index === currentIndex }"
                        @click="openPreview(item.id)"
                    >
                        <!-- 壁纸图片 (纯净全屏展示，无遮罩无多余文字) -->
                        <image
                            class="card-image"
                            :src="item.picurl"
                            mode="aspectFill"
                            lazy-load
                            @error="onImageError(item)"
                        ></image>

                        <!-- 卡片右上角 VIP 标签 -->
                        <view class="card-badge" v-if="item.is_locked">
                            <uni-icons type="vip-filled" size="14" color="#f59e0b"></uni-icons>
                            <text class="badge-label">VIP</text>
                        </view>
                    </view>
                </swiper-item>
            </swiper>

            <!-- 卡片下方专题与壁纸详细描述区 (纯文本居中展示，无背景无边框) -->
            <view class="detail-section" :style="{ paddingBottom: `calc(44rpx + env(safe-area-inset-bottom))` }">
                <!-- 序号指示器 -->
                <view class="pager-indicator">
                    <text class="current-num">{{ String(currentIndex + 1).padStart(2, '0') }}</text>
                    <text class="divider">/</text>
                    <text class="total-num">{{ String(wallpaperList.length).padStart(2, '0') }}</text>
                </view>

                <!-- 专题详细描述 (纯文本，居中排版，无背景无边框) -->
                <view class="desc-container" v-if="heroDesc">
                    <text class="desc-text">{{ heroDesc }}</text>
                </view>

                <!-- 标签列表 -->
                <view class="tags-row" v-if="activeTags.length > 0">
                    <view class="tag-chip" v-for="(tag, tIdx) in activeTags" :key="tIdx">
                        <text class="tag-text">#{{ tag }}</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 广告横幅（如果开启） -->
        <custom-ad-banner v-if="IS_INTERNATIONAL" v-slot="{ adActive }" @height-change="onAdHeightChange"></custom-ad-banner>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { apiGetSubjectDetail, apiGetClassList } from '@/api/wallpaper.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useAppStore } from '@/stores/app.js';
import { getStatusBarHeight, getTitleBarHeight } from '@/utils/layout.js';
import { handlePicUrl } from '@/utils/common.js';
import { IS_INTERNATIONAL } from '@/utils/system.js';

const { t, locale } = useI18n();
const settingsStore = useSettingsStore();
const appStore = useAppStore();
const isEn = computed(() => locale.value === 'en');

const props = defineProps({
    id: String,
    name: String,
    name_en: String,
});

const currentId = ref('');
const currentSubject = ref(null);
const wallpaperList = ref([]);
const currentIndex = ref(0);
const isLoading = ref(true);

const statusBarHeight = ref(getStatusBarHeight() || 0);
const titleBarHeight = ref(getTitleBarHeight() || 44);
const adHeight = ref(0);

const onAdHeightChange = (height) => {
    adHeight.value = Math.max(0, Number(height) || 0);
};

// 当前焦点壁纸对象
const currentWallpaper = computed(() => {
    if (wallpaperList.value.length === 0) return null;
    return wallpaperList.value[currentIndex.value] || wallpaperList.value[0];
});

// 环境光背景图
const currentWallpaperPic = computed(() => {
    return currentWallpaper.value?.picurl || currentSubject.value?.cover_url || '';
});

// 专题标题
const heroTitle = computed(() => {
    if (currentSubject.value) {
        return isEn.value ? (currentSubject.value.name_en || currentSubject.value.name) : currentSubject.value.name;
    }
    return isEn.value ? (props.name_en || props.name || '') : (props.name || '');
});

// 专题描述
const heroDesc = computed(() => {
    if (currentSubject.value) {
        return isEn.value ? (currentSubject.value.content_en || currentSubject.value.content) : currentSubject.value.content;
    }
    return '';
});

// 活跃标签列表
const activeTags = computed(() => {
    const wall = currentWallpaper.value;
    if (wall) {
        const tagStr = isEn.value && wall.tags_en ? wall.tags_en : wall.tags;
        if (tagStr) {
            return tagStr.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4);
        }
    }
    if (currentSubject.value) {
        const subTags = isEn.value && currentSubject.value.tags_en ? currentSubject.value.tags_en : currentSubject.value.tags;
        if (subTags) {
            return subTags.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4);
        }
    }
    return [];
});

// 获取专题详情与精选壁纸列表
const loadSubjectData = async (id) => {
    isLoading.value = true;
    try {
        const [subjectRes, listRes] = await Promise.all([
            apiGetSubjectDetail(id).catch(() => null),
            apiGetClassList({
                subject_id: parseInt(id),
                pageNum: 1,
                pageSize: 50,
                sortord: 'score',
            }).catch(() => null),
        ]);

        if (subjectRes && subjectRes.code === 200 && subjectRes.data) {
            currentSubject.value = handlePicUrl(subjectRes.data);
        }

        if (listRes && listRes.code === 200 && listRes.data) {
            const rawList = Array.isArray(listRes.data) ? listRes.data : (listRes.data.list || []);
            wallpaperList.value = rawList.map((item) => handlePicUrl(item));
        } else if (currentSubject.value?.preview_walls && currentSubject.value.preview_walls.length > 0) {
            // 兜底方案：如果分类列表接口暂无数据，使用专题自带的预览壁纸
            wallpaperList.value = currentSubject.value.preview_walls.map((url, idx) => ({
                id: `preview-${idx}`,
                picurl: url,
                score: 5,
                width: 1290,
                height: 2796,
            }));
        }
    } catch (err) {
        console.error('Failed to load subject gallery data:', err);
    } finally {
        isLoading.value = false;
    }
};

const onImageError = (item) => {
    console.warn('Subject wallpaper image failed to load:', item?.id, item?.picurl);
};

// 轮播切换回调
const onSwiperChange = (e) => {
    currentIndex.value = e.detail.current;
};

// 进入全屏沉浸预览 (联动 Hero 展开动画)
const openPreview = (wallId) => {
    const id = wallId || currentWallpaper.value?.id;
    if (!id) return;
    appStore.wallList = wallpaperList.value;
    uni.setStorageSync('storageClassList', wallpaperList.value);
    uni.navigateTo({
        url: `/pages/app/preview?id=${id}`,
    });
};

// 返回上一页
const goBack = () => {
    uni.navigateBack({
        fail: () => {
            uni.reLaunch({ url: '/pages/app/index' });
        },
    });
};

// 分享
const handleShare = () => {
    const title = heroTitle.value || '精选壁纸专题';
    if (uni.shareWithSystem) {
        uni.shareWithSystem({
            summary: title,
            href: `/pages/app/subject-detail?id=${currentId.value}`,
            fail: () => {
                uni.setClipboardData({
                    data: title,
                    success: () => uni.showToast({ title: t('common.copied'), icon: 'none' }),
                });
            },
        });
    } else {
        uni.setClipboardData({
            data: title,
            success: () => uni.showToast({ title: t('common.copied'), icon: 'none' }),
        });
    }
};

onShareAppMessage(() => ({
    title: heroTitle.value || '精选壁纸专题',
    path: `/pages/app/subject-detail?id=${currentId.value}`,
}));

onShareTimeline(() => ({
    title: heroTitle.value || '精选壁纸专题',
    query: `id=${currentId.value}`,
}));

onLoad((options) => {
    const id = options.id || props.id;
    currentId.value = id;
    if (id) {
        loadSubjectData(id);
    }
});
</script>

<style lang="scss" scoped>
.layout {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background-color: var(--page-background);
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    transition: background-color 0.3s ease, color 0.3s ease;
}

/* Studio 展厅柔光背景：中心微弱聚光漫反射渐变，高级通透，百搭任何壁纸 */
.studio-backdrop {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    transition: background 0.3s ease;

    .theme-light & {
        background: radial-gradient(
            circle at 50% 38%,
            #ffffff 0%,
            #f8fafc 48%,
            #edf2f7 100%
        );
    }

    .theme-dark & {
        background: radial-gradient(
            circle at 50% 38%,
            #171c26 0%,
            #0f141d 50%,
            #090c12 100%
        );
    }
}

/* 顶部沉浸式导航条 */
.top-nav {
    position: relative;
    z-index: 20;
    width: 100%;
}

.nav-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32rpx;
}

.nav-btn {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(20rpx);
    -webkit-backdrop-filter: blur(20rpx);
    transition: transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;

    .theme-dark & {
        background: rgba(255, 255, 255, 0.14);
        border: 1rpx solid rgba(255, 255, 255, 0.18);

        &:active {
            background: rgba(255, 255, 255, 0.26);
        }
    }

    .theme-light & {
        background: rgba(0, 0, 0, 0.05);
        border: 1rpx solid rgba(0, 0, 0, 0.08);

        &:active {
            background: rgba(0, 0, 0, 0.1);
        }
    }

    &:active {
        transform: scale(0.92);
    }
}

.nav-center {
    flex: 1;
    min-width: 0;
    padding: 0 20rpx;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rpx;
}

.subject-badge {
    display: inline-flex;
    align-items: center;
    gap: 6rpx;
    background: rgba(245, 158, 11, 0.2);
    border: 1rpx solid rgba(245, 158, 11, 0.35);
    border-radius: 999rpx;
    padding: 2rpx 12rpx;

    .badge-text {
        font-size: 18rpx;
        font-weight: 800;
        color: #f59e0b;
        letter-spacing: 1rpx;
    }
}

.subject-title {
    font-size: 32rpx;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 440rpx;
    transition: color 0.3s ease;

    .theme-dark & {
        color: #ffffff;
        text-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.4);
    }

    .theme-light & {
        color: var(--text-primary);
        text-shadow: none;
    }
}

/* 骨架屏加载态 */
.loading-state {
    position: relative;
    z-index: 10;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 70rpx;
    gap: 24rpx;

    .skeleton-card {
        width: 100%;
        height: 61vh;
        border-radius: 36rpx;
        animation: skeletonPulse 1.4s ease-in-out infinite alternate;

        .theme-dark & {
            background: rgba(255, 255, 255, 0.08);
        }

        .theme-light & {
            background: rgba(0, 0, 0, 0.06);
        }
    }

    .skeleton-line {
        width: 80%;
        height: 28rpx;
        border-radius: 14rpx;
        animation: skeletonPulse 1.4s ease-in-out 0.2s infinite alternate;

        .theme-dark & {
            background: rgba(255, 255, 255, 0.06);
        }

        .theme-light & {
            background: rgba(0, 0, 0, 0.05);
        }

        &--short {
            width: 45%;
            height: 36rpx;
        }
    }
}

@keyframes skeletonPulse {
    0% {
        opacity: 0.35;
    }
    100% {
        opacity: 0.75;
    }
}

/* 空状态 */
.empty-state {
    position: relative;
    z-index: 10;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24rpx;

    .empty-text {
        font-size: 28rpx;
        color: var(--text-secondary);
    }

    .empty-btn {
        margin-top: 16rpx;
        height: 68rpx;
        line-height: 68rpx;
        padding: 0 36rpx;
        border-radius: 999rpx;
        font-size: 26rpx;

        .theme-dark & {
            background: rgba(255, 255, 255, 0.15);
            color: #ffffff;
            border: 1rpx solid rgba(255, 255, 255, 0.2);
        }

        .theme-light & {
            background: rgba(0, 0, 0, 0.06);
            color: var(--text-primary);
            border: 1rpx solid rgba(0, 0, 0, 0.08);
        }
    }
}

/* 核心画廊区域 (居中饱满呈现) */
.gallery-wrapper {
    position: relative;
    z-index: 10;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: center;
    box-sizing: border-box;
    padding-top: 12rpx;
}

/* 壁纸卡片轮播：拉高至 61vh，充实画面重心 */
.gallery-swiper {
    width: 100%;
    height: 61vh;
}

.swiper-item-box {
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 8rpx 16rpx 44rpx;
}

/* 3D 景深卡片 (1:1 还原视频视差与缩放) */
.gallery-card {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 36rpx;
    overflow: hidden;
    transform: scale(0.88) translateY(16rpx);
    transform-origin: center center;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    opacity: 0.52;
    filter: blur(1rpx);
    transition:
        transform 0.42s cubic-bezier(0.16, 1, 0.3, 1),
        opacity 0.42s cubic-bezier(0.16, 1, 0.3, 1),
        filter 0.42s cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 0.42s ease,
        background-color 0.3s ease;

    .theme-dark & {
        background-color: #1e293b;
        box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.3);

        &.is-active {
            box-shadow:
                0 6rpx 16rpx rgba(0, 0, 0, 0.25),
                0 20rpx 48rpx -6rpx rgba(0, 0, 0, 0.55);
        }
    }

    .theme-light & {
        background-color: #ffffff;
        box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.03);

        &.is-active {
            box-shadow:
                0 4rpx 12rpx rgba(0, 0, 0, 0.03),
                0 14rpx 36rpx -4rpx rgba(15, 23, 42, 0.08);
        }
    }

    &.is-active {
        transform: scale(1) translateY(0);
        opacity: 1;
        filter: none;
    }

    .card-image {
        width: 100%;
        height: 100%;
        display: block;
        border-radius: 36rpx;
    }

    .card-badge {
        position: absolute;
        top: 24rpx;
        right: 24rpx;
        display: inline-flex;
        align-items: center;
        gap: 6rpx;
        padding: 6rpx 18rpx;
        border-radius: 999rpx;
        background: rgba(0, 0, 0, 0.48);
        border: 1rpx solid rgba(255, 255, 255, 0.22);
        backdrop-filter: blur(16rpx);

        .badge-label {
            font-size: 20rpx;
            font-weight: 800;
            color: #f59e0b;
        }
    }
}

/* 下方专题与壁纸详细描述区 (纯文本居中排版，无背景无边框) */
.detail-section {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16rpx 40rpx 0;
    gap: 16rpx;
    box-sizing: border-box;
}

.pager-indicator {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
    font-weight: 800;

    .current-num {
        font-size: 40rpx;
        letter-spacing: -1rpx;
        transition: color 0.3s ease;

        .theme-dark & {
            color: #ffffff;
            text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.4);
        }

        .theme-light & {
            color: var(--text-primary);
            text-shadow: none;
        }
    }

    .divider {
        font-size: 24rpx;
        transition: color 0.3s ease;

        .theme-dark & {
            color: rgba(255, 255, 255, 0.38);
        }

        .theme-light & {
            color: var(--text-tertiary);
        }
    }

    .total-num {
        font-size: 24rpx;
        transition: color 0.3s ease;

        .theme-dark & {
            color: rgba(255, 255, 255, 0.55);
        }

        .theme-light & {
            color: var(--text-secondary);
        }
    }
}

/* 纯文本描述容器：无边框无背景，优雅居中 */
.desc-container {
    max-width: 620rpx;
    padding: 0 16rpx;
}

.desc-text {
    font-size: 26rpx;
    line-height: 1.62;
    text-align: center;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
    transition: color 0.3s ease;

    .theme-dark & {
        color: rgba(247, 247, 251, 0.85);
    }

    .theme-light & {
        color: var(--text-secondary);
    }
}

.tags-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12rpx;
}

.tag-chip {
    padding: 6rpx 20rpx;
    border-radius: 999rpx;
    backdrop-filter: blur(12rpx);
    transition: background-color 0.3s ease, border-color 0.3s ease;

    .theme-dark & {
        background: rgba(255, 255, 255, 0.1);
        border: 1rpx solid rgba(255, 255, 255, 0.14);

        .tag-text {
            color: rgba(255, 255, 255, 0.88);
        }
    }

    .theme-light & {
        background: rgba(0, 0, 0, 0.05);
        border: 1rpx solid rgba(0, 0, 0, 0.06);

        .tag-text {
            color: var(--text-secondary);
        }
    }

    .tag-text {
        font-size: 22rpx;
        font-weight: 500;
        transition: color 0.3s ease;
    }
}
</style>
