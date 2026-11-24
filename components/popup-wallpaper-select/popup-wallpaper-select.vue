<template>
    <uni-popup ref="popup" type="bottom" :safe-area="false" :z-index="999" @change="onPopupChange">
        <view class="wallpaper-select-sheet" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
            <!-- 顶部操作栏 -->
            <view class="sheet-header">
                <view class="sheet-title-wrap">
                    <text class="sheet-title">{{ titleText }}</text>
                    <text class="sheet-subtitle">仅支持从“我的收藏/画板”或“手机相册”选取</text>
                </view>
                <view class="close-btn" @click="close">
                    <mdi-icon path="/static/icons/close.svg" size="20px"
                        :color="settingsStore.isDark ? '#94a3b8' : '#64748b'"></mdi-icon>
                </view>
            </view>

            <!-- 快捷入口卡片：从手机相册选取 -->
            <view class="album-picker-card" hover-class="album-picker-card--active" @click="handlePickFromAlbum">
                <view class="album-icon-circle">
                    <mdi-icon path="/static/icons/folder-multiple-image.svg" size="22px" color="#ffffff"></mdi-icon>
                </view>
                <view class="album-info">
                    <text class="album-title">从手机相册选取</text>
                    <text class="album-desc">直接选择手机相册中的照片作为壁纸</text>
                </view>
                <mdi-icon path="/static/icons/chevron-right.svg" size="18px"
                    :color="settingsStore.isDark ? '#4b5563' : '#94a3b8'"></mdi-icon>
            </view>

            <!-- 来源 Tab 切换 (全部收藏 vs 灵感画板) -->
            <view class="tab-segment-bar">
                <view class="tab-pill" :class="{ 'is-active': activeTab === 'favorite' }" @click="switchTab('favorite')">
                    <mdi-icon path="/static/icons/heart.svg" size="14px"
                        :color="activeTab === 'favorite' ? '#ffffff' : (settingsStore.isDark ? '#94a3b8' : '#64748b')"></mdi-icon>
                    <text class="tab-text">我的收藏</text>
                </view>
                <view class="tab-pill" :class="{ 'is-active': activeTab === 'board' }" @click="switchTab('board')">
                    <mdi-icon path="/static/icons/cards.svg" size="14px"
                        :color="activeTab === 'board' ? '#ffffff' : (settingsStore.isDark ? '#94a3b8' : '#64748b')"></mdi-icon>
                    <text class="tab-text">我的画板</text>
                </view>
            </view>

            <!-- 滚动内容区 -->
            <scroll-view scroll-y class="sheet-scroll" :show-scrollbar="false" @scrolltolower="onReachBottom">
                <!-- 1. 收藏壁纸网格视图 -->
                <view v-if="activeTab === 'favorite'" class="wall-grid-container">
                    <view v-if="loadingFav && favoriteList.length === 0" class="loading-state">
                        <uni-load-more status="loading" />
                    </view>

                    <view v-else-if="favoriteList.length === 0" class="empty-state">
                        <mdi-icon path="/static/icons/heart-outline.svg" size="36px"
                            :color="settingsStore.isDark ? '#4b5563' : '#cbd5e1'"></mdi-icon>
                        <text class="empty-text">暂无收藏壁纸，快去首页收藏几张吧</text>
                    </view>

                    <view v-else class="wall-grid">
                        <view class="wall-card" v-for="item in favoriteList" :key="item.id" @click="handleSelectWallpaper(item)">
                            <image class="wall-img" :src="item.smallPicurl || item.picurl" mode="aspectFill" lazy-load></image>
                            <view class="wall-card-overlay">
                                <text class="wall-id">#{{ item.id }}</text>
                            </view>
                        </view>
                    </view>
                    <uni-load-more v-if="favoriteList.length > 0" :status="loadingFav ? 'loading' : (noMoreFav ? 'noMore' : 'more')" />
                </view>

                <!-- 2. 画板视图 -->
                <view v-else class="board-container">
                    <!-- 场景 A：画板内壁纸列表 -->
                    <view v-if="currentSelectedBoard" class="sub-board-view">
                        <view class="sub-board-header" @click="currentSelectedBoard = null">
                            <mdi-icon path="/static/icons/arrow-left.svg" size="18px"
                                :color="settingsStore.isDark ? '#94a3b8' : '#64748b'"></mdi-icon>
                            <text class="sub-board-title">{{ currentSelectedBoard.name }}</text>
                            <text class="sub-board-back">返回画板</text>
                        </view>

                        <view v-if="loadingBoardWalls && boardWallList.length === 0" class="loading-state">
                            <uni-load-more status="loading" />
                        </view>
                        <view v-else-if="boardWallList.length === 0" class="empty-state">
                            <mdi-icon path="/static/icons/image-outline.svg" size="36px"
                                :color="settingsStore.isDark ? '#4b5563' : '#cbd5e1'"></mdi-icon>
                            <text class="empty-text">画板内暂无壁纸</text>
                        </view>
                        <view v-else class="wall-grid">
                            <view class="wall-card" v-for="item in boardWallList" :key="item.id" @click="handleSelectWallpaper(item)">
                                <image class="wall-img" :src="item.smallPicurl || item.picurl" mode="aspectFill" lazy-load></image>
                                <view class="wall-card-overlay">
                                    <text class="wall-id">#{{ item.id }}</text>
                                </view>
                            </view>
                        </view>
                    </view>

                    <!-- 场景 B：画板列表 -->
                    <view v-else class="board-list-view">
                        <view v-if="loadingBoards && boardsList.length === 0" class="loading-state">
                            <uni-load-more status="loading" />
                        </view>
                        <view v-else-if="boardsList.length === 0" class="empty-state">
                            <mdi-icon path="/static/icons/folder-plus-outline.svg" size="36px"
                                :color="settingsStore.isDark ? '#4b5563' : '#cbd5e1'"></mdi-icon>
                            <text class="empty-text">您还没有创建画板</text>
                        </view>
                        <view v-else class="board-items-wrap">
                            <view class="board-item-pill" v-for="b in boardsList" :key="b.id" @click="handlePickBoard(b)">
                                <view class="board-thumb">
                                    <image v-if="b.preview_images && b.preview_images[0]" class="board-thumb-img"
                                        :src="formatThumbUrl(b.preview_images[0])" mode="aspectFill"></image>
                                    <mdi-icon v-else path="/static/icons/image-outline.svg" size="20px"
                                        :color="settingsStore.isDark ? '#4b5563' : '#cbd5e1'"></mdi-icon>
                                </view>
                                <view class="board-item-info">
                                    <text class="board-item-title">{{ b.name }}</text>
                                    <text class="board-item-count">{{ b.items_count || 0 }} 张壁纸</text>
                                </view>
                                <mdi-icon path="/static/icons/chevron-right.svg" size="18px"
                                    :color="settingsStore.isDark ? '#4b5563' : '#94a3b8'"></mdi-icon>
                            </view>
                        </view>
                    </view>
                </view>
            </scroll-view>
        </view>
    </uni-popup>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useSettingsStore } from '@/stores/settings.js';
