<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 沉浸式极简头部 -->
        <view class="gallery-header" :style="{ paddingTop: statusBarHeight + 'px' }">
            <view class="nav-bar">
                <view class="left-section">
                    <view class="back-btn" @click="handleBack">
                        <mdi-icon path="/static/icons/arrow-left.svg" size="20px"
                            :color="settingsStore.isDark ? '#e5e7eb' : '#1e293b'" />
                    </view>

                    <!-- 场景 A：在指定画板内详情模式 -->
                    <view class="header-titles" v-if="currentBoard">
                        <text class="main-title">{{ currentBoard.name }}</text>
                        <text class="sub-title">{{ tp('board.wallCount', { count: currentBoard.items_count ||
                            wallpaperList.length }) }}</text>
                    </view>

                    <!-- 场景 B：多选批量管理模式 -->
                    <view class="header-titles" v-else-if="isSelectMode">
                        <text class="main-title">
                            {{ selectedIds.size > 0 ? tp('favorite.selectedCount', { count: selectedIds.size }) :
                                t('favorite.batchManage') }}
                        </text>
                    </view>

                    <!-- 场景 C：主页双 Tab 切换 (全部收藏 vs 灵感画板) -->
                    <view class="segment-tabs" v-else>
                        <view class="segment-pill" :class="{ 'is-active': activeTab === 'all' }"
                            @click="switchTab('all')">
                            <text>{{ t('board.allFavorites') }}</text>
                        </view>
                        <view class="segment-pill" :class="{ 'is-active': activeTab === 'boards' }"
                            @click="switchTab('boards')">
                            <text>{{ t('board.myBoards') }}</text>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <!-- 主内容滚动区 -->
        <view class="content-wrapper">
            <!-- 视图 1：灵感画板列表视图 (Pinterest Boards Grid) -->
            <scroll-view v-if="activeTab === 'boards' && !currentBoard" class="gallery-scroll" scroll-y
                :refresher-enabled="true" :refresher-triggered="isRefreshing" @refresherrefresh="onRefreshBoards"
                show-scrollbar="false">
                <view class="boards-body">
                    <!-- 新建画板操作条 -->
                    <view class="boards-toolbar">
                        <text class="toolbar-title">{{ t('board.boardsTitle') }} ({{ boardsList.length }})</text>
                        <view class="create-board-btn" @click="openCreateBoardDialog">
                            <mdi-icon path="/static/icons/plus.svg" size="16px" color="#ffffff"></mdi-icon>
                            <text>{{ t('board.createBoard') }}</text>
                        </view>
                    </view>

                    <!-- 画板骨架屏 -->
                    <view v-if="isLoadingBoards && boardsList.length === 0" class="sk-boards">
                        <view class="sk-board-card" v-for="i in 4" :key="i"></view>
                    </view>

                    <!-- 画板空状态 -->
                    <empty-state v-else-if="!isLoadingBoards && boardsList.length === 0"
                        icon-path="/static/icons/folder-multiple-image.svg" :title="t('board.emptyBoards')"
                        :description="t('board.emptyBoardsDesc')" :action-text="t('board.createBoard')"
                        @action="openCreateBoardDialog" />

                    <!-- Pinterest 风格双列画板网格 -->
                    <view v-else class="boards-grid">
                        <board-card v-for="item in boardsList" :key="item.id" :board="item"
                            @click="handleBoardClick(item)" />
                    </view>
                </view>
            </scroll-view>

            <!-- 视图 2：全部收藏瀑布流 或 指定画板内壁纸瀑布流 -->
            <scroll-view v-else class="gallery-scroll" scroll-y :refresher-enabled="!isSelectMode"
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
                    :title="currentBoard ? t('board.emptyBoardHint') : t('favorite.empty')"
                    :description="currentBoard ? '' : t('favorite.desc')"
                    :action-text="currentBoard ? t('board.backToBoards') : t('favorite.goBrowse')"
                    @action="currentBoard ? closeBoardDetail() : gotoHome()" />

                <!-- 实际内容展示区 -->
                <view class="gallery-body" v-else>
                    <!-- 工具条 -->
                    <view class="gallery-toolbar">
                        <view class="toolbar-left">
                            <text class="toolbar-count" v-if="!isSelectMode">
                                {{ tp('favorite.totalCount', { count: totalCount || wallpaperList.length }) }}
                            </text>
                            <text class="toolbar-hint" v-else>{{ t('favorite.selectHint') }}</text>
                        </view>

                        <view class="toolbar-right">
                            <!-- 画板专属轮播切换按钮 -->
                            <view v-if="currentBoard && !isSelectMode" class="rotate-toggle-pill"
                                :class="{ 'is-active': currentBoard.is_auto_rotate }" @click="toggleBoardRotate">
                                <mdi-icon path="/static/icons/refresh.svg" size="14px"
                                    :color="currentBoard.is_auto_rotate ? '#ffffff' : (settingsStore.isDark ? '#94a3b8' : '#64748b')"></mdi-icon>
                                <text>{{ currentBoard.is_auto_rotate ? t('board.rotating') : t('board.setAsRotate')
                                    }}</text>
                            </view>

                            <!-- 批量管理按钮 -->
                            <view class="manage-pill-btn" :class="{ 'is-active': isSelectMode }"
                                @click="toggleSelectMode">
                                <text>{{ isSelectMode ? t('common.done') : t('favorite.batchManage') }}</text>
                            </view>
                        </view>
                    </view>

                    <!-- 原生双列真瀑布流容器 -->
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

                                <!-- 常规模式：心形红点 (仅在全部收藏模式下显示) -->
                                <view v-if="!isSelectMode && !currentBoard" class="heart-badge"
                                    @click.stop="handleSingleRemove(item)">
                                    <uni-icons type="heart-filled" size="16" color="#ef4444"></uni-icons>
                                </view>

                                <!-- 多选模式：勾选圆圈 -->
                                <view v-else-if="isSelectMode" class="select-badge" :class="{ 'is-checked': selectedIds.has(item.id) }">
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

                                <!-- 常规模式：心形红点 (仅在全部收藏模式下显示) -->
                                <view v-if="!isSelectMode && !currentBoard" class="heart-badge"
                                    @click.stop="handleSingleRemove(item)">
                                    <uni-icons type="heart-filled" size="16" color="#ef4444"></uni-icons>
                                </view>

                                <!-- 多选模式：勾选圆圈 -->
                                <view v-else-if="isSelectMode" class="select-badge" :class="{ 'is-checked': selectedIds.has(item.id) }">
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

                <view class="batch-actions-right">
                    <!-- 全部收藏模式：支持一键存入画板 -->
                    <button v-if="!currentBoard" class="batch-add-board-btn" :disabled="selectedIds.size === 0"
                        @click="handleBatchAddToBoard">
                        <mdi-icon path="/static/icons/bookmark-multiple.svg" size="16px" color="#ffffff"></mdi-icon>
                        <text>{{ t('board.batchAddToBoard') }}</text>
                    </button>

                    <!-- 删除/移除按钮 -->
                    <button class="batch-delete-btn" :disabled="selectedIds.size === 0" @click="handleBatchAction">
                        <mdi-icon :path="currentBoard ? '/static/icons/delete-outline.svg' : '/static/icons/heart.svg'" size="16px"
                            color="#ffffff"></mdi-icon>
                        <text>{{ currentBoard ? t('board.removeFromBoard') : t('favorite.unfavoriteSelected') }} ({{
                            selectedIds.size }})</text>
                    </button>
                </view>
            </view>
            <view class="safe-area-bottom"></view>
        </view>

        <!-- 存入画板底部抽屉弹窗 -->
        <popup-board-select ref="boardSelectPopup" @saved="onBoardBatchSaved" @created="onBoardBatchSaved" />

        <!-- 新建画板输入对话框 -->
        <uni-popup ref="createBoardDialogRef" type="dialog">
            <uni-popup-dialog mode="input" :title="t('board.createBoard')" :placeholder="t('board.namePlaceholder')"
                :cancel-text="t('common.cancel')" :confirm-text="t('common.confirm')"
                @confirm="handleCreateBoardConfirm">
            </uni-popup-dialog>
        </uni-popup>

        <!-- 确认对话框 -->
        <popup-navigation-dialog ref="dialogRef" :title="dialogTitle" :description="dialogDesc"
            @confirm="onConfirmDialog" />

        <!-- 回到顶部浮动按钮 -->
        <fab-back-top :show="showBackTop && !isSelectMode" @click="scrollToTop" />
    </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTranslateParams } from '@/utils/i18n.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useAppStore } from '@/stores/app.js';
