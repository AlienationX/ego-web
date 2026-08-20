<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 沉浸式极简头部 (The Inspiration Gallery Header) -->
        <view class="gallery-header" :style="{ paddingTop: statusBarHeight + 'px' }">
            <view class="nav-bar">
                <view class="left-section">
                    <view class="back-btn" @click="handleBack">
                        <mdi-icon path="/static/icons/arrow-left.svg" size="20px"
                            :color="settingsStore.isDark ? '#e5e7eb' : '#1e293b'" />
                    </view>
                    <view class="header-titles">
                        <text class="main-title">
                            {{ isSelectMode ? (selectedIds.size > 0 ? tp('favorite.selectedCount', {
                                count:
                                    selectedIds.size
                            }) : t('favorite.batchManage')) : t('user.profile.myFavorite') }}
                        </text>
                        <text class="sub-title" v-if="!isSelectMode">{{ t('favorite.superTitle') }}</text>
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
                <view v-if="isLoading && wallpaperList.length === 0" class="sk-waterfall">
                    <view class="sk-col">
                        <view class="sk-card" style="height: 480rpx;"></view>
                        <view class="sk-card" style="height: 380rpx;"></view>
                        <view class="sk-card" style="height: 520rpx;"></view>
                    </view>
                    <view class="sk-col">
                        <view class="sk-card" style="height: 360rpx;"></view>
                        <view class="sk-card" style="height: 540rpx;"></view>
                        <view class="sk-card" style="height: 420rpx;"></view>
                    </view>
                </view>

                <!-- 空状态展示 -->
                <empty-state v-else-if="!isLoading && wallpaperList.length === 0" icon-path="/static/icons/heart.svg"
                    :title="t('favorite.empty')" :description="t('favorite.desc')" :action-text="t('favorite.goBrowse')"
                    @action="gotoHome" />

                <!-- 实际内容展示区 -->
                <view class="gallery-body" v-else>
                    <!-- 相册顶部专属信息与管理工具条 -->
                    <view class="gallery-toolbar">
                        <view class="toolbar-left">
                            <text class="toolbar-count" v-if="!isSelectMode">
                                {{ tp('favorite.totalCount', { count: totalCount || wallpaperList.length }) }}
                            </text>
                            <text class="toolbar-hint" v-else>{{ t('favorite.selectHint') }}</text>
                        </view>
                        <view class="toolbar-right">
                            <view class="manage-pill-btn" :class="{ 'is-active': isSelectMode }"
                                @click="toggleSelectMode">
                                <text>{{ isSelectMode ? t('common.done') : t('favorite.batchManage') }}</text>
                            </view>
                        </view>
                    </view>

                    <!-- 原生双列真瀑布流容器 (取消收藏后后续卡片自动重排对齐) -->
                    <view class="waterfall-layout">
                        <!-- 左列 -->
                        <view class="waterfall-col">
                            <view class="wf-card" :class="{
                                'is-deleting': item.is_deleting,
                                'is-selected': isSelectMode && selectedIds.has(item.id),
                                'in-select-mode': isSelectMode
                            }" v-for="(item, index) in leftCol" :key="item.id + '-l-' + index"
                                @click="handleCardClick(item)" @longpress="handleCardLongPress(item)">
                                <image class="card-img" :src="item.smallPicurl || item.picurl" mode="widthFix" lazy-load
                                    @load="onImageLoad(item, $event)" :class="{ 'is-loaded': item.loaded }"></image>

                                <!-- 常规模式：右上角磨砂玻璃心形红点取消收藏 -->
                                <view v-if="!isSelectMode" class="heart-badge"
                                    @click.stop="handleSingleUnfavorite(item)">
                                    <uni-icons type="heart-filled" size="16" color="#ef4444"></uni-icons>
                                </view>

                                <!-- 多选模式：勾选复选圆圈 -->
                                <view v-else class="select-badge" :class="{ 'is-checked': selectedIds.has(item.id) }">
                                    <uni-icons v-if="selectedIds.has(item.id)" type="checkmarkempty" size="16"
                                        color="#ffffff"></uni-icons>
                                </view>
                            </view>
                        </view>

                        <!-- 右列 -->
                        <view class="waterfall-col">
                            <view class="wf-card" :class="{
                                'is-deleting': item.is_deleting,
                                'is-selected': isSelectMode && selectedIds.has(item.id),
                                'in-select-mode': isSelectMode
                            }" v-for="(item, index) in rightCol" :key="item.id + '-r-' + index"
                                @click="handleCardClick(item)" @longpress="handleCardLongPress(item)">
                                <image class="card-img" :src="item.smallPicurl || item.picurl" mode="widthFix" lazy-load
                                    @load="onImageLoad(item, $event)" :class="{ 'is-loaded': item.loaded }"></image>

                                <!-- 常规模式：右上角磨砂玻璃心形红点取消收藏 -->
                                <view v-if="!isSelectMode" class="heart-badge"
                                    @click.stop="handleSingleUnfavorite(item)">
                                    <uni-icons type="heart-filled" size="16" color="#ef4444"></uni-icons>
                                </view>

                                <!-- 多选模式：勾选复选圆圈 -->
                                <view v-else class="select-badge" :class="{ 'is-checked': selectedIds.has(item.id) }">
                                    <uni-icons v-if="selectedIds.has(item.id)" type="checkmarkempty" size="16"
                                        color="#ffffff"></uni-icons>
                                </view>
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
                    <text>{{ isAllSelected ? t('favorite.deselectAll') : t('favorite.selectAll') }}</text>
                </view>

                <button class="batch-delete-btn" :disabled="selectedIds.size === 0" @click="handleBatchUnfavorite">
                    <uni-icons type="heart-filled" size="18"
                        :color="selectedIds.size > 0 ? '#ffffff' : '#94a3b8'"></uni-icons>
                    <text>{{ t('favorite.unfavoriteSelected') }} ({{ selectedIds.size }})</text>
                </button>
            </view>
            <view class="safe-area-bottom"></view>
        </view>

        <!-- 取消收藏确认弹窗（支持单张与批量） -->
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

