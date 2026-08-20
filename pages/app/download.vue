<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 极简沉浸式头部 (纯净标题栏，彻底避让微信胶囊) -->
        <view class="studio-header" :style="{ paddingTop: statusBarHeight + 'px' }">
            <view class="nav-bar">
                <view class="left-section">
                    <view class="back-btn" @click="handleBack">
                        <mdi-icon path="/static/icons/arrow-left.svg" size="20px"
                            :color="settingsStore.isDark ? '#e5e7eb' : '#1e293b'" />
                    </view>
                    <view class="header-titles">
                        <text class="main-title">
                            {{ isSelectMode ? (selectedIds.size > 0 ? tp('download.selectedCount', {
                                count:
                                    selectedIds.size
                            }) : t('download.batchDelete')) : t('user.profile.myDownload') }}
                        </text>
                        <text class="sub-title" v-if="!isSelectMode">{{ t('download.superTitle') }}</text>
                    </view>
                </view>
                <!-- 顶部右侧保持完全留白，与微信小程序胶囊零冲突 -->
            </view>
        </view>

        <!-- 主内容滚动区 -->
        <view class="content-wrapper">
            <scroll-view class="gallery-scroll" scroll-y :refresher-enabled="!isSelectMode"
                :refresher-triggered="isRefreshing" :scroll-top="scrollTop" @refresherrefresh="onRefresh"
                @scrolltolower="onLoadMore" @scroll="onScroll" show-scrollbar="false">

                <!-- 骨架屏加载态 -->
                <view v-if="isLoading && wallpaperList.length === 0" class="sk-grid">
                    <view v-for="i in 12" :key="i" class="sk-card"></view>
                </view>

                <!-- 空状态展示 -->
                <empty-state v-else-if="!isLoading && wallpaperList.length === 0" icon-path="/static/icons/download.svg"
                    :title="t('download.empty')" :description="t('download.desc')" :action-text="t('download.goBrowse')"
                    @action="gotoHome" />

                <!-- 实际内容展示区 -->
                <view class="gallery-body" v-else>
                    <!-- 方案 1：相册顶部专属信息与管理条 -->
                    <view class="gallery-toolbar">
                        <view class="toolbar-left">
                            <text class="toolbar-count" v-if="!isSelectMode">
                                {{ tp('download.totalCount', { count: totalCount || wallpaperList.length }) }}
                            </text>
                            <text class="toolbar-hint" v-else>{{ t('download.selectHint') }}</text>
                        </view>
                        <view class="toolbar-right">
                            <view class="manage-pill-btn" :class="{ 'is-active': isSelectMode }"
                                @click="toggleSelectMode">
                                <text>{{ isSelectMode ? t('common.done') : t('download.batchDelete') }}</text>
                            </view>
                        </view>
                    </view>

                    <!-- 原生 3 列相册网格（支持点击与长按手势驱动） -->
                    <view class="album-grid">
                        <view class="album-card" :class="{
                            'is-deleting': item.is_deleting,
                            'is-selected': isSelectMode && selectedIds.has(item.id),
                            'in-select-mode': isSelectMode
                        }" v-for="(item, index) in wallpaperList" :key="item.id + '-' + index"
                            @click="handleCardClick(item)" @longpress="handleCardLongPress(item)">
                            <image class="album-img" :src="item.smallPicurl || item.picurl" mode="aspectFill" lazy-load
                                @load="item.loaded = true" :class="{ 'is-loaded': item.loaded }"></image>

                            <!-- 多选模式：勾选复选圆圈 -->
                            <view v-if="isSelectMode" class="select-badge" :class="{ 'is-checked': selectedIds.has(item.id) }">
                                <uni-icons v-if="selectedIds.has(item.id)" type="checkmarkempty" size="16"
                                    color="#ffffff"></uni-icons>
                            </view>
                        </view>
                    </view>

                    <!-- 触底加载 / 全部加载完毕提示 -->
                    <view class="list-footer">
                        <view class="loading-more" v-if="isLoading">
                            <uni-icons type="spinner-cycle" size="18"
                                :color="settingsStore.isDark ? '#9ca3af' : '#64748b'"></uni-icons>
                            <text class="footer-text">{{ t('common.loading') }}</text>
                        </view>
                        <text class="no-more-text" v-else-if="noMoreData">{{ t('common.noMore') }}</text>
                    </view>
                </view>
            </scroll-view>
        </view>

        <!-- 多选模式底部悬浮操作栏 -->
        <view class="batch-bottom-bar" v-if="isSelectMode">
            <view class="batch-bar-content">
                <view class="select-all-btn" @click="toggleSelectAll">
                    <view class="checkbox-circle" :class="{ 'is-checked': isAllSelected }">
                        <uni-icons v-if="isAllSelected" type="checkmarkempty" size="14" color="#ffffff"></uni-icons>
                    </view>
                    <text>{{ isAllSelected ? t('download.deselectAll') : t('download.selectAll') }}</text>
                </view>

                <button class="batch-delete-btn" :disabled="selectedIds.size === 0" @click="handleBatchDelete">
                    <uni-icons type="trash-filled" size="18"
                        :color="selectedIds.size > 0 ? '#ffffff' : '#94a3b8'"></uni-icons>
                    <text>{{ t('download.deleteSelected') }} ({{ selectedIds.size }})</text>
                </button>
            </view>
            <view class="safe-area-bottom"></view>
        </view>

        <!-- 删除确认弹窗（支持单张与批量删除） -->
        <popup-navigation-dialog ref="dialogRef" :title="dialogTitle" :description="dialogDesc"
            @confirm="onConfirmRemove" />

        <!-- 回到顶部浮动按钮 -->
        <fab-back-top :show="showBackTop && !isSelectMode" @click="scrollToTop" />
    </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTranslateParams } from '@/utils/i18n.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useAppStore } from '@/stores/app.js';
