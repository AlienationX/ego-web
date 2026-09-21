<template>
    <view v-if="visible" class="image-picker-mask" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'" @click="handleClose">
        <view class="picker-panel" @click.stop>
            <!-- 头部标题与关闭 -->
            <view class="panel-header">
                <view class="panel-header__left">
                    <text class="panel-title">{{ displayTitle }}</text>
                    <text class="panel-counter">{{ currentSelected.length }}/{{ maxCount }}</text>
                </view>
                <view class="panel-close-btn" @click="handleClose">
                    <mdi-icon path="/static/icons/close.svg" size="20px" :color="settingsStore.isDark ? '#94a3b8' : '#64748b'" />
                </view>
            </view>

            <!-- 来源切换 Tab (我的收藏在前，手机相册在后) -->
            <view class="source-tabs">
                <view
                    class="source-tab-item"
                    :class="{ 'is-active': activeTab === 'favorites' }"
                    @click="activeTab = 'favorites'"
                >
                    <mdi-icon path="/static/icons/heart.svg" size="16px" :color="activeTab === 'favorites' ? '#ffffff' : (settingsStore.isDark ? '#94a3b8' : '#64748b')" />
                    <text class="tab-label">{{ t('puzzle.myFavorites') }}</text>
                </view>
                <view
                    class="source-tab-item"
                    :class="{ 'is-active': activeTab === 'album' }"
                    @click="activeTab = 'album'"
                >
                    <mdi-icon path="/static/icons/image.svg" size="16px" :color="activeTab === 'album' ? '#ffffff' : (settingsStore.isDark ? '#94a3b8' : '#64748b')" />
                    <text class="tab-label">{{ t('puzzle.localAlbum') }}</text>
                </view>
            </view>

            <!-- 主内容滚动区 -->
            <scroll-view class="picker-body" scroll-y :show-scrollbar="false">
                <!-- 1. 我的收藏选择区 (默认置于前面) -->
                <view v-if="activeTab === 'favorites'" class="favorites-content">
                    <!-- 1.1 未登录状态：提示去登录 -->
                    <view v-if="!userStore.isLoggedIn" class="empty-box">
                        <mdi-icon path="/static/icons/account-circle.svg" size="52px" :color="settingsStore.isDark ? '#475569' : '#cbd5e1'" />
                        <text class="empty-text">您还未登录，请先登录查看我的收藏</text>
                        <view class="empty-action-group">
                            <view class="empty-action-btn" @click="toLogin">
                                <text>立即登录</text>
                            </view>
                        </view>
                    </view>

                    <!-- 1.2 加载中状态 -->
                    <view v-else-if="isLoadingFavorites" class="loading-box">
                        <rotate-loading :size="32" :color="settingsStore.isDark ? '#a855f7' : '#6366f1'" />
                    </view>

                    <!-- 1.3 登录后暂无收藏：提示去收藏 -->
                    <view v-else-if="favoriteList.length === 0" class="empty-box">
                        <mdi-icon path="/static/icons/heart-broken.svg" size="52px" :color="settingsStore.isDark ? '#475569' : '#cbd5e1'" />
                        <text class="empty-text">{{ t('puzzle.noFavorites') || '您还没有收藏任何壁纸哦' }}</text>
                        <view class="empty-action-group">
                            <view class="empty-action-btn" @click="goFavorite">
                                <text>{{ $t('discover.goFavorite') || '去我的收藏' }}</text>
                            </view>
                        </view>
                    </view>

                    <!-- 1.4 收藏壁纸网格 -->
                    <view v-else class="favorites-grid">
                        <view
                            v-for="item in favoriteList"
                            :key="item.id"
                            class="fav-card"
                            :class="{ 'is-selected': isSelected(item.url) }"
                            @click="toggleSelect(item.url)"
                        >
                            <image class="fav-img" :src="item.thumbUrl || item.url" mode="aspectFill" lazy-load />
                            <view class="select-badge" :class="{ 'is-checked': isSelected(item.url) }">
                                <text v-if="isSelected(item.url)" class="badge-number">
                                    {{ singleMode ? '✓' : getSelectedIndex(item.url) }}
                                </text>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- 2. 手机相册选择区 (置于后面) -->
                <view v-else class="album-content">
                    <view class="album-trigger-card" @click="chooseFromAlbum">
                        <view class="trigger-icon-wrap">
                            <mdi-icon path="/static/icons/plus.svg" size="28px" color="#ffffff" />
                        </view>
                        <text class="trigger-title">{{ t('puzzle.openAlbum') }}</text>
                        <text class="trigger-hint">
                            {{ singleMode ? '支持选择手机相册中的高清图片' : `${t('puzzle.freeStyle')} (${maxCount - currentSelected.length} 可选)` }}
                        </text>
                    </view>

                    <!-- 相册已选中的图片预览网格 -->
                    <view v-if="albumImages.length > 0" class="album-chosen-list">
                        <text class="section-title">本地已选图片</text>
                        <view class="chosen-grid">
                            <view
                                v-for="(img, idx) in albumImages"
                                :key="'album-' + idx"
                                class="chosen-item"
                            >
                                <image class="item-img" :src="img" mode="aspectFill" />
                                <view class="item-remove-btn" @click.stop="removeImage(img)">
                                    <mdi-icon path="/static/icons/close.svg" size="14px" color="#ffffff" />
                                </view>
                            </view>
                        </view>
                    </view>
                </view>
            </scroll-view>

            <!-- 底部确认操作条 -->
            <view class="panel-bottom-bar">
                <!-- 操作按钮行 -->
                <view class="bottom-action-row">
                    <view class="counter-info">
                        <text class="selected-text">{{ selectedCountText }}</text>
                    </view>
                    <view
                        class="confirm-btn"
                        :class="{ 'is-disabled': currentSelected.length === 0 }"
                        @click="handleConfirm"
                    >
                        <text class="btn-text">{{ singleMode ? '确定选择' : t('puzzle.startPuzzle') }}</text>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useTranslateParams } from '@/utils/i18n.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserStore } from '@/stores/user.js';
