<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 头部导航栏 -->
        <view class="header-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
            <view class="nav-content">
                <view class="back-btn" @click="handleBack">
                    <mdi-icon path="/static/icons/arrow-left.svg" size="20px"
                        :color="settingsStore.isDark ? '#e5e7eb' : '#1e293b'" />
                </view>
                <view class="header-titles">
                    <text class="title">{{ t('widgets.title') }}</text>
                    <text class="subtitle">{{ t('widgets.subtitle') }}</text>
                </view>
            </view>
        </view>

        <!-- 主内容滚动区 -->
        <scroll-view class="page-scroll" scroll-y show-scrollbar="false">
            <view class="content-body">
                <!-- 顶部 Hero 介绍卡片 -->
                <view class="hero-banner">
                    <view class="hero-content">
                        <view class="hero-icon-wrap">
                            <mdi-icon path="/static/icons/view-dashboard.svg" size="28px" color="#FBBF24"></mdi-icon>
                        </view>
                        <view class="hero-texts">
                            <text class="hero-title">{{ t('widgets.heroTitle') }}</text>
                            <text class="hero-desc">{{ t('widgets.heroDesc') }}</text>
                        </view>
                    </view>
                </view>

                <!-- 小组件 1: 2x2 每日精选日签 -->
                <view class="widget-card-section">
                    <view class="section-header">
                        <view class="badge">2 × 2</view>
                        <text class="section-title">{{ t('widgets.dailyTitle') }}</text>
                    </view>

                    <!-- 2x2 模拟真实小组件外观 -->
                    <view class="mockup-container">
                        <view class="mockup-2x2">
                            <image class="mock-bg" :src="sampleWallUrl" mode="aspectFill"></image>
                            <view class="mock-overlay"></view>
                            <view class="mock-pill">{{ locale === 'en' ? 'Daily Pick' : '每日灵感' }}</view>
                            <view class="mock-bottom">
                                <view class="date-row">
                                    <text class="day-num">{{ todayDay }}</text>
                                    <text class="month-weekday">{{ locale === 'en' ? `${todayWeekday} · Mo ${todayMonth}` : `${todayMonth}月 · ${todayWeekday}` }}</text>
                                </view>
                                <text class="mock-title">{{ wallTitle }}</text>
                            </view>
                        </view>
                    </view>

                    <view class="widget-info-row">
                        <text class="widget-desc">{{ t('widgets.dailyDesc') }}</text>
                        <button class="add-btn" @click="handleAddWidget('2x2')">
                            <mdi-icon path="/static/icons/plus.svg" size="16px" color="#ffffff"></mdi-icon>
                            <text>{{ t('widgets.addToHomeScreen') }}</text>
                        </button>
                    </view>
                </view>

                <!-- 小组件 2: 4x2 诗意时钟日签 -->
                <view class="widget-card-section">
                    <view class="section-header">
                        <view class="badge">4 × 2</view>
                        <text class="section-title">{{ t('widgets.clockTitle') }}</text>
                    </view>

                    <!-- 4x2 模拟真实小组件外观 -->
                    <view class="mockup-container">
                        <view class="mockup-4x2">
                            <!-- 左侧壁纸 -->
                            <view class="mock-left">
                                <image class="mock-bg" :src="sampleWallUrl" mode="aspectFill"></image>
                                <view class="mock-overlay"></view>
                                <view class="mock-pill-sm">{{ locale === 'en' ? 'Featured' : '精选' }}</view>
                                <text class="mock-left-title">{{ wallTitle }}</text>
                            </view>
                            <!-- 右侧时钟与诗意句子 -->
                            <view class="mock-right">
                                <view class="time-header">
                                    <view class="time-group">
                                        <text class="time-text">{{ currentTime }}</text>
                                        <text class="date-sub">{{ locale === 'en' ? `${todayMonth}/${todayDay} ${todayWeekdayShort}` : `${todayMonth}-${todayDay} ${todayWeekdayShort}` }}</text>
                                    </view>
                                    <view class="refresh-mock-icon">
                                        <mdi-icon path="/static/icons/refresh.svg" size="14px" color="#ffffff"></mdi-icon>
                                    </view>
                                </view>
                                <text class="quote-text">{{ quoteText }}</text>
                                <text class="author-text">—— {{ authorText }}</text>
                            </view>
                        </view>
                    </view>

                    <view class="widget-info-row">
                        <text class="widget-desc">{{ t('widgets.clockDesc') }}</text>
                        <button class="add-btn" @click="handleAddWidget('4x2')">
                            <mdi-icon path="/static/icons/plus.svg" size="16px" color="#ffffff"></mdi-icon>
                            <text>{{ t('widgets.addToHomeScreen') }}</text>
                        </button>
                    </view>
                </view>

                <!-- 小组件 3: 4x4 巨幅壁纸海报与快捷中心 -->
                <view class="widget-card-section">
                    <view class="section-header">
                        <view class="badge">4 × 4</view>
                        <text class="section-title">{{ t('widgets.largeTitle') }}</text>
                    </view>

                    <!-- 4x4 模拟真实小组件外观 -->
                    <view class="mockup-container">
                        <view class="mockup-4x4">
                            <image class="mock-bg" :src="sampleWallUrl" mode="aspectFill"></image>
                            <view class="mock-overlay-deep"></view>

                            <!-- 顶部状态行 -->
                            <view class="mock-4x4-top">
                                <view class="mock-pill">{{ locale === 'en' ? 'Daily Art Poster' : '每日灵感海报' }}</view>
                                <view class="mock-date-pill">{{ locale === 'en' ? `${todayMonth}/${todayDay} ${todayWeekday}` : `${todayMonth}-${todayDay} ${todayWeekday}` }}</view>
                            </view>

                            <!-- 中间壁纸标题与名言 -->
                            <view class="mock-4x4-content">
                                <text class="mock-gold-title">{{ wallTitle }}</text>
                                <text class="mock-4x4-quote">{{ quoteText }}</text>
                                <text class="mock-4x4-author">—— {{ authorText }}</text>
                            </view>

                            <!-- 底部快捷功能栏 (搜索、收藏、换一张) -->
                            <view class="mock-4x4-bar">
                                <view class="mock-bar-item">
                                    <mdi-icon path="/static/icons/magnify.svg" size="14px" color="#ffffff"></mdi-icon>
                                    <text>{{ t('common.search') || (locale === 'en' ? 'Search' : '搜索') }}</text>
                                </view>
                                <view class="mock-bar-divider"></view>
                                <view class="mock-bar-item">
                                    <mdi-icon path="/static/icons/heart.svg" size="14px" color="#ffffff"></mdi-icon>
                                    <text>{{ t('user.profile.myFavorite') || (locale === 'en' ? 'Favorite' : '收藏') }}</text>
                                </view>
                                <view class="mock-bar-divider"></view>
                                <view class="mock-bar-item">
                                    <mdi-icon path="/static/icons/refresh.svg" size="14px" color="#ffffff"></mdi-icon>
                                    <text>{{ t('common.refresh') || (locale === 'en' ? 'Refresh' : '换一张') }}</text>
                                </view>
                            </view>
                        </view>
                    </view>

                    <view class="widget-info-row">
                        <text class="widget-desc">{{ t('widgets.largeDesc') }}</text>
                        <button class="add-btn" @click="handleAddWidget('4x4')">
                            <mdi-icon path="/static/icons/plus.svg" size="16px" color="#ffffff"></mdi-icon>
                            <text>{{ t('widgets.addToHomeScreen') }}</text>
                        </button>
                    </view>
                </view>

                <!-- FAQ 与保活指南卡片 -->
                <view class="faq-card">
                    <view class="faq-header">
                        <mdi-icon path="/static/icons/help-circle.svg" size="18px" color="#3b82f6"></mdi-icon>
                        <text class="faq-title">{{ t('widgets.faqTitle') }}</text>
                    </view>
                    <view class="faq-item">
                        <text class="faq-q">{{ t('widgets.faqAutoStartTitle') }}</text>
                        <text class="faq-a">{{ t('widgets.faqAutoStartDesc') }}</text>
                    </view>
                </view>
            </view>
            <view class="safe-area-bottom"></view>
        </scroll-view>
    </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { getStatusBarHeight } from '@/utils/layout.js';
