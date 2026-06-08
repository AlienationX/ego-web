<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <view class="header" :style="{ paddingTop: statusBarHeight + 'px', height: titleBarHeight + 'px' }">
            <view class="header-inner" :style="{ height: titleBarHeight + 'px' }">
                <view class="back-btn" @click="goBack">
                    <mdi-icon
                        path="/static/icons/arrow-left.svg"
                        size="18px"
                        :color="settingsStore.isDark ? '#e5e7eb' : '#374151'"
                    ></mdi-icon>
                </view>
                <text class="header-title">{{ t('settings.title') }}</text>
                <view class="header-placeholder"></view>
            </view>
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
                                <mdi-icon
                                    :path="item.icon"
                                    size="28px"
                                    :color="settingsStore.isDark ? '#9ca3af' : '#6B7280'"
                                ></mdi-icon>
                            </view>
                            <view class="label-block">
                                <text class="label">{{ item.label }}</text>
                                <text class="sublabel">{{ item.sublabel }}</text>
                            </view>
                        </view>
                        <view class="row-right">
                            <mdi-icon
                                path="/static/icons/chevron-right.svg"
                                size="17px"
                                :color="settingsStore.isDark ? '#4b5563' : '#C4C9D4'"
                            ></mdi-icon>
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
                                    :color="item.destructive ? '#E5322D' : settingsStore.isDark ? '#9ca3af' : '#6B7280'"
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
                                <mdi-icon
                                    path="/static/icons/chevron-right.svg"
                                    size="17px"
                                    :color="settingsStore.isDark ? '#4b5563' : '#C4C9D4'"
                                ></mdi-icon>
                            </template>
                        </view>
                        <!-- 微信特有的功能 -->
                        <!-- #ifdef MP-WEIXIN -->
                        <button v-if="item.key === 'contact_support_wx'" open-type="contact"></button>
                        <button v-if="item.key === 'send_feedback_wx'" open-type="feedback"></button>
                        <!-- #endif -->
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
            <view class="preview-popup" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
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
            <view class="about-popup" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
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
            <view class="rate-popup" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
                <view class="rate-popup__close" @click="closeRatePopup">
                    <mdi-icon
                        path="/static/icons/close.svg"
                        size="18px"
                        :color="settingsStore.isDark ? '#e5e7eb' : '#2f3949'"
                    ></mdi-icon>
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

        <uni-popup ref="themePopup" type="center" :mask-click="true" :safe-area="true">
            <view class="choice-popup" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
                <view class="choice-popup__head">
                    <text class="choice-popup__title">{{ t('settings.items.theme.label') }}</text>
                    <view class="choice-popup__close" @click="closeThemePopup">
                        <mdi-icon
                            path="/static/icons/close.svg"
                            size="20px"
                            :color="settingsStore.isDark ? '#9ca3af' : '#6f7786'"
                        ></mdi-icon>
                    </view>
                </view>
                <view class="choice-list">
                    <view
                        v-for="item in themeOptions"
                        :key="item.value"
                        class="choice-item"
                        :class="{
                            active: settingsStore.options.theme === item.value,
                            disabled: item.disabled,
                        }"
                        @click="!item.disabled && selectTheme(item.value)"
                    >
                        <view class="choice-item__left">
                            <view class="choice-item__icon">
                                <mdi-icon
                                    :path="item.icon"
                                    size="24px"
                                    :color="
                                        item.disabled
                                            ? settingsStore.isDark
                                                ? '#4b5563'
                                                : '#cbd5e1'
                                            : settingsStore.options.theme === item.value
                                              ? '#28B389'
                                              : settingsStore.isDark
                                                ? '#e5e7eb'
                                                : '#374151'
                                    "
                                ></mdi-icon>
                            </view>
                            <view class="choice-item__text">
                                <text
                                    class="choice-item__label"
                                    :style="{ color: item.disabled ? 'var(--text-tertiary)' : '' }"
                                >
                                    {{ item.label }}
                                </text>
                                <text class="choice-item__desc">
                                    {{ item.desc }}
                                </text>
                            </view>
                        </view>
                        <mdi-icon
                            v-if="settingsStore.options.theme === item.value && !item.disabled"
                            path="/static/icons/check.svg"
                            size="20px"
                            color="#28B389"
                        ></mdi-icon>
                    </view>
                </view>
            </view>
        </uni-popup>

        <uni-popup ref="languagePopup" type="center" :mask-click="true" :safe-area="true">
            <view class="choice-popup" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
                <view class="choice-popup__head">
                    <text class="choice-popup__title">{{ t('settings.items.language.label') }}</text>
                    <view class="choice-popup__close" @click="closeLanguagePopup">
                        <mdi-icon
                            path="/static/icons/close.svg"
                            size="20px"
                            :color="settingsStore.isDark ? '#9ca3af' : '#6f7786'"
                        ></mdi-icon>
                    </view>
                </view>
                <view class="choice-list">
                    <view
                        v-for="item in languageOptions"
                        :key="item.value"
                        class="choice-item"
                        :class="{ active: languagePreference === item.value }"
                        @click="selectLanguage(item.value)"
                    >
                        <view class="choice-item__left">
                            <view class="choice-item__icon">
                                <mdi-icon
                                    :path="item.icon"
                                    size="24px"
                                    :color="
                                        languagePreference === item.value
                                            ? '#28B389'
                                            : settingsStore.isDark
                                              ? '#e5e7eb'
                                              : '#374151'
                                    "
                                ></mdi-icon>
                            </view>
                            <view class="choice-item__text">
                                <text class="choice-item__label">{{ item.label }}</text>
                                <text v-if="item.desc" class="choice-item__desc">{{ item.desc }}</text>
                            </view>
                        </view>
                        <mdi-icon
                            v-if="languagePreference === item.value"
                            path="/static/icons/check.svg"
                            size="20px"
                            color="#28B389"
                        ></mdi-icon>
                    </view>
                </view>
            </view>
        </uni-popup>
        <popup-navigation-dialog
            ref="navDialog"
            :title="dialogState.title"
            :description="dialogState.description"
            :confirmText="dialogState.confirmText"
            :cancelText="dialogState.cancelText"
            :showCancel="dialogState.showCancel"
            @confirm="dialogState.onConfirm"
            @cancel="dialogState.onCancel"
        ></popup-navigation-dialog>
    </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserStore } from '@/stores/user.js';
