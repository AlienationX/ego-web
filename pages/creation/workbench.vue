<template>
    <view class="workbench-page" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 1. 沉浸式顶部自定义导航栏与快捷操作栏 -->
        <view class="workbench-nav" :style="{ paddingTop: `${statusBarHeight}px` }">
            <!-- 导航主行（返回 + 页面标题） -->
            <view class="nav-header">
                <view class="nav-back-btn" @click="handleNavBack">
                    <mdi-icon
                        path="/static/icons/arrow-left.svg"
                        size="22px"
                        :color="settingsStore.isDark ? '#f8fafc' : '#0f172a'"
                    />
                </view>
                <text class="nav-title">{{ t('workbench.title') }}</text>
                <!-- 右侧占位保持对称（避开微信原生胶囊） -->
                <view class="nav-placeholder" />
            </view>

            <!-- 快捷工具操作条 (完全复刻附件2) -->
            <view class="quick-toolbar">
                <!-- 左侧撤销/重做胶囊组 -->
                <view class="history-capsule">
                    <view
                        class="history-btn"
                        :class="{ 'is-disabled': !canUndo }"
                        @click="handleUndo"
                    >
                        <mdi-icon
                            path="/static/icons/reply.svg"
                            size="18px"
                            :color="canUndo ? (settingsStore.isDark ? '#f8fafc' : '#0f172a') : (settingsStore.isDark ? '#475569' : '#cbd5e1')"
                        />
                    </view>
                    <view class="history-divider" />
                    <view
                        class="history-btn history-btn--redo"
                        :class="{ 'is-disabled': !canRedo }"
                        @click="handleRedo"
                    >
                        <mdi-icon
                            path="/static/icons/reply.svg"
                            size="18px"
                            :color="canRedo ? (settingsStore.isDark ? '#f8fafc' : '#0f172a') : (settingsStore.isDark ? '#475569' : '#cbd5e1')"
                        />
                    </view>
                </view>

                <!-- 右侧功能组：对比、参考线、锁屏、保存 -->
                <view class="quick-actions">
                    <!-- 对比按钮 (按住或点击对比原图) -->
                    <view
                        class="quick-action-item"
                        :class="{ 'is-active': isComparing }"
                        @touchstart="startCompare"
                        @touchend="endCompare"
                        @mousedown="startCompare"
                        @mouseup="endCompare"
                        @click="toggleCompare"
                    >
                        <mdi-icon
                            path="/static/icons/eye.svg"
                            size="18px"
                            :color="isComparing ? '#6366f1' : (settingsStore.isDark ? '#94a3b8' : '#64748b')"
                        />
                        <text class="action-label" :class="{ 'is-active': isComparing }">{{ t('workbench.compare') }}</text>
                    </view>

                    <!-- 参考线按钮 (九宫格辅助线) -->
                    <view
                        class="quick-action-item"
                        :class="{ 'is-active': showGrid }"
                        @click="toggleGrid"
                    >
                        <mdi-icon
                            path="/static/icons/view-grid.svg"
                            size="18px"
                            :color="showGrid ? '#6366f1' : (settingsStore.isDark ? '#94a3b8' : '#64748b')"
                        />
                        <text class="action-label" :class="{ 'is-active': showGrid }">{{ t('workbench.grid') }}</text>
                    </view>

                    <!-- 锁屏按钮 (iOS 风格拟真锁屏 UI 显隐) -->
                    <view
                        class="quick-action-item"
                        :class="{ 'is-active': showLockscreen }"
                        @click="toggleLockscreen"
                    >
                        <mdi-icon
                            path="/static/icons/cellphone.svg"
                            size="18px"
                            :color="showLockscreen ? '#6366f1' : (settingsStore.isDark ? '#94a3b8' : '#64748b')"
                        />
                        <text class="action-label" :class="{ 'is-active': showLockscreen }">{{ t('workbench.lockscreen') }}</text>
                    </view>

                    <!-- 保存高亮按钮 (紫光渐变胶囊) -->
                    <view class="save-capsule-btn" @click="handleSaveWorkbench">
                        <mdi-icon path="/static/icons/star.svg" size="16px" color="#ffffff" />
                        <text class="save-btn-text">{{ t('workbench.save') }}</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 2. 中间核心画板舞台 (拟真手机模型) -->
        <view class="stage-viewport">
            <view
                class="phone-frame"
                :style="phoneFrameStyle"
                @click="clearActiveLayer"
            >
                <!-- 2.1 底图与实时 CSS 滤镜及几何变换 -->
                <image
                    class="phone-wallpaper"
                    :src="isComparing ? initialOriginalPicUrl : currentPicUrl"
                    mode="aspectFill"
                    :style="isComparing ? {} : currentFilterTransformStyle"
                />

                <!-- 暗角遮罩 (如果开启了暗角) -->
                <view
                    v-if="!isComparing && currentAdjust.vignette > 0"
                    class="vignette-overlay"
                    :style="{ opacity: currentAdjust.vignette / 100 }"
                />

                <!-- 2.2 九宫格参考线 (三分法网格) -->
                <view v-if="showGrid" class="grid-overlay">
                    <view class="grid-line grid-line--h1" />
                    <view class="grid-line grid-line--h2" />
                    <view class="grid-line grid-line--v1" />
                    <view class="grid-line grid-line--v2" />
                </view>

                <!-- 2.3 拟真 iOS 锁屏组件 (时钟、日期、手电筒、相机、横条) -->
                <view v-if="showLockscreen" class="lockscreen-overlay">
                    <!-- 顶部锁头与时间 -->
                    <view class="lock-header">
                        <view class="lock-icon-wrap">
                            <mdi-icon path="/static/icons/lock.svg" size="14px" color="#ffffff" />
                        </view>
                        <text class="lock-time">{{ currentClockTime }}</text>
                        <text class="lock-date">{{ currentClockDate }}</text>
                    </view>

                    <!-- 底部快捷按键与 Home 指示条 -->
                    <view class="lock-footer">
                        <view class="lock-tool-btn">
                            <mdi-icon path="/static/icons/flash.svg" size="18px" color="#ffffff" />
                        </view>
                        <view class="home-indicator" />
                        <view class="lock-tool-btn">
                            <mdi-icon path="/static/icons/camera.svg" size="18px" color="#ffffff" />
                        </view>
                    </view>
                </view>

                <!-- 2.4 可交互文字图层 -->
                <view
                    v-for="(layer, idx) in textLayers"
                    :key="layer.id"
                    class="text-layer-item"
                    :class="[
                        `style--${layer.style}`,
                        { 'is-active': activeLayerId === layer.id }
                    ]"
                    :style="{
                        top: `${layer.top}%`,
                        left: `${layer.left}%`,
                        transform: 'translate(-50%, -50%)',
                        color: layer.color,
                        fontSize: `${layer.fontSize}rpx`,
                    }"
                    @click.stop="selectLayer(layer.id)"
                >
                    <text class="layer-content">{{ layer.text }}</text>
                    <!-- 选中时展示删除小微章 -->
                    <view
                        v-if="activeLayerId === layer.id"
                        class="layer-remove-badge"
                        @click.stop="removeTextLayer(idx)"
                    >
                        <mdi-icon path="/static/icons/close.svg" size="12px" color="#ffffff" />
                    </view>
                </view>

                <!-- 2.5 可交互贴纸图层 -->
                <view
                    v-for="(sticker, idx) in stickerLayers"
                    :key="sticker.id"
                    class="sticker-layer-item"
                    :class="{ 'is-active': activeLayerId === sticker.id }"
                    :style="{
                        top: `${sticker.top}%`,
                        left: `${sticker.left}%`,
                        transform: 'translate(-50%, -50%)',
                    }"
                    @click.stop="selectLayer(sticker.id)"
                >
                    <text class="sticker-symbol">{{ sticker.symbol }}</text>
                    <view
                        v-if="activeLayerId === sticker.id"
                        class="layer-remove-badge"
                        @click.stop="removeStickerLayer(idx)"
                    >
                        <mdi-icon path="/static/icons/close.svg" size="12px" color="#ffffff" />
                    </view>
                </view>

                <!-- 灵动岛顶部仿真凹槽 -->
                <view class="dynamic-island" />
            </view>
        </view>

        <!-- 3. 底部主工具栏 (6 大一级功能: 添加/裁剪/调节/滤镜/文字/贴纸) -->
        <view v-if="!activeSubTool" class="main-tabbar">
            <view
                v-for="tool in mainToolList"
                :key="tool.key"
                class="tab-tool-item"
                @click="handleToolClick(tool.key)"
            >
                <view class="tool-icon-wrap">
                    <mdi-icon
                        :path="tool.icon"
                        size="22px"
                        :color="settingsStore.isDark ? '#cbd5e1' : '#334155'"
                    />
                </view>
                <text class="tool-name">{{ t(`workbench.tools.${tool.key}`) }}</text>
            </view>
        </view>

        <!-- 4. 底部二级调节抽屉面板 (平滑滑出) -->
        <view v-else class="sub-panel-drawer">
            <!-- 抽屉头部控制行 (取消 / 标题 / 应用) -->
            <view class="drawer-header">
                <view class="header-action-btn cancel-btn" @click="cancelSubTool">
                    <mdi-icon
                        path="/static/icons/close.svg"
                        size="18px"
                        :color="settingsStore.isDark ? '#94a3b8' : '#64748b'"
                    />
                </view>
                <text class="drawer-title">{{ currentDrawerTitle }}</text>
                <view class="header-action-btn apply-btn" @click="applySubTool">
                    <mdi-icon path="/static/icons/check.svg" size="18px" color="#6366f1" />
                </view>
            </view>

            <!-- 抽屉主体功能区 -->
            <view class="drawer-body">
                <!-- 4.1 裁剪面板 -->
                <view v-if="activeSubTool === 'crop'" class="crop-panel">
                    <view class="ratio-chips-row">
                        <view
                            v-for="ratio in cropRatioOptions"
                            :key="ratio.key"
                            class="ratio-chip"
                            :class="{ 'is-active': tempCrop.ratioKey === ratio.key }"
                            @click="selectCropRatio(ratio.key)"
                        >
                            <text class="chip-text">{{ t(`workbench.crop.${ratio.key}`) }}</text>
                        </view>
                    </view>
                    <view class="transform-actions-row">
                        <view class="transform-btn" @click="rotateLeft">
                            <mdi-icon path="/static/icons/reply.svg" size="18px" color="#6366f1" />
                            <text class="btn-name">{{ t('workbench.crop.rotateLeft') }}</text>
                        </view>
                        <view class="transform-btn transform-btn--reverse" @click="rotateRight">
                            <mdi-icon path="/static/icons/reply.svg" size="18px" color="#6366f1" />
                            <text class="btn-name">{{ t('workbench.crop.rotateRight') }}</text>
                        </view>
                        <view class="transform-btn" @click="toggleFlipH">
                            <mdi-icon path="/static/icons/autorenew.svg" size="18px" color="#6366f1" />
                            <text class="btn-name">{{ t('workbench.crop.flipH') }}</text>
                        </view>
                        <view class="transform-btn" @click="toggleFlipV">
                            <mdi-icon path="/static/icons/cached.svg" size="18px" color="#6366f1" />
                            <text class="btn-name">{{ t('workbench.crop.flipV') }}</text>
                        </view>
                    </view>
                </view>

                <!-- 4.2 调节面板 -->
                <view v-else-if="activeSubTool === 'adjust'" class="adjust-panel">
                    <!-- 参数滑块区域 -->
                    <view class="adjust-slider-wrap">
                        <view class="slider-meta-row">
                            <text class="param-title">{{ t(`workbench.adjust.${currentAdjustParam}`) }}</text>
                            <text class="param-value">{{ formatAdjustValue(tempAdjust[currentAdjustParam]) }}</text>
                        </view>
                        <slider
                            :value="tempAdjust[currentAdjustParam]"
                            :min="adjustParamRanges[currentAdjustParam].min"
                            :max="adjustParamRanges[currentAdjustParam].max"
                            :step="1"
                            activeColor="#6366f1"
                            backgroundColor="rgba(120, 120, 128, 0.2)"
                            block-size="20"
                            @changing="onAdjustSliderChanging"
                            @change="onAdjustSliderChange"
                        />
                    </view>

                    <!-- 参数选择 Tab 列表 -->
                    <scroll-view class="adjust-tabs-scroll" scroll-x :show-scrollbar="false">
                        <view class="adjust-tabs-row">
                            <view
                                v-for="param in adjustParamList"
                                :key="param.key"
                                class="adjust-tab-item"
                                :class="{ 'is-active': currentAdjustParam === param.key }"
                                @click="currentAdjustParam = param.key"
                            >
                                <text class="tab-name">{{ t(`workbench.adjust.${param.key}`) }}</text>
                            </view>
                        </view>
                    </scroll-view>
                </view>

                <!-- 4.3 滤镜面板 -->
                <view v-else-if="activeSubTool === 'filter'" class="filter-panel">
                    <scroll-view class="filter-scroll" scroll-x :show-scrollbar="false">
                        <view class="filter-cards-row">
                            <view
                                v-for="flt in filterList"
                                :key="flt.key"
                                class="filter-card"
                                :class="{ 'is-active': tempFilter.key === flt.key }"
                                @click="selectFilter(flt.key)"
                            >
                                <view class="filter-avatar" :style="{ backgroundColor: flt.accentColor }">
                                    <image
                                        class="filter-demo-thumb"
                                        :src="currentPicUrl"
                                        mode="aspectFill"
                                        :style="flt.cssFilter"
                                    />
                                </view>
                                <text class="filter-name">{{ t(`workbench.filter.${flt.key}`) }}</text>
                            </view>
                        </view>
                    </scroll-view>

                    <!-- 滤镜强度调节滑块 -->
                    <view v-if="tempFilter.key !== 'none'" class="filter-intensity-block">
                        <view class="slider-meta-row">
                            <text class="param-title">{{ t('workbench.filter.intensity') }}</text>
                            <text class="param-value">{{ tempFilter.intensity }}%</text>
                        </view>
                        <slider
                            :value="tempFilter.intensity"
                            :min="0"
                            :max="100"
                            :step="1"
                            activeColor="#6366f1"
                            backgroundColor="rgba(120, 120, 128, 0.2)"
                            block-size="18"
                            @changing="onFilterIntensityChanging"
                            @change="onFilterIntensityChange"
                        />
                    </view>
                </view>

                <!-- 4.4 文字面板 -->
                <view v-else-if="activeSubTool === 'text'" class="text-panel">
                    <view class="input-line-box">
                        <input
                            v-model="tempTextInput"
                            class="text-native-input"
                            :placeholder="t('workbench.text.placeholder')"
                            placeholder-style="color: #94a3b8;"
                        />
                    </view>

                    <!-- 热门励志短句推荐 -->
                    <scroll-view class="hot-phrases-scroll" scroll-x :show-scrollbar="false">
                        <view class="hot-phrases-row">
                            <view
                                v-for="(phrase, idx) in hotPhraseList"
                                :key="idx"
                                class="phrase-chip"
                                @click="tempTextInput = phrase"
                            >
                                <text class="chip-text">{{ phrase }}</text>
                            </view>
                        </view>
                    </scroll-view>

                    <!-- 颜色调色板 -->
                    <view class="text-config-row">
                        <text class="config-label">{{ t('workbench.text.color') }}</text>
                        <view class="palette-group">
                            <view
                                v-for="color in textPalette"
                                :key="color"
                                class="color-dot"
                                :class="{ 'is-active': tempTextColor === color }"
                                :style="{ backgroundColor: color }"
                                @click="tempTextColor = color"
                            />
                        </view>
                    </view>

                    <!-- 样式风格标签 -->
                    <view class="text-config-row">
                        <text class="config-label">{{ t('workbench.text.style') }}</text>
                        <view class="style-tabs-group">
                            <view
                                v-for="st in textStyleOptions"
                                :key="st.key"
                                class="style-tab"
                                :class="{ 'is-active': tempTextStyle === st.key }"
                                @click="tempTextStyle = st.key"
                            >
                                <text class="tab-text">{{ t(`workbench.text.${st.nameKey}`) }}</text>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- 4.5 贴纸面板 -->
                <view v-else-if="activeSubTool === 'sticker'" class="sticker-panel">
                    <text class="sticker-hint">{{ t('workbench.sticker.tapToAdd') }}</text>
                    <view class="sticker-grid">
                        <view
                            v-for="(stk, idx) in stickerList"
                            :key="idx"
                            class="sticker-grid-item"
                            @click="addSticker(stk)"
                        >
                            <text class="stk-symbol">{{ stk.symbol }}</text>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <!-- 5. 选图抽屉组件 (单选模式，支持收藏与手机相册) -->
        <puzzle-image-picker
            v-model:visible="showPicker"
            :title="t('frostedMaker.selectImage') || '选择壁纸'"
            :max-count="1"
            :single-mode="true"
            :initial-images="currentPicUrl ? [currentPicUrl] : []"
            @confirm="handleImageSelected"
        />

        <!-- 6. 广告激励与 VIP 解锁弹窗组件 -->
        <popup-ad-prompt ref="adPopup" :picurl="currentPicUrl" />

        <!-- 7. 离屏超高清合成画布 -->
        <!-- #ifdef MP-WEIXIN -->
        <canvas
            type="2d"
            id="workbenchCanvas"
            class="workbench-hidden-canvas"
            :style="{ width: `${exportCanvasW}px`, height: `${exportCanvasH}px` }"
        />
        <!-- #endif -->

        <!-- #ifndef MP-WEIXIN -->
        <canvas
            canvas-id="workbenchCanvas"
            id="workbenchCanvas"
            class="workbench-hidden-canvas"
            :width="exportCanvasW"
            :height="exportCanvasH"
            :style="{ width: `${exportCanvasW}px`, height: `${exportCanvasH}px` }"
        />
        <!-- #endif -->
    </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserStore } from '@/stores/user.js';
