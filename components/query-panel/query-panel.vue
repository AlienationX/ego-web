<template>
    <view class="queryPanel" :style="{ top: top }">
        <view class="left">
            <button size="mini" plain :class="{ active: activeButton === 'recommend' }" @click="onRecommend">推荐</button>
            <button size="mini" plain :class="{ active: activeButton === 'score' }" @click="onScore">评分</button>
            <button size="mini" plain :class="{ active: activeButton === 'date' }" @click="onDateSort">
                发布日期
                <view class="icon" v-if="activeButton === 'date'">
                    <uni-icons :type="dateSortAsc ? 'arrow-up' : 'arrow-down'" size="14" color="#28b389"></uni-icons>
                </view>
            </button>
        </view>
        <view class="right" @click="onChange">
            <uni-icons :type="settingsStore.switchViewIcon" size="18" color="#28b389"></uni-icons>
            <uni-icons :type="settingsStore.switchViewIcon" size="18" color="#28b389"></uni-icons>
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
    
    function onChange() {
        settingsStore.options.view = settingsStore.options.view === 'window' ? 'waterfall' : 'window';
        uni.setStorageSync('view', settingsStore.options.view);
    }
    
    function reset() {
        activeButton.value = '';
        dateSortAsc.value = true;
    }

    // 暴露方法给父组件
    defineExpose({
        reset
    });
</script>

<style lang="scss" scoped>
    .queryPanel {
        position: sticky;
        // top: v-bind('searchHeight + "px"');
        z-index: 10;
        background-color: #ffffff;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 2rpx 8rpx;
        border-top: 1rpx solid #e0e0e0;
        box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.06);

        .left {
            display: flex;

            button {
                font-size: 28rpx;
                padding: 10rpx 20rpx;
                border: none;
                border-radius: 20rpx;
                margin-right: 10rpx;
                display: flex;
                align-items: center;
                gap: 5rpx;
                transition: background-color 0.3s ease, color 0.3s ease;

                &.active {
                    color: #28b389;
                }
                .icon {
                    font-size: 24rpx;
                }
            }
        }

        .right {
            display: flex;
            align-items: center;

            uni-icons {
                padding-right: 28rpx;
            }
        }
    }
</style>
