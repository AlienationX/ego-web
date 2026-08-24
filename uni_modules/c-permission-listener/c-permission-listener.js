/**
 * @author cai
 * @time 2024-08-12 14:29
 * uni.createRequestPermissionListener()
 * 文档地址：https://uniapp.dcloud.net.cn/api/system/create-request-permission-listener.html
 * 注意：HBuilderX (4.0+) android 平台支持；HBuilderX 4.01 Vue2项目需要使用自定义基座测试监听权限申请的功能，标准基座暂不支持测试。
 */
// #ifndef APP
export default null;
// #endif
// #ifdef APP
import { drawView, hideView } from "./explain.js";
const { osName, romName } = uni.getSystemInfoSync();
let drawing = false;	// 是否正在绘画顶部说明
let permissionListener = null;
let permissionEnums = null;	// 权限枚举，包含名称和说明
let canRunListener = true;	// 是否可以执行所有监听方法
let showModaling = false;	// 是否正在显示showModal
let hasConfirm = false;		// 是否有权限弹窗（触发permissionListener.onConfirm这个回调）
let permissionNameList = [];	// 没有授权的权限列表
// 是安卓平台，同时有uni.createRequestPermissionListener这个api
if (osName === "android" && uni.createRequestPermissionListener) {
	permissionListener = uni.createRequestPermissionListener();
}

/**
 * @description 获取权限状态，值为true表示当前权限允许
 * @param {String} permissionName
 */
const getPermissionStatus = (permissionName) => {
	const permission = `android.permission.${permissionName}`;
	const MainActivity = plus.android.runtimeMainActivity();
	const status = MainActivity.checkSelfPermission(permission);
	return status == 0;
}

/**
 * @description 获取权限名称，例如android.permission.CAMERA，获取CAMERA
 * @param {String} fullPermissionName，权限全称，例如：android.permission.CAMERA
 */
const getPermissionName = (fullPermissionName) => {
	const stringToArray = fullPermissionName.split(".");
	return stringToArray[stringToArray.length - 1];
}

/**
 * @description 获取权限名称和说明，多个用“、”隔开
 */
const getNameExplain = () => {
	let nameList = [];
	let explainList = [];
	permissionNameList.map(item => {
		const currentKey = Object.keys(permissionEnums).find(key => key.includes(item.name));
		if (currentKey) {
			const permissionEnum = permissionEnums[currentKey];
			nameList.push(permissionEnum.name);
			explainList.push(permissionEnum.explain);
		}
	})
	nameList = [...new Set(nameList)];
	explainList = [...new Set(explainList)];
	return {
		name: nameList.join("、"),
		explain: explainList.join("；")
	}
}

/**
 * @description 监听申请系统权限
 */
const onRequest = () => {
	permissionListener.onRequest((e) => {
		console.log("permissionListener.onRequest回调：", e);
		showModaling = false;	// 是否正在显示showModal
		hasConfirm = false;		// 是否有权限弹窗（触发permissionListener.onConfirm这个回调）
		permissionNameList = [];	// 没有授权的权限列表
		e = e || [];
		e.map(item => {
			const name = getPermissionName(item);
			const hasName = permissionNameList.find(item => item.name === name);
			// 当前权限不是允许的，同时列表没有当前权限才需要添加进去
			if (!getPermissionStatus(name) && !hasName) {
				permissionNameList.unshift({
					name,
					status: null
				});
			}
		})
		console.log("没有授权的权限名称列表：", permissionNameList);
	});
}

/**
 * @description 监听弹出系统权限授权框
 */
const onConfirm = () => {
	permissionListener.onConfirm((e) => {
		console.log("permissionListener.onConfirm回调：", e);
		e = e || [];
		let nameList = [];
		const harmonyRefusePermission = uni.getStorageSync("harmony-refuse-permission") || [];
		e.map(item => {
			const name = getPermissionName(item);
			nameList.push(name);
		})
		/**
		 * @description 非纯血鸿蒙（可以安装apk），权限被永久拒绝，官方还是走onConfirm回调（是个bug）
		 * 纯血鸿蒙不会返回romName
		 */
		// onConfirm回调的权限列表都包含在harmonyRefusePermission里面
		const hasAll = nameList.every(item => harmonyRefusePermission.includes(item));
		if (romName === "HarmonyOS" && hasAll) {
			hasConfirm = false;
		} else {
			hasConfirm = true;
		}
		/**
		 * @description 满足条件绘画顶部权限说明
		 * permissionNameList.length > 0，没有授权的列表大于0
		 * hasConfirm，有触发onConfirm
		 * getNameExplain().name，权限名称有值
		 */
		if (permissionNameList.length > 0 && hasConfirm && getNameExplain().name) {
			drawView({
				title: `${getNameExplain().name}权限使用说明`,
				content: `将获取${getNameExplain().name}权限，用于${getNameExplain().explain}`
			}, {
				start: () => {
					// 开始绘画
					drawing = true;
				},
				success: () => {
					// 绘画结束
					drawing = false;
				}
			});
		}
	});
}

