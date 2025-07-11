#!/bin/bash

# Navigate to the android directory
cd "$(dirname "$0")"

# Clean the project
./gradlew clean

# Build the release APK
./gradlew assembleRelease

# Find the APK file
APK_PATH=$(find . -name "*.apk" | grep -i release)

if [ -z "$APK_PATH" ]; then
    echo "Error: APK file not found!"
    exit 1
fi

# Install on connected device
adb install -r "$APK_PATH"

echo "APK installed successfully!"
echo "APK location: $APK_PATH"
