<template>
    <view class="layout">
        <query-panel v-if="classList.length" @onQuery="onQuery" />

        <!-- <view class="content">
            <navigator :url="'/pages/preview/preview?id='+item.id" class="item" v-for="item in classList"
                :key="item.id">
                <image :src="item.smallPicurl" mode="aspectFill"></image>
            </navigator>
        </view> -->
        
        <!-- <window-view :classList="classList"></window-view> -->
    
        <!-- 使用v-if切换会重新渲染 waterfall-view 并返回到顶部，所以封装到一个组件中 pics-view -->
        <!-- <window-view v-if="settingsStore.options.view === 'window'" :classList="classList"></window-view>
        <waterfall-view v-else :classList="classList"></waterfall-view> -->
        
        
        <pics-view :classList="classList"></pics-view>
        
        <view class="loadingLayout" v-show="noData || isRunning">
            <uni-load-more :status="noData ? 'noMore' : 'loading'"></uni-load-more>
        </view>

        <back-to-top ref="backToTopRef"></back-to-top>

        <!-- 安全区域，主要针对手机上的home键上方的区域 -->
        <view class="safe-area-inset-bottom"></view>
    </view>
</template>

<script setup>
    import { ref, reactive } from 'vue';
    import { onLoad, onUnload, onReachBottom, onPullDownRefresh, onPageScroll, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
    import { apiGetClassList, apiGetClassify } from '@/api/wallpaper.js';
    import { gotoHome, handlePicUrl } from '@/utils/common.js';
    import { useSettingsStore } from '@/stores/settings.js';

    const settingsStore = useSettingsStore();

    const picsViewRef = ref(null);
    const backToTopRef = ref(null);

    // 正在执行
    const isRunning = ref(false);
    // 没有更多
    const noData = ref(false);

    // 搜索结果最终展示列表
    const classList = ref([]);
    // 搜索结果临时列表，主要是为了解决 filter 按钮切换导致 图片列表 有1秒的空白的问题
    const pendingList = ref([]);

    // UniApp 会将 URL 中的参数自动注入到 props
    const props = defineProps({
        id: String, // 分类id
        name: String // 分类名称
    });

    const queryParams = ref({
        classify_id: parseInt(props.id),
        pageNum: 1,
        pageSize: 12,
        // keyword: '',
        sortord: ''
    });

    const init = (sortord = '', resetClassList = new Array()) => {
        queryParams.value = {
            classify_id: parseInt(props.id),
            pageNum: 1,
            pageSize: 12,
            // keyword: keyword,
            sortord: sortord
        };
        noData.value = false;
        classList.value = resetClassList;
    };

    const getClassList = async () => {
        try {
            uni.showLoading(); // 屏幕中间黑方框中间转圈效果
            isRunning.value = true;

            let res = await apiGetClassList(queryParams.value);

            // 增加缩略图samllPicurl字段
            let fullData = res.data.map((item) => handlePicUrl(item));

            // // 两表关联增加 classify_name 用来显示
            // let classRes = await apiGetClassify();
            // // 1. 将listA转换为Map，键为classid，值为对象
            // const classMap = new Map(classRes.data.map(item => [item.id, item]));
            // // 2. 遍历listB，通过Map关联数据
            // fullData = fullData.map(item => {
            //   const matchedClass = classMap.get(item.classify_id);
            //   return { ...item, classify_name:matchedClass.name };
            // })

            // classList.value = [...classList.value, ...res.data];
            // classList.value.push(...fullData); // 推荐该方法，不用重新赋值
            pendingList.value.push(...fullData);
            classList.value = [...pendingList.value];

            // isRunning.value = false;
            if (queryParams.value.pageSize > res.data.length) noData.value = true;

            // 缓存数据
            uni.setStorageSync('wallList', classList.value);
        } finally {
            uni.hideLoading();
        }
    };

    // 传递给query-panel的方法，供子组件调用
    const onQuery = (sortord) => {
        // order by 字段：random / score / date_asc /date_desc
        init(sortord, [...pendingList.value]);
        pendingList.value = [];
        getClassList();
        backToTopRef.value.scrollToTop();
    };

    onLoad((e) => {
        // 页面加载时，获取id。比较慢，推荐使用获取页面参数，可以在setup中直接使用

        // OnLoad要晚于setup执行,但是setup有时执行太快，所以在这里动态设置分类列表的title
        uni.setNavigationBarTitle({
            title: props.name
        });

        // console.log('解析url传入的参数，比如：?id=5&name=明星美女', e);
        let { id, name } = e;

        // 如果bug进入没有参数的页面，默认返回首页，不关键
        if (!id) {
            gotoHome();
            return;
        }

        getClassList();
    });

    onUnload(() => {
        uni.removeStorageSync('wallList');
    });

    // 触底加载更多
    onReachBottom(() => {
        // 如果已经没有数据，不再出发接口调用
        if (noData.value) return;

        // 实现触底加载更多
        queryParams.value.pageNum++;
        getClassList();
    });

    // 下拉刷新
    onPullDownRefresh(() => {
        console.log('onPullDownRefresh');
        classList.value = [];
        uni.removeStorageSync('wallList');

        getClassList();

        // uni.hideNavigationBarLoading();
        uni.stopPullDownRefresh();
    });

    onPageScroll((e) => {
        backToTopRef.value.showBackToTop = e.scrollTop > 200; // 当滚动距离超过200px时显示按钮
    });

    //分享给好友
    onShareAppMessage((e) => {
        return {
            title: '本我壁纸: ' + props.name,
            path: '/pages/classlist/classlist?id=' + queryParams.value.classify_id + '&name=' + props.name
        };
    });

    //分享朋友圈
    onShareTimeline(() => {
        return {
            title: '本我壁纸: ' + props.name
            // query: "id=" + queryParams.value.classify_id + "&name=" + props.name
        };
    });
</script>

<style lang="scss" scoped>
    .layout {
    }
</style>
