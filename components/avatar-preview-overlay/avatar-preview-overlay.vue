<template>
    <view class="avatar-preview-overlay">
        <!-- 场景 1：底层动态聚焦镂空遮罩 (预览模式，仅当图片读取完毕才显示圆形阴影) -->
        <view v-if="activeMode === 'preview' && !isCardClosing && isMaskStageVisible" class="avatar-mask-stage">
            <view class="avatar-image-mask-box">
                <view class="avatar-mask-hole"
                    :class="{ 'is-smooth': !isDraggingRadius }"
                    :style="{ borderRadius: currentRadius + 'rpx' }">
                    <view class="avatar-border-ring"
                        :class="{ 'is-smooth': !isDraggingRadius }"
                        :style="{ borderRadius: currentRadius + 'rpx' }"></view>
                </view>
            </view>
        </view>

        <!-- 场景 2：主流 APP 沉浸式灵动社交名片舞台 (纯 GPU 弹性动效，超丝滑，零重排，零闪屏) -->
        <view v-if="activeMode === 'card' || isCardClosing" class="profile-card-overlay" @click.stop="closeCard">
            <!-- 沉浸式暗黑景深遮罩 (点击可直接退出) -->
            <view class="card-backdrop" :class="{ 'is-closing': isCardClosing }"></view>

            <!-- 居中灵动社交名片容器 (纯 Transform + Opacity 弹性过冲与微倾斜浮现) -->
            <view class="profile-card-wrapper" :class="isCardClosing ? 'is-closing' : 'is-entering'" @click.stop>
                <view class="profile-card-box">
                    <!-- 顶部环境光感光晕饰条 -->
                    <view class="card-ambient-glow"></view>

                    <!-- 用户头部信息行 -->
                    <view class="profile-header-row">
                        <view class="profile-avatar-wrapper" :style="{ borderRadius: cardAvatarRadius }">
                            <image class="profile-avatar-img" :src="avatarUrl" mode="aspectFill"
                                :style="{ borderRadius: cardAvatarRadius }"></image>
                            <view class="profile-verified-badge">
                                <mdi-icon path="/static/icons/shield-check.svg" size="14px" color="#38bdf8"></mdi-icon>
                            </view>
                        </view>
                        <view class="profile-header-info">
                            <text class="profile-name">{{ userStore.userinfo?.nickname || '视觉探索者' }}</text>
                            <text class="profile-bio">记录光影与生活 · 壁纸与视觉美学爱好者 ✨</text>
                        </view>
                    </view>

                    <!-- 社交数据统计栏 -->
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

                    <!-- 模拟快捷交互按钮 -->
                    <view class="profile-actions">
                        <view class="card-btn card-btn--primary">编辑资料</view>
                        <view class="card-btn card-btn--secondary">分享主页</view>
                    </view>
                </view>

                <!-- 底部轻量提示微文案 -->
                <view class="card-dismiss-hint" :class="{ 'is-closing': isCardClosing }">
                    <mdi-icon path="/static/icons/chevron-down.svg" size="14px" color="rgba(255, 255, 255, 0.45)"></mdi-icon>
                    <text class="hint-text">轻触空白区域返回</text>
                </view>
            </view>
        </view>

        <!-- 控制栏容器（含固定高度防抖滑块 + 极简双态模式胶囊） -->
        <view class="overlay-controls-panel" :class="isControlsVisible ? 'is-entering' : 'is-leaving'" @click.stop>
            <!-- 实时圆角微调滑块栏（名片模式下平滑下沉折叠，退出后顺滑浮现） -->
            <view class="radius-slider-bar" :class="{ 'is-collapsed': isCardShowing }">
                <view class="slider-info">
                    <view class="slider-title-group">
                        <mdi-icon path="/static/icons/tune-variant.svg" size="14px" color="#818cf8"></mdi-icon>
                        <text class="slider-label">圆角调节</text>
                    </view>
                    <text class="slider-val-tag">{{ radiusDescription }}</text>
                </view>

                <view class="slider-track-wrap">
                    <view class="slider-icon-btn" @click.stop="setPresetRadius('square')">
                        <mdi-icon path="/static/icons/checkbox-blank-outline.svg" size="16px" color="#94a3b8"></mdi-icon>
                    </view>
                    <slider class="radius-slider"
                        :min="0"
                        :max="374"
                        :step="2"
                        :value="currentRadius"
                        activeColor="#4f46e5"
                        backgroundColor="rgba(255, 255, 255, 0.18)"
                        block-size="16"
                        block-color="#ffffff"
                        @changing="onRadiusChanging"
                        @change="onRadiusChange" />
                    <view class="slider-icon-btn" @click.stop="setPresetRadius('circle')">
                        <mdi-icon path="/static/icons/checkbox-blank-circle-outline.svg" size="16px" color="#94a3b8"></mdi-icon>
                    </view>
                </view>
            </view>

            <!-- 底部浮动场景切换胶囊（即时高亮反馈，操作流畅） -->
            <view class="overlay-mode-switcher">
                <view class="switcher-pill" :class="{ 'is-active': !isCardShowing }"
                    @click.stop="switchMode('preview')">
                    <text>{{ t('avatar.avatarPreview') || '头像预览' }}</text>
                </view>
                <view class="switcher-pill" :class="{ 'is-active': isCardShowing }"
                    @click.stop="switchMode('card')">
                    <text>{{ t('avatar.profileMock') || '社交名片' }}</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user.js';
