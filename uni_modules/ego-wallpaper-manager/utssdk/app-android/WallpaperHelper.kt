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
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.File
import java.io.FileOutputStream
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit

/**
 * Android 官方推荐的 WorkManager 后台任务 Worker
 * 即使 App 进程被杀死、手机进入 Doze 睡眠状态，系统底层也能定时拉起 Worker 执行壁纸更换
 */
class WallpaperRotateWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        Log.i("EgoWallpaperManager", "WallpaperRotateWorker triggered by WorkManager")
        val status = WallpaperHelper.executeRotateFromWorker(applicationContext)
        when (status) {
            WallpaperHelper.RotateStatus.VIP_EXPIRED -> {
                Log.w("EgoWallpaperManager", "Worker detected VIP expired, canceling periodic work")
                WallpaperHelper.stopAutoRotate(applicationContext)
                Result.failure()
            }
            WallpaperHelper.RotateStatus.SUCCESS -> {
                Result.success()
            }
            WallpaperHelper.RotateStatus.NETWORK_ERROR -> {
                Result.retry()
            }
            else -> {
                Result.success()
            }
        }
    }
}

object WallpaperHelper {
    private const val TAG = "EgoWallpaperManager"
    private const val PREFS_NAME = "ego_wallpaper_rotate_prefs"
    private const val KEY_ENABLED = "rotate_enabled"
    private const val KEY_FEED_URL = "rotate_feed_url"
    private const val KEY_FREQUENCY = "rotate_frequency"
    private const val KEY_TARGET = "rotate_target"
    private const val KEY_WIFI_ONLY = "rotate_wifi_only"
    private const val CACHE_FILE_NAME = "ego_next_wallpaper_cache.jpg"
    private const val WORK_NAME_PERIODIC = "ego_wallpaper_periodic_work"

    enum class RotateStatus {
        SUCCESS,
        VIP_EXPIRED,
        NETWORK_ERROR,
        SKIPPED
    }

    private data class FetchFeedResult(
        val status: RotateStatus,
        val imageUrl: String
    )

    private var screenReceiver: BroadcastReceiver? = null
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
     * 启动原生自动轮播服务（双缓冲预加载 + 熄屏无感切换 + WorkManager 官方持久化后台任务）
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
     * 停止自动轮播服务（注销广播 + 取消 WorkManager 任务 + 清除本地缓存）
     */
    fun stopAutoRotate(context: Context) {
        saveConfig(context, false, "", "", "", false)
        unregisterScreenReceiver(context)
        cancelWorkManager(context)
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

    /**
     * 使用 Android 官方推荐的 WorkManager 进行后台持久化调度
     * 具有系统级唤醒、Doze 低功耗待机穿透、防进程划掉能力
     */
    private fun schedulePeriodicJobIfNeeded(context: Context) {
        val prefs = getPrefs(context)
        val frequency = prefs.getString(KEY_FREQUENCY, "daily") ?: "daily"
        val wifiOnly = prefs.getBoolean(KEY_WIFI_ONLY, true)

        try {
            val workManager = WorkManager.getInstance(context)

            val constraints = Constraints.Builder()
                .setRequiredNetworkType(if (wifiOnly) NetworkType.UNMETERED else NetworkType.CONNECTED)
                .setRequiresBatteryNotLow(true)
                .build()

            if (frequency == "unlock") {
                // 亮屏模式：主要通过 ACTION_SCREEN_OFF 即时触发，
                // 同时配置一个 6 小时周期 Worker 负责预加载下一张壁纸与保活补充缓存
                val unlockWorker = PeriodicWorkRequestBuilder<WallpaperRotateWorker>(6, TimeUnit.HOURS)
                    .setConstraints(constraints)
                    .build()

                workManager.enqueueUniquePeriodicWork(
                    WORK_NAME_PERIODIC,
                    ExistingPeriodicWorkPolicy.UPDATE,
                    unlockWorker
                )
                Log.i(TAG, "WorkManager scheduled for unlock mode cache replenishment (6h)")
                return
            }

            val (interval, timeUnit) = when (frequency) {
                "1h" -> Pair(1L, TimeUnit.HOURS)
                "12h" -> Pair(12L, TimeUnit.HOURS)
                "daily" -> Pair(24L, TimeUnit.HOURS)
                else -> Pair(24L, TimeUnit.HOURS)
            }

            val periodicRequest = PeriodicWorkRequestBuilder<WallpaperRotateWorker>(interval, timeUnit)
                .setConstraints(constraints)
                .build()

            workManager.enqueueUniquePeriodicWork(
                WORK_NAME_PERIODIC,
                ExistingPeriodicWorkPolicy.UPDATE,
                periodicRequest
            )
            Log.i(TAG, "WorkManager periodic work scheduled: $interval $timeUnit (wifiOnly=$wifiOnly)")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to schedule WorkManager", e)
        }
    }

    private fun cancelWorkManager(context: Context) {
        try {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME_PERIODIC)
            Log.i(TAG, "WorkManager unique periodic work canceled")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to cancel WorkManager", e)
        }
    }