import { getStatusBarHeight } from '@/utils/layout.js';
import { executeWithAuth } from '@/utils/auth-action.js';
import { saveImageToAlbum } from '@/utils/blur.js';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const userStore = useUserStore();

const statusBarHeight = computed(() => getStatusBarHeight() || 24);

// 默认初始高清壁纸示例
const DEFAULT_PIC = 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1080&q=85';
const initialOriginalPicUrl = ref(DEFAULT_PIC);
const currentPicUrl = ref(DEFAULT_PIC);

// ----------------------------------------------------
// 核心状态数据：裁剪、调色、滤镜、文字与贴纸图层
// ----------------------------------------------------
const currentCrop = reactive({
    ratioKey: 'ratio9_16',
    rotation: 0,
    flipH: false,
    flipV: false,
});

const currentAdjust = reactive({
    brightness: 0, // -100 ~ 100
    contrast: 0,   // -100 ~ 100
    saturation: 0, // -100 ~ 100
    warmth: 0,     // -100 ~ 100
    vignette: 0,   // 0 ~ 100
    blur: 0,       // 0 ~ 50
});

const currentFilter = reactive({
    key: 'none',
    intensity: 100,
});

const textLayers = ref([]);
const stickerLayers = ref([]);
const activeLayerId = ref(null);

