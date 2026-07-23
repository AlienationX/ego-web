// ── 布局测量工具，统一使用新版细粒度 API ──
// const getWindow = () => uni.getWindowInfo();

// 获取状态栏高度
export const getStatusBarHeight = () => uni.getWindowInfo().statusBarHeight;

// 获取标题栏高度
export const getTitleBarHeight = () => {
    if (uni.getMenuButtonBoundingClientRect) {
        let { top, height } = uni.getMenuButtonBoundingClientRect();
        return height + (top - getStatusBarHeight()) * 2;
    }
    return 44;
};

// 获取顶部导航栏高度（包含：状态栏 + 标题栏）
export const getNavBarHeight = () => getStatusBarHeight() + getTitleBarHeight();

// 获取底部安全区域高度（原生标准底部安全区域一般为34px）
export const getSafeAreaBottom = () => uni.getWindowInfo().safeAreaInsets.bottom || 0;

// 获取底部tabbar高度（包含：tabbar主体 50px + 上边距 7px + 底部安全边距）
export const getTabBarHeight = () => {
    const customTabBarHeight = 50;

    // #ifdef WEB
    return customTabBarHeight;
    // #endif

    // #ifndef WEB
    const windowBottom = uni.getWindowInfo().windowBottom;

    if (windowBottom && windowBottom > 0) {
        // 使用原生 tabBar 时自动获取
        return windowBottom;
    } else {
        // 自定义 tabBar (custom: true) 时：主体 50px + 上 padding 7px + 底部安全区(安全区包含下内边距)
        const safeBottom = getSafeAreaBottom();
        const bottomPadding = safeBottom > 0 ? safeBottom : 7;
        return customTabBarHeight + 7 + bottomPadding;
    }
    // #endif
};

// 获取头条左上角图标宽度
export const getLeftIconWidth = () => {
    // #ifdef MP-TOUTIAO
    let {
        leftIcon: { left, width },
    } = tt.getCustomButtonBoundingClientRect();
    return left + parseInt(width);
    // #endif

    // #ifndef MP-TOUTIAO
    return 0;
    // #endif
};

// 获取微信右上角胶囊宽度
export const getRightIconWidth = () => {
    // #ifdef MP-WEIXIN
    let { width } = uni.getMenuButtonBoundingClientRect();
    return parseInt(width);
    // #endif

    // #ifndef MP-WEIXIN
    return 0;
    // #endif
};