import {
    apiGetActions,
    apiPostActions,
    apiGetBoards,
    apiCreateBoard,
    apiDeleteBoard,
    apiGetBoardWalls,
    apiAddBoardWalls,
    apiDelBoardWalls,
    apiSetBoardRotate,
} from '@/api/wallpaper.js';
import { handlePicUrl, gotoHome } from '@/utils/common.js';
import { getStatusBarHeight } from '@/utils/layout.js';

const { t, tp } = useTranslateParams();
const settingsStore = useSettingsStore();
const appStore = useAppStore();

const statusBarHeight = ref(getStatusBarHeight() || 0);

// Tab 状态：'all' 全部收藏 | 'boards' 灵感画板
const activeTab = ref('all');
const currentBoard = ref(null);

// 画板列表数据
const boardsList = ref([]);
const isLoadingBoards = ref(false);
const boardSelectPopup = ref(null);
const createBoardDialogRef = ref(null);

// 壁纸瀑布流数据与分页
const wallpaperList = ref([]);
const leftCol = ref([]);
const rightCol = ref([]);
let leftHeight = 0;
let rightHeight = 0;

const pageNum = ref(1);
const pageSize = 20;
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

// 通用确认弹窗
const dialogRef = ref(null);
const dialogTitle = ref('');
const dialogDesc = ref('');
const dialogActionType = ref(''); // 'unfavorite_single' | 'unfavorite_batch' | 'remove_wall_board' | 'delete_board'
const pendingItem = ref(null);