import { getStatusBarHeight, getTitleBarHeight } from '@/utils/system.js';
import { RIGHT_ICP } from '@/common/config.js';
import {
    LANGUAGE_PREF_AUTO,
    LANGUAGE_PREF_EN,
    LANGUAGE_PREF_ZH,
    applyLanguagePreference,
    getLanguagePreference,
    resolveAppLocale,
} from '@/utils/i18n.js';

const { t, locale } = useI18n();
const settingsStore = useSettingsStore();
const userStore = useUserStore();
const previewTypePopup = ref(null);
const aboutPopup = ref(null);
const ratePopup = ref(null);
const themePopup = ref(null);
const languagePopup = ref(null);
const statusBarHeight = ref(getStatusBarHeight() || 0);
const titleBarHeight = ref(getTitleBarHeight() || 44);
const contentHeight = computed(() => `calc(100vh - ${titleBarHeight.value}px)`);
const APP_INFO = uni.getAppBaseInfo();
const rightICP = RIGHT_ICP;
const copyrightText = computed(() => t('about.copyright', { year: new Date().getFullYear() }));

const navDialog = ref(null);
const dialogState = ref({
    title: '',
    description: '',
    confirmText: '',
    cancelText: '',
    showCancel: true,
    onConfirm: () => {},
    onCancel: () => {},
});

const showNavDialog = (config) => {
    dialogState.value = {
        title: config.title || t('common.tip'),
        description: config.content || '',
        confirmText: config.confirmText || t('common.confirm'),
        cancelText: config.cancelText || t('common.cancel'),
        showCancel: config.showCancel !== false,
        onConfirm: () => {
            if (config.onConfirm) config.onConfirm();
        },
        onCancel: () => {
            if (config.onCancel) config.onCancel();
        },
    };
    navDialog.value?.open();
};