    /**
     * 供 WorkManager 调用的持久化壁纸更换执行入口
     */
    fun executeRotateFromWorker(context: Context): RotateStatus {
        val prefs = getPrefs(context)
        val enabled = prefs.getBoolean(KEY_ENABLED, false)
        if (!enabled) return RotateStatus.SKIPPED

        val feedUrl = prefs.getString(KEY_FEED_URL, "") ?: ""
        if (feedUrl.isBlank()) return RotateStatus.SKIPPED

        val wifiOnly = prefs.getBoolean(KEY_WIFI_ONLY, true)
        val target = prefs.getString(KEY_TARGET, "lock") ?: "lock"

        if (wifiOnly && !isWifiConnected(context)) {
            Log.d(TAG, "executeRotateFromWorker: Wifi only enabled but not on wifi, skipped")
            return RotateStatus.SKIPPED
        }

        try {
            val cacheFile = getCacheFile(context)
            if (cacheFile.exists() && cacheFile.length() > 0) {
                val bitmap = BitmapFactory.decodeFile(cacheFile.absolutePath)
                if (bitmap != null) {
                    applyBitmapToWallpaper(context, bitmap, target)
                    Log.i(TAG, "Worker applied wallpaper from local cache")
                    cacheFile.delete()
                }
                prefetchNextWallpaper(context, feedUrl, wifiOnly)
                return RotateStatus.SUCCESS
            } else {
                val fetchRes = fetchFeedImageUrl(context, feedUrl)
                if (fetchRes.status == RotateStatus.VIP_EXPIRED) {
                    return RotateStatus.VIP_EXPIRED
                }
                if (fetchRes.imageUrl.isNotBlank()) {
                    val bitmap = downloadBitmap(fetchRes.imageUrl)
                    if (bitmap != null) {
                        applyBitmapToWallpaper(context, bitmap, target)
                        Log.i(TAG, "Worker downloaded and applied online wallpaper: ${fetchRes.imageUrl}")
                    }
                    prefetchNextWallpaper(context, feedUrl, wifiOnly)
                    return RotateStatus.SUCCESS
                }
                return fetchRes.status
            }
        } catch (e: Exception) {
            Log.e(TAG, "executeRotateFromWorker failed", e)
            return RotateStatus.NETWORK_ERROR
        }
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
                    val fetchRes = fetchFeedImageUrl(context, feedUrl)
                    if (fetchRes.status == RotateStatus.VIP_EXPIRED) {
                        Log.w(TAG, "VIP expired during triggerRotate, stopping rotate service")
                        stopAutoRotate(context)
                        return@launch
                    }
                    if (fetchRes.imageUrl.isNotBlank()) {
                        val bitmap = downloadBitmap(fetchRes.imageUrl)
                        if (bitmap != null) {
                            applyBitmapToWallpaper(context, bitmap, target)
                            Log.i(TAG, "Rotated online (no cache): ${fetchRes.imageUrl}")
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
                val fetchRes = fetchFeedImageUrl(context, feedUrl)
                if (fetchRes.status == RotateStatus.VIP_EXPIRED) {
                    Log.w(TAG, "VIP expired during prefetch, stopping rotate service")
                    stopAutoRotate(context)
                    return@launch
                }
                if (fetchRes.imageUrl.isNotBlank()) {
                    val tempFile = File(context.cacheDir, "temp_rotate_prefetch_${System.currentTimeMillis()}.jpg")
                    var conn: HttpURLConnection? = null
                    try {
                        val url = URL(fetchRes.imageUrl)
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
                                Log.i(TAG, "Prefetched next wallpaper successfully to local cache: ${fetchRes.imageUrl}")
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

    /**
     * 请求 Feed 接口获取下一张壁纸图片 URL，且自动识别 403 VIP 到期并触发停止服务
     */
    private fun fetchFeedImageUrl(context: Context, feedUrl: String): FetchFeedResult {
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
                val imgUrl = data?.optString("image_url", "") ?: ""
                FetchFeedResult(RotateStatus.SUCCESS, imgUrl)
            } else if (conn.responseCode == 403) {
                // 收到 403 Forbidden（如 VIP 会员已过期）
                Log.w(TAG, "Feed returned 403 Forbidden: VIP expired or unauthorized")
                FetchFeedResult(RotateStatus.VIP_EXPIRED, "")
            } else {
                FetchFeedResult(RotateStatus.NETWORK_ERROR, "")
            }
        } catch (e: Exception) {
            Log.e(TAG, "fetchFeedImageUrl failed", e)
            FetchFeedResult(RotateStatus.NETWORK_ERROR, "")
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
