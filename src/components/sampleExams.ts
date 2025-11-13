import type { ArchivedExam } from '../types';

export const SAMPLE_EXAMS: ArchivedExam[] = [
  // --- KAZANIM: T.5.3.5. ---
  {
    id: "sample-5-1-T.5.3.5",
    name: "Kazanım T.5.3.5 - Örnek Sınav",
    date: "2024-01-01T10:00:00.000Z",
    isSample: true,
    questions: [
      {
        sinif: 5,
        unite_adi: "Sözcükte Anlam",
        unite_no: 1,
        kazanim_kodu: "T.5.3.5.",
        kazanim_metni: "Bağlamdan yararlanarak bilmediği kelime ve kelime gruplarının anlamını tahmin eder.",
        soru_tipi: "coktan_secmeli",
        paragraf_metni: "Evin bahçesindeki ihtiyar ağaç, yıllara meydan okurcasına dimdik duruyordu. Gövdesindeki her bir çizgi, yaşanmışlıkların bir nişanesi gibiydi.",
        soru_metni: "Yukarıdaki metinde geçen 'nişane' kelimesinin anlamı aşağıdakilerden hangisi olabilir?",
        secenekler: { "A": "Resim", "B": "Belirti, işaret", "C": "Hikâye", "D": "Güzellik" },
        dogru_cevap: "B",
        yanlis_secenek_tipleri: ["Anlamca uzak çeldirici", "Metnin genel havasına uyan ancak yanlış çeldirici", "Soyut bir kavramla ilişkili çeldirici"],
        gercek_yasam_baglantisi: "Okuduğumuz metinlerde karşılaştığımız bilmediğimiz kelimelerin anlamını cümlenin gelişinden çıkarmak, kelime hazinemizi zenginleştirir.",
        seviye: "orta",
        cozum_anahtari: "Metinde ağacın gövdesindeki çizgilerin yaşanmışlıkları gösterdiği belirtiliyor. Bu da 'nişane' kelimesinin bir 'belirti, işaret' olduğunu düşündürür."
      }
    ]
  },
  // --- KAZANIM: T.5.3.6. ---
  {
    id: "sample-5-1-T.5.3.6",
    name: "Kazanım T.5.3.6 - Örnek Sınav",
    date: "2024-01-01T10:01:00.000Z",
    isSample: true,
    questions: [
      {
        sinif: 5,
        unite_adi: "Sözcükte Anlam",
        unite_no: 1,
        kazanim_kodu: "T.5.3.6.",
        kazanim_metni: "Kelimelerin gerçek, mecaz ve terim anlamlarını ayırt eder.",
        soru_tipi: "coktan_secmeli",
        paragraf_metni: null,
        soru_metni: "Aşağıdaki cümlelerin hangisinde 'kırmak' sözcüğü mecaz anlamda kullanılmıştır?",
        secenekler: {
          "A": "Elindeki bardağı yere düşürüp kırdı.",
          "B": "Bu sözlerinle arkadaşını çok kırdın.",
          "C": "Odunları baltayla kolayca kırdı.",
          "D": "Direksiyonu aniden sağa kırdı."
        },
        dogru_cevap: "B",
        yanlis_secenek_tipleri: ["Gerçek anlam", "Gerçek anlam", "Gerçek anlam"],
        gercek_yasam_baglantisi: "Kelimelerin farklı anlamlarını bilmek, hem kendimizi daha iyi ifade etmemizi sağlar hem de okuduklarımızı daha derinlemesine anlamamıza yardımcı olur.",
        seviye: "temel",
        cozum_anahtari: "'Kırmak' sözcüğü A, C ve D seçeneklerinde somut bir eylemi ifade ederken, B seçeneğinde 'incitmek, üzmek' anlamında soyut bir durumu ifade ettiği için mecaz anlamlıdır."
      }
    ]
  },
  // --- KAZANIM: T.5.3.7. ---
  {
    id: "sample-5-1-T.5.3.7",
    name: "Kazanım T.5.3.7 - Örnek Sınav",
    date: "2024-01-01T10:02:00.000Z",
    isSample: true,
    questions: [
      {
        sinif: 5,
        unite_adi: "Sözcükte Anlam",
        unite_no: 1,
        kazanim_kodu: "T.5.3.7.",
        kazanim_metni: "Kelimelerin eş ve zıt anlamlılarını bulur.",
        soru_tipi: "coktan_secmeli",
        paragraf_metni: null,
        soru_metni: "'Fakir' kelimesinin zıt anlamlısı ile 'savaş' kelimesinin eş anlamlısı sırasıyla hangi seçenekte doğru verilmiştir?",
        secenekler: { "A": "Yoksul - Harp", "B": "Zengin - Cenk", "C": "Zengin - Sulh", "D": "Varli - Barış" },
        dogru_cevap: "B",
        yanlis_secenek_tipleri: ["Eş anlamlı - Eş anlamlı", "Zıt anlamlı - Zıt anlamlı", "Yakın anlamlı - Zıt anlamlı"],
        gercek_yasam_baglantisi: "Eş ve zıt anlamlı kelimeleri bilmek, anlatımımızı daha renkli ve etkileyici kılar.",
        seviye: "orta",
        cozum_anahtari: "'Fakir' kelimesinin zıt anlamlısı 'zengin'dir. 'Savaş' kelimesinin eş anlamlısı ise 'harp' veya 'cenk' olabilir. Bu iki kelimeyi doğru sırada veren seçenek B'dir."
      }
    ]
  },
  // --- KAZANIM: T.5.3.8. ---
    {
    id: "sample-5-1-T.5.3.8",
    name: "Kazanım T.5.3.8 - Örnek Sınav",
    date: "2024-01-01T10:03:00.000Z",
    isSample: true,
    questions: [
      {
        sinif: 5,
        unite_adi: "Sözcükte Anlam",
        unite_no: 1,
        kazanim_kodu: "T.5.3.8.",
        kazanim_metni: "Eş sesli kelimelerin anlamlarını ayırt eder.",
        soru_tipi: "coktan_secmeli",
        paragraf_metni: null,
        soru_metni: "Aşağıdaki cümlelerin hangisinde 'dal' sözcüğü diğerlerinden farklı bir anlamda kullanılmıştır?",
        secenekler: { 
          "A": "Ağacın en üst dalına bir kuş kondu.", 
          "B": "Bu sıcak havada denize dalmak gibisi yok.", 
          "C": "Kuru bir dal parçasıyla toprağı eşeledi.", 
          "D": "Fırtına, çınarın en kalın dalını kırmış."
        },
        dogru_cevap: "B",
        yanlis_secenek_tipleri: ["Ağacın kolu anlamı", "Ağacın kolu anlamı", "Ağacın kolu anlamı"],
        gercek_yasam_baglantisi: "Yazılışı aynı anlamı farklı kelimeleri bilmek, iletişimde yanlış anlaşılmaların önüne geçer.",
        seviye: "temel",
        cozum_anahtari: "A, C ve D seçeneklerinde 'dal' kelimesi ağacın bir bölümü anlamında kullanılmıştır. B seçeneğinde ise 'suya batmak' eylemi anlamındadır."
      }
    ]
  },
    // --- KAZANIM: T.5.3.9. ---
    {
    id: "sample-5-1-T.5.3.9",
    name: "Kazanım T.5.3.9 - Örnek Sınav",
    date: "2024-01-01T10:04:00.000Z",
    isSample: true,
    questions: [
      {
        sinif: 5,
        unite_adi: "Sözcükte Anlam",
        unite_no: 1,
        kazanim_kodu: "T.5.3.9.",
        kazanim_metni: "Deyim ve atasözlerinin metne katkısını belirler.",
        soru_tipi: "coktan_secmeli",
        paragraf_metni: "Sınavdan düşük not alınca bütün gece ____. Annesi sabah onu teselli etmek için çok uğraştı.",
        soru_metni: "Yukarıdaki cümlede boş bırakılan yere aşağıdaki deyimlerden hangisi getirilirse 'çok üzülmek' anlamı katılmış olur?",
        secenekler: { 
          "A": "etekleri zil çaldı", 
          "B": "gözleri doldu", 
          "C": "ağzı kulaklarına vardı", 
          "D": "kara kara düşündü"
        },
        dogru_cevap: "D",
        yanlis_secenek_tipleri: ["Zıt anlamlı deyim (çok sevinmek)", "Yakın anlamlı ancak eksik ifade", "Zıt anlamlı deyim (çok sevinmek)"],
        gercek_yasam_baglantisi: "Deyimler ve atasözleri, anlatmak istediklerimizi daha kısa, öz ve etkileyici bir şekilde ifade etmemizi sağlayan kültürel zenginliklerimizdir.",
        seviye: "orta",
        cozum_anahtari: "Cümlede 'düşük not almak' gibi olumsuz bir durumdan sonra yaşanan üzüntü anlatılmaktadır. Bu duruma en uygun deyim 'kara kara düşünmek' yani 'çok üzülerek ne yapacağını bilememek'tir."
      }
    ]
  },
    // --- KAZANIM: T.5.3.10. ---
    {
    id: "sample-5-1-T.5.3.10",
    name: "Kazanım T.5.3.10 - Örnek Sınav",
    date: "2024-01-01T10:05:00.000Z",
    isSample: true,
    questions: [
      {
        sinif: 5,
        unite_adi: "Sözcükte Anlam",
        unite_no: 1,
        kazanim_kodu: "T.5.3.10.",
        kazanim_metni: "Soyut ve somut anlamlı kelimeleri ayırt eder.",
        soru_tipi: "dogru_yanlis",
        paragraf_metni: null,
        soru_metni: "'Rüya, sevinç, akıl, hava' kelimelerinin hepsi soyut anlamlıdır.",
        dogru_cevap: "Yanlış",
        secenekler: null,
        yanlis_secenek_tipleri: null,
        gercek_yasam_baglantisi: "Beş duyu organımızla algılayabildiğimiz (somut) ve algılayamadığımız (soyut) kavramları ayırt etmek, dünyayı anlama ve sınıflandırma becerimizi geliştirir.",
        seviye: "temel",
        cozum_anahtari: "'Rüya', 'sevinç' ve 'akıl' kelimeleri beş duyu organıyla algılanamadığı için soyuttur. Ancak 'hava' dokunma (hissetme) duyusuyla algılanabildiği için somut anlamlıdır. Bu nedenle cümlenin tamamı yanlıştır."
      }
    ]
  }
];