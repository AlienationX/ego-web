import { defineStore } from 'pinia';
import { ref, reactive, computed } from 'vue';

export const useSettingsStore = defineStore(
    'settings',
    () => {
        const installBanner = ref(true); // PWA安装应用的按钮提示条，判断是否已安装决定是否显示

        const options = reactive({
            view: 'window',  // window / waterfall
            column: 3,
            width: 100,  // 窗口宽度，用来计算瀑布流每列的宽度

            // vuetify项目的配置，后续修改
            theme: 'light',
            language: 'zh-CN',

            navBarFlat: false, // 导航栏扁平效果
            navBarBehavior: [], // 导航栏行为设置

            sideBarOrder: 0, // 侧边栏位置顺序，设置为0会高于narbar的0，设置为1会低于narbar的0
            sideBarOverlay: false, // 侧边栏是否遮罩效果
            sideBarExpand: false, // 侧边栏是否收缩

            showLayoutMsg: false, // 布局界面的通知组件是否展示
            showSideBar: false, // 侧边栏是否展示
            showNavBarSetting: false, // 弹出右侧的设置界面(遮罩层)
            showSideBarSetting: false, // 弹出侧边栏的设置界面(全屏对话框)

            refresh: false,
            firstLogin: false

            // TODO 多个primary等颜色的默认值
        });

        // 窗口视图和瀑布流视图的切换
        const switchViewIcon = computed(() => (options.view === 'window' ? 'map-filled' : 'list'));

        // 通过theme计算主题切换按钮的图标
        const switchIcon = computed(() => (options.theme === 'light' ? 'mdi-weather-night' : 'mdi-weather-sunny'));

        return { options, switchViewIcon, switchIcon, installBanner };
    },
    {
        persist: {
            // 存储的 key， 默认是 defineStore 的第一个参数
            // key: "A",
            // 存储位置，默认 localStorage，还支持sessionStorage，cookie比较复杂
            // storage: sessionStorage,
            // 指定存储的内容
            paths: ['options']
        }
    }
);
