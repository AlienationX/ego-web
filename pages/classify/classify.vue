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
        <view v-if="isLoading" class="loading-container">
            <rotate-loading :size="100"></rotate-loading>
            <view class="loading-text">{{ $t('message.loading') }}</view>
        </view>

        <!-- 空状态 -->
        <view v-else-if="!classifyList.length" class="empty-container">
            <view class="empty-text">{{ $t('category.empty') }}</view>
        </view>

        <!-- 分类网格：两列随意布局，部分高/跨列 -->
        <view class="classify" v-if="classifyList.length">
            <template v-for="(item, idx) in classifyComputed" :key="item.id">
                <classify-item :item="item" :layout-style="getLayoutStyle(idx)"></classify-item>
                <view v-if="(idx + 1) % 6 === 0">
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
    const isLoading = ref(true); // 添加加载状态变量
    const classifyComputed = computed(() => {
        return classifyList.value.map((item) => ({
            ...item,
            name: uni.getLocale() === 'en' ? item.name_en : item.name
        }));
    });

    const getClassify = async () => {
        try {
            isLoading.value = true;
            let res = await apiGetClassify({
                pageSize: 30
            });
            classifyList.value = res.data.map((item) => handlePicUrl(item));
        } catch (error) {
            console.error('获取分类数据失败:', error);
        } finally {
            isLoading.value = false;
        }
    };

    // 随意布局：每 6 个为一组，0/1 小格，2 高格，3/4 小格，5 通栏；
    // 最后一组如果不足 6 个，则使用默认两列顺序排布，避免多占用空 grid 行
    const getLayoutStyle = (idx) => {
        const total = classifyComputed.value.length;
        const fullCount = Math.floor(total / 6) * 6; // 能完整套用布局规则的数量

        // 最后一组不满 6 个：不指定 gridRow，让 CSS Grid 自然排版，只控制列数
        if (idx >= fullCount) {
            const local = idx - fullCount;
            return {
                gridColumn: String((local % 2) + 1)
                // gridRow 交给浏览器自动计算，这样不会预留多余空白
            };
        }

        const block = Math.floor(idx / 6);
        const baseRow = block * 5 + 1; // 每组6个分类项+1个广告位，共占用5行
        const r = idx % 6;
        if (r === 0) return { gridColumn: '1', gridRow: baseRow };
        if (r === 1) return { gridColumn: '2', gridRow: baseRow };
        if (r === 2) return { gridColumn: '1', gridRow: `${baseRow + 1} / span 2` };
        if (r === 3) return { gridColumn: '2', gridRow: baseRow + 1 };
        if (r === 4) return { gridColumn: '2', gridRow: baseRow + 2 };
        if (r === 5) return { gridColumn: '1 / -1', gridRow: baseRow + 3 };
        return {};
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
        padding: 0 24rpx 30rpx;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-auto-rows: 200rpx;
        gap: 20rpx;
        background: transparent;
    }

    .ad-row {
        grid-column: 1 / -1;
    }

    // 加载状态样式
    .loading-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 60vh;
        padding: 40rpx 0;

        .loading-text {
            margin-top: 30rpx;
            font-size: 28rpx;
            color: #666;
        }
    }

    // 空状态样式
    .empty-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 60vh;
        padding: 40rpx 0;

        .empty-icon {
            font-size: 100rpx;
            margin-bottom: 20rpx;
            opacity: 0.6;
        }

        .empty-text {
            font-size: 28rpx;
            color: #999;
        }
    }
</style>
