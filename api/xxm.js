const BASE_URL = 'https://tea.qingnian8.com/api/bizhi';

function request(config = {}) {
    let {
        url,
        data = {},
        method = "GET",
        header = {}
    } = config

    url = BASE_URL + url;
    header['access-key'] = "xxm123321@#";
    header['token'] = "secret...xzcvsdfall;akdl;fasdfadsfgasd";

    return new Promise((resolve, reject) => {
        uni.request({
            url,
            data,
            method,
            header,
            success: res => {
                // console.log("xxm request >>>", res);
                if (res.data.errCode === 0) {
                    resolve(res.data)  // 只有状态为0才是请求真正成功

                    // 可以将返回结果再度封装
                    // resolve({
                    //     code: 0,
                    //     msg: "ok",
                    //     data: res.data
                    // })
                } else if (res.data.errCode === 400) {
                    uni.showModal({
                        title: "错误提示",
                        content: res.data.errMsg,
                        showCancel: false
                    })
                    reject(res.data) // 强制接口报错
                } else {
                    uni.showToast({
                        title: res.data.errMsg,
                        icon: "none"
                    })
                    reject(res.data) // 强制接口报错
                }
            },
            fail: err => {
                reject(err)
            }
        })
    })
}


export const apiGetBanner = () => {
    return request({
        url: "/homeBanner"
    })
}

export const apiGetDayRandom = () => {
    return request({
        url: "/randomWall"
    })

}

export const apiGetNotice = (data = {}) => {
    return request({
        url: "/wallNewsList",
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
        url: "/wallList",
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