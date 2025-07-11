# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# Your application classes
-keep class com.mariam22.GrocerEase.BuildConfig { *; }
-keep class com.mariam22.GrocerEase.MainApplication { *; }
-keep class com.mariam22.GrocerEase.MainActivity { *; }

# React Native FCM
-keep class io.invertase.firebase.** { *; }
-dontwarn io.invertase.firebase.**

# React Native Firebase
-keep class io.invertase.firebase.messaging.** { *; }
-keep class io.invertase.firebase.notifications.** { *; }

# If you're using Firebase Auth with Google Sign-In
-keep class com.google.firebase.auth.** { *; }
-keep class com.google.android.gms.auth.** { *; }

# If you're using Firebase Messaging
-keep class com.google.firebase.messaging.** { *; }
-keepattributes *Annotation*

