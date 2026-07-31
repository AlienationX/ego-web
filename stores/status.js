import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export const useStatusStore = defineStore(
    'status',
    () => {
        const appStatus = reactive({
            hasSeenGuide: false,
            hasSeenPreviewHint: false,
            hasSeenTapHint: false,
            hasSeenSwipeHint: false,
            lastCheckinDate: '',
            lastViewedWallpaperTime: '', // ISO format timestamp string
        });

        const newWallpapersCount = ref(0); // 运行时状态，不持久化

        const setLastViewedWallpaperTime = (timeStr) => {
            if (!timeStr) return;
            if (!appStatus.lastViewedWallpaperTime || new Date(timeStr) > new Date(appStatus.lastViewedWallpaperTime)) {
                appStatus.lastViewedWallpaperTime = timeStr;
            }
        };

        return {
            appStatus,
            newWallpapersCount,
            setLastViewedWallpaperTime,
        };
    },
    {
        persist: {
            paths: ['appStatus'],
        },
    }
);
