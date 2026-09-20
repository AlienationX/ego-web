<template>
    <view class="puzzle-page" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 顶部导航栏 -->
        <view class="puzzle-nav-bar" :style="{ paddingTop: `${statusBarHeight}px` }">
            <view class="nav-content">
                <view class="nav-back-btn" @click="handleNavBack">
                    <mdi-icon path="/static/icons/arrow-left.svg" size="22px" :color="settingsStore.isDark ? '#f8fafc' : '#0f172a'" />
                </view>
                <text class="nav-title">{{ currentStep === 'template' ? t('puzzle.title') : t('puzzle.adjustTitle') }}</text>
                <view class="nav-right-placeholder"></view>
            </view>
        </view>

        <!-- 阶段 1：模板选择页 (复刻附件2) -->
        <view v-if="currentStep === 'template'" class="template-step">
            <scroll-view class="template-scroll" scroll-y :show-scrollbar="false">
                <view class="template-grid">
                    <view
                        v-for="tpl in templateList"
                        :key="tpl.id"
                        class="template-card"
                        @click="handleSelectTemplate(tpl)"
                    >
                        <view class="template-preview" :style="{ background: tpl.previewBg }">
                            <!-- 模拟手帐质感插画与相框 -->
                            <view class="tpl-visual-box">
                                <view
                                    v-for="(layer, lIdx) in tpl.layers"
                                    :key="lIdx"
                                    class="tpl-photo-card"
                                    :style="{
                                        top: layer.top,
                                        left: layer.left,
                                        transform: `rotate(${layer.rotate}deg)`,
                                        zIndex: layer.zIndex
                                    }"
                                >
                                    <image class="tpl-img" :src="layer.src" mode="aspectFill" />
                                </view>
                                <!-- 手帐贴纸/胶带装饰 -->
                                <view v-if="tpl.sticker" class="tpl-sticker-badge" :style="tpl.sticker.style">
                                    <text class="sticker-text">{{ tpl.sticker.text }}</text>
                                </view>
                            </view>
                        </view>
                        <view class="template-info">
                            <text class="template-name">{{ t(tpl.nameKey) }}</text>
                            <view class="template-badge-btn">
                                <text class="badge-text">{{ t(tpl.tagKey) }} ➔</text>
                            </view>
                        </view>
                    </view>
                </view>
            </scroll-view>
        </view>

        <!-- 阶段 2：调整照片编辑页 (复刻附件3) -->
        <view v-else class="editor-step">
            <!-- 顶部图层调节浮动黑条 [置顶 | 上移 | 下移 | 置底 | 随意] -->
            <view class="layer-control-bar">
                <view class="layer-btn" :class="{ 'is-disabled': activeIndex === -1 }" @click="bringToFront">
                    <text class="layer-btn-text">{{ t('puzzle.bringToFront') }}</text>
                </view>
                <view class="divider"></view>
                <view class="layer-btn" :class="{ 'is-disabled': activeIndex === -1 }" @click="moveUp">
                    <text class="layer-btn-text">{{ t('puzzle.moveUp') }}</text>
                </view>
                <view class="divider"></view>
                <view class="layer-btn" :class="{ 'is-disabled': activeIndex === -1 }" @click="moveDown">
                    <text class="layer-btn-text">{{ t('puzzle.moveDown') }}</text>
                </view>
                <view class="divider"></view>
                <view class="layer-btn" :class="{ 'is-disabled': activeIndex === -1 }" @click="sendToBack">
                    <text class="layer-btn-text">{{ t('puzzle.sendToBack') }}</text>
                </view>
                <view class="divider"></view>
                <view class="layer-btn layer-btn--random" @click="handleRandomShuffle">
                    <mdi-icon path="/static/icons/reload.svg" size="13px" color="#ffffff" />
                    <text class="layer-btn-text random-text">{{ t('puzzle.randomShuffle') }}</text>
                </view>
            </view>

            <!-- 核心壁纸主画布区 (根据选中的比例动态自适应尺寸) -->
            <view class="canvas-stage-wrapper" @click="deselectPhoto">
                <view
                    id="puzzle-canvas-stage"
                    class="canvas-stage"
                    :style="{
                        backgroundColor: currentBgColor,
                        width: `${currentRatioConfig.stageW}px`,
                        height: `${currentRatioConfig.stageH}px`
                    }"
                    @touchstart="handleTouchStart"
                    @touchmove="handleTouchMove"
                    @touchend="handleTouchEnd"
                >
                    <!-- 照片图层列表 -->
                    <view
                        v-for="(item, index) in photoLayers"
                        :key="item.id"
                        class="photo-layer-item"
                        :class="{ 'is-active': activeIndex === index }"
                        :style="{
                            width: `${item.width}px`,
                            height: `${item.height}px`,
                            transform: `translate3d(${item.x}px, ${item.y}px, 0) scale(${item.scale}) rotate(${item.rotation}deg)`,
                            zIndex: item.zIndex
                        }"
                        @click.stop="selectPhoto(index)"
                    >
                        <!-- 拍立得白边相框 (高质感拍立得边框) -->
                        <view class="polaroid-frame" :style="{ width: `${item.width}px`, height: `${item.height}px` }">
                            <image
                                class="photo-inner-img"
                                :src="item.url"
                                mode="aspectFill"
                                :style="{ width: `${item.width - 16}px`, height: `${item.height - 32}px` }"
                            />
                        </view>

                        <!-- 激活时的 4 个角落控制手柄 -->
                        <template v-if="activeIndex === index">
                            <!-- ↖ 左上角：替换图片 -->
                            <view class="handle-btn handle-btn--replace" @click.stop="openReplacePicker(index)">
                                <mdi-icon path="/static/icons/image.svg" size="14px" color="#ffffff" />
                            </view>
                            <!-- ↗ 右上角：删除 (红叉) -->
                            <view class="handle-btn handle-btn--delete" @click.stop="deletePhoto(index)">
                                <mdi-icon path="/static/icons/close.svg" size="14px" color="#ffffff" />
                            </view>
                            <!-- ↙ 左下角：旋转手柄 -->
                            <view
                                class="handle-btn handle-btn--rotate"
                                @click.stop="rotateCurrentPhoto"
                                @touchstart.stop="onRotateHandleStart($event, index)"
                                @touchmove.stop="onRotateHandleMove"
                            >
                                <mdi-icon path="/static/icons/reload.svg" size="14px" color="#ffffff" />
                            </view>
                            <!-- ↘ 右下角：等比缩放手柄 -->
                            <view
                                class="handle-btn handle-btn--scale"
                                @touchstart.stop="onScaleHandleStart($event, index)"
                                @touchmove.stop="onScaleHandleMove"
                            >
                                <mdi-icon path="/static/icons/arrow-expand.svg" size="14px" color="#ffffff" />
                            </view>
                        </template>
                    </view>
                </view>
            </view>

            <!-- 底部控制面板 -->
            <view class="editor-bottom-panel">
                <!-- 1. 画布比例调整行 -->
                <view class="ratio-select-row">
                    <text class="panel-section-label">{{ t('puzzle.canvasRatio') }}</text>
                    <view class="ratio-tabs">
                        <view
                            v-for="(cfg, rKey) in ratioConfigs"
                            :key="rKey"
                            class="ratio-pill"
                            :class="{ 'is-active': selectedRatio === rKey }"
                            @click="handleRatioChange(rKey)"
                        >
                            <text class="ratio-tag">{{ cfg.label }}</text>
                            <text class="ratio-name">{{ t(cfg.nameKey) }}</text>
                        </view>
                    </view>
                </view>

                <!-- 2. 画布底色选择行 -->
                <view class="bg-palette-row">
                    <text class="panel-section-label">{{ t('puzzle.canvasBg') }}</text>
                    <scroll-view class="palette-scroll" scroll-x :show-scrollbar="false">
                        <view class="palette-list">
                            <view
                                v-for="color in bgColors"
                                :key="color"
                                class="color-dot"
                                :class="{ 'is-selected': currentBgColor === color }"
                                :style="{ backgroundColor: color }"
                                @click="currentBgColor = color"
                            >
                                <view v-if="currentBgColor === color" class="color-dot-inner"></view>
                            </view>
                        </view>
                    </scroll-view>
                </view>

                <!-- 3. 操作与完成按钮行 -->
                <view class="action-btn-row">
                    <!-- 左侧：照片与图层 (X/9) -->
                    <view class="manage-layers-btn" @click="openManagePicker">
                        <mdi-icon path="/static/icons/view-grid.svg" size="16px" :color="settingsStore.isDark ? '#f8fafc' : '#1e293b'" />
                        <text class="manage-text">{{ t('puzzle.photosAndLayers') }} ({{ photoLayers.length }}/9)</text>
                    </view>

                    <!-- 右侧：保存并预览 (紫色大胶囊按钮) -->
                    <view class="save-preview-btn" :class="{ 'is-loading': isExporting }" @click="generateAndPreview">
                        <mdi-icon v-if="!isExporting" path="/static/icons/eye.svg" size="18px" color="#ffffff" />
                        <text class="save-text">{{ isExporting ? t('puzzle.generating') : t('puzzle.saveAndPreview') }}</text>
                    </view>
                </view>

                <!-- 底部交互提示语 -->
                <view class="editor-tip-text">
                    <text>{{ t('puzzle.tip') }}</text>
                </view>
            </view>
        </view>

        <!-- 选图抽屉组件 (puzzle-image-picker.vue) -->
        <puzzle-image-picker
            v-model:visible="showPicker"
            :max-count="9"
            :single-mode="isReplaceMode"
            :initial-images="pickerInitialImages"
            @confirm="handleImagesSelected"
        />

        <!-- 全屏高清壁纸合成与保存预览弹窗 (去时钟 + 精致深色磨砂美化) -->
        <view v-if="showPreviewModal" class="preview-modal-mask" @click="showPreviewModal = false">
            <view class="preview-modal-body" @click.stop>
                <!-- 弹窗顶部状态信息条 -->
                <view class="preview-header-bar">
                    <view class="preview-info-tag">
                        <text class="preview-title-text">{{ t('puzzle.previewTitle') }}</text>
                        <text class="preview-ratio-badge">{{ currentRatioConfig.label }} · {{ exportCanvasWidth }}×{{ exportCanvasHeight }}</text>
                    </view>
                    <view class="preview-close-icon" @click="showPreviewModal = false">
                        <mdi-icon path="/static/icons/close.svg" size="18px" color="#ffffff" />
                    </view>
                </view>

                <!-- 壁纸卡片渲染展示区 -->
                <view
                    class="preview-card-wrap"
                    :style="{
                        aspectRatio: `${exportCanvasWidth} / ${exportCanvasHeight}`,
                        maxHeight: exportCanvasHeight >= exportCanvasWidth ? '820rpx' : '460rpx',
                        maxWidth: exportCanvasWidth > exportCanvasHeight ? '620rpx' : '460rpx'
                    }"
                >
                    <image class="exported-wallpaper-img" :src="exportedImageUrl" mode="aspectFit" />
                </view>

                <!-- 弹窗底部操作条 -->
                <view class="preview-actions">
                    <view class="btn-group">
                        <view class="modal-btn modal-btn--cancel" @click="showPreviewModal = false">
                            <text>{{ t('puzzle.backToEdit') }}</text>
                        </view>
                        <view class="modal-btn modal-btn--save" @click="saveToAlbum">
                            <mdi-icon path="/static/icons/download.svg" size="18px" color="#ffffff" />
                            <text>{{ t('puzzle.saveToAlbum') }}</text>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <!-- 离屏 Canvas 合成容器 (用于输出对应宽高的高清壁纸) -->
        <canvas
            canvas-id="exportCanvas"
            class="export-offscreen-canvas"
            :style="{ width: `${exportCanvasWidth}px`, height: `${exportCanvasHeight}px` }"
        ></canvas>

        <!-- 广告激励与 VIP 解锁弹窗组件 -->
        <popup-ad-prompt ref="adPopup" :picurl="exportedImageUrl"></popup-ad-prompt>

        <!-- 退出调整确认对话框 (统一使用系统高品质导航对话框) -->
        <popup-navigation-dialog
            ref="navDialog"
            :title="dialogState.title"
            :description="dialogState.description"
            :confirm-text="dialogState.confirmText"
            :cancel-text="dialogState.cancelText"
            :show-cancel="dialogState.showCancel"
            @confirm="dialogState.onConfirm"
            @cancel="dialogState.onCancel"
        ></popup-navigation-dialog>
    </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserStore } from '@/stores/user.js';
