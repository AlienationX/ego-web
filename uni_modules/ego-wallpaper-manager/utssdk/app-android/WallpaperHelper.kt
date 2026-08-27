package uts.sdk.modules.egoWallpaperManager

import android.app.WallpaperManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Rect
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.File
import java.io.FileOutputStream
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

object WallpaperHelper {
    private const val TAG = "EgoWallpaperManager"
    private const val PREFS_NAME = "ego_wallpaper_rotate_prefs"
    private const val KEY_ENABLED = "rotate_enabled"
    private const val KEY_FEED_URL = "rotate_feed_url"
    private const val KEY_FREQUENCY = "rotate_frequency"
    private const val KEY_TARGET = "rotate_target"
    private const val KEY_WIFI_ONLY = "rotate_wifi_only"
    private const val CACHE_FILE_NAME = "ego_next_wallpaper_cache.jpg"

    private var screenReceiver: BroadcastReceiver? = null
    private var periodicJob: Job? = null
    private var lastRotateTime: Long = 0L
    @Volatile
    private var isPrefetching = false

    /**
     * 单次设置系统壁纸（支持精准屏幕居中自适应裁剪 Center Crop）
     */
    fun setWallpaper(
        context: Context,
        imageUrl: String,
        target: String,
        onSuccess: () -> Unit,
        onFail: (String) -> Unit
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val bitmap = downloadBitmap(imageUrl)
                if (bitmap == null) {
                    withContext(Dispatchers.Main) {
                        onFail("无法解析壁纸图片")
                    }
                    return@launch
                }

                applyBitmapToWallpaper(context, bitmap, target)

                withContext(Dispatchers.Main) {
                    onSuccess()
                }
            } catch (e: Exception) {
                Log.e(TAG, "setWallpaper failed", e)
                withContext(Dispatchers.Main) {
                    onFail(e.message ?: "设置壁纸失败")
                }
            }
        }
    }

    /**
     * 启动原生自动轮播服务（双缓冲预加载 + 熄屏无感切换）
     */
    fun startAutoRotate(
        context: Context,
        feedUrl: String,
        frequency: String,
        target: String,
        wifiOnly: Boolean
    ) {
        saveConfig(context, true, feedUrl, frequency, target, wifiOnly)
        registerScreenReceiverIfNeeded(context)
        schedulePeriodicJobIfNeeded(context)

        // 启动时立即在后台预拉取下一张壁纸，准备好本地高速缓存
        prefetchNextWallpaper(context, feedUrl, wifiOnly)
        Log.i(TAG, "startAutoRotate started: freq=$frequency, target=$target, wifiOnly=$wifiOnly")
    }

    /**
     * 停止自动轮播服务
     */
    fun stopAutoRotate(context: Context) {
        saveConfig(context, false, "", "", "", false)
        unregisterScreenReceiver(context)
        stopPeriodicJob()
        clearCache(context)
        Log.i(TAG, "stopAutoRotate stopped")
    }

    /**
     * App 初始化时恢复自动轮播服务
     */
    fun init(context: Context) {
        val prefs = getPrefs(context)
        val enabled = prefs.getBoolean(KEY_ENABLED, false)
        if (enabled) {
            val feedUrl = prefs.getString(KEY_FEED_URL, "") ?: ""
            val wifiOnly = prefs.getBoolean(KEY_WIFI_ONLY, true)

            registerScreenReceiverIfNeeded(context)
            schedulePeriodicJobIfNeeded(context)

            // 检查若本地无预加载缓存，立即在后台补充预拉取
            val cacheFile = getCacheFile(context)
            if (!cacheFile.exists() && feedUrl.isNotBlank()) {
                prefetchNextWallpaper(context, feedUrl, wifiOnly)
            }
            Log.i(TAG, "init: Restored auto rotate service from prefs")
        }
    }

    private fun registerScreenReceiverIfNeeded(context: Context) {
        val prefs = getPrefs(context)
        val frequency = prefs.getString(KEY_FREQUENCY, "unlock") ?: "unlock"
        if (frequency != "unlock") {
            unregisterScreenReceiver(context)
            return
        }

        if (screenReceiver == null) {
            val filter = IntentFilter().apply {
                // 仅监听熄屏事件：在黑屏瞬间静默应用已预加载的壁纸，亮屏时稳定展示且绝不二次切换
                addAction(Intent.ACTION_SCREEN_OFF)
            }
            screenReceiver = object : BroadcastReceiver() {
                override fun onReceive(ctx: Context?, intent: Intent?) {
                    val action = intent?.action
                    if (action == Intent.ACTION_SCREEN_OFF) {
                        Log.d(TAG, "Screen OFF received: silently applying next cached wallpaper")
                        triggerRotate(context.applicationContext ?: context, true)
                    }
                }
            }
            try {
                context.applicationContext.registerReceiver(screenReceiver, filter)
                Log.i(TAG, "ScreenStateReceiver registered for ACTION_SCREEN_OFF")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to register screen receiver", e)
            }
        }
    }

    private fun unregisterScreenReceiver(context: Context) {
        screenReceiver?.let {
            try {
                context.applicationContext.unregisterReceiver(it)
            } catch (e: Exception) {
                Log.w(TAG, "Receiver already unregistered or error", e)
            }
            screenReceiver = null
        }
    }

    private fun schedulePeriodicJobIfNeeded(context: Context) {
        stopPeriodicJob()
        val prefs = getPrefs(context)
        val frequency = prefs.getString(KEY_FREQUENCY, "daily") ?: "daily"
        if (frequency == "unlock") return

        val intervalMs = when (frequency) {
            "1h" -> 60 * 60 * 1000L
            "12h" -> 12 * 60 * 60 * 1000L
            "daily" -> 24 * 60 * 60 * 1000L
            else -> 24 * 60 * 60 * 1000L
        }

        periodicJob = CoroutineScope(Dispatchers.IO).launch {
            while (isActive) {
                delay(intervalMs)
                Log.d(TAG, "Periodic rotate triggered after $intervalMs ms")
                triggerRotate(context.applicationContext ?: context, false)
            }
        }
    }

    private fun stopPeriodicJob() {
        periodicJob?.cancel()
        periodicJob = null
    }

    /**
     * 核心触发逻辑：优先从本地预加载高速缓存读取并应用，实现0延迟无感切换，随后静默预拉取下一张
     */
    private fun triggerRotate(context: Context, isScreenOff: Boolean) {
        val now = System.currentTimeMillis()
        // 3 秒防抖节流
        if (now - lastRotateTime < 3000) {
            Log.d(TAG, "Throttle rotate, skipped (within 3s)")
            return
        }
        lastRotateTime = now

        val prefs = getPrefs(context)
        val enabled = prefs.getBoolean(KEY_ENABLED, false)
        if (!enabled) return

        val feedUrl = prefs.getString(KEY_FEED_URL, "") ?: ""
        if (feedUrl.isBlank()) return

        val wifiOnly = prefs.getBoolean(KEY_WIFI_ONLY, true)
        val target = prefs.getString(KEY_TARGET, "lock") ?: "lock"

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val cacheFile = getCacheFile(context)
                if (cacheFile.exists() && cacheFile.length() > 0) {
                    // 1. 本地预加载缓存命中 -> 毫秒级解码应用，完全无网络等待！
                    val bitmap = BitmapFactory.decodeFile(cacheFile.absolutePath)
                    if (bitmap != null) {
                        applyBitmapToWallpaper(context, bitmap, target)
                        Log.i(TAG, "Rotated instantaneously from local pre-cache (isScreenOff=$isScreenOff)")
                        cacheFile.delete()
                    }
                    // 2. 立即在后台静默预下载下一张壁纸放入缓存
                    prefetchNextWallpaper(context, feedUrl, wifiOnly)
                } else {
                    // 3. 本地无缓存时（首次冷启动备用），在线拉取应用并补齐下一张缓存
                    if (wifiOnly && !isWifiConnected(context)) {
                        Log.d(TAG, "Wifi only enabled but not on wifi, skipped")
                        return@launch
                    }
                    val imageUrl = fetchFeedImageUrl(feedUrl)
                    if (imageUrl.isNotBlank()) {
                        val bitmap = downloadBitmap(imageUrl)
                        if (bitmap != null) {
                            applyBitmapToWallpaper(context, bitmap, target)
                            Log.i(TAG, "Rotated online (no cache): $imageUrl")
                        }
                    }
                    prefetchNextWallpaper(context, feedUrl, wifiOnly)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Auto rotate execution failed", e)
            }
        }
    }

    /**
     * 后台静默预加载下一张壁纸到本地沙箱文件（双缓冲机制）
     */
    private fun prefetchNextWallpaper(context: Context, feedUrl: String, wifiOnly: Boolean) {
        if (isPrefetching) return
        val cacheFile = getCacheFile(context)
        if (cacheFile.exists() && cacheFile.length() > 0) return

        CoroutineScope(Dispatchers.IO).launch {
            isPrefetching = true
            try {
                if (wifiOnly && !isWifiConnected(context)) {
                    Log.d(TAG, "Prefetch skipped: not on wifi")
                    return@launch
                }
                val imageUrl = fetchFeedImageUrl(feedUrl)
                if (imageUrl.isNotBlank()) {
                    val tempFile = File(context.cacheDir, "temp_rotate_prefetch_${System.currentTimeMillis()}.jpg")
                    var conn: HttpURLConnection? = null
                    try {
                        val url = URL(imageUrl)
                        conn = (url.openConnection() as HttpURLConnection).apply {
                            doInput = true
                            connectTimeout = 15000
                            readTimeout = 15000
                            connect()
                        }
                        if (conn.responseCode == 200) {
                            conn.inputStream.use { input ->
                                FileOutputStream(tempFile).use { output ->
                                    input.copyTo(output)
                                }
                            }
                            if (tempFile.exists() && tempFile.length() > 0) {
                                if (cacheFile.exists()) cacheFile.delete()
                                tempFile.renameTo(cacheFile)
                                Log.i(TAG, "Prefetched next wallpaper successfully to local cache: $imageUrl")
                            }
                        }
                    } finally {
                        conn?.disconnect()
                        if (tempFile.exists()) tempFile.delete()
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Prefetch next wallpaper failed (will retry next time)", e)
            } finally {
                isPrefetching = false
            }
        }
    }

    /**
     * 屏幕全屏居中自适应算法（Center Crop）将 Bitmap 应用到系统壁纸
     */
    private fun applyBitmapToWallpaper(context: Context, bitmap: Bitmap, target: String) {
        val wm = WallpaperManager.getInstance(context)
        val metrics = context.resources.displayMetrics
        val screenW = metrics.widthPixels
        val screenH = metrics.heightPixels

        val srcW = bitmap.width
        val srcH = bitmap.height

        // 计算屏幕比例自适应 Center Crop 裁剪区域
        val cropRect = if (srcW > 0 && srcH > 0 && screenW > 0 && screenH > 0) {
            val srcAspect = srcW.toFloat() / srcH.toFloat()
            val dstAspect = screenW.toFloat() / screenH.toFloat()

            val cropX: Int
            val cropY: Int
            val cropW: Int
            val cropH: Int

            if (srcAspect > dstAspect) {
                // 原图比屏幕宽：裁切两侧，保留全高
                cropH = srcH
                cropW = (srcH * dstAspect).toInt()
                cropX = (srcW - cropW) / 2
                cropY = 0
            } else {
                // 原图比屏幕高：裁切上下，保留全宽
                cropW = srcW
                cropH = (srcW / dstAspect).toInt()
                cropX = 0
                cropY = (srcH - cropH) / 2
            }

            val safeX = cropX.coerceIn(0, srcW - 1)
            val safeY = cropY.coerceIn(0, srcH - 1)
            val safeW = cropW.coerceIn(1, srcW - safeX)
            val safeH = cropH.coerceIn(1, srcH - safeY)

            Rect(safeX, safeY, safeX + safeW, safeY + safeH)
        } else {
            null
        }

        try {
            wm.suggestDesiredDimensions(screenW, screenH)
        } catch (e: Exception) {
            // ignore
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val flag = when (target) {
                "lock" -> WallpaperManager.FLAG_LOCK
                "home" -> WallpaperManager.FLAG_SYSTEM
                else -> WallpaperManager.FLAG_SYSTEM or WallpaperManager.FLAG_LOCK
            }
            wm.setBitmap(bitmap, cropRect, true, flag)
        } else {
            wm.setBitmap(bitmap)
        }
    }

    private fun getCacheFile(context: Context): File {
        return File(context.cacheDir, CACHE_FILE_NAME)
    }

    private fun clearCache(context: Context) {
        try {
            val file = getCacheFile(context)
            if (file.exists()) file.delete()
        } catch (e: Exception) {
            // ignore
        }
    }

    private fun downloadBitmap(imageUrl: String): Bitmap? {
        var conn: HttpURLConnection? = null
        return try {
            val url = URL(imageUrl)
            conn = (url.openConnection() as HttpURLConnection).apply {
                doInput = true
                connectTimeout = 15000
                readTimeout = 15000
                connect()
            }
            if (conn.responseCode == 200) {
                conn.inputStream.use { input ->
                    BitmapFactory.decodeStream(input)
                }
            } else {
                null
            }
        } finally {
            conn?.disconnect()
        }
    }

    private fun fetchFeedImageUrl(feedUrl: String): String {
        var conn: HttpURLConnection? = null
        return try {
            val url = URL(feedUrl)
            conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 10000
                readTimeout = 10000
                connect()
            }
            if (conn.responseCode == 200) {
                val reader = BufferedReader(InputStreamReader(conn.inputStream))
                val sb = StringBuilder()
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    sb.append(line)
                }
                reader.close()

                val json = JSONObject(sb.toString())
                val data = json.optJSONObject("data")
                data?.optString("image_url", "") ?: ""
            } else {
                ""
            }
        } finally {
            conn?.disconnect()
        }
    }

    private fun isWifiConnected(context: Context): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return false
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = cm.activeNetwork ?: return false
            val caps = cm.getNetworkCapabilities(network) ?: return false
            caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
        } else {
            @Suppress("DEPRECATION")
            val info = cm.activeNetworkInfo
            @Suppress("DEPRECATION")
            info != null && info.isConnected && info.type == ConnectivityManager.TYPE_WIFI
        }
    }

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    private fun saveConfig(
        context: Context,
        enabled: Boolean,
        feedUrl: String,
        frequency: String,
        target: String,
        wifiOnly: Boolean
    ) {
        getPrefs(context).edit().apply {
            putBoolean(KEY_ENABLED, enabled)
            putString(KEY_FEED_URL, feedUrl)
            putString(KEY_FREQUENCY, frequency)
            putString(KEY_TARGET, target)
            putBoolean(KEY_WIFI_ONLY, wifiOnly)
            apply()
        }
    }
}
