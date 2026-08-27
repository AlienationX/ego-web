<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 沉浸式顶部导航 -->
        <view class="nav-header" :style="{ paddingTop: statusBarHeight + 'px' }">
            <view class="nav-bar">
                <view class="back-btn" @click="handleBack">
                    <mdi-icon path="/static/icons/arrow-left.svg" size="22px"
                        :color="settingsStore.isDark ? '#e5e7eb' : '#1e293b'"></mdi-icon>
                </view>
                <text class="nav-title">{{ t('autoWallpaper.pageTitle') }}</text>
                <view class="nav-placeholder"></view>
            </view>
        </view>

        <!-- 滚动配置主体 -->
        <scroll-view class="config-scroll" scroll-y :show-scrollbar="false">
            <view class="config-content">
                <!-- VIP 尊享特权徽章横幅 -->
                <view class="vip-header-card" :class="{ 'is-vip': userStore.isVip }">
                    <view class="vip-badge-icon">
                        <mdi-icon path="/static/icons/crown-circle.svg" size="28px" color="#FBBF24"></mdi-icon>
                    </view>
                    <view class="vip-header-info">
                        <text class="vip-header-title">{{ t('autoWallpaper.vipFeatureTitle') }}</text>
                        <text class="vip-header-desc">{{ userStore.isVip ? t('autoWallpaper.vipActiveDesc') :
                            t('autoWallpaper.vipUnlockDesc') }}</text>
                    </view>
                </view>

                <!-- 总开关卡片 -->
                <view class="section-card">
                    <view class="setting-row">
                        <view class="setting-left">
                            <text class="setting-title">{{ t('autoWallpaper.masterSwitchTitle') }}</text>
                            <text class="setting-desc">{{ t('autoWallpaper.masterSwitchDesc') }}</text>
                        </view>
                        <switch :key="switchKey" :checked="form.enabled" color="#4F46E5" @change="onMasterSwitchChange" />
                    </view>
                </view>

                <!-- 切换模式选择 -->
                <view class="section-card" :class="{ 'is-disabled': !form.enabled }">
                    <text class="card-section-title">{{ t('autoWallpaper.modeSelectTitle') }}</text>

                    <view class="mode-cards">
                        <!-- 模式 1：每日必应壁纸 -->
                        <view class="mode-card" :class="{ 'is-active': form.mode === 'bing' }"
                            @click="selectMode('bing')">
                            <view class="mode-radio">
                                <view class="radio-circle" :class="{ 'is-checked': form.mode === 'bing' }"></view>
                            </view>
                            <view class="mode-info">
                                <text class="mode-name">{{ t('autoWallpaper.modeBingTitle') }}</text>
                                <text class="mode-desc">{{ t('autoWallpaper.modeBingDesc') }}</text>
                            </view>
                        </view>

                        <!-- 模式 2：画板轮播 -->
                        <view class="mode-card" :class="{ 'is-active': form.mode === 'board' }"
                            @click="selectMode('board')">
                            <view class="mode-radio">
                                <view class="radio-circle" :class="{ 'is-checked': form.mode === 'board' }"></view>
                            </view>
                            <view class="mode-info">
                                <text class="mode-name">{{ t('autoWallpaper.modeBoardTitle') }}</text>
                                <text class="mode-desc">{{ t('autoWallpaper.modeBoardDesc') }}</text>

                                <!-- 选中画板指示器与跳转入口 -->
                                <view v-if="form.mode === 'board'" class="board-action-row">
                                    <view class="selected-board-pill" @click.stop="openBoardPicker">
                                        <text class="board-pill-text">{{ selectedBoardName ||
                                            t('autoWallpaper.pickBoardPlaceholder') }}</text>
                                        <mdi-icon path="/static/icons/chevron-right.svg" size="14px"
                                            :color="settingsStore.isDark ? '#94a3b8' : '#64748b'"></mdi-icon>
                                    </view>
                                    <view class="manage-board-btn" @click.stop="goToFavorite">
                                        <text class="manage-board-text">{{ t('autoWallpaper.manageBoards') }}</text>
                                    </view>
                                </view>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- 轮播策略 (画板模式可用) -->
                <view class="section-card" :class="{ 'is-disabled': !form.enabled || form.mode !== 'board' }">
                    <text class="card-section-title">{{ t('autoWallpaper.strategyTitle') }}</text>
                    <view class="mode-cards">
                        <!-- 策略 1：随机轮播 -->
                        <view class="mode-card" :class="{ 'is-active': form.strategy === 'random' }"
                            @click="selectStrategy('random')">
                            <view class="mode-radio">
                                <view class="radio-circle" :class="{ 'is-checked': form.strategy === 'random' }"></view>
                            </view>
                            <view class="mode-info">
                                <text class="mode-name">{{ t('autoWallpaper.strategyRandom') }}</text>
                                <text class="mode-desc">{{ t('autoWallpaper.strategyRandomDesc') }}</text>
                            </view>
                        </view>

                        <!-- 策略 2：顺序循环 -->
                        <view class="mode-card" :class="{ 'is-active': form.strategy === 'sequential' }"
                            @click="selectStrategy('sequential')">
                            <view class="mode-radio">
                                <view class="radio-circle" :class="{ 'is-checked': form.strategy === 'sequential' }"></view>
                            </view>
                            <view class="mode-info">
                                <text class="mode-name">{{ t('autoWallpaper.strategySequential') }}</text>
                                <text class="mode-desc">{{ t('autoWallpaper.strategySequentialDesc') }}</text>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- 应用目标选择 -->
                <view class="section-card" :class="{ 'is-disabled': !form.enabled }">
                    <text class="card-section-title">{{ t('autoWallpaper.targetTitle') }}</text>
                    <view class="pill-group">
                        <view class="pill-btn" :class="{ 'is-active': form.target === 'lock' }"
                            @click="selectTarget('lock')">
                            {{ t('autoWallpaper.targetLock') }}
                        </view>
                        <view class="pill-btn" :class="{ 'is-active': form.target === 'home' }"
                            @click="selectTarget('home')">
                            {{ t('autoWallpaper.targetHome') }}
                        </view>
                        <view class="pill-btn" :class="{ 'is-active': form.target === 'both' }"
                            @click="selectTarget('both')">
                            {{ t('autoWallpaper.targetBoth') }}
                        </view>
                    </view>
                </view>

                <!-- 切换频率 (画板模式可用) -->
                <view class="section-card" :class="{ 'is-disabled': !form.enabled || form.mode !== 'board' }">
                    <text class="card-section-title">{{ t('autoWallpaper.frequencyTitle') }}</text>
                    <view class="pill-group">
                        <view class="pill-btn" :class="{ 'is-active': form.frequency === 'daily' }"
                            @click="selectFrequency('daily')">
                            {{ t('autoWallpaper.freqDaily') }}
                        </view>
                        <view class="pill-btn" :class="{ 'is-active': form.frequency === '12h' }"
                            @click="selectFrequency('12h')">
                            {{ t('autoWallpaper.freq12h') }}
                        </view>
                        <view class="pill-btn" :class="{ 'is-active': form.frequency === '1h' }"
                            @click="selectFrequency('1h')">
                            {{ t('autoWallpaper.freq1h') }}
                        </view>
                        <view class="pill-btn" :class="{ 'is-active': form.frequency === 'unlock' }"
                            @click="selectFrequency('unlock')">
                            {{ t('autoWallpaper.freqUnlock') }}
                        </view>
                    </view>
                </view>

                <!-- 省流量控制 -->
                <view class="section-card" :class="{ 'is-disabled': !form.enabled }">
                    <view class="setting-row">
                        <view class="setting-left">
                            <text class="setting-title">{{ t('autoWallpaper.wifiOnlyTitle') }}</text>
                            <text class="setting-desc">{{ t('autoWallpaper.wifiOnlyDesc') }}</text>
                        </view>
                        <switch :checked="form.wifi_only" color="#4F46E5" @change="onWifiSwitchChange" />
                    </view>
                </view>

                <!-- iOS 快捷指令配置指引专区 -->
                <view class="section-card shortcuts-card">
                    <view class="shortcuts-header">
                        <view class="apple-icon">
                            <mdi-icon path="/static/icons/brands/apple.svg" size="20px" color="#ffffff"></mdi-icon>
                        </view>
                        <text class="shortcuts-title">{{ t('autoWallpaper.iosShortcutsTitle') }}</text>
                    </view>
                    <text class="shortcuts-desc">{{ t('autoWallpaper.iosShortcutsDesc') }}</text>

                    <view class="token-box" v-if="form.rotate_token">
                        <text class="token-label">{{ t('autoWallpaper.feedUrlLabel') }}</text>
                        <view class="token-content">
                            <text class="token-text">{{ feedUrl }}</text>
                            <view class="copy-pill" @click="copyFeedUrl">
                                {{ t('autoWallpaper.copyUrl') }}
                            </view>
                        </view>
                    </view>
                </view>

                <!-- 轮播测试与验证卡片 -->
                <view class="section-card test-card" v-if="form.enabled">
                    <view class="test-action-row" @click="handleTestRotate">
                        <view class="test-icon-box">
                            <mdi-icon path="/static/icons/refresh.svg" size="20px" color="#ffffff"></mdi-icon>
                        </view>
                        <view class="test-info">
                            <text class="test-title">{{ isTesting ? t('autoWallpaper.testing') : t('autoWallpaper.testRotateBtn') }}</text>
                            <text class="test-desc">实时向 Feed 接口拉取一张壁纸并验证画板轮播效果</text>
                        </view>
                        <mdi-icon path="/static/icons/chevron-right.svg" size="20px" :color="settingsStore.isDark ? '#64748b' : '#94a3b8'"></mdi-icon>
                    </view>
                </view>

                <!-- 保存按钮 -->
                <view class="action-wrap" :class="{ 'is-disabled': !form.enabled }">
                    <button class="save-btn" :disabled="!form.enabled || saving" @click="handleSaveConfig">
                        {{ saving ? t('common.saving') : t('common.saveSettings') }}
                    </button>
                </view>
            </view>
        </scroll-view>

        <!-- 画板选择弹窗 -->
        <popup-board-select ref="boardPicker" @saved="onBoardSelected" />

        <!-- 轮播测试结果弹窗 -->
        <uni-popup ref="testPopup" type="center" :z-index="1000">
            <view class="test-dialog-card" :class="{ 'theme-dark': settingsStore.isDark }" v-if="testResult">
                <view class="test-dialog-header">
                    <text class="test-dialog-title">{{ t('autoWallpaper.testResultTitle') }}</text>
                    <view class="close-btn" @click="testPopup?.close()">
                        <mdi-icon path="/static/icons/close.svg" size="18px"
                            :color="settingsStore.isDark ? '#94a3b8' : '#64748b'"></mdi-icon>
                    </view>
                </view>

                <view class="test-preview-img-box">
                    <image class="test-preview-img" :src="testResult.image_url" mode="aspectFill"></image>
                    <view class="test-tag mode-tag">
                        {{ testResult.mode === 'board' ? `画板: ${testResult.board_name || '已选画板'}` : '每日必应' }}
                    </view>
                </view>

                <view class="test-details">
                    <text class="detail-title">{{ testResult.title || '超清壁纸' }}</text>
                    <text class="detail-sub">目标: {{ testResult.target === 'lock' ? '仅锁屏' : (testResult.target === 'home' ? '仅桌面' : '双屏') }} · 时间: {{ testResult.rotated_at }}</text>
                </view>

                <button class="apply-native-btn" @click="applyWallpaperNative">
                    {{ t('autoWallpaper.applyToSystem') }}
                </button>
            </view>
        </uni-popup>

        <!-- 通用导航对话框 -->
        <popup-navigation-dialog ref="navDialog" :title="dialogState.title" :description="dialogState.description"
            :confirmText="dialogState.confirmText" :cancelText="dialogState.cancelText"
            :showCancel="dialogState.showCancel" @confirm="dialogState.onConfirm"
            @cancel="dialogState.onCancel"></popup-navigation-dialog>
    </view>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserStore } from '@/stores/user.js';
