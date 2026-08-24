import formInfo from '@ohos.app.form.formInfo';
import formBindingData from '@ohos.app.form.formBindingData';
import FormExtensionAbility from '@ohos.app.form.FormExtensionAbility';
import formProvider from '@ohos.app.form.formProvider';
import http from '@ohos.net.http';
import Want from '@ohos.app.ability.Want';
import hilog from '@ohos.hilog';
import fs from '@ohos.file.fs';
import util from '@ohos.util';
import { BusinessError } from '@ohos.base';

const DOMAIN = 0x0000;
const TAG = 'EgoWidgetForm';
const BASE_API_URL = 'https://api.wp.ego8.space/wallpaper/api/widget/';

export class WidgetFormData {
  wallId: number = 1;
  title: string = '本我壁纸 · 每日精选';
  quote: string = '生活明朗，万物可爱，人间值得，未来可期。';
  author: string = '汪曾祺';
  imgBase64: string = '';
  imgName: string = '';
  day: string = '24';
  month: string = '08';
  time: string = '11:54';
  weekday: string = '星期一';
}

interface WidgetApiResponse {
  id?: number;
  title?: string;
  quote?: string;
  quote_author?: string;
  picurl?: string;
  medium_picurl?: string;
  small_picurl?: string;
  date_info?: WidgetApiDateInfo;
}

interface WidgetApiDateInfo {
  day?: string;
  month?: string;
  time?: string;
  weekday?: string;
}

export default class EntryFormAbility extends FormExtensionAbility {
  // 记录每个 formId 对应的卡片类型（如 'DailyCard2x2', 'DailyCard2x4', 'DailyCard4x4'）
  private formTypes: Map<string, string> = new Map();

  onAddForm(want: Want): formBindingData.FormBindingData {
    hilog.info(DOMAIN, TAG, 'onAddForm called');
    const formId = want.parameters ? (want.parameters[formInfo.FormParam.IDENTITY_KEY] as string) : '';
    const formName = want.parameters ? (want.parameters[formInfo.FormParam.NAME_KEY] as string) : '';
    if (formId && formName) {
      this.formTypes.set(formId, formName);
    }
    
    // 初始默认强类型数据
    const defaultData = new WidgetFormData();

    // 异步拉取最新每日壁纸与图片
    this.fetchAndUpdateForm(formId, 'daily/');

    return formBindingData.createFormBindingData(defaultData);
  }

  onCastToNormalForm(formId: string): void {
    hilog.info(DOMAIN, TAG, `onCastToNormalForm: ${formId}`);
  }

  onUpdateForm(formId: string): void {
    hilog.info(DOMAIN, TAG, `onUpdateForm: ${formId}`);
    this.fetchAndUpdateForm(formId, 'daily/');
  }

  onChangeFormVisibility(newStatus: Record<string, number>): void {
    hilog.info(DOMAIN, TAG, 'onChangeFormVisibility');
  }

  onFormEvent(formId: string, message: string): void {
    hilog.info(DOMAIN, TAG, `onFormEvent formId: ${formId}, message: ${message}`);
    try {
      if (message.includes('refresh')) {
        this.fetchAndUpdateForm(formId, 'random/');
      } else {
        this.fetchAndUpdateForm(formId, 'daily/');
      }
    } catch (e) {
      this.fetchAndUpdateForm(formId, 'random/');
    }
  }