import { apiGetWidgetDaily } from '@/api/wallpaper.js';

// #ifdef APP-PLUS || APP-HARMONY
import { requestPinWidget } from '@/uni_modules/ego-widget';
// #endif

const { t, locale } = useI18n();
const settingsStore = useSettingsStore();
const statusBarHeight = ref(getStatusBarHeight() || 0);

const sampleWallUrl = ref('');
const wallTitle = ref(locale.value === 'en' ? 'Ego Wallpaper · Daily Pick' : '本我壁纸 · 灵感日签');
const quoteText = ref(locale.value === 'en' ? 'Life is clear and bright, all things are lovely.' : '生活明朗，万物可爱，人间值得，未来可期。');
const authorText = ref(locale.value === 'en' ? 'Wang Zengqi' : '汪曾祺');

const now = new Date();
const todayDay = ref(String(now.getDate()).padStart(2, '0'));
const todayMonth = ref(String(now.getMonth() + 1).padStart(2, '0'));
const weekdaysZh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekdaysEnFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const todayWeekday = ref(locale.value === 'en' ? weekdaysEnFull[now.getDay()] : weekdaysZh[now.getDay()].replace('周', '星期'));
const todayWeekdayShort = ref(locale.value === 'en' ? weekdaysEn[now.getDay()] : weekdaysZh[now.getDay()]);
const currentTime = ref(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);

