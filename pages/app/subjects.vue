<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 一体化沉浸式渐变毛玻璃遮罩层 (覆盖状态栏+导航栏，向下渐变羽化消散) -->
        <view
            class="glass-header-backdrop"
            :class="{ 'is-scrolled': isScrolled }"
            :style="{
                height: `${statusBarHeight + titleBarHeight + 24}px`,
                '--status-bar-height': `${statusBarHeight}px`,
                '--title-bar-height': `${titleBarHeight}px`
            }"
        ></view>

        <!-- 屏幕顶部固定居中小标题（仅在滚动后在渐变毛玻璃中优雅浮现，保留红框标题动效） -->
        <view
            class="subjects-navbar"
            :style="{
                top: `${statusBarHeight}px`,
                height: `${titleBarHeight}px`
            }"
        >
            <text class="navbar-title" :class="{ 'is-visible': isScrolled }">
                {{ t('subjects.title') }}
            </text>
        </view>

        <!-- 页面内容区 (采用原生 Page 页面滚动，支持原生手势与状态栏回顶) -->
        <view
            class="subjects-container"
            :style="{ paddingTop: `${statusBarHeight + 8}px` }"
        >
            <!-- 页面内顶部返回按钮 (固定在页面上，随页面滚动) -->
            <view class="page-topbar">
                <view class="back-btn" @click="goBack">
                    <mdi-icon
                        path="/static/icons/arrow-left.svg"
                        size="18px"
                        :color="settingsStore.isDark ? '#f4f8ff' : '#1f2937'"
                    ></mdi-icon>
                </view>
            </view>

            <!-- Editorial 杂志感大标题区 -->
            <view class="hero-header">
                <view class="hero-header__badge">
                    <text class="hero-header__badge-dot">✦</text>
                    <text class="hero-header__badge-text">{{ t('subjects.badge') }}</text>
                </view>
                <text class="hero-header__title">{{ t('subjects.title') }}</text>
                <text class="hero-header__subtitle">{{ t('subjects.subtitle') }}</text>

                <!-- 推荐过滤胶囊筛选栏 (点击主要显示推荐专题，取消显示全部专题) -->
                <view class="hero-header__filter-bar">
                    <view
                        class="filter-pill"
                        :class="{ 'is-active': !isFeaturedOnly }"
                        @click="setFeaturedFilter(false)"
                    >
                        <text class="filter-pill__text">{{ t('subjects.filterAll') }}</text>
                    </view>
                    <view
                        class="filter-pill filter-pill--featured"
                        :class="{ 'is-active': isFeaturedOnly }"
                        @click="toggleFeaturedFilter"
                    >
                        <text class="filter-pill__icon">✦</text>
                        <text class="filter-pill__text">{{ t('subjects.filterFeatured') }}</text>
                        <view v-if="isFeaturedOnly" class="filter-pill__cancel-icon">
                            <uni-icons type="closeempty" size="10" color="inherit"></uni-icons>
                        </view>
                    </view>
                </view>
            </view>

            <!-- Skeleton Loader -->
            <view v-if="isLoading && !subjectsList.length" class="skeleton-list">
                <view v-for="i in 4" :key="i" class="skeleton-card">
                    <view class="skeleton-glow"></view>
                </view>
            </view>

            <!-- Empty State -->
            <view v-else-if="!subjectsList.length" class="empty-state">
                <uni-icons type="image" size="64" color="var(--text-tertiary)"></uni-icons>
                <text class="empty-title">
                    {{ isFeaturedOnly ? t('subjects.emptyFeaturedTitle') : t('subjects.emptyTitle') }}
                </text>
                <text class="empty-desc">
                    {{ isFeaturedOnly ? t('subjects.emptyFeaturedDesc') : t('subjects.emptyDesc') }}
                </text>
                <view v-if="isFeaturedOnly" class="empty-reset-btn" @click="setFeaturedFilter(false)">
                    <text class="empty-reset-btn__text">{{ t('subjects.viewAll') }}</text>
                </view>
            </view>

            <!-- Subject Cards List (卡片序列式依次从右向左立体透视滑入) -->
            <view v-else class="subjects-list" :key="listRenderKey">
                <view
                    v-for="(item, index) in subjectsList"
                    :key="`${listRenderKey}-${item.id}`"
                    class="subject-card"
                    hover-class="subject-card--active"
                    :hover-stay-time="150"
                    :style="{ '--card-delay': `${index < 8 ? (index * 0.16 + 0.06) : 0}s`, animationDelay: `${index < 8 ? (index * 0.16 + 0.06) : 0}s` }"
                    @click="goDetail(item)"
                >
                    <view class="subject-card__header">
                        <view class="subject-card__badge-row">
                            <view class="subject-card__badges-group">
                                <view class="subject-card__badge subject-card__badge--featured" v-if="item.select">
                                    <text class="badge-icon">✦</text>
                                    <text class="badge-text">{{ isEn ? 'FEATURED' : t('subjects.featuredBadge') }}</text>
                                </view>
                                <view class="subject-card__badge" v-if="item.is_locked">
                                    <uni-icons type="vip-filled" size="10" color="#fbbf24"></uni-icons>
                                    <text class="badge-text">PREMIUM</text>
                                </view>
                                <view class="subject-card__badge subject-card__badge--neutral" v-else-if="item.tags">
                                    <text class="badge-text">{{ item.tags.split(',')[0] }}</text>
                                </view>
                            </view>
                            <view class="subject-card__meta">
                                <text class="meta-item">{{ item.wall_count || 0 }} {{ isEn ? 'Walls' : t('subjects.walls') }}</text>
                                <text class="meta-separator">·</text>
                                <text class="meta-item">{{ formatUpdateDate(item.updated_at) }}</text>
                            </view>
                        </view>
                        
                        <text class="subject-card__title">
                            {{ isEn ? (item.name_en || item.name) : item.name }}
                        </text>
                        
                        <text class="subject-card__desc">
                            {{ isEn ? (item.content_en || item.content) : item.content }}
                        </text>
                    </view>

                    <!-- Wallpaper Previews Row -->
                    <view class="subject-card__previews" v-if="item.preview_walls && item.preview_walls.length">
                        <view class="preview-item" v-for="(img, imgIdx) in item.preview_walls" :key="imgIdx"
                            :style="{ animationDelay: `calc(var(--card-delay, 0s) + ${(imgIdx * 0.10 + 0.15).toFixed(2)}s)` }">
                            <image class="preview-img" :src="img.includes('.jpg') ? img.replace('.jpg', '_small.webp') : img" mode="aspectFill" lazy-load></image>
                        </view>
                    </view>
                    <!-- Fallback mesh overlay if empty -->
                    <view class="subject-card__previews-placeholder" v-else>
                        <view class="placeholder-mesh"></view>
                    </view>
                </view>

                <!-- Loading / No More Indicator -->
                <view class="loading-more">
                    <text v-if="isLoading">{{ t('common.loading') }}</text>
                    <text v-else-if="noMore" class="no-more-text">{{ t('subjects.noMore') }}</text>
                </view>
            </view>
        </view>

        <!-- 底部向上返回顶部按钮 (下滑半屏后浮现) -->
        <fab-back-top :show="showScrollTop" :embedded="false" @click="scrollToTop" />
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onShow, onPageScroll, onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { apiGetSubjects } from '@/api/wallpaper.js';
import { useSettingsStore } from '@/stores/settings.js';
import { getStatusBarHeight, getTitleBarHeight } from '@/utils/layout.js';
import { handlePicUrl } from '@/utils/common.js';