// ----------------------------------------------------
// 历史操作栈 (Undo / Redo)
// ----------------------------------------------------
const historyStack = ref([]);
const historyIndex = ref(-1);

const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < historyStack.value.length - 1);

// 保存状态快照
const pushSnapshot = () => {
    const snapshot = {
        picUrl: currentPicUrl.value,
        crop: JSON.parse(JSON.stringify(currentCrop)),
        adjust: JSON.parse(JSON.stringify(currentAdjust)),
        filter: JSON.parse(JSON.stringify(currentFilter)),
        textLayers: JSON.parse(JSON.stringify(textLayers.value)),
        stickerLayers: JSON.parse(JSON.stringify(stickerLayers.value)),
    };
    // 截断未来分支
    historyStack.value = historyStack.value.slice(0, historyIndex.value + 1);
    historyStack.value.push(snapshot);
    historyIndex.value = historyStack.value.length - 1;
};

// 恢复快照
const applySnapshot = (snapshot) => {
    currentPicUrl.value = snapshot.picUrl;
    Object.assign(currentCrop, snapshot.crop);
    Object.assign(currentAdjust, snapshot.adjust);
    Object.assign(currentFilter, snapshot.filter);
    textLayers.value = JSON.parse(JSON.stringify(snapshot.textLayers));
    stickerLayers.value = JSON.parse(JSON.stringify(snapshot.stickerLayers));
    activeLayerId.value = null;
};

