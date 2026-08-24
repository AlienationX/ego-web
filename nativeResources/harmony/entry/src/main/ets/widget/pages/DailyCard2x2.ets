let storage2x2 = new LocalStorage();

@Entry(storage2x2)
@Component
struct DailyCard2x2 {
  @LocalStorageProp('wallId') wallId: number = 1;
  @LocalStorageProp('title') title: string = '本我壁纸 · 灵感日签';
  @LocalStorageProp('quote') quote: string = '生活明朗，万物可爱，人间值得，未来可期。';
  @LocalStorageProp('imgBase64') imgBase64: string = '';
  @LocalStorageProp('imgName') imgName: string = '';
  @LocalStorageProp('day') day: string = '24';
  @LocalStorageProp('month') month: string = '08';
  @LocalStorageProp('weekday') weekday: string = '星期一';

  build() {
    Stack({ alignContent: Alignment.BottomStart }) {
      // 1. 壁纸背景大图 (Base64 即时渲染 / memory:// 共享句柄)
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

      // 2. 底部轻柔渐变遮罩
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

      // 3. 顶部胶囊角标
      Text('每日灵感')
        .fontSize(10)
        .fontWeight(FontWeight.Bold)
        .fontColor('#FFFFFF')
        .backgroundColor('rgba(0, 0, 0, 0.45)')
        .borderRadius(12)
        .padding({ left: 8, right: 8, top: 3, bottom: 3 })
        .position({ x: 12, y: 12 })

      // 4. 底部日期与壁纸标题
      Column({ space: 2 }) {
        Row({ space: 6 }) {
          Text(this.day)
            .fontSize(30)
            .fontWeight(FontWeight.Bolder)
            .fontColor('#FFFFFF')
            .lineHeight(30)

          Text(`${this.month}月 · ${this.weekday}`)
            .fontSize(11)
            .fontWeight(FontWeight.Bold)
            .fontColor('#E0E0E0')
            .margin({ bottom: 2 })
        }
        .alignItems(VerticalAlign.Bottom)

        Text(this.title)
          .fontSize(11)
          .fontColor('#FFFFFF')
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
      }
      .alignItems(HorizontalAlign.Start)
      .padding({ left: 12, right: 12, bottom: 12 })
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#1C1C1E')
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
}