const { t, locale } = useI18n();
const settingsStore = useSettingsStore();
const isEn = computed(() => locale.value === 'en');

const statusBarHeight = ref(getStatusBarHeight() || 0);
const titleBarHeight = ref(getTitleBarHeight() || 44);
const isScrolled = ref(false);

const showScrollTop = ref(false);
const currentScrollTop = ref(0);

// 原生页面滚动监听：控制毛玻璃小标题显隐及回到顶部浮标
onPageScroll((e) => {
    const top = Number(e?.scrollTop || 0);
    isScrolled.value = top > 16;
    currentScrollTop.value = top;

    const windowHeight = uni.getWindowInfo().windowHeight || 0;
    const nextVisible = top > windowHeight / 2;
    if (showScrollTop.value !== nextVisible) {
        showScrollTop.value = nextVisible;
    }
});

// 原生页面触底加载
onReachBottom(() => {
    onLoadMore();
});

// 原生下拉刷新
onPullDownRefresh(async () => {
    isRefreshing.value = true;
    await fetchSubjects(false);
    uni.stopPullDownRefresh();
});

// 原生平滑滚动回到顶部
const scrollToTop = () => {
    showScrollTop.value = false;
    currentScrollTop.value = 0;
    uni.pageScrollTo({
        scrollTop: 0,
        duration: 350,
    });
};