const languagePreference = computed(() => {
    const pref = settingsStore.options.language;
    if (pref === 'zh-CN') return LANGUAGE_PREF_ZH;
    if (pref) return pref;
    return getLanguagePreference();
});

const languageValueLabel = computed(() => {
    const pref = languagePreference.value;
    if (pref === LANGUAGE_PREF_AUTO) return t('settings.items.language.auto');
    if (pref === LANGUAGE_PREF_EN) return t('settings.items.language.valueEn');
    return t('settings.items.language.valueZh');
});

const themeValueLabel = computed(() => {
    const theme = settingsStore.options.theme;
    if (theme === 'auto') return t('settings.items.theme.auto');
    if (theme === 'dark') return t('settings.items.theme.dark');
    return t('settings.items.theme.light');
});

const themeOptions = computed(() => {
    const isApp = uni.getSystemInfoSync().uniPlatform === 'app';

    return [
        {
            value: 'auto',
            icon: '/static/icons/theme-light-dark.svg',
            label: t('settings.items.theme.auto'),
            desc: isApp ? t('settings.items.theme.autoDesc') : '跟随系统（微信/浏览器）。系统主题改变时自动切换深浅色。',
            disabled: false,
        },
        {
            value: 'light',
            icon: '/static/icons/weather-sunny.svg',
            label: t('settings.items.theme.light'),
            desc: isApp ? t('settings.items.theme.lightDesc') : '当前端不支持手动锁定浅色，请在微信或系统设置中更改主题。',
            disabled: !isApp,
        },
        {
            value: 'dark',
            icon: '/static/icons/weather-night.svg',
            label: t('settings.items.theme.dark'),
            desc: isApp ? t('settings.items.theme.darkDesc') : '当前端不支持手动锁定深色，请在微信或系统设置中更改主题。',
            disabled: !isApp,
        },
    ];
});

const languageOptions = computed(() => [
    {
        value: LANGUAGE_PREF_AUTO,
        icon: '/static/icons/translate.svg',
        label: t('settings.items.language.auto'),
        desc: t('settings.items.language.sublabel'),
    },
    {
        value: LANGUAGE_PREF_EN,
        icon: '/static/icons/translate.svg',
        label: t('settings.items.language.valueEn'),
        desc: '',
    },
    {
        value: LANGUAGE_PREF_ZH,
        icon: '/static/icons/translate.svg',
        label: t('settings.items.language.valueZh'),
        desc: '',
    },
]);

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
        action: () => uni.navigateTo({ url: '/pages/user/edit-profile' }),
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
                ...(userStore.isAdmin
                    ? [
                          {
                              key: 'preference_center',
                              icon: '/static/icons/tag.svg',
                              label: t('user.settings.preferences'),
                              sublabel: t('user.settings.managePreferences'),
                              action: () => uni.navigateTo({ url: '/pages/user/preferences' }),
                          },
                      ]
                    : []),
                {
                    key: 'language',
                    icon: '/static/icons/translate.svg',
                    label: t('settings.items.language.label'),
                    sublabel: t('settings.items.language.sublabel'),
                    value: languageValueLabel.value,
                    action: openLanguagePopup,
                },
                {
                    key: 'theme',
                    icon: '/static/icons/theme-light-dark.svg',
                    label: t('settings.items.theme.label'),
                    sublabel: t('settings.items.theme.sublabel'),
                    value: themeValueLabel.value,
                    action: openThemePopup,
                },
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
                {
                    key: 'view_type',
                    icon:
                        settingsStore.options.view === 'window'
                            ? '/static/icons/view-grid.svg'
                            : '/static/icons/view-dashboard.svg',
                    label: t('settings.items.viewType.label'),
                    sublabel: t('settings.items.viewType.sublabel'),
                    value:
                        settingsStore.options.view === 'window'
                            ? t('settings.items.viewType.window')
                            : t('settings.items.viewType.waterfall'),
                    action: switchView,
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
                // #ifdef MP-WEIXIN
                ...(userStore.isAdmin
                    ? [
                          {
                              key: 'contact_support_wx',
                              icon: '/static/icons/forum.svg',
                              label: t('user.profile.support'),
                              sublabel: t('settings.items.contactSupport.sublabel'),
                              action: () => {},
                          },
                          {
                              key: 'send_feedback_wx',
                              icon: '/static/icons/comment-processing.svg',
                              label: t('user.profile.feedback'),
                              sublabel: t('settings.items.sendFeedback.sublabel'),
                              action: () => {},
                          },
                      ]
                    : []),
                // #endif
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
}

