# AI kullanım kaydı — taslak

Bu kayıt teslim raporundaki kısa AI beyanı için kaynak olacak. Öğrenci inceleyip kendi anladığı
ve doğruladığı çalışmayı yansıttığını onayladıktan sonra rapora aktarılmalı.

## Kullanılan araçlar

- **Codex:** Ödev gereksinimlerinin okunması, Türkçe kavram tekrarı, elle çözümde adım adım yönlendirme,
  öğrencinin metrik hesaplarının kontrolü; React/TypeScript uygulamasının, testlerin ve dokümantasyonun hazırlanması.
- **Claude Code CLI / frontend-design:** Arayüz için renk, düzen, erişilebilirlik ve etkileşim önerisi.
  Bu çalıştırmada Claude'a araç kullanımı verilmedi; dosya düzenlemedi veya Git işlemi yapmadı.
  Skill metni doğrudan tasarım isteğine dahil edildi.

## Nasıl kontrol edildi?

- A ve B workload'ları uygulama geliştirilmeden önce öğrenciyle elle çözüldü.
- Sekiz bağımsız timeline, first start, completion ve ortalama beklentisi unit testlere aktarıldı.
- Üç ek workload ve SRTF eşitliği / RR sınır sırası gibi uç durumlar ayrıca kontrol edildi.
- 100 deterministik workload × dört algoritmada invariant kontrolleri uygulandı.
- TypeScript kontrolü, production build ve gerçek tarayıcı testleri çalıştırıldı.
- Masaüstü ve mobil screenshot'lar görsel olarak incelendi.

## Düzeltilen veya reddedilen AI önerisi

Claude tasarım brief'inde Workload B için ikinci idle aralığını **5–8** olarak yazdı.
Elle hesapta P1/P2 toplam işi t=2'den t=6'ya kadar sürdüğü için doğru aralık **6–8**.
Öneri düzeltilerek uygulama ve testlerde elle doğrulanmış değer kullanıldı.
Brief'in metrik sütun listesinde first start yoktu; ödev bunu istediği için uygulamaya eklendi.

## Testin ortaya çıkardığı gerçek uygulama hatası

İlk mobil testte 390 px ekranda sonuç alanı 533 px genişledi; sayfa yatay taşıyordu.
Neden: iç CSS grid'in sütunu min-content boyutunun altına daralamıyordu.
Sonuç grid'ine `minmax(0,1fr)`, panellere `min-width:0` uygulanarak tablo/Gantt kaydırması
kendi çerçevesine alındı. Aynı tarayıcı testi tekrar çalıştırılarak düzeltme doğrulandı.

## Açık durum

AI'nin kodu yazması, öğrencinin kodun tamamını bağımsız açıklayabildiğini kanıtlamaz.
Motoru ve testleri birlikte inceleme, q=1/2/4 analizi ve final rapor halen çalışma planındadır.
Karşılaşılmamış bir algoritma hatası yaşanmış gibi anlatılmamıştır.
