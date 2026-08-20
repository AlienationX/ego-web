<template>
    <uni-popup ref="popupRef" type="bottom" :safe-area="false" @change="onPopupChange">
        <view class="frosted-maker" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
            <!-- 弹窗顶部栏 -->
            <view class="frosted-maker__header">
                <view class="frosted-maker__header-left">
                    <text class="frosted-maker__title">{{ t('frostedMaker.title') }}</text>
                    <text class="frosted-maker__subtitle">{{ t('frostedMaker.subtitle') }}</text>
                </view>
                <view class="frosted-maker__close" @click="close">
                    <uni-icons type="clear" size="28" :color="settingsStore.isDark ? '#a1a1aa' : '#888888'"></uni-icons>
                </view>
            </view>

            <!-- 实时磨砂预览画板 -->
            <view class="frosted-maker__preview-area">
                <view class="frosted-maker__phone-frame">
                    <!-- 背景壁纸与实时 CSS 模糊滤镜 -->
                    <image class="frosted-maker__preview-img" :src="picurl" mode="aspectFill"
                        :style="previewFilterStyle"></image>

                    <!-- 暗度遮罩层 -->
                    <view class="frosted-maker__preview-overlay"
                        :style="{ backgroundColor: `rgba(0, 0, 0, ${darkness})` }"></view>

                    <!-- 模拟主屏桌面 App 图标网格 (开关开启时显示) -->
                    <view v-if="showMockApps" class="frosted-maker__mock-desktop">
                        <!-- 顶部小组件栏 -->
                        <view class="mock-widget">
                            <text class="mock-widget__date">09:41</text>
                            <text class="mock-widget__weather">26°C 晴</text>
                        </view>

                        <!-- 桌面应用图标网格 -->
                        <view class="mock-apps-grid">
                            <view class="mock-app-item" v-for="(app, idx) in mockAppList" :key="idx">
                                <view class="mock-app-icon" :style="{ backgroundColor: app.color }">
                                    <uni-icons :type="app.icon" size="20" color="#ffffff"></uni-icons>
                                </view>
                                <text class="mock-app-name">{{ t(app.nameKey) }}</text>
                            </view>
                        </view>

                        <!-- 底部 Dock 栏 -->
                        <view class="mock-dock">
                            <view class="mock-dock__icon" style="background-color: #34c759;">
                                <uni-icons type="phone-filled" size="22" color="#ffffff"></uni-icons>
                            </view>
                            <view class="mock-dock__icon" style="background-color: #007aff;">
                                <uni-icons type="chatbubble-filled" size="22" color="#ffffff"></uni-icons>
                            </view>
                            <view class="mock-dock__icon" style="background-color: #ff9500;">
                                <uni-icons type="paperplane-filled" size="22" color="#ffffff"></uni-icons>
                            </view>
                            <view class="mock-dock__icon" style="background-color: #5856d6;">
                                <uni-icons type="camera-filled" size="22" color="#ffffff"></uni-icons>
                            </view>
                        </view>
                    </view>

                    <!-- 浮动在预览卡片上的“模拟主屏”切换开关 -->
                    <view class="frosted-maker__toggle-mock" :class="{ 'is-active': showMockApps }"
                        @click="toggleMockApps">
                        <mdi-icon path="/static/icons/view-grid.svg" size="16px"
                            :color="showMockApps ? '#ffffff' : '#ffffff'"></mdi-icon>
                        <text class="toggle-text">{{ showMockApps ? t('frostedMaker.hideApps') :
                            t('frostedMaker.showApps') }}</text>
                    </view>
                </view>
            </view>

            <!-- 调节控制面板 -->
            <view class="frosted-maker__controls">
                <!-- 预设档位快捷选择 -->
                <view class="frosted-maker__section">
                    <view class="frosted-maker__section-title">{{ t('frostedMaker.presets') }}</view>
                    <view class="frosted-maker__presets">
                        <view class="preset-pill" v-for="item in presetOptions" :key="item.value"
                            :class="{ active: currentPreset === item.value }" @click="selectPreset(item)">
                            <text class="preset-name">{{ t(item.nameKey) }}</text>
                            <text class="preset-val">{{ item.blur }}px</text>
                        </view>
                    </view>
                </view>

                <!-- 模糊度与暗度微调滑块 -->
                <view class="frosted-maker__sliders">
                    <view class="slider-row">
                        <view class="slider-label">
                            <text class="label-name">{{ t('frostedMaker.blurLevel') }}</text>
                            <text class="label-val">{{ blurRadius }}px</text>
                        </view>
                        <slider :value="blurRadius" :min="0" :max="100" :step="1" activeColor="#4f46e5"
                            backgroundColor="rgba(120, 120, 128, 0.2)" block-size="20" @changing="onBlurChanging"
                            @change="onBlurChange" />
                    </view>

                    <view class="slider-row">
                        <view class="slider-label">
                            <text class="label-name">{{ t('frostedMaker.dimLevel') }}</text>
                            <text class="label-val">{{ Math.round(darkness * 100) }}%</text>
                        </view>
                        <slider :value="Math.round(darkness * 100)" :min="0" :max="50" :step="1" activeColor="#4f46e5"
                            backgroundColor="rgba(120, 120, 128, 0.2)" block-size="20" @changing="onDarknessChanging"
                            @change="onDarknessChange" />
                    </view>
                </view>

                <!-- 保存导出操作按钮 (单一大按钮，VIP 专属) -->
                <view class="frosted-maker__actions">
                    <button class="action-btn action-btn--primary action-btn--full" :disabled="isSaving"
                        :loading="isSaving" @click="handleSaveClick">
                        <mdi-icon v-if="!userStore.isVip" path="/static/icons/crown-circle.svg" size="20px"
                            color="#FBBF24"></mdi-icon>
                        <text>{{ isSaving ? t('frostedMaker.generating') : (userStore.isVip ? t('frostedMaker.saveFrosted') : t('frostedMaker.vipSaveFrosted')) }}</text>
                    </button>
                </view>
            </view>

            <!-- 底部安全间距 -->
            <view class="safe-area-bottom"></view>
        </view>

        <!-- 微信小程序端使用 Canvas 2D 接口支持同层渲染与 getImageData -->
        <!-- #ifdef MP-WEIXIN -->
        <canvas type="2d" id="frostedCanvas" class="frosted-maker__hidden-canvas"
            :style="{ width: `${canvasW}px`, height: `${canvasH}px` }"></canvas>
        <!-- #endif -->

        <!-- 非微信端使用标准 Canvas 容器 -->
        <!-- #ifndef MP-WEIXIN -->
        <canvas canvas-id="frostedCanvas" id="frostedCanvas" class="frosted-maker__hidden-canvas"
            :style="{ width: `${canvasW}px`, height: `${canvasH}px` }"></canvas>
        <!-- #endif -->
    </uni-popup>
