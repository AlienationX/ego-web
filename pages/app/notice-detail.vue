<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 沉浸式渐变毛玻璃导航条 (覆盖状态栏，随滚动优雅加深) -->
        <view
            class="immersive-header"
            :class="{ 'is-scrolled': isScrolled }"
            :style="{ paddingTop: `${statusBarHeight}px` }"
        >
            <view class="nav-content">
                <view class="back-btn" @click="goBack">
                    <mdi-icon
                        path="/static/icons/arrow-left.svg"
                        size="18px"
                        :color="settingsStore.isDark ? '#f4f8ff' : '#1f2937'"
                    ></mdi-icon>
                </view>
                <view class="header-center" :class="{ 'is-visible': isScrolled }">
                    <text class="header-title">{{ isEn && detail.title_en ? detail.title_en : detail.title }}</text>
                </view>
                <view class="header-action">
                    <view class="share-btn" @click="handleShare" v-if="detail.id">
                        <mdi-icon
                            path="/static/icons/share-variant.svg"
                            size="16px"
                            :color="settingsStore.isDark ? '#cbd5e1' : '#475569'"
                        ></mdi-icon>
                    </view>
                    <view class="header-placeholder" v-else></view>
                </view>
            </view>

            <!-- 极细阅读进度指示条 -->
            <view class="progress-track">
                <view class="progress-bar" :style="{ width: `${readingProgress}%` }"></view>
            </view>
        </view>

        <!-- 核心阅读区域 -->
        <view
            class="article-wrapper"
            :style="{ paddingTop: `${statusBarHeight + 52}px` }"
        >
            <!-- 优雅骨架屏加载状态 -->
            <view class="loading-layout" v-if="Object.keys(detail).length === 0">
                <view class="skeleton-header"></view>
                <view class="skeleton-title"></view>
                <view class="skeleton-meta"></view>
                <view class="skeleton-line" style="width: 100%"></view>
                <view class="skeleton-line" style="width: 92%"></view>
                <view class="skeleton-line" style="width: 82%"></view>
                <view class="skeleton-line" style="width: 95%"></view>
                <view class="skeleton-line" style="width: 60%"></view>
            </view>

            <template v-else>
                <!-- 杂志感 Hero 头部区 -->
                <view class="article-hero">
                    <view class="badge-row">
                        <view class="badge badge--primary">
                            <text class="badge__dot">✦</text>
                            <text class="badge__text">{{ isEn ? 'OFFICIAL NOTICE' : '官方公告' }}</text>
                        </view>
                        <view class="badge badge--top" v-if="detail.select">
                            <text class="badge__text">{{ isEn ? 'TOP' : '置顶精选' }}</text>
                        </view>
                    </view>

                    <text class="article-title">{{ isEn && detail.title_en ? detail.title_en : detail.title }}</text>

                    <!-- 元信息栏：作者、日期、阅读时长预估、浏览量 -->
                    <view class="meta-card">
                        <view class="meta-card__item">
                            <mdi-icon path="/static/icons/account.svg" size="14px" :color="metaIconColor"></mdi-icon>
                            <text class="meta-card__text">{{ $t('common.admin') || '本我壁纸' }}</text>
                        </view>
                        <view class="meta-card__divider"></view>
                        <view class="meta-card__item">
                            <mdi-icon path="/static/icons/calendar.svg" size="14px" :color="metaIconColor"></mdi-icon>
                            <uni-dateformat class="meta-card__text" :date="detail.publish_date || detail.created_at" format="yyyy/MM/dd"></uni-dateformat>
                        </view>
                        <view class="meta-card__divider"></view>
                        <view class="meta-card__item">
                            <mdi-icon path="/static/icons/clock.svg" size="14px" :color="metaIconColor"></mdi-icon>
                            <text class="meta-card__text">{{ estimatedReadTime }}</text>
                        </view>
                        <view class="meta-card__divider" v-if="detail.view_count"></view>
                        <view class="meta-card__item" v-if="detail.view_count">
                            <mdi-icon path="/static/icons/eye.svg" size="14px" :color="metaIconColor"></mdi-icon>
                            <text class="meta-card__text">{{ detail.view_count }} {{ isEn ? 'Views' : '次阅读' }}</text>
                        </view>
                    </view>
                </view>

                <view class="article-divider"></view>

                <!-- 核心正文内容 -->
                <view class="article-content">
                    <mp-html
                        :content="noticeContent"
                        :tag-style="noticeTagStyle"
                        container-style="line-height: 1.9; word-break: break-word; color: var(--text-primary);"
                    ></mp-html>
                </view>

                <!-- 文章收尾版权与底注卡片 -->
                <view class="article-footer">
                    <view class="article-end-mark">
                        <view class="article-end-mark__line"></view>
                        <text class="article-end-mark__text">{{ isEn ? 'THE END' : '正文完 · 感谢阅读' }}</text>
                        <view class="article-end-mark__line"></view>
                    </view>

                    <view class="copyright-card">
                        <mdi-icon path="/static/icons/shield-check.svg" size="18px" color="#3b82f6"></mdi-icon>
                        <text class="copyright-card__text">
                            {{ isEn ? 'Published by Ego Wallpapers Editorial. All rights reserved.' : '本文由本我壁纸官方团队整理编排，欢迎分享与启发灵感。' }}
                        </text>
                    </view>
                </view>
            </template>
        </view>

        <!-- 回到顶部按钮 -->
        <fab-back-top :show="showScrollTop" :embedded="false" @click="scrollToTop" />
    </view>
