## 欢迎使用 c-permission-listener

![downloads](https://img.shields.io/npm/dt/c-permission-listener?color=red&label=npm%E4%B8%8B%E8%BD%BD%E9%87%8F)
> ⚠ **注意事项**  
> 🚀 **按需增加相对应权限，在 manifest.json 中添加，记得重新打自定义基座包**  
> 🚀 **HBuilderX 4.01 Vue2项目需要使用自定义基座测试监听权限申请的功能，标准基座暂不支持测试。**  
> 🚀 **uni.previewImage使用原生的，plus.nativeObj.View覆盖不了；解决方案一：uni.previewImage换成插件；解决方案二：调用uni.previewImage前，提前使用plus.android.requestPermissions请求相关的权限。类似的可以使用上述的两种解决方案**  
> 🚀 **拨打电话需要添加两个权限READ_PHONE_STATE、CALL_PHONE**  
> 🚀 **存储权限在原来的WRITE_EXTERNAL_STORAGE和READ_EXTERNAL_STORAGE两个权限上，记得同时加上相对应的最新权限，做兼容处理，具体看Android权限文档；访问图片权限：READ_MEDIA_IMAGES, 读取视频权限：READ_MEDIA_VIDEO, 读取音频权限：READ_MEDIA_AUDIO**  
---  
> 🔍 **相关文档、文章**  
> 🚀 **安卓离线打包方法：[https://ask.dcloud.net.cn/article/41380](https://ask.dcloud.net.cn/article/41380)**  
> 🚀 **uniapp官方权限文档：[https://uniapp.dcloud.net.cn/tutorial/app-permission-android.html#default](https://uniapp.dcloud.net.cn/tutorial/app-permission-android.html#default)**  
> 🚀 **Android权限文档：[https://developer.android.google.cn/reference/android/Manifest.permission](https://developer.android.google.cn/reference/android/Manifest.permission)**  
> 🚀 **把文章修改成插件，原文：[https://ask.dcloud.net.cn/article/41194](https://ask.dcloud.net.cn/article/41194)**  

### 安装
```javascript
// npm安装方式，插件市场导入无需执行此命令。插件市场导入地址：https://ext.dcloud.net.cn/plugin?name=c-permission-listener
npm install c-permission-listener
```

### 使用方法
在`App.vue`文件添加下列代码：
```javascript
<script>
	// 以下导入方式按照安装方式导入
	import permissionListener from "@/uni_modules/c-permission-listener";		// 插件市场导入方法
	import permissionListener from "c-permission-listener";		// npm导入方法
	export default {
		onLaunch: function() {
			console.log('App Launch')
			// 如果想让listenerFunc函数在onLaunch生命周期执行，那onHide生命周期就不执行stopFunc函数，有没有bug需要测试下
		},
		onShow: function() {
			console.log('App Show')
			// permissionEnums枚举建议单独一个js文件，然后引入
			const permissionEnums = {
				// 取android.permission.ACCESS_COARSE_LOCATION后面那个
				"ACCESS_COARSE_LOCATION": {
					name: "定位",	// 当前权限的名称
					explain: "展示附近店铺、填写收货地址等相关功能"		// 权限说明
				},
				"CALL_PHONE,READ_PHONE_STATE": {
					name: "电话",	// 当前权限的名称
					explain: "拨打电话"		// 权限说明
				},
				"WRITE_EXTERNAL_STORAGE,READ_EXTERNAL_STORAGE,READ_MEDIA_IMAGES": {
					name: "存储",	// 当前权限的名称
					explain: "上传头像完善个人信息"		// 权限说明
				}
			}
			// 唤起权限会触发onHide，所以listenerFunc须在onShow生命周期调用
			permissionListener && permissionListener.listenerFunc(permissionEnums);
		},
		onHide: function() {
			console.log('App Hide')
			permissionListener && permissionListener.stopFunc();
		}
	}
</script>
```
