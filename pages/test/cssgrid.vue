<template>
  <div class="waterfall">
    <div 
      v-for="(item, index) in images" 
      :key="index" 
      class="item"
      :style="{ gridRowEnd: `span ${Math.ceil(item.height/10)}` }"
    >
      <img :src="item.url" />
    </div>
  </div>
</template>

<script setup>
    import {ref} from 'vue';
    
    const images = ref([])
    
    for (let i = 0; i < 30; i++) {
        let width = 200 + Math.floor(Math.random() * 10) * 50
        let height = 300 - Math.floor(Math.random() * 10) * 20
        let obj = {
            url: `https://picsum.photos/${width}/${height}?random=${i}`,
            width: width,
            height: height,
            position: {}
        }
        images.value.push(obj); // 将对象添加到数组中
    }
</script>

<style scoped>
.waterfall {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3列 */
  grid-auto-rows: 10px; /* 基础行高单位 */
  gap: 10px;
}
.item {
  border-radius: 8px;
  overflow: hidden;
}
img {
  width: 100%;
  height: auto;
}
</style>