/**
 * @description 监听权限申请完成
 */
const onComplete = () => {
	permissionListener.onComplete((e) => {
		console.log("permissionListener.onComplete回调：", e);
		e = e || [];
		if (e.length === 0) return;
		let harmonyRefusePermission = uni.getStorageSync("harmony-refuse-permission") || [];
		e.map(item => {
			const name = getPermissionName(item);
			const status = getPermissionStatus(name);
			const nameIndex = permissionNameList.findIndex(item => item.name === name);
			if (nameIndex > -1) {
				permissionNameList[nameIndex].status = status;
			}
			/**
			 * @description 非纯血鸿蒙（可以安装apk），权限被永久拒绝，官方还是走onConfirm回调（是个bug）
			 * 纯血鸿蒙不会返回romName
			 */
			if (romName === "HarmonyOS") {
				// 权限状态不是允许的
				if (!status && !harmonyRefusePermission.includes(name)) {
					harmonyRefusePermission.push(name);
				}
				// 权限状态是允许的
				if (status && harmonyRefusePermission.includes(name)) {
					const spliceIndex = harmonyRefusePermission.findIndex(item => item === name);
					harmonyRefusePermission.splice(spliceIndex, 1);
				}
			}
		})
		uni.setStorageSync("harmony-refuse-permission", harmonyRefusePermission);
		// 所有权限是否都拒绝，item.status === false不能改为!item.status，因为item.status默认为null
		const allRefused = permissionNameList.every(item => item.status === false);
		/**
		 * @description 所有权限都被拒绝后模态窗提示用户去设置
		 * allRefused，所有权限都被拒绝
		 * !showModaling，当前没有模态窗
		 * !hasConfirm，没有触发permissionListener.onConfirm回调
		 * getNameExplain().name，权限名称有值
		 * permissionNameList.length > 0，没有授权的列表大于0
		 */
		if (allRefused && !showModaling && !hasConfirm && getNameExplain().name && permissionNameList.length > 0) {
			showModaling = true;
			let content = "";
			content = `开启${getNameExplain().name}权限后，才能${permissionNameList.length > 1 ? "使用相关功能" : getNameExplain().explain}`;
			uni.showModal({
				content,
				showCancel: true,
				title: "温馨提示",
				confirmText: "去设置",
				success: (res) => {
					if (res.confirm) {
						uni.openAppAuthorizeSetting();
					}
				}
			})
			return;
		}
		hideView();
		drawing = false;
	});
}

/**
 * @description 监听权限方法
 * @example
	const permissionParams = {
		"ACCESS_COARSE_LOCATION": {		// 取android.permission.ACCESS_COARSE_LOCATION后面那个
			name: "定位",	// 当前权限是什么名称
			explain: "展示附近店铺、填写收货地址等相关功能"		// 权限说明
		},
	}
 */
const listenerFunc = (permissionParams) => {
	if (!permissionParams) return;
	permissionEnums = permissionParams;
	if (canRunListener && permissionListener) {
		console.log("执行listenerFunc()方法");
		canRunListener = false;
		// 监听申请系统权限
		onRequest();
		// 监听弹出系统权限授权框
		onConfirm();
		// 监听权限申请完成
		onComplete();
	}
} 

/**
 * @description 取消所有监听方法
 */
const stopFunc = () => {
	// drawing为正在绘画顶部，
	if (permissionListener && !drawing) {
		console.log("执行stopFunc()方法");
		canRunListener = true;
		hideView();
		drawing = false;
		permissionListener.stop();
	}
}

let exportObj = null;
if (permissionListener) {
	exportObj = {
		listenerFunc,
		stopFunc
	};
} else {
	exportObj = null;
}

export default exportObj;
// #endif