// 数据列表与分页状态
const wallpaperList = ref([]);
const leftCol = ref([]);
const rightCol = ref([]);
let leftHeight = 0;
let rightHeight = 0;

const pageNum = ref(1);
const pageSize = 20;
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

// 弹窗与待取消项
const dialogRef = ref(null);
const dialogTitle = ref('');
const dialogDesc = ref('');
const removeMode = ref('single'); // 'single' | 'batch'
const itemToRemove = ref(null);

// 是否已全部选中
const isAllSelected = computed(() => {
    return wallpaperList.value.length > 0 && selectedIds.value.size === wallpaperList.value.length;
});

// 计算卡片的虚拟高度贡献（根据原始宽高比，限制在 1.1 ~ 2.1 之间）
const getItemVirtualHeight = (item) => {
    if (item.renderedHeight) return item.renderedHeight;
    const w = Number(item.width) || 300;
    const h = Number(item.height) || 533;
    const ratio = Math.max(1.1, Math.min(2.1, h / w));
    return ratio * 100;
};

// 重新将 wallpaperList 全量均衡分发至左右两列（实现删除后后续图片自然重排对齐）
const redistributeColumns = () => {
    const lCol = [];
    const rCol = [];
    let lH = 0;
    let rH = 0;

    wallpaperList.value.forEach(item => {
        const vH = getItemVirtualHeight(item);
        if (lH <= rH) {
            lCol.push(item);
            lH += vH;
        } else {
            rCol.push(item);
            rH += vH;
        }
    });

    leftCol.value = lCol;
    rightCol.value = rCol;
    leftHeight = lH;
    rightHeight = rH;
};

// 分页增量分发至两列
const appendItemsToColumns = (newItems) => {
    newItems.forEach(item => {
        const vH = getItemVirtualHeight(item);
        if (leftHeight <= rightHeight) {
            leftCol.value.push(item);
            leftHeight += vH;
        } else {
            rightCol.value.push(item);
            rightHeight += vH;
        }
        wallpaperList.value.push(item);
    });
};

