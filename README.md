# tjk-data-client
Modern, type-safe and dependency-free Node.js client for TJK horse racing data services. 🇹🇷

TJK DATA CLIENT — KURULUM VE KULLANIM
=====================================

tjk-data-client; TJK yarış programı, sonuçlar, bahis programı, AGF,
muhtemel oranlar, hipodromlar, at detayları ve jokey değişikliklerine
erişmek için hazırlanmış TypeScript destekli bir Node.js istemcisidir.

Bu proje bağımsız ve gayriresmîdir. Türkiye Jokey Kulübü ile bağlantılı
değildir ve TJK tarafından onaylanmamıştır.


GEREKSİNİMLER
-------------

- Node.js 18 veya üzeri
- Geçerli bir TJK authKey değeri


KURULUM
-------

Paket npm üzerinde yayımlandıktan sonra:

    npm install tjk-data-client

veya:

    yarn add tjk-data-client

Projeyi GitHub'dan indirdiyseniz:

    npm install
    npm run build


TEMEL KULLANIM
--------------

    import { TjkClient } from 'tjk-data-client';

    const tjk = new TjkClient({
      authKey: process.env.TJK_AUTH_KEY
    });

    const { data, checksum, updateTime } = await tjk.getProgram();

    console.log('Yarış programı:', data);
    console.log('Güncellenme zamanı:', updateTime);

Auth key değerini doğrudan kaynak kodun içine yazmayın. Ortam değişkeni
kullanın ve .env dosyasını GitHub'a göndermeyin.


YARIŞ PROGRAMI
--------------

    const { data } = await tjk.getProgram({
      date: '2026-10-22',
      hippodrome: 'hipodrom-anahtari',
      raceNumber: 3
    });

Tarih şu biçimlerde verilebilir:

    new Date()
    '2026-10-22'
    '22/10/2026'


YARIŞ SONUÇLARI
---------------

    const { data } = await tjk.getResults({
      date: '2026-10-22',
      hippodrome: 'hipodrom-anahtari'
    });


BAHİS PROGRAMI
--------------

    const { data } = await tjk.getBetProgram();


AGF VERİLERİ
------------

    const { data } = await tjk.getAgf({
      date: new Date(),
      hippodrome: 'hipodrom-anahtari'
    });


MUHTEMEL ORANLAR
----------------

    const { data } = await tjk.getProbables({
      date: new Date(),
      hippodrome: 'hipodrom-anahtari',
      full: true
    });


DETAYLI PROGRAM
---------------

    const { data } = await tjk.getDetailedProgram({
      date: new Date()
    });


HİPODROMLAR
-----------

    const { data: hippodromes } = await tjk.getHippodromes();

    for (const hippodrome of hippodromes) {
      console.log(hippodrome.name, hippodrome.location);
    }


AT DETAYI
---------

At koduyla:

    const { data: horse } = await tjk.getHorseDetail({
      id: 'at-kodu'
    });

At anahtarıyla:

    const { data: horse } = await tjk.getHorseDetail({
      key: 'at-anahtari'
    });

Aynı istekte yalnızca id veya key kullanılmalıdır.


JOKEY DEĞİŞİKLİKLERİ
--------------------

    const { data } = await tjk.getJockeyChanges({
      date: new Date(),
      hippodrome: 'hipodrom-anahtari'
    });


HATA YÖNETİMİ
-------------

    import {
      TjkApiError,
      TjkHttpError,
      TjkResponseError,
      TjkValidationError
    } from 'tjk-data-client';

    try {
      const { data } = await tjk.getProgram();
      console.log(data);
    } catch (error) {
      if (error instanceof TjkValidationError) {
        console.error('Geçersiz parametre:', error.message);
      } else if (error instanceof TjkApiError) {
        console.error('TJK servis hatası:', error.code, error.message);
      } else if (error instanceof TjkHttpError) {
        console.error('Bağlantı veya HTTP hatası:', error.status);
      } else if (error instanceof TjkResponseError) {
        console.error('Geçersiz servis yanıtı:', error.message);
      } else {
        console.error('Bilinmeyen hata:', error);
      }
    }


ZAMAN AŞIMI
-----------

Varsayılan zaman aşımı 10 saniyedir:

    const tjk = new TjkClient({
      authKey: process.env.TJK_AUTH_KEY,
      timeoutMs: 5_000
    });


SERVİS LİSTESİ
--------------

- getProgram(): Yarış programını getirir.
- getResults(): Yarış sonuçlarını getirir.
- getBetProgram(): Bahis programını getirir.
- getAgf(): AGF verilerini getirir.
- getProbables(): Muhtemel oranları getirir.
- getDetailedProgram(): Detaylı programı getirir.
- getHippodromes(): Hipodrom listesini getirir.
- getHorseDetail(): At detaylarını getirir.
- getJockeyChanges(): Jokey değişikliklerini getirir.