import { useI18n } from 'vue-i18n';
import { API_BASE_URL } from '@/common/config.js';
import { apiGetRotateConfig, apiSaveRotateConfig, apiGetRotateFeed } from '@/api/member.js';
import { apiGetBoards } from '@/api/wallpaper.js';
import { setWallpaper, startAutoRotate, stopAutoRotate, isWallpaperSupported } from '@/uni_modules/ego-wallpaper-manager';
import { setAndroidWallpaper } from '@/common/core.js';
import PopupBoardSelect from '@/components/popup-board-select/popup-board-select.vue';
import PopupNavigationDialog from '@/components/popup-navigation-dialog/popup-navigation-dialog.vue';

const settingsStore = useSettingsStore();
const userStore = useUserStore();
const { t } = useI18n();

const statusBarHeight = ref(0);
const saving = ref(false);
const isTesting = ref(false);
const testPopup = ref(null);
const testResult = ref(null);
const boardPicker = ref(null);
const boardsList = ref([]);
const switchKey = ref(0);

// 通用导航对话框控制
const navDialog = ref(null);
const dialogState = reactive({
    title: '',
    description: '',
    confirmText: '',
    cancelText: '',
    showCancel: true,
    onConfirm: () => { },
    onCancel: () => { },
});

const showNavDialog = (options) => {
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

const form = ref({
    enabled: false,
    mode: 'bing',
    board: null,
    board_name: '',
    target: 'lock',
    frequency: 'daily',
    strategy: 'random',
    wifi_only: true,
    rotate_token: '',
});

const selectedBoardName = computed(() => {
    if (form.value.board_name) return form.value.board_name;
    const found = boardsList.value.find((b) => b.id === form.value.board);
    return found ? found.name : '';
});

const feedUrl = computed(() => {
    const base = API_BASE_URL.replace(/\/+$/, '');
    return `${base}/rotate/feed/?token=${form.value.rotate_token || ''}`;
});

onMounted(async () => {
    statusBarHeight.value = uni.getWindowInfo().statusBarHeight || 20;
    if (userStore.isLoggedIn || userStore.userinfo?.id) {
        await Promise.all([loadConfig(), loadBoards()]);
    }
});

const loadConfig = async () => {
    if (!userStore.isLoggedIn && !userStore.userinfo?.id) return;
    try {
        const res = await apiGetRotateConfig();
        if (res?.data) {
            Object.assign(form.value, res.data);
        }
    } catch (e) {
        console.error('Failed to load auto-rotate config', e);
    }
};

const loadBoards = async () => {
    if (!userStore.isLoggedIn && !userStore.userinfo?.id) return;
    try {
        const res = await apiGetBoards();
        if (res?.data && Array.isArray(res.data)) {
            boardsList.value = res.data;
        }
    } catch (e) {
        console.error('Failed to load boards', e);
    }
};

const handleBack = () => {
    uni.navigateBack();
};

const resetSwitch = () => {
    form.value.enabled = false;
    switchKey.value++;
};

const checkAuthAndVip = (onCancelCallback) => {
    // 1. 未登录拦截 -> 引导去登录
    if (!userStore.isLoggedIn && !userStore.userinfo?.id) {
        showNavDialog({
            title: t('common.tip'),
            content: t('autoWallpaper.loginRequiredPrompt'),
            confirmText: t('user.profile.login') || '去登录',
            cancelText: t('common.cancel'),
            onConfirm: () => {
                uni.navigateTo({ url: '/pages/auth/signin' });
            },
            onCancel: () => {
                if (typeof onCancelCallback === 'function') {
                    onCancelCallback();
                }
            },
        });
        return false;
    }

    // 2. 已登录但非 VIP 拦截 -> 引导去开通 VIP
    if (!userStore.isVip) {
        showNavDialog({
            title: t('common.tip'),
            content: t('autoWallpaper.vipRequiredPrompt'),
            confirmText: t('membership.title') || '开通会员',
            cancelText: t('common.cancel'),
            onConfirm: () => {
                uni.navigateTo({ url: '/pages/member/payment' });
            },
            onCancel: () => {
                if (typeof onCancelCallback === 'function') {
                    onCancelCallback();
                }
            },
        });
        return false;
    }

    return true;
};

const onMasterSwitchChange = (e) => {
    const nextVal = e.detail.value;
    if (nextVal) {
        const passed = checkAuthAndVip(() => {
            resetSwitch();
        });
        if (!passed) {
            resetSwitch();
            return;
        }
    }
    form.value.enabled = nextVal;
};

const onWifiSwitchChange = (e) => {
    form.value.wifi_only = e.detail.value;
};

const selectMode = (mode) => {
    if (!form.value.enabled) return;
    form.value.mode = mode;
};

const selectTarget = (target) => {
    if (!form.value.enabled) return;
    form.value.target = target;
};

const selectFrequency = (freq) => {
    if (!form.value.enabled || form.value.mode !== 'board') return;
    form.value.frequency = freq;
};

const selectStrategy = (strat) => {
    if (!form.value.enabled || form.value.mode !== 'board') return;
    form.value.strategy = strat;
};

const goToFavorite = () => {
    uni.navigateTo({ url: '/pages/app/favorite' });
};

const openBoardPicker = () => {
    if (!form.value.enabled) return;
    const passed = checkAuthAndVip();
    if (!passed) return;
    boardPicker.value?.open();
};

const onBoardSelected = ({ board }) => {
    form.value.board = board.id;
    form.value.board_name = board.name;
};

const copyFeedUrl = () => {
    uni.setClipboardData({
        data: feedUrl.value,
        success: () => {
            uni.showToast({ title: t('common.copied'), icon: 'none' });
        },
    });
};

const handleTestRotate = async () => {
    if (isTesting.value) return;
    isTesting.value = true;
    try {
        uni.showLoading({ title: t('autoWallpaper.testing') });
        const res = await apiGetRotateFeed({ token: form.value.rotate_token });
        uni.hideLoading();
        if (res?.data) {
            testResult.value = res.data;
            testPopup.value?.open();
        } else {
            uni.showToast({ title: '拉取失败，请检查设置', icon: 'none' });
        }
    } catch (e) {
        uni.hideLoading();
        uni.showToast({ title: '拉取失败，请检查网络', icon: 'none' });
    } finally {
        isTesting.value = false;
    }
};

const applyWallpaperNative = () => {
    if (!testResult.value?.image_url) return;

    // ── 1. 鸿蒙 HarmonyOS NEXT 原生平台 ──
    // #ifdef APP-HARMONY
    uni.showLoading({ title: '正在设置壁纸...' });
    setWallpaper({
        url: testResult.value.image_url,
        target: form.value.target || 'lock',
        success: () => {
            uni.hideLoading();
            uni.showToast({ title: '壁纸设置成功！', icon: 'none' });
            testPopup.value?.close();
        },
        fail: (err) => {
            uni.hideLoading();
            uni.showToast({ title: err?.errMsg || '壁纸设置失败', icon: 'none', duration: 5000 });
        },
    });
    return;
    // #endif

    // ── 2. 5+ App 平台 (Android 与 iOS) ──
    // #ifdef APP-PLUS
    const device = uni.getDeviceInfo();
    if (device.platform === 'android' || (typeof plus !== 'undefined' && plus.android)) {
        uni.showLoading({ title: '正在设置壁纸...' });
        uni.downloadFile({
            url: testResult.value.image_url,
            success: (downloadRes) => {
                if (downloadRes.statusCode === 200) {
                    const localPath = plus.io.convertLocalFileSystemURL(downloadRes.tempFilePath);
                    setAndroidWallpaper(localPath, form.value.target || 'lock')
                        .then(() => {
                            uni.hideLoading();
                            uni.showToast({ title: '壁纸设置成功！', icon: 'success' });
                            testPopup.value?.close();
                        })
                        .catch((err) => {
                            uni.hideLoading();
                            uni.showToast({ title: '设置壁纸失败: ' + (err?.message || err), icon: 'none' });
                        });
                } else {
                    uni.hideLoading();
                    uni.showToast({ title: '壁纸下载失败', icon: 'none' });
                }
            },
            fail: () => {
                uni.hideLoading();
                uni.showToast({ title: '壁纸下载失败，请检查网络', icon: 'none' });
            }
        });
        return;
    } else if (device.platform === 'ios') {
        uni.showToast({ title: 'iOS 受系统安全限制，请使用下方 iOS 快捷指令自动更换', icon: 'none' });
        return;
    }
    // #endif

    // ── 3. 非 App 运行环境 (如 H5、小程序等) ──
    // #ifndef APP
    uni.showToast({ title: '当前运行环境暂不支持直接调用系统壁纸 API', icon: 'none' });
    // #endif
};

const handleSaveConfig = async () => {
    if (form.value.enabled) {
        const passed = checkAuthAndVip();
        if (!passed) return;
    }

    saving.value = true;
    try {
        const saveRes = await apiSaveRotateConfig({
            enabled: form.value.enabled,
            mode: form.value.mode,
            board_id: form.value.board,
            target: form.value.target,
            frequency: form.value.frequency,
            strategy: form.value.strategy,
            wifi_only: form.value.wifi_only,
        });

        if (saveRes?.data?.rotate_token) {
            form.value.rotate_token = saveRes.data.rotate_token;
        }

        // #ifdef APP
        if (form.value.enabled) {
            startAutoRotate({
                feedUrl: feedUrl.value,
                frequency: form.value.frequency || 'unlock',
                target: form.value.target || 'lock',
                wifiOnly: form.value.wifi_only !== false,
            });
        } else {
            stopAutoRotate();
        }
        // #endif

        uni.showToast({ title: t('autoWallpaper.saveSuccess'), icon: 'none' });
    } catch (e) {
        uni.showToast({ title: t('autoWallpaper.saveFailed'), icon: 'none' });
    } finally {
        saving.value = false;
    }
};
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: #f8fafc;
    display: flex;
    flex-direction: column;

    &.theme-dark {
        background: #0f172a;
    }
}