</template>

<script setup>
import { computed, ref, getCurrentInstance, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserStore } from '@/stores/user.js';
import { renderFrostedWallpaperToCanvas, saveImageToAlbum } from '@/utils/blur.js';

const props = defineProps({
    picurl: {
        type: String,
        default: '',
    },
    id: {
        type: [Number, String],
        default: '',
    },
});

const emit = defineEmits(['saveSuccess', 'requireVip']);

const { t } = useI18n();
const settingsStore = useSettingsStore();
const userStore = useUserStore();
const instance = getCurrentInstance();

const popupRef = ref(null);
const blurRadius = ref(15);
const darkness = ref(0.08);
const currentPreset = ref('light');
const showMockApps = ref(true);
const isSaving = ref(false);

// 画布尺寸（兼顾 StackBlur 高斯模糊毫秒级计算性能与超清相册导出）
const canvasW = ref(540);
const canvasH = ref(1200);

onMounted(() => {
    try {
        const sys = uni.getWindowInfo();
        const ratio = (sys.windowHeight || 800) / (sys.windowWidth || 375);
        canvasW.value = 540;
        canvasH.value = Math.round(540 * ratio);
    } catch (e) { }
});

// 预设选项
const presetOptions = [
    { value: 'light', nameKey: 'frostedMaker.presetLight', blur: 15, darkness: 0.08 },
    { value: 'balanced', nameKey: 'frostedMaker.presetBalanced', blur: 35, darkness: 0.12 },
    { value: 'deep', nameKey: 'frostedMaker.presetDeep', blur: 60, darkness: 0.18 },
    { value: 'pure', nameKey: 'frostedMaker.presetPure', blur: 90, darkness: 0.25 },
];