const subjectsList = ref([]);
const isLoading = ref(false);
const isRefreshing = ref(false);
const pageNum = ref(1);
const noMore = ref(false);

const isFeaturedOnly = ref(false);
const listRenderKey = ref(0);

const setFeaturedFilter = (val) => {
    if (isFeaturedOnly.value === val) return;
    isFeaturedOnly.value = val;
    fetchSubjects(false);
};

const toggleFeaturedFilter = () => {
    isFeaturedOnly.value = !isFeaturedOnly.value;
    fetchSubjects(false);
};

const fetchSubjects = async (isAppend = false) => {
    try {
        if (!isAppend) {
            pageNum.value = 1;
            noMore.value = false;
            isLoading.value = true;
        }
        const params = {
            is_active: true,
            pageNum: pageNum.value,
            pageSize: 10,
        };
        if (isFeaturedOnly.value) {
            params.select = true;
        }
        const res = await apiGetSubjects(params);
        if (res.code === 200 && res.data) {
            const mapped = res.data.map((item) => handlePicUrl(item));
            if (!isAppend) {
                listRenderKey.value++;
            }
            subjectsList.value = isAppend ? [...subjectsList.value, ...mapped] : mapped;
            const totalPages = Number(res.pagination?.total_pages || 1);
            noMore.value = pageNum.value >= totalPages || res.data.length === 0;
        }
    } catch (err) {
        console.error('Failed to fetch subjects list:', err);
    } finally {
        isLoading.value = false;
        isRefreshing.value = false;
    }
};

const onRefresh = () => {
    isRefreshing.value = true;
    fetchSubjects(false);
};

const onLoadMore = () => {
    if (isLoading.value || noMore.value) return;
    pageNum.value += 1;
    fetchSubjects(true);
};

const formatUpdateDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const goBack = () => {
    uni.navigateBack({
        fail: () => {
            uni.reLaunch({ url: '/pages/app/index' });
        }
    });
};

const goDetail = (item) => {
    uni.navigateTo({
        url: `/pages/app/subject-detail?id=${item.id}&name=${encodeURIComponent(item.name)}`
    });
};

onLoad((options) => {
    if (options?.select === 'true' || options?.select === true) {
        isFeaturedOnly.value = true;
    }
    fetchSubjects();
});

onShow(() => {
    const windowHeight = uni.getWindowInfo().windowHeight || 0;
    if (currentScrollTop.value > windowHeight / 2) {
        showScrollTop.value = true;
    }
});
</script>

<style lang="scss" scoped>
.layout {
    background: var(--page-background);
    min-height: 100vh;
    position: relative;
}

// ── 一体化沉浸式渐变毛玻璃遮罩层 ──
.glass-header-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 900;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.32s cubic-bezier(0.25, 1, 0.5, 1);

    // 核心毛玻璃模糊与饱和度增益
    backdrop-filter: blur(24px) saturate(200%);
    -webkit-backdrop-filter: blur(24px) saturate(200%);

    // 向下渐变羽化遮罩：消除生硬截断，实现电影级柔和消隐
    -webkit-mask-image: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 1) 0%,
        rgba(0, 0, 0, 0.96) calc(var(--status-bar-height, 24px) + 16px),
        rgba(0, 0, 0, 0.45) calc(var(--status-bar-height, 24px) + var(--title-bar-height, 44px) + 6px),
        rgba(0, 0, 0, 0) 100%
    );
    mask-image: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 1) 0%,
        rgba(0, 0, 0, 0.96) calc(var(--status-bar-height, 24px) + 16px),
        rgba(0, 0, 0, 0.45) calc(var(--status-bar-height, 24px) + var(--title-bar-height, 44px) + 6px),
        rgba(0, 0, 0, 0) 100%
    );

    &.is-scrolled {
        opacity: 1;
    }

    .theme-light & {
        background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.88) 0%,
            rgba(255, 255, 255, 0.62) calc(var(--status-bar-height, 24px) + 20px),
            rgba(255, 255, 255, 0.22) calc(var(--status-bar-height, 24px) + var(--title-bar-height, 44px)),
            rgba(255, 255, 255, 0) 100%
        );
    }

    .theme-dark & {
        background: linear-gradient(
            to bottom,
            rgba(24, 24, 24, 0.88) 0%,
            rgba(24, 24, 24, 0.65) calc(var(--status-bar-height, 24px) + 20px),
            rgba(24, 24, 24, 0.22) calc(var(--status-bar-height, 24px) + var(--title-bar-height, 44px)),
            rgba(24, 24, 24, 0) 100%
        );
    }
}

