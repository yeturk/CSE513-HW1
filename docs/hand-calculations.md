# Elle çözülen referanslar

Bu hesaplar, simülatör yazılmadan önce öğrenciyle adım adım çözüldü ve sohbet içinde kontrol edildi.
Buraya o çözümler aktarılmıştır; simülatör çıktısından türetilmemiştir.
Otomatik karşılaştırmaları `tests/unit/scheduler.test.ts` içindeki sekiz golden test yapar.

S = first start, C = completion, T = turnaround, W = waiting, R = response.
Her satırda T = C − arrival, W = T − burst, R = S − arrival.
Zamanlar birimsiz simülasyon değerleridir. RR quantum = 2.

## Workload A girdileri

| ID | Arrival | Burst |
|---|---:|---:|
| P1 | 0 | 8 |
| P2 | 1 | 4 |
| P3 | 2 | 2 |
| P4 | 4 | 1 |

### A — FCFS

Timeline: P1 [0,8), P2 [8,12), P3 [12,14), P4 [14,15).
P1 çalışırken gelenler geliş sırasıyla bekler. Kısa burst, FCFS'de sıra değiştirmez.

| ID | S | C | T | W | R |
|---|---:|---:|---:|---:|---:|
| P1 | 0 | 8 | 8 | 0 | 0 |
| P2 | 8 | 12 | 11 | 7 | 7 |
| P3 | 12 | 14 | 12 | 10 | 10 |
| P4 | 14 | 15 | 11 | 10 | 10 |
| Ortalama | | | 10,5 | 6,75 | 6,75 |

Örnek ara hesap: P2 için T = 12−1 = 11, W = 11−4 = 7, R = 8−1 = 7.

### A — SJF

Timeline: P1 [0,8), P4 [8,9), P3 [9,11), P2 [11,15).
t=0'da yalnız P1 hazırdır; sonradan gelen kısa işler onu kesmez.
t=8'de burst sırası P4(1), P3(2), P2(4) olur.

| ID | S | C | T | W | R |
|---|---:|---:|---:|---:|---:|
| P1 | 0 | 8 | 8 | 0 | 0 |
| P2 | 11 | 15 | 14 | 10 | 10 |
| P3 | 9 | 11 | 9 | 7 | 7 |
| P4 | 8 | 9 | 5 | 4 | 4 |
| Ortalama | | | 9 | 5,25 | 5,25 |

Örnek ara hesap: P3 için T = 11−2 = 9, W = 9−2 = 7, R = 9−2 = 7.

### A — SRTF

Timeline: P1 [0,1), P2 [1,2), P3 [2,4), P4 [4,5), P2 [5,8), P1 [8,15).
t=1'de P2(4), P1 kalan(7)'den kısadır. t=2'de P3(2), P2 kalan(3)'ten kısadır.
t=4'te P3 zaten bitmiştir; P4(1) seçilir. Bu anda preemption yoktur.

| ID | S | C | T | W | R |
|---|---:|---:|---:|---:|---:|
| P1 | 0 | 15 | 15 | 7 | 0 |
| P2 | 1 | 8 | 7 | 3 | 0 |
| P3 | 2 | 4 | 2 | 0 | 0 |
| P4 | 4 | 5 | 1 | 0 | 0 |
| Ortalama | | | 6,25 | 2,5 | 0 |

Örnek ara hesap: P1 için T = 15−0 = 15, W = 15−8 = 7, R = 0−0 = 0.
Response sıfır olsa da daha sonraki ready beklemeleri waiting'e dahildir.

### A — RR, q=2

Timeline: P1 [0,2), P2 [2,4), P3 [4,6), P1 [6,8), P4 [8,9),
P2 [9,11), P1 [11,13), P1 [13,15).
t=2 kuyruğu P2,P3,P1; t=4 kuyruğu P3,P1,P4,P2.
P1'in son iki quantum'u ayrı tutulur.

| ID | S | C | T | W | R |
|---|---:|---:|---:|---:|---:|
| P1 | 0 | 15 | 15 | 7 | 0 |
| P2 | 2 | 11 | 10 | 6 | 1 |
| P3 | 4 | 6 | 4 | 2 | 2 |
| P4 | 8 | 9 | 5 | 4 | 4 |
| Ortalama | | | 8,5 | 4,75 | 1,75 |

