<template>
    <view class="frosted-page" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 沉浸式顶部自定义导航栏 -->
        <view class="frosted-nav" :style="{ paddingTop: `${statusBarHeight}px` }">
            <view class="nav-content">
                <view class="nav-back-btn" @click="handleNavBack">
                    <mdi-icon
                        path="/static/icons/arrow-left.svg"
                        size="22px"
                        :color="settingsStore.isDark ? '#f8fafc' : '#0f172a'"
                    />
                </view>
                <view class="nav-title-group">
                    <text class="nav-title">{{ t('frostedMaker.title') }}</text>
                    <text class="nav-subtitle">{{ t('frostedMaker.subtitle') }}</text>
                </view>
                <!-- 右侧占位，与左侧返回键对称以保证标题居中 -->
                <view class="nav-placeholder" />
            </view>
        </view>

        <!-- 主内容区域（可滚动，适配各屏幕比例） -->
        <scroll-view class="frosted-scroll" scroll-y :show-scrollbar="false">
            <view class="frosted-body">
                <!-- 1. 实时手机模型预览画板（支持点击换图） -->
                <view class="preview-stage">
                    <view class="phone-frame" @click="openImagePicker">
                        <!-- 底图与实时高斯模糊滤镜 -->
                        <image
                            class="phone-wallpaper"
                            :src="currentPicUrl"
                            mode="aspectFill"
                            :style="previewFilterStyle"
                        />

                        <!-- 动态暗度遮罩层 -->
                        <view
                            class="darkness-overlay"
                            :style="{ backgroundColor: `rgba(0, 0, 0, ${darkness})` }"
                        />

                        <!-- 模拟主屏桌面 App 图标与小组件 (开关开启时显示) -->
                        <view v-if="showMockApps" class="mock-desktop">
                            <!-- 顶部时间天气小组件 -->
                            <view class="mock-widget">
                                <text class="mock-widget__time">09:41</text>
                                <text class="mock-widget__date">9月20日 星期日 · 26°C 晴</text>
                            </view>

                            <!-- 桌面 App 图标网格 (8个常用图标) -->
                            <view class="mock-grid">
                                <view
                                    v-for="(app, idx) in mockAppList"
                                    :key="idx"
                                    class="mock-app-item"
                                >
                                    <view class="mock-app-icon" :style="{ backgroundColor: app.color }">
                                        <uni-icons :type="app.icon" size="20" color="#ffffff" />
                                    </view>
                                    <text class="mock-app-name">{{ t(app.nameKey) }}</text>
                                </view>
                            </view>

                            <!-- 底部 Dock 栏 -->
                            <view class="mock-dock">
                                <view class="mock-dock__icon" style="background-color: #34c759;">
                                    <uni-icons type="phone-filled" size="20" color="#ffffff" />
                                </view>
                                <view class="mock-dock__icon" style="background-color: #007aff;">
                                    <uni-icons type="chatbubble-filled" size="20" color="#ffffff" />
                                </view>
                                <view class="mock-dock__icon" style="background-color: #ff9500;">
                                    <uni-icons type="paperplane-filled" size="20" color="#ffffff" />
                                </view>
                                <view class="mock-dock__icon" style="background-color: #5856d6;">
                                    <uni-icons type="camera-filled" size="20" color="#ffffff" />
                                </view>
                            </view>
                        </view>

                        <!-- 模拟桌面显示/隐藏浮动切换开关 -->
                        <view
                            class="toggle-mock-pill"
                            :class="{ 'is-active': showMockApps }"
                            @click.stop="toggleMockApps"
                        >
                            <mdi-icon
                                path="/static/icons/view-grid.svg"
                                size="14px"
                                color="#ffffff"
                            />
                            <text class="toggle-text">
                                {{ showMockApps ? t('frostedMaker.hideApps') : t('frostedMaker.showApps') }}
                            </text>
                        </view>

                    </view>
                </view>

                <!-- 大号醒目更换壁纸操作条 -->
                <view class="change-wallpaper-strip" @click="openImagePicker">
                    <view class="strip-left">
                        <view class="strip-icon-circle">
                            <mdi-icon
                                path="/static/icons/image.svg"
                                size="20px"
                                color="#ffffff"
                            />
                        </view>
                        <view class="strip-text-group">
                            <text class="strip-title">{{ t('frostedMaker.changeImage') }}</text>
                            <text class="strip-desc">支持从「我的收藏」或「手机相册」中选择</text>
                        </view>
                    </view>
                    <view class="strip-action-badge">
                        <text class="badge-text">去选择</text>
                        <uni-icons type="right" size="14" color="#6366f1" />
                    </view>
                </view>

                <!-- 2. 参数调节面板 -->
                <view class="controls-panel">
                    <!-- 2.1 四档磨砂预设切换 -->
                    <view class="panel-section">
                        <view class="section-header">
                            <text class="section-title">{{ t('frostedMaker.presets') }}</text>
                        </view>
                        <view class="presets-row">
                            <view
                                v-for="item in presetOptions"
                                :key="item.value"
                                class="preset-card"
                                :class="{ 'is-active': currentPreset === item.value }"
                                @click="selectPreset(item)"
                            >
                                <text class="preset-name">{{ t(item.nameKey) }}</text>
                                <text class="preset-value">{{ item.blur }}px</text>
                            </view>
                        </view>
                    </view>

                    <!-- 2.2 模糊度与暗度滑块 -->
                    <view class="panel-section">
                        <!-- 模糊度调节 -->
                        <view class="slider-block">
                            <view class="slider-meta">
                                <text class="meta-label">{{ t('frostedMaker.blurLevel') }}</text>
                                <text class="meta-num">{{ blurRadius }}px</text>
                            </view>
                            <slider
                                :value="blurRadius"
                                :min="0"
                                :max="100"
                                :step="1"
                                activeColor="#6366f1"
                                backgroundColor="rgba(120, 120, 128, 0.2)"
                                block-size="20"
                                @changing="onBlurChanging"
                                @change="onBlurChange"
                            />
                        </view>

                        <!-- 暗度遮罩调节 -->
                        <view class="slider-block">
                            <view class="slider-meta">
                                <text class="meta-label">{{ t('frostedMaker.dimLevel') }}</text>
                                <text class="meta-num">{{ Math.round(darkness * 100) }}%</text>
                            </view>
                            <slider
                                :value="Math.round(darkness * 100)"
                                :min="0"
                                :max="50"
                                :step="1"
                                activeColor="#6366f1"
                                backgroundColor="rgba(120, 120, 128, 0.2)"
                                block-size="20"
                                @changing="onDarknessChanging"
                                @change="onDarknessChange"
                            />
                        </view>
                    </view>
                </view>
            </view>
        </scroll-view>

        <!-- 3. 底部吸底保存操作栏 -->
        <view class="bottom-action-bar">
            <button
                class="save-btn"
                :disabled="isSaving"
                :loading="isSaving"
                @click="handleSaveFrosted"
            >
                <mdi-icon
                    v-if="!userStore.isVip"
                    path="/static/icons/crown-circle.svg"
                    size="20px"
                    color="#fbbf24"
                />
                <mdi-icon
                    v-else
                    path="/static/icons/download.svg"
                    size="20px"
                    color="#ffffff"
                />
                <text class="save-btn-text">
                    {{ isSaving ? t('frostedMaker.generating') : (userStore.isVip ? t('frostedMaker.saveFrosted') : t('frostedMaker.vipSaveFrosted')) }}
                </text>
            </button>
        </view>

        <!-- 选图组件：支持【我的收藏】和【本地相册】(单选模式) -->
        <puzzle-image-picker
            v-model:visible="showPicker"
            :title="t('frostedMaker.selectImage') || '选择壁纸'"
            :max-count="1"
            :single-mode="true"
            :initial-images="currentPicUrl ? [currentPicUrl] : []"
            @confirm="handleImageSelected"
        />

        <!-- 广告激励与 VIP 解锁弹窗组件 -->
        <popup-ad-prompt ref="adPopup" :picurl="currentPicUrl" />

        <!-- 微信小程序端使用 Canvas 2D 接口支持同层渲染与 getImageData -->
        <!-- #ifdef MP-WEIXIN -->
        <canvas
            type="2d"
            id="frostedCanvas"
            class="frosted-hidden-canvas"
            :style="{ width: `${canvasW}px`, height: `${canvasH}px` }"
        />
        <!-- #endif -->

        <!-- 非微信端使用标准 Canvas 容器 -->
        <!-- #ifndef MP-WEIXIN -->
        <canvas
            canvas-id="frostedCanvas"
            id="frostedCanvas"
            class="frosted-hidden-canvas"
            :width="canvasW"
            :height="canvasH"
            :style="{ width: `${canvasW}px`, height: `${canvasH}px` }"
        />
        <!-- #endif -->
    </view>