const handleUndo = () => {
    if (!canUndo.value) return;
    historyIndex.value -= 1;
    applySnapshot(historyStack.value[historyIndex.value]);
};

const handleRedo = () => {
    if (!canRedo.value) return;
    historyIndex.value += 1;
    applySnapshot(historyStack.value[historyIndex.value]);
};

// ----------------------------------------------------
// 快捷辅助功能：对比、九宫格参考线、模拟锁屏
// ----------------------------------------------------
const isComparing = ref(false);
const startCompare = () => { isComparing.value = true; };
const endCompare = () => { isComparing.value = false; };
const toggleCompare = () => { isComparing.value = !isComparing.value; };

const showGrid = ref(false);
const toggleGrid = () => { showGrid.value = !showGrid.value; };

const showLockscreen = ref(true); // 默认开启锁屏预览，方便观察壁纸与桌面/锁屏融合度
const toggleLockscreen = () => { showLockscreen.value = !showLockscreen.value; };

// 动态时钟与日期
const currentClockTime = ref('15:05');
const currentClockDate = ref('9月20日 星期日');
let clockTimer = null;

const updateClock = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    currentClockTime.value = `${h}:${m}`;
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    currentClockDate.value = `${month}月${date}日 星期${weekDays[now.getDay()]}`;
};

// ----------------------------------------------------
// 底部主工具与二级抽屉
// ----------------------------------------------------
const mainToolList = [
    { key: 'add', icon: '/static/icons/plus.svg' },
    { key: 'crop', icon: '/static/icons/cards.svg' },
    { key: 'adjust', icon: '/static/icons/tune-variant.svg' },
    { key: 'filter', icon: '/static/icons/palette-swatch.svg' },
    { key: 'text', icon: '/static/icons/format-quote-close.svg' },
    { key: 'sticker', icon: '/static/icons/star.svg' },
];

const activeSubTool = ref(null); // 'crop' | 'adjust' | 'filter' | 'text' | 'sticker' | null

// 临时状态（抽屉中未点击“应用”前暂存）
const tempCrop = reactive({ ratioKey: 'ratio9_16', rotation: 0, flipH: false, flipV: false });
const tempAdjust = reactive({ brightness: 0, contrast: 0, saturation: 0, warmth: 0, vignette: 0, blur: 0 });
const tempFilter = reactive({ key: 'none', intensity: 100 });
const tempTextInput = ref('');
const tempTextColor = ref('#ffffff');
const tempTextStyle = ref('styleCapsule');

const currentDrawerTitle = computed(() => {
    if (!activeSubTool.value) return '';
    return t(`workbench.${activeSubTool.value}.title`) || t(`workbench.tools.${activeSubTool.value}`);
});

// 点击主工具
const handleToolClick = (toolKey) => {
    if (toolKey === 'add') {
        openImagePicker();
        return;
    }
    // 同步当前值到临时调节区
    if (toolKey === 'crop') {
        Object.assign(tempCrop, currentCrop);
    } else if (toolKey === 'adjust') {
        Object.assign(tempAdjust, currentAdjust);
    } else if (toolKey === 'filter') {
        Object.assign(tempFilter, currentFilter);
    } else if (toolKey === 'text') {
        tempTextInput.value = '';
    }
    activeSubTool.value = toolKey;
};

// 取消抽屉
const cancelSubTool = () => {
    activeSubTool.value = null;
};

// 应用抽屉修改
const applySubTool = () => {
    if (activeSubTool.value === 'crop') {
        Object.assign(currentCrop, tempCrop);
    } else if (activeSubTool.value === 'adjust') {
        Object.assign(currentAdjust, tempAdjust);
    } else if (activeSubTool.value === 'filter') {
        Object.assign(currentFilter, tempFilter);
    } else if (activeSubTool.value === 'text') {
        if (tempTextInput.value.trim()) {
            textLayers.value.push({
                id: `text_${Date.now()}`,
                text: tempTextInput.value.trim(),
                color: tempTextColor.value,
                style: tempTextStyle.value,
                fontSize: 32,
                top: 50,
                left: 50,
            });
            tempTextInput.value = '';
        }
    }
    pushSnapshot();
    activeSubTool.value = null;
};

// ----------------------------------------------------
// 二级面板配置项
// ----------------------------------------------------
// 1. 裁剪选项
const cropRatioOptions = [
    { key: 'ratio9_16', ratio: 9 / 16 },
    { key: 'ratio1_1', ratio: 1 },
    { key: 'ratio3_4', ratio: 3 / 4 },
    { key: 'ratio4_3', ratio: 4 / 3 },
    { key: 'ratio16_9', ratio: 16 / 9 },
    { key: 'original', ratio: 0 },
];
const selectCropRatio = (key) => { tempCrop.ratioKey = key; };
const rotateLeft = () => { tempCrop.rotation = (tempCrop.rotation - 90) % 360; };
const rotateRight = () => { tempCrop.rotation = (tempCrop.rotation + 90) % 360; };
const toggleFlipH = () => { tempCrop.flipH = !tempCrop.flipH; };
const toggleFlipV = () => { tempCrop.flipV = !tempCrop.flipV; };

