<template>
    <view class="classLayout">
        <nav-bar :title="$t('category.title')"></nav-bar>

        <!-- 页面头部装饰（仅子标题） -->
        <view class="page-header">
            <view class="header-content">
                <view class="header-desc">{{ $t('category.desc') }}</view>
            </view>
            <view class="header-decoration">
                <view class="decoration-circle circle-1"></view>
                <view class="decoration-circle circle-2"></view>
            </view>
        </view>

        <!-- 加载状态 -->
        <view v-if="!classifyList.length">
            <rotate-loading style="min-height: 60vh"></rotate-loading>
        </view>

        <!-- 分类网格 -->
        <view class="classify" v-if="classifyList.length">
            <template v-for="(item, idx) in classifyComputed" :key="item.id">
                <classify-item :item="item"></classify-item>
                <view v-if="(idx + 1) % 6 === 0" class="ad-row">
                    <custom-ad-banner style="padding: 15rpx 0"></custom-ad-banner>
                </view>
            </template>
        </view>
    </view>
</template>

<script setup>
    import { ref, computed } from 'vue';
    import { apiGetClassify } from '@/api/wallpaper.js';
    import { handlePicUrl } from '@/utils/common.js';

    const classifyList = ref([]);
    const classifyComputed = computed(() => {
        return classifyList.value.map((item) => ({
            ...item,
            name: uni.getLocale() === 'en' ? item.name_en : item.name
        }));
    });

    const getClassify = async () => {
        let res = await apiGetClassify({
            // 该参数无效，接口默认就是显示全部分类
            pageSize: 30
        });
        classifyList.value = res.data.map((item) => handlePicUrl(item));
    };

    getClassify();
</script>

<style lang="scss" scoped>
    .classLayout {
        background: linear-gradient(135deg, rgba(40, 179, 137, 0.08) 0%, rgba(255, 107, 157, 0.05) 100%);
        min-height: 100vh;
    }

    .page-header {
        position: relative;
        background: transparent;
        padding: 30rpx 30rpx 20rpx;
        overflow: hidden;

        .header-content {
            position: relative;
            z-index: 1;

            .header-desc {
                font-size: 28rpx;
                color: #666;
            }
        }

        .header-decoration {
            position: absolute;
            top: 0;
            right: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;

            .decoration-circle {
                position: absolute;
                border-radius: 50%;
                background: linear-gradient(135deg, rgba(40, 179, 137, 0.1) 0%, rgba(255, 107, 157, 0.08) 100%);
            }

            .circle-1 {
                width: 200rpx;
                height: 200rpx;
                top: -50rpx;
                right: -30rpx;
            }

            .circle-2 {
                width: 150rpx;
                height: 150rpx;
                bottom: -30rpx;
                right: 50rpx;
            }
        }
    }

    .classify {
        padding: 0 30rpx 30rpx;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 30rpx;
        background: transparent;
    }

    .ad-row {
        grid-column: 1 / -1;
        height: 100%;
    }
</style>