</template>

<script setup>
import { ref, computed, getCurrentInstance, nextTick, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserStore } from '@/stores/user.js';
import { getStatusBarHeight } from '@/utils/layout.js';
import { renderFrostedWallpaperToCanvas, saveImageToAlbum } from '@/utils/blur.js';
import { executeWithAuth } from '@/utils/auth-action.js';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const userStore = useUserStore();
const instance = getCurrentInstance();

const statusBarHeight = computed(() => getStatusBarHeight() || 24);

// 当前正在制作的图片 URL (默认提供一张高质量壁纸作为预览示例)
const DEFAULT_PREVIEW_PIC = 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1080&q=85';
const currentPicUrl = ref(DEFAULT_PREVIEW_PIC);
const currentWallId = ref(0);

// 选图抽屉开关
const showPicker = ref(false);
const openImagePicker = () => {
    showPicker.value = true;
};

// 选图回调 (支持我的收藏或本地相册)
const handleImageSelected = (images) => {
    if (images && images.length > 0) {
        currentPicUrl.value = images[0];
    }
};

// 返回上一页
const handleNavBack = () => {
    uni.navigateBack({
        fail: () => {
            uni.switchTab({ url: '/pages/creation/creation' });
        },
    });
};

// 调节参数
const blurRadius = ref(35);
const darkness = ref(0.12);
const currentPreset = ref('balanced');
const showMockApps = ref(true);
const isSaving = ref(false);

