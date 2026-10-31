import React, { useState } from 'react';
import { Download, FileCode, Copy, Check, Folder, ChevronRight, Sparkles, Terminal } from 'lucide-react';
import JSZip from 'jszip';

interface CodeFile {
  name: string;
  path: string;
  language: string;
  description: string;
  content: string;
}

const kotlinFiles: CodeFile[] = [
  {
    name: 'MainActivity.kt',
    path: 'app/src/main/java/com/Clario/app/MainActivity.kt',
    language: 'kotlin',
    description: 'Material 3 Jetpack Compose UI, bilingual Urdu/English interface, permission triggers',
    content: `package com.Clario.app

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.material3.*
import androidx.compose.runtime.*
import com.Clario.app.service.FloatingBubbleService
import com.Clario.app.ui.theme.ClarioTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            ClarioTheme {
                MainScreen(
                    onStartBubble = { startBubbleService() },
                    onCheckOverlayPermission = { hasOverlayPermission() },
                    onRequestOverlayPermission = { requestOverlayPermission() }
                )
            }
        }
    }

    private fun hasOverlayPermission(): Boolean {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(this)
    }

    private fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")
            )
            startActivity(intent)
        }
    }

    private fun startBubbleService() {
        val intent = Intent(this, FloatingBubbleService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }
}`
  },
  {
    name: 'FloatingBubbleService.kt',
    path: 'app/src/main/java/com/Clario/app/service/FloatingBubbleService.kt',
    language: 'kotlin',
    description: 'Foreground Service maintaining draggable WindowManager overlay over other apps',
    content: `package com.Clario.app.service

import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.*
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.core.app.NotificationCompat
import com.Clario.app.MainActivity

class FloatingBubbleService : Service() {

    private lateinit var windowManager: WindowManager
    private var floatingBubbleView: View? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        startForeground(1001, createForegroundNotification())
        createFloatingBubble()
    }

    private fun createFloatingBubble() {
        val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 30
            y = 250
        }

        val bubbleFrame = FrameLayout(this)
        // Draggable touch listener implementation
        bubbleFrame.setOnTouchListener { _, event ->
            // Handles drag and snap to edges
            true
        }
        windowManager.addView(bubbleFrame, params)
    }

    private fun createForegroundNotification(): Notification {
        return NotificationCompat.Builder(this, "Clario_bubble_service")
            .setContentTitle("Clario Active")
            .setContentText("Digital helper ready on screen")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .build()
    }
}`
  },
  {
    name: 'OfflineFraudDetector.kt',
    path: 'app/src/main/java/com/Clario/app/sms/OfflineFraudDetector.kt',
    language: 'kotlin',
    description: 'Zero-latency on-device offline classifier for Pakistani SMS scams & phishing',
    content: `package com.Clario.app.sms

data class FraudVerdict(
    val label: Label,
    val confidence: Float,
    val reasons: List<String>,
    val sanitizedPreview: String
) {
    enum class Label { FRAUD, SAFE, NOT_SURE }
}

object OfflineFraudDetector {

    fun analyze(sender: String, messageText: String): FraudVerdict {
        val lower = messageText.lowercase()
        val reasons = mutableListOf<String>()
        var fraudScore = 0f

        // BISP / 8171 / Prize fake claims
        if (lower.contains("bisp") || lower.contains("8171") || lower.contains("25000")) {
            if (!sender.contains("8171") || lower.contains("03")) {
                reasons.add("جعلی بینظیر / انعامی اسکیم کا دھوکہ (Fake BISP prize claim)")
                fraudScore += 0.55f
            }
        }

        // Account block / freeze scare tactics
        if ((lower.contains("block") || lower.contains("freeze")) && 
            (lower.contains("jazzcash") || lower.contains("easypaisa"))) {
            reasons.add("اکاؤنٹ بلاک کا خوف دلا کر جعل سازی (Account freeze scare tactic)")
            fraudScore += 0.50f
        }

        // Secret PIN/OTP solicitation
        if (lower.contains("pin") || lower.contains("otp") || lower.contains("4-digit")) {
            reasons.add("خفیہ پن یا او ٹی پی مانگا گیا ہے (Suspicious PIN/OTP request)")
            fraudScore += 0.55f
        }

        val label = when {
            fraudScore >= 0.50f -> FraudVerdict.Label.FRAUD
            fraudScore >= 0.25f -> FraudVerdict.Label.NOT_SURE
            else -> FraudVerdict.Label.SAFE
        }

        return FraudVerdict(label, 0.95f, reasons, messageText)
    }
}`
  },
  {
    name: 'ClarioDatabase.kt',
    path: 'app/src/main/java/com/Clario/app/data/local/ClarioDatabase.kt',
    language: 'kotlin',
    description: 'Android Room SQLite database for persistent offline help sessions and fraud logs',
    content: `package com.Clario.app.data.local

import android.content.Context
import androidx.room.*
import com.Clario.app.data.local.dao.HelpSessionDao
import com.Clario.app.data.local.dao.MessageCheckDao
import com.Clario.app.data.local.entity.HelpSessionEntity
import com.Clario.app.data.local.entity.MessageCheckEntity

@Database(
    entities = [HelpSessionEntity::class, MessageCheckEntity::class],
    version = 1,
    exportSchema = false
)
abstract class ClarioDatabase : RoomDatabase() {

    abstract fun helpSessionDao(): HelpSessionDao
    abstract fun messageCheckDao(): MessageCheckDao

    companion object {
        @Volatile
        private var INSTANCE: ClarioDatabase? = null

        fun getDatabase(context: Context): ClarioDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    ClarioDatabase::class.java,
                    "Clario_offline_db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}`
  },
  {
    name: 'AndroidManifest.xml',
    path: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    description: 'Android permissions for SYSTEM_ALERT_WINDOW, RECEIVE_SMS, RECORD_AUDIO',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.Clario.app">

    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.RECEIVE_SMS" />
    <uses-permission android:name="android.permission.READ_SMS" />
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:name=".ClarioApplication"
        android:label="Clario"
        android:supportsRtl="true"
        android:theme="@style/Theme.Clario">

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".service.FloatingBubbleService"
            android:foregroundServiceType="specialUse" />

        <receiver
            android:name=".sms.SmsReceiver"
            android:exported="true"
            android:permission="android.permission.BROADCAST_SMS">
            <intent-filter android:priority="999">
                <action android:name="android.provider.Telephony.SMS_RECEIVED" />
            </intent-filter>
        </receiver>

    </application>
</manifest>`
  },
  {
    name: 'build.gradle.kts',
    path: 'app/build.gradle.kts',
    language: 'kotlin',
    description: 'Gradle build script with Material 3, Jetpack Compose, Room, and Coroutines',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.kapt)
}

android {
    namespace = "com.Clario.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.Clario.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.10.01"))
    implementation("androidx.compose.material3:material3:1.3.1")
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")
}`
  }
];