  onRemoveForm(formId: string): void {
    hilog.info(DOMAIN, TAG, `onRemoveForm: ${formId}`);
    try {
      this.formTypes.delete(formId);
      const filePath = `${this.context.filesDir}/widget_bg_${formId}.jpg`;
      if (fs.accessSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {}
  }

  onConfigurationUpdate(): void {
    hilog.info(DOMAIN, TAG, 'onConfigurationUpdate');
  }

  /**
   * 网络请求并下载图片，更新鸿蒙卡片
   */
  private fetchAndUpdateForm(formId: string, endpoint: string): void {
    if (!formId) return;

    const httpRequest = http.createHttp();
    const url = `${BASE_API_URL}${endpoint}`;

    httpRequest.request(url, {
      method: http.RequestMethod.GET,
      header: {
        'Content-Type': 'application/json',
        'User-Agent': 'EgoWallpaper-HarmonyCard/1.0'
      },
      connectTimeout: 8000,
      readTimeout: 8000
    }).then((response: http.HttpResponse) => {
      if (response.responseCode === 200 && response.result) {
        const jsonResult: Record<string, Object> = typeof response.result === 'string' ? JSON.parse(response.result as string) : (response.result as Record<string, Object>);
        const data: WidgetApiResponse = (jsonResult['data'] || jsonResult) as WidgetApiResponse;

        const updateData = new WidgetFormData();
        if (data.id != null) updateData.wallId = data.id;
        if (data.title != null) updateData.title = data.title;
        if (data.quote != null) updateData.quote = data.quote;
        if (data.quote_author != null) updateData.author = data.quote_author;
        if (data.date_info != null) {
          if (data.date_info.day != null) updateData.day = data.date_info.day;
          if (data.date_info.month != null) updateData.month = data.date_info.month;
          if (data.date_info.time != null) updateData.time = data.date_info.time;
          if (data.date_info.weekday != null) updateData.weekday = data.date_info.weekday;
        }

        // 1. 先即时更新文字信息
        const firstBinding = formBindingData.createFormBindingData(updateData);
        formProvider.updateForm(formId, firstBinding).catch((err: BusinessError) => {
          hilog.error(DOMAIN, TAG, `Failed to updateForm initial: ${err.message}`);
        });

        // 2. 根据卡片尺寸选择对应尺寸的壁纸：
        // 2x2 和 4x2(2x4) 使用 medium 中尺寸壁纸 (medium_picurl)，4x4 使用原始全高清尺寸壁纸 (picurl)
        const formType = this.formTypes.get(formId) || '';
        let picUrl = '';
        if (formType === 'DailyCard4x4' || formType.includes('4x4')) {
          picUrl = data.picurl || data.medium_picurl || data.small_picurl || '';
        } else {
          // 2x2 和 4x2 (2x4)
          picUrl = data.medium_picurl || data.picurl || data.small_picurl || '';
        }

        if (picUrl && picUrl.length > 0) {
          this.downloadAndShareImage(formId, picUrl, updateData);
        }
      }
    }).catch((err: BusinessError) => {
      hilog.error(DOMAIN, TAG, `Failed to fetch widget data: ${err.message}`);
    }).finally(() => {
      httpRequest.destroy();
    });
  }

  /**
   * 下载壁纸二进制数据并转为 Base64 及 File Descriptor 共享给卡片
   */
  private downloadAndShareImage(formId: string, imgUrl: string, updateData: WidgetFormData): void {
    const imgHttpRequest = http.createHttp();
    imgHttpRequest.request(imgUrl, {
      method: http.RequestMethod.GET,
      expectDataType: http.HttpDataType.ARRAY_BUFFER,
      connectTimeout: 10000,
      readTimeout: 10000
    }).then((imgResponse: http.HttpResponse) => {
      if (imgResponse.responseCode === 200 && imgResponse.result) {
        try {
          const buffer = imgResponse.result as ArrayBuffer;

          // 1. 生成 Base64 Data URL (即时高兼容渲染)
          const base64Helper = new util.Base64Helper();
          const uint8Array = new Uint8Array(buffer);
          const base64Str = base64Helper.encodeToStringSync(uint8Array);
          updateData.imgBase64 = `data:image/jpeg;base64,${base64Str}`;

          // 2. 写入应用沙箱并生成共享句柄
          const filePath = `${this.context.filesDir}/widget_bg_${formId}.jpg`;
          const file = fs.openSync(filePath, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE | fs.OpenMode.TRUNC);
          fs.writeSync(file.fd, buffer);
          fs.closeSync(file);

          const readFile = fs.openSync(filePath, fs.OpenMode.READ_ONLY);
          const imgKey = `widget_bg_${formId}`;
          updateData.imgName = imgKey;

          const dataObj: Record<string, Object> = {};
          dataObj['wallId'] = updateData.wallId;
          dataObj['title'] = updateData.title;
          dataObj['quote'] = updateData.quote;
          dataObj['author'] = updateData.author;
          dataObj['day'] = updateData.day;
          dataObj['month'] = updateData.month;
          dataObj['time'] = updateData.time;
          dataObj['weekday'] = updateData.weekday;
          dataObj['imgBase64'] = updateData.imgBase64;
          dataObj['imgName'] = updateData.imgName;

          const formImages: Record<string, number> = {};
          formImages[imgKey] = readFile.fd;
          dataObj['formImages'] = formImages;

          const formBinding = formBindingData.createFormBindingData(dataObj);
          formProvider.updateForm(formId, formBinding).then(() => {
            hilog.info(DOMAIN, TAG, `Form ${formId} updated with image successfully`);
          }).catch((err: BusinessError) => {
            hilog.error(DOMAIN, TAG, `Failed to updateForm with image: ${err.message}`);
          });
        } catch (e) {
          hilog.error(DOMAIN, TAG, `File descriptor error: ${JSON.stringify(e)}`);
        }
      }
    }).catch((err: BusinessError) => {
      hilog.error(DOMAIN, TAG, `Failed to download image: ${err.message}`);
    }).finally(() => {
      imgHttpRequest.destroy();
    });
  }
}
