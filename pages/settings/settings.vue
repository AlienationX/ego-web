<template>
    <view class="layout">
        <view class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>
        <view class="header">
            <view class="back-btn" @click="goBack">
                <mdi-icon path="/static/icons/arrow-left.svg" size="18px" color="#374151"></mdi-icon>
            </view>
            <text class="header-title">{{ t('settings.title') }}</text>
            <view class="header-placeholder"></view>
        </view>

        <scroll-view scroll-y class="content" :style="{ height: contentHeight }">
            <view class="section" v-if="userStore.isLoggedIn">
                <view class="section-title">{{ t('settings.sections.profile') }}</view>
                <view class="card">
                    <view class="profile-card">
                        <view class="avatar-wrap">
                            <image class="avatar" :src="profileAvatar" mode="aspectFill"></image>
                            <view class="avatar-dot"></view>
                        </view>
                        <view class="profile-meta">
                            <text class="profile-name">{{ profileName }}</text>
                            <text class="profile-line">{{ profileEmail }}</text>
                            <text class="profile-line">{{ profilePhone }}</text>
                        </view>
                    </view>

                    <view
                        v-for="(item, index) in profileItems"
                        :key="item.key"
                        class="row"
                        :class="{ 'row-last': index === profileItems.length - 1 }"
                        @click="handleClick(item)"
                    >
                        <view class="row-left">
                            <view class="icon-box">
                                <mdi-icon :path="item.icon" size="28px" color="#6B7280"></mdi-icon>
                            </view>
                            <view class="label-block">
                                <text class="label">{{ item.label }}</text>
                                <text class="sublabel">{{ item.sublabel }}</text>
                            </view>
                        </view>
                        <view class="row-right">
                            <mdi-icon path="/static/icons/chevron-right.svg" size="17px" color="#C4C9D4"></mdi-icon>
                        </view>
                    </view>
                </view>
            </view>

            <view v-for="section in sections" :key="section.key" class="section">
                <view class="section-title">{{ section.title }}</view>
                <view class="card">
                    <view
                        v-for="(item, index) in section.items"
                        :key="item.key"
                        class="row"
                        :class="{ 'row-last': index === section.items.length - 1, destructive: item.destructive }"
                        @click="handleClick(item)"
                    >
                        <view class="row-left">
                            <view class="icon-box" :class="{ destructive: item.destructive }">
                                <mdi-icon
                                    :path="item.icon"
                                    size="28px"
                                    :color="item.destructive ? '#E5322D' : '#6B7280'"
                                ></mdi-icon>
                            </view>
                            <view class="label-block">
                                <text class="label">{{ item.label }}</text>
                                <text class="sublabel">{{ item.sublabel }}</text>
                            </view>
                        </view>
                        <view class="row-right">
                            <template v-if="item.type === 'toggle'">
                                <view
                                    class="switch"
                                    :class="{ on: !!toggles[item.toggleKey] }"
                                    @click.stop="toggleSwitch(item.toggleKey)"
                                >
                                    <view class="switch-dot"></view>
                                </view>
                            </template>
                            <template v-else>
                                <text v-if="item.value" class="value">{{ item.value }}</text>
                                <mdi-icon path="/static/icons/chevron-right.svg" size="17px" color="#C4C9D4"></mdi-icon>
                            </template>
                        </view>
                    </view>
                </view>
            </view>

            <view class="about-legal">
                <view class="about-legal__links">
                    <text class="about-legal__link" @click="openHtmlFile('/privacy_agreement.html')">
                        {{ t('about.privacy') }}
                    </text>
                    <text class="about-legal__divider">|</text>
                    <text class="about-legal__link" @click="openHtmlFile('/user_agreement.html')">
                        {{ t('about.agreement') }}
                    </text>
                </view>
                <view class="about-record">{{ rightICP }}</view>
                <view class="about-copyright">{{ copyrightText }}</view>
                <view style="height: 50rpx"></view>
            </view>

            <!-- <text class="app-version"
                >{{ t('settings.version') }} {{ APP_INFO.appVersion }} · {{ t('settings.build') }}
                {{ APP_INFO.appVersionCode }}</text
            > -->
        </scroll-view>

        <uni-popup ref="previewTypePopup" type="bottom" :safe-area="true">
            <view class="preview-popup">
                <view class="popup-head">
                    <text class="popup-title">{{ t('settings.preview.title') }}</text>
                    <view class="popup-close" @click="closePreviewTypePopup">
                        <mdi-icon path="/static/icons/close.svg" size="20px" color="#6f7786"></mdi-icon>
                    </view>
                </view>
                <view class="preview-list">
                    <view
                        class="preview-item"
                        :class="{ active: settingsStore.options.previewType === 'classic' }"
                        @click="setPreviewType('classic')"
                    >
                        <view class="phone-mock">
                            <view class="mock-time"></view>
                            <view class="mock-clock">08:00</view>
                            <view class="mock-bar classic"></view>
                        </view>
                        <text class="preview-name">{{ t('settings.preview.classic') }}</text>
                    </view>
                    <view
                        class="preview-item"
                        :class="{ active: settingsStore.options.previewType === 'floating' }"
                        @click="setPreviewType('floating')"
                    >
                        <view class="phone-mock">
                            <view class="mock-time"></view>
                            <view class="mock-clock">08:00</view>
                            <view class="mock-bar floating"></view>
                        </view>
                        <text class="preview-name">{{ t('settings.preview.floating') }}</text>
                    </view>
                </view>
            </view>
        </uni-popup>

        <uni-popup ref="aboutPopup" type="center" :safe-area="true">
            <view class="about-popup">
                <view class="about-head">
                    <text class="about-title">{{ t('about.title') }}</text>
                    <view class="about-close" @click="closeAboutPopup">
                        <mdi-icon path="/static/icons/close.svg" size="20px" color="#6f7786"></mdi-icon>
                    </view>
                </view>

                <scroll-view scroll-y class="about-body">
                    <view class="about-app">
                        <image src="/static/logo.svg" mode="aspectFit" class="about-logo"></image>
                        <text class="about-name">{{ t('common.appName') }}</text>
                        <text class="about-slogan">{{ t('about.slogan') }}</text>
                        <view class="about-version">
                            <view class="about-version-item">
                                <text class="about-version-label">{{ t('about.version') }}</text>
                                <text class="about-version-value">{{ APP_INFO.appVersion || '2.4.1' }}</text>
                            </view>
                            <view class="about-version-item">
                                <text class="about-version-label">{{ t('about.build') }}</text>
                                <text class="about-version-value">{{ APP_INFO.appVersionCode || '1082' }}</text>
                            </view>
                        </view>
                    </view>

                    <view class="about-group">
                        <text class="about-group-title">{{ t('about.contact') }}</text>
                        <view class="about-list">
                            <view class="about-row" @click="contactSupport">
                                <view class="about-row-left">
                                    <mdi-icon path="/static/icons/forum.svg" size="20px" color="#28B389"></mdi-icon>
                                    <text class="about-row-text">{{ t('about.feedback') }}</text>
                                </view>
                                <mdi-icon path="/static/icons/chevron-right.svg" size="16px" color="#c4c9d4"></mdi-icon>
                            </view>
                            <view class="about-row" @click="copyEmail">
                                <view class="about-row-left">
                                    <mdi-icon path="/static/icons/email.svg" size="20px" color="#28B389"></mdi-icon>
                                    <text class="about-row-text">{{ t('about.email') }}</text>
                                </view>
                                <text class="about-row-value">735003439@qq.com</text>
                            </view>
                        </view>
                    </view>

                    <view class="about-legal">
                        <view style="height: 18rpx"></view>
                        <view class="about-legal__links">
                            <text class="about-legal__link" @click="openHtmlFile('/privacy_agreement.html')">
                                {{ t('about.privacy') }}
                            </text>
                            <text class="about-legal__divider">|</text>
                            <text class="about-legal__link" @click="openHtmlFile('/user_agreement.html')">
                                {{ t('about.agreement') }}
                            </text>
                        </view>
                        <view class="about-record">{{ rightICP }}</view>
                        <view class="about-copyright">{{ copyrightText }}</view>
                    </view>
                </scroll-view>
            </view>
        </uni-popup>

        <uni-popup ref="ratePopup" type="center" :mask-click="true" :safe-area="true">
            <view class="rate-popup">
                <view class="rate-popup__close" @click="closeRatePopup">
                    <mdi-icon path="/static/icons/close.svg" size="18px" color="#2f3949"></mdi-icon>
                </view>

                <text class="rate-popup__title">{{ t('settings.ratePopup.title') }}</text>

                <view class="rate-popup__stars">
                    <uni-icons
                        class="rate-star-icon rate-star-icon--xs"
                        type="star-filled"
                        size="28"
                        color="#ffbf0b"
                    ></uni-icons>
                    <uni-icons
                        class="rate-star-icon rate-star-icon--sm"
                        type="star-filled"
                        size="54"
                        color="#ffbf0b"
                    ></uni-icons>
                    <uni-icons
                        class="rate-star-icon rate-star-icon--lg"
                        type="star-filled"
                        size="92"
                        color="#ffbf0b"
                    ></uni-icons>
                    <uni-icons
                        class="rate-star-icon rate-star-icon--sm"
                        type="star-filled"
                        size="54"
                        color="#ffbf0b"
                    ></uni-icons>
                    <uni-icons
                        class="rate-star-icon rate-star-icon--xs"
                        type="star-filled"
                        size="28"
                        color="#ffbf0b"
                    ></uni-icons>
                </view>

                <text class="rate-popup__desc">{{ t('settings.ratePopup.desc') }}</text>

                <button class="rate-popup__button" @click="confirmRateNow">
                    {{ t('settings.ratePopup.confirm') }}
                </button>
            </view>
        </uni-popup>
    </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserStore } from '@/stores/user.js';
