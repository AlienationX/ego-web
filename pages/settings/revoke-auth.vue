<template>
    <view class="layout">
        <view class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>

        <view class="header">
            <view class="back-btn" @click="goBack">
                <mdi-icon path="/static/icons/arrow-left.svg" size="18px" color="#374151"></mdi-icon>
            </view>
            <text class="header-title">{{ t('settings.revokeAuth.title') }}</text>
            <view class="header-placeholder"></view>
        </view>

        <scroll-view scroll-y class="content" :style="{ height: contentHeight }">
            <view class="auth-list">
                <view
                    v-for="(item, index) in permissionItems"
                    :key="item.key"
                    class="auth-row"
                    :class="{ 'auth-row--last': index === permissionItems.length - 1 }"
                    @click="handleItemClick(item)"
                >
                    <view class="auth-row__main">
                        <text class="auth-row__title">{{ item.title }}</text>
                        <text class="auth-row__desc">{{ item.desc }}</text>
                    </view>
                    <view class="auth-row__side" @click.stop="handleItemClick(item)">
                        <text class="auth-row__status" :class="`is-${item.status}`">{{ item.statusText }}</text>
                        <mdi-icon path="/static/icons/chevron-right.svg" size="16px" color="#C4C9D4"></mdi-icon>
                    </view>
                </view>
            </view>
        </scroll-view>
    </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { getStatusBarHeight } from '@/utils/system.js';
import { permissionEnums } from '@/common/app_permission.js';

const { t } = useI18n();

const statusBarHeight = ref(getStatusBarHeight() || 0);
const contentHeight = computed(() => `calc(100vh - ${statusBarHeight.value}px - 56px)`);
const appAuthorizeSetting = ref({});
const androidPermissionStatus = ref({});

const APP_PLUS_PERMISSION_PREFIX = 'android.permission.';
const ALBUM_PERMISSION_NAMES = Object.keys(permissionEnums)
    .find((key) => key.includes('READ_MEDIA_IMAGES'))
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean) || ['READ_MEDIA_IMAGES'];

const permissionConfigs = computed(() => [
    {
        key: 'album',
        title: t('settings.revokeAuth.items.album.title'),
        desc: t('settings.revokeAuth.items.album.desc'),
        authKeys: ['albumAuthorized'],
    },
    {
        key: 'camera',
        title: t('settings.revokeAuth.items.camera.title'),
        desc: t('settings.revokeAuth.items.camera.desc'),
        authKeys: ['cameraAuthorized'],
    },
    {
        key: 'location',
        title: t('settings.revokeAuth.items.location.title'),
        desc: t('settings.revokeAuth.items.location.desc'),
        authKeys: ['locationAuthorized'],
    },

    // 电话权限（READ_PHONE_STATE）：用于获取本机号码，便于用户快速注册账号。我们仅在您选择使用手机号注册时请求此权限。
    // 已安装应用列表权限（QUERY_ALL_PACKAGES）：用于获取设备中已安装应用的账户列表，提供便捷登录和社交功能，以及进行用户画像或数据分析。我们仅在您使用相关功能时请求此权限。
    // 系统设置权限（WRITE_SETTINGS）：用于修改系统设置中的壁纸设置项，实现一键设置手机壁纸功能。我们仅在您主动点击设置壁纸时请求此权限。

    // {
    //     key: 'microphone',
    //     title: t('settings.revokeAuth.items.microphone.title'),
    //     desc: t('settings.revokeAuth.items.microphone.desc'),
    //     authKeys: ['microphoneAuthorized'],
    // },
    // {
    //     key: 'notification',
    //     title: t('settings.revokeAuth.items.notification.title'),
    //     desc: t('settings.revokeAuth.items.notification.desc'),
    //     authKeys: ['notificationAuthorized'],
    // },
    // {
    //     key: 'floatWindow',
    //     title: t('settings.revokeAuth.items.floatWindow.title'),
    //     desc: t('settings.revokeAuth.items.floatWindow.desc'),
    //     authKeys: ['notificationAlertAuthorized'],
    // },
]);

const resolveStatus = (keys = []) => {
    const settings = appAuthorizeSetting.value || {};
    const matched = keys.find((key) => settings[key] !== undefined && settings[key] !== null && settings[key] !== '');
    if (!matched) return 'action';

    const value = settings[matched];
    if (value === true || value === 'authorized' || value === 'granted') return 'enabled';
    if (value === 'not determined' || value === 'undetermined') return 'pending';
    if (value === false || value === 'denied' || value === 'config error') return 'action';
    return 'action';
};