const isAllSelected = computed(() => {
    return wallpaperList.value.length > 0 && selectedIds.value.size === wallpaperList.value.length;
});

onMounted(() => {
    fetchFavoriteList(true);
    fetchBoardsList();
});

const switchTab = (tab) => {
    if (activeTab.value === tab) return;
    activeTab.value = tab;
    currentBoard.value = null;
    isSelectMode.value = false;
    selectedIds.value.clear();

    if (tab === 'all') {
        fetchFavoriteList(true);
    } else {
        fetchBoardsList();
    }
};

const handleBack = () => {
    if (currentBoard.value) {
        closeBoardDetail();
        return;
    }
    uni.navigateBack();
};

const closeBoardDetail = () => {
    currentBoard.value = null;
    isSelectMode.value = false;
    selectedIds.value.clear();
    fetchBoardsList();
};

const fetchBoardsList = async () => {
    isLoadingBoards.value = true;
    try {
        const res = await apiGetBoards();
        if (res?.data && Array.isArray(res.data)) {
            boardsList.value = res.data;
        }
    } catch (e) {
        console.error('Failed to fetch boards', e);
    } finally {
        isLoadingBoards.value = false;
        isRefreshing.value = false;
    }
};

const onRefreshBoards = () => {
    isRefreshing.value = true;
    fetchBoardsList();
};

const openCreateBoardDialog = () => {
    createBoardDialogRef.value?.open();
};

const handleCreateBoardConfirm = async (name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) {
        uni.showToast({ title: t('board.nameRequired'), icon: 'none' });
        return;
    }
    try {
        await apiCreateBoard({ name: trimmed });
        uni.showToast({ title: t('board.createSuccess'), icon: 'none' });
        fetchBoardsList();
    } catch (e) {
        uni.showToast({ title: t('board.createFailed'), icon: 'none' });
    }
};

const handleBoardClick = (board) => {
    currentBoard.value = board;
    isSelectMode.value = false;
    selectedIds.value.clear();
    fetchBoardWallpapers(true);
};

const toggleBoardRotate = async () => {
    if (!currentBoard.value) return;
    try {
        const res = await apiSetBoardRotate(currentBoard.value.id);
        if (res?.data) {
            currentBoard.value.is_auto_rotate = res.data.is_auto_rotate;
            uni.showToast({
                title: res.data.is_auto_rotate ? t('board.setAsRotate') : t('board.cancelRotate'),
                icon: 'none',
            });
        }
    } catch (e) {
        uni.showToast({ title: t('common.failed'), icon: 'none' });
    }
};