import { getStatusBarHeight } from '@/utils/system.js';
import { RIGHT_ICP } from '@/common/config.js';

const { t, locale } = useI18n();
const settingsStore = useSettingsStore();
const userStore = useUserStore();
const previewTypePopup = ref(null);
const aboutPopup = ref(null);
const ratePopup = ref(null);
const statusBarHeight = ref(getStatusBarHeight() || 0);
const contentHeight = computed(() => `calc(100vh - ${statusBarHeight.value}px - 56px)`);
const APP_INFO = uni.getAppBaseInfo();
const rightICP = RIGHT_ICP;
const copyrightText = computed(() => t('about.copyright', { year: new Date().getFullYear() }));

const toggles = reactive({
    twoFA: true,
    assignmentAlerts: true,
    ticketUpdates: true,
    reminders: false,
    availability: true,
    locationServices: false,
    autoSave: true,
    syncWifiOnly: true,
    theme: uni.getSystemInfoSync().theme === 'dark',
});

const profileName = computed(
    () => userStore.userinfo?.profile?.nickname || userStore.userinfo?.username || t('settings.defaultName'),
);
const profileEmail = computed(() => userStore.userinfo?.email || 'sarah.example@company.com');
const profilePhone = computed(() => userStore.userinfo?.profile?.phone || '+1 (555) 248-0391');
const profileAvatar = computed(() => userStore.userinfo?.profile?.avatar);

