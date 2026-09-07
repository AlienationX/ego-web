<template>
    <view class="avatar-preview-overlay" :class="{ 'is-landscape': isLandscape }">
        <!-- 场景 1：圆形头像聚光灯遮罩 (Circle Mode) -->
        <view v-if="activeMode === 'circle'" class="circle-overlay">
            <view class="circle-mask-hole">
                <view class="circle-border-ring"></view>
            </view>
            <view class="circle-hint">
                <text class="hint-text">{{ t('avatar.circleMock') }}</text>
            </view>
        </view>

        <!-- 场景 2：圆角方块标准头像遮罩 (Square Mode) -->
        <view v-else-if="activeMode === 'square'" class="square-overlay">
            <view class="square-mask-hole">
                <view class="square-border-ring"></view>
            </view>
            <view class="square-hint">
                <text class="hint-text">{{ t('avatar.squareMock') }}</text>
            </view>
        </view>

        <!-- 场景 3：社交名片主页模拟器 (Profile Card Mockup) -->
        <view v-else-if="activeMode === 'card'" class="profile-card-mockup">
            <!-- 顶部社交主页状态模拟 -->
            <view class="profile-top-bar">
                <mdi-icon path="/static/icons/arrow-left.svg" size="20px" color="#ffffff"></mdi-icon>
                <text class="profile-username">{{ userStore.userinfo?.nickname || 'Ego Explorer' }}</text>
                <mdi-icon path="/static/icons/dots-horizontal.svg" size="20px" color="#ffffff"></mdi-icon>
            </view>

            <!-- 居中名片主体 -->
            <view class="profile-card-body">
                <view class="profile-avatar-wrapper">
                    <image class="profile-avatar-img" :src="avatarUrl" mode="aspectFill"></image>
                    <view class="profile-verified-badge">
                        <mdi-icon path="/static/icons/check-decagram.svg" size="16px" color="#38bdf8"></mdi-icon>
                    </view>
                </view>

                <text class="profile-name">{{ userStore.userinfo?.nickname || '视觉探索者' }}</text>
                <text class="profile-bio">记录光影与生活 · 壁纸与视觉美学爱好者 ✨</text>

                <!-- 社交数据模拟 -->
                <view class="profile-stats">
                    <view class="stat-item">
                        <text class="stat-num">1.2k</text>
                        <text class="stat-lbl">关注</text>
                    </view>
                    <view class="stat-item">
                        <text class="stat-num">8.9k</text>
                        <text class="stat-lbl">粉丝</text>
                    </view>
                    <view class="stat-item">
                        <text class="stat-num">24.5k</text>
                        <text class="stat-lbl">获赞</text>
                    </view>
                </view>

                <view class="profile-actions-mock">
                    <view class="mock-btn mock-btn--primary">编辑资料</view>
                    <view class="mock-btn mock-btn--secondary">分享主页</view>
                </view>
            </view>
        </view>

        <!-- 底部浮动场景切换胶囊 -->
        <view class="overlay-mode-switcher" @click.stop>
            <view class="switcher-pill" :class="{ 'is-active': activeMode === 'circle' }"
                @click="switchMode('circle')">
                <text>{{ t('avatar.shapeCircle') }}</text>
            </view>
            <view class="switcher-pill" :class="{ 'is-active': activeMode === 'square' }"
                @click="switchMode('square')">
                <text>{{ t('avatar.shapeSquare') }}</text>
            </view>
            <view class="switcher-pill" :class="{ 'is-active': activeMode === 'card' }"
                @click="switchMode('card')">
                <text>{{ t('avatar.profileMock') }}</text>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user.js';

const props = defineProps({
    avatarUrl: {
        type: String,
        default: '',
    },
});

const { t } = useI18n();
const userStore = useUserStore();

// 预览模式：'circle' | 'square' | 'card'
const activeMode = ref('circle');

const switchMode = (mode) => {
    activeMode.value = mode;
    try {
        uni.vibrateShort?.();
    } catch (e) { }
};
</script>

<style lang="scss" scoped>
.avatar-preview-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    pointer-events: auto;
    z-index: 20;
}