import { useSettingsStore } from '@/stores/settings.js';

const props = defineProps({
    avatarUrl: {
        type: String,
        default: '',
    },
    showControls: {
        type: Boolean,
        default: true,
    },
    isImageLoaded: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['card-active-change']);

const isControlsVisible = computed(() => {
    return props.showControls !== false;
});

// 仅当当前图片读取完毕后才呈现圆形阴影，未加载时保持纯净
const isMaskStageVisible = computed(() => {
    return props.isImageLoaded !== false;
});

const { t } = useI18n();
const userStore = useUserStore();
const settingsStore = useSettingsStore();

// 模式：'preview' (头像聚焦+圆角调节) | 'card' (社交名片沉浸式卡片)
const activeMode = ref('preview');

// 名片退场动效状态
const isCardClosing = ref(false);
let closeTimer = null;

// 是否处于名片激活状态
const isCardShowing = computed(() => {
    return activeMode.value === 'card';
});

// 从 settingsStore 读取初始圆角值（默认正圆 374rpx）
const getInitialRadius = () => {
    const saved = settingsStore.options.avatarRadius;
    if (typeof saved === 'number' && !isNaN(saved)) {
        return Math.min(Math.max(saved, 0), 374);
    }
    return 374;
};

// 圆角实时调节
const currentRadius = ref(getInitialRadius());
const isDraggingRadius = ref(false);

const saveRadiusPreference = (val) => {
    settingsStore.options.avatarRadius = val;
};

// 名片头像圆角动态同步换算：名片头像尺寸 140rpx * 140rpx，最大正圆半径为 70rpx
const cardAvatarRadius = computed(() => {
    const ratio = currentRadius.value / 374;
    return (ratio * 70).toFixed(1) + 'rpx';
});

// 圆角状态文案
const radiusDescription = computed(() => {
    if (currentRadius.value >= 370) return '正圆 (50%)';
    if (currentRadius.value <= 6) return '直角 (0rpx)';
    if (currentRadius.value >= 42 && currentRadius.value <= 54) return '微信 (48rpx)';
    return `${currentRadius.value}rpx`;
});

const onRadiusChanging = (e) => {
    isDraggingRadius.value = true;
    currentRadius.value = Number(e.detail.value);
};

const onRadiusChange = (e) => {
    const val = Number(e.detail.value);
    currentRadius.value = val;
    isDraggingRadius.value = false;
    saveRadiusPreference(val);
};

// 点击两侧快捷图标切圆角
const setPresetRadius = (type) => {
    if (type === 'circle') {
        currentRadius.value = 374;
    } else if (type === 'square') {
        currentRadius.value = currentRadius.value === 0 ? 48 : 0;
    }
    saveRadiusPreference(currentRadius.value);
};

// 关闭名片：0.42s 丝滑轻盈收拢，零闪屏零重排
const closeCard = () => {
    if (isCardClosing.value) return;
    isCardClosing.value = true;
    if (closeTimer) clearTimeout(closeTimer);

    closeTimer = setTimeout(() => {
        activeMode.value = 'preview';
        isCardClosing.value = false;
    }, 420);
};

// 模式切换
const switchMode = (mode) => {
    if (mode === activeMode.value && !isCardClosing.value) return;

    if (activeMode.value === 'card' && mode === 'preview') {
        closeCard();
        return;
    }

    if (mode === 'card') {
        if (closeTimer) clearTimeout(closeTimer);
        isCardClosing.value = false;
        activeMode.value = 'card';
        return;
    }

    activeMode.value = mode;
};

onUnmounted(() => {
    if (closeTimer) clearTimeout(closeTimer);
});
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
    pointer-events: none;
    z-index: 20;
    overflow: hidden;
}