// 画布尺寸
const canvasW = ref(540);
const canvasH = ref(1170);

// 广告解锁弹窗组件实例
const adPopup = ref(null);

onMounted(() => {
    canvasW.value = 540;
    canvasH.value = 1170;
});

// 预设选项
const presetOptions = [
    { value: 'light', nameKey: 'frostedMaker.presetLight', blur: 15, darkness: 0.08 },
    { value: 'balanced', nameKey: 'frostedMaker.presetBalanced', blur: 35, darkness: 0.12 },
    { value: 'deep', nameKey: 'frostedMaker.presetDeep', blur: 60, darkness: 0.18 },
    { value: 'pure', nameKey: 'frostedMaker.presetPure', blur: 90, darkness: 0.25 },
];

// 模拟桌面 App 列表
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
const previewFilterStyle = computed(() => ({
    filter: `blur(${blurRadius.value * 0.35}px) brightness(${1 - darkness.value * 0.5})`,
    transform: 'scale(1.08)',
}));

// 切换预设
const selectPreset = (item) => {
    currentPreset.value = item.value;
    blurRadius.value = item.blur;
    darkness.value = item.darkness;
    try {
        uni.vibrateShort();
    } catch (e) {}
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

// 切换模拟桌面图标
const toggleMockApps = () => {
    showMockApps.value = !showMockApps.value;
    try {
        uni.vibrateShort();
    } catch (e) {}
};

// 下载图片临时路径并获取真实尺寸
const downloadImageToTemp = (url) => {
    return new Promise((resolve, reject) => {
        uni.getImageInfo({
            src: url,
            success: (res) => resolve(res),
            fail: reject,
        });
    });
};

// 点击保存：走 executeWithAuth 权限校验
const handleSaveFrosted = async () => {
    if (!currentPicUrl.value) {
        uni.showToast({
            title: t('frostedMaker.selectPhotoHint') || '请先选择一张壁纸',
            icon: 'none',
        });
        return;
    }
    if (isSaving.value) return;

    // #ifdef WEB
    await doRealSaveFrosted();
    return;
    // #endif

    // #ifndef WEB
    await executeWithAuth({
        adPopup: adPopup.value,
        wallId: currentWallId.value || 0,
        actionType: 'consume_frosted_export',
        costEnergy: 1,
        customConfig: {
            title: userStore.isLoggedIn ? t('frostedMaker.energyShortageTitle') : t('frostedMaker.unlockTitle'),
            desc: userStore.isLoggedIn
                ? t('frostedMaker.energyShortageDesc')
                : t('frostedMaker.unlockDesc'),
            adBtnText: t('frostedMaker.watchAdSaveBtn'),
            vipBtnText: t('frostedMaker.openVipEnjoyBtn'),
            vipSuccessTip: t('frostedMaker.vipSuccessTip'),
            energySuccessTip: t('frostedMaker.energySuccessTip'),
            adSuccessTip: t('frostedMaker.adSuccessTip'),
        },
        onSuccess: async ({ message }) => {
            await doRealSaveFrosted(message);
        },
    });
    // #endif
};

// 真实执行离屏 Canvas 高清模糊渲染与相册保存
const doRealSaveFrosted = async (successTip = '') => {
    isSaving.value = true;
    uni.showLoading({ title: t('frostedMaker.generating'), mask: true });

    try {
        // 1. 获取原图本地临时路径与真实物理宽高
        const imageInfo = await downloadImageToTemp(currentPicUrl.value);
        const originalWidth = imageInfo.width || 1080;
        const originalHeight = imageInfo.height || 2400;

        const ratio = originalHeight / originalWidth;
        const sampleW = 540;
        const sampleH = Math.round(sampleW * ratio);
        canvasW.value = sampleW;
        canvasH.value = sampleH;
        await nextTick();
        await new Promise((resolve) => setTimeout(resolve, 80));

        // 2. 在 Canvas 进行真实高斯模糊与暗度处理并导出超清临时图片
        const frostedTempPath = await renderFrostedWallpaperToCanvas({
            canvasId: 'frostedCanvas',
            instance,
            imagePath: imageInfo.path,
            originalWidth,
            originalHeight,
            blurRadius: blurRadius.value,
            darkness: darkness.value,
        });

        // 3. 保存至系统相册
        const saved = await saveImageToAlbum(frostedTempPath);
        if (saved) {
            uni.showToast({
                title: successTip || t('frostedMaker.saveSuccess'),
                icon: 'none',
                duration: 2500,
            });
        }
    } catch (e) {
        console.error('Failed to export frosted wallpaper:', e);
        uni.showToast({
            title: t('user.profile.operationFailed') || '保存失败，请重试',
            icon: 'none',
        });
    } finally {
        isSaving.value = false;
        uni.hideLoading();
    }
};

onLoad((options) => {
    if (options?.picurl) {
        currentPicUrl.value = decodeURIComponent(options.picurl);
    }
    if (options?.id) {
        currentWallId.value = options.id;
    }
});
</script>

<style lang="scss" scoped>
.frosted-page {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    transition: background-color 0.3s ease;
    overflow: hidden;

    &.theme-light {
        background-color: #f8fafc;
        color: #0f172a;

        .frosted-nav {
            background-color: rgba(248, 250, 252, 0.92);
            border-bottom: 1rpx solid rgba(226, 232, 240, 0.8);
        }

        .phone-frame {
            box-shadow: 0 24rpx 60rpx rgba(15, 23, 42, 0.14);
            border: 8rpx solid #0f172a;
        }

        .change-wallpaper-strip {
            background-color: #ffffff;
            border: 1rpx solid rgba(99, 102, 241, 0.16);
            box-shadow: 0 10rpx 28rpx rgba(99, 102, 241, 0.08);

            .strip-title {
                color: #0f172a;
            }

            .strip-desc {
                color: #64748b;
            }

            .strip-action-badge {
                background-color: rgba(99, 102, 241, 0.08);

                .badge-text {
                    color: #6366f1;
                }
            }
        }

        .controls-panel {
            background-color: #ffffff;
            border-top: 1rpx solid rgba(226, 232, 240, 0.8);
        }

        .preset-card {
            background-color: #f1f5f9;
            border: 2rpx solid transparent;
            color: #334155;

            &.is-active {
                background-color: #e0e7ff;
                border-color: #6366f1;
                color: #4338ca;
            }
        }

        .bottom-action-bar {
            background-color: rgba(255, 255, 255, 0.94);
            border-top: 1rpx solid rgba(226, 232, 240, 0.8);
        }
    }

    &.theme-dark {
        background-color: #0b0f19;
        color: #f8fafc;

        .frosted-nav {
            background-color: rgba(11, 15, 25, 0.92);
            border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
        }

        .phone-frame {
            box-shadow: 0 24rpx 60rpx rgba(0, 0, 0, 0.5);
            border: 8rpx solid #334155;
        }

        .change-wallpaper-strip {
            background-color: #1e293b;
            border: 1rpx solid rgba(99, 102, 241, 0.3);
            box-shadow: 0 10rpx 28rpx rgba(0, 0, 0, 0.35);

            .strip-title {
                color: #f8fafc;
            }

            .strip-desc {
                color: #94a3b8;
            }

            .strip-action-badge {
                background-color: rgba(99, 102, 241, 0.2);

                .badge-text {
                    color: #a5b4fc;
                }
            }
        }

        .controls-panel {
            background-color: #111827;
            border-top: 1rpx solid rgba(255, 255, 255, 0.08);
        }

        .preset-card {
            background-color: #1e293b;
            border: 2rpx solid transparent;
            color: #cbd5e1;

            &.is-active {
                background-color: rgba(99, 102, 241, 0.2);
                border-color: #6366f1;
                color: #a5b4fc;
            }
        }

        .bottom-action-bar {
            background-color: rgba(17, 24, 39, 0.94);
            border-top: 1rpx solid rgba(255, 255, 255, 0.08);
        }
    }
}

/* 顶部导航栏 */
.frosted-nav {
    flex-shrink: 0;
    z-index: 50;
    backdrop-filter: blur(20rpx);
    -webkit-backdrop-filter: blur(20rpx);

    .nav-content {
        height: 88rpx;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24rpx;
    }

    .nav-back-btn {
        width: 72rpx;
        height: 72rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: opacity 0.2s;

        &:active {
            opacity: 0.6;
        }
    }

    .nav-title-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rpx;
    }

    .nav-title {
        font-size: 30rpx;
        font-weight: 700;
        line-height: 1.2;
    }

    .nav-subtitle {
        font-size: 20rpx;
        opacity: 0.6;
    }

    .nav-placeholder {
        width: 72rpx;
        height: 72rpx;
    }
}