const profileItems = computed(() => [
    {
        key: 'edit_profile',
        icon: '/static/icons/account.svg',
        label: t('settings.items.editProfile.label'),
        sublabel: t('settings.items.editProfile.sublabel'),
        action: () => uni.navigateTo({ url: '/pages/user/edit-profile1' }),
    },
]);

const sections = computed(() => {
    const allSections = [
        {
            key: 'security',
            title: t('settings.sections.security'),
            items: [
                {
                    key: 'change_password',
                    icon: '/static/icons/lock.svg',
                    label: t('settings.items.changePassword.label'),
                    sublabel: t('settings.items.changePassword.sublabel'),
                    action: () => uni.navigateTo({ url: '/pages/auth/change-password' }),
                },
                {
                    key: 'reset_password',
                    icon: '/static/icons/autorenew.svg',
                    label: t('settings.items.resetPassword.label'),
                    sublabel: t('settings.items.resetPassword.sublabel'),
                    action: () => uni.navigateTo({ url: '/pages/auth/forget-password' }),
                },
                // {
                //     key: 'twofa',
                //     icon: 'locked-filled',
                //     label: t('settings.items.twoFA.label'),
                //     sublabel: toggles.twoFA ? t('settings.items.twoFA.enabled') : t('settings.items.twoFA.disabled'),
                //     type: 'toggle',
                //     toggleKey: 'twoFA',
                // },
            ],
        },
        // {
        //     key: 'notifications',
        //     title: t('settings.sections.notifications'),
        //     items: [
        //         {
        //             key: 'assignment_alerts',
        //             icon: 'paperplane-filled',
        //             label: t('settings.items.assignmentAlerts.label'),
        //             sublabel: t('settings.items.assignmentAlerts.sublabel'),
        //             type: 'toggle',
        //             toggleKey: 'assignmentAlerts',
        //         },
        //         {
        //             key: 'ticket_updates',
        //             icon: 'bell-filled',
        //             label: t('settings.items.ticketUpdates.label'),
        //             sublabel: t('settings.items.ticketUpdates.sublabel'),
        //             type: 'toggle',
        //             toggleKey: 'ticketUpdates',
        //         },
        //         {
        //             key: 'reminders',
        //             icon: 'bell-filled',
        //             label: t('settings.items.reminders.label'),
        //             sublabel: t('settings.items.reminders.sublabel'),
        //             type: 'toggle',
        //             toggleKey: 'reminders',
        //         },
        //     ],
        // },
        {
            key: 'preferences',
            title: t('settings.sections.preferences'),
            items: [
                {
                    key: 'language',
                    icon: '/static/icons/translate.svg',
                    label: t('settings.items.language.label'),
                    sublabel: t('settings.items.language.sublabel'),
                    value: locale.value === 'en' ? t('settings.items.language.valueEn') : t('settings.items.language.valueZh'),
                    action: switchLanguage,
                },
                // #ifdef APP
                {
                    key: 'theme',
                    icon: '/static/icons/theme-light-dark.svg',
                    label: t('settings.items.theme.label'),
                    sublabel: t('settings.items.theme.sublabel'),
                    type: 'toggle',
                    toggleKey: 'theme',
                },
                // #endif
                {
                    key: 'preview_type',
                    icon: '/static/icons/view-carousel.svg',
                    label: t('settings.items.previewType.label'),
                    sublabel: t('settings.items.previewType.sublabel'),
                    value:
                        settingsStore.options.previewType === 'floating'
                            ? t('settings.preview.floating')
                            : t('settings.preview.classic'),
                    action: openPreviewTypePopup,
                },
                // {
                //     key: 'availability_status',
                //     icon: 'calendar',
                //     label: t('settings.items.availability.label'),
                //     sublabel: toggles.availability
                //         ? t('settings.items.availability.available')
                //         : t('settings.items.availability.unavailable'),
                //     type: 'toggle',
                //     toggleKey: 'availability',
                // },
                // {
                //     key: 'location_services',
                //     icon: 'location-filled',
                //     label: t('settings.items.location.label'),
                //     sublabel: t('settings.items.location.sublabel'),
                //     type: 'toggle',
                //     toggleKey: 'locationServices',
                // },
            ],
        },
        {
            key: 'data',
            title: t('settings.sections.data'),
            items: [
                // {
                //     key: 'auto_save',
                //     icon: 'gear-filled',
                //     label: t('settings.items.autoSave.label'),
                //     sublabel: t('settings.items.autoSave.sublabel'),
                //     type: 'toggle',
                //     toggleKey: 'autoSave',
                // },
                // {
                //     key: 'sync_wifi',
                //     icon: 'loop',
                //     label: t('settings.items.syncWifi.label'),
                //     sublabel: t('settings.items.syncWifi.sublabel'),
                //     type: 'toggle',
                //     toggleKey: 'syncWifiOnly',
                // },
                {
                    key: 'clear_cache',
                    icon: '/static/icons/delete-empty.svg',
                    label: t('settings.items.clearCache.label'),
                    sublabel: t('settings.items.clearCache.sublabel'),
                    action: clearCache,
                },
            ],
        },
        {
            key: 'support',
            title: t('settings.sections.support'),
            items: [
                {
                    key: 'help_centre',
                    icon: '/static/icons/help-circle.svg',
                    label: t('settings.items.helpCentre.label'),
                    sublabel: t('settings.items.helpCentre.sublabel'),
                    action: () => uni.navigateTo({ url: '/pages/settings/help-centre' }),
                },
                // {
                //     key: 'contact_support',
                //     icon: 'chatboxes-filled',
                //     label: t('settings.items.contactSupport.label'),
                //     sublabel: t('settings.items.contactSupport.sublabel'),
                //     action: () => uni.navigateTo({ url: '/pages/settings/feedback' }),
                // },
                {
                    key: 'send_feedback',
                    icon: '/static/icons/comment-processing.svg',
                    label: t('settings.items.sendFeedback.label'),
                    sublabel: t('settings.items.sendFeedback.sublabel'),
                    action: () => uni.navigateTo({ url: '/pages/settings/feedback' }),
                },
                {
                    key: 'about_page',
                    icon: '/static/icons/information.svg',
                    label: t('settings.items.about.label'),
                    sublabel: t('settings.items.about.sublabel'),
                    action: openAboutPopup,
                },
                {
                    key: 'privacy_permissions',
                    icon: '/static/icons/shield-check.svg',
                    label: t('settings.items.privacyPermissions.label'),
                    sublabel: t('settings.items.privacyPermissions.sublabel'),
                    action: () => uni.navigateTo({ url: '/pages/settings/revoke-auth' }),
                },
                {
                    key: 'privacy',
                    icon: '/static/icons/lock.svg',
                    label: t('settings.items.privacy.label'),
                    sublabel: t('settings.items.privacy.sublabel'),
                    action: () => openHtmlFile('/privacy_agreement.html'),
                },
                {
                    key: 'agreement',
                    icon: '/static/icons/wallet-bifold.svg',
                    label: t('settings.items.agreement.label'),
                    sublabel: t('settings.items.agreement.sublabel'),
                    action: () => openHtmlFile('/user_agreement.html'),
                },
            ],
        },
        {
            key: 'app_information',
            title: t('settings.sections.appInformation'),
            items: [
                {
                    key: 'introduction',
                    icon: '/static/icons/information.svg',
                    label: t('settings.items.introduction.label'),
                    sublabel: t('settings.items.introduction.sublabel'),
                    action: showIntroduction,
                },
                {
                    key: 'check_update',
                    icon: '/static/icons/cached.svg',
                    label: t('settings.items.checkUpdate.label'),
                    sublabel: t('settings.items.checkUpdate.sublabel'),
                    action: checkUpdate,
                },
            ],
        },
        {
            key: 'others',
            title: t('settings.sections.others'),
            items: [
                {
                    key: 'rate_us',
                    icon: '/static/icons/star.svg',
                    label: t('settings.items.rateUs.label'),
                    sublabel: t('settings.items.rateUs.sublabel'),
                    action: openRatePopup,
                },
                {
                    key: 'share_app',
                    icon: '/static/icons/share.svg',
                    label: t('settings.items.share.label'),
                    sublabel: t('settings.items.share.sublabel'),
                    action: shareApp,
                },
            ],
        },
        {
            key: 'account',
            title: t('settings.sections.account'),
            items: [
                {
                    key: 'logout',
                    icon: '/static/icons/exit-to-app.svg',
                    label: t('settings.items.logout.label'),
                    sublabel: t('settings.items.logout.sublabel'),
                    destructive: true,
                    action: () => uni.navigateTo({ url: '/pages/auth/logout' }),
                },
                {
                    key: 'deactivate',
                    icon: '/static/icons/account-remove.svg',
                    label: t('settings.items.deactivate.label'),
                    sublabel: t('settings.items.deactivate.sublabel'),
                    destructive: true,
                    action: () => uni.navigateTo({ url: '/pages/auth/deactivate' }),
                },
            ],
        },
    ];

    return allSections.filter((section) => !['security', 'account'].includes(section.key) || userStore.isLoggedIn);
});