// 模拟主屏桌面 App 列表
const mockAppList = [
    { nameKey: 'frostedMaker.apps.wechat', color: '#07c160', icon: 'chatbubble-filled' },
    { nameKey: 'frostedMaker.apps.photos', color: '#ff2d55', icon: 'image-filled' },
    { nameKey: 'frostedMaker.apps.camera', color: '#8e8e93', icon: 'camera-filled' },
    { nameKey: 'frostedMaker.apps.music', color: '#fa2d48', icon: 'sound-filled' },
    { nameKey: 'frostedMaker.apps.maps', color: '#30b0c7', icon: 'location-filled' },
    { nameKey: 'frostedMaker.apps.wallet', color: '#5856d6', icon: 'wallet-filled' },
    { nameKey: 'frostedMaker.apps.settings', color: '#636366', icon: 'gear-filled' },
    { nameKey: 'frostedMaker.apps.browser', color: '#007aff', icon: 'paperplane-filled' },
];

// 实时预览 CSS 滤镜样式
const previewFilterStyle = computed(() => {
    return {
        filter: `blur(${blurRadius.value * 0.35}px) brightness(${1 - darkness.value * 0.5})`,
        transform: 'scale(1.08)', // 稍微放大消除 blur 产生的白边
    };
});

// 切换预设
const selectPreset = (item) => {
    currentPreset.value = item.value;
    blurRadius.value = item.blur;
    darkness.value = item.darkness;
    // 触发微震动
    try {
        uni.vibrateShort();
    } catch (e) { }
};

// 滑块事件
const onBlurChanging = (e) => {
    blurRadius.value = e.detail.value;
    currentPreset.value = 'custom';
};

const onBlurChange = (e) => {
    blurRadius.value = e.detail.value;
    currentPreset.value = 'custom';
};

const onDarknessChanging = (e) => {
    darkness.value = e.detail.value / 100;
};

const onDarknessChange = (e) => {
    darkness.value = e.detail.value / 100;
};

const toggleMockApps = () => {
    showMockApps.value = !showMockApps.value;
};

// 弹窗控制
const open = () => {
    popupRef.value?.open();
};

const close = () => {
    popupRef.value?.close();
};

const onPopupChange = (e) => {
    // 弹窗状态改变
};

// 下载并获取原图真实物理尺寸信息
const downloadImageToTemp = (url) => {
    return new Promise((resolve, reject) => {
        uni.getImageInfo({
            src: url,
            success: (res) => resolve(res),
            fail: reject,
        });
    });
};

// 点击保存主屏磨砂壁纸
const handleSaveClick = () => {
    if (!userStore.isVip) {
        emit('requireVip');
        return;
    }
    saveFrostedWallpaperCore();
};