const handleDeleteCurrentBoard = () => {
    if (!currentBoard.value) return;
    dialogTitle.value = t('board.deleteConfirmTitle');
    dialogDesc.value = t('board.deleteConfirmDesc');
    dialogActionType.value = 'delete_board';
    dialogRef.value?.open();
};

// 分发瀑布流
const getItemVirtualHeight = (item) => {
    if (item.renderedHeight) return item.renderedHeight;
    const w = Number(item.width) || 300;
    const h = Number(item.height) || 533;
    const ratio = Math.max(1.1, Math.min(2.1, h / w));
    return ratio * 100;
};

const redistributeColumns = () => {
    const lCol = [];
    const rCol = [];
    let lH = 0;
    let rH = 0;

    wallpaperList.value.forEach((item) => {
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

const appendItemsToColumns = (newItems) => {
    newItems.forEach((item) => {
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

const onImageLoad = (item, e) => {
    item.loaded = true;
    if (e?.detail?.width && e?.detail?.height) {
        const ratio = e.detail.height / e.detail.width;
        item.renderedHeight = Math.max(1.1, Math.min(2.1, ratio)) * 100;
    }
};

// 拉取全部收藏列表
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
        const formatted = rows.map((item) => ({
            ...handlePicUrl(item),
            loaded: false,
            is_deleting: false,
        }));

        if (isRefresh || pageNum.value === 1) {
            wallpaperList.value = formatted;
            redistributeColumns();
        } else {
            appendItemsToColumns(formatted);
        }

        totalCount.value = res?.total || rows.length;
        if (rows.length < pageSize) {
            noMoreData.value = true;
        } else {
            pageNum.value++;
        }
    } catch (e) {
        console.error('Failed to fetch favorites', e);
    } finally {
        isLoading.value = false;
        isRefreshing.value = false;
    }
};

// 拉取指定画板内壁纸
const fetchBoardWallpapers = async (isRefresh = false) => {
    if (!currentBoard.value) return;
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
        const res = await apiGetBoardWalls(currentBoard.value.id, {
            pageNum: pageNum.value,
            pageSize: pageSize,
        });

        const rows = Array.isArray(res?.data) ? res.data : [];
        const formatted = rows.map((item) => ({
            ...handlePicUrl(item),
            loaded: false,
            is_deleting: false,
        }));

        if (isRefresh || pageNum.value === 1) {
            wallpaperList.value = formatted;
            redistributeColumns();
        } else {
            appendItemsToColumns(formatted);
        }

        totalCount.value = res?.total || rows.length;
        if (rows.length < pageSize) {
            noMoreData.value = true;
        } else {
            pageNum.value++;
        }
    } catch (e) {
        console.error('Failed to fetch board wallpapers', e);
    } finally {
        isLoading.value = false;
        isRefreshing.value = false;
    }
};

const onRefresh = () => {
    isRefreshing.value = true;
    if (currentBoard.value) {
        fetchBoardWallpapers(true);
    } else {
        fetchFavoriteList(true);
    }
};

const onLoadMore = () => {
    if (currentBoard.value) {
        fetchBoardWallpapers(false);
    } else {
        fetchFavoriteList(false);
    }
};

const onScroll = (e) => {
    const st = e.detail.scrollTop;
    oldScrollTop.value = st;
    showBackTop.value = st > 400;
};

const scrollToTop = () => {
    scrollTop.value = oldScrollTop.value;
    setTimeout(() => {
        scrollTop.value = 0;
    }, 20);
};

const toggleSelectMode = () => {
    isSelectMode.value = !isSelectMode.value;
    if (!isSelectMode.value) {
        selectedIds.value.clear();
    }
};

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedIds.value.clear();
    } else {
        wallpaperList.value.forEach((item) => selectedIds.value.add(item.id));
    }
};

const handleCardClick = (item) => {
    if (isSelectMode.value) {
        if (selectedIds.value.has(item.id)) {
            selectedIds.value.delete(item.id);
        } else {
            selectedIds.value.add(item.id);
        }
        return;
    }

    appStore.classList = wallpaperList.value;
    uni.navigateTo({
        url: `/pages/app/preview?id=${item.id}&type=favorite`,
    });
};

const handleCardLongPress = (item) => {
    if (!isSelectMode.value) {
        isSelectMode.value = true;
        selectedIds.value.add(item.id);
    }
};

// 单张操作
const handleSingleRemove = (item) => {
    pendingItem.value = item;
    if (currentBoard.value) {
        dialogTitle.value = t('board.removeFromBoard');
        dialogDesc.value = t('board.removeFromBoard');
        dialogActionType.value = 'remove_wall_board';
    } else {
        dialogTitle.value = t('favorite.unfavoriteTitle');
        dialogDesc.value = t('favorite.unfavoriteConfirmSingle');
        dialogActionType.value = 'unfavorite_single';
    }
    dialogRef.value?.open();
};

// 批量存入画板
const handleBatchAddToBoard = () => {
    if (selectedIds.value.size === 0) return;
    boardSelectPopup.value?.open(Array.from(selectedIds.value));
};

const onBoardBatchSaved = () => {
    isSelectMode.value = false;
    selectedIds.value.clear();
    fetchBoardsList();
};

// 批量删除/移除
const handleBatchAction = () => {
    if (selectedIds.value.size === 0) return;
    if (currentBoard.value) {
        dialogTitle.value = t('board.removeFromBoard');
        dialogDesc.value = tp('board.removeFromBoard', { count: selectedIds.value.size });
        dialogActionType.value = 'remove_wall_board_batch';
    } else {
        dialogTitle.value = t('favorite.unfavoriteTitle');
        dialogDesc.value = tp('favorite.unfavoriteConfirmBatch', { count: selectedIds.value.size });
        dialogActionType.value = 'unfavorite_batch';
    }
    dialogRef.value?.open();
};

const onConfirmDialog = async () => {
    dialogRef.value?.close();

    if (dialogActionType.value === 'delete_board') {
        try {
            await apiDeleteBoard(currentBoard.value.id);
            uni.showToast({ title: t('common.deleted'), icon: 'none' });
            closeBoardDetail();
        } catch (e) {
            uni.showToast({ title: t('common.failed'), icon: 'none' });
        }
        return;
    }

    if (dialogActionType.value === 'remove_wall_board' && pendingItem.value) {
        try {
            await apiDelBoardWalls(currentBoard.value.id, { wall_id: pendingItem.value.id });
            wallpaperList.value = wallpaperList.value.filter((w) => w.id !== pendingItem.value.id);
            redistributeColumns();
            uni.showToast({ title: t('board.removeSuccess'), icon: 'none' });
        } catch (e) {
            uni.showToast({ title: t('common.failed'), icon: 'none' });
        }
        return;
    }

    if (dialogActionType.value === 'remove_wall_board_batch') {
        try {
            const targetIds = Array.from(selectedIds.value);
            await apiDelBoardWalls(currentBoard.value.id, { wall_ids: targetIds });
            wallpaperList.value = wallpaperList.value.filter((w) => !selectedIds.value.has(w.id));
            redistributeColumns();
            selectedIds.value.clear();
            isSelectMode.value = false;
            uni.showToast({ title: t('board.removeSuccess'), icon: 'none' });
        } catch (e) {
            uni.showToast({ title: t('common.failed'), icon: 'none' });
        }
        return;
    }

    if (dialogActionType.value === 'unfavorite_single' && pendingItem.value) {
        try {
            await apiPostActions({
                wall_id: pendingItem.value.id,
                action_key: 'favorite',
                action_value: 0,
            });
            wallpaperList.value = wallpaperList.value.filter((w) => w.id !== pendingItem.value.id);
            redistributeColumns();
            uni.showToast({ title: t('favorite.unfavoriteSuccess'), icon: 'none' });
        } catch (e) {
            uni.showToast({ title: t('common.failed'), icon: 'none' });
        }
        return;
    }

    if (dialogActionType.value === 'unfavorite_batch') {
        try {
            for (const wid of selectedIds.value) {
                await apiPostActions({
                    wall_id: wid,
                    action_key: 'favorite',
                    action_value: 0,
                });
            }
            wallpaperList.value = wallpaperList.value.filter((w) => !selectedIds.value.has(w.id));
            redistributeColumns();
            selectedIds.value.clear();
            isSelectMode.value = false;
            uni.showToast({ title: t('favorite.unfavoriteSuccess'), icon: 'none' });
        } catch (e) {
            uni.showToast({ title: t('common.failed'), icon: 'none' });
        }
    }
};
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: #f8fafc;
    display: flex;
    flex-direction: column;

    &.theme-dark {
        background: #0f172a;
    }
}

