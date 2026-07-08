// export const getStatusBarHeight = () => {
//     // 状态栏高度
//     // #ifdef WEB
//     return 0;
//     // #endif

//     // #ifndef WEB
//     // MP = 54px, APP = 22px
//     return SYSTEM_INFO.statusBarHeight;
//     // #endif
// };

// export const getTitleBarHeight = () => {
//     // 小程序胶囊按钮高度
//     if (uni.getMenuButtonBoundingClientRect) {
//         let { top, height } = uni.getMenuButtonBoundingClientRect();
//         return height + (top - getStatusBarHeight()) * 2;
//     } else {
//         return 44;
//     }
// };

// export const getNavBarHeight = () => getStatusBarHeight() + getTitleBarHeight();

// export const getTabBarHeight = () => {
//     // #ifdef WEB
//     return 50;
//     // #endif

//     // #ifndef WEB
//     return SYSTEM_INFO.windowBottom;
//     // #endif
// };

// export const getLeftIconWidth = () => {
//     // #ifdef MP-TOUTIAO
//     // 抖音/头条 小程序头部左侧的按钮显示问题
//     // 深度结构，两层
//     let {
//         leftIcon: { left, width },
//     } = tt.getCustomButtonBoundingClientRect();
//     return left + parseInt(width);
//     // #endif

//     // #ifndef MP-TOUTIAO
//     return 0;
//     // #endif
// };

// export const getRightIconWidth = () => {
//     // #ifdef MP-WEIXIN
//     // 微信小程序头部右侧的胶囊按钮显示问题
//     // 深度结构，两层
//     let { width } = uni.getMenuButtonBoundingClientRect();
//     return parseInt(width);
//     // #endif

//     // #ifndef MP-WEIXIN
//     return 0;
//     // #endif
// };