import { apiGetActions, apiPostActions } from '@/api/wallpaper.js';
import { handlePicUrl, gotoHome } from '@/utils/common.js';
import { getStatusBarHeight } from '@/utils/layout.js';

const { t, tp } = useTranslateParams();
const settingsStore = useSettingsStore();
const appStore = useAppStore();

const statusBarHeight = ref(getStatusBarHeight() || 0);

const wallpaperList = ref([]);
const pageNum = ref(1);
const pageSize = 24;
const totalPages = ref(1);
const totalCount = ref(0);
const isLoading = ref(false);
const isRefreshing = ref(false);
const noMoreData = ref(false);

const scrollTop = ref(0);
const oldScrollTop = ref(0);
const showBackTop = ref(false);

// 多选管理状态
const isSelectMode = ref(false);
const selectedIds = ref(new Set());

// 弹窗状态
const dialogRef = ref(null);
const dialogTitle = ref('');
const dialogDesc = ref('');

// 是否已全部选中
const isAllSelected = computed(() => {
    return wallpaperList.value.length > 0 && selectedIds.value.size === wallpaperList.value.length;
});

// 获取下载列表数据
const fetchDownloadList = async (isRefresh = false) => {
    if (isLoading.value) return;
    if (!isRefresh && noMoreData.value) return;

    if (isRefresh) {
        pageNum.value = 1;
        noMoreData.value = false;
    }

    isLoading.value = true;
    try {
        const res = await apiGetActions({
            action_key: 'download',
            pageNum: pageNum.value,
            pageSize: pageSize,
        });

        const rows = Array.isArray(res?.data) ? res.data : [];
        const formatted = rows.map(item => ({ ...handlePicUrl(item), loaded: false, is_deleting: false }));

        if (isRefresh || pageNum.value === 1) {
            wallpaperList.value = formatted;
        } else {
            wallpaperList.value.push(...formatted);
        }

        totalPages.value = res?.pagination?.total_pages || 1;
        totalCount.value = res?.pagination?.total_items || wallpaperList.value.length;
        if (pageNum.value >= totalPages.value || rows.length < pageSize) {
            noMoreData.value = true;
        }
    } catch (e) {
        console.error('Failed to fetch download list:', e);
    } finally {
        isLoading.value = false;
        isRefreshing.value = false;
    }
};

// 下拉刷新
const onRefresh = async () => {
    if (isSelectMode.value) return;
    isRefreshing.value = true;
    await fetchDownloadList(true);
};

// 触底加载更多
const onLoadMore = () => {
    if (isSelectMode.value) return;
    if (!noMoreData.value && !isLoading.value) {
        pageNum.value++;
        fetchDownloadList(false);
    }
};

// 滚动监听与回到顶部
const onScroll = (e) => {
    oldScrollTop.value = e.detail.scrollTop;
    showBackTop.value = e.detail.scrollTop > 400;
};

const scrollToTop = () => {
    scrollTop.value = oldScrollTop.value;
    setTimeout(() => {
        scrollTop.value = 0;
    }, 20);
};

// 切换多选模式
const toggleSelectMode = () => {
    isSelectMode.value = !isSelectMode.value;
    selectedIds.value.clear();
};

// 卡片点击事件（常规模式大图预览，多选模式切换选中）
const handleCardClick = (item) => {
    if (isSelectMode.value) {
        toggleItemSelect(item.id);
    } else {
        openPreview(item.id);
    }
};

