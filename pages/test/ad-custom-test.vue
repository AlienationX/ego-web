<template>
    <view class="page" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <menu-bar>
            <template #title>信息流 & Banner 广告测试</template>
        </menu-bar>

        <view class="content">
            <!-- 运行环境与配置说明 -->
            <view class="info-card">
                <view class="info-header">
                    <uni-icons type="info" size="18" :color="settingsStore.isDark ? '#60a5fa' : '#2563eb'"></uni-icons>
                    <text class="info-title">测试环境与广告位 ID</text>
                </view>
                <view class="info-grid">
                    <view class="info-item">
                        <text class="label">当前平台:</text>
                        <text class="value platform-tag">{{ currentPlatform }}</text>
                    </view>
                    <view class="info-item">
                        <text class="label">Banner ID:</text>
                        <text class="value code">{{ currentIds.banner }}</text>
                    </view>
                    <view class="info-item">
                        <text class="label">横版卡片 ID:</text>
                        <text class="value code">{{ currentIds.horizontal }}</text>
                    </view>
                    <view class="info-item">
                        <text class="label">竖版卡片 ID:</text>
                        <text class="value code">{{ currentIds.vertical }}</text>
                    </view>
                </view>
                <view class="info-actions">
                    <button class="btn-refresh-all" @click="refreshCurrentTab">刷新当前广告</button>
                    <button class="btn-clear-log" @click="clearLogs">清空调试日志</button>
                </view>
            </view>

            <!-- 核心提示：微信限制说明 -->
            <view class="notice-card">
                <text class="notice-title">⚠️ 微信小程序广告规则重要提醒：</text>
                <text class="notice-text">1. 微信规定【同一个页面内不能存在相同 unit-id 的多个组件】，否则后续组件会被直接静默丢弃（不触发 load 也不触发 error）。</text>
                <text class="notice-text">2. 为避免冲突，请使用下方【切换测试】单独验证各个广告单元。</text>
            </view>

            <!-- 测试模式切换选项卡 -->
            <view class="tab-selector">
                <view
                    v-for="tab in tabList"
                    :key="tab.key"
                    class="tab-item"
                    :class="{ active: currentTab === tab.key }"
                    @click="switchTab(tab.key)"
                >
                    <text class="tab-name">{{ tab.name }}</text>
                    <text v-if="status[tab.key]" class="tab-dot" :class="status[tab.key].type"></text>
                </view>
            </view>

            <!-- ───────────────────────────────────────────────────────────── -->
            <!-- 1. 原生横版原生模板广告 (<ad-custom>) -->
            <!-- ───────────────────────────────────────────────────────────── -->
            <view v-if="currentTab === 'horizontal'" class="ad-section">
                <view class="ad-section-head">
                    <view class="ad-title-box">
                        <text class="badge badge-custom">原生 ad-custom</text>
                        <text class="ad-title">横版原生模板广告 (纯原生标签)</text>
                    </view>
                    <view class="ad-tools">
                        <text class="status-tag" :class="status.horizontal.type">{{ status.horizontal.text }}</text>
                        <button class="btn-mini" @click="refreshAd('horizontal')">重载</button>
                    </view>
                </view>
                <view class="ad-desc">
                    直接使用微信 ad-custom 标签，独占当前页面，无对照组抢占 unit-id。
                </view>
                <view class="ad-id-row">
                    <text class="id-label">生效 ID:</text>
                    <text class="id-val">{{ isMpWeixin ? horizontalUnitId : horizontalAdpid }}</text>
                </view>

                <view v-if="status.horizontal.error" class="error-box">
                    <text class="err-title">错误返回:</text>
                    <text class="err-detail">code: {{ status.horizontal.error.errCode || status.horizontal.error.code || '未知' }}</text>
                    <text class="err-msg">{{ status.horizontal.error.errMsg || status.horizontal.error.message || JSON.stringify(status.horizontal.error) }}</text>
                </view>

                <view class="ad-slot-box" :key="'horizontal-' + reloadKeys.horizontal">
                    <!-- #ifdef MP-WEIXIN -->
                    <ad-custom
                        v-if="horizontalUnitId"
                        class="native-ad-custom"
                        :unit-id="horizontalUnitId"
                        @load="onAdLoad('horizontal', $event)"
                        @error="onAdError('horizontal', $event)"
                    ></ad-custom>
                    <!-- #endif -->

                    <!-- #ifndef MP-WEIXIN -->
                    <ad
                        v-if="horizontalAdpid"
                        class="native-ad-app"
                        :adpid="horizontalAdpid"
                        @load="onAdLoad('horizontal', $event)"
                        @error="onAdError('horizontal', $event)"
                    ></ad>
                    <!-- #endif -->
                </view>
            </view>

            <!-- ───────────────────────────────────────────────────────────── -->
            <!-- 2. 原生 Banner 广告 (<ad>) -->
            <!-- ───────────────────────────────────────────────────────────── -->
            <view v-if="currentTab === 'banner'" class="ad-section">
                <view class="ad-section-head">
                    <view class="ad-title-box">
                        <text class="badge badge-banner">原生 ad</text>
                        <text class="ad-title">底部 Banner 广告 (纯原生标签)</text>
                    </view>
                    <view class="ad-tools">
                        <text class="status-tag" :class="status.banner.type">{{ status.banner.text }}</text>
                        <button class="btn-mini" @click="refreshAd('banner')">重载</button>
                    </view>
                </view>
                <view class="ad-desc">
                    使用微信 ad 原生组件。微信要求宽度需大于等于 300px。
                </view>
                <view class="ad-id-row">
                    <text class="id-label">生效 ID:</text>
                    <text class="id-val">{{ isMpWeixin ? bannerUnitId : bannerAdpid }}</text>
                </view>

                <view v-if="status.banner.error" class="error-box">
                    <text class="err-title">错误返回:</text>
                    <text class="err-detail">code: {{ status.banner.error.errCode || status.banner.error.code || '未知' }}</text>
                    <text class="err-msg">{{ status.banner.error.errMsg || status.banner.error.message || JSON.stringify(status.banner.error) }}</text>
                </view>

                <!-- Banner 广告容器：宽度保证 100%，无多余边距压迫 -->
                <view class="banner-outer-box" :key="'banner-' + reloadKeys.banner">
                    <!-- #ifdef MP-WEIXIN -->
                    <ad
                        v-if="bannerUnitId"
                        class="native-ad-banner"
                        :unit-id="bannerUnitId"
                        @load="onAdLoad('banner', $event)"
                        @error="onAdError('banner', $event)"
                    ></ad>
                    <!-- #endif -->

                    <!-- #ifndef MP-WEIXIN -->
                    <ad
                        v-if="bannerAdpid"
                        class="native-ad-app"
                        :adpid="bannerAdpid"
                        @load="onAdLoad('banner', $event)"
                        @error="onAdError('banner', $event)"
                    ></ad>
                    <!-- #endif -->
                </view>
            </view>

            <!-- ───────────────────────────────────────────────────────────── -->
            <!-- 3. 原生竖版模板广告 (<ad-custom>) -->
            <!-- ───────────────────────────────────────────────────────────── -->
            <view v-if="currentTab === 'vertical'" class="ad-section">
                <view class="ad-section-head">
                    <view class="ad-title-box">
                        <text class="badge badge-custom">原生 ad-custom</text>
                        <text class="ad-title">竖版卡片模板广告</text>
                    </view>
                    <view class="ad-tools">
                        <text class="status-tag" :class="status.vertical.type">{{ status.vertical.text }}</text>
                        <button class="btn-mini" @click="refreshAd('vertical')">重载</button>
                    </view>
                </view>

                <view class="ad-id-row">
                    <text class="id-label">生效 ID:</text>
                    <text class="id-val">{{ isMpWeixin ? verticalUnitId : verticalAdpid }}</text>
                </view>

                <!-- 切换宽度容器（互斥渲染，避免单页面同 ID 冲突） -->
                <view class="width-toggle-box">
                    <text class="toggle-label">容器宽度排查：</text>
                    <button
                        class="btn-toggle"
                        :class="{ active: verticalContainerMode === 'full' }"
                        @click="changeVerticalMode('full')"
                    >
                        通栏 100% 容器 (推荐)
                    </button>
                    <button
                        class="btn-toggle"
                        :class="{ active: verticalContainerMode === 'narrow' }"
                        @click="changeVerticalMode('narrow')"
                    >
                        单列 345rpx (瀑布流模拟)
                    </button>
                </view>

                <view class="ad-desc">
                    当前测试模式：{{ verticalContainerMode === 'full' ? '通栏宽度 100% (排查模板拉取)' : '单列宽度 345rpx (排查窄宽限制)' }}
                </view>

                <view v-if="status.vertical.error" class="error-box">
                    <text class="err-title">错误返回:</text>
                    <text class="err-detail">code: {{ status.vertical.error.errCode || status.vertical.error.code || '未知' }}</text>
                    <text class="err-msg">{{ status.vertical.error.errMsg || status.vertical.error.message || JSON.stringify(status.vertical.error) }}</text>
                </view>

                <view
                    class="ad-slot-box"
                    :class="{ 'vertical-narrow-box': verticalContainerMode === 'narrow' }"
                    :key="'vertical-' + verticalContainerMode + '-' + reloadKeys.vertical"
                >
                    <!-- #ifdef MP-WEIXIN -->
                    <ad-custom
                        v-if="verticalUnitId"
                        class="native-ad-custom"
                        :unit-id="verticalUnitId"
                        @load="onAdLoad('vertical', $event)"
                        @error="onAdError('vertical', $event)"
                    ></ad-custom>
                    <!-- #endif -->

                    <!-- #ifndef MP-WEIXIN -->
                    <ad
                        v-if="verticalAdpid"
                        class="native-ad-app"
                        :adpid="verticalAdpid"
                        @load="onAdLoad('vertical', $event)"
                        @error="onAdError('vertical', $event)"
                    ></ad>
                    <!-- #endif -->
                </view>
            </view>

            <!-- ───────────────────────────────────────────────────────────── -->
            <!-- 0. 【对照组】classify.vue 同款 <custom-ad> 组件 -->
            <!-- ───────────────────────────────────────────────────────────── -->
            <view v-if="currentTab === 'compare'" class="ad-section">
                <view class="ad-section-head">
                    <view class="ad-title-box">
                        <text class="badge badge-compare">对照组</text>
                        <text class="ad-title">classify.vue 同款 custom-ad</text>
                    </view>
                    <view class="ad-tools">
                        <text class="status-tag" :class="status.compare.type">{{ status.compare.text }}</text>
                        <button class="btn-mini" @click="refreshAd('compare')">重载</button>
                    </view>
                </view>
                <view class="ad-desc">
                    与分类页完全相同的调用方式 (custom-ad border-radius="24rpx")，使用封装组件进行对比
                </view>
                <view class="compare-ad-box" :key="'compare-' + reloadKeys.compare">
                    <custom-ad
                        border-radius="24rpx"
                        @load="onAdLoad('compare', $event)"
                        @error="onAdError('compare', $event)"
                    />
                </view>
            </view>

            <!-- 实时调试日志面板 -->
            <view class="log-section">
                <view class="log-header">
                    <text class="log-title">实时事件日志 ({{ logs.length }})</text>
                    <button class="btn-mini" @click="clearLogs">清空</button>
                </view>
                <scroll-view scroll-y class="log-list">
                    <view v-if="logs.length === 0" class="log-empty">等待广告事件响应中...</view>
                    <view v-for="(log, idx) in logs" :key="idx" class="log-item" :class="log.type">
                        <text class="log-time">{{ log.time }}</text>
                        <text class="log-tag">[{{ log.slot }}]</text>
                        <text class="log-msg">{{ log.message }}</text>
                    </view>
                </scroll-view>
            </view>

            <!-- 常见错误码速查 -->
            <view class="faq-section">
                <view class="faq-title">💡 微信小程序广告核心规则与错误速查</view>
                <view class="faq-item">
                    <text class="faq-code">单页面唯一 ID 限制:</text>
                    <text class="faq-desc">微信同一个页面严禁出现两个相同 unit-id 的组件，后渲染的组件将直接被微信静默拦截。</text>
                </view>
                <view class="faq-item">
                    <text class="faq-code">最小尺寸要求:</text>
                    <text class="faq-desc">Banner 和原生模板广告宽度通常要求 >= 300px。窄列容器可能被微信广告策略拒载。</text>
                </view>
                <view class="faq-item">
                    <text class="faq-code">-5005 / 1004:</text>
                    <text class="faq-desc">-5005 为开发者工具环境无填充；1004 为频控/资源未下发。</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useSettingsStore } from '@/stores/settings.js';