// 图片加载成功记录真实比例
const onImageLoad = (item, e) => {
    item.loaded = true;
    if (e?.detail?.width && e?.detail?.height) {
        const ratio = e.detail.height / e.detail.width;
        item.renderedHeight = Math.max(1.1, Math.min(2.1, ratio)) * 100;
    }
};

// 拉取收藏列表数据
const fetchFavoriteList = async (isRefresh = false) => {
    if (isLoading.value) return;
    if (!isRefresh && noMoreData.value) return;

    if (isRefresh) {
        pageNum.value = 1;
        noMoreData.value = false;
        leftHeight = 0;
        rightHeight = 0;
        leftCol.value = [];
        rightCol.value = [];
        wallpaperList.value = [];
    }

    isLoading.value = true;
    try {
        const res = await apiGetActions({
            action_key: 'favorite',
            pageNum: pageNum.value,
            pageSize: pageSize,
        });

        const rows = Array.isArray(res?.data) ? res.data : [];
        const formatted = rows.map(item => ({
            ...handlePicUrl(item),
            loaded: false,
            is_deleting: false
        }));

        if (isRefresh || pageNum.value === 1) {
            wallpaperList.value = formatted;
            redistributeColumns();
        } else {
            appendItemsToColumns(formatted);
        }

        totalPages.value = res?.pagination?.total_pages || 1;
        totalCount.value = res?.pagination?.total_items || wallpaperList.value.length;
        if (pageNum.value >= totalPages.value || rows.length < pageSize) {
            noMoreData.value = true;
        }
    } catch (e) {
        console.error('Failed to fetch favorite list:', e);
    } finally {
        isLoading.value = false;
        isRefreshing.value = false;
    }
};

// 下拉刷新
const onRefresh = async () => {
    if (isSelectMode.value) return;
    isRefreshing.value = true;
    await fetchFavoriteList(true);
};

