
// 权限枚举
// https://developer.android.google.cn/reference/android/Manifest.permission

export const permissionEnums = {
    // 取android.permission.ACCESS_COARSE_LOCATION后面那个
    // "ACCESS_COARSE_LOCATION": {
    //     name: "定位", // 当前权限的名称
    //     explain: "展示附近店铺、填写收货地址等相关功能"       // 权限说明
    // },
    // "CALL_PHONE,READ_PHONE_STATE": {
    //     name: "电话", // 当前权限的名称
    //     explain: "拨打电话"     // 权限说明
    // },
    
    // CALL_PHONE: 拨打电话
    // ACCESS_COARSE_LOCATION: 访问粗略定位
    // WRITE_CALENDAR: 写入日历事件
    // READ_MEDIA_IMAGES: 读取相册图片
    // READ_MEDIA_VIDEO: 读取相册视频
    // READ_MEDIA_AUDIO: 读取相册音频

    "WRITE_EXTERNAL_STORAGE": {
        // 提示：${name}权限使用说明
        // 将获取${name}权限，用于${explain}
        name: "存储", // 当前权限的名称, 
        explain: "下载壁纸到本地存储"       // 权限说明
    },
    "CAMERA": {
        name: "相机",
        explain: "拍照上传图片进行反馈和沟通"
    },
    "READ_MEDIA_IMAGES": {
        name: "相册",
        explain: "上传图片进行反馈和沟通"
    }
}