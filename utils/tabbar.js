import { USE_CUSTOM_TABBAR } from '@/common/config.js';

/**
 * 动态更新原生 TabBar 的文字 (i18n)
 * @param {Function} t vue-i18n 翻译函数
 */
export const updateNativeTabBar = (t) => {
    // 如果启用自定义 TabBar，隐去原生控件并退出
    if (USE_CUSTOM_TABBAR) {
        uni.hideTabBar({ animation: false, fail: () => {} });
        return;
    }

    // 微信/App 原生 TabBar 图标与主题已由 theme.json + pages.json 自动处理
    // 此处仅在语言变化时更新文案，避免过多 API 调用导致小程序渲染进程 timeout
    if (t) {
        const tabTexts = [
            t('tabbar.index'),
            t('tabbar.category'),
            t('tabbar.discover'),
            t('tabbar.user'),
        ];
        tabTexts.forEach((text, index) => {
            uni.setTabBarItem({
                index,
                text,
                fail: () => {},
            });
        });
    }
};
