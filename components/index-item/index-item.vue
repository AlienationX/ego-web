<template>
    <view class="themeItem">
        <navigator class="box" :url="'/pages/classlist/classlist?id=' + item.id + '&name=' + item.name" v-if="!isMore">
            <image class="pic" :src="item.picurl" mode="aspectFill"></image>
            <view class="mask">
                {{item.name}}
            </view>
            <!-- 更新标签可以去掉 -->
            <view class="tab" v-if="compareTimestamp(item.updateTime)">
                {{compareTimestamp(item.updateTime)}}前更新
            </view>
        </navigator>

        <!-- 跳转到tabbar页面，open-type需要设置为reLaunch -->
        <navigator class="box more" url="/pages/classify/classify" open-type="reLaunch" v-if="isMore">
            <image class="pic" src="/static/images/more.jpg" mode="aspectFill"></image>
            <view class="mask">
                <uni-icons type="more-filled" size="34" color="#fff"></uni-icons>
                <view class="text">
                    更多
                </view>
            </view>

        </navigator>
    </view>
</template>

<script setup>
    import {
        compareTimestamp
    } from "@/utils/common.js";

    defineProps({
        isMore: {
            type: Boolean,
            default: false,
        },
        item: {
            type: Object,
            // 对象的默认值必须使用方法定义
            default () {
                return {
                    name: "默认名称",
                    picurl: "/common/images/classify1.jpg",
                    updateTime: Date.now() - 1000 * 60 * 60 * 5,
                }
            }
        }
    })
</script>

<style lang="scss" scoped>
    .themeItem {
        .box {
            height: 340rpx;
            border-radius: 10rpx;
            overflow: hidden;
            position: relative;

            .pic {
                width: 100%;
                height: 100%;
            }

            .mask {
                width: 100%;
                height: 70rpx;
                position: absolute;
                bottom: 0;
                left: 0;
                background: rgba(0, 0, 0, 0.2);
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(20rpx);
                font-weight: 600;
                font-size: 30rpx;
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