import { apiGetActions } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';

const { t, tp } = useTranslateParams();
const settingsStore = useSettingsStore();
const userStore = useUserStore();

const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
    title: {
        type: String,
        default: '',
    },
    maxCount: {
        type: Number,
        default: 9,
    },
    singleMode: {
        type: Boolean,
        default: false,
    },
    initialImages: {
        type: Array,
        default: () => [],
    },
});

const emit = defineEmits(['update:visible', 'confirm', 'cancel']);

// 自定义或按模式解析标题
const displayTitle = computed(() => {
    if (props.title) return props.title;
    if (props.singleMode) {
        return '选择壁纸';
    }
    return t('puzzle.selectPhotos') || '选择照片';
});

// 默认将「我的收藏」置于前面
const activeTab = ref('favorites'); // 'favorites' | 'album'
const currentSelected = ref([]);
const albumImages = ref([]);
const favoriteList = ref([]);
const isLoadingFavorites = ref(false);

// 兼容跨端动态计算已选数量文本
const selectedCountText = computed(() => {
    return `已选 ${currentSelected.value.length}/${props.maxCount} 张`;
});

// 跳转登录
const toLogin = () => {
    handleClose();
    uni.navigateTo({ url: '/pages/auth/signin' });
};

// 跳转去收藏/浏览壁纸
const goFavorite = () => {
    handleClose();
    if (!userStore.isLoggedIn) {
        uni.navigateTo({ url: '/pages/auth/signin' });
        return;
    }
    uni.navigateTo({ url: '/pages/app/favorite' });
};

// 监听弹窗打开状态，同步初始化选中的图片
watch(
    () => props.visible,
    (val) => {
        if (val) {
            currentSelected.value = [...(props.initialImages || [])];
            albumImages.value = currentSelected.value.filter(
                (url) => !favoriteList.value.some((fav) => fav.url === url)
            );
            if (activeTab.value === 'favorites' && userStore.isLoggedIn && favoriteList.value.length === 0) {
                loadFavorites();
            }
        }
    }
);

watch(
    () => activeTab.value,
    (tab) => {
        if (tab === 'favorites' && userStore.isLoggedIn && favoriteList.value.length === 0) {
            loadFavorites();
        }
    }
);

watch(
    () => userStore.isLoggedIn,
    (loggedIn) => {
        if (loggedIn && activeTab.value === 'favorites') {
            loadFavorites();
        }
    }
);

// 加载收藏列表
const loadFavorites = async () => {
    if (!userStore.isLoggedIn) {
        favoriteList.value = [];
        return;
    }
    isLoadingFavorites.value = true;
    try {
        const res = await apiGetActions({
            action_key: 'favorite',
            pageNum: 1,
            pageSize: 50,
        });
        const rows = Array.isArray(res?.data) ? res.data : [];
        favoriteList.value = rows.map((item) => {
            const parsed = handlePicUrl(item);
            return {
                id: item.id || item._id,
                // 用于界面网格卡片缩略图预览（轻量极速加载）
                thumbUrl: parsed.smallPicurl || parsed.picurl,
                // 用于实际拼图画布与高清合成的原图 URL（优先使用高清无损大图，兼容性更佳）
                url: parsed.picurl || parsed.smallPicurl,
            };
        });
    } catch (e) {
        console.warn('获取收藏壁纸失败:', e);
    } finally {
        isLoadingFavorites.value = false;
    }
};

