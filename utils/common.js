import { PICS_BASE_URL } from '@/common/config.js';

export function compareTimestamp(timestamp) {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - timestamp;

    if (timeDiff < 60000) {
        return '1分钟内';
    } else if (timeDiff < 3600000) {
        return Math.floor(timeDiff / 60000) + '分钟';
    } else if (timeDiff < 86400000) {
        return Math.floor(timeDiff / 3600000) + '小时';
    } else if (timeDiff < 2592000000) {
        return Math.floor(timeDiff / 86400000) + '天';
    } else if (timeDiff < 7776000000) {
        return Math.floor(timeDiff / 2592000000) + '月';
    } else {
        return null;
    }
}

export function handlePicUrl(item, prefix = PICS_BASE_URL) {
    if (!item) return item;
    const newItem = { ...item };

    // 1. 处理主图片
    if (newItem.picurl) {
        const prefixedUrl = `${prefix}/${newItem.picurl}`;
        newItem.picurl = prefixedUrl;
        newItem.smallPicurl = prefixedUrl.replace('.jpg', '_small.webp');
        newItem.mediumPicurl = prefixedUrl.replace('.jpg', '_medium.webp');
    }

    // 2. 处理专题封面图
    if (newItem.cover_url) {
        const prefixedCover = `${prefix}/${newItem.cover_url}`;
        newItem.cover_url = prefixedCover;
        newItem.cover_small = prefixedCover.replace('.jpg', '_small.webp');
        newItem.cover_medium = prefixedCover.replace('.jpg', '_medium.webp');
    }

    // 3. 处理专题预览壁纸数组
    if (newItem.preview_walls && Array.isArray(newItem.preview_walls)) {
        newItem.preview_walls = newItem.preview_walls.map((url) => `${prefix}/${url}`);
    }

    return newItem;
}

export function gotoHome() {
    uni.showModal({
        title: '提示',
        content: '页面有误将返回首页',
        showCancel: false,
        success: (res) => {
            if (res.confirm) {
                uni.reLaunch({
                    url: '/pages/app/index',
                });
            }
        },
    });
}

// 统一的日期时间常量和格式化工具函数
export const WEEK_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WEEK_NAMES_ZH = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
export const MONTH_NAMES_EN = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];
export const MONTH_NAMES_UPPER_EN = MONTH_NAMES_EN.map(m => m.toUpperCase());

/**
 * 格式化星期和月份标识（用于 index.vue 和 timeline.vue）
 * @param {Date} date 
 * @param {boolean} isZh 
 * @returns {string}
 */
export function getDayLabel(date, isZh) {
    if (isZh) {
        return `${WEEK_NAMES_ZH[date.getDay()]} ${date.getMonth() + 1}月`;
    }
    return `${WEEK_NAMES_EN[date.getDay()]} / ${MONTH_NAMES_EN[date.getMonth()].slice(0, 3).toUpperCase()}`;
}

/**
 * 格式化为 YYYY-MM-DD 键（用于 history.vue）
 * @param {Date} date 
 * @returns {string}
 */
export function formatDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * 历史记录页分组日期标签双语转换（用于 history.vue）
 * @param {string} dateStr YYYY-MM-DD格式
 * @param {boolean} isZh 
 * @returns {string}
 */
export function formatHistoryDayLabel(dateStr, isZh) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        if (isZh) {
            return `${month}月${day}日`;
        } else {
            const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthsShort[month - 1]} ${day}`;
        }
    }
    return dateStr;
}

/**
 * 锁屏预览日期双语格式化（用于 preview.vue）
 * @param {Date} date 
 * @param {boolean} isZh 
 * @returns {string}
 */
export function formatPreviewDate(date, isZh) {
    const week = isZh ? WEEK_NAMES_ZH[date.getDay()] : WEEK_NAMES_EN[date.getDay()];
    if (isZh) {
        return `${week} ${date.getMonth() + 1}月${date.getDate()}日`;
    }
    return `${week}, ${MONTH_NAMES_EN[date.getMonth()]} ${date.getDate()}`;
}