// 核心导出单张磨砂壁纸并保存相册（尺寸与原图 1:1 完全一致）
const saveFrostedWallpaperCore = async () => {
    if (!props.picurl || isSaving.value) return;
    isSaving.value = true;
    uni.showLoading({ title: t('frostedMaker.generating'), mask: true });

    try {
        // 1. 获取原图本地临时路径与真实物理宽高
        const imageInfo = await downloadImageToTemp(props.picurl);
        const originalWidth = imageInfo.width || 1080;
        const originalHeight = imageInfo.height || 2400;

        canvasW.value = originalWidth;
        canvasH.value = originalHeight;

        // 2. 在 Canvas 进行 1:1 原图等比例真实高斯模糊与暗度处理并导出超清临时图片
        const frostedTempPath = await renderFrostedWallpaperToCanvas({
            canvasId: 'frostedCanvas',
            instance,
            imagePath: imageInfo.path,
            width: originalWidth,
            height: originalHeight,
            blurRadius: blurRadius.value,
            darkness: darkness.value,
        });

        // 3. 保存至系统相册
        const success = await saveImageToAlbum(frostedTempPath);
        if (success) {
            uni.showToast({
                title: t('frostedMaker.saveSuccess'),
                icon: 'none',
                duration: 2500,
            });
            emit('saveSuccess', { frostedPath: frostedTempPath });
            close();
        }
    } catch (e) {
        console.error('Failed to generate frosted wallpaper:', e);
        uni.showToast({
            title: t('user.profile.operationFailed'),
            icon: 'none',
        });
    } finally {
        isSaving.value = false;
        uni.hideLoading();
    }
};

defineExpose({
    open,
    close,
    saveFrostedWallpaperCore,
});
</script>