// 方案 2：卡片长按事件（长按任意壁纸直接触发微震动并进入多选模式）
const handleCardLongPress = (item) => {
    if (!isSelectMode.value) {
        try { uni.vibrateShort(); } catch (e) { }
        isSelectMode.value = true;
        selectedIds.value.add(item.id);
        selectedIds.value = new Set(selectedIds.value);
    }
};

// 切换单项选中状态
const toggleItemSelect = (id) => {
    if (selectedIds.value.has(id)) {
        selectedIds.value.delete(id);
    } else {
        selectedIds.value.add(id);
    }
    selectedIds.value = new Set(selectedIds.value);
};

// 全选 / 取消全选
const toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedIds.value.clear();
    } else {
        wallpaperList.value.forEach(item => selectedIds.value.add(item.id));
    }
    selectedIds.value = new Set(selectedIds.value);
};

// 批量删除弹窗唤起
const handleBatchDelete = () => {
    if (selectedIds.value.size === 0) return;
    dialogTitle.value = t('download.batchDeleteConfirmTitle');
    dialogDesc.value = tp('download.batchDeleteConfirmDesc', { count: selectedIds.value.size });
    dialogRef.value?.open();
};

// 确认批量删除
const onConfirmRemove = async () => {
    const idsToDelete = Array.from(selectedIds.value);
    if (idsToDelete.length === 0) return;

    // 1. 批量打标删除动效
    wallpaperList.value.forEach(item => {
        if (selectedIds.value.has(item.id)) {
            item.is_deleting = true;
        }
    });

    // 2. 300ms 动画后从数组移除
    setTimeout(() => {
        const count = selectedIds.value.size;
        wallpaperList.value = wallpaperList.value.filter(item => !selectedIds.value.has(item.id));
        if (totalCount.value >= count) totalCount.value -= count;
        selectedIds.value.clear();
        isSelectMode.value = false;
    }, 300);

    // 3. 并发批量调用接口注销下载
    try {
        await Promise.allSettled(
            idsToDelete.map(id => apiPostActions({ wall_id: id, action_key: 'download', action_value: 0 }))
        );
        uni.showToast({ title: t('download.batchDeleteSuccess'), icon: 'none' });
    } catch (e) {
        uni.showToast({ title: t('user.profile.operationFailed'), icon: 'none' });
    }
};

// 点击进入大图预览
const openPreview = (id) => {
    appStore.wallList = wallpaperList.value;
    uni.navigateTo({ url: `/pages/app/preview?id=${id}` });
};

// 返回上一页（多选模式下优先退出多选模式）
const handleBack = () => {
    if (isSelectMode.value) {
        isSelectMode.value = false;
        selectedIds.value.clear();
        return;
    }
    goBack();
};

const goBack = () => {
    uni.navigateBack({
        fail: () => {
            uni.switchTab({ url: '/pages/user/user' });
        }
    });
};

onMounted(() => {
    fetchDownloadList(true);
});
</script>

