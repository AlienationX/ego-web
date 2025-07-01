import App from './App';

// #ifndef VUE3
import Vue from 'vue';
import './uni.promisify.adaptor';
Vue.config.productionTip = false;
App.mpType = 'app';
const app = new Vue({
    ...App
});
app.$mount();
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue';
import * as Pinia from 'pinia';
import { createPersistedState } from 'pinia-plugin-persistedstate';

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
    app.use(pinia);
    return {
        app,
        Pinia // 此处必须将 Pinia 返回
    };
}
// #endif
