<template>
    <view class="board-card" :class="{ 'theme-dark': settingsStore.isDark, 'is-rotating': board.is_auto_rotate }"
        @click="$emit('click', board)">
        <!-- Pinterest 风格 3 图拼图封面容器 -->
        <view class="board-collage">
            <!-- 场景 1：3 张及以上壁纸 (Pinterest 经典 1 大 + 2 小拼图) -->
            <view v-if="previewImages.length >= 3" class="collage-grid collage-grid--triple">
                <view class="collage-main">
                    <image class="collage-img" :src="previewImages[0]" mode="aspectFill" lazy-load></image>
                </view>
                <view class="collage-side">
                    <view class="collage-side-item">
                        <image class="collage-img" :src="previewImages[1]" mode="aspectFill" lazy-load></image>
                    </view>
                    <view class="collage-side-item">
                        <image class="collage-img" :src="previewImages[2]" mode="aspectFill" lazy-load></image>
                    </view>
                </view>
            </view>

            <!-- 场景 2：恰好 2 张壁纸 (左右对半分) -->
            <view v-else-if="previewImages.length === 2" class="collage-grid collage-grid--double">
                <view class="collage-half">
                    <image class="collage-img" :src="previewImages[0]" mode="aspectFill" lazy-load></image>
                </view>
                <view class="collage-half">
                    <image class="collage-img" :src="previewImages[1]" mode="aspectFill" lazy-load></image>
                </view>
            </view>

            <!-- 场景 3：只有 1 张壁纸 (单图满铺) -->
            <view v-else-if="previewImages.length === 1" class="collage-grid collage-grid--single">
                <image class="collage-img" :src="previewImages[0]" mode="aspectFill" lazy-load></image>
            </view>

            <!-- 场景 4：空画板 (极简插画与加号占位) -->
            <view v-else class="collage-grid collage-grid--empty">
                <view class="empty-icon-box">
                    <mdi-icon path="/static/icons/image-multiple-outline.svg" size="28px"
                        :color="settingsStore.isDark ? '#4b5563' : '#cbd5e1'"></mdi-icon>
                </view>
                <text class="empty-hint">{{ t('board.emptyBoardHint') }}</text>
            </view>

            <!-- 轮播状态徽章 -->
            <view v-if="board.is_auto_rotate" class="rotate-badge">
                <mdi-icon path="/static/icons/refresh.svg" size="12px" color="#ffffff"></mdi-icon>
                <text class="rotate-badge-text">{{ t('board.rotating') }}</text>
            </view>
        </view>

        <!-- 画板标题与元信息 -->
        <view class="board-info">
            <text class="board-name">{{ board.name }}</text>
            <view class="board-meta">
                <text class="board-count">{{ tp('board.wallCount', { count: board.items_count || 0 }) }}</text>
                <view v-if="board.is_auto_rotate" class="rotate-dot-tag">
                    <view class="dot"></view>
                    <text>{{ t('board.activeRotate') }}</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue';
import { useSettingsStore } from '@/stores/settings.js';
import { useTranslateParams } from '@/utils/i18n.js';
import { PICS_BASE_URL } from '@/common/config.js';

const props = defineProps({
    board: {
        type: Object,
        required: true,
        default: () => ({
            id: 0,
            name: '',
            description: '',
            preview_images: [],
            items_count: 0,
            is_auto_rotate: false,
        }),
    },
});

defineEmits(['click']);

const settingsStore = useSettingsStore();
const { t, tp } = useTranslateParams();

const formatImgUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${PICS_BASE_URL}/${url.replace(/^\/+/, '')}`;
};

const previewImages = computed(() => {
    const list = props.board.preview_images || [];
    return list.map(formatImgUrl);
});
</script>

<style lang="scss" scoped>
.board-card {
    width: 100%;
    display: flex;
    flex-direction: column;
    margin-bottom: 32rpx;
    border-radius: 28rpx;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:active {
        transform: scale(0.98);
    }
}

.board-collage {
    width: 100%;
    height: 380rpx;
    border-radius: 28rpx;
    overflow: hidden;
    position: relative;
    background: #f1f5f9;

    .theme-dark & {
        background: #1e293b;
    }
}

.collage-grid {
    width: 100%;
    height: 100%;
    display: flex;

    &--triple {
        gap: 4rpx;

        .collage-main {
            width: 66%;
            height: 100%;
            overflow: hidden;
        }

        .collage-side {
            width: 34%;
            height: 100%;
            display: flex;
            flex-direction: column;
            gap: 4rpx;

            &-item {
                width: 100%;
                height: calc(50% - 2rpx);
                overflow: hidden;
            }
        }
    }

    &--double {
        gap: 4rpx;

        .collage-half {
            width: 50%;
            height: 100%;
            overflow: hidden;
        }
    }

    &--single {
        width: 100%;
        height: 100%;
    }

    &--empty {
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12rpx;
        background: #f8fafc;
        border: 2rpx dashed #cbd5e1;
        box-sizing: border-box;
        border-radius: 28rpx;

        .theme-dark & {
            background: #1e293b;
            border-color: #334155;
        }

        .empty-hint {
            font-size: 22rpx;
            color: #94a3b8;
            font-weight: 500;
        }
    }
}

.collage-img {
    width: 100%;
    height: 100%;
    display: block;
}

.rotate-badge {
    position: absolute;
    top: 14rpx;
    right: 14rpx;
    background: rgba(37, 99, 235, 0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 6rpx 14rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    gap: 6rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);

    .rotate-badge-text {
        font-size: 20rpx;
        color: #ffffff;
        font-weight: 600;
    }
}

.board-info {
    padding: 16rpx 8rpx 0 8rpx;
    display: flex;
    flex-direction: column;
    gap: 4rpx;

    .board-name {
        font-size: 28rpx;
        font-weight: 700;
        color: #0f172a;
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        .theme-dark & {
            color: #f8fafc;
        }
    }

    .board-meta {
        display: flex;
        align-items: center;
        gap: 12rpx;

        .board-count {
            font-size: 22rpx;
            color: #64748b;
            font-weight: 500;

            .theme-dark & {
                color: #94a3b8;
            }
        }

        .rotate-dot-tag {
            display: flex;
            align-items: center;
            gap: 6rpx;
            font-size: 20rpx;
            color: #3b82f6;
            font-weight: 600;

            .dot {
                width: 10rpx;
                height: 10rpx;
                border-radius: 50%;
                background: #3b82f6;
                animation: pulse 2s infinite;
            }
        }
    }
}

@keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.8); }
}
</style>
