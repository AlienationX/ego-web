<template>
    <view class="layout pageBackground">
        <view :style="{ height: getNavBarHeight() + 'px' }"></view>
        <view class="userInfo">
            <view class="avater">
                <image src="/common/images/pics/default_avatar.svg" mode="aspectFill"></image>
            </view>
            
            <view v-if="userStore.userinfo.id">
                <view class="name">{{ useUserStore.userinfo.nickname }}</view>
                <view class="address" v-if="useUserStore.userinfo.region">
                    来自于 {{ useUserStore.userinfo.region }}
                    <!-- {{ userinfo.address.region || userinfo.address.city || userinfo.address.province || userinfo.address.country || '未知' }} -->
                </view>
            </view>
            <view v-else class="name">
                <navigator url="/pages/login/login">Login</navigator>
            </view>
        </view>

        <view class="section" v-if="userStore.userinfo.id">
            <view class="list">
                <view class="row" v-for="item in appMenus" :key="item.left_text" @click="item.click">
                    <view class="left">
                        <uni-icons :type="item.left_icon" size="20" color="#28b389"></uni-icons>
                        <view class="text">
                            {{ item.left_text }}
                        </view>
                    </view>
                    <view class="right">
                        <view class="text">
                            {{ item.right_text }}
                        </view>
                        <uni-icons :type="item.right_icon" size="15"></uni-icons>
                    </view>
                </view>
            </view>
        </view>

        <view class="section">
            <view class="list">
                <view class="row" v-for="item in sysMenus" :key="item.left_text" @click="item.click">
                    <view class="left">
                        <uni-icons :type="item.left_icon" size="20" color="#28b389"></uni-icons>
                        <view class="text">
                            {{ item.left_text }}
                        </view>
                    </view>
                    <view class="right">
                        <view class="text">
                            {{ item.right_text }}
                        </view>
                        <uni-icons :type="item.right_icon" size="15" color="#aaa"></uni-icons>
                    </view>
                    <button v-if="item.left_text === '联系客服'" open-type="contact"></button>
                    <button v-if="item.left_text === '反馈意见'" open-type="feedback"></button>
                </view>
            </view>
        </view>

        <view class="section" v-if="userStore.userinfo.id">
            <view class="list">
                <view class="row" v-for="item in exitMenus" :key="item.left_text" @click="item.click">
                    <view class="left">
                        <uni-icons :type="item.left_icon" size="20" color="#28b389"></uni-icons>
                        <view class="text">
                            {{ item.left_text }}
                        </view>
                    </view>
                    <view class="right">
                        <view class="text">
                            {{ item.right_text }}
                        </view>
                        <uni-icons :type="item.right_icon" size="15" color="#aaa"></uni-icons>
                    </view>
                </view>
            </view>
        </view>

        <custom-ad-banner></custom-ad-banner>
        <custom-ad-banner></custom-ad-banner>
        <custom-ad-banner></custom-ad-banner>
    </view>
</template>

<script setup>
    import { ref, reactive } from 'vue';
    import { getNavBarHeight } from '@/utils/system.js';
    import { useUserStore } from '@/stores/user.js';

    const userStore = useUserStore();

    const toMyFavorite = () => {
        console.log('toMyFavorite');
    };

    const toMyDownload = () => {
        console.log('toMyDownload');
    };

    const toMyScore = () => {
        console.log('toMyScore');
    };

    const toFAQ = () => {
        uni.navigateTo({
            url: '/pages/notice/detail?id=2&name=常见问题'
        });
    };

    const toSubscribe = () => {
        uni.navigateTo({
            url: '/pages/notice/detail?id=1&name=订阅更新'
        });
    };

    const onService = () => {
        console.log('onService');
    };

    const onFeedback = () => {
        console.log('onFeedback');
    };

    const onExit = () => {
        userStore.clearUserData();
    };

    const appMenus = reactive([
        {
            left_icon: 'heart-filled',
            left_text: '我的收藏',
            right_text: '12',
            right_icon: 'forward',
            click: toMyFavorite
        },
        {
            left_icon: 'download-filled',
            left_text: '我的下载',
            right_text: '3',
            right_icon: 'forward',
            click: toMyDownload
        },
        {
            left_icon: 'star-filled',
            left_text: '我的评分',
            right_text: '',
            right_icon: 'forward',
            click: toMyScore
        }
    ]);

    const sysMenus = reactive([
        {
            left_icon: 'vip-filled',
            left_text: '订阅更新',
            right_text: '',
            right_icon: 'right',
            click: toSubscribe
        },
        {
            left_icon: 'help-filled',
            left_text: '常见问题',
            right_text: '',
            right_icon: 'right',
            click: toFAQ
        },
        {
            left_icon: 'chatboxes-filled',
            left_text: '联系客服',
            right_text: '',
            right_icon: 'right',
            click: onService
        },
        {
            left_icon: 'chat-filled',
            left_text: '反馈意见',
            right_text: '',
            right_icon: 'right',
            click: onFeedback
        }
    ]);

    const exitMenus = reactive([
        {
            left_icon: 'gear-filled',
            left_text: '退出登录',
            right_text: '退出当前账号',
            right_icon: '',
            click: onExit
        }
    ]);
</script>

<style lang="scss" scoped>
    .layout {
        height: 100%;

        .userInfo {
            display: flex;
            align-items: center;
            justify-content: top;
            flex-direction: column;
            padding: 50rpx 0 20rpx;
            min-height: 320rpx;

            .avater {
                width: 160rpx;
                height: 160rpx;
                border-radius: 50%;
                overflow: hidden;

                image {
                    width: 100%;
                    height: 100%;
                }
            }

            .name {
                font-size: 44rpx;
                color: #333;
                padding: 40rpx 0 5rpx;
            }

            .address {
                font-size: 28rpx;
                color: #aaa;
            }
        }

        .section {
            width: 690rpx;
            margin: 50rpx auto;
            border: 1rpx solid #eee;
            border-radius: 10rpx;
            box-shadow: 0 0 30rpx rgba(0, 0, 0, 0.05);

            .list {
                .row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 30rpx;
                    height: 100rpx;
                    border-bottom: 1rpx solid #eee;
                    position: relative;
                    background: #fff;

                    // &:last-child {border-bottom: 0;}  // 去掉最底下的边框
                    .left {
                        display: flex;
                        align-items: center;

                        .text {
                            padding-left: 20rpx;
                            color: #666;
                        }
                    }

                    .right {
                        display: flex;
                        align-items: center;

                        .text {
                            font-size: 28rpx;
                            color: #aaa;
                        }
                    }

                    button {
                        position: absolute;
                        top: 0;
                        left: 0;
                        height: 100rpx;
                        width: 100%;
                        opacity: 0;
                    }
                }
            }
        }
    }
</style>
