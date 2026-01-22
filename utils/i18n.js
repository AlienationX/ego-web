import { useI18n } from 'vue-i18n';

/**
 * 获取当前语言
 * @returns {string} 当前语言代码（如 'en' 或 'zh-CN'）
 */
export const getCurrentLocale = () => {
    return uni.getStorageSync('lang') || uni.getLocale() || 'en';
};

/**
 * 切换语言
 * @param {string} lang 语言代码（如 'en' 或 'zh-CN'）
 * @returns {Promise<void>}
 */
export const changeLocale = async (lang) => {
    try {
        // 更新本地存储
        uni.setStorageSync('lang', lang);
        
        // 更新i18n实例的语言
        const i18n = useI18n();
        i18n.locale.value = lang;
        
        // 触发语言切换事件
        uni.$emit('localeChanged', lang);
    } catch (error) {
        console.error('切换语言失败:', error);
        throw error;
    }
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
        { value: 'en', label: 'English' },
        { value: 'zh-CN', label: '简体中文' }
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