.nav-header {
    background: #ffffff;
    border-bottom: 1rpx solid #e2e8f0;
    position: sticky;
    top: 0;
    z-index: 100;

    .theme-dark & {
        background: #1e293b;
        border-color: #334155;
    }
}

.nav-bar {
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24rpx;

    .back-btn {
        width: 60rpx;
        height: 60rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    .nav-title {
        font-size: 32rpx;
        font-weight: 700;
        color: #0f172a;

        .theme-dark & {
            color: #f8fafc;
        }
    }

    .nav-placeholder {
        width: 60rpx;
    }
}

.config-scroll {
    flex: 1;
    height: calc(100vh - 120rpx);
}

.config-content {
    padding: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 24rpx;
    padding-bottom: 80rpx;
}

.vip-header-card {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 28rpx 32rpx;
    border-radius: 28rpx;
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%);
    box-shadow: 0 8rpx 24rpx rgba(49, 46, 129, 0.25);
    color: #ffffff;

    &.is-vip {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
    }

    .vip-badge-icon {
        width: 64rpx;
        height: 64rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .vip-header-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6rpx;
    }

    .vip-header-title {
        font-size: 30rpx;
        font-weight: 800;
        color: #fbbf24;
    }

    .vip-header-desc {
        font-size: 22rpx;
        color: #c7d2fe;
        line-height: 1.4;
    }

    &.is-vip .vip-header-desc {
        color: #94a3b8;
    }
}

