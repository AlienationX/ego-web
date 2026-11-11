/**
 * 全局统一主题与原生状态栏/安全区管理工具
 * 解决冷启动、热启动、后台切前台、系统主题切换以及用户手动切换时原生状态栏白条与割裂问题
 */
import { getSystemTheme } from '@/stores/settings.js';
import { setAndroidImmersive } from '@/utils/system.js';

/**
 * 判断当前是否处于暗色模式
 * @param {string} theme 'auto' | 'light' | 'dark'
 * @returns {boolean}
 */
export function resolveIsDark(theme) {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return getSystemTheme() === 'dark';
}

/**
 * 核心：立即同步当前宿主环境状态栏、原生UI样式与背景色
 * @param {boolean} isDark
 */
export function syncSystemBars(isDark) {
    // 1. App 平台 (5+App / iOS / Android)
    // #ifdef APP-PLUS
    try {
        if (typeof plus !== 'undefined') {
            // 设置状态栏文字颜色：'light' 为白字（适合暗色背景），'dark' 为黑字（适合浅色背景）
            if (plus.navigator && plus.navigator.setStatusBarStyle) {
                plus.navigator.setStatusBarStyle(isDark ? 'light' : 'dark');
            }

            // 状态栏背景色
            if (plus.navigator && plus.navigator.setStatusBarBackground) {
                plus.navigator.setStatusBarBackground(isDark ? '#181818' : '#eef1f4');
            }

            // 当前 Webview 窗口背景色防白底
            const currentWv = plus.webview.currentWebview();
            if (currentWv && currentWv.setStyle) {
                currentWv.setStyle({
                    background: isDark ? '#181818' : '#eef1f4',
                });
            }
        }
    } catch (e) {
        console.warn('syncSystemBars app error:', e);
    }

    // Android Edge-to-Edge 沉浸式协同
    try {
        setAndroidImmersive(isDark);
    } catch (e) {}
    // #endif

    // 2. 小程序与各端导航栏颜色同步
    try {
        if (uni.setNavigationBarColor) {
            uni.setNavigationBarColor({
                frontColor: isDark ? '#ffffff' : '#000000',
                backgroundColor: isDark ? '#181818' : '#eef1f4',
                animation: { duration: 0 },
                fail: () => {},
            });
        }
    } catch (e) {}

    // 3. Web / H5 平台
    // #ifdef H5
    try {
        if (typeof document !== 'undefined') {
            const root = document.documentElement;
            if (root) {
                root.classList.remove('theme-light', 'theme-dark');
                root.classList.add(isDark ? 'theme-dark' : 'theme-light');
                root.style.colorScheme = isDark ? 'dark' : 'light';
                root.style.backgroundColor = isDark ? '#181818' : '#eef1f4';
            }
            if (document.body) {
                document.body.style.backgroundColor = isDark ? '#181818' : '#eef1f4';
            }
            // 更新 theme-color meta 标签
            let meta = document.querySelector('meta[name="theme-color"]');
            if (!meta) {
                meta = document.createElement('meta');
                meta.name = 'theme-color';
                document.head.appendChild(meta);
            }
            meta.content = isDark ? '#181818' : '#eef1f4';
        }
    } catch (e) {}
    // #endif
}

/**
 * 应用主题并执行多阶段时序压制 (解决 App 启动及切换 UIStyle 时原生层重绘与延迟加载导致的白条)
 * @param {string} theme 'auto' | 'light' | 'dark'
 */
export function applyAppTheme(theme) {
    if (!theme) theme = 'auto';
    const isDark = resolveIsDark(theme);

    // #ifdef APP-PLUS
    try {
        if (typeof plus !== 'undefined' && plus.nativeUI && plus.nativeUI.setUIStyle) {
            plus.nativeUI.setUIStyle(theme);
        }
    } catch (e) {}
    // #endif

    // 压制原生层 TabBar 并同步状态栏
    const runSync = () => {
        // #ifdef APP-PLUS
        uni.hideTabBar({ animation: false, fail: () => {} });
        // #endif
        syncSystemBars(isDark);
    };

    // 立即执行一次
    runSync();

    // 延时多次执行：覆盖原生窗口异步挂载和生命周期重绘（80ms、250ms、500ms）
    setTimeout(runSync, 80);
    setTimeout(runSync, 250);
    setTimeout(runSync, 500);
}

