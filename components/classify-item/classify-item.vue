<template>
    <view class="themeItem" :style="layoutStyle">
        <navigator class="box" :url="'/pages/classlist/classlist?id=' + item.id + '&name=' + item.name" v-if="!isMore">
            <image class="pic" :src="item.picurl" mode="aspectFill"></image>
            <view class="mask">
                <text class="mask-text">{{ item.name }}</text>
            </view>
            <view class="tab" v-if="compareTimestamp(item.updateTime)">{{ compareTimestamp(item.updateTime) }}前更新</view>
            <uni-icons class="vip" v-show="item.is_locked" type="vip-filled" size="18" color="#F9E9B5"></uni-icons>
        </navigator>

        <navigator class="box more" url="/pages/classify/classify" open-type="reLaunch" v-if="isMore">
            <image class="pic" src="/static/images/pics/more.jpg" mode="aspectFill"></image>
            <view class="mask mask-full">
                <uni-icons type="more-filled" size="34" color="#fff"></uni-icons>
                <text class="mask-text">{{ $t('common.more') }}</text>
            </view>
        </navigator>
    </view>
</template>

<script setup>
    import { compareTimestamp } from '@/utils/common.js';

    defineProps({
        isMore: {
            type: Boolean,
            default: false
        },
        item: {
            type: Object,
            default() {
                return {
                    name: '默认名称',
                    picurl: '/static/images/classify1.jpg',
                    updateTime: Date.now() - 1000 * 60 * 60 * 5
                };
            }
        },
        layoutStyle: {
            type: Object,
            default: () => ({})
        }
    });
</script>

<style lang="scss" scoped>
    .themeItem {
        min-height: 100%;
        border-radius: 24rpx;
        overflow: hidden;

        .box {
            height: 100%;
            min-height: 200rpx;
            border-radius: 24rpx;
            overflow: hidden;
            position: relative;
            display: block;
            background: rgba(245, 185, 166, 0.3);

            .pic {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                object-position: center;
            }

            .mask {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                min-height: 88rpx;
                padding: 16rpx 20rpx 20rpx;
                background: linear-gradient(to top, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.35) 60%, transparent);
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
            }

            .mask-text {
                color: #fff;
                font-size: 30rpx;
                font-weight: 600;
                letter-spacing: 0.5rpx;
                text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.4);
                max-width: 100%;
                word-break: break-word;
                line-height: 1.35;
            }

            .mask-full {
                top: 0;
                bottom: 0;
                min-height: 100%;
                flex-direction: column;
                justify-content: center;
                gap: 12rpx;
                background: rgba(0, 0, 0, 0.4);
            }

            .tab {
                position: absolute;
                top: 0;
                left: 0;
                background: rgba(250, 129, 90, 0.85);
                color: #fff;
                font-size: 22rpx;
                padding: 6rpx 14rpx;
                border-radius: 0 0 20rpx 0;
            }

            .vip {
                position: absolute;
                top: 0;
                right: 4rpx;
            }
        }

        .box.more .mask-text {
            font-size: 28rpx;
        }
    }
</style>