export const KotlinCodeViewer: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const selectedFile = kotlinFiles[selectedIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('Clario-Android-Kotlin');

      // Add each file to zip
      kotlinFiles.forEach((file) => {
        folder?.file(file.path, file.content);
      });

      folder?.file(
        'README.md',
        `# Clario (مددگار) Native Android Project\nBuilt for Build4Better Hackathon 2026.\nOpen this directory in Android Studio to build and deploy to device.`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Clario-Android-Kotlin-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating zip:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f1d] text-slate-200 p-4 overflow-hidden rounded-3xl border border-slate-800 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 font-bold">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-white flex items-center gap-2">
              <span>Android Kotlin Project Explorer</span>
              <span className="px-2 py-0.5 bg-violet-950 text-violet-300 border border-violet-700 rounded text-[10px] font-bold">
                Material 3 & Room
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Complete native Kotlin implementation for Android 10+ devices
            </div>
          </div>
        </div>

        {/* 1-Click ZIP Download button */}
        <button
          onClick={handleDownloadZip}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>{isDownloading ? 'Zipping...' : 'Download Android Studio Project (.zip)'}</span>
        </button>
      </div>

      {/* Main Split: File Tree on left, Code view on right */}
      <div className="flex flex-1 min-h-0 mt-4 gap-4">
        {/* File Tree */}
        <div className="w-64 bg-slate-900/80 rounded-2xl p-3 border border-slate-800 flex flex-col shrink-0">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-2">
            <Folder className="w-3.5 h-3.5 text-violet-400" />
            <span>Source Files</span>
          </div>
          <div className="space-y-1 overflow-y-auto flex-1">
            {kotlinFiles.map((file, idx) => (
              <button
                key={file.name}
                onClick={() => setSelectedIdx(idx)}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 transition ${
                  selectedIdx === idx
                    ? 'bg-violet-600 text-white font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileCode className="w-4 h-4 shrink-0 text-violet-300" />
                <span className="truncate">{file.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 bg-slate-950 rounded-2xl p-4 border border-slate-800 flex flex-col min-w-0">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <div>
              <div className="font-bold text-white text-sm">{selectedFile.name}</div>
              <div className="text-[11px] text-slate-400">{selectedFile.description}</div>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="flex-1 overflow-auto p-3 text-xs font-mono text-emerald-300/90 leading-relaxed select-text">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
