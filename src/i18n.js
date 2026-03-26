export function pick(lang, en, kn) {
  return lang === "kn" ? kn : en;
}

const districtMap = {
  Hassan: "ಹಾಸನ",
  Mysuru: "ಮೈಸೂರು",
  Mandya: "ಮಂಡ್ಯ",
  Ramanagara: "ರಾಮನಗರ",
  Kolar: "ಕೋಲಾರ",
  Tumakuru: "ತುಮಕೂರು",
  "Bengaluru Rural": "ಬೆಂಗಳೂರು ಗ್ರಾಮಾಂತರ",
  Shivamogga: "ಶಿವಮೊಗ್ಗ",
  Davangere: "ದಾವಣಗೆರೆ",
  Dharwad: "ಧಾರವಾಡ",
  Raichur: "ರಾಯಚೂರು",
  Bidar: "ಬೀದರ್",
  Chikkamagaluru: "ಚಿಕ್ಕಮಗಳೂರು",
  Sira: "ಸಿರಾ",
  Tiptur: "ತಿಪಟೂರು",
  Hoskote: "ಹೊಸಕೋಟೆ",
  Channapatna: "ಚನ್ನಪಟ್ಟಣ",
  Hubli: "ಹುಬ್ಬಳ್ಳಿ",
  Belgaum: "ಬೆಳಗಾವಿ",
  Karnataka: "ಕರ್ನಾಟಕ",
};

const villageMap = {
  Sakleshpur: "ಸಕಲೇಶಪುರ",
  Channapatna: "ಚನ್ನಪಟ್ಟಣ",
  Doddaballapur: "ದೊಡ್ಡಬಳ್ಳಾಪುರ",
  Hoskote: "ಹೊಸಕೋಟೆ",
  Kolar: "ಕೋಲಾರ",
  Tumkur: "ತುಮಕೂರು",
  Hassan: "ಹಾಸನ",
  Mysuru: "ಮೈಸೂರು",
  Mandya: "ಮಂಡ್ಯ",
  Shivamogga: "ಶಿವಮೊಗ್ಗ",
  Davangere: "ದಾವಣಗೆರೆ",
  Hubli: "ಹುಬ್ಬಳ್ಳಿ",
  Raichur: "ರಾಯಚೂರು",
  Bidar: "ಬೀದರ್",
  Chikkamagaluru: "ಚಿಕ್ಕಮಗಳೂರು",
  Ramanagara: "ರಾಮನಗರ",
  Sira: "ಸಿರಾ",
  Tiptur: "ತಿಪಟೂರು",
};

const cropMap = {
  Tomato: "ಟೊಮೆಟೊ",
  Onion: "ಈರುಳ್ಳಿ",
  Potato: "ಆಲೂಗಡ್ಡೆ",
  Cabbage: "ಎಲೆಕೋಸು",
  Cauliflower: "ಹೂಕೋಸು",
  Brinjal: "ಬದನೆಕಾಯಿ",
  Carrot: "ಕ್ಯಾರೆಟ್",
  Ladyfinger: "ಬೆಂಡೆಕಾಯಿ",
  Capsicum: "ಕ್ಯಾಪ್ಸಿಕಂ",
  Cucumber: "ಸೌತೆಕಾಯಿ",
  Beans: "ಬೀನ್ಸ್",
  Beetroot: "ಬೀಟ್ರೂಟ್",
  Pumpkin: "ಕುಂಬಳಕಾಯಿ",
  Drumstick: "ನುಗ್ಗೆಕಾಯಿ",
  Maize: "ಮೆಕ್ಕೆಜೋಳ",
  Groundnut: "ನೆಲಗಡಲೆ",
  Turmeric: "ಅರಿಶಿನ",
  Ginger: "ಶುಂಠಿ",
  Sugarcane: "ಕಬ್ಬು",
  Coconut: "ತೆಂಗು",
  Banana: "ಬಾಳೆಹಣ್ಣು",
  Mango: "ಮಾವಿನಹಣ್ಣು",
};

const categoryMap = {
  All: "ಎಲ್ಲಾ",
  Vegetables: "ತರಕಾರಿಗಳು",
  Grains: "ಧಾನ್ಯಗಳು",
  Pulses: "ಬೇಳೆ ಕಾಳುಗಳು",
  Oilseeds: "ಎಣ್ಣೆ ಬೀಜಗಳು",
  Spices: "ಮಸಾಲೆಗಳು",
  "Cash Crops": "ವಾಣಿಜ್ಯ ಬೆಳೆಗಳು",
  Fruits: "ಹಣ್ಣುಗಳು",
};

const roleMap = {
  farmer: { en: "Farmer", kn: "ರೈತ" },
  retailer: { en: "Wholesaler", kn: "ಸಗಟು ಖರೀದಿದಾರ" },
  delivery: { en: "Delivery Partner", kn: "ವಿತರಣಾ ಸಹಭಾಗಿ" },
};

const statusMap = {
  en: {
    open: "Open",
    bidding: "🔥 Bidding",
    booked: "Booked",
    "awaiting-retailer": "Awaiting Wholesaler",
    confirmed: "Confirmed",
    scheduled: "Scheduled",
    "on-the-way": "🚛 On the Way",
    "picked-up": "📦 Picked Up",
    delivered: "✅ Delivered",
  },
  kn: {
    open: "ತೆರೆದಿದೆ",
    bidding: "🔥 ಹರಾಜು",
    booked: "ಬುಕ್ ಆಗಿದೆ",
    "awaiting-retailer": "ಸಗಟು ಖರೀದಿದಾರರ ದೃಢೀಕರಣ ಬಾಕಿ",
    confirmed: "ದೃಢೀಕರಿಸಲಾಗಿದೆ",
    scheduled: "ನಿಗದಿಯಾಗಿದೆ",
    "on-the-way": "🚛 ಮಾರ್ಗದಲ್ಲಿ",
    "picked-up": "📦 ತೆಗೆದುಕೊಂಡಿದೆ",
    delivered: "✅ ವಿತರಿಸಲಾಗಿದೆ",
  },
};