// ── 屏幕顶部固定悬浮栏 (居中小标题，随滚动淡入淡出) ──
.subjects-navbar {
    position: fixed;
    left: 0;
    width: 100%;
    z-index: 950;
    pointer-events: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
}

.navbar-title {
    font-size: 32rpx;
    font-weight: 700;
    color: var(--text-primary);
    opacity: 0;
    transform: translateY(12rpx);
    transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.25, 1, 0.5, 1);
    pointer-events: none;

    &.is-visible {
        opacity: 1;
        transform: translateY(0);
    }
}

// ── 页面内顶部栏 (返回按钮随页面滚动) ──
.page-topbar {
    height: 80rpx;
    display: flex;
    align-items: center;
    margin-bottom: 8rpx;
}

.back-btn {
    width: 72rpx;
    height: 72rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);

    .theme-light & {
        background: rgba(255, 255, 255, 0.72);
        border: 1rpx solid rgba(255, 255, 255, 0.6);
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
        backdrop-filter: blur(20rpx);
        -webkit-backdrop-filter: blur(20rpx);
    }

    .theme-dark & {
        background: rgba(255, 255, 255, 0.12);
        border: 1rpx solid rgba(255, 255, 255, 0.16);
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.25);
        backdrop-filter: blur(20rpx);
        -webkit-backdrop-filter: blur(20rpx);
    }

    &:active {
        transform: scale(0.92);
        opacity: 0.85;
    }
}

// ── ✦ 星标轻微旋转与光辉脉冲 ──
@keyframes starSparkle {
    0%, 100% {
        transform: rotate(0deg) scale(1);
        opacity: 0.9;
    }
    50% {
        transform: rotate(18deg) scale(1.2);
        opacity: 1;
    }
}

// ── 杂志感大标题区浮现 ──
@keyframes editorialHeaderReveal {
    0% {
        opacity: 0;
        transform: translate3d(0, 28rpx, 0);
    }
    100% {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
}

// ── 杂志感大标题区 (Editorial Hero Header) ──
.hero-header {
    padding: 12rpx 6rpx 36rpx;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12rpx;
    animation: editorialHeaderReveal 1.06s cubic-bezier(0.16, 1, 0.3, 1) both;

    &__badge {
        display: inline-flex;
        align-items: center;
        gap: 8rpx;
        padding: 8rpx 20rpx;
        border-radius: 999rpx;
        font-size: 20rpx;
        font-weight: 800;
        letter-spacing: 1.5rpx;
        text-transform: uppercase;

        .theme-light & {
            background: rgba(79, 70, 229, 0.08);
            border: 1rpx solid rgba(79, 70, 229, 0.18);
            color: #4f46e5;
        }

        .theme-dark & {
            background: rgba(129, 140, 248, 0.12);
            border: 1rpx solid rgba(129, 140, 248, 0.24);
            color: #a5b4fc;
        }
    }

    &__badge-dot {
        font-size: 18rpx;
        line-height: 1;
        display: inline-block;
        animation: starSparkle 3.6s ease-in-out infinite;
    }

    &__badge-text {
        line-height: 1;
    }

    &__title {
        font-size: 54rpx;
        font-weight: 900;
        color: var(--text-primary);
        line-height: 1.2;
        letter-spacing: -1rpx;
    }

    &__subtitle {
        font-size: 26rpx;
        color: var(--text-secondary);
        line-height: 1.55;
        max-width: 620rpx;
    }

    // ── 推荐筛选胶囊栏 ──
    &__filter-bar {
        display: flex;
        align-items: center;
        gap: 16rpx;
        margin-top: 12rpx;
    }
}

.filter-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    height: 60rpx;
    padding: 0 28rpx;
    border-radius: 999rpx;
    font-size: 24rpx;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
    user-select: none;

    .theme-light & {
        background: rgba(0, 0, 0, 0.04);
        border: 1rpx solid rgba(0, 0, 0, 0.08);
        color: #64748b;

        &:active {
            transform: scale(0.95);
            background: rgba(0, 0, 0, 0.08);
        }

        &.is-active {
            background: #1e293b;
            border-color: #1e293b;
            color: #ffffff;
            box-shadow: 0 4rpx 14rpx rgba(15, 23, 42, 0.16);
        }
    }

    .theme-dark & {
        background: rgba(255, 255, 255, 0.07);
        border: 1rpx solid rgba(255, 255, 255, 0.1);
        color: #94a3b8;

        &:active {
            transform: scale(0.95);
            background: rgba(255, 255, 255, 0.12);
        }

        &.is-active {
            background: #f1f5f9;
            border-color: #f1f5f9;
            color: #0f172a;
            box-shadow: 0 4rpx 14rpx rgba(255, 255, 255, 0.12);
        }
    }

    &--featured {
        .theme-light & {
            .filter-pill__icon {
                color: #4f46e5;
            }
        }

        .theme-dark & {
            .filter-pill__icon {
                color: #a5b4fc;
            }
        }

        .theme-light &.is-active {
            background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
            border-color: #4338ca;
            color: #ffffff;
            box-shadow: 0 6rpx 20rpx rgba(79, 70, 229, 0.32);

            .filter-pill__icon {
                color: #e0e7ff;
            }
        }

        .theme-dark &.is-active {
            background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
            border-color: #6366f1;
            color: #ffffff;
            box-shadow: 0 6rpx 22rpx rgba(99, 102, 241, 0.38);

            .filter-pill__icon {
                color: #ffffff;
            }
        }
    }

    &__icon {
        font-size: 20rpx;
        line-height: 1;
        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    &.is-active &__icon {
        transform: scale(1.15) rotate(12deg);
    }

    &__text {
        line-height: 1;
    }

    &__cancel-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 4rpx;
        opacity: 0.9;
        transition: transform 0.2s ease, opacity 0.2s ease;

        &:hover {
            opacity: 1;
            transform: scale(1.15);
        }
    }
}