// 从本地相册选择
const chooseFromAlbum = () => {
    const remain = props.singleMode ? 1 : props.maxCount - currentSelected.value.length;
    if (remain <= 0) {
        uni.showToast({
            title: t('puzzle.limitReached'),
            icon: 'none',
        });
        return;
    }

    uni.chooseImage({
        count: remain,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
            const paths = res.tempFilePaths || [];
            if (props.singleMode) {
                currentSelected.value = paths.slice(0, 1);
                albumImages.value = currentSelected.value;
            } else {
                paths.forEach((p) => {
                    if (!currentSelected.value.includes(p) && currentSelected.value.length < props.maxCount) {
                        currentSelected.value.push(p);
                        albumImages.value.push(p);
                    }
                });
            }
        },
        fail: (err) => {
            if (err.errMsg && !err.errMsg.includes('cancel')) {
                uni.showToast({
                    title: '选择相册失败',
                    icon: 'none',
                });
            }
        },
    });
};

// 收藏网格选中状态判断
const isSelected = (url) => {
    return currentSelected.value.includes(url);
};

// 获取选中序号
const getSelectedIndex = (url) => {
    const idx = currentSelected.value.indexOf(url);
    return idx >= 0 ? idx + 1 : '';
};

// 切换选择
const toggleSelect = (url) => {
    if (props.singleMode) {
        currentSelected.value = [url];
        return;
    }

    const idx = currentSelected.value.indexOf(url);
    if (idx >= 0) {
        currentSelected.value.splice(idx, 1);
    } else {
        if (currentSelected.value.length >= props.maxCount) {
            uni.showToast({
                title: t('puzzle.limitReached'),
                icon: 'none',
            });
            return;
        }
        currentSelected.value.push(url);
    }
};

// 移除某张图片
const removeImage = (url) => {
    const idx = currentSelected.value.indexOf(url);
    if (idx >= 0) {
        currentSelected.value.splice(idx, 1);
    }
    const aIdx = albumImages.value.indexOf(url);
    if (aIdx >= 0) {
        albumImages.value.splice(aIdx, 1);
    }
};

// 确认提交
const handleConfirm = () => {
    if (currentSelected.value.length === 0) {
        uni.showToast({
            title: t('puzzle.atLeastOne'),
            icon: 'none',
        });
        return;
    }
    emit('confirm', [...currentSelected.value]);
    emit('update:visible', false);
};

// 关闭抽屉
const handleClose = () => {
    emit('cancel');
    emit('update:visible', false);
};
</script>

<style lang="scss" scoped>
.image-picker-mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(8px);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    animation: fadeIn 0.25s ease;
}

.picker-panel {
    width: 100%;
    max-height: 85vh;
    border-radius: 48rpx 48rpx 0 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slideUpPanel 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 -16rpx 48rpx rgba(0, 0, 0, 0.25);

    .theme-light & {
        background: #ffffff;
        color: #0f172a;
    }

    .theme-dark & {
        background: #1c1c22;
        color: #f8fafc;
    }
}

/* 头部 */
.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 36rpx 40rpx 20rpx;

    .panel-header__left {
        display: flex;
        align-items: baseline;
        gap: 16rpx;
    }

    .panel-title {
        font-size: 36rpx;
        font-weight: 800;
        letter-spacing: -0.5rpx;
    }

    .panel-counter {
        font-size: 26rpx;
        font-weight: 600;
        color: #6366f1;
    }

    .panel-close-btn {
        width: 64rpx;
        height: 64rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(148, 163, 184, 0.15);
        cursor: pointer;
    }
}

/* 来源 Tab 切换 */
.source-tabs {
    display: flex;
    padding: 0 40rpx 24rpx;
    gap: 20rpx;

    .source-tab-item {
        flex: 1;
        height: 76rpx;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12rpx;
        cursor: pointer;
        transition: all 0.22s ease;

        .theme-light & {
            background: #f1f5f9;
            color: #64748b;
        }

        .theme-dark & {
            background: rgba(255, 255, 255, 0.08);
            color: #94a3b8;
        }

        .tab-label {
            font-size: 26rpx;
            font-weight: 600;
        }

        &.is-active {
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
            color: #ffffff !important;
            box-shadow: 0 6rpx 18rpx rgba(99, 102, 241, 0.35);
        }
    }
}