</template>

<script setup>
import { ref, toRefs, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { onLoad, onPageScroll, onReachBottom, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import { apiGetNotice } from '@/api/wallpaper.js';
import { useSettingsStore } from '@/stores/settings.js';
import { getStatusBarHeight } from '@/utils/layout.js';

const { t, locale } = useI18n();
const settingsStore = useSettingsStore();
const isEn = computed(() => locale.value === 'en');

const props = defineProps({
    id: String,
    name: String,
});

const { id, name } = toRefs(props);
const detail = ref({});
const statusBarHeight = ref(getStatusBarHeight() || 0);

const isScrolled = ref(false);
const showScrollTop = ref(false);
const readingProgress = ref(0);

const metaIconColor = computed(() => (settingsStore.isDark ? '#94a3b8' : '#64748b'));

const noticeContent = computed(() => {
    return isEn.value && detail.value.content_en ? detail.value.content_en : (detail.value.content || '');
});

// 估算阅读时长
const estimatedReadTime = computed(() => {
    const text = (noticeContent.value || '').replace(/<[^>]+>/g, '');
    const count = text.length || 0;
    const mins = Math.max(1, Math.ceil(count / 350));
    return isEn.value ? `${mins} min read` : `约 ${mins} 分钟阅读`;
});

// 沉浸式阅读排版适配
const noticeTagStyle = computed(() => {
    const isDark = settingsStore.isDark;
    const textPrimary = 'var(--text-primary)';
    const textSecondary = 'var(--text-secondary)';
    const borderColor = 'var(--panel-border)';
    const cardBg = isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)';
    const quoteBg = isDark ? 'rgba(43, 140, 238, 0.08)' : 'rgba(43, 140, 238, 0.05)';
    const accentColor = '#2b8cee';

    return {
        body: `color: ${textPrimary}; font-size: 32rpx; line-height: 1.9; letter-spacing: 0.2rpx;`,
        div: `color: ${textPrimary}; font-size: 32rpx; line-height: 1.9;`,
        h1: `color: ${textPrimary}; font-size: 42rpx; font-weight: 800; margin: 48rpx 0 24rpx; line-height: 1.4;`,
        h2: `color: ${textPrimary}; font-size: 38rpx; font-weight: 700; margin: 52rpx 0 24rpx; line-height: 1.45; position: relative; padding-left: 20rpx; border-left: 8rpx solid ${accentColor};`,
        h3: `color: ${textPrimary}; font-size: 34rpx; font-weight: 700; margin: 40rpx 0 18rpx; line-height: 1.4;`,
        p: `color: ${textPrimary}; font-size: 32rpx; line-height: 1.9; margin-bottom: 32rpx; opacity: 0.92;`,
        span: `color: ${textPrimary};`,
        strong: `color: ${textPrimary}; font-weight: 700;`,
        b: `color: ${textPrimary}; font-weight: 700;`,
        li: `color: ${textPrimary}; font-size: 32rpx; line-height: 1.85; margin-bottom: 16rpx; opacity: 0.92;`,
        ul: 'padding-left: 36rpx; margin-bottom: 32rpx;',
        ol: 'padding-left: 36rpx; margin-bottom: 32rpx;',
        blockquote: `background: ${quoteBg}; border-left: 8rpx solid ${accentColor}; border-radius: 0 16rpx 16rpx 0; padding: 24rpx 30rpx; margin: 36rpx 0; color: ${textSecondary}; font-size: 30rpx; line-height: 1.8; font-style: italic;`,
        img: 'max-width: 100%; height: auto; display: block; margin: 36rpx auto; border-radius: 20rpx; box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);',
        a: `color: ${accentColor}; text-decoration: none; word-break: break-all; font-weight: 600;`,
        '.faq-container': 'display: flex; flex-direction: column; gap: 24rpx; margin-top: 10rpx;',
        '.faq-item': `background: ${cardBg}; border: 1rpx solid ${borderColor}; border-radius: 20rpx; padding: 28rpx;`,
        '.faq-title': `color: ${textPrimary}; font-size: 34rpx; font-weight: 700; margin-bottom: 14rpx; display: flex; align-items: center;`,
        '.faq-bullet': 'color: #ef4444; font-weight: 700; font-size: 32rpx; margin-right: 12rpx;',
        '.faq-answer': `color: ${textPrimary}; font-size: 30rpx; line-height: 1.8; margin: 0; opacity: 0.88;`,
        '.article-container': 'display: flex; flex-direction: column; gap: 24rpx;',
        '.section-card': `background: ${cardBg}; border: 1rpx solid ${borderColor}; border-radius: 20rpx; padding: 28rpx;`,
        '.lead-text': `color: ${textPrimary}; font-size: 32rpx; line-height: 1.85; font-weight: 500; margin: 0;`,
        '.model-list': 'list-style: none; padding: 0; margin: 16rpx 0 0 0;',
        '.highlight-red': 'color: #ef4444; font-weight: 600;',
        '.highlight-purple': 'color: #a855f7; font-weight: 600;',
        '.highlight-blue': 'color: #3b82f6; font-weight: 600;',
        '.quote-block': `background: ${quoteBg}; border-left: 8rpx solid ${accentColor}; border-radius: 0 16rpx 16rpx 0; padding: 20rpx 28rpx; margin: 24rpx 0 0 0; font-style: italic; font-size: 30rpx; line-height: 1.8;`,
        '.image-wrapper': 'text-align: center; margin: 24rpx 0;',
        '.tip-text': `font-size: 26rpx; text-align: center; margin-top: 16rpx; color: ${textSecondary};`,
    };
});

const getNoticeDetail = async () => {
    try {
        let res = await apiGetNotice({}, id.value);
        detail.value = res.data || {};
    } catch (e) {
        detail.value = {};
    }
};

const goBack = () => {
    uni.navigateBack({
        fail: () => {
            uni.reLaunch({ url: '/pages/app/index' });
        },
    });
};

const scrollToTop = () => {
    uni.pageScrollTo({
        scrollTop: 0,
        duration: 350,
    });
};

const handleShare = () => {
    const title = (isEn.value && detail.value.title_en ? detail.value.title_en : detail.value.title) || '公告详情';
    if (uni.shareWithSystem) {
        uni.shareWithSystem({
            summary: title,
            href: `/pages/app/notice-detail?id=${detail.value.id || id.value}`,
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
    title: (isEn.value && detail.value.title_en ? detail.value.title_en : detail.value.title) || '公告详情',
    path: `/pages/app/notice-detail?id=${detail.value.id || id.value}`,
}));

onShareTimeline(() => ({
    title: (isEn.value && detail.value.title_en ? detail.value.title_en : detail.value.title) || '公告详情',
    query: `id=${detail.value.id || id.value}`,
}));

onPageScroll((e) => {
    const top = Number(e?.scrollTop || 0);
    isScrolled.value = top > 28;
    const windowHeight = uni.getWindowInfo().windowHeight || 800;
    showScrollTop.value = top > windowHeight / 2;

    const query = uni.createSelectorQuery();
    query
        .select('.article-wrapper')
        .boundingClientRect((data) => {
            if (data && data.height) {
                const scrollable = data.height - windowHeight;
                if (scrollable <= 0 || top >= scrollable - 10) {
                    readingProgress.value = 100;
                } else {
                    readingProgress.value = Math.min(100, Math.max(0, Math.round((top / scrollable) * 100)));
                }
            }
        })
        .exec();
});

onReachBottom(() => {
    readingProgress.value = 100;
});

onLoad((options) => {
    if (options?.id) id.value = options.id;
    if (options?.name) name.value = decodeURIComponent(options.name);
    getNoticeDetail();
});
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background-color: var(--page-background);
    color: var(--text-primary);
    transition: background-color 0.3s ease;
}

/* 沉浸式毛玻璃导航条 */
.immersive-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: transparent;
    transition:
        background 0.28s ease,
        box-shadow 0.28s ease,
        border-color 0.28s ease;

    &.is-scrolled {
        background: rgba(255, 255, 255, 0.88);
        backdrop-filter: blur(24rpx);
        -webkit-backdrop-filter: blur(24rpx);
        box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
        border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);

        .theme-dark & {
            background: rgba(18, 24, 34, 0.88);
            box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.35);
            border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
        }
    }
}

