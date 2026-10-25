# Uygulamanın yapısı

## Veri akışı

ProcessEditor → doğrulama → simulate() → immutable sonuç snapshot'ı → Timeline / Results / Comparison.

React UI, scheduling kararı vermez. `src/domain/scheduler.ts` DOM, React ve gerçek saatten bağımsızdır.
Girdi kopyalanır; orijinal burst korunur. Kalan iş `remaining` alanında azaltılır.
First start başlangıçta `null`dır; t=0 geçerli olduğundan truthy/falsy kontrolü yapılmaz.

## Simülasyon saati

Motor event-driven çalışır: birer saniye gerçek zaman beklemek yerine bir sonraki anlamlı ana atlar.

- FCFS/SJF: seçilen işin completion zamanı.
- SRTF: bir sonraki arrival veya completion; hangisi önceyse.
- RR: quantum sonu veya completion; hangisi önceyse.
- Hazır process yoksa: bir sonraki arrival; aradaki süre explicit idle segmentidir.

`[start,end)` aralığı `end-start` CPU birimi verir.
FCFS/SJF/SRTF'de kesintisiz aynı process aralıkları Gantt için birleştirilir; karar kayıtları korunur.
RR'de her quantum ayrı segment olarak kalır.

## Eşitlik ve kuyruk

FCFS arrival, SJF burst ve SRTF remaining ölçütüyle seçim yapar. Eşitlikler arrival ve giriş index'iyle çözülür.
SRTF'nin çalışanı koruyan eşitlik kuralı genel sıralamadan önce gelir.
RR gerçek FIFO kuyruğu tutar; aralık boyunca ve tam sınırda gelenleri arrival/index sırasıyla ekler,
ardından bitmemiş çalışanı sona koyar. Tamamlanan iş tekrar eklenmez.

Karar görünümündeki adaylar seçimden hemen öncesini gösterir ve seçileni içerir.
RR dışındaki listeler FIFO sırası değildir; politikaya göre sıralanmış adaylardır.
Idle kararının aday listesi boştur.

## Sonuçların tutarlılığı

Taslak input ile son çalıştırılan snapshot ayrı tutulur. Girdi değişirse uyarı gösterilir;
Gantt, metrikler, process renkleri ve karşılaştırma eski snapshot'a bağlı kalır.
Yeni çalışma başarılı olduğunda snapshot yenilenir, karar adımı ve karşılaştırma sıfırlanır.
Hatalı giriş eski sonucu bozmaz. Karşılaştırma RR quantum'unu da son başarılı çalıştırmadan alır.

JSON indirmesi yalnızca son çalışma verilerini ve varsa karşılaştırmayı içerir.
Backend veya kalıcı sunucu depolaması yoktur; sayfa yenilenince başlangıç örneğine dönülür.

## Görsel kararlar

Claude CLI'ya frontend-design skill metni verilerek tasarım danışmanlığı alındı.
Editör / sonuç alanı ayrımı, ölçülü Gantt, taralı idle, renk + metinle process tanımı,
sonuçların eskidiğini açıkça gösterme benimsendi. İlk start sütunu gereksinim gereği korundu.
Yerel Manrope fontu kullanıldı; dışarıdan font isteği yapılmaz.

## Kontrol noktaları

- Bir process'in toplam segment süresi = burst.
- First start = o process'in ilk segment başlangıcı.
- Completion = son segment bitişi.
- Timeline t=0'dan son bitişe kadar boşluksuz; boş süreler idle olarak modellenir.
- Ortalama turnaround − ortalama waiting = ortalama burst.
- Algoritmanın doğru seçimi bağımsız golden workload'larla sınanır.