// 触底加载更多
const onLoadMore = () => {
    if (isSelectMode.value) return;
    if (!noMoreData.value && !isLoading.value) {
        pageNum.value++;
        fetchFavoriteList(false);
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

// 卡片长按事件（长按任意壁纸直接触发微震动并进入多选模式）
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

// 单张取消收藏确认
const handleSingleUnfavorite = (item) => {
    removeMode.value = 'single';
    itemToRemove.value = item;
    dialogTitle.value = t('favorite.unfavoriteConfirmTitle');
    dialogDesc.value = t('favorite.unfavoriteConfirmDesc');
    dialogRef.value?.open();
};

// 批量取消收藏确认
const handleBatchUnfavorite = () => {
    if (selectedIds.value.size === 0) return;
    removeMode.value = 'batch';
    dialogTitle.value = t('favorite.unfavoriteConfirmTitle');
    dialogDesc.value = tp('favorite.batchUnfavoriteConfirmDesc', { count: selectedIds.value.size });
    dialogRef.value?.open();
};

// 确认删除/取消收藏逻辑（含平滑过渡与瀑布流重新排版）
const onConfirmRemove = async () => {
    if (removeMode.value === 'single') {
        if (!itemToRemove.value) return;
        const targetItem = itemToRemove.value;

        // 1. 触发目标卡片渐隐缩小微动画
        const matchLeft = leftCol.value.find(w => w.id === targetItem.id);
        if (matchLeft) matchLeft.is_deleting = true;
        const matchRight = rightCol.value.find(w => w.id === targetItem.id);
        if (matchRight) matchRight.is_deleting = true;

        // 2. 动画播放 300ms 后从主列表移除并执行瀑布流重排
        setTimeout(() => {
            wallpaperList.value = wallpaperList.value.filter(w => w.id !== targetItem.id);
            if (totalCount.value > 0) totalCount.value--;
            redistributeColumns();
        }, 300);

        // 3. 请求接口取消收藏
        try {
            await apiPostActions({ wall_id: targetItem.id, action_key: 'favorite', action_value: 0 });
            uni.showToast({ title: t('favorite.unfavoriteSuccess'), icon: 'none' });
        } catch (e) {
            uni.showToast({ title: t('user.profile.operationFailed'), icon: 'none' });
        }
    } else if (removeMode.value === 'batch') {
        const idsToDelete = Array.from(selectedIds.value);
        if (idsToDelete.length === 0) return;

        // 1. 批量打标删除动效
        leftCol.value.forEach(item => {
            if (selectedIds.value.has(item.id)) item.is_deleting = true;
        });
        rightCol.value.forEach(item => {
            if (selectedIds.value.has(item.id)) item.is_deleting = true;
        });

        // 2. 300ms 动画后从主列表剔除并全量重新排版
        setTimeout(() => {
            const count = selectedIds.value.size;
            wallpaperList.value = wallpaperList.value.filter(item => !selectedIds.value.has(item.id));
            if (totalCount.value >= count) totalCount.value -= count;
            selectedIds.value.clear();
            isSelectMode.value = false;
            redistributeColumns();
        }, 300);

        // 3. 并发批量调用接口
        try {
            await Promise.allSettled(
                idsToDelete.map(id => apiPostActions({ wall_id: id, action_key: 'favorite', action_value: 0 }))
            );
            uni.showToast({ title: t('favorite.batchUnfavoriteSuccess'), icon: 'none' });
        } catch (e) {
            uni.showToast({ title: t('user.profile.operationFailed'), icon: 'none' });
        }
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
    fetchFavoriteList(true);
});
</script>

<style lang="scss" scoped>
.layout {
    background: var(--page-background);
    height: 100vh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;

    .gallery-header {
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

        /* 2 列骨架屏 */
        .sk-waterfall {
            display: flex;
            gap: 16rpx;
            padding-top: 20rpx;

            .sk-col {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 16rpx;

                .sk-card {
                    width: 100%;
                    border-radius: 16rpx;
                    background: rgba(120, 120, 128, 0.08);
                    animation: skPulse 1.5s infinite ease-in-out;
                }
            }
        }

        .gallery-body {
            display: flex;
            flex-direction: column;
        }

        /* 顶部信息与管理工具栏 */
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

        /* 双列真瀑布流 */
        .waterfall-layout {
            display: flex;
            align-items: flex-start;
            gap: 16rpx;
            padding-bottom: 60rpx;

            .waterfall-col {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 16rpx;
            }

            .wf-card {
                position: relative;
                width: 100%;
                border-radius: 36rpx;
                overflow: hidden;
                background: rgba(120, 120, 128, 0.08);
                transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1);
                border: 2rpx solid transparent;

                &:active {
                    transform: scale(0.98);
                }

                &.in-select-mode {
                    &:active {
                        transform: scale(0.96);
                    }
                }

                &.is-selected {
                    border-color: #4f46e5;
                    box-shadow: 0 0 0 2rpx rgba(79, 70, 229, 0.3);
                }

                &.is-deleting {
                    transform: scale(0.2) rotate(-4deg);
                    opacity: 0;
                    filter: blur(6px);
                    pointer-events: none;
                }

                .card-img {
                    width: 100%;
                    display: block;
                    opacity: 0;
                    transition: opacity 0.3s ease;

                    &.is-loaded {
                        opacity: 1;
                    }
                }

                /* 单张取消收藏心形红点按钮 */
                .heart-badge {
                    position: absolute;
                    top: 12rpx;
                    right: 12rpx;
                    width: 48rpx;
                    height: 48rpx;
                    border-radius: 50%;
                    background: rgba(0, 0, 0, 0.45);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                    transition: transform 0.2s ease, background-color 0.2s ease;

                    &:active {
                        transform: scale(0.85);
                        background: rgba(239, 68, 68, 0.85);
                    }
                }

                /* 多选复选框圆圈 */
                .select-badge {
                    position: absolute;
                    top: 12rpx;
                    right: 12rpx;
                    width: 48rpx;
                    height: 48rpx;
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
