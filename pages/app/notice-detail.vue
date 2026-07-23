<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <menu-bar class="menubar" :show-border="false" :show-toggle-menu="false">
            <template #title>{{ $t('index.notice') }}</template>
            <template #menuBtn></template>
        </menu-bar>

        <view class="container">
            <view class="loadingLayout" v-if="Object.keys(detail).length === 0">
                <uni-load-more status="loading"></uni-load-more>
            </view>

            <template v-else>
                <!-- 顶部大标题区：标题在左，置顶 Badge 在标题右侧 -->
                <view class="header">
                    <text class="title-text">{{ isEn && detail.title_en ? detail.title_en : detail.title }}</text>
                    <view class="top-tag" v-if="detail.select">
                        <text class="top-tag__text">{{ isEn ? 'TOP' : '置顶' }}</text>
                    </view>
                </view>

                <!-- 核心正文内容 -->
                <view class="content">
                    <mp-html
                        :content="noticeContent"
                        :tag-style="noticeTagStyle"
                        container-style="line-height: 1.8; word-break: break-word; color: var(--text-primary);"
                    ></mp-html>
                </view>

                <!-- 紧跟正文下方的发布信息与阅读量（非最底部） -->
                <view class="info-bar">
                    <view class="meta">
                        <text class="author">{{ $t('common.admin') }}</text>
                        <text class="dot">•</text>
                        <uni-dateformat class="date" :date="detail.publish_date" format="yyyy/MM/dd"></uni-dateformat>
                    </view>
                    <view class="views" v-if="detail.view_count">
                        <text>{{ isEn ? 'Views' : '阅读' }} {{ detail.view_count }}</text>
                    </view>
                </view>
            </template>
        </view>
    </view>
</template>

