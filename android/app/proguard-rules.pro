# Capacitor Core - ASLA SİLME!
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * {
    @com.getcapacitor.annotation.PermissionCallback <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
    @com.getcapacitor.PluginMethod public <methods>;
}

# MainActivity - KRİTİK!
-keep class com.mtgsoftworks.hypertapblitz.MainActivity { *; }
-keep class com.getcapacitor.BridgeActivity { *; }
-keep class com.getcapacitor.Bridge { *; }

# AdMob
-keep class com.google.android.gms.ads.** { *; }
-dontwarn com.google.android.gms.ads.**

# Capacitor Plugins
-keep class com.capacitorjs.plugins.** { *; }
-keep class app.capacitor.** { *; }

# WebView JavaScript
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keepattributes *Annotation*

# JSON
-keepattributes Signature
-dontwarn org.json.**

# AndroidX
-keep class androidx.** { *; }
-dontwarn androidx.**

# Debug info
-keepattributes SourceFile,LineNumberTable

# Android components
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
