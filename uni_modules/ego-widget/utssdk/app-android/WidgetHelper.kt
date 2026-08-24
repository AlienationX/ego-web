package uts.sdk.modules.egoWidget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.BitmapShader
import android.graphics.Canvas
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Shader
import android.net.Uri
import android.os.Build
import android.util.Log
import android.widget.RemoteViews
import org.json.JSONObject
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import java.util.concurrent.Executors

object WidgetHelper {
    private const val TAG = "EgoWidget"
    private const val BASE_API_URL = "https://api.wp.ego8.space/wallpaper/api/widget/"
    private val executor = Executors.newFixedThreadPool(3)

    const val ACTION_REFRESH_2X2 = "com.ego.wallpaper.WIDGET_REFRESH_2X2"
    const val ACTION_REFRESH_4X2 = "com.ego.wallpaper.WIDGET_REFRESH_4X2"
    const val ACTION_REFRESH_4X4 = "com.ego.wallpaper.WIDGET_REFRESH_4X4"

    /**
     * 请求将小组件添加到手机桌面 (Android 8.0+)
     */
    fun requestPinWidget(context: Context, size: String): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            Log.w(TAG, "requestPinWidget: Android SDK ${Build.VERSION.SDK_INT} < 26, not supported")
            return false
        }
        val appWidgetManager = AppWidgetManager.getInstance(context)
        if (appWidgetManager == null) {
            Log.w(TAG, "requestPinWidget: AppWidgetManager is null")
            return false
        }
        val isSupported = appWidgetManager.isRequestPinAppWidgetSupported
        Log.d(TAG, "requestPinWidget: isRequestPinAppWidgetSupported=$isSupported for size=$size")
        if (!isSupported) {
            return false
        }

        val providerClass = when (size) {
            "4x4" -> EgoDailyWidgetProvider4x4::class.java
            "4x2" -> EgoDailyWidgetProvider4x2::class.java
            else -> EgoDailyWidgetProvider2x2::class.java
        }
        val myProvider = ComponentName(context, providerClass)
        val result = appWidgetManager.requestPinAppWidget(myProvider, null, null)
        Log.d(TAG, "requestPinWidget: provider=${myProvider.className}, result=$result")
        return result
    }

    /**
     * 检测桌面是否支持一键添加小组件
     */
    fun isWidgetSupported(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return false
        val appWidgetManager = AppWidgetManager.getInstance(context) ?: return false
        return appWidgetManager.isRequestPinAppWidgetSupported
    }

    /**
     * 更新全部小组件（2x2、4x2、4x4）
     */
    fun updateAllWidgets(context: Context, isRefresh: Boolean = false) {
        val appWidgetManager = AppWidgetManager.getInstance(context)

        // 更新 2x2
        val ids2x2 = appWidgetManager.getAppWidgetIds(
            ComponentName(context, EgoDailyWidgetProvider2x2::class.java)
        )
        for (id in ids2x2) {
            updateWidget(context, appWidgetManager, id, "2x2", isRefresh)
        }

        // 更新 4x2
        val ids4x2 = appWidgetManager.getAppWidgetIds(
            ComponentName(context, EgoDailyWidgetProvider4x2::class.java)
        )
        for (id in ids4x2) {
            updateWidget(context, appWidgetManager, id, "4x2", isRefresh)
        }

        // 更新 4x4
        val ids4x4 = appWidgetManager.getAppWidgetIds(
            ComponentName(context, EgoDailyWidgetProvider4x4::class.java)
        )
        for (id in ids4x4) {
            updateWidget(context, appWidgetManager, id, "4x4", isRefresh)
        }
    }

    /**
     * 点击“换一张”按钮后立即呈现即时反馈状态（0ms 响应，支持国际化）
     */
    fun showLoadingState(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        size: String
    ) {
        try {
            val layoutResName = when (size) {
                "4x4" -> "ego_widget_daily_4x4"
                "4x2" -> "ego_widget_daily_4x2"
                else -> "ego_widget_daily_2x2"
            }
            val layoutId = context.resources.getIdentifier(layoutResName, "layout", context.packageName)
            if (layoutId == 0) return
            val views = RemoteViews(context.packageName, layoutId)

            val tvTitleId = context.resources.getIdentifier("widget_tv_title", "id", context.packageName)
            val tvQuoteId = context.resources.getIdentifier("widget_tv_quote", "id", context.packageName)

            val resTitleId = context.resources.getIdentifier("widget_loading_title", "string", context.packageName)
            val resQuoteId = context.resources.getIdentifier("widget_loading_quote", "string", context.packageName)

            if (tvTitleId != 0 && resTitleId != 0) {
                views.setTextViewText(tvTitleId, context.getString(resTitleId))
            }
            if (tvQuoteId != 0 && resQuoteId != 0) {
                views.setTextViewText(tvQuoteId, context.getString(resQuoteId))
            }

            appWidgetManager.partiallyUpdateAppWidget(appWidgetId, views)
        } catch (e: Exception) {
            Log.e(TAG, "showLoadingState error", e)
        }
    }

    /**
     * 更新单个小组件
     */
    fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        size: String,
        isRefresh: Boolean = false
    ) {
        executor.execute {
            try {
                // 判断当前系统语言环境
                val isEn = Locale.getDefault().language.lowercase().startsWith("en")

                // 1. 获取网络数据（带上语言参数与语言请求头）
                val endpoint = if (isRefresh) "random/" else "daily/"
                val langParam = if (isEn) "?lang=en" else "?lang=zh"
                val urlString = BASE_API_URL + endpoint + langParam
                val jsonData = httpGetJson(urlString, isEn)

                if (jsonData == null) {
                    Log.e(TAG, "Failed to fetch widget json from $urlString")
                    return@execute
                }

                val dataObj = jsonData.optJSONObject("data") ?: jsonData
                val wallId = dataObj.optInt("id", 1)
                val title = dataObj.optString("title", if (isEn) "Daily Featured Art" else "每日精选灵感")
                val quote = dataObj.optString("quote", if (isEn) "Life is clear and bright, all things are lovely." else "生活明朗，万物可爱，未来可期。")
                val author = dataObj.optString("quote_author", if (isEn) "Wang Zengqi" else "汪曾祺")
                val rawPicUrl = dataObj.optString("picurl", "")
                val smallPicUrl = dataObj.optString("small_picurl", "")
                val mediumPicUrl = dataObj.optString("medium_picurl", "")
                val dateInfo = dataObj.optJSONObject("date_info")

                val timeStr = dateInfo?.optString("time", "16:53") ?: "16:53"
                val dayStr = dateInfo?.optString("day", "22") ?: "22"
                val monthStr = dateInfo?.optString("month", "08") ?: "08"
                val weekdayStr = dateInfo?.optString("weekday", if (isEn) "Saturday" else "星期六") ?: (if (isEn) "Saturday" else "星期六")

                val formattedDate = if (isEn) "$monthStr/$dayStr $weekdayStr" else "$monthStr-$dayStr $weekdayStr"
                val formattedMonthWeekday = if (isEn) "$weekdayStr · $monthStr" else "${monthStr}月 · $weekdayStr"

                // 2. 下载并生成高品质圆角 Bitmap (按等比居中裁切 Center-Crop，绝对不拉伸变形)
                val targetW = when (size) {
                    "4x4" -> 600
                    "4x2" -> 450
                    else -> 500
                }
                val targetH = when (size) {
                    "4x4" -> 600
                    "4x2" -> 360
                    else -> 500
                }

                // 壁纸尺寸优先级策略：
                // 2x2 和 4x2 优先使用 medium 中尺寸壁纸，4x4 优先使用原始高清壁纸
                val candidates = when (size) {
                    "2x2" -> listOf(mediumPicUrl, rawPicUrl, smallPicUrl)
                    "4x2" -> listOf(mediumPicUrl, rawPicUrl, smallPicUrl)
                    "4x4" -> listOf(rawPicUrl, mediumPicUrl, smallPicUrl)
                    else -> listOf(mediumPicUrl, rawPicUrl, smallPicUrl)
                }

                val is4x2 = (size == "4x2")
                var bitmap: Bitmap? = null
                for (url in candidates) {
                    if (url.isNotEmpty()) {
                        // 4x2 仅对左侧两个角做圆角，右侧直角与黑色卡片无缝直连
                        bitmap = downloadAndCropBitmap(url, targetW, targetH, 24f, onlyLeftCorners = is4x2)
                        if (bitmap != null) {
                            Log.d(TAG, "Widget $appWidgetId ($size) bitmap loaded from: $url")
                            break
                        }
                    }
                }

                // 3. 构造 RemoteViews
                val layoutResName = when (size) {
                    "4x4" -> "ego_widget_daily_4x4"
                    "4x2" -> "ego_widget_daily_4x2"
                    else -> "ego_widget_daily_2x2"
                }
                val layoutId = context.resources.getIdentifier(layoutResName, "layout", context.packageName)
                if (layoutId == 0) return@execute
                val views = RemoteViews(context.packageName, layoutId)

                // 4. 设置视图内容
                val imgBgId = context.resources.getIdentifier("widget_img_bg", "id", context.packageName)
                if (bitmap != null && imgBgId != 0) {
                    views.setImageViewBitmap(imgBgId, bitmap)
                }

                val flag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                } else {
                    PendingIntent.FLAG_UPDATE_CURRENT
                }

                when (size) {
                    "2x2" -> {
                        val tvDayId = context.resources.getIdentifier("widget_tv_day", "id", context.packageName)
                        val tvMonthWeekdayId = context.resources.getIdentifier("widget_tv_month_weekday", "id", context.packageName)
                        val tvTitleId = context.resources.getIdentifier("widget_tv_title", "id", context.packageName)

                        if (tvDayId != 0) views.setTextViewText(tvDayId, dayStr)
                        if (tvMonthWeekdayId != 0) views.setTextViewText(tvMonthWeekdayId, formattedMonthWeekday)
                        if (tvTitleId != 0) views.setTextViewText(tvTitleId, title)
                    }
                    "4x2" -> {
                        val tvTimeId = context.resources.getIdentifier("widget_tv_time", "id", context.packageName)
                        val tvDateId = context.resources.getIdentifier("widget_tv_date", "id", context.packageName)
                        val tvQuoteId = context.resources.getIdentifier("widget_tv_quote", "id", context.packageName)
                        val tvAuthorId = context.resources.getIdentifier("widget_tv_author", "id", context.packageName)
                        val tvTitleId = context.resources.getIdentifier("widget_tv_title", "id", context.packageName)
                        val btnRefreshId = context.resources.getIdentifier("widget_btn_refresh", "id", context.packageName)

                        if (tvTimeId != 0) views.setTextViewText(tvTimeId, timeStr)
                        if (tvDateId != 0) views.setTextViewText(tvDateId, formattedDate)
                        if (tvQuoteId != 0) views.setTextViewText(tvQuoteId, quote)
                        if (tvAuthorId != 0) views.setTextViewText(tvAuthorId, "—— $author")
                        if (tvTitleId != 0) views.setTextViewText(tvTitleId, title)

                        // 绑定刷新按钮事件
                        if (btnRefreshId != 0) {
                            val refreshIntent = Intent(context, EgoDailyWidgetProvider4x2::class.java).apply {
                                action = ACTION_REFRESH_4X2
                                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                            }
                            val refreshPendingIntent = PendingIntent.getBroadcast(
                                context,
                                appWidgetId,
                                refreshIntent,
                                flag
                            )
                            views.setOnClickPendingIntent(btnRefreshId, refreshPendingIntent)
                        }
                    }
                    "4x4" -> {
                        val tvBadgeId = context.resources.getIdentifier("widget_tv_badge", "id", context.packageName)
                        val tvDateId = context.resources.getIdentifier("widget_tv_date", "id", context.packageName)
                        val tvTitleId = context.resources.getIdentifier("widget_tv_title", "id", context.packageName)
                        val tvQuoteId = context.resources.getIdentifier("widget_tv_quote", "id", context.packageName)
                        val tvAuthorId = context.resources.getIdentifier("widget_tv_author", "id", context.packageName)
                        val btnSearchId = context.resources.getIdentifier("widget_btn_search", "id", context.packageName)
                        val btnFavoriteId = context.resources.getIdentifier("widget_btn_favorite", "id", context.packageName)
                        val btnRefreshId = context.resources.getIdentifier("widget_btn_refresh", "id", context.packageName)

                        if (tvBadgeId != 0) views.setTextViewText(tvBadgeId, if (isEn) "Daily Art Poster" else "每日灵感海报")
                        if (tvDateId != 0) views.setTextViewText(tvDateId, formattedDate)
                        if (tvTitleId != 0) views.setTextViewText(tvTitleId, title)
                        if (tvQuoteId != 0) views.setTextViewText(tvQuoteId, quote)
                        if (tvAuthorId != 0) views.setTextViewText(tvAuthorId, "—— $author")

                        // 快捷搜索热区 (egowall://search)
                        if (btnSearchId != 0) {
                            val searchIntent = Intent(Intent.ACTION_VIEW, Uri.parse("egowall://search")).apply {
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                            }
                            val searchPendingIntent = PendingIntent.getActivity(context, 1001, searchIntent, flag)
                            views.setOnClickPendingIntent(btnSearchId, searchPendingIntent)
                        }

                        // 快捷收藏热区 (egowall://favorite)
                        if (btnFavoriteId != 0) {
                            val favIntent = Intent(Intent.ACTION_VIEW, Uri.parse("egowall://favorite")).apply {
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                            }
                            val favPendingIntent = PendingIntent.getActivity(context, 1002, favIntent, flag)
                            views.setOnClickPendingIntent(btnFavoriteId, favPendingIntent)
                        }

                        // 换一张热区
                        if (btnRefreshId != 0) {
                            val refreshIntent = Intent(context, EgoDailyWidgetProvider4x4::class.java).apply {
                                action = ACTION_REFRESH_4X4
                                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                            }
                            val refreshPendingIntent = PendingIntent.getBroadcast(
                                context,
                                appWidgetId,
                                refreshIntent,
                                flag
                            )
                            views.setOnClickPendingIntent(btnRefreshId, refreshPendingIntent)
                        }
                    }
                }

                // 5. 绑定点击壁纸主体直达预览页 (Deep Link: egowall://preview?id=xxx)
                val clickIntent = Intent(Intent.ACTION_VIEW, Uri.parse("egowall://preview?id=$wallId")).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                }
                val clickPendingIntent = PendingIntent.getActivity(
                    context,
                    wallId,
                    clickIntent,
                    flag
                )
                val rootResName = when (size) {
                    "4x4" -> "widget_root_4x4"
                    "4x2" -> "widget_root_4x2"
                    else -> "widget_root_2x2"
                }
                val rootId = context.resources.getIdentifier(rootResName, "id", context.packageName)
                if (rootId != 0) {
                    views.setOnClickPendingIntent(rootId, clickPendingIntent)
                }

                // 6. 更新小组件
                appWidgetManager.updateAppWidget(appWidgetId, views)
                Log.d(TAG, "Widget $appWidgetId ($size) updated successfully with wallId=$wallId")

            } catch (e: Exception) {
                Log.e(TAG, "Error updating widget $appWidgetId", e)
            }
        }
    }

    /**
     * HTTP GET 请求并解析 JSON
     */
    private fun httpGetJson(urlString: String, isEn: Boolean = false): JSONObject? {
        var conn: HttpURLConnection? = null
        return try {
            val url = URL(urlString)
            conn = url.openConnection() as HttpURLConnection
            conn.instanceFollowRedirects = true
            conn.requestMethod = "GET"
            conn.connectTimeout = 8000
            conn.readTimeout = 8000
            conn.setRequestProperty("User-Agent", "EgoWallpaper-Widget/1.0 (Android)")
            conn.setRequestProperty("Accept-Language", if (isEn) "en-US,en;q=0.9" else "zh-CN,zh;q=0.9")

            if (conn.responseCode in 200..299) {
                val jsonStr = conn.inputStream.bufferedReader().use { it.readText() }
                JSONObject(jsonStr)
            } else {
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "httpGetJson error", e)
            null
        } finally {
            conn?.disconnect()
        }
    }

    /**
     * 下载图片、等比居中裁切(Center-Crop保持原图比例不拉伸变形)并裁切为圆角 Bitmap (彻底杜绝 Binder 1MB 限制溢出)
     */
    private fun downloadAndCropBitmap(
        urlString: String,
        targetW: Int,
        targetH: Int,
        cornerRadiusDp: Float,
        onlyLeftCorners: Boolean = false
    ): Bitmap? {
        var conn: HttpURLConnection? = null
        var inputStream: InputStream? = null
        return try {
            val url = URL(urlString)
            conn = url.openConnection() as HttpURLConnection
            conn.instanceFollowRedirects = true
            conn.connectTimeout = 10000
            conn.readTimeout = 10000
            inputStream = conn.inputStream

            // 解码原始图片
            val original = BitmapFactory.decodeStream(inputStream) ?: return null
            val srcW = original.width
            val srcH = original.height

            if (srcW <= 0 || srcH <= 0) {
                original.recycle()
                return null
            }

            // 1. 等比居中裁切 (Center-Crop 矩阵计算，确保原图比例绝对不变形)
            val scale = maxOf(targetW.toFloat() / srcW, targetH.toFloat() / srcH)
            val dx = (targetW - srcW * scale) / 2f
            val dy = (targetH - srcH * scale) / 2f

            val matrix = Matrix()
            matrix.setScale(scale, scale)
            matrix.postTranslate(dx, dy)

            val output = Bitmap.createBitmap(targetW, targetH, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(output)
            val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
            val shader = BitmapShader(original, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP)
            shader.setLocalMatrix(matrix)
            paint.shader = shader

            // 2. 绘制圆角 (如果是 4x2 则只切左侧上下两个圆角，右侧保持直角与黑色卡片无缝直连)
            val rect = RectF(0f, 0f, targetW.toFloat(), targetH.toFloat())
            val radiusPx = cornerRadiusDp * 2.5f

            if (onlyLeftCorners) {
                val path = Path()
                val radii = floatArrayOf(
                    radiusPx, radiusPx,  // 左上
                    0f, 0f,              // 右上
                    0f, 0f,              // 右下
                    radiusPx, radiusPx   // 左下
                )
                path.addRoundRect(rect, radii, Path.Direction.CW)
                canvas.drawPath(path, paint)
            } else {
                canvas.drawRoundRect(rect, radiusPx, radiusPx, paint)
            }

            original.recycle()
            output
        } catch (e: Exception) {
            Log.e(TAG, "downloadAndCropBitmap error", e)
            null
        } finally {
            try { inputStream?.close() } catch (e: Exception) {}
            conn?.disconnect()
        }
    }
}
