<template>
    <view
        v-if="mounted"
        class="wallpaper-preview-overlay"
        :class="[
            animState,
            settingsStore.isDark ? 'theme-dark' : 'theme-light',
            { 'is-dragging': isDragging }
        ]"
        :style="overlayRootStyle"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
    >
        <!-- 深色毛玻璃背景遮罩 (配合扩散与收缩节奏平滑淡入淡出，点击外部任意区域可收缩关闭) -->
        <view class="overlay-backdrop" :style="backdropStyle" @click.self="handleClose"></view>

        <!-- 居中悬浮画框大卡片 (基于 GPU transform scale+translate3d，带来极其明显的物理扩散与收缩轨迹) -->
        <view
            class="gallery-card-container"
            :style="motionContainerStyle"
        >
            <!-- 纯净高清壁纸主体 (彻底移除时钟，画面 100% 毫无遮挡呈现) -->
            <image
                class="card-wallpaper-img"
                :src="currentPicUrl"
                mode="aspectFill"
            />

            <!-- 卡片内右上角关闭按钮 (无边框，居中下移避开微信胶囊，展开时自然渐现) -->
            <view
                class="card-inner-close"
                :style="controlsVisibleStyle"
                @click.stop="handleClose"
            >
                <mdi-icon path="/static/icons/close.svg" size="18px" color="#ffffff" />
            </view>

            <!-- 底部操作栏：所有按钮彻底去除边框、去除阴影，纯粹通透呈现原图色彩 -->
            <view class="card-actions-bar" :style="controlsVisibleStyle">
                <!-- 功能 ①：收藏 (无边框无阴影) -->
                <view
                    class="action-mini-btn"
                    :class="{ 'is-favorited': currentInfo?.is_favorited }"
                    @click.stop="toggleFavorite"
                >
                    <uni-icons
                        type="heart-filled"
                        size="22"
                        :color="currentInfo?.is_favorited ? '#ef4444' : '#ffffff'"
                    />
                    <text class="mini-label">{{ currentInfo?.is_favorited ? '已收藏' : '收藏' }}</text>
                </view>

                <!-- 功能 ②：立即保存原图 (无边框无阴影，饱满主按键) -->
                <view class="action-core-btn" @click.stop="handleDownload">
                    <uni-icons type="download-filled" size="20" color="#ffffff" />
                    <text class="core-btn-text">保存原图</text>
                </view>

                <!-- 功能 ③：沉浸式试戴 (无边框无阴影，过渡进入 preview.vue) -->
                <view class="action-mini-btn" @click.stop="handleOpenFullPreview">
                    <mdi-icon path="/static/icons/fullscreen.svg" size="20px" color="#ffffff" />
                    <text class="mini-label">沉浸试戴</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useSettingsStore } from '@/stores/settings.js';
import { downloadPic } from '@/common/core.js';
import { apiPostActions } from '@/api/wallpaper.js';

const settingsStore = useSettingsStore();

// ── 核心状态 ──
const mounted = ref(false);
const animState = ref('idle'); // 'idle' | 'initial' | 'expanding' | 'expanded' | 'collapsing'

const previewList = ref([]);
const currentIndex = ref(0);
const startRect = ref(null);

// 拖拽手势
const isDragging = ref(false);
const dragY = ref(0);
let touchStartY = 0;
let touchStartX = 0;

const currentInfo = computed(() => {
    return previewList.value[currentIndex.value] || {};
});

const currentPicUrl = computed(() => {
    return currentInfo.value?.picurl || currentInfo.value?.smallPicurl || '';
});

// ── 物理运动学几何计算 (FLIP 模式：构建高帧率硬件加速扩散与收缩轨迹) ──
const motionTransformMatrix = computed(() => {
    if (!startRect.value) {
        return { deltaX: 0, deltaY: 0, scaleX: 0.6, scaleY: 0.6 };
    }
    const windowInfo = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync();
    const winW = windowInfo.windowWidth || 375;
    const winH = windowInfo.windowHeight || 812;

    // 目标卡片尺寸 (上下各 11.5vh，左右各 56rpx)
    const marginLR = (56 * winW) / 750;
    const targetW = winW - marginLR * 2;
    const targetH = winH * 0.77;

    // 目标卡片中心点
    const targetCenterX = winW / 2;
    const targetCenterY = winH / 2;

    // 起始卡片中心点
    const startW = startRect.value.width || 120;
    const startH = startRect.value.height || 180;
    const startCenterX = (startRect.value.left || 0) + startW / 2;
    const startCenterY = (startRect.value.top || 0) + startH / 2;

    const deltaX = Math.round(startCenterX - targetCenterX);
    const deltaY = Math.round(startCenterY - targetCenterY);
    const scaleX = Math.max(0.15, Number((startW / targetW).toFixed(4)));
    const scaleY = Math.max(0.15, Number((startH / targetH).toFixed(4)));

    return { deltaX, deltaY, scaleX, scaleY };
});

const overlayRootStyle = computed(() => {
    return {
        pointerEvents: animState.value === 'idle' ? 'none' : 'auto',
    };
});

