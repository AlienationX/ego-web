<template>
    <uni-popup ref="popup" type="bottom" :safe-area="false" :z-index="999" @change="onPopupChange">
        <view class="board-select-sheet" :class="{ 'theme-dark': settingsStore.isDark }">
            <!-- 弹窗顶部栏 -->
            <view class="sheet-header">
                <text class="sheet-title">{{ t('board.selectBoardTitle') }}</text>
                <view class="close-btn" @click="close">
                    <mdi-icon path="/static/icons/close.svg" size="20px"
                        :color="settingsStore.isDark ? '#94a3b8' : '#64748b'"></mdi-icon>
                </view>
            </view>

            <!-- 新建画板快捷条 -->
            <view class="create-bar" @click="openCreateDialog">
                <view class="create-icon">
                    <mdi-icon path="/static/icons/plus.svg" size="20px" color="#ffffff"></mdi-icon>
                </view>
                <text class="create-text">{{ t('board.createBoard') }}</text>
                <mdi-icon path="/static/icons/chevron-right.svg" size="18px"
                    :color="settingsStore.isDark ? '#4b5563' : '#94a3b8'"></mdi-icon>
            </view>

            <!-- 画板列表 -->
            <scroll-view scroll-y class="board-list" :show-scrollbar="false">
                <view v-if="loading" class="board-loading">
                    <uni-load-more status="loading" />
                </view>

                <view v-else-if="boards.length === 0" class="empty-boards">
                    <mdi-icon path="/static/icons/folder-plus-outline.svg" size="36px"
                        :color="settingsStore.isDark ? '#4b5563' : '#cbd5e1'"></mdi-icon>
                    <text class="empty-text">{{ t('board.noBoardsYet') }}</text>
                </view>

                <view v-else class="board-items">
                    <view class="board-item" v-for="item in boards" :key="item.id" @click="selectBoard(item)">
                        <view class="board-thumb">
                            <image v-if="item.preview_images && item.preview_images[0]" :src="formatImgUrl(item.preview_images[0])"
                                mode="aspectFill"></image>
                            <mdi-icon v-else path="/static/icons/image-outline.svg" size="20px"
                                :color="settingsStore.isDark ? '#4b5563' : '#cbd5e1'"></mdi-icon>
                        </view>
                        <view class="board-detail">
                            <text class="board-item-name">{{ item.name }}</text>
                            <text class="board-item-meta">{{ tp('board.wallCount', { count: item.items_count || 0 })
                            }}</text>
                        </view>
                        <view class="select-action">
                            <view class="save-btn">{{ targetWallIds.length ? t('board.save') : t('common.confirm') }}</view>
                        </view>
                    </view>
                </view>
            </scroll-view>
        </view>
    </uni-popup>

    <!-- 新建画板输入对话框 -->
    <uni-popup ref="createDialog" type="dialog">
        <uni-popup-dialog mode="input" :title="t('board.createBoard')" :placeholder="t('board.namePlaceholder')"
            :cancel-text="t('common.cancel')" :confirm-text="t('common.confirm')" @confirm="handleCreateConfirm">
        </uni-popup-dialog>
    </uni-popup>
</template>

<script setup>
import { ref } from 'vue';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserStore } from '@/stores/user.js';
import { useTranslateParams } from '@/utils/i18n.js';
import { PICS_BASE_URL } from '@/common/config.js';
import { apiGetBoards, apiCreateBoard, apiAddBoardWalls } from '@/api/wallpaper.js';

const emit = defineEmits(['saved', 'created']);

const settingsStore = useSettingsStore();
const userStore = useUserStore();
const { t, tp } = useTranslateParams();

const formatImgUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${PICS_BASE_URL}/${url.replace(/^\/+/, '')}`;
};

const popup = ref(null);
const createDialog = ref(null);
const boards = ref([]);
const loading = ref(false);
const targetWallIds = ref([]);

const open = async (wallIds = []) => {
    targetWallIds.value = Array.isArray(wallIds) ? wallIds : (wallIds ? [wallIds] : []);
    popup.value?.open();
    await loadBoards();
};

const close = () => {
    popup.value?.close();
};

const onPopupChange = (e) => {
    if (!e.show) {
        targetWallIds.value = [];
    }
};

const loadBoards = async () => {
    if (!userStore.isLoggedIn && !userStore.userinfo?.id) {
        boards.value = [];
        return;
    }
    loading.value = true;
    try {
        const res = await apiGetBoards();
        if (res?.data && Array.isArray(res.data)) {
            boards.value = res.data;
        }
    } catch (e) {
        console.error('Failed to load boards', e);
    } finally {
        loading.value = false;
    }
};

const selectBoard = async (board) => {
    if (!targetWallIds.value.length) {
        emit('saved', { board, wallIds: [] });
        close();
        return;
    }
    try {
        uni.showLoading({ title: t('common.loading') });
        await apiAddBoardWalls(board.id, {
            wall_ids: targetWallIds.value,
        });
        uni.hideLoading();
        uni.showToast({
            title: t('board.saveSuccess'),
            icon: 'none',
        });
        emit('saved', { board, wallIds: targetWallIds.value });
        close();
    } catch (e) {
        uni.hideLoading();
        uni.showToast({
            title: t('board.saveFailed'),
            icon: 'none',
        });
    }
};

const openCreateDialog = () => {
    if (!userStore.isLoggedIn && !userStore.userinfo?.id) {
        uni.showToast({ title: t('common.needLogin'), icon: 'none' });
        setTimeout(() => {
            uni.navigateTo({ url: '/pages/auth/signin' });
        }, 300);
        return;
    }
    createDialog.value?.open();
};

const handleCreateConfirm = async (name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) {
        uni.showToast({ title: t('board.nameRequired'), icon: 'none' });
        return;
    }
    try {
        uni.showLoading({ title: t('common.loading') });
        const res = await apiCreateBoard({
            name: trimmed,
            wall_ids: targetWallIds.value,
        });
        uni.hideLoading();
        uni.showToast({
            title: t('board.createSuccess'),
            icon: 'none',
        });
        emit('created', res?.data);
        if (!targetWallIds.value.length && res?.data) {
            emit('saved', { board: res.data, wallIds: [] });
        }
        close();
    } catch (e) {
        uni.hideLoading();
        uni.showToast({
            title: t('board.createFailed'),
            icon: 'none',
        });
    }
};

defineExpose({
    open,
    close,
});
</script>

<style lang="scss" scoped>
.board-select-sheet {
    background: #ffffff;
    border-radius: 36rpx 36rpx 0 0;
    padding: 32rpx 32rpx calc(48rpx + env(safe-area-inset-bottom));
    max-height: 75vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &.theme-dark {
        background: #1e293b;
    }
}

.sheet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28rpx;

    .sheet-title {
        font-size: 32rpx;
        font-weight: 700;
        color: #0f172a;

        .theme-dark & {
            color: #f8fafc;
        }
    }

    .close-btn {
        width: 60rpx;
        height: 60rpx;
        display: flex;
        align-items: center;
        justify-content: center;
    }
}

.create-bar {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 20rpx 24rpx;
    background: #f1f5f9;
    border-radius: 20rpx;
    margin-bottom: 24rpx;
    cursor: pointer;

    .theme-dark & {
        background: #334155;
    }

    .create-icon {
        width: 56rpx;
        height: 56rpx;
        border-radius: 50%;
        background: #4f46e5;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .create-text {
        flex: 1;
        font-size: 28rpx;
        font-weight: 600;
        color: #0f172a;

        .theme-dark & {
            color: #f8fafc;
        }
    }
}

.board-list {
    max-height: 50vh;
}

.board-loading,
.empty-boards {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60rpx 0;
    gap: 16rpx;

    .empty-text {
        font-size: 26rpx;
        color: #94a3b8;
    }
}

.board-items {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.board-item {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 16rpx 20rpx;
    border-radius: 20rpx;
    background: #f8fafc;
    cursor: pointer;
    transition: background 0.2s ease;

    .theme-dark & {
        background: #0f172a;
    }

    &:active {
        background: #e2e8f0;

        .theme-dark & {
            background: #334155;
        }
    }

    .board-thumb {
        width: 88rpx;
        height: 88rpx;
        border-radius: 16rpx;
        overflow: hidden;
        background: #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: center;

        .theme-dark & {
            background: #1e293b;
        }

        image {
            width: 100%;
            height: 100%;
        }
    }

    .board-detail {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4rpx;

        .board-item-name {
            font-size: 28rpx;
            font-weight: 600;
            color: #0f172a;

            .theme-dark & {
                color: #f8fafc;
            }
        }

        .board-item-meta {
            font-size: 22rpx;
            color: #64748b;

            .theme-dark & {
                color: #94a3b8;
            }
        }
    }

    .save-btn {
        padding: 10rpx 24rpx;
        border-radius: 30rpx;
        background: #4f46e5;
        box-shadow: 0 4rpx 12rpx rgba(79, 70, 229, 0.3);
        color: #ffffff;
        font-size: 24rpx;
        font-weight: 600;
    }
}
</style>
