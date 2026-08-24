package uts.sdk.modules.egoWidget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast

class EgoDailyWidgetProvider2x2 : AppWidgetProvider() {
    companion object {
        private const val TAG = "EgoWidget2x2"
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        super.onUpdate(context, appWidgetManager, appWidgetIds)
        Log.d(TAG, "onUpdate called for ${appWidgetIds.size} widgets")
        for (appWidgetId in appWidgetIds) {
            WidgetHelper.updateWidget(context, appWidgetManager, appWidgetId, "2x2", isRefresh = false)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        Log.d(TAG, "onReceive action=${intent.action}")

        if (intent.action == WidgetHelper.ACTION_REFRESH_2X2) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val appWidgetId = intent.getIntExtra(
                AppWidgetManager.EXTRA_APPWIDGET_ID,
                AppWidgetManager.INVALID_APPWIDGET_ID
            )
            val resId = context.resources.getIdentifier("widget_toast_refreshing", "string", context.packageName)
            val msg = if (resId != 0) context.getString(resId) else "Refreshing wallpaper..."
            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()

            if (appWidgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
                WidgetHelper.showLoadingState(context, appWidgetManager, appWidgetId, "2x2")
                WidgetHelper.updateWidget(context, appWidgetManager, appWidgetId, "2x2", isRefresh = true)
            } else {
                WidgetHelper.updateAllWidgets(context, isRefresh = true)
            }
        }
    }
}

class EgoDailyWidgetProvider4x2 : AppWidgetProvider() {
    companion object {
        private const val TAG = "EgoWidget4x2"
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        super.onUpdate(context, appWidgetManager, appWidgetIds)
        Log.d(TAG, "onUpdate called for ${appWidgetIds.size} widgets")
        for (appWidgetId in appWidgetIds) {
            WidgetHelper.updateWidget(context, appWidgetManager, appWidgetId, "4x2", isRefresh = false)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        Log.d(TAG, "onReceive action=${intent.action}")

        if (intent.action == WidgetHelper.ACTION_REFRESH_4X2) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val appWidgetId = intent.getIntExtra(
                AppWidgetManager.EXTRA_APPWIDGET_ID,
                AppWidgetManager.INVALID_APPWIDGET_ID
            )
            val resId = context.resources.getIdentifier("widget_toast_refreshing", "string", context.packageName)
            val msg = if (resId != 0) context.getString(resId) else "Refreshing wallpaper..."
            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()

            if (appWidgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
                WidgetHelper.showLoadingState(context, appWidgetManager, appWidgetId, "4x2")
                WidgetHelper.updateWidget(context, appWidgetManager, appWidgetId, "4x2", isRefresh = true)
            } else {
                WidgetHelper.updateAllWidgets(context, isRefresh = true)
            }
        }
    }
}

class EgoDailyWidgetProvider4x4 : AppWidgetProvider() {
    companion object {
        private const val TAG = "EgoWidget4x4"
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        super.onUpdate(context, appWidgetManager, appWidgetIds)
        Log.d(TAG, "onUpdate called for ${appWidgetIds.size} widgets")
        for (appWidgetId in appWidgetIds) {
            WidgetHelper.updateWidget(context, appWidgetManager, appWidgetId, "4x4", isRefresh = false)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        Log.d(TAG, "onReceive action=${intent.action}")

        if (intent.action == WidgetHelper.ACTION_REFRESH_4X4) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val appWidgetId = intent.getIntExtra(
                AppWidgetManager.EXTRA_APPWIDGET_ID,
                AppWidgetManager.INVALID_APPWIDGET_ID
            )
            val resId = context.resources.getIdentifier("widget_toast_refreshing", "string", context.packageName)
            val msg = if (resId != 0) context.getString(resId) else "Refreshing wallpaper..."
            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()

            if (appWidgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
                WidgetHelper.showLoadingState(context, appWidgetManager, appWidgetId, "4x4")
                WidgetHelper.updateWidget(context, appWidgetManager, appWidgetId, "4x4", isRefresh = true)
            } else {
                WidgetHelper.updateAllWidgets(context, isRefresh = true)
            }
        }
    }
}
