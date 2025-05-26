export function compareTimestamp(timestamp) {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - timestamp;

    if (timeDiff < 60000) {
        return '1分钟内';
    } else if (timeDiff < 3600000) {
        return Math.floor(timeDiff / 60000) + '分钟';
    } else if (timeDiff < 86400000) {
        return Math.floor(timeDiff / 3600000) + '小时';
    } else if (timeDiff < 2592000000) {
        return Math.floor(timeDiff / 86400000) + '天';
    } else if (timeDiff < 7776000000) {
        return Math.floor(timeDiff / 2592000000) + '月';
    } else {
        return null;
    }
}

export function picurlHandle(item, prefix) { 
    // 1. 给 url 字段添加前缀。wall数据增加额外字段，前端处理，减少后端流量消耗
    const prefixedUrl = `${prefix}/${item.picurl}`;
    
    // 2. 生成 smallPicurl 存储小图片（基于添加前缀后的完整 URL）
    const smallPicurl = prefixedUrl.replace('.jpg', '_small.webp');

    // 返回新对象（保留原字段(覆盖原字段) + 新增字段）
    return {
        ...item,
        picurl: prefixedUrl,  // 覆盖原始的picurl数据
        smallPicurl
    };
}

export function gotoHome() {
    uni.showModal({
        title: "提示",
        content: "页面有误将返回首页",
        showCancel: false,
        success: (res) => {
            if (res.confirm) {
                uni.reLaunch({
                    url: "/pages/index/index"
                })
            }
        }
    })
}