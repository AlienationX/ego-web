let storage4x4 = new LocalStorage();

@Entry(storage4x4)
@Component
struct DailyCard4x4 {
  @LocalStorageProp('wallId') wallId: number = 1;
  @LocalStorageProp('title') title: string = '本我壁纸 · 今日精选';
  @LocalStorageProp('quote') quote: string = '生活明朗，万物可爱，人间值得，未来可期。';
  @LocalStorageProp('author') author: string = '汪曾祺';
  @LocalStorageProp('imgBase64') imgBase64: string = '';
  @LocalStorageProp('imgName') imgName: string = '';
  @LocalStorageProp('day') day: string = '24';
  @LocalStorageProp('month') month: string = '08';
  @LocalStorageProp('weekday') weekday: string = '星期一';

  build() {
    Stack({ alignContent: Alignment.BottomStart }) {
      // 1. 巨幅壁纸海报 (Base64 即时渲染 / memory:// 共享句柄)
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

      // 2. 柔和渐变阴影遮罩
      Column()
        .width('100%')
        .height('100%')
        .linearGradient({
          angle: 180,
          colors: [
            ['rgba(0, 0, 0, 0)', 0.3],
            ['rgba(0, 0, 0, 0.2)', 0.55],
            ['rgba(0, 0, 0, 0.75)', 1.0]
          ]
        })

      // 3. 顶部胶囊状态栏 (更靠上：y: 12)
      Row() {
        Text('每日灵感海报')
          .fontSize(11)
          .fontWeight(FontWeight.Bold)
          .fontColor('#FFFFFF')
          .backgroundColor('rgba(0, 0, 0, 0.45)')
          .borderRadius(14)
          .padding({ left: 10, right: 10, top: 4, bottom: 4 })

        Text(`${this.month}-${this.day} ${this.weekday}`)
          .fontSize(11)
          .fontColor('#FFFFFF')
          .backgroundColor('rgba(0, 0, 0, 0.45)')
          .borderRadius(14)
          .padding({ left: 10, right: 10, top: 4, bottom: 4 })
      }
      .width('100%')
      .justifyContent(FlexAlign.SpaceBetween)
      .padding({ left: 14, right: 14 })
      .position({ x: 0, y: 12 })

      // 4. 中下部格言与底部功能操作栏 (底对齐布局)
      Column({ space: 10 }) {
        // 壁纸标题与名言
        Column({ space: 4 }) {
          Text(this.title)
            .fontSize(13)
            .fontWeight(FontWeight.Bold)
            .fontColor('#FBBF24')
            .maxLines(1)
            .textOverflow({ overflow: TextOverflow.Ellipsis })

          Text(this.quote)
            .fontSize(12)
            .fontWeight(FontWeight.Medium)
            .fontColor('#FFFFFF')
            .lineHeight(16)
            .maxLines(2)
            .textOverflow({ overflow: TextOverflow.Ellipsis })

          Text(`—— ${this.author}`)
            .fontSize(11)
            .fontColor('#E0E0E0')
            .textAlign(TextAlign.End)
            .width('100%')
        }
        .alignItems(HorizontalAlign.Start)
        .width('100%')
        .padding({ left: 6, right: 6 })

        // 底部快捷功能条（搜索、收藏、换一张）
        Row() {
          // 快捷搜壁纸
          Row({ space: 4 }) {
            Image($r('app.media.ic_search'))
              .width(14)
              .height(14)
            Text('搜索')
              .fontSize(11)
              .fontWeight(FontWeight.Bold)
              .fontColor('#FFFFFF')
          }
          .layoutWeight(1)
          .height('100%')
          .justifyContent(FlexAlign.Center)
          .onClick(() => {
            postCardAction(this, {
              action: 'router',
              abilityName: 'EntryAbility',
              params: {
                uri: 'egowall://search',
                targetPage: '/pages/app/search'
              }
            });
          })

          // 竖线分割
          Divider()
            .vertical(true)
            .height(18)
            .color('rgba(255, 255, 255, 0.2)')

          // 快捷收藏
          Row({ space: 4 }) {
            Image($r('app.media.ic_favor'))
              .width(14)
              .height(14)
            Text('收藏')
              .fontSize(11)
              .fontWeight(FontWeight.Bold)
              .fontColor('#FFFFFF')
          }
          .layoutWeight(1)
          .height('100%')
          .justifyContent(FlexAlign.Center)
          .onClick(() => {
            postCardAction(this, {
              action: 'router',
              abilityName: 'EntryAbility',
              params: {
                uri: 'egowall://favorite',
                targetPage: '/pages/app/favorite'
              }
            });
          })

          // 竖线分割
          Divider()
            .vertical(true)
            .height(18)
            .color('rgba(255, 255, 255, 0.2)')

          // 桌面一键换一张
          Row({ space: 4 }) {
            Image($r('app.media.ic_refresh'))
              .width(14)
              .height(14)
            Text('换一张')
              .fontSize(11)
              .fontWeight(FontWeight.Bold)
              .fontColor('#FFFFFF')
          }
          .layoutWeight(1)
          .height('100%')
          .justifyContent(FlexAlign.Center)
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
        .height(42)
        .backgroundColor('rgba(0, 0, 0, 0.45)')
        .borderRadius(21)
        .border({ width: 1, color: 'rgba(255, 255, 255, 0.15)' })
      }
      .width('100%')
      .padding({ left: 14, right: 14, bottom: 14 })
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