.section-card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 28rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
    transition: opacity 0.2s ease;

    .theme-dark & {
        background: #1e293b;
    }

    &.is-disabled {
        opacity: 0.45;
        pointer-events: none;
    }
}

.setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .setting-left {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6rpx;

        .setting-title {
            font-size: 30rpx;
            font-weight: 700;
            color: #0f172a;

            .theme-dark & {
                color: #f8fafc;
            }
        }

        .setting-desc {
            font-size: 22rpx;
            color: #64748b;

            .theme-dark & {
                color: #94a3b8;
            }
        }
    }
}

.card-section-title {
    font-size: 28rpx;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 20rpx;
    display: block;

    .theme-dark & {
        color: #f8fafc;
    }
}

.mode-cards {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
}

.mode-card {
    display: flex;
    align-items: flex-start;
    gap: 20rpx;
    padding: 24rpx;
    border-radius: 20rpx;
    background: #f8fafc;
    border: 2rpx solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;

    .theme-dark & {
        background: #0f172a;
    }

    &.is-active {
        border-color: #4f46e5;
        background: #eef2ff;

        .theme-dark & {
            background: rgba(79, 70, 229, 0.16);
            border-color: #6366f1;
        }
    }

    .mode-radio {
        margin-top: 4rpx;

        .radio-circle {
            width: 36rpx;
            height: 36rpx;
            border-radius: 50%;
            border: 3rpx solid #cbd5e1;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;

            .theme-dark & {
                border-color: #475569;
            }

            &.is-checked {
                border-color: #4f46e5;
                background: #4f46e5;
            }
        }
    }

    .mode-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6rpx;

        .mode-name {
            font-size: 28rpx;
            font-weight: 700;
            color: #0f172a;

            .theme-dark & {
                color: #f8fafc;
            }
        }

        .mode-desc {
            font-size: 22rpx;
            color: #64748b;
            line-height: 1.4;

            .theme-dark & {
                color: #94a3b8;
            }
        }

        .board-action-row {
            display: flex;
            align-items: center;
            gap: 16rpx;
            margin-top: 14rpx;
            flex-wrap: wrap;
        }

        .selected-board-pill {
            display: inline-flex;
            align-items: center;
            gap: 8rpx;
            padding: 10rpx 20rpx;
            border-radius: 24rpx;
            background: #e2e8f0;
            cursor: pointer;

            .theme-dark & {
                background: #334155;
            }

            .board-pill-text {
                font-size: 24rpx;
                font-weight: 600;
                color: #4f46e5;

                .theme-dark & {
                    color: #818cf8;
                }
            }
        }

        .manage-board-btn {
            display: inline-flex;
            align-items: center;
            padding: 10rpx 18rpx;
            border-radius: 24rpx;
            background: rgba(79, 70, 229, 0.08);
            cursor: pointer;

            .theme-dark & {
                background: rgba(99, 102, 241, 0.15);
            }

            .manage-board-text {
                font-size: 22rpx;
                font-weight: 600;
                color: #4f46e5;

                .theme-dark & {
                    color: #a5b4fc;
                }
            }

            &:active {
                opacity: 0.7;
            }
        }
    }
}