import { useAppStore } from '@/stores/app.js';
import { getStatusBarHeight } from '@/utils/layout.js';
import { executeWithAuth } from '@/utils/auth-action.js';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const userStore = useUserStore();
const adPopup = ref(null);
const statusBarHeight = computed(() => getStatusBarHeight() || 24);

// 通用导航对话框控制 (popup-navigation-dialog)
const navDialog = ref(null);
const dialogState = reactive({
    title: '',
    description: '',
    confirmText: '',
    cancelText: '',
    showCancel: true,
    onConfirm: () => {},
    onCancel: () => {},
});

const showNavDialog = (options = {}) => {
    dialogState.title = options.title || t('common.tip');
    dialogState.description = options.content || options.description || '';
    dialogState.confirmText = options.confirmText || t('common.confirm');
    dialogState.cancelText = options.cancelText || t('common.cancel');
    dialogState.showCancel = options.showCancel !== false;
    dialogState.onConfirm = () => {
        navDialog.value?.close();
        if (typeof options.onConfirm === 'function') {
            options.onConfirm();
        }
    };
    dialogState.onCancel = () => {
        navDialog.value?.close();
        if (typeof options.onCancel === 'function') {
            options.onCancel();
        }
    };
    navDialog.value?.open();
};

// 阶段流转：'template' 模板选择 | 'edit' 调整照片
const currentStep = ref('template');
const selectedTemplate = ref(null);

// 选图抽屉状态
const showPicker = ref(false);
const isReplaceMode = ref(false);
const replaceTargetIndex = ref(-1);

// 画布底色选择 (复刻附件3)
const bgColors = [
    '#ffffff', // 纯白
    '#f7f7f9', // 燕麦浅灰
    '#e2e8f0', // 冷调浅蓝灰
    '#fae8e0', // 温暖浅杏
    '#1e222d', // 经典炭黑
    '#fce7f3', // 浪漫淡粉
    '#e0e7ff', // 浅薰衣草蓝
];
const currentBgColor = ref('#ffffff');

// 图层数据列表
const photoLayers = ref([]);
const activeIndex = ref(0);

// 画布尺寸与比例配置 (支持 9:16 壁纸、3:4 相纸、1:1 方形、16:9 横屏)
const selectedRatio = ref('9:16');

