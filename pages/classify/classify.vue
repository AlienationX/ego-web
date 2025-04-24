<template>
    <view class="classLayout pageBackground">
        <custom-nav-bar title="分类"></custom-nav-bar>
        <view class="classify">
            <theme-item v-for="item in classifyList" :key="item.id" :item="item"></theme-item>
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

    const classifyList = ref([]);

    const getClassify = async () => {
        let res = await apiGetClassify({
            // 该参数无效，接口默认就是显示全部分类
            pageSize: 30
        });
        classifyList.value = res.data;
    }

    const onload = () => {
        console.log("onload");
    }

    const onclose = (e) => {
        console.log("onclose: " + e.detail);
    }

    const onerror = (e) => {
        console.log("onerror: " + e.detail.errCode + " message:: " + e.detail.errMsg);
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