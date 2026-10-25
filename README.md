# Scheduling Lab — CSE513 HW1

React + TypeScript ile hazırlanmış, tarayıcıda çalışan bir CPU scheduling çalışma aracı.
FCFS, non-preemptive SJF, SRTF ve Round Robin kararlarını, Gantt chart'ı ve process metriklerini gösterir.

**Kaynak kod:** [yeturk/CSE513-HW1](https://github.com/yeturk/CSE513-HW1) — geliştirme branch'i `dev`.
**Durum:** Yerel ilk sürüm. Canlı website henüz yayımlanmadı.
PDF teslim raporu henüz hazırlanmadı. Kaynak repository bağlantısı, çalışan website bağlantısının yerine geçmez.

## Yerelde çalıştırma

Node.js 24 LTS ve pnpm 10.34.5 önerilir (Node >=22.12.0).

```sh
npm install --global pnpm@10.34.5
pnpm install --frozen-lockfile
pnpm dev
```

Terminalde gösterilen yerel adresi açın; varsayılan `http://127.0.0.1:5173`.
Windows, Linux/Ubuntu ve macOS üzerinde aynı simülasyon modeli kullanılır.
Backend, veritabanı, API anahtarı veya hesap gerekmez. Yazı tipi uygulama ile birlikte sunulur.

```sh
pnpm test          # Bağımsız elle çözümler, sınır durumları ve invariant kontrolleri
pnpm typecheck     # TypeScript kontrolü
pnpm build         # Tip kontrolü ve dist/ üretimi
pnpm preview       # Üretilen website'i yerelde açma
pnpm exec playwright install chromium
pnpm test:e2e      # Gerçek tarayıcıda kullanıcı akışları
```

Windows'ta kurulu Edge'i kullanmak için PowerShell:

```powershell
$env:E2E_BROWSER_CHANNEL = 'msedge'
pnpm test:e2e
```

## Kullanım

1. Workload A/B yükleyin veya process ekleyip ID, arrival ve burst girin.
2. Algoritmayı seçin; RR quantum'unu belirleyin.
3. **Simülasyonu çalıştır** düğmesine basın.
4. Gantt dilimlerine, önceki/sonraki düğmelerine veya karar sürgüsüne tıklayarak kararları inceleyin.
5. **Algoritmaları karşılaştır** ile son çalıştırılan girdilerin dört algoritmadaki sonuçlarını görün.
6. **Sonuçları indir** ile JSON çıktısını alın. Bu çıktı, bağımsız elle çözümün yerine geçmez.

Girdileri değiştirmek eski sonuçları otomatik değiştirmez. Sarı uyarı varken gösterilen sonuçlar ve
karşılaştırma son çalıştırmanın snapshot'ına aittir; yeniden çalıştırın. RR quantum'u da bu snapshot'a dahildir.

## Model ve kurallar

- Tek CPU; process başına bir CPU burst; I/O yok; context switch süresi sıfır.
- Arrival negatif olmayan, burst ve quantum pozitif tam sayılardır. ID'ler trim sonrası benzersizdir ve büyük/küçük harfe duyarlıdır.
- Eşit seçim ölçütünde önce arrival, sonra giriş listesindeki sıra kullanılır.
- SRTF yalnızca kesinlikle daha kısa kalan süre için preempt eder; eşitlikte çalışan devam eder.
- RR quantum sınırındaki gelişleri, bitmemiş çalışan yeniden eklenmeden önce kuyruğa alır.
- Biten process kuyruğa dönmez. RR'de art arda aynı process'e ait dilimler birleştirilmez.
- Aralıklar `[start, end)` olarak yorumlanır; süre `end - start`tır.
- Turnaround = completion − arrival; waiting = turnaround − burst; response = first start − arrival.
- Başlangıçtan son tamamlanmaya kadar bütün idle aralıkları gösterilir.

Bu bir scheduling policy simülasyonudur; Ubuntu'nun gerçek scheduler'ı veya gerçek process çalıştırma aracı değildir.

## Klasör yapısı

```text
src/
  domain/          # React'ten bağımsız motor, veri tipleri, A/B workload'ları
  components/      # Girdi editörü, Gantt/karar görünümü, metrik ve karşılaştırma tabloları
  App.tsx          # Girdi ve son çalıştırma snapshot'ı; uygulama bağlantıları
  styles.css       # Responsive görünüm ve process renkleri
tests/
  unit/            # Elle hesaplanmış 8 referans + sınır durumları
  e2e/             # Tarayıcı testleri
docs/
  hand-calculations.md
  additional-tests.md
  architecture.md
  ai-use.md
  roadmap.md
.github/workflows/ # Otomatik doğrulama ve elle başlatılan Pages yayını
```

## Sınırlar

Tarayıcıyı aşırı büyük çıktılardan korumak için 64 process, 24 karakter ID,
en büyük arrival + toplam burst için 1.000.000 ve RR için 2.000 CPU dilimi sınırı vardır.
Limit aşımı açık hata verir. Çok yoğun timeline'larda etiketler daralabilir; dilim başlıkları,
karar sürgüsü ve JSON çıktısı tam değerleri korur. Process renkleri 8 process'ten sonra tekrar eder;
kimlikler daima metinle de gösterilir. Gösterilen ortalamalar en fazla üç ondalığa yuvarlanır.

## GitHub ve yayın

Kaynak kod için GitHub repository, çalışan uygulama için GitHub Pages kullanılabilir.
`ci.yml` push/PR sonrası test ve build yapar. `pages.yml` sadece elle başlatılır.
Kaynak repo public olarak oluşturuldu. Kod gönderildikten sonra Settings → Pages → Source: GitHub Actions seçilir;
Actions → Publish website (manual) çalıştırılır. Dönen website adresi erişim izni istemeden kontrol edilmelidir.
Vite `base: './'` ayarı repository alt yolu için göreli asset adresleri üretir.

Ders PDF'i ve Slides klasörü yerelde korunur, `.gitignore` ile kaynak paylaşımının dışında tutulur.
Öğrenci numarası veya özel bilgi siteye eklenmez.

## Kaynaklar

- [Resmi ödev PDF'i](https://mehmetgokturk.com/cse513/materials/assignment01/CSE513-Assignment-1.pdf)
- [Ders sitesi](https://mehmetgokturk.com/cse513/index.html)
- [React ile Vite başlangıcı](https://react.dev/learn/build-a-react-app-from-scratch)
- [Vite static deployment](https://vite.dev/guide/static-deploy)

AI desteği ve doğrulama yaklaşımı [docs/ai-use.md](docs/ai-use.md) içindedir.