function toggleSwitch(key) {
    if (!key) return;
    toggles[key] = !toggles[key];

    // 具体逻辑实现
    if (key === 'theme') {
        switchTheme();
    }
}

function handleClick(item) {
    if (item.type === 'toggle') return;
    if (typeof item.action === 'function') item.action();
}

function goBack() {
    uni.reLaunch({ url: '/pages/user/user' });
}

function switchLanguage() {
    const changeLanguage = uni.getLocale() === 'en' ? 'zh-Hans' : 'en';
    uni.setLocale(changeLanguage);
    locale.value = changeLanguage;
    // 保存语言选择
    uni.setStorageSync('lang', changeLanguage);
}

function switchTheme() {
    const changeTheme = uni.getSystemInfoSync().theme === 'light' ? 'dark' : 'light';
    settingsStore.options.theme = changeTheme;
    toggles.theme = changeTheme === 'dark';

    // #ifdef APP
    // APP端触发主题切换，WEB跟随浏览器的默认设置，小程序跟随小程序的默认设置
    plus.nativeUI.setUIStyle(changeTheme);
    // #endif

    uni.showToast({
        title: t('settings.toast.themeChanged'),
        icon: 'none',
    });
    // 保存主题选择
    uni.setStorageSync('theme', changeTheme);
}

