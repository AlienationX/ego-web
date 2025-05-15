import { defineStore } from 'pinia';
import { reactive, computed, watch } from 'vue';

export const useThemeStore = defineStore(
    'theme',
    () => {
        const color = reactive({
            primary: '',
        });

        return { color };
    },
    {
        persist: {
            // 存储的 key， 默认是 defineStore 的第一个参数
            // key: "A",
            // 存储位置，默认 localStorage，还支持sessionStorage，cookie比较复杂
            // storage: sessionStorage,
            // 指定存储的内容
            paths: ['color'],
        },
    }
);