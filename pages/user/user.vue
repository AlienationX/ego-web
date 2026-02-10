<template>
    <view class="layout">
        <view class="userInfo" :class="{ 'not-logged-in': !userStore.userinfo.id }" :style="{ paddingTop: (getStatusBarHeight() + 20) + 'px' }">
            
            <!-- 装饰性背景 -->
            <view class="decorative-bg">
                <view class="bg-circle circle-1"></view>
                <view class="bg-circle circle-2"></view>
                <view class="bg-circle circle-3"></view>
            </view>

            <view v-if="userStore.userinfo.id" class="user-content">
                <view class="avater">
                    <image src="/static/images/pics/default_avatar.svg" mode="aspectFill"></image>
                    <view class="avatar-ring"></view>
                </view>

                <view class="user-details">
                    <view class="details-top">
                        <view class="name-row">
                            <text class="name">{{ userStore.userinfo.profile.nickname }}</text>
                            <view v-if="userStore.userinfo.profile.is_vip" class="vip-badge">
                                <uni-icons type="vip-filled" size="14" color="#fff"></uni-icons>
                                <text>{{ t('user.profile.member') }}</text>
                            </view>
                            <view v-else class="non-vip-badge" @click="toMembership">
                                <text>成为会员</text>
                                <uni-icons type="arrow-right" size="12" color="#28B389"></uni-icons>
                            </view>
                        </view>
                        <view class="edit-btn" @click="toEditProfile">
                            {{ t('user.profile.editProfile') }}
                        </view>
                    </view>
                    
                    <view class="user-description">
                        {{ userStore.userinfo.profile.description || t('user.profile.noDescription') }}
                    </view>
                    
                    <view class="user-info-row">
                        <view v-if="userStore.userinfo.email" class="info-item">
                            <uni-icons type="mail-filled" size="16" color="#999"></uni-icons>
                            <text>{{ userStore.userinfo.email }}</text>
                        </view>
                        <view v-if="userStore.userinfo.profile.region" class="info-item">
                            <uni-icons type="location" size="16" color="#999"></uni-icons>
                            <text>{{ userStore.userinfo.profile.region }}</text>
                        </view>
                    </view>
                </view>
            </view>
            
            <!-- 签到和能量 -->
            <view v-if="userStore.userinfo.id" class="checkin-section">
                <view class="energy-info">
                    <uni-icons type="lightbulb-filled" size="24" color="#ffc107"></uni-icons>
                    <text class="energy-text">当前能量: {{ userStore.userinfo.profile.energy || 0 }}</text>
                </view>
                <view class="checkin-btn" @click="checkin" :class="{ 'checked-in': hasCheckedInToday }">
                    <uni-icons type="refresh" size="18" color="#28B389"></uni-icons>
                    <text>{{ hasCheckedInToday ? t('user.profile.checkedIn') : t('user.profile.checkin') }}</text>
                </view>
            </view>

            <view v-else class="not-logged-in-content">
                <view class="avater">
                    <image src="/static/images/pics/default_avatar.svg" mode="aspectFill"></image>
                    <view class="avatar-ring"></view>
                </view>
                <view class="app-name">{{ $t('common.appName') }}</view>
                <view class="app-desc">{{ t('user.profile.appDesc') }}</view>
                <button class="login-btn" @click="toLogin">{{ t('user.profile.login') }}</button>
            </view>
        </view>

        <!-- 统计卡片 -->
        <view class="stats-section">
            <view class="stats-card heart-card" @click="toMyFavorite">
                <view class="card-bg"></view>
                <view class="stats-row">
                    <view class="stats-icon heart">
                        <uni-icons type="heart-filled" size="32" color="#ff6b9d"></uni-icons>
                    </view>
                    <view class="stats-number">{{ userStore.userinfo.count ? userStore.userinfo.count.collect_count : 0 }}</view>
                </view>
                <view class="stats-label">{{ t('user.profile.myFavorite') }}</view>
                <view class="card-decoration decoration-1"></view>
            </view>
            <view class="stats-card download-card" @click="toMyDownload">
                <view class="card-bg"></view>
                <view class="stats-row">
                    <view class="stats-icon download">
                        <uni-icons type="download-filled" size="32" color="#28B389"></uni-icons>
                    </view>
                    <view class="stats-number">{{ userStore.userinfo.count ? userStore.userinfo.count.download_count : 0 }}</view>
                </view>
                <view class="stats-label">{{ t('user.profile.myDownload') }}</view>
                <view class="card-decoration decoration-2"></view>
            </view>
            <view class="stats-card star-card" @click="toMyScore">
                <view class="card-bg"></view>
                <view class="stats-row">
                    <view class="stats-icon star">
                        <uni-icons type="star-filled" size="32" color="#ffc107"></uni-icons>
                    </view>
                    <view class="stats-number">{{  userStore.userinfo.count ? userStore.userinfo.count.rate_count : 0  }}</view>
                </view>
                <view class="stats-label">{{ t('user.profile.myScore') }}</view>
                <view class="card-decoration decoration-3"></view>
            </view>
        </view>


        <view class="section">
            <view class="list">
                <view class="row" v-for="item in sysMenus" :key="item.left_text" @click="item.click">
                    <view class="left">
                        <uni-icons :type="item.left_icon" size="24" color="#28B389"></uni-icons>
                        <view class="text">
                            {{ item.left_text }}
                        </view>
                    </view>
                    <view class="right">
                        <view class="text">
                            {{ item.right_text }}
                        </view>
                        <uni-icons :type="item.right_icon" size="18" color="#aaa"></uni-icons>
                    </view>
                    <!-- 微信特有的功能 -->
                    <!-- #ifdef MP-WEIXIN -->
                    <button v-if="item.left_text === t('user.profile.support')" open-type="contact"></button>
                    <button v-if="item.left_text === t('user.profile.feedback')" open-type="feedback"></button>
                    <!-- #endif -->
                </view>
            </view>
        </view>

        <view class="section exit-section" v-if="userStore.userinfo.id">
            <view class="list">
                <view class="row exit-row" v-for="item in exitMenus" :key="item.left_text" @click="item.click">
                    <view class="left">
                        <!-- <uni-icons :type="item.left_icon" size="24" color="#ff6b6b"></uni-icons> -->
                        <image class="icon" :src="item.left_icon"></image>
                        <view class="text">
                            {{ item.left_text }}
                        </view>
                    </view>
                    <view class="right">
                        <view class="text">
                            {{ item.right_text }}
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <custom-ad-banner style="padding: 0rpx 30rpx 30rpx"></custom-ad-banner>
    </view>
