// const BASE_URL = 'http://localhost:8000/wallpaper/api';
const BASE_URL = 'https://49touviwp7.execute-api.eu-north-1.amazonaws.com/dev/wallpaper/api';

function request(config = {}) {
    let {
        url,
        data = {},
        method = "GET",
        // timeout =  10000,  // 10秒
        header = {}
    } = config

    url = BASE_URL + url;
    header['Access-Key'] = "secret-insecure-88hefbf6c!mrv5x(xa4swy-h3y41f()(8xh6syj(xi&m!!h$#b";
    header['Token'] = "secret...xzcvsdfall;akdl;fasdfadsfgasd";

    return new Promise((resolve, reject) => {
        uni.request({
            url,
            data,
            method,
            header,
            success: res => {
                // console.log("wallpaper request >>>", res);
                if (res.data.code === 200) {
                    resolve(res.data) // 只有状态为200才是请求真正成功
                } else {
                    // 白色模态框
                    uni.showModal({
                        title: "错误提示",
                        content: res.data.message,
                        showCancel: false
                    })
                    // 灰色透明框
                    // uni.showToast({
                    //     title: res.data.message,
                    //     icon: "none"
                    // })
                    reject(res.data) // 强制接口报错
                }
            },
            fail: err => {
                reject(err)
            }
        })
    })
}


export const apiGetUserInfo = (id = "") => {
    return request({
        url: `/user/${id}`
    })
}

export const apiGetBanner = () => {
    return request({
        url: "/banner"
    })
}

export const apiGetDayRandom = () => {
    return request({
        url: "/wall/random"
    })

}

export const apiGetNotice = (data = {}) => {
    return request({
        url: "/notice",
        data
    })
}

export const apiGetNoticeDetail = (data = {}, id = "") => {
    return request({
        // 多一个id的判断，其实可以统一成一个接口
        url: id ? `/notice/${id}` : "/notice",
        data
    })
}


export const apiGetClassify = (data = {}) => {
    // 获取分类
    return request({
        url: "/classify",
        data
    })
}

export const apiGetClassList = (data = {}) => {
    // 获取分类列表，也就是分类下的所有图片
    return request({
        url: "/wall/",
        data
    })
}

export const apiSearchData = (data = {}) => {
    // 获取搜索数据
    return request({
        url: "/wall/search/",
        data
    })
}

export const apiGetSetupScore = (data = {}) => {
    // 图片评分接口，该接口根据ip验证是否已经打过分了
    return request({
        url: "/setupScore",
        data
    })
}
