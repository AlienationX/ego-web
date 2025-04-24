<template>
    <view class="layout">
        <view class="navbar">
            <view class="statusBar" :style="{height: getStatusBarHeight() + 'px'}"></view>
            <view class="titleBar" :style="{height: getTitleBarHeight() + 'px', marginLeft: getLeftIconWidth() + 'px'}">
                <view class="title">{{title}}</view>
                <navigator url="/pages/search/search" class="search">
                    <uni-icons class="icon" type="search" color="#888" size="18"></uni-icons>
                    <text class="text">搜索</text>
                </navigator>
            </view>
        </view>

        <!-- 该区域是为了把内容顶到navbar下面，因为navbar是绝对定位 -->
        <view class="fill" :style="{height: getNavBarHeight() + 'px'}"></view>
    </view>
</template>

<script setup>
    import {
        getStatusBarHeight,
        getTitleBarHeight,
        getNavBarHeight,
        getLeftIconWidth
    } from "@/utils/system.js"
    
    defineProps({
        title: {
           type: String,
            default: "壁纸"
        }
    })
</script>

<style lang="scss" scoped>
    .layout {
        .navbar {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            z-index: 10; // 层级设置10，比其他都高就覆盖再最前面

            background: linear-gradient(to bottom, transparent, #fff 400rpx), linear-gradient(to right, #beecd8 20%, #f4e2d8); // 背景渐变色

            .statusBar {
                // border: 1rpx solid red;
            }

            .titleBar {
                // border: 1rpx solid green;
                display: flex;
                align-items: center;
                padding: 0 30rpx;

                .title {
                    font-size: 40rpx;
                    font-weight: 700;
                    color: $text-font-color-1;
                }

                .search {
                    width: 220rpx;
                    height: 50rpx;
                    background: rgba(255, 255, 255, 0.4);
                    border: 1px solid #fff;
                    border-radius: 60rpx;
                    margin-left: 30rpx;
                    color: #999;
                    font-size: 28rpx;
                    display: flex;
                    align-items: center;

                    .icon {
                        margin-left: 5rpx;
                    }

                    .text {
                        padding-left: 10rpx;
                    }
                }
            }
        }

        .fill {}
    }
</style>