function openPreviewTypePopup() {
    previewTypePopup.value?.open();
}

function closePreviewTypePopup() {
    previewTypePopup.value?.close();
}

function openAboutPopup() {
    aboutPopup.value?.open();
}

function closeAboutPopup() {
    aboutPopup.value?.close();
}

function openRatePopup() {
    ratePopup.value?.open();
}

function closeRatePopup() {
    ratePopup.value?.close();
}

function setPreviewType(type) {
    settingsStore.options.previewType = type;
    closePreviewTypePopup();
}

async function clearCache() {
    uni.showLoading({
        title: t('settings.toast.clearing'),
        mask: true,
    });
    try {
        uni.clearStorageSync();
        uni.hideLoading();
        uni.showToast({
            title: t('settings.toast.clearSuccess'),
            icon: 'none',
        });
    } catch (error) {
        uni.hideLoading();
        uni.showToast({
            title: t('user.settings.clearFailed'),
            icon: 'none',
        });
    }
}

function openHtmlFile(url) {
    uni.navigateTo({
        url: `/pages/webview/webview?url=${encodeURIComponent(url)}`,
    });
}

function showIntroduction() {
    uni.showModal({
        title: t('about.introduction'),
        content: t('about.introText'),
        showCancel: false,
    });
}

function checkUpdate() {
    uni.showLoading({ title: t('about.checking') });
    setTimeout(() => {
        uni.hideLoading();
        uni.showModal({
            title: t('common.tip'),
            content: t('about.alreadyLatest'),
            showCancel: false,
        });
    }, 1000);
}

