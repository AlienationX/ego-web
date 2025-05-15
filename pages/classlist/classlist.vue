<template>
    <view class="layout">
        <view class="loadingLayout" v-if="!classList.length && !noData">
            <uni-load-more status="loading"></uni-load-more>
        </view>

        <view class="content">
            <navigator :url="'/pages/preview/preview?id='+item.id" class="item" v-for="item in classList"
                :key="item.id">
                <image :src="item.smallPicurl" mode="aspectFill"></image>
            </navigator>
        </view>

        <view class="loadingLayout" v-if="classList.length || noData">
            <uni-load-more :status="noData?'noMore':'loading'"></uni-load-more>
        </view>

        <!-- 安全区域，主要针对手机上的home键上方的区域 -->
        <view class="safe-area-inset-bottom"></view>
    </view>
</template>

<script setup>
    import {
        ref
    } from "vue";
    import {
        onLoad,
        onUnload,
        onReachBottom,
        onPullDownRefresh,
        onShareAppMessage,
        onShareTimeline
    } from "@dcloudio/uni-app";
    import {
        apiGetClassList,
        apiGetClassify
    } from "@/api/wallpaper.js";
    import {
        gotoHome,
        addSmallPicurl
    } from "@/utils/common.js";

    const classList = ref([]);
    const noData = ref(false);

    const queryParams = {
        pageNum: 1,
        pageSize: 12
    };


    const getClassList = async () => {
        let res = await apiGetClassList(queryParams);

        // 增加缩略图samllPicurl字段
        let fullData = res.data.map(item => addSmallPicurl(item))
          
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
        classList.value.push(...fullData); // 推荐该方法，不用重新赋值        

        if (queryParams.pageSize > res.data.length) {
            noData.value = true;
        }

        // 缓存数据
        uni.setStorageSync("wallList", classList.value);
    }

    // 分享需要使用该值
    let pageName;

    onLoad((e) => {
        // 页面加载完毕后，获取id。比较慢，推荐使用获取页面参数，可以在setup中直接使用
        // OnLoad要完于setup执行

        let {
            id,
            name
        } = e;

        // 如果bug进入没有参数的页面，默认返回首页，不关键
        if (!id) {
            gotoHome();
            return
        }

        queryParams.classify_id = parseInt(id);
        getClassList();

        pageName = name;

        // 动态设置分类列表的title
        uni.setNavigationBarTitle({
            title: name
        })
    })

    onUnload(() => {
        uni.removeStorageSync("wallList")
    })


    // 触底加载更多
    onReachBottom(() => {
        // 如果已经没有数据，不再出发接口调用
        if (noData.value) return;

        // 实现触底加载更多
        queryParams.pageNum++;
        getClassList();
    })

    // 下拉刷新
    onPullDownRefresh(() => {
        console.log("onPullDownRefresh");
        classList.value = [];
        uni.removeStorageSync("wallList")

        getClassList();

        // uni.hideNavigationBarLoading();
        uni.stopPullDownRefresh();
    })

    //分享给好友
    onShareAppMessage((e) => {
        return {
            title: "本我壁纸-ego: " + pageName,
            path: "/pages/classlist/classlist?id=" + queryParams.classid + "&name=" + pageName
        }
    })


    //分享朋友圈
    onShareTimeline(() => {
        return {
            title: "本我壁纸-ego: " + pageName,
            // query: "id=" + queryParams.classid + "&name=" + pageName
        }
    })
</script>

<style lang="scss" scoped>
    .layout {
        .content {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10rpx;
            padding: 10rpx;

            .item {
                height: 440rpx;

                image {
                    width: 100%;
                    height: 100%;
                    display: block;
                    border-radius: 10rpx;
                }
            }
        }
    }
</style>