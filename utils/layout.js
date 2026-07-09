// ── 布局测量工具，统一使用新版细粒度 API ──
const getWindow = () => uni.getWindowInfo();

export const getStatusBarHeight = () => {
    // #ifdef WEB
    return 0;
    // #endif

    // #ifndef WEB
    return getWindow().statusBarHeight;
    // #endif
};

export const getTitleBarHeight = () => {
    if (uni.getMenuButtonBoundingClientRect) {
        let { top, height } = uni.getMenuButtonBoundingClientRect();
        return height + (top - getStatusBarHeight()) * 2;
    }
    return 44;
};

export const getNavBarHeight = () => getStatusBarHeight() + getTitleBarHeight();

export const getTabBarHeight = () => {
    // #ifdef WEB
    return 50;
    // #endif

    // #ifndef WEB
    return getWindow().windowBottom;
    // #endif
};

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

export const getRightIconWidth = () => {
    // #ifdef MP-WEIXIN
    let { width } = uni.getMenuButtonBoundingClientRect();
    return parseInt(width);
    // #endif

    // #ifndef MP-WEIXIN
    return 0;
    // #endif
};