function handleClick(item) {
    if (item.type === 'toggle') return;
    if (typeof item.action === 'function') item.action();
}

function goBack() {
    uni.reLaunch({ url: '/pages/user/user' });
}

function syncLanguagePreference() {
    const storePref = settingsStore.options.language === 'zh-CN' ? LANGUAGE_PREF_ZH : settingsStore.options.language;
    const stored = getLanguagePreference();

    if (storePref && storePref !== LANGUAGE_PREF_AUTO) {
        if (stored !== storePref || locale.value !== resolveAppLocale(storePref)) {
            applyLanguagePreference(storePref, locale);
        }
        return;
    }

    if (stored) {
        settingsStore.options.language = stored;
    }
}

function selectLanguage(pref) {
    settingsStore.options.language = pref;
    applyLanguagePreference(pref, locale);
    uni.showToast({
        title: t('settings.toast.languageChanged'),
        icon: 'none',
    });
    closeLanguagePopup();
}

function selectTheme(theme) {
    // #ifdef APP
    uni.setStorageSync('theme', theme);
    const targetStyle = theme === 'auto' ? settingsStore.systemTheme : theme;
    plus.nativeUI.setUIStyle(targetStyle);
    // #endif

    // #ifndef APP
    settingsStore.options.theme = 'auto';
    // #endif

    uni.showToast({
        title: t('settings.toast.themeChanged'),
        icon: 'none',
    });
    closeThemePopup();
}

function switchView() {
    const changeView = settingsStore.options.view === 'window' ? 'waterfall' : 'window';
    settingsStore.options.view = changeView;
}

function openThemePopup() {
    themePopup.value?.open();
}

function closeThemePopup() {
    themePopup.value?.close();
}

function openLanguagePopup() {
    languagePopup.value?.open();
}

function closeLanguagePopup() {
    languagePopup.value?.close();
}

onLoad(() => {
    syncLanguagePreference();
});

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
    showNavDialog({
        title: t('about.introduction'),
        content: t('about.introText'),
        showCancel: false,
    });
}