// 边界安全钳制：基于外接旋转矩形数学模型，严格限制图层绝不出界被裁
const clampLayerToBounds = (layer, stageW, stageH) => {
    const cardW = layer.width * layer.scale;
    const cardH = layer.height * layer.scale;
    const rad = (Math.abs(layer.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const halfBoundW = (cardW / 2) * cos + (cardH / 2) * sin;
    const halfBoundH = (cardW / 2) * sin + (cardH / 2) * cos;
    const pad = 6;

    const minCenterX = halfBoundW + pad;
    const maxCenterX = stageW - halfBoundW - pad;
    const minCenterY = halfBoundH + pad;
    const maxCenterY = stageH - halfBoundH - pad;

    let curCenterX = layer.x + layer.width / 2;
    let curCenterY = layer.y + layer.height / 2;

    if (maxCenterX >= minCenterX) {
        curCenterX = Math.max(minCenterX, Math.min(maxCenterX, curCenterX));
    } else {
        curCenterX = stageW / 2;
    }

    if (maxCenterY >= minCenterY) {
        curCenterY = Math.max(minCenterY, Math.min(maxCenterY, curCenterY));
    } else {
        curCenterY = stageH / 2;
    }

    layer.x = Math.round(curCenterX - layer.width / 2);
    layer.y = Math.round(curCenterY - layer.height / 2);
};

// 16:9 横屏专属智能排版 (横向错落排开，彻底避免重叠遮挡与出界被裁)
const applyLandscapeLayout = (stageW, stageH) => {
    const total = photoLayers.value.length;
    if (total === 0) return;

    let targetScale = 0.62;
    if (total <= 2) targetScale = 0.66;
    else if (total <= 4) targetScale = 0.60;
    else if (total <= 6) targetScale = 0.54;
    else targetScale = 0.48;

    const rotList = [-5, 6, -4, 5, -6, 4, -3, 5, -4];

    photoLayers.value.forEach((layer, idx) => {
        layer.scale = targetScale;
        layer.rotation = rotList[idx % rotList.length];
        layer.zIndex = idx + 1;

        const cardW = layer.width * targetScale;
        const centerY = (stageH - layer.height) / 2;

        if (total === 1) {
            layer.x = Math.round((stageW - layer.width) / 2);
            layer.y = Math.round(centerY);
        } else if (total === 2) {
            const spacing = stageW * 0.36;
            const midX = (stageW - layer.width) / 2;
            layer.x = Math.round(idx === 0 ? midX - spacing / 2 : midX + spacing / 2);
            layer.y = Math.round(idx === 0 ? centerY - 8 : centerY + 8);
        } else if (total === 3) {
            const margin = Math.max(16, (stageW - cardW * 3) / 4);
            const slot = (stageW - margin * 2 - cardW) / 2;
            const visualLeft = margin + idx * slot;
            layer.x = Math.round(visualLeft - (layer.width - cardW) / 2);
            layer.y = Math.round(centerY + (idx === 1 ? 12 : -10));
        } else if (total === 4) {
            const margin = Math.max(12, (stageW - cardW * 4) / 5);
            const slot = (stageW - margin * 2 - cardW) / 3;
            const visualLeft = margin + idx * slot;
            const yOffsets = [-12, 10, -8, 12];
            layer.x = Math.round(visualLeft - (layer.width - cardW) / 2);
            layer.y = Math.round(centerY + yOffsets[idx]);
        } else {
            const minX = 14;
            const maxX = stageW - cardW - 14;
            const visualLeft = minX + (idx / (total - 1)) * (maxX - minX);
            layer.x = Math.round(visualLeft - (layer.width - cardW) / 2);
            layer.y = Math.round(centerY + (idx % 2 === 0 ? -12 : 12));
        }

        clampLayerToBounds(layer, stageW, stageH);
    });
};

// 从 16:9 切回 9:16/3:4/1:1 竖屏或正方时，恢复竖屏舒适排版
const applyPortraitLayout = (stageW, stageH, ratioKey) => {
    const total = photoLayers.value.length;
    if (total === 0) return;

    const baseScale = 1.0;
    const centerX = (stageW - (photoLayers.value[0]?.width || 140)) / 2;
    const centerY = (stageH - (photoLayers.value[0]?.height || 180)) / 2;
    const rotPattern = [-6, 7, -4, 8, -7, 5, -5, 6, -3];

    photoLayers.value.forEach((layer, idx) => {
        layer.scale = baseScale;
        layer.rotation = rotPattern[idx % rotPattern.length];
        layer.zIndex = idx + 1;

        if (total === 1) {
            layer.x = Math.round(centerX);
            layer.y = Math.round(centerY);
        } else if (total === 2) {
            layer.x = Math.round(idx === 0 ? centerX - 24 : centerX + 24);
            layer.y = Math.round(idx === 0 ? centerY - 30 : centerY + 30);
        } else if (total === 3) {
            if (idx === 0) { layer.x = Math.round(centerX - 26); layer.y = Math.round(centerY - 44); }
            if (idx === 1) { layer.x = Math.round(centerX + 26); layer.y = Math.round(centerY - 8); }
            if (idx === 2) { layer.x = Math.round(centerX - 8);  layer.y = Math.round(centerY + 44); }
        } else if (total === 4) {
            if (idx === 0) { layer.x = Math.round(centerX - 10); layer.y = Math.round(centerY - 70); }
            if (idx === 1) { layer.x = Math.round(centerX - 42); layer.y = Math.round(centerY - 16); }
            if (idx === 2) { layer.x = Math.round(centerX + 38); layer.y = Math.round(centerY + 10); }
            if (idx === 3) { layer.x = Math.round(centerX - 12); layer.y = Math.round(centerY + 74); }
        } else {
            const angle = (idx / total) * 2 * Math.PI;
            const rx = Math.min(centerX * 0.45, 48);
            const ry = Math.min(centerY * 0.45, 58);
            layer.x = Math.round(centerX + Math.cos(angle) * rx);
            layer.y = Math.round(centerY + Math.sin(angle) * ry);
        }

        clampLayerToBounds(layer, stageW, stageH);
    });
};

// 计算最大化填充屏幕的舞台尺寸 (自适应机型屏幕宽高，确保不被顶底控制面板遮挡，使用 getWindowInfo 消除废弃警告)
const calcDynamicStageSizes = () => {
    let availW = 360;
    let availH = 460;
    try {
        let winW = 390;
        let winH = 844;
        let sbH = statusBarHeight.value || 24;
        let safeBottom = 34;

        if (typeof uni.getWindowInfo === 'function') {
            const win = uni.getWindowInfo();
            winW = win.windowWidth || winW;
            winH = win.windowHeight || winH;
            if (win.statusBarHeight) sbH = win.statusBarHeight;
            if (win.safeAreaInsets && typeof win.safeAreaInsets.bottom === 'number') {
                safeBottom = win.safeAreaInsets.bottom;
            }
        } else if (typeof wx !== 'undefined' && typeof wx.getWindowInfo === 'function') {
            const win = wx.getWindowInfo();
            winW = win.windowWidth || winW;
            winH = win.windowHeight || winH;
            if (win.statusBarHeight) sbH = win.statusBarHeight;
            if (win.safeAreaInsets && typeof win.safeAreaInsets.bottom === 'number') {
                safeBottom = win.safeAreaInsets.bottom;
            }
        } else {
            const sys = uni.getSystemInfoSync();
            winW = sys.windowWidth || winW;
            winH = sys.windowHeight || winH;
            if (sys.statusBarHeight) sbH = sys.statusBarHeight;
            if (sys.safeAreaInsets && typeof sys.safeAreaInsets.bottom === 'number') {
                safeBottom = sys.safeAreaInsets.bottom;
            }
        }

        // 左右边距留出各 14px
        availW = Math.max(280, winW - 28);

        // 严格扣除各区域实际高度，绝不让画布溢出或被遮挡：
        // 1. 顶部导航栏：sbH + 44px
        // 2. 顶部胶囊控制条：高约 34px + 上下 margin (6rpx + 10rpx = 8px) = 42px
        // 3. 底部操作面板：4 行选项高约 180px + 内外边距 24px + 底部安全区 (safeBottom) = 约 204px + safeBottom
        // 4. 画布外层 wrapper padding：上下各 8px = 16px
        const topBarTotal = sbH + 44 + 42;
        const bottomPanelTotal = 204 + safeBottom;
        const stagePadding = 16;
        availH = Math.max(300, winH - topBarTotal - bottomPanelTotal - stagePadding);
    } catch (e) {}

    const computeSize = (rw, rh) => {
        const targetAspect = rw / rh;
        const availAspect = availW / availH;
        if (availAspect > targetAspect) {
            // 高度优先拉满
            const h = Math.round(availH);
            const w = Math.round(h * targetAspect);
            return { w, h };
        } else {
            // 宽度优先拉满
            const w = Math.round(availW);
            const h = Math.round(w / targetAspect);
            return { w, h };
        }
    };

    const s9_16 = computeSize(9, 16);
    const s3_4  = computeSize(3, 4);
    const s1_1  = computeSize(1, 1);
    const s16_9 = computeSize(16, 9);

    return {
        '9:16': { id: '9:16', nameKey: 'puzzle.ratioPhone', label: '9:16', exportW: 1080, exportH: 1920, stageW: s9_16.w, stageH: s9_16.h },
        '3:4':  { id: '3:4',  nameKey: 'puzzle.ratioPortrait', label: '3:4',  exportW: 1080, exportH: 1440, stageW: s3_4.w,  stageH: s3_4.h },
        '1:1':  { id: '1:1',  nameKey: 'puzzle.ratioSquare', label: '1:1',  exportW: 1080, exportH: 1080, stageW: s1_1.w,  stageH: s1_1.h },
        '16:9': { id: '16:9', nameKey: 'puzzle.ratioLandscape', label: '16:9', exportW: 1920, exportH: 1080, stageW: s16_9.w, stageH: s16_9.h },
    };
};

const ratioConfigs = ref(calcDynamicStageSizes());

const currentRatioConfig = computed(() => {
    return ratioConfigs.value[selectedRatio.value] || ratioConfigs.value['9:16'];
});

let stageWidth = currentRatioConfig.value.stageW;
let stageHeight = currentRatioConfig.value.stageH;
const exportCanvasWidth = ref(currentRatioConfig.value.exportW);
const exportCanvasHeight = ref(currentRatioConfig.value.exportH);

// 导出与全屏预览
const isExporting = ref(false);
const showPreviewModal = ref(false);
const exportedImageUrl = ref('');

// 切换画布尺寸比例
const handleRatioChange = (ratioKey) => {
    if (selectedRatio.value === ratioKey) return;
    const oldRatio = selectedRatio.value;
    const oldConfig = currentRatioConfig.value;
    const newConfig = ratioConfigs.value[ratioKey];
    if (!newConfig) return;

    selectedRatio.value = ratioKey;
    exportCanvasWidth.value = newConfig.exportW;
    exportCanvasHeight.value = newConfig.exportH;

    if (ratioKey === '16:9') {
        // 切换到 16:9 横屏：执行横屏专属无遮挡自适应排版
        applyLandscapeLayout(newConfig.stageW, newConfig.stageH);
    } else if (oldRatio === '16:9') {
        // 从 16:9 切换回竖屏/方屏 (9:16, 3:4, 1:1)：恢复竖屏舒适排版
        applyPortraitLayout(newConfig.stageW, newConfig.stageH, ratioKey);
    } else {
        // 竖屏与方屏之间的比例平移
        const ratioX = newConfig.stageW / oldConfig.stageW;
        const ratioY = newConfig.stageH / oldConfig.stageH;
        photoLayers.value.forEach((l) => {
            l.x = Math.round(l.x * ratioX);
            l.y = Math.round(l.y * ratioY);
            clampLayerToBounds(l, newConfig.stageW, newConfig.stageH);
        });
    }

    setTimeout(() => {
        measureStage();
    }, 150);
};

// 模板列表数据 (复刻附件2)
const templateList = ref([
    {
        id: 'minimal_free',
        nameKey: 'puzzle.tplMinimalFree',
        tagKey: 'puzzle.tagFree1to9',
        previewBg: '#f8fafc',
        defaultBg: '#ffffff',
        layers: [
            { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=260&q=80', top: '15%', left: '16%', rotate: -6, zIndex: 1 },
            { src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=260&q=80', top: '35%', left: '38%', rotate: 8, zIndex: 2 },
        ],
    },
    {
        id: 'cute_pet',
        nameKey: 'puzzle.tplCutePet',
        tagKey: 'puzzle.tagJournal9',
        previewBg: '#fef9c3',
        defaultBg: '#fefce8',
        sticker: { text: 'HAPPY PAWS 🐾', style: 'top: 10rpx; right: 12rpx; background: #fef08a; color: #854d0e;' },
        layers: [
            { src: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=260&q=80', top: '10%', left: '35%', rotate: 4, zIndex: 1 },
            { src: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=260&q=80', top: '32%', left: '12%', rotate: -5, zIndex: 2 },
            { src: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=260&q=80', top: '48%', left: '38%', rotate: 6, zIndex: 3 },
        ],
    },
    {
        id: 'road_trip',
        nameKey: 'puzzle.tplRoadTrip',
        tagKey: 'puzzle.tagJournal9',
        previewBg: '#fef3c7',
        defaultBg: '#fef9c3',
        sticker: { text: 'ON THE ROAD ✈', style: 'bottom: 24rpx; left: 16rpx; background: #fed7aa; color: #9a3412;' },
        layers: [
            { src: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=260&q=80', top: '12%', left: '10%', rotate: -7, zIndex: 1 },
            { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=260&q=80', top: '45%', left: '25%', rotate: 4, zIndex: 2 },
        ],
    },
    {
        id: 'love_letter',
        nameKey: 'puzzle.tplLoveLetter',
        tagKey: 'puzzle.tagJournal9',
        previewBg: '#fce7f3',
        defaultBg: '#fff1f2',
        sticker: { text: 'FOREVER LOVE 💌', style: 'top: 14rpx; left: 18rpx; background: #fbcfe8; color: #9d174d;' },
        layers: [
            { src: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=260&q=80', top: '16%', left: '24%', rotate: 5, zIndex: 1 },
            { src: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=260&q=80', top: '46%', left: '28%', rotate: -6, zIndex: 2 },
        ],
    },
    {
        id: 'coffee_story',
        nameKey: 'puzzle.tplCoffeeStory',
        tagKey: 'puzzle.tagJournal9',
        previewBg: '#f5ebe0',
        defaultBg: '#fae8e0',
        sticker: { text: 'CAFE MAISON ☕', style: 'bottom: 16rpx; right: 16rpx; background: #e6ccb2; color: #7f5539;' },
        layers: [
            { src: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=260&q=80', top: '20%', left: '16%', rotate: -8, zIndex: 1 },
            { src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=260&q=80', top: '40%', left: '32%', rotate: 5, zIndex: 2 },
        ],
    },
    {
        id: 'floral_whisper',
        nameKey: 'puzzle.tplFloralWhisper',
        tagKey: 'puzzle.tagJournal9',
        previewBg: '#f3e8ff',
        defaultBg: '#faf5ff',
        sticker: { text: 'FLORAL BLOOM 🌸', style: 'top: 12rpx; right: 14rpx; background: #e9d5ff; color: #6b21a8;' },
        layers: [
            { src: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=260&q=80', top: '18%', left: '30%', rotate: 6, zIndex: 1 },
            { src: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=260&q=80', top: '42%', left: '15%', rotate: -4, zIndex: 2 },
        ],
    },
]);

// 初始选图传递
const pickerInitialImages = computed(() => {
    return photoLayers.value.map((item) => item.url);
});

// 测量画布尺寸
const measureStage = () => {
    uni.createSelectorQuery()
        .select('#puzzle-canvas-stage')
        .boundingClientRect((rect) => {
            if (rect && rect.width && rect.height) {
                stageWidth = rect.width;
                stageHeight = rect.height;
            }
        })
        .exec();
};

onMounted(() => {
    ratioConfigs.value = calcDynamicStageSizes();
    exportCanvasWidth.value = currentRatioConfig.value.exportW;
    exportCanvasHeight.value = currentRatioConfig.value.exportH;
    setTimeout(() => {
        measureStage();
    }, 150);
});

// 1. 点击选择模板
const handleSelectTemplate = (tpl) => {
    selectedTemplate.value = tpl;
    currentBgColor.value = tpl.defaultBg || '#ffffff';
    isReplaceMode.value = false;
    showPicker.value = true;
};

// 2. 从图片选择器获取选中的图片
const handleImagesSelected = (urls) => {
    if (isReplaceMode.value && replaceTargetIndex.value >= 0) {
        if (urls.length > 0) {
            photoLayers.value[replaceTargetIndex.value].url = urls[0];
        }
        isReplaceMode.value = false;
        replaceTargetIndex.value = -1;
        return;
    }

    // 首次或全量编辑：布局生成
    buildInitialLayers(urls);
    currentStep.value = 'edit';
    setTimeout(() => {
        measureStage();
    }, 200);
};

// 3. 点击“随意”：画布上的图片随机艺术拼图 (16:9与竖屏自适应专属算法，绝不重叠遮挡与出界)
const handleRandomShuffle = () => {
    if (photoLayers.value.length === 0) return;

    try {
        uni.vibrateShort({ type: 'light' });
    } catch (e) {}

    const total = photoLayers.value.length;
    const curStageW = currentRatioConfig.value.stageW;
    const curStageH = currentRatioConfig.value.stageH;

    // 随机打乱前后层叠顺序
    const shuffledIndexes = photoLayers.value.map((_, i) => i).sort(() => Math.random() - 0.5);

    if (selectedRatio.value === '16:9') {
        // 16:9 横屏专属无遮挡随机拼图
        let targetScale = 0.62;
        if (total <= 2) targetScale = 0.66;
        else if (total <= 4) targetScale = 0.60;
        else if (total <= 6) targetScale = 0.54;
        else targetScale = 0.48;

        const centerY = (curStageH - (photoLayers.value[0]?.height || 180)) / 2;
        const seg = curStageW / total;

        photoLayers.value.forEach((layer, idx) => {
            // 若用户手动调整过尺寸，保留该自定义尺寸，不予覆盖重置
            if (!layer.isCustomScale) {
                layer.scale = Math.round((targetScale * (0.95 + Math.random() * 0.1)) * 100) / 100;
            }
            layer.rotation = Math.round((Math.random() * 14 - 7) * 10) / 10;
            layer.zIndex = shuffledIndexes[idx] + 1;

            const baseSlotX = (idx + 0.5) * seg - layer.width / 2;
            const jitterX = Math.random() * 16 - 8;
            const jitterY = Math.random() * 20 - 10;

            layer.x = Math.round(baseSlotX + jitterX);
            layer.y = Math.round(centerY + jitterY);

            clampLayerToBounds(layer, curStageW, curStageH);
        });
    } else {
        // 竖屏/方屏随机错落拼图
        photoLayers.value.forEach((layer, idx) => {
            // 若用户手动调整过尺寸，保留该自定义尺寸，不予覆盖重置
            if (!layer.isCustomScale) {
                // 默认随机轻微缩放 (0.94 ~ 1.06)
                layer.scale = Math.round((0.94 + Math.random() * 0.12) * 100) / 100;
            }

            const cardW = layer.width * layer.scale;
            const cardH = layer.height * layer.scale;

            const maxOffsetX = Math.max(16, (curStageW - cardW) / 2);
            const maxOffsetY = Math.max(16, (curStageH - cardH) / 2);
            const centerX = (curStageW - layer.width) / 2;
            const centerY = (curStageH - layer.height) / 2;

            // 错落旋转角度：-12° 到 +12°
            const randomRot = Math.round((Math.random() * 24 - 12) * 10) / 10;

            let offsetX = (Math.random() * 2 - 1) * (maxOffsetX * 0.65);
            let offsetY = (Math.random() * 2 - 1) * (maxOffsetY * 0.65);

            if (total > 1) {
                const angle = (idx / total) * 2 * Math.PI + (Math.random() * 0.5 - 0.25);
                const dist = 0.3 + Math.random() * 0.5;
                offsetX = Math.cos(angle) * maxOffsetX * dist;
                offsetY = Math.sin(angle) * maxOffsetY * dist;
            }

            layer.x = Math.round(centerX + offsetX);
            layer.y = Math.round(centerY + offsetY);
            layer.rotation = randomRot;
            layer.zIndex = shuffledIndexes[idx] + 1;

            clampLayerToBounds(layer, curStageW, curStageH);
        });
    }

    // 取消单独选中状态，呈现整体拼图效果
    activeIndex.value = -1;
};

// 根据所选图片列表和模板，智能计算初始排版位置、旋转和缩放
const buildInitialLayers = (urls) => {
    const curStageW = currentRatioConfig.value.stageW;
    const curStageH = currentRatioConfig.value.stageH;

    // 拍立得相框基准尺寸设定 (px，根据舞台尺寸自适应)
    const isLandscape = selectedRatio.value === '16:9';
    const baseW = isLandscape
        ? Math.max(100, Math.min(130, Math.round(curStageH * 0.55)))
        : Math.max(136, Math.min(160, Math.round(curStageW * 0.52)));
    const baseH = Math.round(baseW * 1.3);

    const rotationPattern = [-6, 7, -4, 8, -7, 5, -5, 6, -3];

    const layers = urls.map((url, idx) => {
        return {
            id: 'layer_' + Date.now() + '_' + idx,
            url,
            x: 0,
            y: 0,
            width: baseW,
            height: baseH,
            rotation: rotationPattern[idx % rotationPattern.length],
            scale: 1,
            zIndex: idx + 1,
        };
    });

    photoLayers.value = layers;

    if (isLandscape) {
        applyLandscapeLayout(curStageW, curStageH);
    } else {
        applyPortraitLayout(curStageW, curStageH, selectedRatio.value);
    }

    activeIndex.value = layers.length - 1;
};

// 导航栏返回
const handleNavBack = () => {
    if (currentStep.value === 'edit') {
        showNavDialog({
            title: t('common.tip'),
            content: t('puzzle.quitConfirmMsg'),
            confirmText: t('common.confirm'),
            cancelText: t('common.cancel'),
            onConfirm: () => {
                currentStep.value = 'template';
            },
        });
    } else {
        uni.navigateBack();
    }
};

// 选中某个照片图层
const selectPhoto = (index) => {
    activeIndex.value = index;
};

// 点击画布空白处取消选中
const deselectPhoto = () => {
    activeIndex.value = -1;
};

// 图层顺序调整
const bringToFront = () => {
    if (activeIndex.value === -1) return;
    const maxZ = Math.max(...photoLayers.value.map((l) => l.zIndex), 0);
    photoLayers.value[activeIndex.value].zIndex = maxZ + 1;
};

const sendToBack = () => {
    if (activeIndex.value === -1) return;
    const minZ = Math.min(...photoLayers.value.map((l) => l.zIndex), 1);
    photoLayers.value[activeIndex.value].zIndex = Math.max(1, minZ - 1);
};

const moveUp = () => {
    if (activeIndex.value === -1) return;
    photoLayers.value[activeIndex.value].zIndex += 1;
};

const moveDown = () => {
    if (activeIndex.value === -1) return;
    photoLayers.value[activeIndex.value].zIndex = Math.max(1, photoLayers.value[activeIndex.value].zIndex - 1);
};

// 删除某张照片
const deletePhoto = (index) => {
    photoLayers.value.splice(index, 1);
    if (photoLayers.value.length === 0) {
        currentStep.value = 'template';
        return;
    }
    activeIndex.value = Math.max(0, photoLayers.value.length - 1);
};

// 替换某张照片
const openReplacePicker = (index) => {
    replaceTargetIndex.value = index;
    isReplaceMode.value = true;
    showPicker.value = true;
};

// 点击左下角手柄顺时针旋转 45°
const rotateCurrentPhoto = () => {
    if (activeIndex.value === -1) return;
    photoLayers.value[activeIndex.value].rotation = (photoLayers.value[activeIndex.value].rotation + 45) % 360;
};

// 重新管理所有照片与图层
const openManagePicker = () => {
    isReplaceMode.value = false;
    showPicker.value = true;
};

/* ─────────────────────────────────────────────────────────────
   手势交互逻辑：单指平移、双指旋转与缩放、手柄拖动
───────────────────────────────────────────────────────────── */
let startTouchX = 0;
let startTouchY = 0;
let initialLayerX = 0;
let initialLayerY = 0;
let isDraggingLayer = false;

// 双指触控记录
let initialDistance = 0;
let initialScale = 1;
let initialAngle = 0;
let initialRotation = 0;
let isPinching = false;

const getDistance = (t1, t2) => {
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
};

const getAngle = (t1, t2) => {
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
};

const handleTouchStart = (e) => {
    if (activeIndex.value === -1) return;
    const touches = e.touches;
    const layer = photoLayers.value[activeIndex.value];
    if (!layer) return;

    if (touches.length === 1) {
        isDraggingLayer = true;
        isPinching = false;
        startTouchX = touches[0].clientX;
        startTouchY = touches[0].clientY;
        initialLayerX = layer.x;
        initialLayerY = layer.y;
    } else if (touches.length >= 2) {
        isDraggingLayer = false;
        isPinching = true;
        initialDistance = getDistance(touches[0], touches[1]);
        initialScale = layer.scale || 1;
        initialAngle = getAngle(touches[0], touches[1]);
        initialRotation = layer.rotation || 0;
    }
};

const handleTouchMove = (e) => {
    if (activeIndex.value === -1) return;
    const layer = photoLayers.value[activeIndex.value];
    if (!layer) return;

    const touches = e.touches;
    if (touches.length === 1 && isDraggingLayer) {
        const dx = touches[0].clientX - startTouchX;
        const dy = touches[0].clientY - startTouchY;
        layer.x = initialLayerX + dx;
        layer.y = initialLayerY + dy;
    } else if (touches.length >= 2 && isPinching) {
        const curDist = getDistance(touches[0], touches[1]);
        if (initialDistance > 0) {
            const scaleFactor = curDist / initialDistance;
            layer.scale = Math.max(0.4, Math.min(2.5, initialScale * scaleFactor));
            layer.isCustomScale = true;
        }
        const curAngle = getAngle(touches[0], touches[1]);
        const angleDiff = curAngle - initialAngle;
        layer.rotation = (initialRotation + angleDiff) % 360;
    }
};

const handleTouchEnd = () => {
    isDraggingLayer = false;
    isPinching = false;
    if (activeIndex.value !== -1 && photoLayers.value[activeIndex.value]) {
        clampLayerToBounds(
            photoLayers.value[activeIndex.value],
            currentRatioConfig.value.stageW,
            currentRatioConfig.value.stageH
        );
    }
};

// ↘ 缩放手柄单指拖动
let scaleHandleStartX = 0;
let scaleHandleInitialScale = 1;

const onScaleHandleStart = (e, index) => {
    activeIndex.value = index;
    scaleHandleStartX = e.touches[0].clientX;
    scaleHandleInitialScale = photoLayers.value[index].scale || 1;
};

const onScaleHandleMove = (e) => {
    if (activeIndex.value === -1) return;
    const dx = e.touches[0].clientX - scaleHandleStartX;
    const factor = 1 + dx / 150;
    const curLayer = photoLayers.value[activeIndex.value];
    if (curLayer) {
        curLayer.scale = Math.max(0.4, Math.min(2.5, scaleHandleInitialScale * factor));
        curLayer.isCustomScale = true;
    }
};

// ↙ 旋转手柄单指拖动
let rotateHandleStartX = 0;
let rotateHandleInitialRotation = 0;

const onRotateHandleStart = (e, index) => {
    activeIndex.value = index;
    rotateHandleStartX = e.touches[0].clientX;
    rotateHandleInitialRotation = photoLayers.value[index].rotation || 0;
};

const onRotateHandleMove = (e) => {
    if (activeIndex.value === -1) return;
    const dx = e.touches[0].clientX - rotateHandleStartX;
    photoLayers.value[activeIndex.value].rotation = (rotateHandleInitialRotation + dx * 1.5) % 360;
};

/* ─────────────────────────────────────────────────────────────
   3. 高清 Canvas 合成与壁纸导出 (1:1 像素级还原编辑舞台效果)
───────────────────────────────────────────────────────────── */
const drawRoundedRectPath = (ctx, x, y, width, height, radius) => {
    const r = Math.max(0, Math.min(radius, width / 2, height / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.arc(x + width - r, y + r, r, -Math.PI / 2, 0);
    ctx.lineTo(x + width, y + height - r);
    ctx.arc(x + width - r, y + height - r, r, 0, Math.PI / 2);
    ctx.lineTo(x + r, y + height);
    ctx.arc(x + r, y + height - r, r, Math.PI / 2, Math.PI);
    ctx.lineTo(x, y + r);
    ctx.arc(x + r, y + r, r, Math.PI, (Math.PI * 3) / 2);
    ctx.closePath();
};

const fillRoundedRect = (ctx, x, y, width, height, radius) => {
    drawRoundedRectPath(ctx, x, y, width, height, radius);
    ctx.fill();
};

const clipRoundedRect = (ctx, x, y, width, height, radius) => {
    drawRoundedRectPath(ctx, x, y, width, height, radius);
    ctx.clip();
};

/**
 * 健壮获取图片本地可用文件路径与宽高尺寸
 * 解决微信小程序中 Canvas.drawImage 仅支持本地文件、且直接对网络 WebP 调用 getImageInfo 会抛出 fail invalid 的问题
 */
const fetchLocalImageInfo = async (url) => {
    if (!url) {
        return { path: '', width: 800, height: 1000 };
    }

    // 1. 本地文件直接读取（相册临时文件 wxfile://、http://tmp/、file://、/static/ 等）
    const isRemote = url.startsWith('http://') || url.startsWith('https://');
    if (!isRemote) {
        return new Promise((resolve) => {
            uni.getImageInfo({
                src: url,
                success: (res) => {
                    resolve({ path: res.path || url, width: res.width || 800, height: res.height || 1000 });
                },
                fail: (err) => {
                    console.warn('本地图片获取信息失败，直接使用原路径:', url, err);
                    resolve({ path: url, width: 800, height: 1000 });
                },
            });
        });
    }

    // 2. 网络图片处理：在微信小程序等环境下，CanvasContext.drawImage 不支持网络 URL
    // 必须先通过 uni.downloadFile 将其下载为本地临时文件 tempFilePath
    const downloadImage = (targetUrl) => {
        return new Promise((resolve) => {
            uni.downloadFile({
                url: targetUrl,
                success: (res) => {
                    if (res.statusCode === 200 && res.tempFilePath) {
                        resolve(res.tempFilePath);
                    } else {
                        resolve('');
                    }
                },
                fail: (err) => {
                    console.warn('uni.downloadFile 下载失败:', targetUrl, err);
                    resolve('');
                },
            });
        });
    };

    let tempLocalPath = await downloadImage(url);

    // 如果下载失败，且 URL 包含缩略图后缀 _small.webp 或 _medium.webp，尝试回退下载原图 .jpg
    if (!tempLocalPath && (url.includes('_small.webp') || url.includes('_medium.webp'))) {
        const fallbackJpgUrl = url.replace('_small.webp', '.jpg').replace('_medium.webp', '.jpg');
        console.log('尝试降级下载原图 .jpg:', fallbackJpgUrl);
        tempLocalPath = await downloadImage(fallbackJpgUrl);
    }

    // 如果通过 downloadFile 获得了本地临时文件，使用本地路径调用 getImageInfo 获取宽高
    if (tempLocalPath) {
        return new Promise((resolve) => {
            uni.getImageInfo({
                src: tempLocalPath,
                success: (res) => {
                    resolve({ path: res.path || tempLocalPath, width: res.width || 800, height: res.height || 1000 });
                },
                fail: (err) => {
                    console.warn('本地临时文件 getImageInfo 失败，依然使用本地文件路径绘制:', err);
                    resolve({ path: tempLocalPath, width: 800, height: 1000 });
                },
            });
        });
    }

    // 3. 如果 downloadFile 未能下载成功（如域名限制），尝试使用 getImageInfo 远程直连（兜底）
    return new Promise((resolve) => {
        uni.getImageInfo({
            src: url,
            success: (res) => {
                resolve({ path: res.path || url, width: res.width || 800, height: res.height || 1000 });
            },
            fail: (err) => {
                console.error('所有网络图片本地化加载方式均失败:', url, err);
                resolve({ path: url, width: 800, height: 1000 });
            },
        });
    });
};

const generateAndPreview = async () => {
    if (photoLayers.value.length === 0) return;
    isExporting.value = true;
    uni.showLoading({
        title: t('puzzle.generating'),
        mask: true,
    });

    try {
        const ctx = uni.createCanvasContext('exportCanvas');
        const W = exportCanvasWidth.value;
        const H = exportCanvasHeight.value;

        // 1. 绘制背景底色
        ctx.fillStyle = currentBgColor.value;
        ctx.fillRect(0, 0, W, H);

        // 2. 获取实际舞台尺寸，计算等比缩放率
        measureStage();
        const stageW = currentRatioConfig.value.stageW;
        const scaleRatio = W / (stageW || 240);

        // 3. 按 zIndex 从小到大排序图层
        const sorted = [...photoLayers.value].sort((a, b) => a.zIndex - b.zIndex);

        // 核心优化：并发预先下载并获取所有图层的本地图片文件信息，保证 Canvas 绘制时均为有效本地文件
        const layersWithInfo = await Promise.all(
            sorted.map(async (layer) => {
                const imgInfo = await fetchLocalImageInfo(layer.url);
                return { layer, imgInfo };
            })
        );

        for (const { layer, imgInfo } of layersWithInfo) {

            // 拍立得相框尺寸与中心点计算
            const cardW = layer.width * scaleRatio * layer.scale;
            const cardH = layer.height * scaleRatio * layer.scale;
            const centerX = (layer.x + layer.width / 2) * scaleRatio;
            const centerY = (layer.y + layer.height / 2) * scaleRatio;

            // 内嵌图片边距 (与 DOM 样式 padding: 8px 8px 24px 8px 精确对应)
            const padH = 8 * scaleRatio * layer.scale;
            const padTop = 8 * scaleRatio * layer.scale;
            const padBottom = 24 * scaleRatio * layer.scale;
            const frameRadius = 8 * scaleRatio * layer.scale;
            const imgRadius = 4 * scaleRatio * layer.scale;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate((layer.rotation * Math.PI) / 180);

            // A. 绘制相框底板及柔光阴影
            ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
            ctx.shadowBlur = Math.round(18 * scaleRatio);
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = Math.round(6 * scaleRatio);

            ctx.fillStyle = '#ffffff';
            fillRoundedRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, frameRadius);

            // B. 消除阴影绘制实际照片
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            const destX = -cardW / 2 + padH;
            const destY = -cardH / 2 + padTop;
            const destW = cardW - padH * 2;
            const destH = cardH - padTop - padBottom;

            // C. 核心：计算 aspectFill 居中无拉伸裁剪区域 (sx, sy, sw, sh)
            const imgW = imgInfo.width || 800;
            const imgH = imgInfo.height || 1000;
            const imgAspect = imgW / imgH;
            const destAspect = destW / destH;

            let sx = 0;
            let sy = 0;
            let sw = imgW;
            let sh = imgH;

            if (imgAspect > destAspect) {
                // 原图较宽，裁掉两边
                sw = Math.round(imgH * destAspect);
                sx = Math.round((imgW - sw) / 2);
            } else {
                // 原图较高，裁掉上下
                sh = Math.round(imgW / destAspect);
                sy = Math.round((imgH - sh) / 2);
            }

            // D. 照片裁剪为圆角并绘制
            ctx.save();
            clipRoundedRect(ctx, destX, destY, destW, destH, imgRadius);
            ctx.drawImage(
                imgInfo.path,
                sx, sy, sw, sh,
                destX, destY, destW, destH
            );
            ctx.restore();

            ctx.restore();
        }

        ctx.draw(false, () => {
            setTimeout(() => {
                uni.canvasToTempFilePath({
                    canvasId: 'exportCanvas',
                    destWidth: W,
                    destHeight: H,
                    fileType: 'jpg',
                    quality: 0.96,
                    success: (res) => {
                        exportedImageUrl.value = res.tempFilePath;
                        showPreviewModal.value = true;
                    },
                    fail: (err) => {
                        console.error('导出失败:', err);
                        uni.showToast({
                            title: t('puzzle.generateRetry'),
                            icon: 'none',
                        });
                    },
                    complete: () => {
                        isExporting.value = false;
                        uni.hideLoading();
                    },
                });
            }, 300);
        });
    } catch (e) {
        console.error('Canvas 绘制异常:', e);
        uni.hideLoading();
        isExporting.value = false;
        uni.showToast({
            title: t('puzzle.generateFailed'),
            icon: 'none',
        });
    }
};

// 实际执行保存到本地系统相册
const doRealSaveToAlbum = (successTip = '') => {
    if (!exportedImageUrl.value) return;

    // #ifdef WEB
    uni.showToast({
        title: t('puzzle.webSavePrompt'),
        icon: 'none',
        duration: 2500,
    });
    return;
    // #endif

    // #ifndef WEB
    uni.saveImageToPhotosAlbum({
        filePath: exportedImageUrl.value,
        success: () => {
            uni.showToast({
                title: successTip || t('puzzle.saveSuccess'),
                icon: 'success',
                duration: 2500,
            });
            showPreviewModal.value = false;
        },
        fail: (err) => {
            if (err.errMsg && !err.errMsg.includes('cancel')) {
                uni.showToast({
                    title: t('puzzle.saveAlbumAuthFail'),
                    icon: 'none',
                });
            }
        },
    });
    // #endif
};

// 保存拼图权限判定（统一接入核心鉴权模块：VIP极速放行、扣除点数、能量不足看广告/VIP 4矩阵）
const saveToAlbum = async () => {
    if (!exportedImageUrl.value) return;

    // #ifdef WEB
    doRealSaveToAlbum();
    return;
    // #endif

    // #ifndef WEB
    await executeWithAuth({
        adPopup: adPopup.value,
        wallId: 0,
        actionType: 'consume_puzzle_export',
        costEnergy: 1,
        customConfig: {
            title: userStore.isLoggedIn ? t('puzzle.energyShortageTitle') : t('puzzle.unlockSaveTitle'),
            desc: userStore.isLoggedIn
                ? t('puzzle.energyShortageDesc')
                : t('puzzle.unlockSaveDesc'),
            adBtnText: t('puzzle.watchAdSaveBtn'),
            vipBtnText: t('puzzle.openVipEnjoyBtn'),
            vipSuccessTip: t('puzzle.vipSaveSuccessTip'),
            energySuccessTip: t('puzzle.energyCostSuccessTip'),
            adSuccessTip: t('puzzle.adUnlockSuccessTip'),
        },
        onSuccess: ({ message }) => {
            doRealSaveToAlbum(message);
        },
    });
    // #endif
};
</script>

<style lang="scss" scoped>
.puzzle-page {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;

    &.theme-light {
        background-color: #f6f6f8;
        color: #0f172a;
    }

    &.theme-dark {
        background-color: #121216;
        color: #f8fafc;
    }
}

/* 顶部导航 */
.puzzle-nav-bar {
    width: 100%;
    box-sizing: border-box;

    .nav-content {
        height: 88rpx;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 32rpx;
    }

    .nav-back-btn {
        width: 64rpx;
        height: 64rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    .nav-title {
        font-size: 34rpx;
        font-weight: 800;
        letter-spacing: -0.3rpx;
    }

    .nav-right-placeholder {
        width: 64rpx;
    }
}

/* ─────────────────────────────────────────────────────────────
   阶段 1：模板选择页 (复刻附件2)
───────────────────────────────────────────────────────────── */
.template-step {
    flex: 1;
    overflow: hidden;
}

.template-scroll {
    height: 100%;
}

.template-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 28rpx;
    padding: 20rpx 32rpx 60rpx;
    box-sizing: border-box;
}

.template-card {
    border-radius: 36rpx;
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    .theme-light & {
        background: #ffffff;
        border: 2rpx solid rgba(0, 0, 0, 0.04);
    }

    .theme-dark & {
        background: #1e1e24;
        border: 2rpx solid rgba(255, 255, 255, 0.06);
    }

    &:active {
        transform: scale(0.97);
    }

    .template-preview {
        width: 100%;
        height: 440rpx;
        position: relative;
        overflow: hidden;
    }

    .tpl-visual-box {
        position: relative;
        width: 100%;
        height: 100%;
    }

    .tpl-photo-card {
        position: absolute;
        width: 150rpx;
        height: 190rpx;
        background: #ffffff;
        padding: 8rpx 8rpx 28rpx;
        box-sizing: border-box;
        border-radius: 8rpx;
        box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.16);

        .tpl-img {
            width: 100%;
            height: 100%;
            border-radius: 4rpx;
        }
    }

    .tpl-sticker-badge {
        position: absolute;
        padding: 6rpx 16rpx;
        border-radius: 8rpx;
        box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.1);
        z-index: 10;

        .sticker-text {
            font-size: 18rpx;
            font-weight: 800;
            letter-spacing: 0.5rpx;
        }
    }

    .template-info {
        padding: 24rpx 20rpx;
        display: flex;
        flex-direction: column;
        gap: 14rpx;
    }

    .template-name {
        font-size: 30rpx;
        font-weight: 800;
    }

    .template-badge-btn {
        background: #3b82f6;
        padding: 8rpx 24rpx;
        border-radius: 999px;
        align-self: flex-start;

        .badge-text {
            color: #ffffff;
            font-size: 22rpx;
            font-weight: 700;
        }
    }
}

/* ─────────────────────────────────────────────────────────────
   阶段 2：调整照片编辑页 (复刻附件3)
───────────────────────────────────────────────────────────── */
.editor-step {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* 顶部图层调节浮动胶囊条 [置顶 | 上移 | 下移 | 置底 | 随意] */
.layer-control-bar {
    align-self: center;
    margin: 6rpx 0 10rpx;
    background: #1e2433;
    border-radius: 999px;
    padding: 10rpx 32rpx;
    display: flex;
    align-items: center;
    gap: 20rpx;
    box-shadow: 0 6rpx 20rpx rgba(15, 23, 42, 0.35);
    z-index: 100;

    .layer-btn {
        cursor: pointer;
        padding: 4rpx 8rpx;
        transition: opacity 0.18s ease;

        &.is-disabled {
            opacity: 0.35;
            pointer-events: none;
        }

        &--random {
            display: flex;
            align-items: center;
            gap: 8rpx;
            background: rgba(255, 255, 255, 0.16);
            padding: 6rpx 18rpx;
            border-radius: 999px;
            border: 1rpx solid rgba(255, 255, 255, 0.25);

            .random-text {
                color: #ffffff;
                font-size: 23rpx;
                font-weight: 700;
            }

            &:active {
                opacity: 0.75;
                transform: scale(0.96);
            }
        }
    }

    .layer-btn-text {
        color: #ffffff;
        font-size: 24rpx;
        font-weight: 600;
    }

    .divider {
        width: 2rpx;
        height: 24rpx;
        background: rgba(255, 255, 255, 0.25);
    }
}

/* 主画布舞台容器 (最大化填充屏幕，无缝衔接顶底面板) */
.canvas-stage-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8rpx 14rpx;
    box-sizing: border-box;
    overflow: hidden;
    min-height: 0;
}

.canvas-stage {
    box-sizing: border-box;
    max-width: 100%;
    max-height: 100%;
    border-radius: 36rpx;
    position: relative;
    overflow: hidden;
    box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.16);
    border: 4rpx solid rgba(255, 255, 255, 0.85);
    transition: background-color 0.3s ease, width 0.25s ease, height 0.25s ease;
}

/* 照片图层与拍立得白框 */
.photo-layer-item {
    position: absolute;
    top: 0;
    left: 0;
    cursor: pointer;
    touch-action: none;
    user-select: none;
    transform-origin: center center;

    &.is-active {
        .polaroid-frame {
            border: 2rpx dashed #5046e5;
            box-shadow: 0 16rpx 40rpx rgba(79, 70, 229, 0.35);
        }
    }
}

.polaroid-frame {
    background: #ffffff;
    padding: 8px 8px 24px 8px;
    box-sizing: border-box;
    border-radius: 12rpx;
    box-shadow: 0 10rpx 28rpx rgba(0, 0, 0, 0.2);
    transition: border 0.18s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    .photo-inner-img {
        border-radius: 6rpx;
    }
}

/* 4 个角落手柄 (经典紫色主题) */
.handle-btn {
    position: absolute;
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.3);
    z-index: 20;
    cursor: pointer;
    touch-action: none;
}

.handle-btn--replace {
    top: -24rpx;
    left: -24rpx;
    background: #5046e5;
}

.handle-btn--delete {
    top: -24rpx;
    right: -24rpx;
    background: #ef4444;
}

.handle-btn--rotate {
    bottom: -24rpx;
    left: -24rpx;
    background: #5046e5;
}

.handle-btn--scale {
    bottom: -24rpx;
    right: -24rpx;
    background: #5046e5;
}

/* 底部操作面板 */
.editor-bottom-panel {
    width: 100%;
    padding: 16rpx 28rpx calc(16rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    border-radius: 44rpx 44rpx 0 0;
    box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.06);

    .theme-light & {
        background: #ffffff;
    }

    .theme-dark & {
        background: #1c1c22;
    }
}

.panel-section-label {
    font-size: 26rpx;
    font-weight: 700;
    flex-shrink: 0;
}

.ratio-select-row {
    display: flex;
    align-items: center;
    gap: 20rpx;

    .ratio-tabs {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12rpx;
    }

    .ratio-pill {
        flex: 1;
        padding: 8rpx 0;
        border-radius: 16rpx;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2rpx;
        background: rgba(148, 163, 184, 0.12);
        border: 2rpx solid transparent;
        cursor: pointer;
        transition: all 0.2s ease;

        .ratio-tag {
            font-size: 22rpx;
            font-weight: 700;
            line-height: 1.2;
        }

        .ratio-name {
            font-size: 18rpx;
            opacity: 0.65;
            line-height: 1.2;
        }

        &.is-active {
            background: rgba(79, 70, 229, 0.12);
            border-color: #5046e5;

            .ratio-tag {
                color: #5046e5;
            }

            .ratio-name {
                color: #5046e5;
                opacity: 0.95;
            }
        }
    }
}

.bg-palette-row {
    display: flex;
    align-items: center;
    gap: 20rpx;

    .palette-scroll {
        flex: 1;
        white-space: nowrap;
    }

    .palette-list {
        display: inline-flex;
        align-items: center;
        gap: 20rpx;
        padding: 4rpx 8rpx;
    }

    .color-dot {
        width: 52rpx;
        height: 52rpx;
        border-radius: 50%;
        box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.15);
        border: 2rpx solid rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.18s ease;

        &.is-selected {
            transform: scale(1.15);
            border: 4rpx solid #1e2433;
        }

        .color-dot-inner {
            width: 14rpx;
            height: 14rpx;
            border-radius: 50%;
            background: #1e2433;
        }
    }
}

.action-btn-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20rpx;

    .manage-layers-btn {
        height: 84rpx;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12rpx;
        padding: 0 36rpx;
        border-radius: 999px;
        cursor: pointer;
        flex-shrink: 0;

        .theme-light & {
            background: #f1f5f9;
        }

        .theme-dark & {
            background: rgba(255, 255, 255, 0.08);
        }

        .manage-text {
            font-size: 26rpx;
            font-weight: 700;
        }

        &:active {
            opacity: 0.8;
            transform: scale(0.97);
        }
    }

    .save-preview-btn {
        flex: 1;
        height: 84rpx;
        box-sizing: border-box;
        border-radius: 999px;
        background: linear-gradient(135deg, #5046e5 0%, #6366f1 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12rpx;
        box-shadow: 0 8rpx 24rpx rgba(79, 70, 229, 0.35);
        cursor: pointer;
        transition: transform 0.15s ease;

        .save-text {
            color: #ffffff;
            font-size: 28rpx;
            font-weight: 800;
            letter-spacing: 0.5rpx;
        }

        &:active {
            transform: scale(0.97);
        }

        &.is-loading {
            opacity: 0.8;
            pointer-events: none;
        }
    }
}

.editor-tip-text {
    text-align: center;
    font-size: 22rpx;
    opacity: 0.55;
}

/* ─────────────────────────────────────────────────────────────
   全屏壁纸合成预览弹窗 (去时钟 + 精致深色磨砂玻璃美化)
───────────────────────────────────────────────────────────── */
.preview-modal-mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.88);
    backdrop-filter: blur(20px);
    z-index: 1200;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 36rpx;
    box-sizing: border-box;
}

.preview-modal-body {
    width: 100%;
    max-width: 620rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28rpx;
}

.preview-header-bar {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10rpx;

    .preview-info-tag {
        display: flex;
        align-items: baseline;
        gap: 16rpx;
    }

    .preview-title-text {
        color: #ffffff;
        font-size: 32rpx;
        font-weight: 800;
    }

    .preview-ratio-badge {
        color: rgba(255, 255, 255, 0.6);
        font-size: 22rpx;
        background: rgba(255, 255, 255, 0.1);
        padding: 4rpx 14rpx;
        border-radius: 999px;
    }

    .preview-close-icon {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }
}

.preview-card-wrap {
    width: 100%;
    border-radius: 36rpx;
    overflow: hidden;
    position: relative;
    box-shadow: 0 24rpx 60rpx rgba(0, 0, 0, 0.6);
    border: 3rpx solid rgba(255, 255, 255, 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    background: #111115;

    .exported-wallpaper-img {
        width: 100%;
        height: 100%;
        border-radius: 32rpx;
    }
}

.preview-actions {
    width: 100%;

    .btn-group {
        width: 100%;
        display: flex;
        gap: 20rpx;
    }

    .modal-btn {
        flex: 1;
        height: 88rpx;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12rpx;
        cursor: pointer;

        &--cancel {
            background: rgba(255, 255, 255, 0.14);
            border: 1rpx solid rgba(255, 255, 255, 0.18);
            color: #ffffff;
            font-size: 28rpx;
            font-weight: 700;
        }

        &--save {
            background: linear-gradient(135deg, #5046e5 0%, #6366f1 100%);
            color: #ffffff;
            font-size: 28rpx;
            font-weight: 800;
            box-shadow: 0 8rpx 24rpx rgba(79, 70, 229, 0.4);
        }

        &:active {
            transform: scale(0.97);
        }
    }
}

/* 离屏 Canvas (不可见) */
.export-offscreen-canvas {
    position: fixed;
    left: -9999px;
    top: -9999px;
    pointer-events: none;
}
</style>