.nav-content {
    height: 88rpx;
    padding: 0 28rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
}

.back-btn,
.share-btn {
    width: 68rpx;
    height: 68rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.75);
    border: 1rpx solid rgba(0, 0, 0, 0.06);
    backdrop-filter: blur(16rpx);
    -webkit-backdrop-filter: blur(16rpx);
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
    transition: all 0.2s ease;

    &:active {
        transform: scale(0.92);
        background: rgba(255, 255, 255, 0.9);
    }

    .theme-dark & {
        background: rgba(30, 41, 59, 0.7);
        border: 1rpx solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);

        &:active {
            background: rgba(30, 41, 59, 0.9);
        }
    }
}

.header-placeholder {
    width: 68rpx;
}

.header-center {
    flex: 1;
    min-width: 0;
    text-align: center;
    padding: 0 20rpx;
    opacity: 0;
    transform: translateY(12rpx);
    transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;

    &.is-visible {
        opacity: 1;
        transform: translateY(0);
    }
}

.header-title {
    font-size: 28rpx;
    font-weight: 700;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
}

/* 顶部阅读进度条 */
.progress-track {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3rpx;
    background: transparent;
}

.progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #2b8cee 0%, #60a5fa 50%, #3b82f6 100%);
    transition: width 0.15s ease-out;
}