import { apiGetActions, apiGetBoards, apiGetBoardWalls } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { PICS_BASE_URL } from '@/common/config.js';

const emit = defineEmits(['selected']);

const settingsStore = useSettingsStore();

const popup = ref(null);
const targetSlot = ref('light'); // 'light' | 'dark'
const activeTab = ref('favorite'); // 'favorite' | 'board'

// 收藏数据
const favoriteList = ref([]);
const favPage = ref(1);
const favPageSize = 20;
const loadingFav = ref(false);
const noMoreFav = ref(false);

// 画板数据
const boardsList = ref([]);
const loadingBoards = ref(false);
const currentSelectedBoard = ref(null);
const boardWallList = ref([]);
const loadingBoardWalls = ref(false);

const titleText = computed(() => {
    return targetSlot.value === 'light' ? '选择浅色外观壁纸' : '选择深色外观壁纸';
});

const formatThumbUrl = (url) => {
    if (!url) return '';
    let fullUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `${PICS_BASE_URL}/${url.replace(/^\/+/, '')}`;
    if (fullUrl.includes('/pics/')) {
        fullUrl = fullUrl.replace(/(\/?)pics\//, '$1thumbs/').replace(/\.[^/.]+$/, '_small.webp');
    }
    return fullUrl;
};

const open = (slot = 'light') => {
    targetSlot.value = slot;
    currentSelectedBoard.value = null;
    popup.value?.open();
    if (favoriteList.value.length === 0) {
        loadFavorites(true);
    }
    if (boardsList.value.length === 0) {
        loadBoards();
    }
};

const close = () => {
    popup.value?.close();
};

const onPopupChange = (e) => {
    if (!e.show) {
        currentSelectedBoard.value = null;
    }
};

const switchTab = (tab) => {
    activeTab.value = tab;
};

// 1. 加载收藏列表
const loadFavorites = async (isRefresh = false) => {
    if (loadingFav.value) return;
    if (isRefresh) {
        favPage.value = 1;
        noMoreFav.value = false;
        favoriteList.value = [];
    }
    if (noMoreFav.value) return;

    loadingFav.value = true;
    try {
        const res = await apiGetActions({
            action_key: 'favorite',
            pageNum: favPage.value,
            pageSize: favPageSize,
        });
        const rows = Array.isArray(res?.data) ? res.data : [];
        const formatted = rows.map((item) => handlePicUrl(item));
        favoriteList.value = isRefresh ? formatted : [...favoriteList.value, ...formatted];
        if (rows.length < favPageSize) {
            noMoreFav.value = true;
        } else {
            favPage.value++;
        }
    } catch (e) {
        console.error('Failed to load favorites', e);
    } finally {
        loadingFav.value = false;
    }
};

// 2. 加载画板列表
const loadBoards = async () => {
    if (loadingBoards.value) return;
    loadingBoards.value = true;
    try {
        const res = await apiGetBoards();
        if (Array.isArray(res?.data)) {
            boardsList.value = res.data;
        }
    } catch (e) {
        console.error('Failed to load boards', e);
    } finally {
        loadingBoards.value = false;
    }
};

// 3. 点击某个画板，加载画板内壁纸
const handlePickBoard = async (board) => {
    currentSelectedBoard.value = board;
    boardWallList.value = [];
    loadingBoardWalls.value = true;
    try {
        const res = await apiGetBoardWalls(board.id, { pageNum: 1, pageSize: 50 });
        const rows = Array.isArray(res?.data) ? res.data : [];
        boardWallList.value = rows.map((item) => handlePicUrl(item));
    } catch (e) {
        console.error('Failed to load board walls', e);
    } finally {
        loadingBoardWalls.value = false;
    }
};

// 4. 从手机相册选取
const handlePickFromAlbum = () => {
    uni.chooseImage({
        count: 1,
        sourceType: ['album'],
        sizeType: ['original'],
        success: (res) => {
            const tempFilePath = res.tempFilePaths?.[0];
            if (tempFilePath) {
                emit('selected', {
                    slot: targetSlot.value,
                    wallpaper: {
                        id: 'album_' + Date.now(),
                        url: tempFilePath,
                        thumb: tempFilePath,
                        title: '本地相册图片',
                        source: 'album',
                    },
                });
                close();
            }
        },
    });
};

// 5. 选中某张壁纸
const handleSelectWallpaper = (item) => {
    const rawUrl = item.picurl || item.url || '';
    const thumbUrl = item.smallPicurl || item.mediumPicurl || rawUrl;
    emit('selected', {
        slot: targetSlot.value,
        wallpaper: {
            id: item.id,
            url: rawUrl,
            thumb: thumbUrl,
            title: item.title || `壁纸 #${item.id}`,
            source: activeTab.value === 'board' ? 'board' : 'favorite',
        },
    });
    close();
};

const onReachBottom = () => {
    if (activeTab.value === 'favorite' && !noMoreFav.value) {
        loadFavorites(false);
    }
};

defineExpose({
    open,
    close,
});
</script>

<style lang="scss" scoped>
@import '@/common/styles/theme-variables.scss';

.wallpaper-select-sheet {
    background: var(--surface-card, #ffffff);
    border-top-left-radius: 36rpx;
    border-top-right-radius: 36rpx;
    max-height: 80vh;
    min-height: 50vh;
    display: flex;
    flex-direction: column;
    padding-bottom: env(safe-area-inset-bottom);
    transition: background-color 0.25s ease;

    &.theme-dark {
        background: #1e2430;
    }
}

.sheet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx 32rpx 20rpx;

    .sheet-title-wrap {
        display: flex;
        flex-direction: column;
        gap: 6rpx;
    }

    .sheet-title {
        font-size: 32rpx;
        font-weight: 700;
        color: var(--text-primary, #1e293b);

        .theme-dark & {
            color: #f1f5f9;
        }
    }

    .sheet-subtitle {
        font-size: 22rpx;
        color: var(--text-tertiary, #94a3b8);
    }

    .close-btn {
        width: 56rpx;
        height: 56rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(148, 163, 184, 0.15);
        cursor: pointer;
    }
}

// 快捷相册选择卡片
.album-picker-card {
    margin: 8rpx 32rpx 20rpx;
    padding: 20rpx 24rpx;
    border-radius: 20rpx;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    display: flex;
    align-items: center;
    gap: 20rpx;
    cursor: pointer;
    box-shadow: 0 4rpx 14rpx rgba(79, 70, 229, 0.25);
    transition: transform 0.18s ease;

    &--active,
    &:active {
        transform: scale(0.98);
        opacity: 0.92;
    }

    .album-icon-circle {
        width: 68rpx;
        height: 68rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .album-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4rpx;

        .album-title {
            font-size: 26rpx;
            font-weight: 700;
            color: #ffffff;
        }

        .album-desc {
            font-size: 20rpx;
            color: rgba(255, 255, 255, 0.8);
        }
    }
}

// Tab 切换条
.tab-segment-bar {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 0 32rpx 16rpx;

    .tab-pill {
        flex: 1;
        height: 60rpx;
        border-radius: 999rpx;
        background: rgba(148, 163, 184, 0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8rpx;
        cursor: pointer;
        transition: all 0.2s ease;

        .tab-text {
            font-size: 24rpx;
            font-weight: 600;
            color: var(--text-secondary, #64748b);
        }

        &.is-active {
            background: #4f46e5;

            .tab-text {
                color: #ffffff;
            }
        }
    }
}

.sheet-scroll {
    flex: 1;
    max-height: 52vh;
    padding: 0 32rpx 32rpx;
    box-sizing: border-box;
}

// 网格布局 (3 列)
.wall-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16rpx;
    padding-top: 10rpx;

    .wall-card {
        position: relative;
        aspect-ratio: 9 / 16;
        border-radius: 16rpx;
        overflow: hidden;
        background: rgba(148, 163, 184, 0.1);
        cursor: pointer;

        &:active {
            transform: scale(0.96);
        }

        .wall-img {
            width: 100%;
            height: 100%;
            display: block;
        }

        .wall-card-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 20rpx 10rpx 8rpx;
            background: linear-gradient(to top, rgba(0, 0, 0, 0.65) 0%, transparent 100%);
            display: flex;
            align-items: center;
            justify-content: center;

            .wall-id {
                font-size: 18rpx;
                color: #ffffff;
                font-weight: 600;
            }
        }
    }
}

// 画板内视图导航
.sub-board-header {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 12rpx 0 16rpx;
    cursor: pointer;

    .sub-board-title {
        font-size: 26rpx;
        font-weight: 700;
        color: var(--text-primary, #1e293b);
        flex: 1;

        .theme-dark & {
            color: #f1f5f9;
        }
    }

    .sub-board-back {
        font-size: 22rpx;
        color: #4f46e5;
    }
}

// 画板列表
.board-items-wrap {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    padding-top: 10rpx;

    .board-item-pill {
        display: flex;
        align-items: center;
        gap: 20rpx;
        padding: 16rpx 20rpx;
        border-radius: 20rpx;
        background: rgba(148, 163, 184, 0.08);
        cursor: pointer;

        .theme-dark & {
            background: rgba(255, 255, 255, 0.04);
        }

        &:active {
            opacity: 0.8;
        }

        .board-thumb {
            width: 80rpx;
            height: 80rpx;
            border-radius: 14rpx;
            background: rgba(148, 163, 184, 0.15);
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;

            .board-thumb-img {
                width: 100%;
                height: 100%;
            }
        }

        .board-item-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4rpx;

            .board-item-title {
                font-size: 26rpx;
                font-weight: 600;
                color: var(--text-primary, #1e293b);

                .theme-dark & {
                    color: #f1f5f9;
                }
            }

            .board-item-count {
                font-size: 20rpx;
                color: var(--text-tertiary, #94a3b8);
            }
        }
    }
}

.empty-state {
    padding: 60rpx 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16rpx;

    .empty-text {
        font-size: 22rpx;
        color: var(--text-tertiary, #94a3b8);
    }
}

.loading-state {
    padding: 40rpx 0;
}
</style>