// 场景 1：聚焦遮罩舞台（居中对齐图片）
.avatar-mask-stage {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    overflow: hidden;
    z-index: 22;
    animation: maskStageFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

// 限制在图片范围内的容器（精准 750rpx × 750rpx）
.avatar-image-mask-box {
    position: relative;
    width: 750rpx;
    height: 750rpx;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

// 聚焦透视镂空孔洞（精准 748rpx × 748rpx）
.avatar-mask-hole {
    position: relative;
    width: 748rpx;
    height: 748rpx;
    box-shadow: 0 0 0 400rpx rgba(0, 0, 0, 0.78);
    overflow: visible;
    transform: translateZ(0);
    -webkit-transform: translateZ(0);

    &.is-smooth {
        transition: border-radius 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    // 聚焦外圈高光环（带微呼吸发光脉冲动效）
    .avatar-border-ring {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border: 3rpx solid rgba(255, 255, 255, 0.9);
        box-sizing: border-box;
        pointer-events: none;
        animation: focusRingPulse 3.5s ease-in-out infinite;

        &.is-smooth {
            transition: border-radius 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
    }
}

// 场景 2：主流 APP 沉浸式灵动社交名片舞台
.profile-card-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
    z-index: 26;
    overflow: hidden;

    // 沉浸式暗黑景深遮罩 (线性平滑淡入淡出，零闪烁)
    .card-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(8, 12, 22, 0.92);
        animation: backdropFadeIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;

        &.is-closing {
            animation: backdropFadeOut 0.42s cubic-bezier(0.25, 0.1, 0.25, 1) both;
        }
    }

    // 名片整体容器（居中定位 + 弹性缩放微倾斜）
    .profile-card-wrapper {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        align-items: center;
        will-change: transform, opacity;

        &.is-entering {
            animation: cardSpringEnter 0.65s cubic-bezier(0.18, 0.9, 0.3, 1.1) both;
        }

        &.is-closing {
            animation: cardSpringLeave 0.42s cubic-bezier(0.3, 0, 0.2, 1) both;
        }

        // 名片主体卡盒
        .profile-card-box {
            position: relative;
            width: 620rpx;
            height: 450rpx;
            box-sizing: border-box;
            padding: 32rpx;
            border-radius: 36rpx;
            background: linear-gradient(155deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 60%, rgba(9, 13, 22, 1) 100%);
            border: 1rpx solid rgba(255, 255, 255, 0.16);
            box-shadow: 0 32rpx 72rpx -12rpx rgba(0, 0, 0, 0.72),
                        0 0 0 1rpx rgba(255, 255, 255, 0.06),
                        inset 0 1rpx 0 rgba(255, 255, 255, 0.2);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;

            // 顶部环境光饰条
            .card-ambient-glow {
                position: absolute;
                top: 0;
                left: 10%;
                right: 10%;
                height: 2rpx;
                background: linear-gradient(90deg, transparent, rgba(129, 140, 248, 0.6), rgba(255, 255, 255, 0.8), rgba(129, 140, 248, 0.6), transparent);
                pointer-events: none;
            }

            // 用户头部信息行
            .profile-header-row {
                display: flex;
                align-items: center;
                gap: 24rpx;
                width: 100%;

                .profile-avatar-wrapper {
                    position: relative;
                    width: 140rpx;
                    height: 140rpx;
                    flex-shrink: 0;
                    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.35);
                    transition: border-radius 0.3s ease;

                    .profile-avatar-img {
                        width: 100%;
                        height: 100%;
                        border: 3rpx solid rgba(255, 255, 255, 0.92);
                        box-sizing: border-box;
                        display: block;
                        transition: border-radius 0.3s ease;
                    }

                    .profile-verified-badge {
                        position: absolute;
                        bottom: 0;
                        right: 0;
                        background: #ffffff;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
                    }
                }

                .profile-header-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    overflow: hidden;

                    .profile-name {
                        font-size: 32rpx;
                        font-weight: 800;
                        color: #ffffff;
                        line-height: 1.25;
                        margin-bottom: 8rpx;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        letter-spacing: 0.5rpx;
                    }

                    .profile-bio {
                        font-size: 21rpx;
                        color: #cbd5e1;
                        line-height: 1.4;
                        display: -webkit-box;
                        -webkit-box-orient: vertical;
                        -webkit-line-clamp: 2;
                        overflow: hidden;
                    }
                }
            }

            // 社交数据统计栏
            .profile-stats {
                display: flex;
                align-items: center;
                justify-content: space-around;
                width: 100%;
                padding: 14rpx 0;
                border-top: 1rpx solid rgba(255, 255, 255, 0.08);
                border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);

                .stat-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2rpx;

                    .stat-num {
                        font-size: 28rpx;
                        font-weight: 800;
                        color: #ffffff;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }

                    .stat-lbl {
                        font-size: 20rpx;
                        color: #94a3b8;
                    }
                }
            }

            // 快捷交互按钮
            .profile-actions {
                display: flex;
                align-items: center;
                gap: 16rpx;
                width: 100%;

                .card-btn {
                    flex: 1;
                    height: 62rpx;
                    border-radius: 18rpx;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24rpx;
                    font-weight: 700;
                    transition: transform 0.15s ease, opacity 0.15s ease;

                    &:active {
                        transform: scale(0.96);
                        opacity: 0.85;
                    }

                    &--primary {
                        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                        color: #ffffff;
                        box-shadow: 0 4rpx 16rpx rgba(79, 70, 229, 0.4);
                    }

                    &--secondary {
                        background: rgba(255, 255, 255, 0.1);
                        color: #ffffff;
                        border: 1rpx solid rgba(255, 255, 255, 0.12);
                    }
                }
            }
        }

        // 底部轻量提示微文案
        .card-dismiss-hint {
            display: flex;
            align-items: center;
            gap: 6rpx;
            margin-top: 36rpx;
            opacity: 0.65;
            animation: hintFadeIn 0.45s ease 0.35s both;

            &.is-closing {
                opacity: 0;
                transition: opacity 0.25s ease;
            }

            .hint-text {
                font-size: 22rpx;
                color: rgba(255, 255, 255, 0.7);
                letter-spacing: 0.5rpx;
            }
        }
    }
}

