<template>
    <view class="themeItem" :style="layoutStyle">
        <navigator class="box" :url="'/pages/app/classlist?id=' + item.id + '&name=' + item.name" v-if="!isMore">
            <image class="pic" :class="{ 'pic--loaded': isLoaded }" :src="item.picurl" mode="aspectFill" lazy-load @load="onImageLoad"></image>
            <view class="mask" :class="{ 'is-visible': isLoaded }">
                <view class="mask-info">
                    <text class="mask-text">{{ item.name }}</text>
                    <text class="mask-count" v-if="item.wallpapers_count"
                        >{{ item.wallpapers_count }}{{ t('common.items') || '张' }}</text
                    >
                </view>
            </view>
            <view class="tab" :class="{ 'is-visible': isLoaded }" v-if="compareTimestamp(item.updateTime)"
                >{{ compareTimestamp(item.updateTime) }}{{ t('common.ago') || '前' }}更新</view
            >
            <uni-icons class="vip" :class="{ 'is-visible': isLoaded }" v-if="item.is_locked" type="vip-filled" size="18" color="#F9E9B5"></uni-icons>
        </navigator>

        <navigator class="box more" url="/pages/app/classify" open-type="reLaunch" v-if="isMore">
            <image class="pic pic--loaded" src="/static/images/pics/more.jpg" mode="aspectFill"></image>
            <view class="mask mask-full">
                <mdi-icon path="/static/icons/dots-horizontal.svg" size="34" color="#fff"></mdi-icon>
                <text class="mask-text">{{ $t('common.more') }}</text>
            </view>
        </navigator>
    </view>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { compareTimestamp } from '@/utils/common.js';
const { t } = useI18n();

const isLoaded = ref(false);
const onImageLoad = () => {
    isLoaded.value = true;
};

defineProps({
    isMore: {
        type: Boolean,
        default: false,
    },
    item: {
        type: Object,
        default() {
            return {
                name: '默认名称',
                picurl: '/static/images/classify1.jpg',
                updateTime: Date.now() - 1000 * 60 * 60 * 5,
            };
        },
    },
    layoutStyle: {
        type: Object,
        default: () => ({}),
    },
});
</script>

<style lang="scss" scoped>
.themeItem {
    height: 100%;
    width: 100%;
    border-radius: 24rpx;
    overflow: hidden;
    background: transparent;
    display: flex;
    flex-direction: column;
}

.box {
    height: 100%;
    min-height: 200rpx;
    border-radius: 24rpx;
    overflow: hidden;
    position: relative;
    display: block;
    transition: transform 0.3s ease;
    background: linear-gradient(90deg, rgba(200, 200, 200, 0.08) 25%, rgba(200, 200, 200, 0.18) 50%, rgba(200, 200, 200, 0.08) 75%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.6s infinite linear;

    .pic {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        box-shadow: 0 10rpx 10rpx rgba(0, 0, 0, 0.34);
        transition: opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1), transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);

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

    .mask-full {
        top: 0;
        bottom: 0;
        min-height: 100%;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: rgba(0, 0, 0, 0.4);
        padding: 0;
        opacity: 1;
        z-index: 2;
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

    &:active {
        /* 移除了原本的缩小效果 */
    }
}

.themeItem {
    &:active {
        .pic {
            transform: scale(1.08);
        }
    }
}

@media (hover: hover) {
    .themeItem:hover {
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