<style lang="scss" scoped>
.layout {
    background: var(--page-background);
    height: 100vh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;

    .studio-header {
        position: relative;
        z-index: 100;
        background: var(--page-background);
        border-bottom: 1rpx solid var(--panel-border);

        .nav-bar {
            height: 100rpx;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 30rpx;

            .left-section {
                display: flex;
                align-items: center;
                gap: 20rpx;
            }

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

                .main-title {
                    font-size: 32rpx;
                    font-weight: 700;
                    color: var(--text-primary);
                    letter-spacing: 0.5rpx;
                }

                .sub-title {
                    font-size: 20rpx;
                    color: var(--text-tertiary);
                    text-transform: uppercase;
                    letter-spacing: 1rpx;
                    margin-top: 4rpx;
                }
            }
        }
    }

    .content-wrapper {
        flex: 1;
        height: 0;
        position: relative;

        .gallery-scroll {
            width: 100%;
            height: 100%;
            padding: 0 20rpx;
            box-sizing: border-box;
        }

        /* 3 列骨架屏 */
        .sk-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16rpx;
            padding-top: 20rpx;

            .sk-card {
                aspect-ratio: 1 / 1;
                border-radius: 12rpx;
                background: rgba(120, 120, 128, 0.08);
                animation: skPulse 1.5s infinite ease-in-out;
            }
        }

        .gallery-body {
            display: flex;
            flex-direction: column;
        }

        /* 方案 1：相册顶部信息与管理工具栏 */
        .gallery-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 24rpx 6rpx 16rpx;

            .toolbar-left {
                .toolbar-count {
                    font-size: 24rpx;
                    font-weight: 600;
                    color: var(--text-secondary);
                }

                .toolbar-hint {
                    font-size: 24rpx;
                    font-weight: 600;
                    color: #4f46e5;
                }
            }

            .toolbar-right {
                .manage-pill-btn {
                    display: flex;
                    align-items: center;
                    gap: 8rpx;
                    padding: 8rpx 20rpx;
                    border-radius: 30rpx;
                    background: rgba(120, 120, 128, 0.08);
                    font-size: 24rpx;
                    font-weight: 600;
                    color: var(--text-secondary);
                    transition: all 0.2s ease;

                    &:active {
                        opacity: 0.7;
                    }

                    &.is-active {
                        background: #4f46e5;
                        color: #ffffff;
                    }
                }
            }
        }

        /* 3 列原生相册网格 */
        .album-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16rpx;
            padding-bottom: 60rpx;

            .album-card {
                position: relative;
                aspect-ratio: 1 / 1;
                border-radius: 12rpx;
                overflow: hidden;
                background: rgba(120, 120, 128, 0.08);
                transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
                border: 2rpx solid transparent;

                &:active {
                    transform: scale(0.97);
                }

                &.in-select-mode {
                    &:active {
                        transform: scale(0.95);
                    }
                }

                &.is-selected {
                    border-color: #4f46e5;
                    box-shadow: 0 0 0 2rpx rgba(79, 70, 229, 0.3);
                }

                &.is-deleting {
                    transform: scale(0.25) rotate(-6deg);
                    opacity: 0;
                    filter: blur(8px);
                    pointer-events: none;
                }

                .album-img {
                    width: 100%;
                    height: 100%;
                    display: block;
                    opacity: 0;
                    transition: opacity 0.3s ease;

                    &.is-loaded {
                        opacity: 1;
                    }
                }

                /* 多选复选框圆圈 */
                .select-badge {
                    position: absolute;
                    top: 12rpx;
                    right: 12rpx;
                    width: 44rpx;
                    height: 44rpx;
                    border-radius: 50%;
                    background: rgba(0, 0, 0, 0.35);
                    border: 2rpx solid rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(6px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

                    &.is-checked {
                        background: #4f46e5;
                        border-color: #4f46e5;
                        box-shadow: 0 4rpx 12rpx rgba(79, 70, 229, 0.45);
                    }
                }
            }
        }

        /* 底部加载与完结提示 */
        .list-footer {
            padding: 30rpx 0 60rpx;
            display: flex;
            justify-content: center;
            align-items: center;

            .loading-more {
                display: flex;
                align-items: center;
                gap: 12rpx;

                .footer-text {
                    font-size: 24rpx;
                    color: var(--text-tertiary);
                }
            }

            .no-more-text {
                font-size: 22rpx;
                color: var(--text-tertiary);
                letter-spacing: 1rpx;
            }
        }
    }

    /* 多选模式底部悬浮栏 */
    .batch-bottom-bar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 200;
        background: var(--page-background);
        border-top: 1rpx solid var(--panel-border);
        box-shadow: 0 -8rpx 30rpx rgba(0, 0, 0, 0.08);
        animation: slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1);

        .batch-bar-content {
            height: 110rpx;
            padding: 0 30rpx;
            display: flex;
            align-items: center;
            justify-content: space-between;

            .select-all-btn {
                display: flex;
                align-items: center;
                gap: 16rpx;
                font-size: 28rpx;
                font-weight: 600;
                color: var(--text-primary);
                padding: 16rpx 0;

                .checkbox-circle {
                    width: 38rpx;
                    height: 38rpx;
                    border-radius: 50%;
                    border: 2rpx solid var(--text-tertiary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;

                    &.is-checked {
                        background: #4f46e5;
                        border-color: #4f46e5;
                    }
                }
            }

            .batch-delete-btn {
                margin: 0;
                height: 76rpx;
                padding: 0 36rpx;
                border-radius: 38rpx;
                background: #ef4444;
                color: #ffffff;
                font-size: 26rpx;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 10rpx;
                border: none;
                outline: none;
                box-shadow: 0 6rpx 16rpx rgba(239, 68, 68, 0.35);

                &::after {
                    display: none !important;
                    border: none !important;
                }

                &:active {
                    opacity: 0.85;
                }

                &[disabled] {
                    background: rgba(120, 120, 128, 0.15);
                    color: #94a3b8;
                    box-shadow: none;
                    opacity: 0.6;
                }
            }
        }

        .safe-area-bottom {
            width: 100%;
            height: env(safe-area-inset-bottom, 16px);
        }
    }
}

@keyframes skPulse {
    0% {
        opacity: 0.6;
    }

    50% {
        opacity: 0.3;
    }

    100% {
        opacity: 0.6;
    }
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
    }

    to {
        transform: translateY(0);
    }
}
</style>