function checkUpdate() {
    uni.showLoading({ title: t('about.checking') });
    setTimeout(() => {
        uni.hideLoading();
        showNavDialog({
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

        // #ifdef WEB
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
@import '@/static/styles/theme-variables.scss';

.layout {
    min-height: 100vh;
    background: var(--page-background);
    color: var(--text-primary);
}
.header {
    width: 100%;
    background: var(--page-background);
    display: flex;
    align-items: center;
}

.header-inner {
    width: 100%;
    padding: 0 32rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
}

.back-btn {
    width: 64rpx;
    height: 64rpx;
    border-radius: 16rpx;
    // background: var(--page-background-secondary);
    // border: 2rpx solid var(--panel-border);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.header-title {
    flex: 1;
    text-align: center;
    font-size: 32rpx;
    font-weight: 700;
    color: var(--text-primary);
}

.header-placeholder {
    width: 64rpx;
    height: 64rpx;
    flex-shrink: 0;
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
    color: var(--text-tertiary);
    line-height: 32rpx;
    display: block;
}
.card {
    margin: 0 32rpx;
    background: var(--page-background-secondary);
    border: 2rpx solid var(--panel-border);
    border-radius: 24rpx;
    overflow: hidden;
}
.profile-card {
    padding: 32rpx;
    display: flex;
    align-items: center;
    gap: 24rpx;
    border-bottom: 2rpx solid var(--panel-border);
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
    border: 4rpx solid var(--page-background-secondary);
}
.profile-meta {
    flex: 1;
    min-width: 0;
}
.profile-name {
    display: block;
    font-size: 32rpx;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 40rpx;
}
.profile-line {
    display: block;
    font-size: 24rpx;
    line-height: 32rpx;
    color: var(--text-secondary);
}
.row {
    position: relative;
    min-height: 108rpx;
    padding: 16rpx 24rpx;
    border-bottom: 2rpx solid var(--panel-border);
    display: flex;
    align-items: center;
    justify-content: space-between;

    button {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        opacity: 0;
        z-index: 10;
    }
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
    background: var(--panel-background);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.icon-box.destructive {
    background: rgba(229, 50, 45, 0.1);
}
.label-block {
    flex: 1;
    min-width: 0;
}
.label {
    display: block;
    font-size: 30rpx;
    line-height: 40rpx;
    color: var(--text-primary);
    font-weight: 500;
}
.sublabel {
    display: block;
    font-size: 24rpx;
    line-height: 32rpx;
    color: var(--text-tertiary);
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
    color: var(--text-tertiary);
    white-space: nowrap;
}
.switch {
    width: 88rpx;
    height: 52rpx;
    border-radius: 26rpx;
    background: var(--panel-border);
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
    background: var(--page-background-secondary);
    transition: left 0.2s ease;
}
.switch.on .switch-dot {
    left: 42rpx;
}
.app-version {
    display: block;
    text-align: center;
    font-size: 24rpx;
    color: var(--text-tertiary);
    padding-bottom: 72rpx;
}
.preview-popup {
    background: var(--popup-background);
    border-radius: 24rpx 24rpx 0 0;
    padding: 20rpx 20rpx calc(26rpx + env(safe-area-inset-bottom));
    box-shadow: 0 -24rpx 60rpx var(--popup-shadow);
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
    color: var(--text-primary);
}
.popup-close {
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    background: var(--panel-background);
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
    border: 2rpx solid var(--panel-border);
    border-radius: 14rpx;
    background: var(--panel-background);
    padding: 14rpx 10rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.preview-item.active {
    border-color: #e5322d;
    background: rgba(229, 50, 45, 0.06);
}
.phone-mock {
    position: relative;
    width: 120rpx;
    height: 188rpx;
    border: 6rpx solid var(--panel-border);
    border-radius: 22rpx;
    background: var(--page-background-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 16rpx;
}
.mock-time {
    width: 46rpx;
    height: 10rpx;
    border-radius: 10rpx;
    background: var(--panel-border);
    margin-bottom: 10rpx;
}
.mock-clock {
    font-size: 16rpx;
    color: var(--text-tertiary);
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
    color: var(--text-secondary);
}

.rate-popup {
    width: 76vw;
    max-width: 560rpx;
    background: var(--popup-background);
    border: 1rpx solid var(--popup-border);
    border-radius: 56rpx;
    padding: 44rpx 36rpx 44rpx;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 48rpx 144rpx var(--popup-shadow);
}

.rate-popup__close {
    position: absolute;
    top: 32rpx;
    right: 32rpx;
    width: 52rpx;
    height: 52rpx;
    border-radius: 60rpx;
    border: 3rpx solid var(--panel-border);
    display: flex;
    align-items: center;
    justify-content: center;
}

.rate-popup__title {
    font-size: 40rpx;
    line-height: 1.2;
    font-weight: 800;
    color: var(--text-primary);
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
    color: var(--text-secondary);
    text-align: center;
    white-space: pre-line;
}

.rate-popup__button {
    margin-top: 44rpx;
    min-width: 352rpx;
    height: 88rpx;
    border-radius: 999rpx;
    background: var(--text-primary);
    color: var(--page-background);
    font-size: 32rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 32rpx 64rpx var(--shadow-color);
}

.rate-popup__button::after {
    border: none;
}

.choice-popup {
    width: 86vw;
    max-width: 620rpx;
    background: var(--popup-background);
    border: 1rpx solid var(--popup-border);
    border-radius: 32rpx;
    padding: 32rpx 28rpx;
    box-shadow: 0 48rpx 144rpx var(--popup-shadow);
}

.choice-popup__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;
    padding: 0 6rpx;
}

.choice-popup__title {
    font-size: 34rpx;
    font-weight: 700;
    color: var(--text-primary);
}

.choice-popup__close {
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    background: var(--panel-background);
    display: flex;
    align-items: center;
    justify-content: center;
}

.choice-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.choice-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    padding: 22rpx 24rpx;
    border-radius: 24rpx;
    background: var(--panel-background);
    border: 2rpx solid var(--panel-border);
    transition: all 0.2s ease;

    &.active {
        border-color: #28b389;
        background: rgba(40, 179, 137, 0.06);

        .choice-item__label {
            color: #28b389;
        }
    }

    &.disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background: rgba(var(--panel-background-rgb), 0.5);

        .choice-item__desc {
            color: var(--text-tertiary) !important;
        }

        &:active {
            transform: none !important;
        }
    }

    &:not(.disabled):active {
        transform: scale(0.99);
    }
}

.choice-item__left {
    display: flex;
    align-items: center;
    gap: 20rpx;
    flex: 1;
    min-width: 0;
}

.choice-item__icon {
    width: 72rpx;
    height: 72rpx;
    border-radius: 18rpx;
    background: var(--page-background-secondary);
    border: 2rpx solid var(--panel-border);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.choice-item__text {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
}

.choice-item__label {
    font-size: 30rpx;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.4;
}

.choice-item__desc {
    margin-top: 4rpx;
    font-size: 22rpx;
    color: var(--text-tertiary);
    line-height: 1.4;
}

.about-popup {
    width: 86vw;
    max-height: 86vh;
    background: var(--popup-background);
    border: 1rpx solid var(--popup-border);
    border-radius: 32rpx;
    padding: 32rpx;
    display: flex;
    flex-direction: column;
    box-shadow: 0 48rpx 144rpx var(--popup-shadow);
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
    color: var(--text-primary);
}

.about-close {
    width: 64rpx;
    height: 64rpx;
    border-radius: 32rpx;
    background: var(--panel-background);
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
    color: var(--text-primary);
    margin-bottom: 4rpx;
}

.about-slogan {
    font-size: 24rpx;
    color: var(--text-tertiary);
    margin-bottom: 20rpx;
}

.about-version {
    width: 100%;
    display: flex;
    gap: 16rpx;
}

.about-version-item {
    flex: 1;
    background: var(--panel-background);
    border: 2rpx solid var(--panel-border);
    border-radius: 20rpx;
    padding: 16rpx 20rpx;
}

.about-version-label {
    display: block;
    font-size: 22rpx;
    color: var(--text-tertiary);
}

.about-version-value {
    display: block;
    font-size: 26rpx;
    color: var(--text-primary);
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
    color: var(--text-tertiary);
    letter-spacing: 0.07em;
    text-transform: uppercase;
    margin-bottom: 16rpx;
}

.about-list {
    background: var(--page-background-secondary);
    border: 2rpx solid var(--panel-border);
    border-radius: 24rpx;
    overflow: hidden;
}

.about-row {
    min-height: 100rpx;
    padding: 24rpx 28rpx;
    border-bottom: 2rpx solid var(--panel-border);
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
    color: var(--text-primary);
}

.about-row-value {
    font-size: 24rpx;
    color: var(--text-tertiary);
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
    color: var(--text-tertiary);
}

.about-record {
    margin-top: 16rpx;
    text-align: center;
    font-size: 24rpx;
    line-height: 1.6;
    color: var(--text-tertiary);
}

.about-copyright {
    margin-top: 8rpx;
    text-align: center;
    font-size: 24rpx;
    line-height: 1.6;
    color: var(--text-tertiary);
    white-space: pre-line;
}
</style>
