<template>
    <view class="classify-grid">
        <classify-item v-for="item in items" :key="item.id" :item="item" />
    </view>
</template>

<script setup>
defineProps({
    items: {
        type: Array,
        default: () => [],
    },
});
</script>

<style lang="scss" scoped>
.classify-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 210rpx;
    gap: 24rpx;

    // 7 个为一组循环：第 3、5 个跨 2 行
    :deep(.classify-item:nth-child(7n + 3)),
    :deep(.classify-item:nth-child(7n + 5)) {
        grid-row: span 2;
    }

    // 7 个为一组循环：第 7 个跨 2 列（占满整行）
    :deep(.classify-item:nth-child(7n)) {
        grid-column: 1 / -1;
    }

    // 最后一个元素如果是该组的第 1、3、5 个（左列），占满整行，取消跨行
    :deep(.classify-item:last-child:nth-child(7n + 1)),
    :deep(.classify-item:last-child:nth-child(7n + 3)),
    :deep(.classify-item:last-child:nth-child(7n + 5)) {
        grid-column: 1 / -1;
        grid-row: auto;
    }

    // 倒数第 2 个元素如果是跨 2 行的位置，取消跨行
    :deep(.classify-item:nth-last-child(2):nth-child(7n + 3)),
    :deep(.classify-item:nth-last-child(2):nth-child(7n + 5)) {
        grid-row: auto;
    }

    // 确保 classify-item 撑满网格单元
    :deep(.classify-item) {
        height: 100%;
        width: 100%;
        display: block;
    }
}
</style>
