<template>
    <view class="classify-grid-wrapper">
        <view class="classify-grid">
            <view v-for="item in items" :key="item.id" class="classify-item">
                <view class="box" hover-class="box--active" :hover-start-time="20" :hover-stay-time="100"
                    @click="handleClick(item)" @longpress="handleLongPress(item)">
                    <image class="pic" :class="{ 'pic--loaded': loadedMap[item.id] }" :src="item.mediumPicurl"
                        mode="aspectFill" lazy-load @load="onImageLoad(item.id)"></image>
                    <view class="mask" :class="{ 'is-visible': loadedMap[item.id] }">
                        <view class="mask-info">
                            <text class="mask-text">{{ isEn ? (item.name_en || item.name) : item.name }}</text>
                            <text class="mask-count" v-if="item.wallpapers_count">{{ item.wallpapers_count }}{{
                                t('common.items') || '张' }}</text>
                        </view>
                    </view>
                    <view class="tab" :class="{ 'is-visible': loadedMap[item.id] }"
                        v-if="compareTimestamp(item.updateTime)">{{ compareTimestamp(item.updateTime) }}{{
                            t('common.ago')
                        || '前' }}更新</view>
                    <uni-icons class="vip" :class="{ 'is-visible': loadedMap[item.id] }" v-if="item.is_locked"
                        type="vip-filled" size="18" color="#F9E9B5"></uni-icons>
                </view>
            </view>
        </view>

        <!-- Quick Look Pop-over Floating Card Modal (独立于 grid 容器外) -->
        <view class="quick-look-mask" :class="{ 'is-active': activeQuickLookItem }" @click="closeQuickLook"
            @touchmove.stop.prevent>
            <view class="quick-look-card" :class="{ 'is-active': activeQuickLookItem }" @click.stop
                v-if="activeQuickLookItem">
                <image class="quick-look-pic" :src="activeQuickLookItem.mediumPicurl || activeQuickLookItem.picurl"
                    mode="aspectFill"></image>
                <view class="quick-look-overlay">
                    <view class="quick-look-header">
                        <view class="quick-look-badge" v-if="activeQuickLookItem.is_locked">
                            <uni-icons type="vip-filled" size="14" color="#F9E9B5"></uni-icons>
                            <text>VIP ONLY</text>
                        </view>
                        <view class="quick-look-badge" v-else-if="compareTimestamp(activeQuickLookItem.updateTime)">
                            {{ compareTimestamp(activeQuickLookItem.updateTime) }}前更新
                        </view>
                    </view>

                    <view class="quick-look-info">
                        <text class="quick-look-title">{{ isEn ? (activeQuickLookItem.name_en ||
                            activeQuickLookItem.name) : activeQuickLookItem.name }}</text>
                        <text class="quick-look-count" v-if="activeQuickLookItem.wallpapers_count">{{
                            activeQuickLookItem.wallpapers_count }}{{ t('common.items') || '张' }}壁纸</text>
                    </view>

                    <view class="quick-look-actions">
                        <button class="quick-look-btn primary" @click="goClasslistFromQuickLook(activeQuickLookItem)">
                            {{ t('common.seeAll') || '探索分类' }}
                        </button>
                        <button class="quick-look-btn secondary" @click="closeQuickLook">
                            关闭
                        </button>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { compareTimestamp } from '@/utils/common.js';

const { t, locale } = useI18n();
const isEn = computed(() => locale.value === 'en');

const props = defineProps({
    items: {
        type: Array,
        default: () => [],
    },
});

const loadedMap = reactive({});
const activeQuickLookItem = ref(null);
const isLongPressing = ref(false);

const onImageLoad = (id) => {
    loadedMap[id] = true;
};

const handleLongPress = (item) => {
    isLongPressing.value = true;
    activeQuickLookItem.value = item;
};

const handleClick = (item) => {
    if (isLongPressing.value) {
        isLongPressing.value = false;
        return;
    }
    uni.navigateTo({
        url: `/pages/app/classlist?id=${item.id}&name=${item.name}`,
    });
};

const closeQuickLook = () => {
    activeQuickLookItem.value = null;
    setTimeout(() => {
        isLongPressing.value = false;
    }, 150);
};

const goClasslistFromQuickLook = (item) => {
    const targetItem = item || activeQuickLookItem.value;
    closeQuickLook();
    if (targetItem) {
        uni.navigateTo({
            url: `/pages/app/classlist?id=${targetItem.id}&name=${targetItem.name}`,
        });
    }
};
</script>

<style lang="scss" scoped>
.classify-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 210rpx;
    gap: 20rpx;

    // 7 个为一组循环：第 3、5 个跨 2 行
    .classify-item:nth-child(7n + 3),
    .classify-item:nth-child(7n + 5) {
        grid-row: span 2;
    }

    // 7 个为一组循环：第 7 个跨 2 列（占满整行）
    .classify-item:nth-child(7n) {
        grid-column: 1 / -1;
    }

    // 最后一个元素如果是该组的第 1、3、5 个（左列），占满整行，取消跨行
    .classify-item:last-child:nth-child(7n + 1),
    .classify-item:last-child:nth-child(7n + 3),
    .classify-item:last-child:nth-child(7n + 5) {
        grid-column: 1 / -1;
        grid-row: auto;
    }

    // 倒数第 2 个元素如果是跨 2 行的位置，取消跨行
    .classify-item:nth-last-child(2):nth-child(7n + 3),
    .classify-item:nth-last-child(2):nth-child(7n + 5) {
        grid-row: auto;
    }
}