Örnek ara hesap: P2 için T = 11−1 = 10, W = 10−4 = 6, R = 2−1 = 1.
Beklemeler [1,2) ve [4,9): 1+5=6.

## Workload B girdileri

| ID | Arrival | Burst |
|---|---:|---:|
| P1 | 2 | 3 |
| P2 | 2 | 1 |
| P3 | 8 | 2 |
| P4 | 9 | 1 |

### B — FCFS

Timeline: Idle [0,2), P1 [2,5), P2 [5,6), Idle [6,8), P3 [8,10), P4 [10,11).
P1 ve P2 eşzamanlı geldiği için giriş sırası kullanılır.

| ID | S | C | T | W | R |
|---|---:|---:|---:|---:|---:|
| P1 | 2 | 5 | 3 | 0 | 0 |
| P2 | 5 | 6 | 4 | 3 | 3 |
| P3 | 8 | 10 | 2 | 0 | 0 |
| P4 | 10 | 11 | 2 | 1 | 1 |
| Ortalama | | | 2,75 | 1 | 1 |

Örnek ara hesap: P2 için T = 6−2 = 4, W = 4−1 = 3, R = 5−2 = 3.
Process gelmeden geçen idle süre onun waiting süresi değildir.

### B — SJF

Timeline: Idle [0,2), P2 [2,3), P1 [3,6), Idle [6,8), P3 [8,10), P4 [10,11).
t=2'de P2 daha kısa olduğu için önce çalışır. t=9'da P4, non-preemptive P3'ü kesemez.

| ID | S | C | T | W | R |
|---|---:|---:|---:|---:|---:|
| P1 | 3 | 6 | 4 | 1 | 1 |
| P2 | 2 | 3 | 1 | 0 | 0 |
| P3 | 8 | 10 | 2 | 0 | 0 |
| P4 | 10 | 11 | 2 | 1 | 1 |
| Ortalama | | | 2,25 | 0,5 | 0,5 |

Örnek ara hesap: P1 için T = 6−2 = 4, W = 4−3 = 1, R = 3−2 = 1.

### B — SRTF

Timeline: Idle [0,2), P2 [2,3), P1 [3,6), Idle [6,8), P3 [8,10), P4 [10,11).
t=9'da P3 kalan=1, P4 burst=1. Eşitlikte P3 devam eder; SJF ile aynı schedule oluşur.

| ID | S | C | T | W | R |
|---|---:|---:|---:|---:|---:|
| P1 | 3 | 6 | 4 | 1 | 1 |
| P2 | 2 | 3 | 1 | 0 | 0 |
| P3 | 8 | 10 | 2 | 0 | 0 |
| P4 | 10 | 11 | 2 | 1 | 1 |
| Ortalama | | | 2,25 | 0,5 | 0,5 |

Örnek ara hesap: P4 için T = 11−9 = 2, W = 2−1 = 1, R = 10−9 = 1.

### B — RR, q=2

Timeline: Idle [0,2), P1 [2,4), P2 [4,5), P1 [5,6), Idle [6,8), P3 [8,10), P4 [10,11).
t=4'te kuyruk P2,P1. t=9'da gelen P4, P3'ün quantum'unu kesmez.
t=10'da P3 tamamlandığı için kuyruğa geri dönmez.

| ID | S | C | T | W | R |
|---|---:|---:|---:|---:|---:|
| P1 | 2 | 6 | 4 | 1 | 0 |
| P2 | 4 | 5 | 3 | 2 | 2 |
| P3 | 8 | 10 | 2 | 0 | 0 |
| P4 | 10 | 11 | 2 | 1 | 1 |
| Ortalama | | | 2,75 | 1 | 0,75 |

Örnek ara hesap: P1 için T = 6−2 = 4, W = 4−3 = 1, R = 2−2 = 0.

## Karşılaştırma ve rapora aktarım

İlk yerel doğrulamada sekiz golden testin timeline, first start, completion ve ortalamaları
bu elle hesaplarla eşleşti; uyumsuzluk görülmedi. Simülatörün her process için gereken CPU süresini
vermesi ve diğer invariant'lar ayrıca test edildi.

Teslim raporunda her örneğe simülatör çıktısı ve bu karşılaştırma eklenecek.
Bu dosya son teslim PDF'i değildir. RR q=1/2/4 analizi ve rapordaki diğer açıklamalar ayrıca tamamlanacak.