// 底部浮动控制总面板（参考 preview 时钟入场时长 0.8s 从容滑入）
.overlay-controls-panel {
    position: absolute;
    bottom: 9vh;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;
    z-index: 30;
    pointer-events: auto;

    &.is-entering {
        animation: panelSlideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        pointer-events: auto;
    }

    &.is-leaving {
        animation: panelSlideOut 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
        pointer-events: none !important;
    }
}

// 圆角微调滑动条栏（配合 CSS 过渡优雅收放）
.radius-slider-bar {
    width: 580rpx;
    height: 124rpx;
    box-sizing: border-box;
    padding: 14rpx 24rpx;
    border-radius: 28rpx;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1rpx solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 10rpx 28rpx rgba(0, 0, 0, 0.35);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    opacity: 1;
    transform: translate3d(0, 0, 0);
    transition: opacity 0.35s ease 0.05s, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1) 0.05s;

    &.is-collapsed {
        opacity: 0;
        transform: translate3d(0, 30rpx, 0);
        pointer-events: none !important;
        transition: opacity 0.22s ease, transform 0.22s ease;
    }

    .slider-info {
        height: 38rpx;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 4rpx;

        .slider-title-group {
            display: flex;
            align-items: center;
            gap: 8rpx;
            height: 38rpx;

            .slider-label {
                font-size: 20rpx;
                font-weight: 600;
                color: #94a3b8;
                line-height: 38rpx;
            }
        }

        .slider-val-tag {
            font-size: 20rpx;
            font-weight: 700;
            color: #818cf8;
            background: rgba(129, 140, 248, 0.15);
            padding: 0 14rpx;
            height: 36rpx;
            line-height: 36rpx;
            border-radius: 12rpx;
            min-width: 140rpx;
            text-align: center;
            white-space: nowrap;
            box-sizing: border-box;
        }
    }

    .slider-track-wrap {
        height: 48rpx;
        display: flex;
        align-items: center;
        gap: 12rpx;

        .slider-icon-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4rpx;
            cursor: pointer;

            &:active {
                opacity: 0.7;
            }
        }

        .radius-slider {
            flex: 1;
            margin: 0;
            padding: 0;
        }
    }
}