import { AD_CONFIG } from '@/common/config.js';

const settingsStore = useSettingsStore();

// 是否是微信小程序环境
const isMpWeixin = ref(false);
// #ifdef MP-WEIXIN
isMpWeixin.value = true;
// #endif

// 当前选中的测试 Tab（避免同一个页面渲染相同 unit-id 产生微信冲突）
const currentTab = ref('horizontal');
const tabList = [
    { key: 'horizontal', name: '原生横版' },
    { key: 'banner', name: '原生 Banner' },
    { key: 'vertical', name: '原生竖版' },
    { key: 'compare', name: '对照组 (封装)' },
];

// 竖版模板广告测试模式：'full'(通栏100%排查) 或 'narrow'(345rpx排查)
const verticalContainerMode = ref('full');

// 明确暴露各广告位的响应式 ID，确保 WXML 编译可直接获取
const bannerUnitId = computed(() => AD_CONFIG.weixin?.bannerUnitId || '');
const horizontalUnitId = computed(() => AD_CONFIG.weixin?.customHorizontalUnitId || '');
const verticalUnitId = computed(() => AD_CONFIG.weixin?.customVerticalUnitId || '');

const bannerAdpid = computed(() => AD_CONFIG.app?.bannerAdpid || '');
const horizontalAdpid = computed(() => AD_CONFIG.app?.customHorizontalAdpid || '');
const verticalAdpid = computed(() => AD_CONFIG.app?.customVerticalAdpid || '');

