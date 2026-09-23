<template>
    <view class="page" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <menu-bar>
            <template #title>激励视频广告测试 (Rewarded)</template>
        </menu-bar>

        <view class="content">
            <!-- 环境信息 -->
            <view class="info-card">
                <view class="info-header">
                    <uni-icons type="info" size="18" :color="settingsStore.isDark ? '#60a5fa' : '#2563eb'"></uni-icons>
                    <text class="info-title">测试环境与广告配置</text>
                </view>
                <view class="info-grid">
                    <view class="info-item">
                        <text class="label">当前平台:</text>
                        <text class="value platform-tag">{{ currentPlatform }}</text>
                    </view>
                    <view class="info-item">
                        <text class="label">激励视频 ID:</text>
                        <text class="value code">{{ activeUnitId }}</text>
                    </view>
                    <view class="info-item">
                        <text class="label">就绪状态:</text>
                        <text class="value" :class="isReady ? 'text-success' : 'text-muted'">{{ isReady ? '已就绪 (可随时播放)' : '未就绪 (需加载)' }}</text>
                    </view>
                    <view class="info-item">
                        <text class="label">奖励回调模拟:</text>
                        <text class="value" :class="rewardGranted ? 'text-success' : 'text-muted'">{{ rewardResultText }}</text>
                    </view>
                </view>
            </view>

            <!-- 操作面板 -->
            <view class="control-card">
                <view class="card-title">原生 API 控制面板</view>

                <view class="btn-group">
                    <button class="btn btn-primary" :loading="isLoading" :disabled="isLoading" @click="loadRewardedAd">
                        1. 创建并预载激励视频
                    </button>
                    <button class="btn btn-success" :disabled="!isReady" @click="showRewardedAd">
                        2. 播放激励视频 (完整观看测试发奖)
                    </button>
                    <button class="btn btn-danger" @click="destroyRewardedAd">
                        3. 销毁实例
                    </button>
                </view>

                <view v-if="lastError" class="error-box">
                    <text class="err-title">错误信息:</text>
                    <text class="err-detail">code: {{ lastError.errCode || lastError.code || 'UNKNOWN' }}</text>
                    <text class="err-msg">{{ lastError.errMsg || lastError.message || JSON.stringify(lastError) }}</text>
                </view>
            </view>

            <!-- #ifndef MP-WEIXIN -->
            <!-- App 端额外支持标签组件测试 -->
            <view class="control-card">
                <view class="card-title">App 端原生标签方式测试 (&lt;ad-rewarded-video&gt;)</view>
                <view class="tag-test-box">
                    <ad-rewarded-video
                        ref="adRewardedVideoRef"
                        :adpid="AD_CONFIG.app.rewardedVideoAdpid"
                        :loadnext="false"
                        v-slot:default="{ loading, error }"
                        @load="onTagAdLoad"
                        @close="onTagAdClose"
                        @error="onTagAdError"
                    >
                        <button class="btn btn-secondary" :disabled="loading" :loading="loading" @click="showTagAd">
                            通过 &lt;ad-rewarded-video&gt; 标签展示
                        </button>
                    </ad-rewarded-video>
                </view>
            </view>
            <!-- #endif -->

            <!-- 实时调试日志面板 -->
            <view class="log-section">
                <view class="log-header">
                    <text class="log-title">实时调试事件流 ({{ logs.length }})</text>
                    <button class="btn-mini" @click="clearLogs">清空</button>
                </view>
                <scroll-view scroll-y class="log-list">
                    <view v-if="logs.length === 0" class="log-empty">等待操作触发中...</view>
                    <view v-for="(log, idx) in logs" :key="idx" class="log-item" :class="log.type">
                        <text class="log-time">{{ log.time }}</text>
                        <text class="log-tag">[{{ log.tag }}]</text>
                        <text class="log-msg">{{ log.message }}</text>
                    </view>
                </scroll-view>
            </view>

            <!-- 激励视频说明与排查指南 -->
            <view class="faq-section">
                <view class="faq-title">📌 微信激励视频机制与发奖校验规则</view>
                <view class="faq-item">
                    <text class="faq-desc">• 微信激励视频在关闭时会回调 onClose(res)。判断 `res && res.isEnded || res === undefined` 时才发放奖励，若用户中途点击跳过/退出则不发奖。</text>
                </view>
                <view class="faq-item">
                    <text class="faq-desc">• 微信开发者工具中默认提供模拟视频播放器，若提示 -5005 则表示开发工具当前无测试广告填充，可通过微信手机扫码真机预览验证。</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onUnload } from '@dcloudio/uni-app';
