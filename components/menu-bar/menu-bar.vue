<template>
    <view class="menu-bar-container">
        <!-- 状态栏背景遮挡 -->
        <view class="status-bar-bg" :style="{ height: getStatusBarHeight() + 'px' }"></view>
        
        <view class="box" :class="{ 'with-border': showBorder }" :style="{ top: getStatusBarHeight() + 'px', height: getTitleBarHeight() + 'px' }">
            <view class="navbar">
                <view class="left">
                    <view class="back" @click="goBack">
                        <uni-icons type="back" color="#333" size="20"></uni-icons>
                    </view>
                    <view class="title">
                        <slot name="title"></slot>
                    </view>
                </view>

                <view v-if="showToggleMenu" class="right">
                    <view class="menu" @click="toggleMenu">
                        <uni-icons type="more-filled" size="20" color="#666"></uni-icons>
                    </view>
                </view>
            </view>
        </view>
        
        <!-- 占位区域，避免内容被导航栏遮挡 -->
        <view class="fill" :style="{ height: getNavBarHeight() + 'px' }"></view>
    </view>
</template>

<script setup>
    import { getStatusBarHeight, getNavBarHeight, getTitleBarHeight } from '@/utils/system.js';
    
    // 定义props
    const props = defineProps({
        showBorder: {
            type: Boolean,
            default: false
        },
        showToggleMenu: {
            type: Boolean,
            default: false
        }
    });

    const goBack = () => {
        uni.navigateBack({
            success: () => {},
            fail: (err) => {
                // 返回失败，直接跳转回首页
                uni.reLaunch({
                    url: '/pages/index/index'
                });
            }
        });
    };

    const toggleMenu = () => {
        // 可以在这里添加菜单功能
        uni.showActionSheet({
            itemList: ['分享', '刷新'],
            success: (res) => {
                if (res.tapIndex === 0) {
                    // 分享功能
                    console.log('分享');
                } else if (res.tapIndex === 1) {
                    // 刷新功能
                    console.log('刷新');
                }
            }
        });
    };
</script>

<style lang="scss" scoped>
    .menu-bar-container {
        width: 100%;
    }
    
    .status-bar-bg {
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        z-index: 101;
        background: #f5f5f5;
    }

    .box {
        position: fixed;
        left: 0;
        width: 100%;
        z-index: 100;
        background: #f5f5f5;
        display: flex;
        justify-content: left;
        align-items: center;
        
        &.with-border {
            border-bottom: 1px solid #e5e5e5;
        }

        .navbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 30rpx;

            .left {
                display: flex;
                align-items: center;
                flex: 1;
                min-width: 0;

                .back {
                    width: 64rpx;
                    height: 64rpx;
                    background: #fff;
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-shrink: 0;
                    transition: all 0.3s;
                    
                    &:active {
                        background: #f0f0f0;
                        transform: scale(0.95);
                    }
                }
                
                .title {
                    padding-left: 24rpx;
                    font-size: 36rpx;
                    font-weight: 600;
                    color: #333;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    flex: 1;
                    min-width: 0;
                }
            }

            .right {
                flex-shrink: 0;
                margin-left: 20rpx;
                
                .menu {
                    width: 64rpx;
                    height: 64rpx;
                    background: #fff;
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    transition: all 0.3s;
                    
                    &:active {
                        background: #f0f0f0;
                        transform: scale(0.95);
                    }
                }
            }
        }
    }

    .fill {
        // 占位区域，避免内容被导航栏遮挡
        width: 100%;
    }
</style>