/* 文章容器 */
.article-wrapper {
    padding-left: 36rpx;
    padding-right: 36rpx;
    padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
}

/* 杂志感 Hero 头部 */
.article-hero {
    margin-bottom: 40rpx;
}

.badge-row {
    display: flex;
    align-items: center;
    gap: 14rpx;
    margin-bottom: 24rpx;
}

.badge {
    display: inline-flex;
    align-items: center;
    gap: 6rpx;
    height: 44rpx;
    padding: 0 16rpx;
    border-radius: 999rpx;
    font-size: 20rpx;
    font-weight: 700;

    &--primary {
        background: rgba(43, 140, 238, 0.12);
        border: 1rpx solid rgba(43, 140, 238, 0.25);
        color: #2b8cee;

        .theme-dark & {
            background: rgba(43, 140, 238, 0.18);
            border: 1rpx solid rgba(43, 140, 238, 0.35);
            color: #7dd3fc;
        }
    }

    &--top {
        background: rgba(239, 68, 68, 0.1);
        border: 1rpx solid rgba(239, 68, 68, 0.25);
        color: #ef4444;

        .theme-dark & {
            background: rgba(239, 68, 68, 0.16);
            border: 1rpx solid rgba(239, 68, 68, 0.35);
            color: #f87171;
        }
    }

    &__dot {
        font-size: 16rpx;
    }
}