// 背景遮罩动画：放慢并带有优雅渐变
const backdropStyle = computed(() => {
    if (animState.value === 'initial') {
        return { opacity: 0, backdropFilter: 'blur(0px)' };
    }
    if (animState.value === 'collapsing') {
        return {
            opacity: 0,
            backdropFilter: 'blur(0px)',
            transition: 'opacity 0.44s cubic-bezier(0.25, 1, 0.35, 1), backdrop-filter 0.44s ease',
        };
    }
    if (isDragging.value && dragY.value > 0) {
        const dragOpacity = Math.max(0.18, 1 - dragY.value / 360);
        return {
            opacity: dragOpacity,
            transition: 'none',
        };
    }
    return {
        opacity: 1,
        backdropFilter: 'blur(20px)',
        transition: 'opacity 0.56s cubic-bezier(0.2, 0.95, 0.28, 1), backdrop-filter 0.56s ease',
    };
});

// 操作按钮控件显隐（卡片扩散就绪时浮现，开始收缩时迅速隐退）
const controlsVisibleStyle = computed(() => {
    if (animState.value === 'expanded') {
        return {
            opacity: isDragging.value ? Math.max(0, 1 - dragY.value / 100) : 1,
            transition: isDragging.value ? 'none' : 'opacity 0.32s ease',
        };
    }
    return {
        opacity: 0,
        pointerEvents: 'none',
        transition: 'opacity 0.16s ease',
    };
});

// 核心卡片容器：基于 GPU translate3d + scale 的显性扩散与收缩轨迹
const motionContainerStyle = computed(() => {
    const { deltaX, deltaY, scaleX, scaleY } = motionTransformMatrix.value;

    // 1. 初始帧：精准定位于点击卡片中心，并缩放到与原卡片相同几何尺寸
    if (animState.value === 'initial') {
        return {
            position: 'fixed',
            top: '11.5vh',
            bottom: '11.5vh',
            left: '56rpx',
            right: '56rpx',
            borderRadius: '24rpx',
            transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`,
            transition: 'none',
        };
    }

    // 2. 展开中：放慢至 0.58s，带有强烈、细腻、肉眼清晰可见的向外扩散放大膨胀轨迹！
    if (animState.value === 'expanding') {
        return {
            position: 'fixed',
            top: '11.5vh',
            bottom: '11.5vh',
            left: '56rpx',
            right: '56rpx',
            borderRadius: '40rpx',
            transform: 'translate3d(0, 0, 0) scale(1, 1)',
            transition: 'transform 0.58s cubic-bezier(0.2, 0.95, 0.28, 1), border-radius 0.58s cubic-bezier(0.2, 0.95, 0.28, 1)',
        };
    }

    // 3. 收起中：0.46s 沿着原运动轨迹精确收缩折叠回点击卡片原位
    if (animState.value === 'collapsing') {
        return {
            position: 'fixed',
            top: '11.5vh',
            bottom: '11.5vh',
            left: '56rpx',
            right: '56rpx',
            borderRadius: '24rpx',
            transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`,
            transition: 'transform 0.46s cubic-bezier(0.25, 1, 0.35, 1), border-radius 0.46s ease',
        };
    }

    // 4. 手势拖拽中
    if (isDragging.value && dragY.value > 0) {
        const dragScale = Math.max(0.78, 1 - dragY.value / 1100);
        return {
            position: 'fixed',
            top: '11.5vh',
            bottom: '11.5vh',
            left: '56rpx',
            right: '56rpx',
            borderRadius: '40rpx',
            transform: `translate3d(0, ${dragY.value}px, 0) scale(${dragScale})`,
            transition: 'none',
        };
    }

    // 5. 展开就绪态：绝对静止居中
    return {
        position: 'fixed',
        top: '11.5vh',
        bottom: '11.5vh',
        left: '56rpx',
        right: '56rpx',
        borderRadius: '40rpx',
        transform: 'translate3d(0, 0, 0) scale(1, 1)',
        transition: isDragging.value ? 'none' : 'transform 0.28s cubic-bezier(0.25, 1, 0.35, 1)',
    };
});

// ── 打开与关闭方法 ──
const open = (options = {}) => {
    const { item, list = [], index = 0, sourceRect = null } = options;
    previewList.value = list.length > 0 ? list : [item];
    currentIndex.value = Math.max(0, index);
    startRect.value = sourceRect;

    mounted.value = true;
    animState.value = 'initial';
    dragY.value = 0;
    isDragging.value = false;

    // 下一帧开启丝滑从容的扩散放大轨迹
    setTimeout(() => {
        animState.value = 'expanding';
    }, 30);

    // 展开动画就绪
    setTimeout(() => {
        if (animState.value === 'expanding') {
            animState.value = 'expanded';
        }
    }, 600);
};

const handleClose = () => {
    if (animState.value === 'collapsing' || animState.value === 'idle') return;

    animState.value = 'collapsing';

    setTimeout(() => {
        animState.value = 'idle';
        mounted.value = false;
        dragY.value = 0;
        isDragging.value = false;
    }, 470);
};

