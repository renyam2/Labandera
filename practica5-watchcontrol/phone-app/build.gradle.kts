plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "mx.labandera.watchcontrol.phone"
    compileSdk = 34

    defaultConfig {
        applicationId = "mx.labandera.watchcontrol"
        minSdk = 30
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    // Wearable Data Layer (MessageClient)
    implementation("com.google.android.gms:play-services-wearable:20.0.1")
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    // Fijadas a versiones con artefactos en caché local (transitivas de appcompat)
    implementation("androidx.activity:activity:1.8.0")
    implementation("androidx.drawerlayout:drawerlayout:1.1.1")
}