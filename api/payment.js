import { request } from "@/api/request";

// 获取商品列表（无需登录）
export const apiGetPaymentProducts = () => {
    return request({
        url: "/payment/products/",
        method: "GET",
    });
};

/**
 * 支付宝 App 支付下单
 * @param {Object} data
 * @param {number} data.product_id  商品ID
 * @param {string} data.platform    平台（app / mp-weixin / h5）
 * @returns {{ order_no, order_string }} order_string 直接传给 uni.requestPayment()
 */
export const apiAlipayOrder = (data) => {
    return request({
        url: "/payment/alipay/",
        method: "POST",
        data,
        isAuth: true,
    });
};

/**
 * 查询订单状态
 * @param {string} orderNo 订单号
 * @returns {{ order_no, status }}  status: pending / paid / failed / refunded
 */
export const apiGetOrderStatus = (orderNo) => {
    return request({
        url: `/payment/status/${orderNo}/`,
        method: "GET",
        isAuth: true,
    });
};

/**
 * [测试专用] 一键模拟付款成功
 * @param {string} orderNo 订单号
 */
export const apiMockPay = (orderNo) => {
    return request({
        url: `/payment/mock_pay/${orderNo}/`,
        method: "POST",
    });
};