.classify-item {
    position: relative;
    border-radius: 24rpx;
    overflow: hidden;
}

.box {
    height: 100%;
    min-height: 200rpx;
    border-radius: 24rpx;
    overflow: hidden;
    position: relative;
    display: block;
    transition: transform 0.12s cubic-bezier(0.2, 0.9, 0.3, 1), filter 0.12s ease, opacity 0.12s ease;
    will-change: transform, filter;
    background: linear-gradient(90deg,
            rgba(200, 200, 200, 0.08) 25%,
            rgba(200, 200, 200, 0.18) 50%,
            rgba(200, 200, 200, 0.08) 75%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.6s infinite linear;

    &--active,
    &:active {
        transform: scale(0.97) !important;
        filter: brightness(0.9) !important;
    }

    .pic {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        box-shadow: 0 8rpx 20rpx var(--shadow-color);
        transition:
            opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1),
            transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);

        &.pic--loaded {
            opacity: 1;
        }
    }

    .mask {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        min-height: 88rpx;
        padding: 30rpx 20rpx 20rpx;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.2) 60%, transparent);
        display: flex;
        align-items: flex-end;
        z-index: 2;
        opacity: 0;
        transition: opacity 0.4s ease-in-out;

        &.is-visible {
            opacity: 1;
        }
    }

    .mask-info {
        display: flex;
        flex-direction: column;
        gap: 4rpx;
    }

    .mask-text {
        color: #fff;
        font-size: 28rpx;
        font-weight: 600;
        letter-spacing: 0.5rpx;
        text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
    }

    .mask-count {
        font-size: 20rpx;
        color: rgba(255, 255, 255, 0.7);
    }

    .tab {
        position: absolute;
        top: 0;
        left: 0;
        background: rgba(40, 179, 137, 0.85);
        color: #fff;
        font-size: 22rpx;
        padding: 6rpx 14rpx;
        border-radius: 0 0 20rpx 0;
        z-index: 2;
        opacity: 0;
        transition: opacity 0.4s ease-in-out;

        &.is-visible {
            opacity: 1;
        }
    }

    .vip {
        position: absolute;
        top: 10rpx;
        right: 10rpx;
        z-index: 2;
        opacity: 0;
        transition: opacity 0.4s ease-in-out;

        &.is-visible {
            opacity: 1;
        }
    }
}

@media (hover: hover) and (pointer: fine) {
    .classify-item:hover {
        .pic {
            transform: scale(1.08);
        }
    }
}

@keyframes skeleton-shimmer {
    0% {
        background-position: 200% 0;
    }

    100% {
        background-position: -200% 0;
    }
}

// ── Quick Look 悬浮放大预览 ──
.quick-look-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 99999;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(24px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40rpx;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.28s cubic-bezier(0.25, 1, 0.5, 1);

    &.is-active {
        opacity: 1;
        pointer-events: auto;
    }
}

.quick-look-card {
    width: 620rpx;
    height: 840rpx;
    border-radius: 40rpx;
    overflow: hidden;
    position: relative;
    box-shadow: 0 30rpx 80rpx rgba(0, 0, 0, 0.45);
    transform: scale(0.85);
    transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);

    &.is-active {
        transform: scale(1);
    }
}

.quick-look-pic {
    width: 100%;
    height: 100%;
    display: block;
}

.quick-look-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.1) 40%, rgba(0, 0, 0, 0.9) 100%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 36rpx 32rpx;
    box-sizing: border-box;
}

.quick-look-header {
    display: flex;
    justify-content: flex-start;
}

.quick-look-badge {
    display: inline-flex;
    align-items: center;
    gap: 6rpx;
    padding: 8rpx 20rpx;
    background: rgba(0, 0, 0, 0.45);
    border: 1rpx solid rgba(255, 255, 255, 0.18);
    border-radius: 100rpx;
    color: #ffffff;
    font-size: 22rpx;
    font-weight: 700;
    backdrop-filter: blur(8px);
}

.quick-look-info {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    margin-bottom: 24rpx;
}

.quick-look-title {
    font-size: 46rpx;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: -1rpx;
    text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.5);
}

.quick-look-count {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.82);
}

.quick-look-actions {
    display: flex;
    gap: 20rpx;

    .quick-look-btn {
        flex: 1;
        height: 88rpx;
        line-height: 88rpx;
        border-radius: 100rpx;
        font-size: 28rpx;
        font-weight: 700;
        border: none;
        outline: none;

        &.primary {
            background: #ffffff;
            color: #111111;
        }

        &.secondary {
            background: rgba(255, 255, 255, 0.2);
            color: #ffffff;
            backdrop-filter: blur(10px);
        }
    }
}
</style>