// ── 功能 ③：沉浸式试戴 (平滑过渡进入 preview.vue) ──
const handleOpenFullPreview = () => {
    if (!currentInfo.value?.id) return;
    uni.setStorageSync('classList', previewList.value);
    uni.navigateTo({
        url: `/pages/app/preview?id=${currentInfo.value.id}`,
    });
};

// ── 功能 ①：收藏操作 ──
const toggleFavorite = async () => {
    if (!currentInfo.value?.id) return;
    const nextCollect = !currentInfo.value.is_favorited;
    try {
        await apiPostActions({
            wall_id: currentInfo.value.id,
            action_key: 'favorite',
            action_value: nextCollect ? 1 : 0,
        });

        currentInfo.value.is_favorited = nextCollect;
        uni.showToast({
            title: nextCollect ? '已加入收藏' : '已取消收藏',
            icon: 'none',
        });
    } catch (error) {
        uni.showToast({
            title: '操作失败',
            icon: 'none',
        });
    }
};

// ── 功能 ②：立即下载原图 ──
const handleDownload = () => {
    const url = currentInfo.value?.picurl || currentInfo.value?.smallPicurl;
    if (!url) return;
    downloadPic(url);
};

// ── 下拉关闭手势 ──
const handleTouchStart = (e) => {
    if (animState.value !== 'expanded') return;
    const touch = e.touches[0];
    touchStartY = touch.clientY;
    touchStartX = touch.clientX;
};

const handleTouchMove = (e) => {
    if (animState.value !== 'expanded') return;
    const touch = e.touches[0];
    const diffY = touch.clientY - touchStartY;
    const diffX = touch.clientX - touchStartX;

    if (diffY > 10 && Math.abs(diffY) > Math.abs(diffX) * 1.5) {
        isDragging.value = true;
        dragY.value = diffY * 0.62;
    }
};

const handleTouchEnd = () => {
    if (!isDragging.value) return;

    if (dragY.value > 120) {
        handleClose();
    } else {
        isDragging.value = false;
        dragY.value = 0;
    }
};

defineExpose({
    open,
    close: handleClose,
});
</script>

<style lang="scss" scoped>
.wallpaper-preview-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 99999;
    box-sizing: border-box;
    overflow: hidden;
    user-select: none;
}

/* 深色毛玻璃全屏背景遮罩 (柔和淡入淡出，点击空白处收回) */
.overlay-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.78);
    z-index: 1;
}

/* 居中悬浮画框大卡片：硬件加速 transform 扩散/收缩，纯柔和暗影，上下绝对居中 */
.gallery-card-container {
    z-index: 2;
    overflow: hidden;
    background: #000000;
    border-radius: 40rpx;
    border: none;
    box-shadow: 0 28rpx 70rpx rgba(0, 0, 0, 0.75);
    will-change: transform, border-radius;
    -webkit-mask-image: -webkit-radial-gradient(white, black);
    transform-origin: center center;
}

/* 壁纸大图：始终 100% 铺满卡片画框，0 时钟遮挡 */
.card-wallpaper-img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    border-radius: inherit;
}

/* 卡片内部右上角关闭按钮：无边框、无描边、完全避开微信胶囊 */
.card-inner-close {
    position: absolute;
    top: 24rpx;
    right: 24rpx;
    width: 68rpx;
    height: 68rpx;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: none;
    outline: none;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 130;
    pointer-events: auto;
    transition: transform 0.16s ease, background-color 0.16s ease;

    &:active {
        transform: scale(0.9);
        background: rgba(0, 0, 0, 0.65);
    }
}

/* 底部操作栏：彻底无阴影，纯粹通透呈现原图 */
.card-actions-bar {
    position: absolute;
    bottom: 30rpx;
    left: 28rpx;
    right: 28rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    z-index: 20;
    pointer-events: auto;
}

/* 左右两侧小圆角磨砂按钮 (收藏 / 沉浸试戴)：无边框、无阴影 */
.action-mini-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4rpx;
    width: 96rpx;
    height: 96rpx;
    border-radius: 30rpx;
    background: rgba(20, 20, 24, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: none;
    box-shadow: none;
    outline: none;
    transition: transform 0.16s ease;

    &:active {
        transform: scale(0.92);
    }

    &.is-favorited {
        background: rgba(239, 68, 68, 0.22);
    }

    .mini-label {
        font-size: 19rpx;
        font-weight: 600;
        color: #ffffff;
        line-height: 1;
    }
}

/* 中间主按键 (保存原图)：无边框、无阴影，饱满质感 */
.action-core-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
    height: 96rpx;
    border-radius: 30rpx;
    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
    border: none;
    box-shadow: none;
    outline: none;
    transition: transform 0.16s ease;

    &:active {
        transform: scale(0.95);
    }

    .core-btn-text {
        font-size: 28rpx;
        font-weight: 750;
        color: #ffffff;
        letter-spacing: 1.5rpx;
    }
}
</style>