// 2. 调节参数配置
const currentAdjustParam = ref('brightness');
const adjustParamList = [
    { key: 'brightness' },
    { key: 'contrast' },
    { key: 'saturation' },
    { key: 'warmth' },
    { key: 'vignette' },
    { key: 'blur' },
];
const adjustParamRanges = {
    brightness: { min: -100, max: 100 },
    contrast: { min: -100, max: 100 },
    saturation: { min: -100, max: 100 },
    warmth: { min: -100, max: 100 },
    vignette: { min: 0, max: 100 },
    blur: { min: 0, max: 50 },
};
const formatAdjustValue = (val) => {
    if (val > 0) return `+${val}`;
    return String(val);
};
const onAdjustSliderChanging = (e) => {
    tempAdjust[currentAdjustParam.value] = e.detail.value;
};
const onAdjustSliderChange = (e) => {
    tempAdjust[currentAdjustParam.value] = e.detail.value;
};

// 3. 滤镜配置
const filterList = [
    { key: 'none', accentColor: '#cbd5e1', cssFilter: {} },
    { key: 'film', accentColor: '#d97706', cssFilter: { filter: 'sepia(0.3) contrast(1.1) saturate(1.15)' } },
    { key: 'warm', accentColor: '#f59e0b', cssFilter: { filter: 'sepia(0.4) saturate(1.2)' } },
    { key: 'cyber', accentColor: '#06b6d4', cssFilter: { filter: 'hue-rotate(180deg) saturate(1.3)' } },
    { key: 'noir', accentColor: '#334155', cssFilter: { filter: 'grayscale(1) contrast(1.2)' } },
    { key: 'vivid', accentColor: '#ec4899', cssFilter: { filter: 'saturate(1.6) contrast(1.15)' } },
    { key: 'fresh', accentColor: '#10b981', cssFilter: { filter: 'brightness(1.08) saturate(1.1)' } },
    { key: 'retro', accentColor: '#8b5cf6', cssFilter: { filter: 'sepia(0.5) hue-rotate(-20deg)' } },
];
const selectFilter = (key) => {
    tempFilter.key = key;
};
const onFilterIntensityChanging = (e) => {
    tempFilter.intensity = e.detail.value;
};
const onFilterIntensityChange = (e) => {
    tempFilter.intensity = e.detail.value;
};

// 4. 文字精选文案与调色板
const hotPhraseList = [
    '生活明朗，万物可爱',
    '保持热爱，奔赴星海',
    '未来可期，人间值得',
    'Stay hungry, stay foolish',
    'Carpe Diem',
    'Live in the sunshine',
];
const textPalette = ['#ffffff', '#000000', '#fbbf24', '#a855f7', '#38bdf8', '#f43f5e'];
const textStyleOptions = [
    { key: 'styleCapsule', nameKey: 'styleCapsule' },
    { key: 'styleNone', nameKey: 'styleNone' },
    { key: 'styleLightCapsule', nameKey: 'styleLightCapsule' },
    { key: 'styleBorder', nameKey: 'styleBorder' },
];

// 5. 贴纸库
const stickerList = [
    { symbol: '✦' },
    { symbol: '★' },
    { symbol: '♥' },
    { symbol: '☁' },
    { symbol: '☀' },
    { symbol: '✿' },
    { symbol: '☽' },
    { symbol: '⚡' },
    { symbol: '☘' },
    { symbol: '❄' },
    { symbol: '☕' },
    { symbol: '✈' },
];
const addSticker = (stk) => {
    stickerLayers.value.push({
        id: `sticker_${Date.now()}`,
        symbol: stk.symbol,
        top: 50,
        left: 50,
    });
    pushSnapshot();
    activeSubTool.value = null;
    uni.showToast({ title: '已添加贴纸', icon: 'none' });
};

// 选中的文字或贴纸图层
const selectLayer = (id) => {
    activeLayerId.value = id;
};
const clearActiveLayer = () => {
    activeLayerId.value = null;
};
const removeTextLayer = (idx) => {
    textLayers.value.splice(idx, 1);
    activeLayerId.value = null;
    pushSnapshot();
};
const removeStickerLayer = (idx) => {
    stickerLayers.value.splice(idx, 1);
    activeLayerId.value = null;
    pushSnapshot();
};

// ----------------------------------------------------
// 实时 CSS 滤镜与几何变换合成
// ----------------------------------------------------
const currentFilterTransformStyle = computed(() => {
    const adjust = activeSubTool.value === 'adjust' ? tempAdjust : currentAdjust;
    const crop = activeSubTool.value === 'crop' ? tempCrop : currentCrop;
    const filter = activeSubTool.value === 'filter' ? tempFilter : currentFilter;

    const b = 1 + adjust.brightness / 100;
    const c = 1 + adjust.contrast / 100;
    const s = 1 + adjust.saturation / 100;
    const blurPx = adjust.blur;

    let filterStr = `brightness(${b}) contrast(${c}) saturate(${s})`;
    if (blurPx > 0) {
        filterStr += ` blur(${blurPx}px)`;
    }

    // 叠加滤镜强度
    if (filter.key !== 'none') {
        const factor = filter.intensity / 100;
        if (filter.key === 'film') filterStr += ` sepia(${0.35 * factor})`;
        else if (filter.key === 'warm') filterStr += ` sepia(${0.45 * factor})`;
        else if (filter.key === 'cyber') filterStr += ` hue-rotate(${180 * factor}deg)`;
        else if (filter.key === 'noir') filterStr += ` grayscale(${1 * factor})`;
        else if (filter.key === 'vivid') filterStr += ` saturate(${1 + 0.6 * factor})`;
        else if (filter.key === 'fresh') filterStr += ` brightness(${1 + 0.1 * factor})`;
        else if (filter.key === 'retro') filterStr += ` sepia(${0.5 * factor}) hue-rotate(${-20 * factor}deg)`;
    }

    const transformStr = `rotate(${crop.rotation}deg) scaleX(${crop.flipH ? -1 : 1}) scaleY(${crop.flipV ? -1 : 1})`;

    return {
        filter: filterStr,
        transform: transformStr,
    };
});

// 手机模型容器尺寸与比例适配
const phoneFrameStyle = computed(() => {
    const crop = activeSubTool.value === 'crop' ? tempCrop : currentCrop;
    let ratio = 9 / 16;
    if (crop.ratioKey === 'ratio1_1') ratio = 1;
    else if (crop.ratioKey === 'ratio3_4') ratio = 3 / 4;
    else if (crop.ratioKey === 'ratio4_3') ratio = 4 / 3;
    else if (crop.ratioKey === 'ratio16_9') ratio = 16 / 9;

    // 基础宽度 460rpx，高度按比例
    let w = 460;
    let h = Math.round(w / ratio);
    // 限制最大高度，避免超出视口
    if (h > 880) {
        h = 880;
        w = Math.round(h * ratio);
    }
    return {
        width: `${w}rpx`,
        height: `${h}rpx`,
    };
});

