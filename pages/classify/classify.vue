<template>
    <view class="classLayout pageBackground">
        <custom-nav-bar title="分类"></custom-nav-bar>
        
        <!-- <view class="loadingLayout" v-if="!classifyList.length">
            <uni-load-more status="loading"></uni-load-more>
        </view> -->
        
        <view class="classify">
            <classify-item v-for="item in classifyList" :key="item.id" :item="item"></classify-item>
        </view>
    </view>
</template>

<script setup>
    import {
        ref
    } from "vue";
    import {
        apiGetClassify
    } from "@/api/wallpaper.js";
    import { picurlHandle } from "@/utils/common.js";
    import { PICS_BASE_URL } from "@/common/config.js";

    const classifyList = ref([]);

    const getClassify = async () => {
        let res = await apiGetClassify({
            // 该参数无效，接口默认就是显示全部分类
            pageSize: 30
        });
        classifyList.value = res.data.map(item => picurlHandle(item, PICS_BASE_URL));
    }

    getClassify()
</script>

<style lang="scss" scoped>
    .classify {
        padding: 30rpx;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15rpx;
    }
    
    .content {
        background-color: #DBDBDB;
        padding: 10px;
      }
    
      .ad-view {
        background-color: #FFFFFF;
        margin-bottom: 10px;
      }
</style>