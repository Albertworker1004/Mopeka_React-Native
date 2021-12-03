
# **Requirements**

```
$ npm install cordova@^9.0.0 -g
```

```
$ git clone git@gitlab.com:mopeka/tank_check.git
$ cd tank_check
$ npm install
```

### **The Cordova application builds using the following platform version:**

ios@5.0.0

https://cordova.apache.org/docs/en/latest/guide/platforms/ios/#installing-the-requirements

Xcode 11+ with command line tools installed

```
$ xcode-select --install
$ npm install -g ios-deploy
$ sudo gem install cocoapods
```


```
$ cordova requirements

Requirements check results for ios:
Apple macOS: installed darwin
Xcode: installed 11.1
ios-deploy: installed 1.9.4
CocoaPods: installed 1.8.0
```

android@8.1.0

https://cordova.apache.org/docs/en/latest/guide/platforms/android/#installing-the-requirements

**Install JDK8**
You can use JDK from Oracle, but JDK8 is a pain to get from them.

If you are on OSX or Linux use [OpenJDK](https://openjdk.java.net/install/)

If you are on Windows [AdoptOpenJDK](https://adoptopenjdk.net/?variant=openjdk8&jvmVariant=hotspot) or [Oracle JDK 8](https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)



**Install the latest android studio.**

Open the Android SDK Manager (Tools > SDK Manager in Android Studio, or sdkmanager on the command line), and make sure the following are installed:

1. Android Platform SDK for your targeted version of Android
2. Android SDK build-tools version 19.1.0 or higher
3. Android Support Repository (found under the "SDK Tools" tab)

**Setup Environmenet Variables**

1. Set the JAVA_HOME environment variable to the location of your JDK installation
2. Set the ANDROID_HOME environment variable to the location of your Android SDK installation
3. It is also recommended that you add the Android SDK's tools, tools/bin, and platform-tools directories to your PATH

**Install Gradle**

https://gradle.org/install/



After installing all the requirements you can verify you are ready to go by running:

```
$ cordova requirements

Requirements check results for android:
Java JDK: installed 1.8.0
Android SDK: installed true
Android target: installed android-29,android-28,android-26,android-25
Gradle: installed C:\gradle\gradle-5.6-rc-2\bin\gradle
```

# **Running/Building**

Assuming a correctly setup build environment; Cordova will take care of everything using the standard cordova build commands: `prepare` and `build`

All source files are bundled with Webpack automatically by a Cordova plugin

When running the standard cordova build commands be sure to add the client target flag. Example:


```
$ cordova prepare ios --tankcheck
```

**or**

```
$ cordova build ios --tankcheck [--release]
```

The build flag will tell the build hooks to move the respective brand specific images, and tank definitions to the proper location for building


# **Build Issues**

## iOS

On iOS there is an issue with dependencies not playing will together and overriding build settings of each other.

The first time you build the project on a mac and it generates the .xcode workspace you will need to do the following:

```
$ cd ./platforms/ios
```
Ensure that `use_frameworks!` is included in the podfile then:

```
$ pod install
```

Open the xcode workspace and goto the build settings

Ensure the build setting `ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES` is set to `$(inherited)` for the main build target and all pods

This is supposed to be set by a plugin after build hook, but that isn't consistently running. Some plugins are overriding this and it can causes build failures.