/* 主滚动区域 */
.frosted-scroll {
    flex: 1;
    min-height: 0;
}

.frosted-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24rpx 24rpx 40rpx;
    box-sizing: border-box;
    gap: 32rpx;
}

/* 1. 手机模型预览舞台 */
.preview-stage {
    width: 100%;
    display: flex;
    justify-content: center;
}

.phone-frame {
    width: 440rpx;
    height: 780rpx;
    border-radius: 48rpx;
    position: relative;
    overflow: hidden;
    background-color: #000000;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.phone-wallpaper {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    transition: filter 0.2s ease, transform 0.2s ease;
}

.darkness-overlay {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    transition: background-color 0.2s ease;
}

/* 模拟主屏桌面 App */
.mock-desktop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 44rpx 24rpx 28rpx;
    box-sizing: border-box;
    pointer-events: none;
}

.mock-widget {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 14rpx 0;
    color: #ffffff;
    text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.5);

    &__time {
        font-size: 52rpx;
        font-weight: 300;
        letter-spacing: 2rpx;
        line-height: 1.1;
    }

    &__date {
        font-size: 18rpx;
        opacity: 0.9;
        margin-top: 4rpx;
    }
}

.mock-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20rpx 12rpx;
    margin-top: 10rpx;
}

.mock-app-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
}