import { useSettingsStore } from '@/stores/settings.js';
import { AD_CONFIG } from '@/common/config.js';

const settingsStore = useSettingsStore();

const currentPlatform = computed(() => {
    // #ifdef MP-WEIXIN
    return '微信小程序 (MP-WEIXIN)';
    // #endif
    // #ifdef APP-PLUS
    return 'App (uni-AD)';
    // #endif
    return 'H5 / 其他';
});

const activeUnitId = computed(() => {
    // #ifdef MP-WEIXIN
    return AD_CONFIG.weixin.rewardedVideoUnitId;
    // #endif
    return AD_CONFIG.app.rewardedVideoAdpid;
});

// 状态
const isLoading = ref(false);
const isReady = ref(false);
const lastError = ref(null);
const rewardGranted = ref(false);
const rewardResultText = ref('等待观看');
const logs = ref([]);

let rewardedVideoInstance = null;

const addLog = (tag, type, message) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    logs.value.unshift({ time, tag, type, message });
    if (logs.value.length > 80) logs.value.pop();
};

const clearLogs = () => {
    logs.value = [];
};

// 1. 创建并预加载激励视频
const loadRewardedAd = () => {
    lastError.value = null;
    isLoading.value = true;
    rewardGranted.value = false;
    rewardResultText.value = '等待观看';
    addLog('API', 'info', `开始创建/预载激励视频实例: ${activeUnitId.value}`);

    // #ifdef MP-WEIXIN
    if (typeof wx !== 'undefined' && wx.createRewardedVideoAd) {
        if (!rewardedVideoInstance) {
            rewardedVideoInstance = wx.createRewardedVideoAd({
                adUnitId: AD_CONFIG.weixin.rewardedVideoUnitId,
            });

            rewardedVideoInstance.onLoad(() => {
                isLoading.value = false;
                isReady.value = true;
                addLog('EVENT', 'success', 'wx.rewardedVideoAd onLoad 触发: 视频已就绪');
                console.log('[AdRewardedTest] onLoad');
            });

            rewardedVideoInstance.onError((err) => {
                isLoading.value = false;
                isReady.value = false;
                lastError.value = err;
                const code = err.errCode || err.code || 'UNKNOWN';
                const msg = err.errMsg || err.message || JSON.stringify(err);
                addLog('EVENT', 'error', `wx.rewardedVideoAd onError 触发: [${code}] ${msg}`);
                console.error('[AdRewardedTest] onError:', err);
            });

            rewardedVideoInstance.onClose((res) => {
                isReady.value = false;
                console.log('[AdRewardedTest] onClose:', res);
                if (res && res.isEnded || res === undefined) {
                    rewardGranted.value = true;
                    rewardResultText.value = '✅ 正常播放完毕，发放奖励！';
                    addLog('REWARD', 'success', 'onClose: 用户完整观看了视频，发放能量奖励！');
                } else {
                    rewardGranted.value = false;
                    rewardResultText.value = '❌ 中途跳过/退出，不发放奖励';
                    addLog('REWARD', 'error', 'onClose: 用户未完整观看，不发放奖励');
                }
            });
        }

        // 调用 load()
        rewardedVideoInstance.load()
            .then(() => {
                isLoading.value = false;
                isReady.value = true;
                addLog('PROMISE', 'success', 'rewardedVideoInstance.load() Promise resolved');
            })
            .catch((err) => {
                isLoading.value = false;
                lastError.value = err;
                addLog('PROMISE', 'error', `rewardedVideoInstance.load() Promise reject: ${JSON.stringify(err)}`);
            });
    } else {
        isLoading.value = false;
        addLog('ERROR', 'error', '当前环境不支持 wx.createRewardedVideoAd API');
    }
    // #endif

    // #ifndef MP-WEIXIN
    // #ifdef APP-PLUS
    if (uni.createRewardedVideoAd) {
        if (!rewardedVideoInstance) {
            rewardedVideoInstance = uni.createRewardedVideoAd({
                adpid: AD_CONFIG.app.rewardedVideoAdpid,
            });

            rewardedVideoInstance.onLoad(() => {
                isLoading.value = false;
                isReady.value = true;
                addLog('EVENT', 'success', 'uni.rewardedVideoAd onLoad 触发');
            });

            rewardedVideoInstance.onError((err) => {
                isLoading.value = false;
                isReady.value = false;
                lastError.value = err;
                addLog('EVENT', 'error', `uni.rewardedVideoAd onError: ${JSON.stringify(err)}`);
            });

            rewardedVideoInstance.onClose((res) => {
                isReady.value = false;
                if (res && res.isEnded) {
                    rewardGranted.value = true;
                    rewardResultText.value = '✅ 正常播放完毕，发放奖励！';
                    addLog('REWARD', 'success', '用户看完了视频，发放奖励');
                } else {
                    rewardGranted.value = false;
                    rewardResultText.value = '❌ 中途退出，不发奖励';
                    addLog('REWARD', 'error', '用户中途退出');
                }
            });
        }

        rewardedVideoInstance.load().catch((err) => {
            isLoading.value = false;
            lastError.value = err;
            addLog('PROMISE', 'error', `load error: ${JSON.stringify(err)}`);
        });
    } else {
        isLoading.value = false;
        addLog('ERROR', 'error', '当前环境不支持 uni.createRewardedVideoAd');
    }
    // #endif
    // #endif
};