.pill-group {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.pill-btn {
    padding: 12rpx 28rpx;
    border-radius: 30rpx;
    background: #f1f5f9;
    font-size: 24rpx;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;

    .theme-dark & {
        background: #0f172a;
        color: #94a3b8;
    }

    &.is-active {
        background: #4f46e5;
        color: #ffffff;
        box-shadow: 0 4rpx 14rpx rgba(79, 70, 229, 0.3);
    }
}

.shortcuts-card {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #f8fafc;

    .shortcuts-header {
        display: flex;
        align-items: center;
        gap: 14rpx;

        .apple-icon {
            width: 48rpx;
            height: 48rpx;
            border-radius: 50%;
            background: #334155;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .shortcuts-title {
            font-size: 28rpx;
            font-weight: 700;
            color: #ffffff;
        }
    }

    .shortcuts-desc {
        font-size: 22rpx;
        color: #94a3b8;
        margin-top: 12rpx;
        line-height: 1.5;
        display: block;
    }

    .token-box {
        margin-top: 20rpx;
        background: rgba(15, 23, 42, 0.6);
        padding: 16rpx 20rpx;
        border-radius: 16rpx;

        .token-label {
            font-size: 20rpx;
            color: #64748b;
            display: block;
        }

        .token-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16rpx;
            margin-top: 8rpx;

            .token-text {
                flex: 1;
                font-size: 22rpx;
                color: #38bdf8;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-family: monospace;
            }

            .copy-pill {
                padding: 8rpx 20rpx;
                border-radius: 20rpx;
                background: #38bdf8;
                color: #0f172a;
                font-size: 22rpx;
                font-weight: 700;
                cursor: pointer;

                &:active {
                    opacity: 0.85;
                }
            }
        }
    }
}

