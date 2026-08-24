let storage2x4 = new LocalStorage();

@Entry(storage2x4)
@Component
struct DailyCard2x4 {
  @LocalStorageProp('wallId') wallId: number = 1;
  @LocalStorageProp('title') title: string = '本我壁纸';
  @LocalStorageProp('quote') quote: string = '生活明朗，万物可爱，人间值得，未来可期。';
  @LocalStorageProp('author') author: string = '汪曾祺';
  @LocalStorageProp('imgBase64') imgBase64: string = '';
  @LocalStorageProp('imgName') imgName: string = '';
  @LocalStorageProp('day') day: string = '24';
  @LocalStorageProp('month') month: string = '08';
  @LocalStorageProp('time') time: string = '11:54';
  @LocalStorageProp('weekday') weekday: string = '星期一';

  build() {
    Row() {
      // 左半部分：壁纸展示区
      Stack({ alignContent: Alignment.BottomStart }) {
        if (this.imgBase64 && this.imgBase64.length > 0) {
          Image(this.imgBase64)
            .width('100%')
            .height('100%')
            .objectFit(ImageFit.Cover)
        } else if (this.imgName && this.imgName.length > 0) {
          Image(`memory://${this.imgName}`)
            .width('100%')
            .height('100%')
            .objectFit(ImageFit.Cover)
        }

        Column()
          .width('100%')
          .height('100%')
          .linearGradient({
            angle: 180,
            colors: [
              ['rgba(0, 0, 0, 0)', 0.4],
              ['rgba(0, 0, 0, 0.65)', 1.0]
            ]
          })

        Text('精选')
          .fontSize(9)
          .fontWeight(FontWeight.Bold)
          .fontColor('#FFFFFF')
          .backgroundColor('rgba(0, 0, 0, 0.45)')
          .borderRadius(10)
          .padding({ left: 6, right: 6, top: 2, bottom: 2 })
          .position({ x: 10, y: 10 })

        Text(this.title)
          .fontSize(11)
          .fontWeight(FontWeight.Bold)
          .fontColor('#FFFFFF')
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
          .margin({ left: 10, right: 8, bottom: 10 })
      }
      .width('44%')
      .height('100%')
      .onClick(() => {
        postCardAction(this, {
          action: 'router',
          abilityName: 'EntryAbility',
          params: {
            uri: `egowall://preview?id=${this.wallId}`,
            targetPage: '/pages/app/preview',
            wallId: this.wallId,
            id: this.wallId
          }
        });
      })

      // 右半部分：时钟、日签与换一张
      Column() {
        // 顶部时钟行
        Row() {
          Row({ space: 4 }) {
            Text(this.time)
              .fontSize(22)
              .fontWeight(FontWeight.Bolder)
              .fontColor('#FFFFFF')

            Text(`${this.month}-${this.day} ${this.weekday}`)
              .fontSize(10)
              .fontColor('#9CA3AF')
              .margin({ bottom: 2 })
          }
          .alignItems(VerticalAlign.Bottom)

          // 换一张快捷按钮
          Image($r('app.media.ic_refresh'))
            .width(26)
            .height(26)
            .padding(5)
            .borderRadius(13)
            .backgroundColor('rgba(255, 255, 255, 0.12)')
            .onClick(() => {
              postCardAction(this, {
                action: 'message',
                params: {
                  message: 'refresh',
                  action: 'refresh'
                }
              });
            })
        }
        .width('100%')
        .justifyContent(FlexAlign.SpaceBetween)
        .alignItems(VerticalAlign.Center)

        // 诗意日签文案
        Text(this.quote)
          .fontSize(12)
          .fontColor('#E5E7EB')
          .lineHeight(16)
          .maxLines(2)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
          .margin({ top: 8 })

        // 格言作者
        Text(`—— ${this.author}`)
          .fontSize(10)
          .fontColor('#9CA3AF')
          .textAlign(TextAlign.End)
          .width('100%')
          .margin({ top: 4 })
      }
      .width('56%')
      .height('100%')
      .padding({ left: 12, right: 12, top: 12, bottom: 12 })
      .justifyContent(FlexAlign.Center)
      .alignItems(HorizontalAlign.Start)
      .onClick(() => {
        postCardAction(this, {
          action: 'router',
          abilityName: 'EntryAbility',
          params: {
            uri: `egowall://preview?id=${this.wallId}`,
            targetPage: '/pages/app/preview',
            wallId: this.wallId,
            id: this.wallId
          }
        });
      })
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#1C1C1E')
  }
}