// ----------------------------------------------------
// 换图逻辑 (puzzle-image-picker 抽屉)
// ----------------------------------------------------
const showPicker = ref(false);
const openImagePicker = () => {
    showPicker.value = true;
};
const handleImageSelected = (images) => {
    if (images && images.length > 0) {
        currentPicUrl.value = images[0];
        initialOriginalPicUrl.value = images[0];
        pushSnapshot();
    }
};

// ----------------------------------------------------
// 保存与高清 Canvas 导出 (接入统一权限 executeWithAuth)
// ----------------------------------------------------
const adPopup = ref(null);
const isExporting = ref(false);
const exportCanvasW = ref(1080);
const exportCanvasH = ref(1920);

const handleSaveWorkbench = () => {
    executeWithAuth({
        adPopup: adPopup.value,
        actionType: 'workbench_save',
        costEnergy: 1,
        allowNewUserBenefit: false,
        onSuccess: async () => {
            await startCanvasExport();
        },
        customConfig: {
            title: t('workbench.save') || '保存创作壁纸',
            desc: '观看一段简短视频即可免费导出超高清原创壁纸，或开通 VIP 随心畅享极速导出。',
            adBtnText: '免费导出壁纸',
            vipBtnText: '开通 VIP 极速导出',
            vipSuccessTip: t('workbench.vipSuccessTip') || 'VIP 专属极速导出',
            energySuccessTip: t('workbench.energySuccessTip') || '已扣除 1 能量导出壁纸',
            adSuccessTip: t('workbench.adSuccessTip') || '广告观看完成，正在导出壁纸',
        },
    });
};

// 离屏 Canvas 合成
const startCanvasExport = async () => {
    if (isExporting.value) return;
    isExporting.value = true;
    uni.showLoading({ title: t('workbench.saving') || '正在导出...', mask: true });

    try {
        // 目标分辨率 1080 x 1920 (或按当前比例)
        const targetW = 1080;
        let ratio = 9 / 16;
        if (currentCrop.ratioKey === 'ratio1_1') ratio = 1;
        else if (currentCrop.ratioKey === 'ratio3_4') ratio = 3 / 4;
        else if (currentCrop.ratioKey === 'ratio4_3') ratio = 4 / 3;
        else if (currentCrop.ratioKey === 'ratio16_9') ratio = 16 / 9;

        const targetH = Math.round(targetW / ratio);
        exportCanvasW.value = targetW;
        exportCanvasH.value = targetH;

        // 统一使用 uni.createCanvasContext 绘制导出
        const ctx = uni.createCanvasContext('workbenchCanvas');

        // 1. 绘制底图
        ctx.save();
        ctx.translate(targetW / 2, targetH / 2);
        if (currentCrop.rotation !== 0) {
            ctx.rotate((currentCrop.rotation * Math.PI) / 180);
        }
        ctx.scale(currentCrop.flipH ? -1 : 1, currentCrop.flipV ? -1 : 1);
        ctx.drawImage(currentPicUrl.value, -targetW / 2, -targetH / 2, targetW, targetH);
        ctx.restore();

        // 2. 绘制暗角 (如果存在)
        if (currentAdjust.vignette > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(0, 0, 0, ${currentAdjust.vignette * 0.006})`;
            ctx.fillRect(0, 0, targetW, targetH);
            ctx.restore();
        }

        // 3. 绘制文字图层
        for (const layer of textLayers.value) {
            ctx.save();
            const posX = (targetW * layer.left) / 100;
            const posY = (targetH * layer.top) / 100;
            ctx.font = `bold ${Math.round(layer.fontSize * 1.8)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (layer.style === 'styleCapsule') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
                const textWidth = ctx.measureText(layer.text).width || 200;
                ctx.fillRect(posX - textWidth / 2 - 20, posY - 30, textWidth + 40, 60);
            }
            ctx.fillStyle = layer.color || '#ffffff';
            ctx.fillText(layer.text, posX, posY);
            ctx.restore();
        }

        // 4. 绘制贴纸图层
        for (const stk of stickerLayers.value) {
            ctx.save();
            const posX = (targetW * stk.left) / 100;
            const posY = (targetH * stk.top) / 100;
            ctx.font = '64px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(stk.symbol, posX, posY);
            ctx.restore();
        }

        ctx.draw(false, () => {
            setTimeout(() => {
                uni.canvasToTempFilePath({
                    canvasId: 'workbenchCanvas',
                    destWidth: targetW,
                    destHeight: targetH,
                    fileType: 'jpg',
                    quality: 0.95,
                    success: async (res) => {
                        try {
                            await saveImageToAlbum(res.tempFilePath);
                            uni.showToast({
                                title: t('workbench.saveSuccess') || '壁纸已保存到相册！',
                                icon: 'success',
                            });
                        } catch (saveErr) {
                            console.error('保存相册失败:', saveErr);
                            uni.showToast({
                                title: t('workbench.saveFailed') || '保存失败，请重试',
                                icon: 'none',
                            });
                        }
                    },
                    fail: (err) => {
                        console.error('导出临时文件失败:', err);
                        uni.showToast({ title: '导出失败', icon: 'none' });
                    },
                    complete: () => {
                        isExporting.value = false;
                        uni.hideLoading();
                    },
                });
            }, 300);
        });
    } catch (e) {
        console.error('Canvas 导出异常:', e);
        uni.hideLoading();
        isExporting.value = false;
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

onLoad((options) => {
    if (options?.url) {
        const decoded = decodeURIComponent(options.url);
        currentPicUrl.value = decoded;
        initialOriginalPicUrl.value = decoded;
    }
    // 初始化历史快照
    pushSnapshot();
    updateClock();
    clockTimer = setInterval(updateClock, 30000);
});

onUnmounted(() => {
    if (clockTimer) clearInterval(clockTimer);
});
</script>

<style lang="scss" scoped>
.workbench-page {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
    user-select: none;

    &.theme-light {
        background-color: #f1f5f9;
        color: #0f172a;

        .workbench-nav {
            background-color: rgba(241, 245, 249, 0.95);
            border-bottom: 1rpx solid rgba(226, 232, 240, 0.8);
        }

        .phone-frame {
            box-shadow: 0 30rpx 70rpx rgba(15, 23, 42, 0.16);
            border: 8rpx solid #0f172a;
        }

        .main-tabbar {
            background-color: #ffffff;
            border-top: 1rpx solid rgba(226, 232, 240, 0.8);
        }

        .sub-panel-drawer {
            background-color: #ffffff;
            box-shadow: 0 -12rpx 36rpx rgba(15, 23, 42, 0.08);
            border-top: 1rpx solid rgba(226, 232, 240, 0.8);
        }

        .history-capsule {
            background-color: rgba(148, 163, 184, 0.15);
        }

        .ratio-chip, .transform-btn, .adjust-tab-item, .phrase-chip, .style-tab {
            background-color: #f1f5f9;
            color: #334155;

            &.is-active {
                background-color: #e0e7ff;
                color: #4338ca;
            }
        }
    }

    &.theme-dark {
        background-color: #090d16;
        color: #f8fafc;

        .workbench-nav {
            background-color: rgba(9, 13, 22, 0.95);
            border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
        }

        .phone-frame {
            box-shadow: 0 30rpx 70rpx rgba(0, 0, 0, 0.6);
            border: 8rpx solid #334155;
        }

        .main-tabbar {
            background-color: #111827;
            border-top: 1rpx solid rgba(255, 255, 255, 0.08);
        }

        .sub-panel-drawer {
            background-color: #111827;
            box-shadow: 0 -12rpx 36rpx rgba(0, 0, 0, 0.4);
            border-top: 1rpx solid rgba(255, 255, 255, 0.08);
        }

        .history-capsule {
            background-color: rgba(255, 255, 255, 0.08);
        }

        .ratio-chip, .transform-btn, .adjust-tab-item, .phrase-chip, .style-tab {
            background-color: #1e293b;
            color: #cbd5e1;

            &.is-active {
                background-color: rgba(99, 102, 241, 0.25);
                color: #a5b4fc;
            }
        }
    }
}

/* 1. 顶部导航与操作栏 */
.workbench-nav {
    flex-shrink: 0;
    z-index: 50;
    display: flex;
    flex-direction: column;
    padding-bottom: 12rpx;

    .nav-header {
        height: 72rpx;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24rpx;
    }

    .nav-back-btn {
        width: 64rpx;
        height: 64rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        cursor: pointer;

        &:active {
            opacity: 0.6;
        }
    }

    .nav-title {
        font-size: 32rpx;
        font-weight: 700;
        letter-spacing: 0.5rpx;
    }

    .nav-placeholder {
        width: 64rpx;
        height: 64rpx;
    }

    .quick-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10rpx 24rpx;
        gap: 16rpx;
    }

    .history-capsule {
        display: flex;
        align-items: center;
        height: 64rpx;
        border-radius: 999rpx;
        padding: 0 8rpx;

        .history-btn {
            width: 52rpx;
            height: 52rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s;

            &:active:not(.is-disabled) {
                transform: scale(0.92);
            }

            &.is-disabled {
                opacity: 0.4;
                pointer-events: none;
            }

            &--redo {
                transform: scaleX(-1);
            }
        }

        .history-divider {
            width: 2rpx;
            height: 24rpx;
            background-color: rgba(148, 163, 184, 0.3);
            margin: 0 4rpx;
        }
    }

    .quick-actions {
        display: flex;
        align-items: center;
        gap: 20rpx;
    }

    .quick-action-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2rpx;
        cursor: pointer;
        transition: all 0.2s;

        &:active {
            opacity: 0.7;
        }

        .action-label {
            font-size: 18rpx;
            opacity: 0.8;
            transition: color 0.2s;

            &.is-active {
                color: #6366f1;
                font-weight: 600;
                opacity: 1;
            }
        }
    }

    .save-capsule-btn {
        display: flex;
        align-items: center;
        gap: 8rpx;
        padding: 12rpx 28rpx;
        border-radius: 999rpx;
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        box-shadow: 0 6rpx 18rpx rgba(99, 102, 241, 0.4);
        cursor: pointer;
        transition: all 0.2s;

        &:active {
            opacity: 0.88;
            transform: scale(0.96);
        }

        .save-btn-text {
            font-size: 24rpx;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: 1rpx;
        }
    }
}