.mock-app-icon {
    width: 68rpx;
    height: 68rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.25);
}

.mock-app-name {
    font-size: 16rpx;
    color: #ffffff;
    text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.6);
    line-height: 1;
}

.mock-dock {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 12rpx 16rpx;
    border-radius: 36rpx;
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(24rpx);
    -webkit-backdrop-filter: blur(24rpx);
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.2);

    &__icon {
        width: 64rpx;
        height: 64rpx;
        border-radius: 16rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.25);
    }
}

/* 模拟桌面切换开关 */
.toggle-mock-pill {
    position: absolute;
    bottom: 24rpx;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 8rpx 18rpx;
    border-radius: 999rpx;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(12rpx);
    -webkit-backdrop-filter: blur(12rpx);
    border: 1rpx solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 10;

    &:active {
        transform: translateX(-50%) scale(0.94);
    }

    &.is-active {
        background: rgba(99, 102, 241, 0.85);
        border-color: rgba(255, 255, 255, 0.35);
    }

    .toggle-text {
        font-size: 20rpx;
        color: #ffffff;
        font-weight: 600;
    }
}

/* 大号醒目更换壁纸操作条 */
.change-wallpaper-strip {
    width: 100%;
    border-radius: 28rpx;
    padding: 24rpx 28rpx;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;

    &:active {
        transform: scale(0.985);
        opacity: 0.9;
    }

    .strip-left {
        display: flex;
        align-items: center;
        gap: 20rpx;
    }

    .strip-icon-circle {
        width: 76rpx;
        height: 76rpx;
        border-radius: 24rpx;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6rpx 16rpx rgba(99, 102, 241, 0.35);
        flex-shrink: 0;
    }

    .strip-text-group {
        display: flex;
        flex-direction: column;
        gap: 6rpx;
    }

    .strip-title {
        font-size: 30rpx;
        font-weight: 700;
        line-height: 1.2;
    }

    .strip-desc {
        font-size: 22rpx;
        line-height: 1.2;
    }

    .strip-action-badge {
        display: flex;
        align-items: center;
        gap: 4rpx;
        padding: 10rpx 22rpx;
        border-radius: 999rpx;
        flex-shrink: 0;

        .badge-text {
            font-size: 24rpx;
            font-weight: 600;
        }
    }
}