// 场景 1：圆形透视镂空
.circle-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;

    .circle-mask-hole {
        position: relative;
        width: 520rpx;
        height: 520rpx;
        border-radius: 50%;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7); // 聚光灯镂空核心
        overflow: visible;

        .circle-border-ring {
            position: absolute;
            top: -4rpx;
            left: -4rpx;
            right: -4rpx;
            bottom: -4rpx;
            border-radius: 50%;
            border: 4rpx solid rgba(255, 255, 255, 0.85);
            box-shadow: 0 0 24rpx rgba(255, 255, 255, 0.3);
        }
    }

    .circle-hint {
        margin-top: 48rpx;
        padding: 8rpx 24rpx;
        border-radius: 20rpx;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(8px);

        .hint-text {
            font-size: 24rpx;
            font-weight: 600;
            color: #ffffff;
            letter-spacing: 1rpx;
        }
    }
}

// 场景 2：圆角方块透视镂空
.square-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;

    .square-mask-hole {
        position: relative;
        width: 520rpx;
        height: 520rpx;
        border-radius: 110rpx; // Apple 风格 Squircle
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
        overflow: visible;

        .square-border-ring {
            position: absolute;
            top: -4rpx;
            left: -4rpx;
            right: -4rpx;
            bottom: -4rpx;
            border-radius: 112rpx;
            border: 4rpx solid rgba(255, 255, 255, 0.85);
            box-shadow: 0 0 24rpx rgba(255, 255, 255, 0.3);
        }
    }

    .square-hint {
        margin-top: 48rpx;
        padding: 8rpx 24rpx;
        border-radius: 20rpx;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(8px);

        .hint-text {
            font-size: 24rpx;
            font-weight: 600;
            color: #ffffff;
            letter-spacing: 1rpx;
        }
    }
}

// 场景 3：社交名片主页模拟器
.profile-card-mockup {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.82);
    backdrop-filter: blur(28px);
    display: flex;
    flex-direction: column;
    padding: 90rpx 40rpx 0;
    box-sizing: border-box;

    .profile-top-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 50rpx;

        .profile-username {
            font-size: 32rpx;
            font-weight: 700;
            color: #ffffff;
        }
    }

    .profile-card-body {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40rpx 32rpx;
        border-radius: 36rpx;
        background: rgba(255, 255, 255, 0.08);
        border: 1rpx solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.35);

        .profile-avatar-wrapper {
            position: relative;
            width: 180rpx;
            height: 180rpx;
            margin-bottom: 24rpx;

            .profile-avatar-img {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                border: 4rpx solid #ffffff;
                box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.25);
            }

            .profile-verified-badge {
                position: absolute;
                bottom: 4rpx;
                right: 4rpx;
                background: #ffffff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        }

        .profile-name {
            font-size: 36rpx;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 8rpx;
        }

        .profile-bio {
            font-size: 24rpx;
            color: #cbd5e1;
            text-align: center;
            line-height: 1.4;
            margin-bottom: 32rpx;
        }

        .profile-stats {
            display: flex;
            align-items: center;
            justify-content: space-around;
            width: 100%;
            padding: 20rpx 0;
            border-top: 1rpx solid rgba(255, 255, 255, 0.1);
            border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
            margin-bottom: 32rpx;

            .stat-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4rpx;

                .stat-num {
                    font-size: 30rpx;
                    font-weight: 800;
                    color: #ffffff;
                }

                .stat-lbl {
                    font-size: 22rpx;
                    color: #94a3b8;
                }
            }
        }

        .profile-actions-mock {
            display: flex;
            align-items: center;
            gap: 20rpx;
            width: 100%;

            .mock-btn {
                flex: 1;
                height: 72rpx;
                border-radius: 20rpx;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 26rpx;
                font-weight: 700;

                &--primary {
                    background: #4f46e5;
                    color: #ffffff;
                }

                &--secondary {
                    background: rgba(255, 255, 255, 0.12);
                    color: #ffffff;
                }
            }
        }
    }
}

// 底部浮动场景切换胶囊
.overlay-mode-switcher {
    position: absolute;
    bottom: 80rpx;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 8rpx 10rpx;
    border-radius: 40rpx;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(16px);
    border: 1rpx solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.4);
    z-index: 30;

    .switcher-pill {
        padding: 10rpx 24rpx;
        border-radius: 30rpx;
        font-size: 22rpx;
        font-weight: 700;
        color: #94a3b8;
        cursor: pointer;
        transition: all 0.2s ease;

        &.is-active {
            background: #4f46e5;
            color: #ffffff;
            box-shadow: 0 4rpx 12rpx rgba(79, 70, 229, 0.35);
        }
    }
}
</style>
