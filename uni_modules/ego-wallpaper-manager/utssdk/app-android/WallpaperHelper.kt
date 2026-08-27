package uts.sdk.modules.egoWallpaperManager

import android.app.WallpaperManager
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

object WallpaperHelper {
    fun setWallpaper(
        context: Context,
        imageUrl: String,
        target: String,
        onSuccess: () -> Unit,
        onFail: (String) -> Unit
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = URL(imageUrl)
                val conn = url.openConnection() as HttpURLConnection
                conn.doInput = true
                conn.connectTimeout = 15000
                conn.readTimeout = 15000
                conn.connect()
                val inputStream = conn.inputStream
                val bitmap = BitmapFactory.decodeStream(inputStream)
                inputStream.close()

                if (bitmap == null) {
                    withContext(Dispatchers.Main) {
                        onFail("无法解析壁纸图片")
                    }
                    return@launch
                }

                val wm = WallpaperManager.getInstance(context)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    val flag = when (target) {
                        "lock" -> WallpaperManager.FLAG_LOCK
                        "home" -> WallpaperManager.FLAG_SYSTEM
                        else -> WallpaperManager.FLAG_SYSTEM or WallpaperManager.FLAG_LOCK
                    }
                    wm.setBitmap(bitmap, null, true, flag)
                } else {
                    wm.setBitmap(bitmap)
                }

                withContext(Dispatchers.Main) {
                    onSuccess()
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    onFail(e.message ?: "设置壁纸失败")
                }
            }
        }
    }
}