onMounted(async () => {
    try {
        const res = await apiGetWidgetDaily({ lang: locale.value });
        if (res && res.data) {
            if (res.data.medium_picurl || res.data.small_picurl || res.data.picurl) {
                sampleWallUrl.value = res.data.medium_picurl || res.data.small_picurl || res.data.picurl;
            }
            if (res.data.title) wallTitle.value = res.data.title;
            if (res.data.quote) quoteText.value = res.data.quote;
            if (res.data.quote_author) authorText.value = res.data.quote_author;
            if (res.data.date_info) {
                todayDay.value = res.data.date_info.day || todayDay.value;
                todayMonth.value = res.data.date_info.month || todayMonth.value;
                todayWeekday.value = res.data.date_info.weekday || todayWeekday.value;
                currentTime.value = res.data.date_info.time || currentTime.value;
            }
        }
    } catch (e) {
        console.error('Failed to fetch widget daily data', e);
    }
});

const handleAddWidget = (size) => {
    // #ifdef APP-PLUS || APP-HARMONY
    requestPinWidget({
        size,
        success: () => {
            uni.showToast({
                title: t('widgets.pinSuccess'),
                icon: 'none',
                duration: 5000,
            });
        },
        fail: (err) => {
            console.warn('requestPinWidget failed or not supported:', err);
            uni.showModal({
                title: t('widgets.manualAddTitle'),
                content: t('widgets.manualAddDesc'),
                showCancel: false,
                confirmText: t('common.confirm') || '知道了',
            });
        },
    });
    // #endif

    // #ifndef APP-PLUS || APP-HARMONY
    uni.showModal({
        title: t('common.tip') || '提示',
        content: '桌面小组件目前专为 Android / HarmonyOS App 端提供，请在手机客户端中一键添加到手机桌面体验！',
        showCancel: false,
    });
    // #endif
};

const handleBack = () => {
    uni.navigateBack({
        fail: () => {
            uni.switchTab({ url: '/pages/user/user' });
        },
    });
};
</script>

