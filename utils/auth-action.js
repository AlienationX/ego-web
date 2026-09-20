import { useUserStore } from '@/stores/user.js';
import { useAppStore } from '@/stores/app.js';
import { isNewUserFreeBenefitAvailable, consumeNewUserFreeDownload } from '@/utils/benefit.js';

/**
 * 统一权限检查与动作执行器（VIP极速放行 -> 新人特权 -> 扣能量 -> 广告与VIP 4矩阵判定）
 * 
 * 广泛适用于：拼图保存、磨砂伴侣导出、时钟样式解锁等系统创作功能与高精资源下载
 * 
 * @param {Object} options
 * @param {Object} options.adPopup - popup-ad-prompt 组件实例（即 adPopup.value）
 * @param {number} [options.wallId=0] - 关联壁纸ID或创作资源ID
 * @param {string} [options.actionType='consume_feature'] - 能量消耗动作标识
 * @param {number} [options.costEnergy=1] - 所需消耗的能量点数，默认 1
 * @param {boolean} [options.allowNewUserBenefit=false] - 是否允许使用新人免广告下载特权，默认 false
 * @param {Function} options.onSuccess - 验证通过/扣能量完成/广告看完后的成功回调: ({ type, message }) => void
 * @param {Object} [options.customConfig] - 自定义弹窗标题及提示文案配置
 * @param {string} [options.customConfig.title] - 弹窗标题
 * @param {string} [options.customConfig.desc] - 弹窗提示文案
 * @param {string} [options.customConfig.adBtnText] - 广告按钮文本
 * @param {string} [options.customConfig.vipBtnText] - VIP按钮文本
 * @param {string} [options.customConfig.vipSuccessTip] - VIP免广告免点数通过提示
 * @param {string} [options.customConfig.energySuccessTip] - 消耗能量成功提示
 * @param {string} [options.customConfig.adSuccessTip] - 看完广告成功提示
 */
export async function executeWithAuth(options = {}) {
    const {
        adPopup,
        wallId = 0,
        actionType = 'consume_feature',
        costEnergy = 1,
        allowNewUserBenefit = false,
        onSuccess,
        customConfig = {},
    } = options;

    const userStore = useUserStore();
    const appStore = useAppStore();

    // 0. 最高优先级：VIP 用户无视广告与点数，直接极速通过
    if (userStore.isVip) {
        onSuccess?.({
            type: 'vip',
            message: customConfig.vipSuccessTip || 'VIP 专属极速畅享',
        });
        return;
    }

    // 0.1 新人免广告特权判定（如果启用）
    if (allowNewUserBenefit && isNewUserFreeBenefitAvailable()) {
        const remainingAfter = consumeNewUserFreeDownload();
        const tip = remainingAfter > 0
            ? `新人专属免广告特权已生效（剩余${remainingAfter}次）`
            : '新人专属免广告特权已生效';
        onSuccess?.({
            type: 'new_user',
            message: tip,
        });
        return;
    }

    // 1. 点数扣除：已登录且能量充足 (energy >= costEnergy)，优先扣除能量
    if (userStore.isLoggedIn && (userStore.energy || 0) >= costEnergy) {
        uni.showLoading({ title: '正在处理...', mask: true });
        try {
            const res = await userStore.consumeEnergy(wallId, actionType);
            uni.hideLoading();
            if (res?.data?.error) {
                uni.showToast({ title: res.data.error, icon: 'none' });
                // 扣除异常或不足时，继续转入广告与 VIP 4 矩阵判定
            } else {
                onSuccess?.({
                    type: 'energy',
                    message: customConfig.energySuccessTip || `已消耗 ${costEnergy} 点能量`,
                });
                return;
            }
        } catch (e) {
            uni.hideLoading();
            console.error('扣除能量异常:', e);
        }
    }

    // 2. 能量不足或未登录：广告与支付 4 矩阵判定
    const adEnabled = appStore.versionConfig?.ad_enabled !== false;
    const payEnabled = appStore.versionConfig?.pay_enabled !== false;

    // 2.1 【有广告 + 有支付】 -> 弹出看广告主按钮 + VIP 次要选项
    if (adEnabled && payEnabled) {
        if (adPopup) {
            adPopup.open({
                title: customConfig.title || (userStore.isLoggedIn ? '能量不足' : '解锁功能'),
                desc: customConfig.desc || (userStore.isLoggedIn
                    ? '您的能量不足，观看一段视频广告即可免费体验，或开通 VIP 享受无限制极速畅享。'
                    : '观看一段视频广告即可免费体验，或开通 VIP 享受无限制极速畅享。'),
                showAdBtn: true,
                adBtnText: customConfig.adBtnText || '看广告免费解锁',
                showVipBtn: true,
                vipBtnText: customConfig.vipBtnText || '开通 VIP 畅享',
                onAdSuccess: async () => {
                    onSuccess?.({
                        type: 'ad',
                        message: customConfig.adSuccessTip || '广告解锁成功',
                    });
                },
            });
        }
        return;
    }

    // 2.2 【有广告 + 无支付】 -> 仅弹出看广告免费解锁按钮
    if (adEnabled && !payEnabled) {
        if (adPopup) {
            adPopup.open({
                title: customConfig.title || '观看广告解锁',
                desc: customConfig.desc || '观看一段视频广告即可免费体验该功能。',
                showAdBtn: true,
                adBtnText: customConfig.adBtnText || '看广告免费解锁',
                showVipBtn: false,
                onAdSuccess: async () => {
                    onSuccess?.({
                        type: 'ad',
                        message: customConfig.adSuccessTip || '广告解锁成功',
                    });
                },
            });
        }
        return;
    }

    // 2.3 【无广告 + 有支付】 -> 仅弹出开通 VIP 按钮
    if (!adEnabled && payEnabled) {
        if (adPopup) {
            adPopup.open({
                title: customConfig.title || '开通会员解锁',
                desc: customConfig.desc || '当前需开通 VIP 会员即可解锁体验该功能。',
                showAdBtn: false,
                showVipBtn: true,
                vipBtnText: customConfig.vipBtnText || '立即开通 VIP',
            });
        }
        return;
    }

    // 2.4 【无广告且无支付】 -> 兜底直接放行
    onSuccess?.({
        type: 'direct',
        message: '',
    });
}
