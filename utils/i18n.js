import { useI18n } from 'vue-i18n';
import { i18n } from '@/main.js';

export const LANGUAGE_PREF_AUTO = 'auto';
export const LANGUAGE_PREF_EN = 'en';
export const LANGUAGE_PREF_ZH = 'zh-Hans';

const normalizeLanguagePreference = (pref) => {
    if (!pref || pref === LANGUAGE_PREF_AUTO) return LANGUAGE_PREF_AUTO;
    if (pref === LANGUAGE_PREF_ZH || pref === 'zh-CN' || pref === 'zh') return LANGUAGE_PREF_ZH;
    if (pref === LANGUAGE_PREF_EN || pref === 'en-US') return LANGUAGE_PREF_EN;
    return LANGUAGE_PREF_AUTO;
};

/**
 * 根据语言偏好解析实际使用的 locale
 * @param {string} pref auto | en | zh-Hans
 */
export const resolveAppLocale = (pref) => {
    const normalized = normalizeLanguagePreference(pref);
    if (normalized === LANGUAGE_PREF_AUTO) {
        const sys = uni.getAppBaseInfo().language || uni.getLocale() || 'en';
        return String(sys).toLowerCase().startsWith('zh') ? LANGUAGE_PREF_ZH : LANGUAGE_PREF_EN;
    }
    return normalized;
};

/**
 * 获取当前语言偏好（auto / en / zh-Hans）
 */
export const getLanguagePreference = () => normalizeLanguagePreference(uni.getStorageSync('lang'));

/**
 * 获取当前生效的语言 locale
 */
export const getCurrentLocale = () => resolveAppLocale(getLanguagePreference());

import { useSettingsStore } from '@/stores/settings.js';

/**
 * 更新 tabBar 文字和图标（小程序端原生 tabBar 不支持运行时自动切换，需手动更新）
 * 注意：此函数只能在 TabBar 页面（pages.json tabBar.list 中列出的页面）内调用，
 * 否则小程序端会抛出 "setTabBarItem:fail not TabBar page" 错误。
 * @param {Function} t 国际化翻译函数
 */
export const updateTabBarText = (t) => {
    // #ifdef MP || APP-HARMONY
    if (!t) return;
    const settingsStore = useSettingsStore();
    const isDark = settingsStore.isDark;

    const tabConfigs = [
        {
            key: 'tabbar.index',
            iconPathLight: '/static/tabbar/Light_Home.png',
            iconPathDark: '/static/tabbar/Dark_Home.png',
            selectedIconPath: '/static/tabbar/Fill_Home_Green.png'
        },
        {
            key: 'tabbar.category',
            iconPathLight: '/static/tabbar/Light_Category.png',
            iconPathDark: '/static/tabbar/Dark_Category.png',
            selectedIconPath: '/static/tabbar/Fill_Category_Green.png'
        },
        {
            key: 'tabbar.discover',
            iconPathLight: '/static/tabbar/Light_Discover.png',
            iconPathDark: '/static/tabbar/Dark_Discover.png',
            selectedIconPath: '/static/tabbar/Fill_Discover_Green.png'
        },
        {
            key: 'tabbar.user',
            iconPathLight: '/static/tabbar/Light_User.png',
            iconPathDark: '/static/tabbar/Dark_User.png',
            selectedIconPath: '/static/tabbar/Fill_User_Green.png'
        }
    ];

    tabConfigs.forEach((config, index) => {
        uni.setTabBarItem({
            index,
            text: t(config.key),
            iconPath: isDark ? config.iconPathDark : config.iconPathLight,
            selectedIconPath: config.selectedIconPath
        });
    });
    
    // 同步更新 TabBar 的颜色样式
    uni.setTabBarStyle({
        color: isDark ? '#c9cbd1' : '#9799a5',
        selectedColor: '#28b389',
        backgroundColor: isDark ? '#1c1c1c' : '#f5f5f8',
        borderStyle: isDark ? 'black' : 'white'
    });
    // #endif
};

/**
 * 切换语言偏好
 * @param {string} pref auto | en | zh-Hans
 * @param {import('vue').Ref<string>} [localeRef] vue-i18n 的 locale 引用
 */