.gallery-header {
    background: #ffffff;
    border-bottom: 1rpx solid #e2e8f0;
    position: sticky;
    top: 0;
    z-index: 100;

    .theme-dark & {
        background: #1e293b;
        border-color: #334155;
    }
}

.nav-bar {
    height: 88rpx;
    display: flex;
    align-items: center;
    padding: 0 24rpx;

    .left-section {
        display: flex;
        align-items: center;
        gap: 20rpx;
        flex: 1;
    }

    .back-btn {
        width: 60rpx;
        height: 60rpx;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .header-titles {
        display: flex;
        flex-direction: column;

        .main-title {
            font-size: 32rpx;
            font-weight: 700;
            color: #0f172a;

            .theme-dark & {
                color: #f8fafc;
            }
        }

        .sub-title {
            font-size: 22rpx;
            color: #64748b;

            .theme-dark & {
                color: #94a3b8;
            }
        }
    }
}

.segment-tabs {
    display: flex;
    align-items: center;
    background: #f1f5f9;
    padding: 6rpx;
    border-radius: 36rpx;

    .theme-dark & {
        background: #0f172a;
    }

    .segment-pill {
        padding: 10rpx 28rpx;
        border-radius: 30rpx;
        font-size: 26rpx;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s ease;

        .theme-dark & {
            color: #94a3b8;
        }

        &.is-active {
            background: #ffffff;
            color: #0f172a;
            box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);

            .theme-dark & {
                background: #334155;
                color: #f8fafc;
            }
        }
    }
}

