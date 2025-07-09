<template>
  <view class="container" ref="containerRef">
    <view 
      v-for="(item, index) in list" 
      :key="index" 
      class="item"
      :style="{ left: item.left + 'px', top: item.top + 'px' }"
    >Item {{ index }}</view>
  </view>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';

const containerRef = ref(null);
const list = ref([1, 2, 3, 4, 5]);
const columnCount = ref(2); // 列数（示例为2列）
const columnHeights = ref([]); // 每列当前高度
const itemWidth = 100; // 每个 item 的宽度（px）

// 初始化列高度
const initColumns = () => {
  const containerWidth = containerRef.value?.offsetWidth || 0;
  columnCount.value = Math.floor((containerWidth + 10) / (itemWidth + 10)); // 10px 列间距
  columnHeights.value = new Array(columnCount.value).fill(0);
};

// 计算单个 item 的位置
const calculatePosition = (index) => {
  const minHeight = Math.min(...columnHeights.value);
  const columnIndex = columnHeights.value.indexOf(minHeight);
  
  // 计算 left 和 top
  const left = columnIndex * (itemWidth + 10); // 10px 列间距
  const top = columnHeights.value[columnIndex];
  
  // 更新列高度（假设 item 高度为 80px）
  columnHeights.value[columnIndex] += 80 + 10; // 80px 高度 + 10px 行间距
  
  return { left, top };
};

// 渲染后初始化位置
const updatePositions = () => {
  nextTick(() => {
    initColumns();
    list.value.forEach((_, index) => {
      const pos = calculatePosition(index);
      list.value[index] = { ...list.value[index], left: pos.left, top: pos.top };
    });
  });
};

onMounted(() => {
  updatePositions(); // 初始渲染后计算位置
});
</script>

<style>
.container {
  position: relative;
  width: 100%;
}
.item {
  position: absolute;
  width: 100px; /* 与 itemWidth 一致 */
  height: 80px; /* 固定高度（或动态获取） */
  background: #f0f0f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>