export const applyLanguagePreference = (pref, localeRef) => {
    const normalized = normalizeLanguagePreference(pref);
    const effective = resolveAppLocale(normalized);

    uni.setStorageSync('lang', normalized);
    uni.setLocale(effective);

    if (localeRef) {
        localeRef.value = effective;
    }

    // 不在此处调用 updateTabBarText，因为 settings 等非 TabBar 页面调用会报错。
    // 发送事件，由各 TabBar 页面在 onShow 中自行调用 updateTabBarText。
    uni.$emit('localeChanged', { preference: normalized, locale: effective });
};

/**
 * @deprecated 请使用 applyLanguagePreference
 */
export const changeLocale = async (lang) => {
    applyLanguagePreference(lang);
};

/**
 * 格式化数字（支持不同语言的数字格式）
 * @param {number} number 要格式化的数字
 * @param {Object} options 格式化选项
 * @returns {string} 格式化后的数字字符串
 */
export const formatNumber = (number, options = {}) => {
    const locale = getCurrentLocale();
    return new Intl.NumberFormat(locale, options).format(number);
};

/**
 * 格式化日期（支持不同语言的日期格式）
 * @param {Date|string|number} date 要格式化的日期
 * @param {Object} options 格式化选项
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (date, options = {}) => {
    const locale = getCurrentLocale();
    return new Intl.DateTimeFormat(locale, options).format(new Date(date));
};

/**
 * 格式化相对时间（如 '3分钟前'）
 * @param {Date|string|number} date 要比较的日期
 * @param {Object} options 格式化选项
 * @returns {string} 格式化后的相对时间字符串
 */
export const formatRelativeTime = (date, options = {}) => {
    const now = new Date();
    const targetDate = new Date(date);
    const diff = now - targetDate;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const gt = i18n.global.t;

    if (days > 0) {
        return `${days}${gt('rating.daysAgo')}`;
    } else if (hours > 0) {
        return `${hours}${gt('rating.hoursAgo')}`;
    } else if (minutes > 0) {
        return `${minutes}${gt('rating.minutesAgo')}`;
    } else {
        return gt('rating.justNow');
    }
};

/**
 * 翻译函数（支持组件外使用）
 * @param {string} key 翻译键
 * @param {Object} params 翻译参数
 * @returns {string} 翻译后的文本
 */
export const t = (key, params) => i18n.global.t(key, params);

/**
 * 跨平台兼容的参数插值翻译（推荐用于含变量的消息）
 *
 * - Web/H5：vue-i18n 通过 t(key, params) 替换命名参数
 * - App/小程序：t(key, params) 不处理命名参数，由手动 replace 兜底
 *
 * 两端都能正确显示，互不干扰。
 *
 * @returns {{ t, tp }} t 为普通翻译，tp 为带参数翻译
 */
export const useTranslateParams = () => {
    const { t } = useI18n();
    const tp = (key, params = {}) => {
        // 先通过 vue-i18n 命名参数替换（Web/H5 生效）
        let result = t(key, params);
        // 再手动 replace 兜底（App/MP 生效；Web 端 {param} 已被消费，为 no-op）
        if (typeof result === 'string' && params) {
            for (const [k, v] of Object.entries(params)) {
                result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v ?? ''));
            }
        }
        return result;
    };
    return { t, tp };
};

/**
 * 获取支持的语言列表
 * @returns {Array} 支持的语言列表
 */
export const getSupportedLanguages = () => {
    return [
        { value: LANGUAGE_PREF_EN, label: 'English' },
        { value: LANGUAGE_PREF_ZH, label: '简体中文' },
    ];
};

/**
 * 检查语言是否支持
 * @param {string} lang 语言代码
 * @returns {boolean} 是否支持该语言
 */
export const isLanguageSupported = (lang) => {
    const supportedLanguages = getSupportedLanguages();
    return supportedLanguages.some(l => l.value === lang);
};

/**
 * 获取语言的显示名称
 * @param {string} lang 语言代码
 * @returns {string} 语言的显示名称
 */
export const getLanguageDisplayName = (lang) => {
    const supportedLanguages = getSupportedLanguages();
    const language = supportedLanguages.find(l => l.value === lang);
    return language ? language.label : lang;
};
