/**
 * 绘画顶部权限说明
 * 文档地址：https://www.html5plus.org/doc/zh_cn/nativeobj.html
 * @function drawView title标题，content描述使用说明
 * @function hideView 隐藏顶部权限说明
 */
let view = null;
export const drawView = ({ title, content }, params = {}) => {
	console.log("drawView方法的参数值：", title, content);
	if (view || !title || !content) return;		// 没有标题和内容则return出去
	params.start && params.start();
	const { windowTop, windowWidth, statusBarHeight } = uni.getSystemInfoSync();
	const topHeight = windowTop + statusBarHeight;
	const distance = {
		box: 10,	// 盒子距离视图两边的距离
		text: 20	// 文字距离视图两边的距离
	}
	// 标题的相关样式
	const titleStyle = {
		size: 16,
		height: 16,
		top: `${topHeight + 22}`,
		color: "#000",
	}
	// 内容的相关样式
	const contentStyle = {
		size: 14,
		height: 0,
		top: `${parseInt(titleStyle.top) + titleStyle.height + 6}`,
		color: "#656563",
	}
	const contentLength = content.length;	// 权限说明内容文字长度
	const contentWidth = windowWidth - distance.text * 2;	// 内容的宽度
	const contentRowCount = Math.floor(contentWidth / contentStyle.size);	// 一行占几个文字
	const contentRows = Math.ceil(contentLength / contentRowCount);		// 当前内容占几行
	contentStyle.height = contentRows * (contentStyle.size + 4);	// 内容的高度
	/**
	 * @description 计算盒子的高度
	 * 获取content到盒子顶部距离：parseInt(contentStyle.top) - topHeight - distance.box
	 * content的高度：contentStyle.height
	 * 获取content到盒子底部的距离：(distance.text - distance.box)
	 */
	const boxHeight = (parseInt(contentStyle.top) - topHeight - distance.box) + contentStyle.height + (distance.text - distance.box);
	view = new plus.nativeObj.View('per-modal', {
		top: '0',
		left: '0',
		width: '100%',
		backgroundColor: 'rgba(0,0,0,0.2)'
	})
	view.drawRect({
		color: '#fff',
		radius: '5px',
	}, {
		top: `${topHeight + distance.box}px`,
		left: `${distance.box}px`,
		right: `${distance.box}px`,
		height: `${boxHeight}px`
	})
	view.drawText(title, {
		top: `${titleStyle.top}px`,
		left: `${distance.text}px`,
		right: `${distance.text}px`,
		height: "wrap_content"
	}, {
		size: `${titleStyle.size}px`,
		align: "left",
		color: titleStyle.color,
		weight: "bold"
	})
	view.drawText(content, {
		top: `${contentStyle.top}px`,
		left: `${distance.text}px`,
		right: `${distance.text}px`,
		height: "wrap_content"
	}, {
		size: `${contentStyle.size}px`,
		lineSpacing: "2px",
		align: "left",
		color: contentStyle.color,
		verticalAlign: "top",
		whiteSpace: "normal"
	})
	let timer = setTimeout(() => {
		view && view.show();
		params.success && params.success();
		clearTimeout(timer);
		timer = null;
	}, 200)
}

// 关闭顶部权限说明
export const hideView = () => {
	if (view) {
		view.hide();
		view = null;
	}
}