/* 2. 中间舞台与手机模型 */
.stage-viewport {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16rpx 24rpx;
    box-sizing: border-box;
}

.phone-frame {
    position: relative;
    border-radius: 54rpx;
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
    transition: filter 0.15s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.vignette-overlay {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    box-shadow: inset 0 0 120rpx rgba(0, 0, 0, 0.9);
    transition: opacity 0.2s ease;
}

/* 九宫格参考线 */
.grid-overlay {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 15;

    .grid-line {
        position: absolute;
        background-color: rgba(255, 255, 255, 0.45);

        &--h1 { top: 33.33%; left: 0; width: 100%; height: 1rpx; }
        &--h2 { top: 66.66%; left: 0; width: 100%; height: 1rpx; }
        &--v1 { left: 33.33%; top: 0; height: 100%; width: 1rpx; }
        &--v2 { left: 66.66%; top: 0; height: 100%; width: 1rpx; }
    }
}

/* 拟真 iOS 锁屏组件 */
.lockscreen-overlay {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 20;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 72rpx 28rpx 28rpx;
    box-sizing: border-box;
    color: #ffffff;
    text-shadow: 0 4rpx 14rpx rgba(0, 0, 0, 0.6);

    .lock-header {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .lock-icon-wrap {
        margin-bottom: 8rpx;
    }

    .lock-time {
        font-size: 88rpx;
        font-weight: 300;
        line-height: 1;
        letter-spacing: 2rpx;
    }

    .lock-date {
        font-size: 22rpx;
        font-weight: 500;
        margin-top: 10rpx;
        opacity: 0.95;
    }

    .lock-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 12rpx;
    }

    .lock-tool-btn {
        width: 76rpx;
        height: 76rpx;
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(16rpx);
        -webkit-backdrop-filter: blur(16rpx);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1rpx solid rgba(255, 255, 255, 0.15);
    }

    .home-indicator {
        width: 180rpx;
        height: 8rpx;
        border-radius: 999rpx;
        background-color: rgba(255, 255, 255, 0.85);
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.4);
    }
}

/* 顶部灵动岛凹槽 */
.dynamic-island {
    position: absolute;
    top: 14rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 140rpx;
    height: 38rpx;
    background-color: #000000;
    border-radius: 999rpx;
    z-index: 30;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.5);
}

/* 文字与贴纸交互层 */
.text-layer-item, .sticker-layer-item {
    position: absolute;
    z-index: 25;
    cursor: pointer;
    transition: transform 0.15s ease;

    &.is-active {
        outline: 2rpx dashed #6366f1;
        outline-offset: 6rpx;
    }

    .layer-remove-badge {
        position: absolute;
        top: -16rpx;
        right: -16rpx;
        width: 32rpx;
        height: 32rpx;
        border-radius: 50%;
        background-color: #ef4444;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.4);
    }
}