</template>

<script setup>
    import { ref, reactive, computed } from 'vue';
    import { onLoad, onUnload, onShow } from '@dcloudio/uni-app';
    import { apiPostProfile } from '@/api/wallpaper.js';
    import { getStatusBarHeight } from '@/utils/system.js';
    import { useUserStore } from '@/stores/user.js';
    import { useI18n } from 'vue-i18n';
    
    const { t } = useI18n();

    const userStore = useUserStore();
    const hasCheckedInToday = ref(false);

    const toLogin = () => {
        // uni.navigateTo({ url: '/pages/login/login' });
        uni.navigateTo({ url: '/pages/login/login' });
    };

    const toSettings = () => {
        uni.navigateTo({ url: '/pages/settings/settings' });
    };

    const toEditProfile = () => {
        uni.navigateTo({ url: '/pages/user/edit-profile' });
    };

    const toMyFavorite = () => {
        if (!userStore.userinfo.id) {
            uni.showModal({
                title: t('common.tip'),
                content: t('user.profile.loginRequired'),
                success: (res) => {
                    if (res.confirm) {
                        uni.navigateTo({ url: '/pages/login/login' });
                    }
                }
            });
            return;
        }
        uni.navigateTo({ url: '/pages/favorite/favorite' });
    };

    const toMyDownload = () => {
        if (!userStore.userinfo.id) {
            uni.showModal({
                title: t('common.tip'),
                content: t('user.profile.loginRequired'),
                success: (res) => {
                    if (res.confirm) {
                        uni.navigateTo({ url: '/pages/login/login' });
                    }
                }
            });
            return;
        }
        uni.navigateTo({ url: '/pages/download/download' });
    };

    const toMyScore = () => {
        if (!userStore.userinfo.id) {
            uni.showModal({
                title: t('common.tip'),
                content: t('user.profile.loginRequired'),
                success: (res) => {
                    if (res.confirm) {
                        uni.navigateTo({ url: '/pages/login/login' });
                    }
                }
            });
            return;
        }
        uni.navigateTo({ url: '/pages/rate/rate' });
    };
    
    const toMembership = () => {
        uni.navigateTo({ url: '/pages/membership/membership' });
    };

    const toFAQ = () => {
        uni.navigateTo({
            url: '/pages/notice/detail?id=2&name=常见问题'
        });
    };

    const onService = () => {
        console.log('onService');
    };

    const onFeedback = () => {
        uni.navigateTo({ url: '/pages/feedback/feedback' });
    };

    const onExit = () => {
        userStore.clearUserData();
    };

    const checkin = async() => {
        if (hasCheckedInToday.value) {
            uni.showToast({
                title: '今日已签到',
                icon: 'none'
            });
            return;
        }

        const currentEnergy = userStore.userinfo.profile.energy || 0;
        
        // 发送签到请求
        const res = await apiPostProfile({
            energy: currentEnergy + 1
        });
        console.log(res);

        if (res.code === 200) {
            // 存储签到状态
            userStore.userinfo.profile.energy = currentEnergy + 1;
        
            // 标记今日已签到
            hasCheckedInToday.value = true;

            const today = new Date().toISOString().split('T')[0];
            uni.setStorageSync('lastCheckinDate', today);
            
            uni.showToast({
                title: '签到成功，获得1点能量',
                icon: 'success'
            });
        } else {
            uni.showToast({
                title: '签到失败',
                icon: 'none'
            });
        }
    };

    const appMenus = computed(() => [
        {
            left_icon: 'heart-filled',
            left_text: t('user.profile.myFavorite'),
            right_text: '12',
            right_icon: 'forward',
            click: toMyFavorite
        },
        {
            left_icon: 'download-filled',
            left_text: t('user.profile.myDownload'),
            right_text: '3',
            right_icon: 'forward',
            click: toMyDownload
        },
        {
            left_icon: 'star-filled',
            left_text: t('user.profile.myScore'),
            right_text: '',
            right_icon: 'forward',
            click: toMyScore
        }
    ]);

    const sysMenus = computed(() => [
        // {
        //     left_icon: 'vip-filled',
        //     left_text: t('user.profile.subscription'),
        //     right_text: '',
        //     right_icon: 'right',
        //     click: toMembership
        // },
        {
            left_icon: 'help-filled',
            left_text: t('user.profile.question'),
            right_text: '',
            right_icon: 'right',
            click: toFAQ
        },
        // #ifdef MP-WEIXIN
        {
            left_icon: 'chatboxes-filled',
            left_text: t('user.profile.support'),
            right_text: '',
            right_icon: 'right',
            click: onService
        },
        // #endif
        {
            left_icon: 'chat-filled',
            left_text: t('user.profile.feedback'),
            right_text: '',
            right_icon: 'right',
            click: onFeedback
        },
        {
            left_icon: 'gear-filled',
            left_text: t('user.profile.settings'),
            right_text: '',
            right_icon: 'right',
            click: toSettings
        }
    ]);

    const exitMenus = computed(() => [
        {
            left_icon: '/static/icons/exit-to-app.svg',
            left_text: t('user.profile.exit'),
            right_text: t('user.profile.exitText'),
            right_icon: '',
            click: onExit
        }
    ]);

    onShow(() => {
        // 检查是否已登录，已登录则获取最新用户信息
        if (Object.keys(userStore.userinfo).length > 0) {
            userStore.setUserInfo();
        }
        
        // 检查今日是否已签到
        const lastCheckinDate = uni.getStorageSync('lastCheckinDate');
        const today = new Date().toISOString().split('T')[0];
        hasCheckedInToday.value = lastCheckinDate === today;
    });
