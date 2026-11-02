export type Lang = "en" | "hi";

/** Pick the Hindi value when the visitor chose Hindi and it exists, else English. */
export function pick(en: string | null | undefined, hi: string | null | undefined, lang: Lang): string {
  return (lang === "hi" && hi ? hi : en) ?? "";
}

const dict = {
  nav_home: ["Home", "मुख्य पृष्ठ"],
  nav_about: ["About", "परिचय"],
  nav_gurukul: ["Gurukul", "गुरुकुल"],
  nav_courses: ["Courses", "पाठ्यक्रम"],
  nav_sessions: ["Sessions & Events", "सत्र एवं कार्यक्रम"],
  nav_shop: ["Shop", "दुकान"],
  nav_wisdom: ["Wisdom", "ज्ञान"],
  nav_contact: ["Contact", "संपर्क"],
  account: ["Account", "खाता"],
  my_account: ["My account", "मेरा खाता"],
  sign_in: ["Sign in", "साइन इन"],
  sign_out: ["Sign out", "साइन आउट"],
  cart: ["Cart", "कार्ट"],
  founded: ["Founded by Swami Ananta Giri", "स्वामी अनंत गिरि द्वारा स्थापित"],
  explore_courses: ["Explore Courses", "पाठ्यक्रम देखें"],
  view_sessions: ["View Upcoming Sessions", "आगामी सत्र देखें"],
  tbc: ["To be confirmed", "पुष्टि होनी है"],
  register: ["Register", "पंजीकरण करें"],
  register_free: ["Register free", "निःशुल्क पंजीकरण"],
  register_pay: ["Register and pay", "पंजीकरण और भुगतान"],
  opens_soon: ["Registration opens soon", "पंजीकरण शीघ्र खुलेगा"],
  full: ["Full", "भर गया"],
  free: ["Free", "निःशुल्क"],
  paid: ["Paid", "सशुल्क"],
  online: ["Online", "ऑनलाइन"],
  in_person: ["In person", "प्रत्यक्ष"],
  hybrid: ["Online and in person", "ऑनलाइन और प्रत्यक्ष"],
  for_adults: ["For adults", "वयस्कों के लिए"],
  for_children: ["For children", "बच्चों के लिए"],
  view_course: ["View course", "पाठ्यक्रम देखें"],
  add_to_cart: ["Add to cart", "कार्ट में जोड़ें"],
  out_of_stock: ["Out of stock", "स्टॉक में नहीं"],
  not_available: ["Not yet available", "अभी उपलब्ध नहीं"],
  in_stock: ["In stock", "स्टॉक में"],
  ist_note: ["All times are India Standard Time (IST)", "सभी समय भारतीय मानक समय (IST) में हैं"],
} as const;

export type DictKey = keyof typeof dict;

export function t(key: DictKey, lang: Lang): string {
  return dict[key][lang === "hi" ? 1 : 0];
}