const weatherMap = {
  "Partly cloudy": "ಭಾಗಶಃ ಮೋಡ",
  "Clear sky": "ನಿರ್ಮಲ ಆಕಾಶ",
  "Mild overcast": "ಸಾಧಾರಣ ಮೋಡಾವೃತ",
  "Light showers": "ತುಂತುರು ಮಳೆ",
  "Sunny & hot": "ಬಿಸಿಲು ಮತ್ತು ಬಿಸಿ",
  "Heavy showers": "ಭಾರೀ ಮಳೆ",
};

const helplineMap = {
  "Kisan Call Centre": { knName: "ಕಿಸಾನ್ ಕಾಲ್ ಸೆಂಟರ್", knDesc: "ಉಚಿತ 24/7 ಕೃಷಿ ಸಹಾಯವಾಣಿ" },
  "Karnataka APMC": { knName: "ಕರ್ನಾಟಕ ಎಪಿಎಂಸಿ", knDesc: "ಮಂಡಿ ದರಗಳು ಮತ್ತು ಪ್ರಶ್ನೆಗಳು" },
  NABARD: { knName: "ನಬಾರ್ಡ್", knDesc: "ಕೃಷಿ ಸಾಲ ಮತ್ತು ಹಣಕಾಸು" },
  "PM-KISAN": { knName: "ಪಿಎಂ-ಕಿಸಾನ್", knDesc: "ರೈತ ಆದಾಯ ಬೆಂಬಲ" },
};

const newsMap = {
  1: {
    cat: { kn: "ಮಾರುಕಟ್ಟೆ" },
    title: { kn: "ಈ ವಾರ ಕರ್ನಾಟಕ ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆಗಳಲ್ಲಿ ಟೊಮೆಟೊ ಬೆಲೆ 18% ಹೆಚ್ಚಾಗಿದೆ" },
    meta: { kn: "ಹಾಸನ ಮಂಡಿ · ಇಂದು" },
  },
  2: {
    cat: { kn: "ಹವಾಮಾನ" },
    title: { kn: "ಪಶ್ಚಿಮ ಘಟ್ಟಗಳಲ್ಲಿ ಸಾಧಾರಣ ಮಳೆಯ ಮುನ್ಸೂಚನೆ: ಈಗಲೇ ಕೊಯ್ಲು ಯೋಜನೆ ಮಾಡಿ" },
    meta: { kn: "ಕರ್ನಾಟಕ · ಇಂದು" },
  },
  3: {
    cat: { kn: "ನೀತಿ" },
    title: { kn: "ರಬಿ ಹಂಗಾಮಿಗೆ ಈರುಳ್ಳಿ ಎಂಎಸ್‌ಪಿ ಮೇಲೆ 10% ಬೋನಸ್ ಘೋಷಿಸಿದ ಕರ್ನಾಟಕ" },
    meta: { kn: "ನಬಾರ್ಡ್ · 2 ದಿನಗಳ ಹಿಂದೆ" },
  },
  4: {
    cat: { kn: "ಮಾರುಕಟ್ಟೆ" },
    title: { kn: "2025-26 ಹಂಗಾಮಿಗೆ ಕಬ್ಬಿನ ಎಸ್‌ಎಪಿ ದರವನ್ನು ₹3,400/ಟನ್ ಗೆ ಹೆಚ್ಚಿಸಲಾಗಿದೆ" },
    meta: { kn: "ಸಕ್ಕರೆ ಮಂಡಳಿ · 3 ದಿನಗಳ ಹಿಂದೆ" },
  },
  5: {
    cat: { kn: "ಯೋಜನೆ" },
    title: { kn: "ಪಿಎಂ-ಕಿಸಾನ್ 19ನೇ ಕಂತು: ಮಾರ್ಚ್ 31ರೊಳಗೆ ₹2000 ಜಮಾ ಆಗಲಿದೆ" },
    meta: { kn: "ಕೇಂದ್ರ ಸರ್ಕಾರ · ಇಂದು" },
  },
};

export function tDistrict(name, lang) {
  return lang === "kn" ? districtMap[name] || name : name;
}

export function tVillage(name, lang) {
  return lang === "kn" ? villageMap[name] || districtMap[name] || name : name;
}

export function tCrop(name, lang) {
  return lang === "kn" ? cropMap[name] || name : name;
}

export function tCategory(name, lang) {
  return lang === "kn" ? categoryMap[name] || name : name;
}

export function tRole(role, lang) {
  return roleMap[role]?.[lang] || roleMap[role]?.en || role;
}

export function tStatus(status, lang) {
  return statusMap[lang]?.[status] || statusMap.en[status] || status;
}

export function tWeather(desc, lang) {
  return lang === "kn" ? weatherMap[desc] || desc : desc;
}

export function tHelpline(item, lang) {
  if (lang !== "kn") return item;
  const mapped = helplineMap[item.name];
  return mapped ? { ...item, name: mapped.knName, desc: mapped.knDesc } : item;
}

export function tNews(item, lang) {
  if (lang !== "kn") return item;
  const mapped = newsMap[item.id];
  if (!mapped) return item;
  return {
    ...item,
    cat: mapped.cat.kn || item.cat,
    title: mapped.title.kn || item.title,
    meta: mapped.meta.kn || item.meta,
  };
}

export function tLocation(village, district, lang) {
  return `${tVillage(village, lang)}, ${tDistrict(district, lang)}`;
}
