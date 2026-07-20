<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- StatusBar Spacer -->
        <view class="status-bar-bg" :style="{ height: `${statusBarHeight}px` }"></view>

        <!-- Custom Navbar -->
        <view class="navbar" :style="{ top: `${statusBarHeight}px`, height: `${titleBarHeight}px` }">
            <view class="navbar-inner">
                <view class="back-btn" @click="goBack">
                    <mdi-icon
                        path="/static/icons/arrow-left.svg"
                        size="18px"
                        :color="settingsStore.isDark ? '#e5e7eb' : '#374151'"
                    ></mdi-icon>
                </view>
                <text class="navbar-title">{{ t('index.subjectRecommend') }}</text>
                <view class="navbar-placeholder"></view>
            </view>
        </view>

        <!-- List Scroll Area -->
        <scroll-view
            scroll-y
            class="scroll-area"
            :style="{ paddingTop: `${titleBarHeight}px` }"
            refresher-enabled
            :refresher-triggered="isRefreshing"
            @refresherrefresh="onRefresh"
            @scrolltolower="onLoadMore"
        >
            <view class="subjects-container">
                <!-- Skeleton Loader -->
                <view v-if="isLoading && !subjectsList.length" class="skeleton-list">
                    <view v-for="i in 4" :key="i" class="skeleton-card">
                        <view class="skeleton-glow"></view>
                    </view>
                </view>

                <!-- Empty State -->
                <view v-else-if="!subjectsList.length" class="empty-state">
                    <uni-icons type="image" size="64" color="var(--text-tertiary)"></uni-icons>
                    <text class="empty-title">暂无专题合集</text>
                    <text class="empty-desc">敬请期待，更多精美策划合集正在路上！</text>
                </view>

                <!-- Subject Cards List -->
                <view v-else class="subjects-list">
                    <view
                        v-for="item in subjectsList"
                        :key="item.id"
                        class="subject-card"
                        @click="goDetail(item)"
                    >
                        <view class="subject-card__header">
                            <view class="subject-card__badge-row">
                                <view class="subject-card__badges-group">
                                    <view class="subject-card__badge" v-if="item.is_locked">
                                        <uni-icons type="vip-filled" size="10" color="#fbbf24"></uni-icons>
                                        <text class="badge-text">PREMIUM</text>
                                    </view>
                                    <view class="subject-card__badge subject-card__badge--neutral" v-else-if="item.tags">
                                        <text class="badge-text">{{ item.tags.split(',')[0] }}</text>
                                    </view>
                                </view>
                                <view class="subject-card__meta">
                                    <text class="meta-item">{{ item.wall_count || 0 }} {{ isEn ? 'Walls' : '张壁纸' }}</text>
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
                            <view class="preview-item" v-for="(img, imgIdx) in item.preview_walls" :key="imgIdx">
                                <image class="preview-img" :src="img.replace('.jpg', '_small.webp')" mode="aspectFill" lazy-load></image>
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
                        <text v-else-if="noMore" class="no-more-text">—— 没有更多专题了 ——</text>
                    </view>
                </view>
            </view>
        </scroll-view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
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

const subjectsList = ref([]);
const isLoading = ref(false);
const isRefreshing = ref(false);
const pageNum = ref(1);
const noMore = ref(false);

const fetchSubjects = async (isAppend = false) => {
    try {
        if (!isAppend) {
            pageNum.value = 1;
            noMore.value = false;
            isLoading.value = true;
        }
        const res = await apiGetSubjects({
            is_active: true,
            pageNum: pageNum.value,
            pageSize: 10,
        });
        if (res.code === 200 && res.data) {
            const mapped = res.data.map((item) => handlePicUrl(item));
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

onLoad(() => {
    fetchSubjects();
});
</script>

<style lang="scss" scoped>
.layout {
    background: var(--page-background);
    min-height: 100vh;
    position: relative;
}

.status-bar-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background: var(--page-background);
    z-index: 100;
}

.navbar {
    position: fixed;
    left: 0;
    width: 100%;
    background: var(--page-background);
    z-index: 99;
}

.navbar-inner {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30rpx;
}

.back-btn {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.navbar-title {
    font-size: 32rpx;
    font-weight: 700;
    color: var(--text-primary);
}

.navbar-placeholder {
    width: 60rpx;
}

.scroll-area {
    width: 100%;
    height: 100vh;
    box-sizing: border-box;
}

.subjects-container {
    padding: 30rpx;
    padding-bottom: 60rpx;
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
    transition: transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.24s;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 24rpx;

    &:active {
        transform: scale(0.98);
        box-shadow: 0 6rpx 16rpx var(--shadow-color);
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

    .preview-item {
        flex: 1;
        height: 288rpx;
        border-radius: 20rpx;
        overflow: hidden;
        background: var(--page-background-secondary);
        box-shadow: 0 6rpx 16rpx var(--shadow-color);
        transition: transform 0.28s;

        &:hover {
            transform: translateY(-4rpx);
        }
    }

    .preview-img {
        width: 100%;
        height: 100%;
        display: block;
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
}

.loading-more {
    padding: 30rpx 0;
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
