import { useI18n } from 'vue-i18n';

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
        const sys = uni.getSystemInfoSync().language || uni.getLocale() || 'en';
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
    const locale = getCurrentLocale();
    const now = new Date();
    const targetDate = new Date(date);
    const diff = now - targetDate;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    const i18n = useI18n();
    
    if (days > 0) {
        return i18n.t('common.daysAgo', { count: days });
    } else if (hours > 0) {
        return i18n.t('common.hoursAgo', { count: hours });
    } else if (minutes > 0) {
        return i18n.t('common.minutesAgo', { count: minutes });
    } else {
        return i18n.t('common.justNow');
    }
};

/**
 * 翻译函数（支持组件外使用）
 * @param {string} key 翻译键
 * @param {Object} params 翻译参数
 * @returns {string} 翻译后的文本
 */
export const t = (key, params = {}) => {
    const i18n = useI18n();
    return i18n.t(key, params);
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