/* 2. 调节控制面板 */
.controls-panel {
    width: 100%;
    border-radius: 36rpx;
    padding: 32rpx 28rpx;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 32rpx;
}

.panel-section {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.section-title {
    font-size: 26rpx;
    font-weight: 700;
    letter-spacing: 0.5rpx;
}

.presets-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16rpx;
}

.preset-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16rpx 8rpx;
    border-radius: 20rpx;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

    &:active {
        transform: scale(0.96);
    }

    .preset-name {
        font-size: 22rpx;
        font-weight: 600;
        line-height: 1.2;
    }

    .preset-value {
        font-size: 18rpx;
        opacity: 0.6;
        margin-top: 4rpx;
    }
}

.slider-block {
    display: flex;
    flex-direction: column;
    gap: 4rpx;

    .slider-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 8rpx;
    }

    .meta-label {
        font-size: 24rpx;
        font-weight: 500;
        opacity: 0.85;
    }

    .meta-num {
        font-size: 22rpx;
        font-weight: 700;
        color: #6366f1;
    }
}

/* 3. 底部吸底操作栏 */
.bottom-action-bar {
    flex-shrink: 0;
    padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(24rpx);
    -webkit-backdrop-filter: blur(24rpx);
}

.save-btn {
    width: 100%;
    height: 96rpx;
    border-radius: 999rpx;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    border: none;
    box-shadow: 0 12rpx 32rpx rgba(99, 102, 241, 0.35);
    transition: all 0.2s;

    &:active {
        opacity: 0.9;
        transform: scale(0.98);
    }

    &[disabled] {
        opacity: 0.6;
    }

    &-text {
        font-size: 30rpx;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: 1rpx;
    }
}

/* 隐藏离屏合成 Canvas */
.frosted-hidden-canvas {
    position: fixed;
    top: -99999px;
    left: -99999px;
    pointer-events: none;
    opacity: 0;
    z-index: -10;
}
</style>
