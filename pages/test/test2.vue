<template>
  <view class="container">
      <!-- #ifndef MP-WEIXIN -->
    <!-- 瀑布流容器 -->
    <Waterfall 
      :list="productList"
      :breakpoints="breakpoints"
      :gutter="10"
      :lazyload="true"
      @scroll-end="loadMore"
    >
      <template #default="{ item }">
        <view class="card">
          <!-- 懒加载图片 -->
          <LazyImg 
            class="card-img" 
            :url="item.smallPicurl" 
            :ratio="0.7" 
            :loading="loading"
          />
          <view class="card-content">
            <text class="title">{{ item.description }}</text>
            <text class="price">¥{{ item.score }}</text>
          </view>
        </view>
      </template>
    </Waterfall>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading">加载中...</view>
    <!-- #endif -->
  </view>
</template>

<script setup>
// import { ref, onMounted } from 'vue'
// import { Waterfall, LazyImg } from 'vue-waterfall-plugin-next'
// import 'vue-waterfall-plugin-next/dist/style.css'

// import {apiGetDayRandom} from "@/api/wallpaper.js"

// // 模拟数据
// const productList = ref([])
// const loading = ref(false)
// const page = ref(1)

// // 响应式布局配置
// const breakpoints = {
//   600: { rowPerView: 3 },
//   400: { rowPerView: 2 },
//   200: { rowPerView: 1 }
// }

// // 模拟 API 请求
// const fetchData = async () => {
//   try {
//     loading.value = true
//     // const res = await uni.request({
//     //   url: `https://api.example.com/products?page=${page.value}`
//     // })
    
    
//     let res = await apiGetDayRandom();
//     console.log("res", res);
    
//     productList.value = res.data.map(item => {
//         // 增加smallPicurl字段，存储小图的url地址
//         return {
//             ...item,
//             smallPicurl: item.picurl.replace(".jpg", "_small.webp")
//         }
//     });
    
    
//   //   productList.value = [...productList.value, ...res.data.list]
//   } finally {
//     loading.value = false
//   }
// }

// // 生命周期钩子
// onMounted(() => {
//   fetchData()
// })

// // 滚动加载
// const loadMore = () => {
//   if (!loading.value) fetchData()
// }
</script>

<style scoped>
.container {
  padding: 20px;
}

.card {
  position: relative;
  margin-bottom: 20px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.card-img {
  width: 100%;
  height: 0;
  padding-bottom: 70%; /* 保持宽高比 */
}

.card-content {
  padding: 15px;
}

.title {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.price {
  color: #e4393c;
  font-size: 18px;
  font-weight: bold;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}
</style>