.test-card {
    cursor: pointer;
    transition: transform 0.2s ease;

    &:active {
        transform: scale(0.98);
    }

    .test-action-row {
        display: flex;
        align-items: center;
        gap: 20rpx;

        .test-icon-box {
            width: 72rpx;
            height: 72rpx;
            border-radius: 20rpx;
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4rpx 14rpx rgba(79, 70, 229, 0.3);
        }

        .test-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4rpx;

            .test-title {
                font-size: 28rpx;
                font-weight: 700;
                color: #0f172a;

                .theme-dark & {
                    color: #f8fafc;
                }
            }

            .test-desc {
                font-size: 22rpx;
                color: #64748b;

                .theme-dark & {
                    color: #94a3b8;
                }
            }
        }
    }
}

.test-dialog-card {
    width: 620rpx;
    background: #ffffff;
    border-radius: 32rpx;
    padding: 32rpx;
    display: flex;
    flex-direction: column;
    gap: 20rpx;

    &.theme-dark {
        background: #1e293b;
    }

    .test-dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .test-dialog-title {
            font-size: 30rpx;
            font-weight: 700;
            color: #0f172a;

            .theme-dark & {
                color: #f8fafc;
            }
        }

        .close-btn {
            width: 44rpx;
            height: 44rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }
    }

    .test-preview-img-box {
        position: relative;
        width: 100%;
        height: 520rpx;
        border-radius: 20rpx;
        overflow: hidden;
        background: #f1f5f9;

        .test-preview-img {
            width: 100%;
            height: 100%;
            display: block;
        }

        .test-tag {
            position: absolute;
            top: 14rpx;
            left: 14rpx;
            padding: 6rpx 16rpx;
            border-radius: 20rpx;
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(8px);
            color: #ffffff;
            font-size: 20rpx;
            font-weight: 600;
        }
    }

    .test-details {
        display: flex;
        flex-direction: column;
        gap: 6rpx;

        .detail-title {
            font-size: 28rpx;
            font-weight: 700;
            color: #0f172a;

            .theme-dark & {
                color: #f8fafc;
            }
        }

        .detail-sub {
            font-size: 22rpx;
            color: #64748b;

            .theme-dark & {
                color: #94a3b8;
            }
        }
    }

    .apply-native-btn {
        height: 80rpx;
        line-height: 80rpx;
        border-radius: 40rpx;
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        box-shadow: 0 6rpx 18rpx rgba(79, 70, 229, 0.35);
        color: #ffffff;
        font-size: 28rpx;
        font-weight: 700;
        border: none;
        margin-top: 10rpx;

        &:active {
            transform: scale(0.98);
        }
    }
}

.action-wrap {
    margin-top: 20rpx;
    margin-bottom: 40rpx;

    &.is-disabled {
        opacity: 0.45;
        pointer-events: none;
    }

    .save-btn {
        height: 88rpx;
        line-height: 88rpx;
        border-radius: 44rpx;
        background: #4f46e5;
        box-shadow: 0 8rpx 20rpx rgba(79, 70, 229, 0.35);
        color: #ffffff;
        font-size: 30rpx;
        font-weight: 700;
        border: none;

        &[disabled] {
            background: #94a3b8 !important;
            box-shadow: none !important;
            color: #ffffff !important;
            opacity: 0.6;
        }

        &:active {
            opacity: 0.9;
        }
    }
}
</style>