.content-wrapper {
    flex: 1;
    height: calc(100vh - 180rpx);
}

.gallery-scroll {
    height: 100%;
}

.boards-body {
    padding: 24rpx;
}

.boards-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;

    .toolbar-title {
        font-size: 30rpx;
        font-weight: 700;
        color: #0f172a;

        .theme-dark & {
            color: #f8fafc;
        }
    }

    .create-board-btn {
        display: flex;
        align-items: center;
        gap: 10rpx;
        height: 64rpx;
        line-height: 64rpx;
        padding: 0 28rpx;
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        box-shadow: 0 6rpx 18rpx rgba(79, 70, 229, 0.35);
        color: #ffffff;
        border-radius: 32rpx;
        font-size: 26rpx;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

        &:active {
            transform: scale(0.96);
            opacity: 0.9;
        }
    }
}

.boards-grid {
    display: flex;
    flex-direction: column;
    gap: 28rpx;
}

.gallery-body {
    padding: 24rpx 24rpx calc(140rpx + env(safe-area-inset-bottom)) 24rpx;
}

.gallery-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;

    .toolbar-count {
        font-size: 24rpx;
        color: #64748b;
        font-weight: 500;

        .theme-dark & {
            color: #94a3b8;
        }
    }

    .toolbar-hint {
        font-size: 24rpx;
        color: #3b82f6;
        font-weight: 600;
    }

    .toolbar-right {
        display: flex;
        align-items: center;
        gap: 16rpx;
    }

    .rotate-toggle-pill {
        display: flex;
        align-items: center;
        gap: 8rpx;
        padding: 8rpx 20rpx;
        border-radius: 30rpx;
        background: #e2e8f0;
        font-size: 22rpx;
        font-weight: 600;
        color: #475569;
        cursor: pointer;

        .theme-dark & {
            background: #334155;
            color: #cbd5e1;
        }

        &.is-active {
            background: #2563eb;
            color: #ffffff;
        }
    }

    .delete-board-pill {
        width: 56rpx;
        height: 56rpx;
        border-radius: 50%;
        background: rgba(239, 68, 68, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    .manage-pill-btn {
        padding: 10rpx 24rpx;
        border-radius: 30rpx;
        background: #f1f5f9;
        font-size: 24rpx;
        font-weight: 600;
        color: #475569;
        cursor: pointer;

        .theme-dark & {
            background: #334155;
            color: #cbd5e1;
        }

        &.is-active {
            background: #0f172a;
            color: #ffffff;

            .theme-dark & {
                background: #f8fafc;
                color: #0f172a;
            }
        }
    }
}

.waterfall-layout {
    display: flex;
    gap: 20rpx;
}

.waterfall-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20rpx;
}