// 平台检测
const currentPlatform = computed(() => {
    // #ifdef MP-WEIXIN
    return '微信小程序 (MP-WEIXIN)';
    // #endif
    // #ifdef APP-PLUS
    return 'App (uni-AD)';
    // #endif
    // #ifdef H5
    return 'H5 浏览器';
    // #endif
    return '未知平台';
});

// 当前平台的 ID
const currentIds = computed(() => {
    if (isMpWeixin.value) {
        return {
            banner: bannerUnitId.value,
            horizontal: horizontalUnitId.value,
            vertical: verticalUnitId.value,
        };
    }
    return {
        banner: bannerAdpid.value,
        horizontal: horizontalAdpid.value,
        vertical: verticalAdpid.value,
    };
});

// 重新挂载 key
const reloadKeys = reactive({
    compare: 1,
    banner: 1,
    horizontal: 1,
    vertical: 1,
});

// 广告位加载状态
const status = reactive({
    compare: { type: 'loading', text: '加载中...', error: null },
    banner: { type: 'loading', text: '加载中...', error: null },
    horizontal: { type: 'loading', text: '加载中...', error: null },
    vertical: { type: 'loading', text: '加载中...', error: null },
});

// 事件日志列表
const logs = ref([]);

const addLog = (slot, type, message) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    logs.value.unshift({ time, slot, type, message });
    if (logs.value.length > 80) logs.value.pop();
};

