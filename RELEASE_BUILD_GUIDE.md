# 🚀 Release APK/AAB Oluşturma Kılavuzu

## Adım 1: Projeyi Android Studio'da Aç

```powershell
npm run cap:open:android
```

## Adım 2: Build Variant'ı Seç

Android Studio'da:

- **Build → Select Build Variant**
- **release** seçeneğini seç

## Adım 3: Signed Bundle/APK Oluştur

### Android App Bundle (AAB) - Play Store İçin Önerilir ⭐

1. **Build → Generate Signed Bundle / APK**
2. **Android App Bundle** seç → **Next**
3. Keystore bilgilerini gir:
   - **Key store path**: `keystore/hypertapblitz-release.keystore`
   - **Key store password**: `MTGSoft2025!@Secure`
   - **Key alias**: `hypertapblitz`
   - **Key password**: `MTGSoft2025!@Secure`
4. **Next** → **release** seç
5. **Create**

**Çıktı**: `android/app/release/app-release.aab`

### APK - Direkt Kurulum İçin

Aynı adımları takip et ama 2. adımda **APK** seç.

**Çıktı**: `android/app/release/app-release.apk`

---

## Adım 4: Play Store'a Yükleme Öncesi Kontrol

### ✅ Checklist

- [ ] AdMob test ad ID'lerini **production ID'lerle değiştirdin mi**?
  - `utils/admob.ts` dosyasını kontrol et
  - `AndroidManifest.xml` içindeki AdMob app ID'yi güncelle
  
- [ ] Version code ve name güncel mi?
  - `android/app/build.gradle` → `versionCode` ve `versionName`
  
- [ ] Uygulama ikonu doğru mu?
  - Android Studio'da oluşturduğun ikonu kontrol et
  
- [ ] İzinler doğru mu?
  - `AndroidManifest.xml` → Sadece gerekli izinler var mı?

- [ ] Proguard kuralları eksiksiz mi?
  - AdMob için gerekli kurallar `proguard-rules.pro`'da

---

## Adım 5: Play Console'a Yükleme

1. **Google Play Console**'a git: <https://play.google.com/console>
2. **Create App** → Uygulama bilgilerini gir
3. **Production** → **Create new release**
4. AAB dosyasını yükle
5. Release notes yaz
6. **Review release** → **Start rollout to Production**

---

## 🔄 Güncelleme Yaparken

Her güncelleme için:

1. **Version Code**'u artır (örn: 1 → 2)
2. **Version Name**'i güncelle (örn: "1.0" → "1.1")
3. Yukarıdaki adımları tekrarla

**Önemli**: Aynı keystore'u kullanmalısın, yoksa güncelleme yükleyemezsin!

---

## 📱 Test Etme

### Yerel Test (Debug)

```powershell
npm run build
npm run cap:sync
npm run cap:open:android
# Run butonuna bas
```

### Release APK Test

1. APK'yı oluştur (yukarıdaki adımlar)
2. APK'yı telefona kopyala
3. Kurulumu yap
4. Test et:
   - Reklamlar çalışıyor mu?
   - Crash oluyor mu?
   - Performans iyi mi?

---

## 🐛 Sık Karşılaşılan Sorunlar

### "Keystore password was incorrect"

- Şifrenin doğru olduğundan emin ol
- `keystore/KEYSTORE_INFO.md` dosyasını kontrol et

### "Duplicate resources"

- `./gradlew clean` çalıştır
- Projeyi yeniden build et

### "App not installed"

- Eski versiyonu kaldır
- Yeniden kur

---

**Son Güncelleme**: 22 Kasım 2025  
**Keystore**: `keystore/hypertapblitz-release.keystore`  
**Package**: com.mtgsoftworks.hypertapblitz