// 底部浮动场景切换胶囊（清爽的双态切换）
.overlay-mode-switcher {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 8rpx 10rpx;
    border-radius: 40rpx;
    background: rgba(15, 23, 42, 0.88);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1rpx solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.4);

    .switcher-pill {
        padding: 10rpx 28rpx;
        border-radius: 30rpx;
        font-size: 22rpx;
        font-weight: 700;
        color: #94a3b8;
        cursor: pointer;
        transition: all 0.25s ease;

        &:active {
            transform: scale(0.95);
        }

        &.is-active {
            background: #4f46e5;
            color: #ffffff;
            box-shadow: 0 4rpx 12rpx rgba(79, 70, 229, 0.35);
        }
    }
}

// ── 核心动效关键帧（100% GPU 线程，零重排，零掉帧） ──

// 聚焦白圈微呼吸光晕
@keyframes focusRingPulse {
    0%, 100% {
        border-color: rgba(255, 255, 255, 0.85);
        box-shadow: 0 0 14rpx rgba(255, 255, 255, 0.25), inset 0 0 10rpx rgba(255, 255, 255, 0.12);
    }
    50% {
        border-color: rgba(255, 255, 255, 1);
        box-shadow: 0 0 26rpx rgba(255, 255, 255, 0.65), inset 0 0 18rpx rgba(255, 255, 255, 0.3);
    }
}

// 遮罩舞台淡入
@keyframes maskStageFadeIn {
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}

// 背景暗幕淡入
@keyframes backdropFadeIn {
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}

// 背景暗幕淡出
@keyframes backdropFadeOut {
    0% {
        opacity: 1;
    }
    100% {
        opacity: 0;
    }
}

// 主流 APP 灵动卡片弹入：柔和弹性过冲 + 微倾斜微动效 (0.65s 沉浸丝滑)
@keyframes cardSpringEnter {
    0% {
        opacity: 0;
        transform: scale(0.82) translateY(64rpx) rotate(-2.2deg);
    }
    58% {
        opacity: 1;
        transform: scale(1.032) translateY(-6rpx) rotate(0.6deg);
    }
    80% {
        transform: scale(0.992) translateY(2rpx) rotate(-0.2deg);
    }
    100% {
        opacity: 1;
        transform: scale(1) translateY(0) rotate(0deg);
    }
}

// 主流 APP 灵动卡片轻盈收拢淡出 (0.42s 顺滑退场)
@keyframes cardSpringLeave {
    0% {
        opacity: 1;
        transform: scale(1) translateY(0) rotate(0deg);
    }
    100% {
        opacity: 0;
        transform: scale(0.85) translateY(44rpx) rotate(-1.5deg);
    }
}

// 底部提示微渐显
@keyframes hintFadeIn {
    0% {
        opacity: 0;
        transform: translateY(12rpx);
    }
    100% {
        opacity: 0.65;
        transform: translateY(0);
    }
}

@keyframes panelSlideIn {
    0% {
        opacity: 0;
        transform: translate3d(0, 100rpx, 0);
    }
    100% {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
}

@keyframes panelSlideOut {
    0% {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
    100% {
        opacity: 0;
        transform: translate3d(0, 120rpx, 0);
    }
}
</style>