function contactSupport() {
    uni.navigateTo({ url: '/pages/settings/feedback' });
}

function copyEmail() {
    uni.setClipboardData({
        data: '735003439@qq.com',
        success: () => {
            uni.showToast({
                title: t('about.copied'),
                icon: 'success',
            });
        },
    });
}

function openAppStore() {
    try {
        // #ifdef APP
        const channel = plus.runtime.channel;
        if (channel === 'google') {
            plus.runtime.openURL('market://details?id=com.wallpaper.app.ego');
        } else {
            plus.runtime.openURL('itms-apps://itunes.apple.com/app/idYOUR_APP_ID');
        }
        // #endif

        // #ifdef H5
        uni.showToast({
            title: t('settings.ratePopup.webHint'),
            icon: 'none',
        });
        // #endif
    } catch (error) {
        uni.showToast({
            title: t('about.rateFailed'),
            icon: 'none',
        });
    }
}

function confirmRateNow() {
    closeRatePopup();
    openAppStore();
}

function shareApp() {
    uni.share({
        provider: 'weixin',
        scene: 'WXSceneSession',
        type: 0,
        summary: t('about.shareText'),
        success: () => {
            uni.showToast({
                title: t('about.shareSuccess'),
                icon: 'success',
            });
        },
        fail: () => {
            uni.showToast({
                title: t('about.shareFailed'),
                icon: 'none',
            });
        },
    });
}
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: #f5f6f8;
}
.status-holder {
    width: 100%;
}
.header {
    height: 112rpx;
    background: #f5f6f8;
    display: flex;
    align-items: center;
    padding: 0 32rpx;
    gap: 16rpx;
}
.back-btn {
    width: 72rpx;
    height: 72rpx;
    border-radius: 16rpx;
    background: #fff;
    border: 2rpx solid #f0f1f3;
    display: flex;
    align-items: center;
    justify-content: center;
}
.header-title {
    flex: 1;
    text-align: center;
    font-size: 40rpx;
    font-weight: 700;
    color: #111827;
}
.header-placeholder {
    width: 72rpx;
    height: 72rpx;
}
.content {
    box-sizing: border-box;
    // padding-top: 16px;
    // padding-bottom: 40px;
}
.section {
    margin-bottom: 48rpx;
}
.section-title {
    padding: 0 36rpx;
    margin-bottom: 20rpx;
    font-size: 22rpx;
    font-weight: 600;
    letter-spacing: 0.07em;
    color: #9ca3af;
    line-height: 32rpx;
    display: block;
}
.card {
    margin: 0 32rpx;
    background: #fff;
    border: 2rpx solid #f0f1f3;
    border-radius: 24rpx;
    overflow: hidden;
}
.profile-card {
    padding: 32rpx;
    display: flex;
    align-items: center;
    gap: 24rpx;
    border-bottom: 2rpx solid #f3f4f6;
}
.avatar-wrap {
    position: relative;
}
.avatar {
    width: 112rpx;
    height: 112rpx;
    border-radius: 50%;
}
.avatar-dot {
    position: absolute;
    bottom: 2rpx;
    right: 2rpx;
    width: 24rpx;
    height: 24rpx;
    border-radius: 12rpx;
    background: #22c55e;
    border: 4rpx solid #fff;
}
.profile-meta {
    flex: 1;
    min-width: 0;
}
.profile-name {
    display: block;
    font-size: 32rpx;
    font-weight: 600;
    color: #111827;
    line-height: 40rpx;
}
.profile-line {
    display: block;
    font-size: 24rpx;
    line-height: 32rpx;
    color: #6b7280;
}
.row {
    min-height: 108rpx;
    padding: 24rpx 32rpx;
    border-bottom: 2rpx solid #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.row-last {
    border-bottom: none;
}
.row-left {
    display: flex;
    align-items: center;
    gap: 24rpx;
    flex: 1;
    min-width: 0;
}
.icon-box {
    width: 72rpx;
    height: 72rpx;
    border-radius: 18rpx;
    background: #f9fafb;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.icon-box.destructive {
    background: #fef2f2;
}
.label-block {
    flex: 1;
    min-width: 0;
}
.label {
    display: block;
    font-size: 30rpx;
    line-height: 40rpx;
    color: #111827;
    font-weight: 500;
}
.sublabel {
    display: block;
    font-size: 24rpx;
    line-height: 32rpx;
    color: #9ca3af;
    margin-top: 2rpx;
}
.destructive .label {
    color: #e5322d;
}
.row-right {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-left: 16rpx;
}
.value {
    font-size: 24rpx;
    color: #9ca3af;
    white-space: nowrap;
}
.switch {
    width: 88rpx;
    height: 52rpx;
    border-radius: 26rpx;
    background: #d1d5db;
    position: relative;
    transition: background-color 0.2s ease;
}
.switch.on {
    background: #e5322d;
}
.switch-dot {
    position: absolute;
    top: 6rpx;
    left: 6rpx;
    width: 40rpx;
    height: 40rpx;
    border-radius: 20rpx;
    background: #fff;
    transition: left 0.2s ease;
}
.switch.on .switch-dot {
    left: 42rpx;
}
.app-version {
    display: block;
    text-align: center;
    font-size: 24rpx;
    color: #c4c9d4;
    padding-bottom: 72rpx;
}
.preview-popup {
    background: #fff;
    border-radius: 24rpx 24rpx 0 0;
    padding: 20rpx 20rpx calc(26rpx + env(safe-area-inset-bottom));
}
.popup-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12rpx;
}
.popup-title {
    font-size: 30rpx;
    font-weight: 700;
    color: #111827;
}
.popup-close {
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    background: #f3f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
}
.preview-list {
    display: flex;
    gap: 14rpx;
}
.preview-item {
    flex: 1;
    border: 2rpx solid #e4e9f2;
    border-radius: 14rpx;
    background: #fafcff;
    padding: 14rpx 10rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.preview-item.active {
    border-color: #e5322d;
    background: #fff6f6;
}
.phone-mock {
    position: relative;
    width: 120rpx;
    height: 188rpx;
    border: 6rpx solid #d5dae5;
    border-radius: 22rpx;
    background: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 16rpx;
}
.mock-time {
    width: 46rpx;
    height: 10rpx;
    border-radius: 10rpx;
    background: #e6eaf2;
    margin-bottom: 10rpx;
}
.mock-clock {
    font-size: 16rpx;
    color: #afb6c4;
}
.mock-bar {
    position: absolute;
    background: #e5322d;
    border-radius: 8rpx;
}
.mock-bar.classic {
    width: 82rpx;
    height: 18rpx;
    left: 50%;
    transform: translateX(-50%);
    bottom: 44rpx;
}
.mock-bar.floating {
    width: 20rpx;
    height: 64rpx;
    right: 12rpx;
    bottom: 22rpx;
}
.preview-name {
    margin-top: 10rpx;
    font-size: 22rpx;
    color: #4f596d;
}

.rate-popup {
    width: 76vw;
    max-width: 560rpx;
    background: #ffffff;
    border-radius: 56rpx;
    padding: 44rpx 36rpx 44rpx;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 48rpx 144rpx rgba(15, 23, 42, 0.18);
}

.rate-popup__close {
    position: absolute;
    top: 32rpx;
    right: 32rpx;
    width: 52rpx;
    height: 52rpx;
    border-radius: 60rpx;
    border: 3rpx solid #31394a;
    display: flex;
    align-items: center;
    justify-content: center;
}

.rate-popup__title {
    font-size: 40rpx;
    line-height: 1.2;
    font-weight: 800;
    color: #1f2740;
    text-align: center;
}

.rate-popup__stars {
    margin-top: 36rpx;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 20rpx;
}

.rate-star-icon {
    text-shadow: 0 12rpx 0 rgba(191, 100, 0, 0.42);
}

.rate-star-icon--lg {
    margin-bottom: 0;
}

.rate-star-icon--sm {
    margin-bottom: 12rpx;
}

.rate-star-icon--xs {
    margin-bottom: 32rpx;
}

.rate-popup__desc {
    margin-top: 36rpx;
    font-size: 36rpx;
    line-height: 1.35;
    color: #2b3147;
    text-align: center;
    white-space: pre-line;
}

.rate-popup__button {
    margin-top: 44rpx;
    min-width: 352rpx;
    height: 104rpx;
    border-radius: 999rpx;
    background: #1f2640;
    color: #ffffff;
    font-size: 32rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 32rpx 64rpx rgba(31, 38, 64, 0.18);
}

.rate-popup__button::after {
    border: none;
}

.about-popup {
    width: 86vw;
    max-height: 86vh;
    background: #ffffff;
    border-radius: 32rpx;
    padding: 32rpx;
    display: flex;
    flex-direction: column;
}

.about-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;
}