.article-title {
    font-size: 46rpx;
    line-height: 1.36;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.5rpx;
    margin-bottom: 28rpx;
    display: block;
    word-break: break-word;
}

/* 沉浸式元信息卡片条 */
.meta-card {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 14rpx 18rpx;
    padding: 18rpx 24rpx;
    border-radius: 20rpx;
    background: rgba(0, 0, 0, 0.02);
    border: 1rpx solid rgba(0, 0, 0, 0.04);

    .theme-dark & {
        background: rgba(255, 255, 255, 0.03);
        border: 1rpx solid rgba(255, 255, 255, 0.06);
    }

    &__item {
        display: flex;
        align-items: center;
        gap: 8rpx;
    }

    &__divider {
        width: 1rpx;
        height: 22rpx;
        background: rgba(148, 163, 184, 0.3);
    }

    &__text {
        font-size: 24rpx;
        color: var(--text-secondary);
        font-weight: 500;
    }
}

.article-divider {
    height: 1rpx;
    background: linear-gradient(90deg, rgba(148, 163, 184, 0.25) 0%, rgba(148, 163, 184, 0.05) 100%);
    margin: 40rpx 0 44rpx;
}

/* 正文 */
.article-content {
    margin-bottom: 60rpx;
}

/* 底部结语与版权 */
.article-footer {
    margin-top: 60rpx;
    padding-top: 40rpx;
}

.article-end-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24rpx;
    margin-bottom: 40rpx;

    &__line {
        flex: 1;
        height: 1rpx;
        background: rgba(148, 163, 184, 0.2);
    }

    &__text {
        font-size: 22rpx;
        letter-spacing: 3rpx;
        color: var(--text-tertiary);
        font-weight: 600;
        text-transform: uppercase;
    }
}

.copyright-card {
    display: flex;
    align-items: flex-start;
    gap: 16rpx;
    padding: 24rpx 28rpx;
    border-radius: 20rpx;
    background: rgba(43, 140, 238, 0.04);
    border: 1rpx solid rgba(43, 140, 238, 0.12);

    .theme-dark & {
        background: rgba(43, 140, 238, 0.08);
        border: 1rpx solid rgba(43, 140, 238, 0.2);
    }

    &__text {
        flex: 1;
        font-size: 24rpx;
        line-height: 1.6;
        color: var(--text-tertiary);
    }
}

/* 骨架屏 */
@keyframes shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

.loading-layout {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
    padding-top: 20rpx;
}

.skeleton-header {
    width: 30%;
    height: 44rpx;
    border-radius: 999rpx;
    background: linear-gradient(
        90deg,
        rgba(148, 163, 184, 0.1) 25%,
        rgba(148, 163, 184, 0.2) 50%,
        rgba(148, 163, 184, 0.1) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite linear;
}

.skeleton-title {
    width: 85%;
    height: 64rpx;
    border-radius: 12rpx;
    margin-bottom: 20rpx;
    background: linear-gradient(
        90deg,
        rgba(148, 163, 184, 0.1) 25%,
        rgba(148, 163, 184, 0.2) 50%,
        rgba(148, 163, 184, 0.1) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite linear;
}

.skeleton-meta {
    width: 60%;
    height: 36rpx;
    border-radius: 8rpx;
    margin-bottom: 30rpx;
    background: linear-gradient(
        90deg,
        rgba(148, 163, 184, 0.1) 25%,
        rgba(148, 163, 184, 0.2) 50%,
        rgba(148, 163, 184, 0.1) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite linear;
}

.skeleton-line {
    height: 36rpx;
    border-radius: 8rpx;
    background: linear-gradient(
        90deg,
        rgba(148, 163, 184, 0.1) 25%,
        rgba(148, 163, 184, 0.2) 50%,
        rgba(148, 163, 184, 0.1) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite linear;
}
</style>
