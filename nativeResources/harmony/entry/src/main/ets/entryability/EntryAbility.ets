import { UniEntryAbilityDev, uni } from "@dcloudio/uni-app-runtime";
import { initUniModules } from "../uni_modules/index.generated";
import BuildProfile from "BuildProfile";
import * as hmr from '@uni_modules/hmr-for-uni-app'
import window from '@ohos.window';
import Want from '@ohos.app.ability.Want';
import AbilityConstant from '@ohos.app.ability.AbilityConstant';
import hilog from '@ohos.hilog';
import dataPreferences from '@ohos.data.preferences';

class CardPrefOptions implements dataPreferences.Options {
  name: string = 'ego_card_deeplink';
}

initUniModules();

const UNI_APPID = "__UNI__098B24F";

export default class EntryAbility extends UniEntryAbilityDev {
  constructor() {
    super(UNI_APPID, {
      debug: BuildProfile.DEBUG,
    });
  }

  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    super.onCreate(want, launchParam);
    this.saveCardDeepLink(want);
  }

  onNewWant(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    super.onNewWant(want, launchParam);
    this.saveCardDeepLink(want);
  }

  private saveCardDeepLink(want: Want): void {
    try {
      if (!want || !want.parameters) return;

      hilog.info(0x0000, 'EntryAbility', `saveCardDeepLink want.parameters: ${JSON.stringify(want.parameters)}`);

      const rawParams = want.parameters['params'];
      let wallId = '';
      let targetPage = '';
      let uri = '';

      if (rawParams != null) {
        let paramObj: Record<string, Object> = {};
        if (typeof rawParams === 'string') {
          try {
            paramObj = JSON.parse(rawParams) as Record<string, Object>;
          } catch (e) {
            paramObj = {};
          }
        } else {
          paramObj = rawParams as Record<string, Object>;
        }

        if (paramObj['wallId'] != null) {
          wallId = String(paramObj['wallId']);
        } else if (paramObj['id'] != null) {
          wallId = String(paramObj['id']);
        }
        if (paramObj['targetPage'] != null) {
          targetPage = String(paramObj['targetPage']);
        }
        if (paramObj['uri'] != null) {
          uri = String(paramObj['uri']);
        }
      }

      if (!wallId && want.parameters['wallId'] != null) {
        wallId = String(want.parameters['wallId']);
      }
      if (!wallId && want.parameters['id'] != null) {
        wallId = String(want.parameters['id']);
      }
      if (!targetPage && want.parameters['targetPage'] != null) {
        targetPage = String(want.parameters['targetPage']);
      }
      if (!uri && want.parameters['uri'] != null) {
        uri = String(want.parameters['uri']);
      }

      if (!wallId && uri.length > 0) {
        const idMatch = uri.match(/[?&]id=(\d+)/);
        if (idMatch && idMatch[1]) {
          wallId = idMatch[1];
        }
      }

      hilog.info(0x0000, 'EntryAbility', `saveCardDeepLink parsed => wallId=${wallId}, targetPage=${targetPage}, uri=${uri}`);

      if (!wallId && !targetPage && !uri) return;

      // 1. 同步写入 Preferences，供 UTS 模块读取
      const options = new CardPrefOptions();
      const pref = dataPreferences.getPreferencesSync(this.context, options);
      pref.putSync('wallId', wallId);
      pref.putSync('targetPage', targetPage);
      pref.putSync('uri', uri);
      pref.flush();

      hilog.info(0x0000, 'EntryAbility', `saveCardDeepLink saved to preferences`);

      // 2. 双保险：在原生层尝试触发 uni.navigateTo 路由
      if (wallId.length > 0 || targetPage.length > 0) {
        const urlToNav = wallId.length > 0 ? `/pages/app/preview?id=${wallId}` : targetPage;
        const tryNavigate = (delay: number) => {
          setTimeout(() => {
            try {
              uni.navigateTo({
                url: urlToNav,
                fail: (err: Object) => {
                  hilog.warn(0x0000, 'EntryAbility', `uni.navigateTo to ${urlToNav} failed (may retry): ${JSON.stringify(err)}`);
                }
              });
            } catch (e) {
              hilog.error(0x0000, 'EntryAbility', `uni.navigateTo error: ${JSON.stringify(e)}`);
            }
          }, delay);
        };

        tryNavigate(400);
        tryNavigate(900);
        tryNavigate(1500);
      }
    } catch (e) {
      hilog.error(0x0000, 'EntryAbility', `saveCardDeepLink error: ${JSON.stringify(e)}`);
    }
  }

  onWindowStageCreate(windowStage: window.WindowStage) {
    super.onWindowStageCreate(windowStage)
    hmr.init(UNI_APPID);
  }
}
