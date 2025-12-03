<template>
    <view class="themeItem">
        <navigator class="box" :url="'/pages/classlist/classlist?id=' + item.id + '&name=' + item.name" v-if="!isMore">
            <image class="pic" :src="item.picurl" mode="aspectFill"></image>
            <view class="mask">
                {{ item.name }}
            </view>
            <!-- 更新标签可以去掉 -->
            <view class="tab" v-if="compareTimestamp(item.updateTime)">{{ compareTimestamp(item.updateTime) }}前更新</view>
            <uni-icons class="vip" v-show="item.is_locked" type="vip-filled" size="18" color="#F9E9B5"></uni-icons>
        </navigator>

        <!-- 跳转到tabbar页面，open-type需要设置为reLaunch -->
        <navigator class="box more" url="/pages/classify/classify" open-type="reLaunch" v-if="isMore">
            <image class="pic" src="/static/images/more.jpg" mode="aspectFill"></image>
            <view class="mask">
                <uni-icons type="more-filled" size="34" color="#fff"></uni-icons>
                <view class="text">{{ $t('common.more') }}</view>
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
            // 对象的默认值必须使用方法定义
            default() {
                return {
                    name: '默认名称',
                    picurl: '/common/images/classify1.jpg',
                    updateTime: Date.now() - 1000 * 60 * 60 * 5
                };
            }
        }
    });
</script>

<style lang="scss" scoped>
    .themeItem {
        .box {
            height: 340rpx;
            border-radius: 20rpx;
            overflow: hidden;
            position: relative;
            // x 偏移量 | y 偏移量 | 阴影模糊半径 | 阴影颜色 */
            // box-shadow: 0 8px 24rpx rgba(0,0,0,0.15);
            box-shadow: 0 0 8rpx rgba(0, 0, 0, 0.85);

            .pic {
                width: 100%;
                height: 100%;
            }

            .mask {
                width: 100%;
                height: 64rpx;
                position: absolute;
                bottom: 0;
                left: 0;
                background: rgba(0, 0, 0, 0.5);
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(20rpx);
                font-weight: 600;
                font-size: 26rpx;
            }

            .tab {
                position: absolute;
                top: 0;
                left: 0;
                background: rgba(250, 129, 90, 0.7);
                backdrop-filter: blur(20rpx);
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

        .box.more {
            .mask {
                width: 100%;
                height: 100%;
                flex-direction: column;
            }

            .text {
                font-size: 28rpx;
            }
        }
    }
</style>