.wf-card {
    position: relative;
    border-radius: 24rpx;
    overflow: hidden;
    background: #e2e8f0;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);

    .theme-dark & {
        background: #1e293b;
    }

    .card-img {
        width: 100%;
        display: block;
        transition: opacity 0.3s ease;
        opacity: 0;

        &.is-loaded {
            opacity: 1;
        }
    }

    .heart-badge {
        position: absolute;
        top: 14rpx;
        right: 14rpx;
        width: 52rpx;
        height: 52rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);

        .theme-dark & {
            background: rgba(15, 23, 42, 0.8);
        }
    }

    .select-badge {
        position: absolute;
        top: 14rpx;
        right: 14rpx;
        width: 44rpx;
        height: 44rpx;
        border-radius: 50%;
        border: 3rpx solid #ffffff;
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;

        &.is-checked {
            background: #28b389;
            border-color: #28b389;
        }
    }
}

.batch-bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1rpx solid rgba(226, 232, 240, 0.8);
    box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.08);
    z-index: 80;
    padding-bottom: 30rpx;

    .theme-dark & {
        background: rgba(30, 41, 59, 0.96);
        border-color: rgba(51, 65, 85, 0.8);
    }

    .batch-bar-content {
        height: 120rpx;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 32rpx;
    }

    .select-all-btn {
        display: flex;
        align-items: center;
        gap: 14rpx;
        font-size: 28rpx;
        font-weight: 600;
        color: #475569;
        cursor: pointer;

        .theme-dark & {
            color: #cbd5e1;
        }

        .checkbox-circle {
            width: 40rpx;
            height: 40rpx;
            border-radius: 50%;
            border: 3rpx solid #cbd5e1;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;

            .theme-dark & {
                border-color: #475569;
            }

            &.is-checked {
                background: #4f46e5;
                border-color: #4f46e5;
            }
        }
    }

    .batch-actions-right {
        display: flex;
        align-items: center;
        gap: 16rpx;
    }

    .batch-add-board-btn {
        height: 76rpx;
        line-height: 76rpx;
        padding: 0 32rpx;
        border-radius: 38rpx;
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        box-shadow: 0 6rpx 20rpx rgba(79, 70, 229, 0.35);
        color: #ffffff;
        font-size: 26rpx;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10rpx;
        border: none;
        outline: none;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

        &::after {
            border: none;
        }

        &:active:not(:disabled) {
            transform: scale(0.96);
            opacity: 0.9;
        }

        &:disabled {
            opacity: 0.45;
            box-shadow: none;
            cursor: not-allowed;
        }
    }

    .batch-delete-btn {
        height: 76rpx;
        line-height: 76rpx;
        padding: 0 32rpx;
        border-radius: 38rpx;
        background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
        box-shadow: 0 6rpx 20rpx rgba(225, 29, 72, 0.35);
        color: #ffffff;
        font-size: 26rpx;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10rpx;
        border: none;
        outline: none;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

        &::after {
            border: none;
        }

        &:active:not(:disabled) {
            transform: scale(0.96);
            opacity: 0.9;
        }

        &:disabled {
            opacity: 0.45;
            box-shadow: none;
            cursor: not-allowed;
        }
    }
}

.list-footer {
    padding: 32rpx 0;
    text-align: center;

    .loading-more {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12rpx;
    }

    .footer-text,
    .no-more-text {
        font-size: 22rpx;
        color: #94a3b8;
    }
}
</style>