const getStatusMeta = (item) => {
    const settings = appAuthorizeSetting.value || {};

    if (item.key === 'album') {
        const permissionGranted = ALBUM_PERMISSION_NAMES.some(
            (permissionName) => androidPermissionStatus.value[permissionName] === true,
        );
        if (permissionGranted) {
            return {
                status: 'enabled',
                statusText: t('settings.revokeAuth.status.enabled'),
            };
        }
    }

    const status = resolveStatus(item.authKeys);

    if (item.key === 'location') {
        const locationValue = settings.locationAuthorized;
        const reducedAccuracy = settings.locationReducedAccuracy;
        if (locationValue === true || locationValue === 'authorized' || locationValue === 'granted') {
            if (reducedAccuracy === true || reducedAccuracy === 'authorized' || reducedAccuracy === 'granted') {
                return {
                    status: 'limited',
                    statusText: t('settings.revokeAuth.status.locationApprox'),
                };
            }
            return {
                status: 'enabled',
                statusText: t('settings.revokeAuth.status.enabled'),
            };
        }
    }

    if (item.key === 'notification') {
        const notificationValue = settings.notificationAuthorized;
        if (notificationValue === true || notificationValue === 'authorized' || notificationValue === 'granted') {
            return {
                status: 'enabled',
                statusText: t('settings.revokeAuth.status.notificationsOn'),
            };
        }
    }

    if (item.key === 'floatWindow') {
        const floatValue = settings.notificationAlertAuthorized;
        if (floatValue === true || floatValue === 'authorized' || floatValue === 'granted') {
            return {
                status: 'enabled',
                statusText: t('settings.revokeAuth.status.floatOn'),
            };
        }
    }

    if (status === 'enabled') {
        return {
            status,
            statusText: t('settings.revokeAuth.status.enabled'),
        };
    }

    if (status === 'pending') {
        return {
            status,
            statusText: t('settings.revokeAuth.status.pending'),
        };
    }

    return {
        status: 'action',
        statusText: t('settings.revokeAuth.status.manage'),
    };
};

const permissionItems = computed(() =>
    permissionConfigs.value.map((item) => ({
        ...item,
        ...getStatusMeta(item),
    })),
);

const readAuthorizeSetting = () => {
    appAuthorizeSetting.value = uni.getAppAuthorizeSetting() || {};
    // uni.getAppAuthorizeSetting() 安卓端仅能获取以下权限状态，有点弱，鸡肋
    // {
    //     "cameraAuthorized": "denied",
    //     "microphoneAuthorized": "config error",
    //     "notificationAuthorized": "denied",
    //     "locationAccuracy": "full",
    //     "locationAuthorized": "authorized"
    // }
};

const getAndroidPermissionStatus = (permissionName) => {
    // #ifdef APP-PLUS
    if (typeof plus !== 'undefined' && plus.os?.name?.toLowerCase() === 'android') {
        const mainActivity = plus.android.runtimeMainActivity();
        const status = mainActivity.checkSelfPermission(`${APP_PLUS_PERMISSION_PREFIX}${permissionName}`);
        return status === 0;
    }
    // #endif

    return false;
};

const readAndroidPermissionStatus = () => {
    // #ifdef APP-PLUS
    if (typeof plus !== 'undefined' && plus.os?.name?.toLowerCase() === 'android') {
        const nextStatus = {};
        ALBUM_PERMISSION_NAMES.forEach((permissionName) => {
            nextStatus[permissionName] = getAndroidPermissionStatus(permissionName);
        });
        androidPermissionStatus.value = nextStatus;
        return;
    }
    // #endif

    androidPermissionStatus.value = {};
};

const handleItemClick = async (item) => {
    uni.openAppAuthorizeSetting({
        fail: () => {
            uni.openSetting();
        },
    });
};

const goBack = () => {
    uni.navigateBack({
        fail: () => uni.reLaunch({ url: '/pages/settings/settings' }),
    });
};

onShow(() => {
    readAuthorizeSetting();
    readAndroidPermissionStatus();
});
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: #f5f6f8;
}

.status-holder {
    width: 100%;
    background: #ffffff;
}

.header {
    height: 56px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #ffffff;
    box-shadow: 0 1px 0 rgba(17, 24, 39, 0.06);
}

.back-btn,
.header-placeholder {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-title {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
}

.content {
    width: 100%;
}

.auth-list {
    margin-top: 10px;
    background: #ffffff;
}

.auth-row {
    padding: 18px 16px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid rgba(17, 24, 39, 0.06);
}

.auth-row--last {
    border-bottom: none;
}

.auth-row__main {
    flex: 1;
    min-width: 0;
}

.auth-row__title {
    display: block;
    font-size: 18px;
    line-height: 1.35;
    font-weight: 600;
    color: #1f2937;
}

.auth-row__desc {
    display: block;
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.55;
    color: #9ca3af;
}

.auth-row__side {
    flex-shrink: 0;
    min-width: 74px;
    padding-top: 2px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
}

.auth-row__status {
    font-size: 14px;
    line-height: 1;
    color: #9ca3af;
}

.auth-row__status.is-enabled {
    color: #9ca3af;
}

.auth-row__status.is-pending {
    color: #f59e0b;
}

.auth-row__status.is-limited {
    color: #2563eb;
}

.auth-row__status.is-action {
    color: #6b7280;
}
</style>
