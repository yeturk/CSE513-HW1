# Ek test workload'ları

Bunlar uygulama sırasında AI desteğiyle önerilmiş ve otomatikleştirilmiş testlerdir.
Öğrencinin rapora almadan önce kararları bağımsız açıklaması ve gerekirse kendi örnekleriyle genişletmesi gerekir.

## 1. Başlangıçta ve arada idle

X(arrival=3, burst=1), Y(arrival=7, burst=2). RR q=2.
Bütün algoritmalar için beklenen timeline:

`Idle [0,3), X [3,4), Idle [4,7), Y [7,9)`

Her iki process için W=R=0; T değerleri 1 ve 2. Ortalamalar T=1,5; W=R=0.
Kontrol: henüz gelmemiş process çalışamaz ve idle süre process waiting'ine eklenmez.

## 2. Eşzamanlı geliş ve seçim eşitliği

Giriş sırası Z(arrival=0, burst=1), A(arrival=0, burst=1). RR q=2.
Bütün algoritmalar için `Z [0,1), A [1,2)` beklenir.
Z: T=1,W=0,R=0. A: T=2,W=1,R=1. Ortalamalar 1,5 / 0,5 / 0,5.
Kontrol: alfabetik ID sırası yerine giriş sırası kullanılır.

## 3. SRTF preemption

L(arrival=0, burst=5), S(arrival=1, burst=1).
SRTF: `L [0,1), S [1,2), L [2,6)`.
L: T=6,W=1,R=0. S: T=1,W=0,R=0. Ortalamalar 3,5 / 0,5 / 0.
Kontrol: t=1'de S(1), L kalan(4)'ten kısa olduğundan preemption yapılır.

## Ek sınır kontrolleri

- SRTF: Z(0,2), A(1,1) → Z [0,2), A [2,3). Eşit kalan süre çalışanı kesmez.
- RR: P1(0,4), P2(2,1), P3(1,1), q=2 → t=2 kuyruğu P3,P2,P1.
- RR: Solo(0,4), q=2 → Solo [0,2), Solo [2,4). Dilimler birleştirilmez; biten iş tekrar eklenmez.
- SJF: Later(2,2), Earlier(1,2), Block(0,4) → Block, Earlier, Later. Burst eşitliğinde önce arrival.
- Negatif/kesirli/boş/sonsuz süreler, tekrarlanan/boş ID ve quantum=0 reddedilir.

100 sabit seed'li workload bütün algoritmalarla çalıştırılır. Her birinde burst toplamı,
arrival öncesi çalışmama, overlap olmaması, negatif olmayan waiting/response ve ready varken
idle olmama kontrol edilir. Bu invariant testleri tek başına politika doğruluğunu kanıtlamaz;
sekiz bağımsız referans ve sınır örnekleri bu nedenle ayrıca bulunur.