.text-layer-item {
    &.style--styleCapsule {
        padding: 8rpx 20rpx;
        border-radius: 999rpx;
        background-color: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(12rpx);
    }

    &.style--styleLightCapsule {
        padding: 8rpx 20rpx;
        border-radius: 999rpx;
        background-color: rgba(255, 255, 255, 0.9);
        color: #0f172a !important;
    }

    &.style--styleBorder {
        padding: 8rpx 20rpx;
        border-radius: 12rpx;
        border: 2rpx solid currentColor;
    }

    .layer-content {
        font-weight: 700;
        white-space: nowrap;
    }
}

.sticker-symbol {
    font-size: 64rpx;
}

/* 3. 底部主工具栏 */
.main-tabbar {
    flex-shrink: 0;
    height: 128rpx;
    padding-bottom: env(safe-area-inset-bottom);
    display: flex;
    align-items: center;
    justify-content: space-around;
    z-index: 40;

    .tab-tool-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6rpx;
        cursor: pointer;
        padding: 10rpx 16rpx;
        transition: all 0.2s;

        &:active {
            transform: scale(0.94);
            opacity: 0.7;
        }

        .tool-icon-wrap {
            width: 48rpx;
            height: 48rpx;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .tool-name {
            font-size: 20rpx;
            font-weight: 500;
        }
    }
}

/* 4. 二级抽屉面板 */
.sub-panel-drawer {
    flex-shrink: 0;
    border-radius: 36rpx 36rpx 0 0;
    padding: 24rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    z-index: 60;
    animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);

    .drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 8rpx;
    }

    .drawer-title {
        font-size: 28rpx;
        font-weight: 700;
    }

    .header-action-btn {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        &:active {
            opacity: 0.6;
        }
    }

    .drawer-body {
        padding: 12rpx 0;
    }
}

@keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

/* 裁剪面板 */
.crop-panel {
    display: flex;
    flex-direction: column;
    gap: 24rpx;

    .ratio-chips-row {
        display: flex;
        gap: 16rpx;
        overflow-x: auto;
        padding: 4rpx 0;
    }

    .ratio-chip {
        padding: 12rpx 24rpx;
        border-radius: 16rpx;
        white-space: nowrap;
        font-size: 22rpx;
        font-weight: 600;
        cursor: pointer;
    }

    .transform-actions-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16rpx;
    }

    .transform-btn {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8rpx;
        padding: 16rpx 8rpx;
        border-radius: 20rpx;
        cursor: pointer;

        &--reverse {
            transform: scaleX(-1);
            .btn-name { transform: scaleX(-1); }
        }

        .btn-name {
            font-size: 20rpx;
            font-weight: 500;
        }
    }
}

/* 调节面板 */
.adjust-panel {
    display: flex;
    flex-direction: column;
    gap: 20rpx;

    .adjust-slider-wrap {
        padding: 0 16rpx;
    }

    .slider-meta-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6rpx;

        .param-title {
            font-size: 24rpx;
            font-weight: 600;
        }

        .param-value {
            font-size: 24rpx;
            font-weight: 700;
            color: #6366f1;
        }
    }

    .adjust-tabs-scroll {
        width: 100%;
    }

    .adjust-tabs-row {
        display: flex;
        gap: 16rpx;
        padding: 6rpx 0;
    }

    .adjust-tab-item {
        padding: 12rpx 28rpx;
        border-radius: 16rpx;
        font-size: 22rpx;
        font-weight: 600;
        white-space: nowrap;
        cursor: pointer;
    }
}

/* 滤镜面板 */
.filter-panel {
    display: flex;
    flex-direction: column;
    gap: 20rpx;

    .filter-scroll {
        width: 100%;
    }

    .filter-cards-row {
        display: flex;
        gap: 20rpx;
        padding: 8rpx 0;
    }

    .filter-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10rpx;
        cursor: pointer;

        &.is-active .filter-avatar {
            box-shadow: 0 0 0 4rpx #6366f1;
        }

        .filter-avatar {
            width: 100rpx;
            height: 100rpx;
            border-radius: 24rpx;
            overflow: hidden;
            position: relative;
        }

        .filter-demo-thumb {
            width: 100%;
            height: 100%;
        }

        .filter-name {
            font-size: 20rpx;
            font-weight: 600;
        }
    }

    .filter-intensity-block {
        padding: 0 16rpx;
    }
}

/* 文字面板 */
.text-panel {
    display: flex;
    flex-direction: column;
    gap: 20rpx;

    .input-line-box {
        background-color: rgba(148, 163, 184, 0.15);
        border-radius: 20rpx;
        padding: 16rpx 24rpx;
    }

    .text-native-input {
        font-size: 26rpx;
        width: 100%;
    }

    .hot-phrases-scroll {
        width: 100%;
    }

    .hot-phrases-row {
        display: flex;
        gap: 14rpx;
        padding: 4rpx 0;
    }

    .phrase-chip {
        padding: 10rpx 20rpx;
        border-radius: 999rpx;
        font-size: 20rpx;
        white-space: nowrap;
        cursor: pointer;
    }

    .text-config-row {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .config-label {
            font-size: 22rpx;
            opacity: 0.8;
            font-weight: 500;
        }
    }

    .palette-group {
        display: flex;
        gap: 16rpx;

        .color-dot {
            width: 44rpx;
            height: 44rpx;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);

            &.is-active {
                box-shadow: 0 0 0 4rpx #6366f1;
            }
        }
    }

    .style-tabs-group {
        display: flex;
        gap: 12rpx;

        .style-tab {
            padding: 8rpx 18rpx;
            border-radius: 12rpx;
            font-size: 20rpx;
            font-weight: 600;
            cursor: pointer;
        }
    }
}

/* 贴纸面板 */
.sticker-panel {
    display: flex;
    flex-direction: column;
    gap: 16rpx;

    .sticker-hint {
        font-size: 22rpx;
        opacity: 0.7;
    }

    .sticker-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 16rpx;
    }

    .sticker-grid-item {
        height: 88rpx;
        border-radius: 20rpx;
        background-color: rgba(148, 163, 184, 0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.15s;

        &:active {
            transform: scale(0.9);
        }

        .stk-symbol {
            font-size: 40rpx;
        }
    }
}

/* 离屏合成 Canvas */
.workbench-hidden-canvas {
    position: fixed;
    top: -99999px;
    left: -99999px;
    pointer-events: none;
    opacity: 0;
    z-index: -10;
}
</style>
