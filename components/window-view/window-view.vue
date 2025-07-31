<template>
    <view class="container">
        <!-- { gridTemplateColumns: gridTemplateColumns } 键值对相同，可以简写为 { gridTemplateColumns } -->
        <!-- <view class="layout" :style="{ gridTemplateColumns: gridTemplateColumns }"> -->
        <view class="layout" :style="styles.layout">
            <template v-for="(item, idx) in classList" :key="item.id">
                <navigator class="box" :style="styles.box" :url="`/pages/preview/preview?id=${item.id}`">
                    <image class="img" :style="styles.img" :src="item.smallPicurl" mode="aspectFill" lazy-load></image>
                    <uni-icons class="lock" :style="styles.lock" v-show="item.is_locked" type="locked-filled" :size="lockSize" color="#F9E9B5"></uni-icons>
                </navigator>

                <!-- 每12个图片后插入广告 -->
                <view v-if="(idx + 1) % 12 === 0" class="ad-row">
                    <custom-ad-banner></custom-ad-banner>
                    <!-- <image :src="item.smallPicurl" mode="aspectFill" class="img"></image> -->
                    <!-- view class="ad-view">
                        <ad :adpid="1760125998"></ad>
                    </view> -->
                </view>
            </template>
        </view>
    </view>
</template>

<script setup>
    import { ref, computed } from 'vue';
    import { useSettingsStore } from '@/stores/settings.js';
    const settingsStore = useSettingsStore();

    const props = defineProps({
        classList: {
            type: Array,
            default: () => [
                {
                    id: '0',
                    smallPicurl: '/common/images/logo_Obsidian_Light_Raw.png',
                    description: '默认描述',
                    score: 0
                }
            ]
        }
    });

    // gridTemplateColumns 必须驼峰命名，对应css样式 grid-template-columns
    // 这里返回没有大括号{}，所以上面需要使用 :style="{ gridTemplateColumns }"
    // const gridTemplateColumns = computed(() => {
    //     return `repeat(${settingsStore.options.column}, 1fr)`;
    // });

    const lockSize = ref(18);
    const styles = computed(() => {
        // 这里返回有大括号，所以上面直接使用即可，:style="styles.layout"
        if (settingsStore.options.column === 3) {
            lockSize.value = 18;
            return {
                layout: {
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '20rpx',
                    padding: '20rpx'
                },
                box: {
                    height: '440rpx',
                    borderRadius: '24rpx',
                    boxShadow: '0 0 8rpx rgba(0, 0, 0, 0.85)'
                },
                img: {
                    borderRadius: '24rpx'
                },
                lock: {
                    top: '4rpx',
                    right: '4rpx'
                }
            };
        } else {
            lockSize.value = 22;
            return {
                layout: {
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '30rpx',
                    padding: '30rpx'
                },
                box: {
                    height: '560rpx',
                    borderRadius: '48rpx',
                    boxShadow: '0 0 10rpx rgba(0, 0, 0, 0.85)'
                },
                img: {
                    borderRadius: '48rpx'
                },
                lock: {
                    top: '10rpx',
                    right: '10rpx'
                }
            };
        }
    });
</script>

<style lang="scss" scoped>
    .container {
        .layout {
            display: grid;
            // grid-template-columns: repeat(3, 1fr);
            // gap: 20rpx;
            // padding: 20rpx;
            transition: grid-template-columns 0.8s ease; // 过度动画，使布局变化更加平滑

            .box {
                // height: 440rpx;
                // border-radius: 24rpx;
                position: relative;
                // x 偏移量 | y 偏移量 | 阴影模糊半径 | 阴影颜色 */
                // box-shadow: 0 8px 24rpx rgba(0,0,0,0.15);
                // box-shadow: 0 0 8rpx rgba(0, 0, 0, 0.85);

                .img {
                    width: 100%;
                    height: 100%;
                    display: block;
                    // border-radius: 24rpx;
                }

                .lock {
                    position: absolute;
                    // top: 4rpx;
                    // right: 4rpx;
                }
            }

            .ad-row {
                grid-column: 1 / -1;
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
            }
        }
    }
</style>