/* 滚动区 */
.picker-body {
    max-height: 50vh;
    padding: 0 40rpx;
    box-sizing: border-box;
}

/* 相册卡片 */
.album-trigger-card {
    border: 3rpx dashed #818cf8;
    border-radius: 32rpx;
    padding: 48rpx 32rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    cursor: pointer;
    background: rgba(99, 102, 241, 0.04);
    transition: background 0.2s ease;

    &:active {
        background: rgba(99, 102, 241, 0.1);
    }

    .trigger-icon-wrap {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8rpx 20rpx rgba(99, 102, 241, 0.35);
    }

    .trigger-title {
        font-size: 30rpx;
        font-weight: 700;
    }

    .trigger-hint {
        font-size: 24rpx;
        opacity: 0.6;
    }
}

.album-chosen-list {
    margin-top: 32rpx;

    .section-title {
        font-size: 26rpx;
        font-weight: 700;
        margin-bottom: 16rpx;
        display: block;
        opacity: 0.7;
    }

    .chosen-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16rpx;
    }

    .chosen-item {
        position: relative;
        aspect-ratio: 1;
        border-radius: 20rpx;
        overflow: hidden;

        .item-img {
            width: 100%;
            height: 100%;
        }

        .item-remove-btn {
            position: absolute;
            top: 8rpx;
            right: 8rpx;
            width: 40rpx;
            height: 40rpx;
            border-radius: 50%;
            background: rgba(239, 68, 68, 0.85);
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }
}

/* 收藏网格 */
.favorites-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16rpx;
    padding-bottom: 24rpx;
}

.fav-card {
    position: relative;
    aspect-ratio: 9 / 16;
    border-radius: 20rpx;
    overflow: hidden;
    cursor: pointer;
    border: 3rpx solid transparent;
    transition: transform 0.18s ease, border-color 0.18s ease;

    .fav-img {
        width: 100%;
        height: 100%;
    }

    &.is-selected {
        border-color: #6366f1;
        transform: scale(0.96);
    }

    .select-badge {
        position: absolute;
        top: 12rpx;
        right: 12rpx;
        width: 44rpx;
        height: 44rpx;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.45);
        border: 2rpx solid #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;

        &.is-checked {
            background: #6366f1;
            border-color: #ffffff;
            box-shadow: 0 4rpx 10rpx rgba(99, 102, 241, 0.5);
        }

        .badge-number {
            color: #ffffff;
            font-size: 22rpx;
            font-weight: 800;
        }
    }
}

.loading-box,
.empty-box {
    padding: 80rpx 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20rpx;

    .empty-text {
        font-size: 26rpx;
        opacity: 0.6;
    }

    .empty-action-group {
        display: flex;
        align-items: center;
        gap: 20rpx;
        margin-top: 8rpx;
    }

    .empty-action-btn {
        padding: 14rpx 36rpx;
        border-radius: 999px;
        background: linear-gradient(135deg, #5046e5 0%, #6366f1 100%);
        color: #ffffff;
        font-size: 26rpx;
        font-weight: 600;
        box-shadow: 0 6rpx 18rpx rgba(99, 102, 241, 0.35);

        &:active {
            opacity: 0.85;
            transform: scale(0.97);
        }
    }
}

/* 底部操作区 */
.panel-bottom-bar {
    padding: 24rpx 40rpx max(34px, env(safe-area-inset-bottom));
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    border-top: 1rpx solid rgba(148, 163, 184, 0.15);

    .bottom-action-row {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24rpx;
    }

    .counter-info {
        flex-shrink: 0;
    }

    .selected-text {
        font-size: 26rpx;
        font-weight: 600;
        opacity: 0.8;
    }

    .confirm-btn {
        margin: 0;
        padding: 0 52rpx;
        height: 84rpx;
        border-radius: 999px;
        background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8rpx 24rpx rgba(79, 70, 229, 0.35);
        cursor: pointer;
        flex-shrink: 0;

        .btn-text {
            color: #ffffff;
            font-size: 28rpx;
            font-weight: 700;
        }

        &.is-disabled {
            opacity: 0.4;
            box-shadow: none;
            cursor: not-allowed;
        }
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes slideUpPanel {
    from {
        transform: translateY(100%);
    }
    to {
        transform: translateY(0);
    }
}
</style>