</script>

<style lang="scss" scoped>
    .layout {
        background-color: #f5f5f5;
        min-height: 100vh;

        .userInfo {
            display: flex;
            flex-direction: column;
            padding: 0 30rpx 30rpx;
            min-height: 320rpx;
            background: #fff;
            margin-bottom: 20rpx;
            position: relative;
            overflow: hidden;

            &.not-logged-in {
                background: #f5f5f5;
            }

            .decorative-bg {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
                pointer-events: none;

                .bg-circle {
                    position: absolute;
                    border-radius: 50%;
                    opacity: 0.05;
                    background: linear-gradient(135deg, $wp-theme-color 0%, darken($wp-theme-color, 8%) 100%);
                }

                .circle-1 {
                    width: 300rpx;
                    height: 300rpx;
                    top: -100rpx;
                    right: -50rpx;
                }

                .circle-2 {
                    width: 200rpx;
                    height: 200rpx;
                    bottom: -50rpx;
                    left: -30rpx;
                }

                .circle-3 {
                    width: 150rpx;
                    height: 150rpx;
                    top: 50%;
                    left: 20%;
                }
            }

            .user-content {
                display: flex;
                align-items: flex-start;
                margin-top: 20rpx;
                gap: 24rpx;
                position: relative;
                z-index: 1;
            }

            .avater {
                width: 140rpx;
                height: 140rpx;
                border-radius: 50%;
                overflow: hidden;
                position: relative;
                z-index: 1;
                border: 3rpx solid #fff;
                box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);

                image {
                    width: 100%;
                    height: 100%;
                }

                .avatar-ring {
                    position: absolute;
                    top: -3rpx;
                    left: -3rpx;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    border: 3rpx solid transparent;
                    border-top-color: $wp-theme-color;
                    border-right-color: #ff6b9d;
                    animation: rotate 3s linear infinite;
                }
            }

            .user-details {
                flex: 1;
                position: relative;
                z-index: 1;
                min-width: 0;
            }

            .details-top {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12rpx;
            }

            .name-row {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 8rpx;
                flex: 1;
                min-width: 0;
            }

            .name {
                font-size: 36rpx;
                color: #1a1a1a;
                font-weight: 700;
                letter-spacing: 0.5rpx;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .vip-badge {
                display: inline-flex;
                align-items: center;
                gap: 4rpx;
                padding: 4rpx 12rpx;
                background: linear-gradient(135deg, $wp-theme-color 0%, darken($wp-theme-color, 8%) 100%);
                color: #fff;
                font-size: 18rpx;
                font-weight: 600;
                border-radius: 16rpx;
                white-space: nowrap;
            }

            .non-vip-badge {
                display: inline-flex;
                align-items: center;
                gap: 4rpx;
                padding: 4rpx 12rpx;
                background: rgba($wp-theme-color, 0.08);
                color: #28B389;
                font-size: 18rpx;
                font-weight: 600;
                border-radius: 16rpx;
                white-space: nowrap;
                cursor: pointer;
                transition: all 0.3s;

                &:active {
                    background: rgba($wp-theme-color, 0.15);
                    transform: scale(0.95);
                }
            }

            .edit-btn {
                padding: 6rpx 16rpx;
                background: rgba(40, 179, 137, 0.08);
                color: #28B389;
                font-size: 20rpx;
                font-weight: 600;
                border-radius: 12rpx;
                cursor: pointer;
                transition: all 0.3s;
                white-space: nowrap;

                &:active {
                    background: rgba(40, 179, 137, 0.15);
                    transform: scale(0.95);
                }
            }

            .user-description {
                font-size: 24rpx;
                color: #666;
                line-height: 1.4;
                margin-bottom: 12rpx;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .user-info-row {
                display: flex;
                align-items: center;
                gap: 16rpx;
                flex-wrap: wrap;
            }

            .info-item {
                display: flex;
                align-items: center;
                gap: 6rpx;
                font-size: 22rpx;
                color: #999;
                white-space: nowrap;
            }

            .checkin-section {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 30rpx;
                padding: 20rpx;
                background: rgba($wp-theme-color, 0.05);
                border-radius: 16rpx;
                position: relative;
                z-index: 1;
            }

            .energy-info {
                display: flex;
                align-items: center;
                gap: 12rpx;
            }

            .energy-text {
                font-size: 28rpx;
                color: #333;
                font-weight: 600;
            }

            .checkin-btn {
                display: flex;
                align-items: center;
                gap: 6rpx;
                padding: 10rpx 24rpx;
                background: rgba(40, 179, 137, 0.08);
                color: #28B389;
                font-size: 24rpx;
                font-weight: 600;
                border-radius: 20rpx;
                cursor: pointer;
                transition: all 0.3s;
                border: 1rpx solid rgba(40, 179, 137, 0.2);

                &:active:not(.checked-in) {
                    background: rgba(40, 179, 137, 0.15);
                    transform: scale(0.95);
                }

                &.checked-in {
                    background: rgba(100, 100, 100, 0.08);
                    color: #999;
                    border-color: rgba(100, 100, 100, 0.2);
                    cursor: not-allowed;
                }
            }

            .not-logged-in-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding-top: 40rpx;
            }

            .app-name {
                font-size: 40rpx;
                color: #333;
                font-weight: 600;
                padding-bottom: 12rpx;
            }

            .app-desc {
                font-size: 28rpx;
                color: #999;
                margin-bottom: 40rpx;
            }

            .login-btn {
                margin-top: 20rpx;
                width: 300rpx;
                height: 80rpx;
                background: $wp-theme-color;
                color: #fff;
                font-size: 32rpx;
                font-weight: 600;
                border-radius: 40rpx;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;

                &:active {
                    background: darken($wp-theme-color, 5%);
                    transform: scale(0.95);
                }

                &::after {
                    border: none;
                }
            }
        }

        .stats-section {
            display: flex;
            gap: 20rpx;
            padding: 0 30rpx;
            margin-bottom: 30rpx;

            .stats-card {
                flex: 1;
                background: #fff;
                border-radius: 20rpx;
                padding: 30rpx 20rpx 24rpx;
                display: flex;
                flex-direction: column;
                position: relative;
                overflow: hidden;
                transition: all 0.3s;
                box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);

                &:active {
                    transform: translateY(-4rpx) scale(0.98);
                    box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.12);
                }

                .card-bg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    transition: opacity 0.3s;
                }

                .card-decoration {
                    position: absolute;
                    width: 120rpx;
                    height: 120rpx;
                    border-radius: 50%;
                    opacity: 0.08;
                    pointer-events: none;
                }

                &.heart-card {
                    .card-bg {
                        background: linear-gradient(135deg, rgba(255, 107, 157, 0.1) 0%, rgba(255, 107, 157, 0.05) 100%);
                    }
                    .decoration-1 {
                        background: #ff6b9d;
                        top: -30rpx;
                        right: -30rpx;
                    }
                }

                &.download-card {
                    .card-bg {
                        background: linear-gradient(135deg, rgba($wp-theme-color, 0.1) 0%, rgba($wp-theme-color, 0.05) 100%);
                    }
                    .decoration-2 {
                        background: $wp-theme-color;
                        bottom: -30rpx;
                        left: -30rpx;
                    }
                }

                &.star-card {
                    .card-bg {
                        background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%);
                    }
                    .decoration-3 {
                        background: #ffc107;
                        top: -20rpx;
                        left: -20rpx;
                    }
                }

                &:active .card-bg {
                    opacity: 1;
                }

                .stats-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16rpx;
                    position: relative;
                    z-index: 1;
                }

                .stats-icon {
                    width: 64rpx;
                    height: 64rpx;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    position: relative;
                    z-index: 1;
                    transition: all 0.3s;

                    &.heart {
                        background: linear-gradient(135deg, rgba(255, 107, 157, 0.15) 0%, rgba(255, 107, 157, 0.08) 100%);
                        box-shadow: 0 4rpx 12rpx rgba(255, 107, 157, 0.2);
                    }

                    &.download {
                        background: linear-gradient(135deg, rgba($wp-theme-color, 0.15) 0%, rgba($wp-theme-color, 0.08) 100%);
                        box-shadow: 0 4rpx 12rpx rgba($wp-theme-color, 0.2);
                    }

                    &.star {
                        background: linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 193, 7, 0.08) 100%);
                        box-shadow: 0 4rpx 12rpx rgba(255, 193, 7, 0.2);
                    }
                }

                &:active .stats-icon {
                    transform: scale(1.1);
                }

                .stats-number {
                    font-size: 40rpx;
                    font-weight: 700;
                    background: linear-gradient(135deg, #333 0%, #666 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    line-height: 1.2;
                    flex: 1;
                    text-align: right;
                    padding-right: 8rpx;
                }

                .stats-label {
                    font-size: 24rpx;
                    color: #999;
                    font-weight: 500;
                    text-align: right;
                    position: relative;
                    z-index: 1;
                    margin-top: 4rpx;
                }
            }
        }

        @keyframes rotate {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }

        .section {
            margin-bottom: 20rpx;
            padding: 0 30rpx;

            .list {
                .row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 30rpx;
                    height: 100rpx;
                    position: relative;
                    background: #fff;
                    margin-bottom: 20rpx;
                    border-radius: 16rpx;
                    transition: all 0.3s;
                    
                    &:active {
                        opacity: 0.8;
                        transform: scale(0.99);
                    }
                    
                    &:last-child {
                        margin-bottom: 0;
                    }

                    .left {
                        display: flex;
                        align-items: center;

                        .icon {
                            width: 48rpx;
                            height: 48rpx;
                            flex-shrink: 0;
                            filter: brightness(0) saturate(100%) invert(52%) sepia(88%) saturate(485%) hue-rotate(106deg) brightness(91%) contrast(87%);
                        }

                        .text {
                            padding-left: 20rpx;
                            color: #333;
                            font-size: 32rpx;
                        }
                    }

                    .right {
                        display: flex;
                        align-items: center;

                        .text {
                            font-size: 28rpx;
                            color: #999;
                            margin-right: 12rpx;
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