<style lang="scss" scoped>
.frosted-maker {
    background: var(--popup-background, #ffffff);
    border-radius: 44rpx 44rpx 0 0;
    padding: 30rpx;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    box-shadow: 0 -10rpx 40rpx rgba(0, 0, 0, 0.15);

    &.theme-dark {
        background: #1c1c1e;
        color: #ffffff;
    }

    &__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 24rpx;

        &-left {
            display: flex;
            flex-direction: column;
            gap: 6rpx;
            padding-right: 20rpx;
        }
    }

    &__title {
        font-size: 34rpx;
        font-weight: 700;
        color: var(--text-primary, #111827);

        .theme-dark & {
            color: #f3f4f6;
        }
    }

    &__subtitle {
        font-size: 22rpx;
        color: var(--text-tertiary, #9ca3af);
    }

    &__close {
        width: 64rpx;
        height: 64rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: -6rpx;
        margin-right: -10rpx;
        border-radius: 50%;
        transition: opacity 0.2s ease;

        &:active {
            opacity: 0.6;
        }
    }

    /* 手机预览模型框 */
    &__preview-area {
        width: 100%;
        display: flex;
        justify-content: center;
        margin-bottom: 24rpx;
    }

    &__phone-frame {
        position: relative;
        width: 320rpx;
        height: 480rpx;
        border-radius: 36rpx;
        overflow: hidden;
        border: 4rpx solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.25);
        background: #000000;
    }

    &__preview-img {
        width: 100%;
        height: 100%;
        display: block;
        transition: filter 0.1s linear;
    }

    &__preview-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        transition: background-color 0.1s linear;
    }

    /* 桌面图标模拟层 */
    &__mock-desktop {
        position: absolute;
        inset: 0;
        padding: 24rpx 16rpx 16rpx;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        pointer-events: none;
        z-index: 5;

        .mock-widget {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 6rpx;

            &__date {
                font-size: 20rpx;
                font-weight: 700;
                color: #ffffff;
                text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.6);
            }

            &__weather {
                font-size: 16rpx;
                color: rgba(255, 255, 255, 0.85);
                text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.6);
            }
        }

        .mock-apps-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16rpx 10rpx;
            margin-top: 16rpx;

            .mock-app-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4rpx;

                .mock-app-icon {
                    width: 44rpx;
                    height: 44rpx;
                    border-radius: 12rpx;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.3);
                }

                .mock-app-name {
                    font-size: 14rpx;
                    color: #ffffff;
                    text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.8);
                    transform: scale(0.9);
                }
            }
        }

        .mock-dock {
            display: flex;
            justify-content: space-around;
            align-items: center;
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(16px);
            border-radius: 20rpx;
            padding: 8rpx 12rpx;
            margin-top: auto;

            &__icon {
                width: 44rpx;
                height: 44rpx;
                border-radius: 12rpx;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        }
    }

    /* 模拟桌面开关按钮 */
    &__toggle-mock {
        position: absolute;
        top: 14rpx;
        right: 14rpx;
        z-index: 10;
        background: rgba(0, 0, 0, 0.55);
        backdrop-filter: blur(8px);
        border-radius: 30rpx;
        padding: 6rpx 14rpx;
        display: flex;
        align-items: center;
        gap: 6rpx;

        &.is-active {
            background: rgba(79, 70, 229, 0.8);
        }

        .toggle-text {
            font-size: 16rpx;
            color: #ffffff;
            font-weight: 500;
        }
    }

    /* 控制面板 */
    &__controls {
        display: flex;
        flex-direction: column;
        gap: 20rpx;
    }

    &__section-title {
        font-size: 24rpx;
        font-weight: 600;
        color: var(--text-secondary, #6b7280);
        margin-bottom: 12rpx;

        .theme-dark & {
            color: #9ca3af;
        }
    }

    &__presets {
        display: flex;
        gap: 14rpx;

        .preset-pill {
            flex: 1;
            padding: 14rpx 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 18rpx;
            background: rgba(120, 120, 128, 0.08);
            border: 2rpx solid transparent;
            transition: all 0.2s ease;

            .theme-dark & {
                background: rgba(255, 255, 255, 0.06);
            }

            .preset-name {
                font-size: 22rpx;
                font-weight: 600;
                color: var(--text-primary, #1f2937);

                .theme-dark & {
                    color: #e5e7eb;
                }
            }

            .preset-val {
                font-size: 18rpx;
                color: var(--text-tertiary, #9ca3af);
                margin-top: 2rpx;
            }

            &.active {
                background: rgba(79, 70, 229, 0.12);
                border-color: #4f46e5;

                .preset-name {
                    color: #4f46e5;
                }

                .preset-val {
                    color: #4f46e5;
                }
            }
        }
    }

    &__sliders {
        display: flex;
        flex-direction: column;
        gap: 16rpx;
        background: rgba(120, 120, 128, 0.05);
        border-radius: 20rpx;
        padding: 16rpx 20rpx;

        .theme-dark & {
            background: rgba(255, 255, 255, 0.04);
        }

        .slider-row {
            display: flex;
            flex-direction: column;

            .slider-label {
                display: flex;
                justify-content: space-between;
                align-items: center;

                .label-name {
                    font-size: 22rpx;
                    color: var(--text-secondary, #6b7280);

                    .theme-dark & {
                        color: #9ca3af;
                    }
                }

                .label-val {
                    font-size: 22rpx;
                    font-weight: 600;
                    color: var(--text-primary, #111827);

                    .theme-dark & {
                        color: #f3f4f6;
                    }
                }
            }
        }
    }

    &__actions {
        display: flex;
        gap: 18rpx;
        margin-top: 8rpx;
        margin-bottom: 8rpx;

        .action-btn {
            flex: 1;
            height: 88rpx;
            border-radius: 24rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10rpx;
            font-size: 26rpx;
            font-weight: 600;
            border: none;
            outline: none;
            overflow: hidden;

            &::after {
                border: none !important;
                display: none !important;
            }

            &--full {
                width: 100%;
                height: 88rpx;
                border-radius: 44rpx;
                font-size: 28rpx;
            }
        }
    }

    .safe-area-bottom {
        width: 100%;
        height: 20rpx;
    }

    &__hidden-canvas {
        position: fixed;
        left: -9999px;
        top: -9999px;
        opacity: 0;
        pointer-events: none;
    }
}
</style>
