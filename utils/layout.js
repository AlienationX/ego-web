// ── 布局测量工具，统一使用新版细粒度 API ──
// const getWindow = () => uni.getWindowInfo();

// 获取状态栏高度
export const getStatusBarHeight = () => {
    return uni.getWindowInfo().statusBarHeight || 0;
};

// 获取标题栏高度
export const getTitleBarHeight = () => {
    try {
        if (uni.getMenuButtonBoundingClientRect) {
            let res = uni.getMenuButtonBoundingClientRect();
            if (res && res.top && res.height) {
                let { top, height } = res;
                return height + (top - getStatusBarHeight()) * 2;
            }
        }
    } catch (e) {}
    return 44;
};

// 获取顶部导航栏高度（包含：状态栏 + 标题栏）
export const getNavBarHeight = () => getStatusBarHeight() + getTitleBarHeight();

// 获取底部安全区域高度（原生标准底部安全区域一般为34px）
export const getSafeAreaBottom = () => {
    try {
        const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync();
        if (info && info.safeAreaInsets && info.safeAreaInsets.bottom > 0) {
            return info.safeAreaInsets.bottom;
        }
        // 在 Android 全面屏上，由于 manifest 配置 safearea offset none，
        // 系统返回 safeAreaInsets.bottom 可能为 0。通过判断屏幕长宽比（高/宽 > 1.86）保底返回 34px
        const screenHeight = info.screenHeight || 0;
        const screenWidth = info.screenWidth || 1;
        if (screenHeight / screenWidth > 1.86) {
            return 34;
        }
    } catch (e) {}
    return 0;
};

// 获取底部 TabBar 高度（根据悬浮胶囊或经典贴底模式动态计算页面底边距）
export const getTabBarHeight = () => {
    let isFloating = true;
    try {
        const savedSettings = uni.getStorageSync('settings');
        if (savedSettings) {
            const parsed = typeof savedSettings === 'string' ? JSON.parse(savedSettings) : savedSettings;
            if (typeof parsed.options?.customTabBar === 'boolean') {
                isFloating = parsed.options.customTabBar;
            }
        }
    } catch (e) {}

    const safeBottom = getSafeAreaBottom() || 0;

    // 经典贴底模式：底栏高度 50px + 底部安全区 padding
    if (!isFloating) {
        return 50 + safeBottom;
    }

    // 悬浮胶囊模式：胶囊高 60px + 悬浮底距 18px + 缓冲 10px
    const floatingBarHeight = 60;
    const floatingBottomGap = 18;
    return floatingBarHeight + floatingBottomGap + 10;
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