// 2. 播放展示激励视频
const showRewardedAd = () => {
    if (!rewardedVideoInstance) {
        addLog('ACTION', 'error', '尚未创建广告实例，请先点击预载');
        return;
    }
    addLog('ACTION', 'info', '调用 show() 播放激励视频');

    rewardedVideoInstance.show()
        .then(() => {
            addLog('PROMISE', 'success', 'show() Promise resolved: 视频播放已启动');
        })
        .catch((err) => {
            lastError.value = err;
            addLog('PROMISE', 'error', `show() Promise reject: ${JSON.stringify(err)}`);
        });
};

// 3. 销毁实例
const destroyRewardedAd = () => {
    if (rewardedVideoInstance && rewardedVideoInstance.destroy) {
        rewardedVideoInstance.destroy();
    }
    rewardedVideoInstance = null;
    isReady.value = false;
    isLoading.value = false;
    addLog('ACTION', 'info', '激励视频广告实例已销毁');
};

// #ifndef MP-WEIXIN
const adRewardedVideoRef = ref(null);
const showTagAd = () => {
    if (adRewardedVideoRef.value && adRewardedVideoRef.value.show) {
        adRewardedVideoRef.value.show();
    }
};
const onTagAdLoad = (e) => {
    addLog('TAG', 'success', `<ad-rewarded-video> 标签 load: ${JSON.stringify(e)}`);
};
const onTagAdClose = (e) => {
    addLog('TAG', 'info', `<ad-rewarded-video> 标签 close: ${JSON.stringify(e)}`);
};
const onTagAdError = (e) => {
    addLog('TAG', 'error', `<ad-rewarded-video> 标签 error: ${JSON.stringify(e)}`);
};
// #endif

onUnload(() => {
    destroyRewardedAd();
});
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

.info-card,
.control-card,
.faq-section {
    background: var(--panel-background, #ffffff);
    border: 1rpx solid var(--panel-border, rgba(0, 0, 0, 0.08));
    border-radius: 20rpx;
    padding: 24rpx;
    box-shadow: 0 4rpx 16rpx var(--shadow-color, rgba(0, 0, 0, 0.04));
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.info-header {
    display: flex;
    align-items: center;
    gap: 12rpx;
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
        width: 190rpx;
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

        &.text-success {
            color: #16a34a;
        }

        &.text-muted {
            color: #9ca3af;
        }
    }
}

.card-title {
    font-size: 28rpx;
    font-weight: 700;
}

.btn-group {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.btn {
    width: 100%;
    font-size: 26rpx;
    padding: 16rpx 0;
    border-radius: 14rpx;
    border: none;
    line-height: 1.5;
    font-weight: 600;

    &.btn-primary {
        background: #2563eb;
        color: #fff;
    }

    &.btn-success {
        background: #16a34a;
        color: #fff;
    }

    &.btn-danger {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
    }

    &.btn-secondary {
        background: #374151;
        color: #fff;
    }

    &[disabled] {
        opacity: 0.5;
        background: #9ca3af !important;
        color: #e5e7eb !important;
    }
}

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

/* 日志面板 */
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
            font-size: 20rpx;
            padding: 4rpx 16rpx;
            border-radius: 8rpx;
            border: none;
            margin: 0;
            line-height: 1.4;
        }
    }

    .log-list {
        max-height: 380rpx;
        display: flex;
        flex-direction: column;
        gap: 10rpx;
    }

    .log-empty {
        font-size: 22rpx;
        color: #6b7280;
        text-align: center;
        padding: 30rpx 0;
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

.faq-title {
    font-size: 26rpx;
    font-weight: 700;
}

.faq-desc {
    font-size: 22rpx;
    line-height: 1.6;
    color: var(--text-secondary, #666);
}
</style>
