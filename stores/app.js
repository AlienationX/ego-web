import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppStore = defineStore('app', () => {
    // 跨页面共享的壁纸列表，替代原来的 uni.setStorageSync('wallList', list)
    const wallList = ref([]);
    
    // 跨页面共享的分类列表，替代原来的 uni.setStorageSync('classifyList', list)
    const classifyList = ref([]);

    return {
        wallList,
        classifyList,
    };
});
