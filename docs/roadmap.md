# Çalışma planı ve durum

## Tamamlanan

- [x] Resmi ödev PDF'ini ve scheduling kurallarını okuma.
- [x] Ready queue, burst, preemption, T/W/R ayrımını tekrar etme.
- [x] A ve B'yi dört algoritmayla elle çözme (RR q=2).
- [x] React + TypeScript + Vite / pnpm proje yapısı.
- [x] Dört algoritmalı bağımsız motor ve input validation.
- [x] Gantt, idle aralıkları, RR quantum sınırları ve karar adımları.
- [x] Process CRUD, örnek yükleme, metrikler, karşılaştırma ve JSON export.
- [x] Sekiz referans çözümü otomatik karşılaştırma; ek test workload'ları.
- [x] Yerel typecheck/build ve unit testler.
- [x] Tarayıcı akışları; mobil taşma düzeltmesi.

## Öğrenme ve teslim için sıradaki işler

- [ ] Öğrenciyle `scheduler.ts` ve testleri adım adım inceleme; yabancı workload'u açıklama.
- [ ] Workload A'da RR q=1,2,4 için önce elle hesap, sonra simülatörle karşılaştırma.
- [ ] SJF/SRTF aynı schedule koşulları, burst tahmini ve starvation analizlerini rapor diline çevirme.
- [ ] Üç ek workload'u öğrencinin incelemesi / kendi örnekleriyle geliştirmesi.
- [ ] Arayüz üzerinde öğrencinin kullanarak değerlendirmesi.
- [x] GitHub hedefi ve görünürlüğünü belirleme; ilk commit/push için açık yetkilendirme.
- [x] Public kaynak repository oluşturma: https://github.com/yeturk/CSE513-HW1 (dev).
- [ ] Erişim izni istemeyen çalışan website'i yayımlama.
- [ ] İlk sayfada canlı website adresi olan PDF raporu oluşturma.
- [ ] Rapora sekiz örneğin girdi, elle çözüm, simülatör çıktısı ve karşılaştırmasını ekleme.
- [ ] Analiz, ek testler ve AI beyanını son kez kontrol etme.
- [ ] Teams teslimi (öğrenci).

## Yerel doğrulama kaydı

25 Ekim 2026: 34 unit test geçti (bir test ayrıca 100 workload × dört algoritmanın invariant'larını kontrol eder).
Sekiz hand-calculated golden örnekte fark yok. Production build ve TypeScript kontrolü geçti.
5 tarayıcı testi Windows'ta Microsoft Edge ile geçti; Ubuntu CI henüz çalıştırılmadı.
GitHub Actions ve elle başlatılan Pages workflow dosyaları hazır; henüz uzakta çalıştırılmadı.

Son teslim saati kaynak PDF ve web sayfasında "To be announced" olarak görünüyor;
Teams'teki öğretim üyesi duyurusu ayrıca kontrol edilmeli.