<script setup>
import { ref, toRefs, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { onLoad } from '@dcloudio/uni-app';
import { apiGetNotice } from '@/api/wallpaper.js';
import { useSettingsStore } from '@/stores/settings.js';

const { locale } = useI18n();
const settingsStore = useSettingsStore();
const isEn = computed(() => locale.value === 'en');

const props = defineProps({
    id: String,
    name: String,
});

const { id, name } = toRefs(props);
const detail = ref({});

const noticeContent = computed(() => {
    return isEn.value && detail.value.content_en ? detail.value.content_en : (detail.value.content || '');
});

// 标签样式适配：增强二级标题层次感，图片纯扁平（无阴影/无边框/无圆角），自适应 Light/Dark
const noticeTagStyle = computed(() => {
    const isDark = settingsStore.isDark;
    const textPrimary = 'var(--text-primary)';
    const textSecondary = 'var(--text-secondary)';
    const borderColor = 'var(--panel-border)';
    const cardBg = 'var(--panel-background)';
    const quoteBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
    const accentColor = '#28B389';

    return {
        body: `color: ${textPrimary}; font-size: 29rpx;`,
        div: `color: ${textPrimary}; font-size: 29rpx;`,
        h1: `color: ${textPrimary}; font-size: 38rpx; font-weight: 700; margin: 36rpx 0 20rpx;`,
        // 二级标题：明显放大(35rpx)，字体加粗，显著区分于正文(29rpx)和大标题(42rpx)
        h2: `color: ${textPrimary}; font-size: 36rpx; font-weight: 700; margin: 44rpx 0 20rpx; line-height: 1.4;`,
        h3: `color: ${textPrimary}; font-size: 34rpx; font-weight: 700; margin: 38rpx 0 16rpx; line-height: 1.4;`,
        p: `color: ${textPrimary}; font-size: 29rpx; line-height: 1.8; margin-bottom: 24rpx; opacity: 0.92;`,
        span: `color: ${textPrimary};`,
        li: `color: ${textPrimary}; font-size: 29rpx; line-height: 1.8; margin-bottom: 12rpx; opacity: 0.92;`,
        ul: 'padding-left: 36rpx; margin-bottom: 24rpx;',
        ol: 'padding-left: 36rpx; margin-bottom: 24rpx;',
        blockquote: `background: ${quoteBg}; border-left: 6rpx solid ${accentColor}; padding: 20rpx 24rpx; margin: 28rpx 0; color: ${textSecondary}; font-size: 27rpx;`,
        // 图片：纯扁平，无阴影、无边框、无圆角
        img: 'max-width: 100%; height: auto; display: block; margin: 28rpx auto; border: none; box-shadow: none; border-radius: 0;',
        a: `color: ${accentColor}; text-decoration: none; word-break: break-all;`,
        '.faq-container': 'display: flex; flex-direction: column; gap: 24rpx; margin-top: 10rpx;',
        '.faq-item': `background: ${cardBg}; border: 1rpx solid ${borderColor}; border-radius: 20rpx; padding: 28rpx;`,
        '.faq-title': `color: ${textPrimary}; font-size: 33rpx; font-weight: 700; margin-bottom: 14rpx; display: flex; align-items: center;`,
        '.faq-bullet': 'color: #ef4444; font-weight: 700; font-size: 32rpx; margin-right: 12rpx;',
        '.faq-answer': `color: ${textPrimary}; font-size: 28rpx; line-height: 1.75; margin: 0; opacity: 0.88;`,
        '.article-container': 'display: flex; flex-direction: column; gap: 24rpx;',
        '.section-card': `background: ${cardBg}; border: 1rpx solid ${borderColor}; border-radius: 20rpx; padding: 28rpx;`,
        '.lead-text': `color: ${textPrimary}; font-size: 29rpx; line-height: 1.8; font-weight: 500; margin: 0;`,
        '.model-list': 'list-style: none; padding: 0; margin: 16rpx 0 0 0;',
        '.highlight-red': 'color: #ef4444; font-weight: 600;',
        '.highlight-purple': 'color: #a855f7; font-weight: 600;',
        '.highlight-blue': 'color: #3b82f6; font-weight: 600;',
        '.quote-block': `background: ${quoteBg}; border-left: 6rpx solid ${accentColor}; padding: 18rpx 24rpx; margin: 20rpx 0 0 0; font-style: italic; font-size: 27rpx;`,
        '.image-wrapper': 'text-align: center; margin: 20rpx 0;',
        '.tip-text': `font-size: 26rpx; text-align: center; margin-top: 16rpx; color: ${textSecondary};`
    };
});

const getNoticeDetail = async () => {
    let res = await apiGetNotice({}, id.value);
    detail.value = res.data;

    if (name.value !== undefined) {
        uni.setNavigationBarTitle({
            title: name.value,
        });
    }
};

onLoad(() => {
    getNoticeDetail();
});
</script>

<style lang="scss" scoped>
.layout {
    background-color: var(--page-background);
    min-height: 100vh;

    .container {
        padding: 32rpx 36rpx 60rpx;

        .header {
            display: flex;
            align-items: center;
            gap: 16rpx;
            margin-bottom: 32rpx;

            .title-text {
                font-size: 42rpx;
                font-weight: 700;
                color: var(--text-primary);
                line-height: 1.4;
                word-break: break-word;
            }

            .top-tag {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 4rpx 14rpx;
                border-radius: 8rpx;
                background: rgba(239, 68, 68, 0.12);
                border: 1rpx solid rgba(239, 68, 68, 0.25);
                flex-shrink: 0;

                &__text {
                    font-size: 22rpx;
                    font-weight: 700;
                    color: #ef4444;
                    line-height: 1.2;
                    letter-spacing: 0.5rpx;
                }
            }
        }

        .content {
            padding-bottom: 24rpx;
            color: var(--text-primary);
        }

        /* 紧跟在正文下方的作者与阅读信息行 */
        .info-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 24rpx;
            margin-top: 12rpx;
            color: var(--text-tertiary);
            font-size: 26rpx;

            .meta {
                display: flex;
                align-items: center;
                gap: 8rpx;

                .author {
                    font-weight: 500;
                    color: var(--text-secondary);
                }

                .dot {
                    margin: 0 4rpx;
                    opacity: 0.5;
                }

                .date {
                    color: var(--text-tertiary);
                }
            }

            .views {
                color: var(--text-tertiary);
            }
        }
    }
}
</style>