const clearLogs = () => {
    logs.value = [];
};

// 广告加载成功
const onAdLoad = (slot, e) => {
    const target = slot.startsWith('vertical') ? 'vertical' : slot;
    if (status[target]) {
        status[target].type = 'success';
        status[target].text = '加载成功 (已渲染)';
        status[target].error = null;
    }
    console.log(`[AdCustomTest] ${slot} load:`, e);
    addLog(slot, 'success', '广告加载成功并完成渲染');
};

// 广告加载失败
const onAdError = (slot, e) => {
    const target = slot.startsWith('vertical') ? 'vertical' : slot;
    const detail = e?.detail || e || {};
    const code = detail.errCode || detail.code || 'UNKNOWN';
    const msg = detail.errMsg || detail.message || JSON.stringify(detail);

    if (status[target]) {
        status[target].type = 'error';
        status[target].text = `加载失败 [${code}]`;
        status[target].error = detail;
    }
    console.error(`[AdCustomTest] ${slot} error:`, e);
    addLog(slot, 'error', `加载失败: errCode=${code}, errMsg=${msg}`);
};

// 切换 Tab 测试项
const switchTab = (tabKey) => {
    currentTab.value = tabKey;
    addLog('TAB', 'info', `切换至测试项: ${tabKey}`);
};

