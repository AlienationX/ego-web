import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

const MAX_RECENT_ITEMS = 60;
const MAX_TAG_ITEMS = 24;

const normalizeWall = (wall = {}) => {
    if (!wall || !wall.id) return null;

    return {
        id: wall.id,
        smallPicurl: wall.smallPicurl || wall.picurl || '',
        description: wall.description || '',
        classify_name: wall.classify_name || '',
        score: wall.score || 0,
        tags_list: Array.isArray(wall.tags_list)
            ? wall.tags_list
            : typeof wall.tags === 'string'
              ? wall.tags
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
              : [],
        viewed_at: wall.viewed_at || Date.now(),
    };
};

const getWallTags = (wall = {}) => {
    if (Array.isArray(wall.tags_list)) return wall.tags_list.filter(Boolean);
    if (typeof wall.tags === 'string') {
        return wall.tags
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
};

export const useLibraryStore = defineStore(
    'library',
    () => {
        const recentViewed = ref([]);
        const watchLater = ref([]);
        const subscriptions = ref({
            classifyIds: [],
            tags: [],
            topics: [],
        });
        const hiddenTags = ref([]);
        const preferredTags = ref([]);

        const watchLaterIds = computed(() => new Set(watchLater.value.map((item) => item.id)));

        const recordRecentView = (wall) => {
            const normalized = normalizeWall(wall);
            if (!normalized) return;

            normalized.viewed_at = Date.now();

            const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
            recentViewed.value = [
                normalized,
                ...recentViewed.value.filter((item) => item.id !== normalized.id && (item.viewed_at || Date.now()) >= thirtyDaysAgo)
            ].slice(0, 400);

            const nextTags = normalized.tags_list.filter((tag) => !hiddenTags.value.includes(tag));
            preferredTags.value = [...new Set([...nextTags, ...preferredTags.value])].slice(0, MAX_TAG_ITEMS);
        };

        const toggleWatchLater = (wall) => {
            const normalized = normalizeWall(wall);
            if (!normalized) return false;

            const exists = watchLater.value.some((item) => item.id === normalized.id);
            watchLater.value = exists
                ? watchLater.value.filter((item) => item.id !== normalized.id)
                : [normalized, ...watchLater.value].slice(0, MAX_RECENT_ITEMS);
            return !exists;
        };

        const isInWatchLater = (id) => watchLaterIds.value.has(id);

        const isWallHidden = (wall = {}) => getWallTags(wall).some((tag) => hiddenTags.value.includes(tag));

        const bumpPreferredTag = (tag) => {
            const normalized = String(tag || '').trim();
            if (!normalized || hiddenTags.value.includes(normalized)) return;
            preferredTags.value = [normalized, ...preferredTags.value.filter((item) => item !== normalized)].slice(
                0,
                MAX_TAG_ITEMS,
            );
        };

        const removePreferredTag = (tag) => {
            const normalized = String(tag || '').trim();
            if (!normalized) return;
            preferredTags.value = preferredTags.value.filter((item) => item !== normalized);
            subscriptions.value.tags = subscriptions.value.tags.filter((item) => item !== normalized);
        };

        const hideTag = (tag) => {
            const normalized = String(tag || '').trim();
            if (!normalized) return;
            hiddenTags.value = [...new Set([normalized, ...hiddenTags.value])];
            preferredTags.value = preferredTags.value.filter((item) => item !== normalized);
            subscriptions.value.tags = subscriptions.value.tags.filter((item) => item !== normalized);
        };

        const restoreHiddenTag = (tag) => {
            const normalized = String(tag || '').trim();
            if (!normalized) return;
            hiddenTags.value = hiddenTags.value.filter((item) => item !== normalized);
            bumpPreferredTag(normalized);
        };

        const clearSubscriptions = () => {
            subscriptions.value = {
                classifyIds: [],
                tags: [],
                topics: [],
            };
        };

        const clearRecentViewed = () => {
            recentViewed.value = [];
        };

        const clearWatchLater = () => {
            watchLater.value = [];
        };

        const toggleSubscription = (type, value) => {
            const bucket = subscriptions.value[type];
            if (!Array.isArray(bucket) || !value) return false;
            const exists = bucket.includes(value);
            subscriptions.value[type] = exists ? bucket.filter((item) => item !== value) : [...bucket, value];
            return !exists;
        };

        return {
            recentViewed,
            watchLater,
            subscriptions,
            hiddenTags,
            preferredTags,
            recordRecentView,
            toggleWatchLater,
            isInWatchLater,
            isWallHidden,
            bumpPreferredTag,
            removePreferredTag,
            hideTag,
            restoreHiddenTag,
            clearRecentViewed,
            clearWatchLater,
            toggleSubscription,
            clearSubscriptions,
        };
    },
    {
        persist: {
            paths: ['recentViewed', 'watchLater', 'subscriptions', 'hiddenTags', 'preferredTags'],
        },
    },
);
