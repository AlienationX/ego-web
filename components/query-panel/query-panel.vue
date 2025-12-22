<template>
    <view class="queryPanel" :style="{ top: top , height: height + 'rpx' }">
        <view class="left">
            <button size="mini" plain :class="{ active: activeButton === 'recommend' }" @click="onRecommend">{{ $t('common.recommend') }}</button>
            <button size="mini" plain :class="{ active: activeButton === 'score' }" @click="onScore">{{ $t('common.score') }}</button>
            <button size="mini" plain :class="{ active: activeButton === 'date' }" @click="onDateSort">
                {{ $t('common.publishDate') }}
                <view class="icon" v-if="activeButton === 'date'">
                    <uni-icons :type="dateSortAsc ? 'arrow-up' : 'arrow-down'" size="14" color="#ffffff"></uni-icons>
                </view>
            </button>
        </view>
        <view class="right">
            <!-- 直接使用，可以指定样式，比如修改颜色 -->
            <!-- <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3,11H11V3H3M3,21H11V13H3M13,21H21V13H13M13,3V11H21V3" /></svg> -->

            <view class="num" @click="onChangeColumn">
                <image v-if="settingsStore.options.column === 3" src="/common/icons/numeric-3-box.svg"></image>
                <image v-else src="/common/icons/numeric-2-box.svg"></image>
            </view>

            <view class="icon" @click="onChangeView">
                <image v-if="settingsStore.options.view === 'window'" src="/common/icons/view-grid.svg"></image>
                <image v-else src="/common/icons/view-dashboard.svg"></image>
            </view>
        </view>
    </view>
</template>

<script setup>
    import { ref, toRefs } from 'vue';
    import { useSettingsStore } from '@/stores/settings.js';
    const settingsStore = useSettingsStore();

    const props = defineProps({
        // activeButton: String,
        // dateSortAsc: Boolean,
        // switchViewIcon: String,
        top: {
            type: String,
            default: '0px'
        }
    });

    // const { activeButton, dateSortAsc, top } = toRefs(props);
    // const emit = defineEmits(['recommend', 'score', 'dateSort', 'change']);
    const emit = defineEmits(['onQuery']);

    // 组件高度，默认76rpx
    const height = ref('76');
    // 激活按钮
    const activeButton = ref('');
    // 时间排序按钮
    const dateSortAsc = ref(true);

    function onRecommend() {
        activeButton.value = 'recommend';
        dateSortAsc.value = true; // 重置箭头默认向上，不显示
        emit('onQuery', 'random'); // 第一个参数为执行的函数，第二个参数是传入的参数值
    }

    function onScore() {
        activeButton.value = 'score';
        dateSortAsc.value = true; // 重置箭头默认向上，不显示
        emit('onQuery', 'score');
    }

    function onDateSort() {
        activeButton.value = 'date';
        dateSortAsc.value = !dateSortAsc.value;
        const sortord = dateSortAsc.value ? 'date_asc' : 'date_desc';
        emit('onQuery', sortord);
    }

    function onChangeColumn() {
        settingsStore.options.column = settingsStore.options.column === 3 ? 2 : 3;
    }

    function onChangeView() {
        settingsStore.options.view = settingsStore.options.view === 'window' ? 'waterfall' : 'window';
    }

    function reset() {
        activeButton.value = '';
        dateSortAsc.value = true;
    }

    // 暴露方法给父组件
    defineExpose({
        reset,
        height
    });
</script>

<style lang="scss" scoped>
    .queryPanel {
        position: fixed;
        left: 0;
        right: 0;
        z-index: 99;
        background-color: #f5f5f5;
        display: flex;
        justify-content: space-between;
        align-items: center;
        // padding: 2rpx 8rpx;
        // border-top: none;
        // x 偏移量 | y 偏移量 | 阴影模糊半径 | 阴影颜色 */
        box-shadow: 0 8rpx 8rpx -4rpx rgba(0, 0, 0, 0.1);

        .left {
            display: flex;
            height: 48rpx;
            padding: 12rpx 12rpx;

            button {
                padding: 12rpx 24rpx;
                text-align: center;
                border-radius: 40rpx;
                font-size: 26rpx;
                color: #666;
                background: #e8e8e8;
                border: 2rpx solid transparent;
                transition: all 0.3s;
                white-space: nowrap;
                margin-right: 10rpx;
                display: flex;
                align-items: center;

                &:active {
                    opacity: 0.8;
                }

                &.active {
                    color: #fff;
                    background: $wp-theme-color;
                    border-color: $wp-theme-color;
                    font-weight: 600;
                }

                .icon {
                    font-size: 24rpx;
                }
            }
        }

        .right {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10rpx;

            .num {
                width: 44rpx;
                height: 44rpx;
            }

            .icon {
                margin-right: 20rpx;
                width: 40rpx;
                height: 40rpx;
                fill: $wp-theme-color;
            }

            image {
                width: 100%;
                height: 100%;
            }
        }
    }
</style>