// 切换竖版卡片广告容器模式
const changeVerticalMode = (mode) => {
    verticalContainerMode.value = mode;
    reloadKeys.vertical++;
    status.vertical.type = 'loading';
    status.vertical.text = '加载中...';
    status.vertical.error = null;
    addLog('vertical', 'info', `切换容器模式为: ${mode === 'full' ? '通栏 100%' : '单列 345rpx'}`);
};

// 单个广告位重载
const refreshAd = (slot) => {
    reloadKeys[slot]++;
    status[slot].type = 'loading';
    status[slot].text = '加载中...';
    status[slot].error = null;
    addLog(slot, 'info', `触发手动重载 [${slot}]`);
};

// 刷新当前选中的广告位
const refreshCurrentTab = () => {
    refreshAd(currentTab.value);
};
</script>

<style lang="scss" scoped>
.page {
    min-height: 100vh;
    background: var(--page-background, #f5f6f9);
    color: var(--text-primary, #15171c);
    display: flex;
    flex-direction: column;
}

.content {
    padding: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 28rpx;
}

/* 环境信息卡片 */
.info-card {
    background: var(--panel-background, #ffffff);
    border: 1rpx solid var(--panel-border, rgba(0, 0, 0, 0.08));
    border-radius: 20rpx;
    padding: 24rpx;
    box-shadow: 0 4rpx 16rpx var(--shadow-color, rgba(0, 0, 0, 0.04));

    .info-header {
        display: flex;
        align-items: center;
        gap: 12rpx;
        margin-bottom: 20rpx;

        .info-title {
            font-size: 30rpx;
            font-weight: 700;
        }
    }

    .info-grid {
        display: flex;
        flex-direction: column;
        gap: 12rpx;
    }

    .info-item {
        display: flex;
        align-items: center;
        font-size: 24rpx;

        .label {
            width: 170rpx;
            color: var(--text-tertiary, #888);
        }

        .value {
            flex: 1;
            word-break: break-all;
            font-weight: 600;

            &.code {
                font-family: monospace;
                color: #2563eb;
            }

            &.platform-tag {
                color: #059669;
            }
        }
    }

    .info-actions {
        display: flex;
        gap: 16rpx;
        margin-top: 24rpx;

        button {
            flex: 1;
            font-size: 24rpx;
            padding: 12rpx 0;
            border-radius: 12rpx;
            line-height: 1.5;
            border: none;
        }

        .btn-refresh-all {
            background: #2563eb;
            color: #fff;
        }

        .btn-clear-log {
            background: rgba(0, 0, 0, 0.06);
            color: var(--text-primary);
        }
    }
}

/* 微信规则提醒卡片 */
.notice-card {
    background: #fffbeb;
    border: 1rpx solid #fde68a;
    border-radius: 16rpx;
    padding: 20rpx 24rpx;
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    .theme-dark & {
        background: rgba(180, 83, 9, 0.15);
        border-color: rgba(245, 158, 11, 0.3);
    }

    .notice-title {
        font-size: 24rpx;
        font-weight: 700;
        color: #b45309;

        .theme-dark & {
            color: #fbbf24;
        }
    }

    .notice-text {
        font-size: 22rpx;
        color: #92400e;
        line-height: 1.5;

        .theme-dark & {
            color: #fcd34d;
        }
    }
}

/* Tab 切换栏 */
.tab-selector {
    display: flex;
    gap: 12rpx;
    background: var(--panel-background, #ffffff);
    padding: 8rpx;
    border-radius: 16rpx;
    border: 1rpx solid var(--panel-border, rgba(0, 0, 0, 0.08));

    .tab-item {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8rpx;
        padding: 16rpx 6rpx;
        border-radius: 12rpx;
        font-size: 24rpx;
        font-weight: 600;
        color: var(--text-secondary, #666);
        background: transparent;
        transition: all 0.2s ease;

        &.active {
            background: #2563eb;
            color: #ffffff;
            box-shadow: 0 4rpx 12rpx rgba(37, 99, 235, 0.3);
        }

        .tab-dot {
            width: 12rpx;
            height: 12rpx;
            border-radius: 50%;

            &.loading {
                background: #eab308;
            }

            &.success {
                background: #22c55e;
            }

            &.error {
                background: #ef4444;
            }
        }
    }
}

/* 竖版宽度排查切换条 */
.width-toggle-box {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin: 8rpx 0;
    flex-wrap: wrap;

    .toggle-label {
        font-size: 22rpx;
        color: var(--text-tertiary, #888);
    }

    .btn-toggle {
        font-size: 22rpx;
        padding: 8rpx 16rpx;
        border-radius: 10rpx;
        background: rgba(0, 0, 0, 0.06);
        color: var(--text-primary);
        border: 1rpx solid transparent;
        line-height: 1.4;
        margin: 0;

        &.active {
            background: #dbeafe;
            color: #1d4ed8;
            border-color: #93c5fd;
            font-weight: 700;
        }
    }
}

/* Banner 独立通栏容器 */
.banner-outer-box {
    width: 100%;
    min-width: 300px;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    border: 2rpx dashed rgba(37, 99, 235, 0.35);
    border-radius: 16rpx;
    background: rgba(37, 99, 235, 0.02);
    padding: 8rpx 0;
    margin-top: 8rpx;

    ad,
    :deep(ad),
    .native-ad-banner,
    .native-ad-app {
        width: 100% !important;
        min-width: 300px;
        display: block !important;
    }
}

/* 单个广告卡片容器 */
.ad-section {
    background: var(--panel-background, #ffffff);
    border: 1rpx solid var(--panel-border, rgba(0, 0, 0, 0.08));
    border-radius: 20rpx;
    padding: 24rpx;
    box-shadow: 0 4rpx 16rpx var(--shadow-color, rgba(0, 0, 0, 0.04));
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.ad-section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.ad-title-box {
    display: flex;
    align-items: center;
    gap: 12rpx;

    .badge {
        font-size: 20rpx;
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
        font-weight: 700;

        &.badge-compare {
            background: #ede9fe;
            color: #6d28d9;
        }

        &.badge-banner {
            background: #dbeafe;
            color: #1d4ed8;
        }

        &.badge-custom {
            background: #fef3c7;
            color: #b45309;
        }
    }

    .ad-title {
        font-size: 28rpx;
        font-weight: 700;
    }
}

.ad-desc {
    font-size: 22rpx;
    color: var(--text-tertiary, #888);
}

.ad-id-row {
    display: flex;
    align-items: center;
    font-size: 22rpx;
    color: var(--text-tertiary, #888);

    .id-label {
        margin-right: 10rpx;
    }

    .id-val {
        font-family: monospace;
        color: #2563eb;
        font-weight: 600;
    }
}

.ad-tools {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.status-tag {
    font-size: 22rpx;
    padding: 6rpx 14rpx;
    border-radius: 999rpx;
    font-weight: 600;

    &.loading {
        background: #fef9c3;
        color: #854d0e;
    }

    &.success {
        background: #dcfce7;
        color: #15803d;
    }

    &.error {
        background: #fee2e2;
        color: #b91c1c;
    }
}

.btn-mini {
    font-size: 22rpx;
    padding: 6rpx 20rpx;
    border-radius: 10rpx;
    background: rgba(0, 0, 0, 0.06);
    color: var(--text-primary);
    border: none;
    line-height: 1.4;
    margin: 0;
}

/* 错误详细面板 */
.error-box {
    background: #fff1f2;
    border: 1rpx solid #fecdd3;
    border-radius: 12rpx;
    padding: 16rpx;
    font-size: 22rpx;
    color: #9f1239;
    display: flex;
    flex-direction: column;
    gap: 6rpx;

    .err-title {
        font-weight: 700;
    }

    .err-detail {
        font-family: monospace;
        font-weight: 600;
    }

    .err-msg {
        word-break: break-all;
    }
}

/* 对照组包裹层（对齐 classify.vue） */
.compare-ad-box {
    width: 100%;
    margin-top: 10rpx;
}

/* 原生广告容器 */
.ad-slot-box {
    width: 100%;
    display: block;
    box-sizing: border-box;
    border: 2rpx dashed rgba(37, 99, 235, 0.35);
    border-radius: 16rpx;
    background: rgba(37, 99, 235, 0.02);
    padding: 12rpx;
    margin-top: 8rpx;

    /* 必须让原生 ad 和 ad-custom 撑满容器，避免微信内部尺寸收缩 */
    ad,
    ad-custom,
    :deep(ad),
    :deep(ad-custom),
    .native-ad-custom,
    .native-ad-banner,
    .native-ad-app {
        width: 100% !important;
        display: block !important;
        box-sizing: border-box;
    }

    &.vertical-narrow-box {
        width: 345rpx;
    }
}

/* 实时日志面板 */
.log-section {
    background: #111827;
    color: #f3f4f6;
    border-radius: 20rpx;
    padding: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 16rpx;

    .log-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .log-title {
            font-size: 26rpx;
            font-weight: 700;
            color: #93c5fd;
        }

        .btn-mini {
            background: rgba(255, 255, 255, 0.15);
            color: #fff;
        }
    }

    .log-list {
        max-height: 420rpx;
        display: flex;
        flex-direction: column;
        gap: 10rpx;
    }

    .log-empty {
        font-size: 22rpx;
        color: #6b7280;
        text-align: center;
        padding: 40rpx 0;
    }

    .log-item {
        font-size: 20rpx;
        font-family: monospace;
        line-height: 1.5;
        padding: 6rpx 0;
        border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
        word-break: break-all;

        .log-time {
            color: #9ca3af;
            margin-right: 10rpx;
        }

        .log-tag {
            font-weight: 700;
            margin-right: 10rpx;
        }

        &.success {
            color: #4ade80;
            .log-tag {
                color: #22c55e;
            }
        }

        &.error {
            color: #f87171;
            .log-tag {
                color: #ef4444;
            }
        }

        &.info {
            color: #60a5fa;
            .log-tag {
                color: #3b82f6;
            }
        }
    }
}

/* FAQ 排查速查 */
.faq-section {
    background: var(--panel-background, #ffffff);
    border: 1rpx solid var(--panel-border, rgba(0, 0, 0, 0.08));
    border-radius: 20rpx;
    padding: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 14rpx;

    .faq-title {
        font-size: 26rpx;
        font-weight: 700;
        margin-bottom: 6rpx;
    }

    .faq-item {
        font-size: 22rpx;
        line-height: 1.5;

        .faq-code {
            font-weight: 700;
            color: #ef4444;
            margin-right: 10rpx;
            font-family: monospace;
        }

        .faq-desc {
            color: var(--text-secondary, #666);
        }
    }
}
</style>
