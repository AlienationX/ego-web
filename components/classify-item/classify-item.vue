<template>
    <view class="themeItem" :style="layoutStyle">
        <navigator class="box" :url="'/pages/app/classlist?id=' + item.id + '&name=' + item.name" v-if="!isMore">
            <image class="pic" :src="item.picurl" mode="aspectFill"></image>
            <view class="mask">
                <view class="mask-info">
                    <text class="mask-text">{{ item.name }}</text>
                    <text class="mask-count" v-if="item.wallpapers_count"
                        >{{ item.wallpapers_count }}{{ t('common.items') || '张' }}</text
                    >
                </view>
            </view>
            <view class="tab" v-if="compareTimestamp(item.updateTime)"
                >{{ compareTimestamp(item.updateTime) }}{{ t('common.ago') || '前' }}更新</view
            >
            <uni-icons class="vip" v-if="item.is_locked" type="vip-filled" size="18" color="#F9E9B5"></uni-icons>
        </navigator>

        <navigator class="box more" url="/pages/app/classify" open-type="reLaunch" v-if="isMore">
            <image class="pic" src="/static/images/pics/more.jpg" mode="aspectFill"></image>
            <view class="mask mask-full">
                <mdi-icon path="/static/icons/dots-horizontal.svg" size="34" color="#fff"></mdi-icon>
                <text class="mask-text">{{ $t('common.more') }}</text>
            </view>
        </navigator>
    </view>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { compareTimestamp } from '@/utils/common.js';
const { t } = useI18n();

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
    background: #f8f8f8;
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

    .pic {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        box-shadow: 0 10rpx 10rpx rgba(0, 0, 0, 0.34);
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
    }

    .mask-info {
        display: flex;
        flex-direction: column;
        gap: 4rpx;
    }

    .mask-text {
        color: #fff;
        font-size: 30rpx;
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
    }

    .vip {
        position: absolute;
        top: 10rpx;
        right: 10rpx;
    }

    &:active {
        transform: scale(0.96);
    }
}

@media (hover: hover) {
    .themeItem:hover {
        .pic {
            transform: scale(1.1);
        }
        .box {
            box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.25);
        }
    }
}
</style>