.subjects-container {
    padding: 20rpx;
    padding-bottom: calc(60rpx + env(safe-area-inset-bottom));
}

// ── 杂志画报展台 3D 透视立体浮升 ──
@keyframes subjectCardPerspectiveReveal {
    0% {
        opacity: 0;
        transform: perspective(900px) rotateX(10deg) translate3d(0, 48rpx, 0) scale(0.94);
        filter: brightness(0.9);
    }
    60% {
        opacity: 0.95;
    }
    100% {
        opacity: 1;
        transform: perspective(900px) rotateX(0deg) translate3d(0, 0, 0) scale(1);
        filter: brightness(1);
    }
}

.subjects-list {
    display: flex;
    flex-direction: column;
    gap: 40rpx;
}

.subject-card {
    background: var(--panel-background);
    border: 1rpx solid var(--panel-border);
    border-radius: 36rpx;
    padding: 32rpx;
    box-shadow: 0 12rpx 36rpx var(--shadow-color);
    box-sizing: border-box;
    transition: transform 0.26s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.26s ease;
    animation: subjectCardPerspectiveReveal 1.10s cubic-bezier(0.16, 1, 0.3, 1) both;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 24rpx;

    &--active, &:active {
        transform: scale(0.98) !important;
        box-shadow: 0 4rpx 14rpx var(--shadow-color) !important;

        .preview-item {
            transform: translateY(-4rpx) scale(1.02);
            box-shadow: 0 8rpx 20rpx var(--shadow-color);
        }
    }

    &__header {
        display: flex;
        flex-direction: column;
        gap: 8rpx;
    }

    &__badge-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6rpx;
    }

    &__badge {
        display: inline-flex;
        align-items: center;
        gap: 6rpx;
        padding: 6rpx 16rpx;
        background: rgba(251, 191, 36, 0.08);
        border: 1rpx solid rgba(251, 191, 36, 0.16);
        border-radius: 100rpx;
        color: #fbbf24;
        font-size: 18rpx;
        font-weight: 900;
        letter-spacing: 1rpx;

        &--featured {
            background: rgba(79, 70, 229, 0.08);
            border: 1rpx solid rgba(79, 70, 229, 0.2);
            color: #4f46e5;

            .theme-dark & {
                background: rgba(99, 102, 241, 0.14);
                border: 1rpx solid rgba(99, 102, 241, 0.28);
                color: #a5b4fc;
            }

            .badge-icon {
                font-size: 16rpx;
                line-height: 1;
            }
        }

        &--neutral {
            background: rgba(40, 179, 137, 0.08);
            border: 1rpx solid rgba(40, 179, 137, 0.16);
            color: #28b389;
        }

        .badge-text {
            line-height: 1;
        }
    }

    &__meta {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 10rpx;
        font-size: 20rpx;
        font-weight: 800;
        color: var(--text-tertiary);
        letter-spacing: 0.5rpx;
        text-transform: uppercase;

        .meta-separator {
            opacity: 0.6;
            margin: 0 4rpx;
        }
    }

    &__title {
        font-size: 38rpx;
        font-weight: 900;
        color: var(--text-primary);
        line-height: 1.25;
        letter-spacing: -0.5rpx;
    }

    &__desc {
        font-size: 24rpx;
        color: var(--text-secondary);
        line-height: 1.5;
        margin-top: 4rpx;
    }

    &__previews {
        display: flex;
        gap: 16rpx;
        width: 100%;
    }

    // ── 画廊三联预览图依次错位微弹展开 ──
    @keyframes previewTrioReveal {
        0% {
            opacity: 0;
            transform: translate3d(0, 24rpx, 0) scale(0.92);
        }
        100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
        }
    }

    .preview-item {
        flex: 1;
        height: 288rpx;
        border-radius: 20rpx;
        overflow: hidden;
        background: var(--page-background-secondary);
        box-shadow: 0 6rpx 16rpx var(--shadow-color);
        transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.28s ease;
        animation: previewTrioReveal 0.95s cubic-bezier(0.16, 1, 0.3, 1) both;

        &:hover {
            transform: translateY(-6rpx) scale(1.02);
            box-shadow: 0 12rpx 28rpx var(--shadow-color);

            .preview-img {
                transform: scale(1.06);
            }
        }
    }

    .preview-img {
        width: 100%;
        height: 100%;
        display: block;
        transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    }

    &__previews-placeholder {
        height: 120rpx;
        border-radius: 20rpx;
        background: var(--page-background-secondary);
        overflow: hidden;
        position: relative;
    }

    .placeholder-mesh {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(40, 179, 137, 0.03) 0%, rgba(97, 154, 239, 0.03) 100%);
    }
}

