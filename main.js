import App from './App';

// 多语言配置。如何需要设置tabbar的变量，文件夹必须是locale，不能是locales
import en from './locale/en.json';
import zhHans from './locale/zh-Hans.json';
const messages = {
    en,
    'zh-Hans': zhHans
};

let i18nConfig = {
    locale: uni.getStorageSync('lang') || uni.getLocale() || 'en', // 获取已设置的语言
    globalInjection: true, // 全局注入 $t 方法
    messages
};

import { createSSRApp } from 'vue';
import { createI18n } from 'vue-i18n';
import * as Pinia from 'pinia';
import { createPersistedState } from 'pinia-plugin-persistedstate';

const i18n = createI18n(i18nConfig);
export function createApp() {
    const app = createSSRApp(App);
    
    const pinia = Pinia.createPinia();
    // 添加持久化插件
    pinia.use(
        createPersistedState({
            storage: {
                getItem(key) {
                    return uni.getStorageSync(key);
                },
                setItem(key, value) {
                    uni.setStorageSync(key, value);
                },
                removeItem(key) {
                    uni.removeStorageSync(key);
                }
            }
        })
    );
    app.use(i18n);
    app.use(pinia);
    return {
        app,
        Pinia // 此处必须将 Pinia 返回
    };
}
