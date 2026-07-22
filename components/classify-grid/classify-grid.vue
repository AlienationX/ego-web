<template>
    <view class="classify-grid">
        <view v-for="item in items" :key="item.id" class="classify-item">
            <navigator class="box" :url="'/pages/app/classlist?id=' + item.id + '&name=' + item.name">
                <image
                    class="pic"
                    :class="{ 'pic--loaded': loadedMap[item.id] }"
                    :src="item.mediumPicurl"
                    mode="aspectFill"
                    lazy-load
                    @load="onImageLoad(item.id)"
                ></image>
                <view class="mask" :class="{ 'is-visible': loadedMap[item.id] }">
                    <view class="mask-info">
                        <text class="mask-text">{{ isEn ? (item.name_en || item.name) : item.name }}</text>
                        <text class="mask-count" v-if="item.wallpapers_count"
                            >{{ item.wallpapers_count }}{{ t('common.items') || '张' }}</text
                        >
                    </view>
                </view>
                <view class="tab" :class="{ 'is-visible': loadedMap[item.id] }" v-if="compareTimestamp(item.updateTime)"
                    >{{ compareTimestamp(item.updateTime) }}{{ t('common.ago') || '前' }}更新</view
                >
                <uni-icons
                    class="vip"
                    :class="{ 'is-visible': loadedMap[item.id] }"
                    v-if="item.is_locked"
                    type="vip-filled"
                    size="18"
                    color="#F9E9B5"
                ></uni-icons>
            </navigator>
        </view>
    </view>
</template>

<script setup>
import { reactive, computed } from 'vue';
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

const onImageLoad = (id) => {
    loadedMap[id] = true;
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

    &:active {
        .pic {
            transform: scale(1.08);
        }
    }
}

.box {
    height: 100%;
    min-height: 200rpx;
    border-radius: 24rpx;
    overflow: hidden;
    position: relative;
    display: block;
    transition: transform 0.3s ease;
    background: linear-gradient(
        90deg,
        rgba(200, 200, 200, 0.08) 25%,
        rgba(200, 200, 200, 0.18) 50%,
        rgba(200, 200, 200, 0.08) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.6s infinite linear;

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

@media (hover: hover) {
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
</style>