// ── 骨架屏 ──
.skeleton-list {
    display: flex;
    flex-direction: column;
    gap: 30rpx;
}

.skeleton-card {
    height: 280rpx;
    border-radius: 28rpx;
    background: var(--panel-background);
    overflow: hidden;
    position: relative;
}

.skeleton-glow {
    position: absolute;
    inset: 0;
    background: linear-gradient(
        90deg,
        rgba(150, 150, 150, 0.05) 25%,
        rgba(150, 150, 150, 0.12) 50%,
        rgba(150, 150, 150, 0.05) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.6s infinite linear;
    transform: translate3d(0, 0, 0);
    will-change: background-position;
}

@keyframes skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

.empty-state {
    padding: 120rpx 40rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 20rpx;

    .empty-title {
        font-size: 32rpx;
        font-weight: 700;
        color: var(--text-primary);
    }

    .empty-desc {
        font-size: 24rpx;
        color: var(--text-tertiary);
        max-width: 480rpx;
        line-height: 1.6;
    }

    .empty-reset-btn {
        margin-top: 24rpx;
        padding: 14rpx 36rpx;
        border-radius: 999rpx;
        font-size: 24rpx;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        .theme-light & {
            background: rgba(79, 70, 229, 0.08);
            border: 1rpx solid rgba(79, 70, 229, 0.22);
            color: #4f46e5;

            &:active {
                transform: scale(0.96);
                background: rgba(79, 70, 229, 0.15);
            }
        }

        .theme-dark & {
            background: rgba(99, 102, 241, 0.14);
            border: 1rpx solid rgba(99, 102, 241, 0.28);
            color: #a5b4fc;

            &:active {
                transform: scale(0.96);
                background: rgba(99, 102, 241, 0.22);
            }
        }
    }
}

.loading-more {
    padding-top: 30rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
    color: var(--text-tertiary);

    .no-more-text {
        color: var(--text-tertiary);
        opacity: 0.6;
        letter-spacing: 1rpx;
    }
}
</style>