.about-title {
    font-size: 36rpx;
    font-weight: 700;
    color: #111827;
}

.about-close {
    width: 64rpx;
    height: 64rpx;
    border-radius: 32rpx;
    background: #f3f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
}

.about-body {
    max-height: 72vh;
}

.about-app {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16rpx 0 24rpx;
}

.about-logo {
    width: 144rpx;
    height: 144rpx;
    border-radius: 32rpx;
    margin-bottom: 16rpx;
}

.about-name {
    font-size: 32rpx;
    font-weight: 600;
    color: #111827;
    margin-bottom: 4rpx;
}

.about-slogan {
    font-size: 24rpx;
    color: #9ca3af;
    margin-bottom: 20rpx;
}

.about-version {
    width: 100%;
    display: flex;
    gap: 16rpx;
}

.about-version-item {
    flex: 1;
    background: #f9fafb;
    border: 2rpx solid #eef1f5;
    border-radius: 20rpx;
    padding: 16rpx 20rpx;
}

.about-version-label {
    display: block;
    font-size: 22rpx;
    color: #9ca3af;
}

.about-version-value {
    display: block;
    font-size: 26rpx;
    color: #111827;
    font-weight: 600;
    margin-top: 4rpx;
}

.about-group {
    margin-top: 32rpx;
}

