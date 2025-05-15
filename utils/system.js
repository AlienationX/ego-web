const SYSTEM_INFO = uni.getSystemInfoSync();
// const SYSTEM_INFO = uni.getAppBaseInfo();

export const getStatusBarHeight = () => {
    // 状态栏高度
    return SYSTEM_INFO.statusBarHeight || 0;
}

export const getTitleBarHeight = () => {
    // 小程序胶囊按钮高度
    if (uni.getMenuButtonBoundingClientRect) {
        let {top, height} = uni.getMenuButtonBoundingClientRect();
        return height + (top - getStatusBarHeight()) * 2;
    }else {
        return 40;
    }
}


export const getNavBarHeight = () => getStatusBarHeight() + getTitleBarHeight();

export const getLeftIconWidth = () => {
    // #ifdef MP-TOUTIAO
        // 抖音/头条 小程序头部左侧的按钮显示问题
        // 深度结构，两层
        let {leftIcon: {left, width}} = tt.getCustomButtonBoundingClientRect();
        return left + parseInt(width);
    // #endif
        
    // #ifndef MP-TOUTIAO
        return 0;
    // #endif
}