<style lang="scss" scoped>
.layout {
    background: var(--page-background);
    height: 100vh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;

    .header-bar {
        background: var(--page-background);
        border-bottom: 1rpx solid var(--panel-border);
        z-index: 10;

        .nav-content {
            height: 100rpx;
            display: flex;
            align-items: center;
            padding: 0 30rpx;
            gap: 20rpx;

            .back-btn {
                width: 60rpx;
                height: 60rpx;
                display: flex;
                align-items: center;
                justify-content: center;

                &:active {
                    opacity: 0.7;
                }
            }

            .header-titles {
                display: flex;
                flex-direction: column;

                .title {
                    font-size: 32rpx;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .subtitle {
                    font-size: 20rpx;
                    color: var(--text-tertiary);
                    margin-top: 4rpx;
                }
            }
        }
    }

    .page-scroll {
        flex: 1;
        height: 0;

        .content-body {
            padding: 24rpx 30rpx 60rpx;
            display: flex;
            flex-direction: column;
            gap: 32rpx;
        }
    }

    /* 顶部 Banner */
    .hero-banner {
        background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
        border-radius: 28rpx;
        padding: 30rpx 32rpx;
        box-shadow: 0 10rpx 28rpx rgba(49, 46, 129, 0.25);
        border: 1rpx solid rgba(251, 191, 36, 0.2);

        .hero-content {
            display: flex;
            align-items: center;
            gap: 24rpx;

            .hero-icon-wrap {
                width: 72rpx;
                height: 72rpx;
                border-radius: 50%;
                background: rgba(251, 191, 36, 0.15);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .hero-texts {
                display: flex;
                flex-direction: column;
                gap: 8rpx;

                .hero-title {
                    font-size: 28rpx;
                    font-weight: 800;
                    color: #FBBF24;
                }

                .hero-desc {
                    font-size: 22rpx;
                    color: rgba(255, 255, 255, 0.88);
                    line-height: 1.4;
                }
            }
        }
    }

    /* 小组件卡片容器 */
    .widget-card-section {
        background: var(--panel-background, rgba(120, 120, 128, 0.06));
        border-radius: 28rpx;
        padding: 28rpx;
        border: 1rpx solid var(--panel-border);
        display: flex;
        flex-direction: column;
        gap: 24rpx;

        .section-header {
            display: flex;
            align-items: center;
            gap: 16rpx;

            .badge {
                padding: 4rpx 14rpx;
                border-radius: 12rpx;
                background: #4f46e5;
                color: #ffffff;
                font-size: 20rpx;
                font-weight: 700;
                letter-spacing: 0.5rpx;
            }

            .section-title {
                font-size: 28rpx;
                font-weight: 700;
                color: var(--text-primary);
            }
        }

        .mockup-container {
            display: flex;
            justify-content: center;
            padding: 10rpx 0;
        }

        /* 2x2 模拟小组件 */
        .mockup-2x2 {
            position: relative;
            width: 320rpx;
            height: 320rpx;
            border-radius: 36rpx;
            overflow: hidden;
            background: #1c1c1e;
            box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.28);

            .mock-bg {
                width: 100%;
                height: 100%;
                display: block;
            }

            .mock-overlay {
                position: absolute;
                inset: 0;
                background: linear-gradient(180deg, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.55) 100%);
            }

            .mock-pill {
                position: absolute;
                top: 20rpx;
                left: 20rpx;
                padding: 6rpx 14rpx;
                border-radius: 20rpx;
                background: rgba(0, 0, 0, 0.45);
                backdrop-filter: blur(8px);
                color: #ffffff;
                font-size: 18rpx;
                font-weight: 700;
                border: 1rpx solid rgba(255, 255, 255, 0.2);
            }

            .mock-bottom {
                position: absolute;
                bottom: 20rpx;
                left: 20rpx;
                right: 20rpx;
                display: flex;
                flex-direction: column;

                .date-row {
                    display: flex;
                    align-items: baseline;
                    gap: 10rpx;

                    .day-num {
                        font-size: 48rpx;
                        font-weight: 800;
                        color: #ffffff;
                        line-height: 1;
                    }

                    .month-weekday {
                        font-size: 20rpx;
                        font-weight: 600;
                        color: #e0e0e0;
                    }
                }

                .mock-title {
                    font-size: 20rpx;
                    color: rgba(255, 255, 255, 0.9);
                    margin-top: 6rpx;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                }
            }
        }

        /* 4x2 模拟小组件 */
        .mockup-4x2 {
            position: relative;
            width: 100%;
            height: 240rpx;
            border-radius: 36rpx;
            overflow: hidden;
            background: #1c1c1e;
            box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.28);
            display: flex;

            .mock-left {
                width: 44%;
                height: 100%;
                position: relative;

                .mock-bg {
                    width: 100%;
                    height: 100%;
                    display: block;
                }

                .mock-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 30%, rgba(0, 0, 0, 0.75) 100%);
                }

                .mock-pill-sm {
                    position: absolute;
                    top: 16rpx;
                    left: 16rpx;
                    padding: 4rpx 12rpx;
                    border-radius: 16rpx;
                    background: rgba(0, 0, 0, 0.45);
                    color: #ffffff;
                    font-size: 16rpx;
                    font-weight: 700;
                }

                .mock-left-title {
                    position: absolute;
                    bottom: 16rpx;
                    left: 16rpx;
                    right: 16rpx;
                    color: #ffffff;
                    font-size: 20rpx;
                    font-weight: 700;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            }

            .mock-right {
                flex: 1;
                padding: 20rpx 24rpx;
                display: flex;
                flex-direction: column;
                justify-content: center;

                .time-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;

                    .time-group {
                        display: flex;
                        align-items: baseline;
                        gap: 12rpx;

                        .time-text {
                            font-size: 36rpx;
                            font-weight: 800;
                            color: #ffffff;
                        }

                        .date-sub {
                            font-size: 18rpx;
                            color: #9ca3af;
                        }
                    }

                    .refresh-mock-icon {
                        width: 44rpx;
                        height: 44rpx;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.12);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                }

                .quote-text {
                    font-size: 22rpx;
                    color: #e5e7eb;
                    margin-top: 14rpx;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 2;
                    overflow: hidden;
                }

                .author-text {
                    font-size: 18rpx;
                    color: #9ca3af;
                    text-align: right;
                    margin-top: 8rpx;
                }
            }
        }

        /* 4x4 模拟巨幅海报小组件 */
        .mockup-4x4 {
            position: relative;
            width: 100%;
            height: 460rpx;
            border-radius: 40rpx;
            overflow: hidden;
            background: #1c1c1e;
            box-shadow: 0 20rpx 48rpx rgba(0, 0, 0, 0.35);
            display: flex;
            flex-direction: column;
            justify-content: space-between;

            .mock-bg {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                display: block;
            }

            .mock-overlay-deep {
                position: absolute;
                inset: 0;
                background: linear-gradient(180deg, rgba(0, 0, 0, 0) 30%, rgba(0, 0, 0, 0.2) 60%, rgba(0, 0, 0, 0.65) 100%);
            }

            .mock-4x4-top {
                position: relative;
                z-index: 2;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 24rpx;

                .mock-pill {
                    padding: 6rpx 16rpx;
                    border-radius: 20rpx;
                    background: rgba(0, 0, 0, 0.45);
                    backdrop-filter: blur(8px);
                    color: #ffffff;
                    font-size: 20rpx;
                    font-weight: 700;
                    border: 1rpx solid rgba(255, 255, 255, 0.2);
                }

                .mock-date-pill {
                    padding: 6rpx 16rpx;
                    border-radius: 20rpx;
                    background: rgba(0, 0, 0, 0.45);
                    backdrop-filter: blur(8px);
                    color: #e5e7eb;
                    font-size: 20rpx;
                    border: 1rpx solid rgba(255, 255, 255, 0.2);
                }
            }

            .mock-4x4-content {
                position: relative;
                z-index: 2;
                padding: 0 28rpx;
                display: flex;
                flex-direction: column;
                gap: 8rpx;

                .mock-gold-title {
                    font-size: 24rpx;
                    font-weight: 800;
                    color: #FBBF24;
                }

                .mock-4x4-quote {
                    font-size: 26rpx;
                    font-weight: 700;
                    color: #ffffff;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 2;
                    overflow: hidden;
                }

                .mock-4x4-author {
                    font-size: 22rpx;
                    color: #d1d5db;
                    text-align: right;
                }
            }

            .mock-4x4-bar {
                position: relative;
                z-index: 2;
                margin: 0 24rpx 24rpx;
                height: 72rpx;
                border-radius: 36rpx;
                background: rgba(0, 0, 0, 0.55);
                backdrop-filter: blur(12px);
                border: 1rpx solid rgba(255, 255, 255, 0.2);
                display: flex;
                align-items: center;

                .mock-bar-item {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8rpx;
                    color: #ffffff;
                    font-size: 22rpx;
                    font-weight: 600;
                }

                .mock-bar-divider {
                    width: 1rpx;
                    height: 28rpx;
                    background: rgba(255, 255, 255, 0.25);
                }
            }
        }

        .widget-info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20rpx;

            .widget-desc {
                font-size: 22rpx;
                color: var(--text-tertiary);
                flex: 1;
                line-height: 1.4;
            }

            .add-btn {
                margin: 0;
                padding: 0 32rpx;
                height: 68rpx;
                border-radius: 34rpx;
                background: #4f46e5;
                color: #ffffff;
                font-size: 24rpx;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8rpx;
                box-shadow: 0 6rpx 16rpx rgba(79, 70, 229, 0.35);

                &::after {
                    display: none;
                }

                &:active {
                    opacity: 0.85;
                }
            }
        }
    }

    /* FAQ 卡片 */
    .faq-card {
        background: var(--panel-background, rgba(120, 120, 128, 0.06));
        border-radius: 24rpx;
        padding: 26rpx;
        border: 1rpx solid var(--panel-border);
        display: flex;
        flex-direction: column;
        gap: 16rpx;

        .faq-header {
            display: flex;
            align-items: center;
            gap: 12rpx;

            .faq-title {
                font-size: 26rpx;
                font-weight: 700;
                color: var(--text-primary);
            }
        }

        .faq-item {
            display: flex;
            flex-direction: column;
            gap: 8rpx;

            .faq-q {
                font-size: 22rpx;
                font-weight: 600;
                color: var(--text-secondary);
            }

            .faq-a {
                font-size: 20rpx;
                color: var(--text-tertiary);
                line-height: 1.5;
            }
        }
    }

    .safe-area-bottom {
        width: 100%;
        height: env(safe-area-inset-bottom, 24px);
    }
}
</style>