.about-group-title {
    display: block;
    font-size: 22rpx;
    font-weight: 600;
    color: #9ca3af;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    margin-bottom: 16rpx;
}

.about-list {
    background: #fff;
    border: 2rpx solid #f0f1f3;
    border-radius: 24rpx;
    overflow: hidden;
}

.about-row {
    min-height: 100rpx;
    padding: 24rpx 28rpx;
    border-bottom: 2rpx solid #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.about-row:last-child {
    border-bottom: none;
}

.about-row-left {
    display: flex;
    align-items: center;
    gap: 20rpx;
    flex: 1;
    min-width: 0;
}

.about-row-text {
    font-size: 28rpx;
    color: #111827;
}

.about-row-value {
    font-size: 24rpx;
    color: #9ca3af;
}

.about-legal {
    text-align: center;
}

.about-legal__links {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24rpx;
}

.about-legal__link {
    font-size: 24rpx;
    line-height: 1.4;
    font-weight: 500;
    color: #3d7fdd;
}

.about-legal__divider {
    font-size: 36rpx;
    line-height: 1.4;
    color: #9ca3af;
}

.about-record {
    margin-top: 16rpx;
    text-align: center;
    font-size: 24rpx;
    line-height: 1.6;
    color: #9ca3af;
}

.about-copyright {
    margin-top: 8rpx;
    text-align: center;
    font-size: 24rpx;
    line-height: 1.6;
    color: #b3b8c2;
    white-space: pre-line;
}
</style>
