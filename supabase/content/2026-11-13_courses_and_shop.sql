-- =====================================================================
-- Content from "Raamattva Saadhna Courses" and "Raamattva Products, Prices
-- and Benefits" (13 Nov 2026).
--
-- Run AFTER 0003_mala_category.sql has been run on its own.
-- Safe to run again: it updates what is already there.
--
-- Not in the documents, so left as "To be confirmed" on the site:
--   course dates, timings, format, language, fees (courses show an
--   "Enquire" button until a fee is set), stock levels, product photos,
--   rudraksha size/origin/certification, course kit contents.
-- =====================================================================

begin;

-- ---------- Courses ----------
insert into courses (slug, title_en, title_hi, summary_en, overview_en, suitable_for, outcomes, audience,
                     facilitator, duration_text, prerequisites, status, sort_order, seo_description)
values ($c$hanuman-saadhna$c$, $c$Hanuman Saadhna$c$, $c$हनुमान साधना$c$, $c$The Path of Devotion, Inner Strength, and Selfless Service$c$, $c$Hanuman Saadhna invites you to develop a living relationship with Hanumanji through devotion, mantra, contemplation, and service.

Hanumanji embodies strength guided by humility, knowledge expressed through service, and action offered in complete surrender to Shri Ram. This course explores how these qualities can become part of our own thoughts, choices, relationships, and spiritual practice.

At the heart of this programme is bhakti. Alongside devotional practice, special importance is given to nishkaam seva - service without expectation of reward or recognition. Through service, devotion finds expression in daily life.

## Purpose of the course

To nurture devotion to Hanumanji and cultivate the courage, humility, discipline, and spirit of surrender that support a sincere spiritual life.

## Why take up this course?

You may feel deeply connected to Hanumanji yet wish to understand how to carry that devotion beyond the time spent in worship. This course offers a way to connect prayer with conduct, strength with humility, and spiritual aspiration with service.

It is particularly meaningful for those who wish to deepen their bhakti, strengthen their commitment to practice, and learn to approach life's responsibilities with greater courage and surrender.$c$,
        array[$c$Devotees of Hanumanji, seekers drawn to the path of bhakti, and those wishing to bring devotion and selfless service into their everyday lives.$c$]::text[], array[$c$Understanding Hanumanji as an ideal of devotion, strength, wisdom, and service.$c$, $c$Approaching mantra and prayer with attention, reverence, and understanding.$c$, $c$Reflecting on the deeper significance of Hanumanji's relationship with Shri Ram.$c$, $c$Recognising how ego, distraction, and expectations affect our devotion.$c$, $c$Making nishkaam seva an essential part of saadhna.$c$, $c$Developing regularity and sincerity in personal practice.$c$]::text[], 'adults', $c$Swami Ananta Giri$c$, null, null,
        'published', 1, $c$Hanuman Saadhna at Raamattva Vidya Peeth: The Path of Devotion, Inner Strength, and Selfless Service$c$)
on conflict (slug) do update set
  title_en = excluded.title_en, title_hi = excluded.title_hi, summary_en = excluded.summary_en,
  overview_en = excluded.overview_en, suitable_for = excluded.suitable_for, outcomes = excluded.outcomes,
  facilitator = excluded.facilitator, duration_text = excluded.duration_text, prerequisites = excluded.prerequisites,
  status = 'published', sort_order = excluded.sort_order, seo_description = excluded.seo_description;

delete from course_modules where course_id = (select id from courses where slug = $c$hanuman-saadhna$c$);

insert into courses (slug, title_en, title_hi, summary_en, overview_en, suitable_for, outcomes, audience,
                     facilitator, duration_text, prerequisites, status, sort_order, seo_description)
values ($c$ram-saadhna$c$, $c$Raam Saadhna$c$, $c$राम साधना$c$, $c$The Sevenfold Inner Journey Towards Ramrajya Within$c$, $c$Raam Saadhna explores the Ramayan as an inward spiritual journey - a journey through separation, seeking, awakening, purification, and reunion towards a life guided by dharma.

Through Swami Ananta Giri's Sapta-Aṅga framework, participants are invited to contemplate how the characters, events, and relationships of the Ramayan illuminate their own inner experiences.

In this teaching approach, the Ramayan becomes a mirror for examining desire, attachment, discernment, devotion, and surrender. Hanumanji represents the devoted strength that helps bridge the distance between spiritual longing and purposeful practice.

## Purpose of the course

To help seekers understand their inner journey through the wisdom of the Ramayan and progressively bring their thoughts, actions, and relationships under the guidance of dharma.

## Why take up this course?

You may know the story of the Ramayan and feel that it contains a message for your own life. This course helps you explore that connection thoughtfully.

It offers a framework for reflecting on inner conflict, recognising the influence of attachment, strengthening viveka, and bringing devotion into your decisions and responsibilities.

The aspiration is Ramrajya within: an inner life increasingly governed by truth, compassion, restraint, and wisdom.$c$,
        array[$c$Seekers drawn to Shri Ram, students of the Ramayan, and those who wish to explore its contemplative meaning as a guide to personal and spiritual growth.$c$]::text[], '{}'::text[], 'adults', $c$Swami Ananta Giri$c$, null, null,
        'published', 2, $c$Raam Saadhna at Raamattva Vidya Peeth: The Sevenfold Inner Journey Towards Ramrajya Within$c$)
on conflict (slug) do update set
  title_en = excluded.title_en, title_hi = excluded.title_hi, summary_en = excluded.summary_en,
  overview_en = excluded.overview_en, suitable_for = excluded.suitable_for, outcomes = excluded.outcomes,
  facilitator = excluded.facilitator, duration_text = excluded.duration_text, prerequisites = excluded.prerequisites,
  status = 'published', sort_order = excluded.sort_order, seo_description = excluded.seo_description;

delete from course_modules where course_id = (select id from courses where slug = $c$ram-saadhna$c$);
insert into course_modules (course_id, position, title_en, description) select id, 1, $c$Viyog · वियोग$c$, $c$Recognising separation from our deeper spiritual centre and the longing to return.$c$ from courses where slug = $c$ram-saadhna$c$;
insert into course_modules (course_id, position, title_en, description) select id, 2, $c$Divya Anveshan · दिव्य अन्वेषण$c$, $c$Giving that longing direction through sincere spiritual seeking.$c$ from courses where slug = $c$ram-saadhna$c$;
insert into course_modules (course_id, position, title_en, description) select id, 3, $c$Jagaran · जागरण$c$, $c$Awakening awareness, discernment, and commitment to the path.$c$ from courses where slug = $c$ram-saadhna$c$;
insert into course_modules (course_id, position, title_en, description) select id, 4, $c$Shuddhi · शुद्धि$c$, $c$Working towards purification of motives, habits, and conduct.$c$ from courses where slug = $c$ram-saadhna$c$;
insert into course_modules (course_id, position, title_en, description) select id, 5, $c$Milan · मिलन$c$, $c$Contemplating reunion through devotion and surrender.$c$ from courses where slug = $c$ram-saadhna$c$;
insert into course_modules (course_id, position, title_en, description) select id, 6, $c$Punarsthapana · पुनर्स्थापना$c$, $c$Re-establishing spiritual values in everyday life.$c$ from courses where slug = $c$ram-saadhna$c$;
insert into course_modules (course_id, position, title_en, description) select id, 7, $c$Ramrajya · रामराज्य$c$, $c$Moving towards a life in which dharma and divine remembrance guide the inner world.$c$ from courses where slug = $c$ram-saadhna$c$;

insert into courses (slug, title_en, title_hi, summary_en, overview_en, suitable_for, outcomes, audience,
                     facilitator, duration_text, prerequisites, status, sort_order, seo_description)
values ($c$swarayoga$c$, $c$Swarayoga$c$, $c$स्वरयोग$c$, $c$Breath Awareness as a Doorway to Inner Understanding$c$, $c$Swarayoga introduces seekers to the traditional study of swara - the flow of breath - and its place in yogic understanding and spiritual practice.

Under the guidance of Swarayoga Āchārya Swami Ananta Giri, the programme invites participants to become attentive observers of their breath and inner condition. It approaches breath awareness as a discipline of observation, sensitivity, and self-understanding.

The emphasis is on learning patiently, developing awareness, and bringing the teachings into practice with appropriate guidance.

## Purpose of the course

To introduce the principles of Swarayoga and help seekers develop a more conscious relationship with the breath as part of their spiritual life.

## Why take up this course?

The breath accompanies every moment of life, yet much of the time it passes unnoticed. Swarayoga invites you to bring attention to this constant companion and explore its spiritual significance.

This course may appeal to you if you wish to deepen breath awareness, understand the traditional foundations of Swarayoga, or bring greater attentiveness to your existing saadhna.$c$,
        array[$c$Seekers interested in breath-based spiritual learning, meditators, and practitioners wishing to explore Swarayoga under guidance.$c$]::text[], array[$c$The meaning of swara within the Swarayoga tradition.$c$, $c$Observing the natural flow of breath.$c$, $c$Traditional understandings of Iḍā, Piṅgalā, and Suṣumṇā.$c$, $c$Reflecting on the relationship between breath, attention, and inner experience.$c$, $c$Developing sensitivity and consistency through observation.$c$, $c$Understanding the importance of guidance in deeper practice.$c$]::text[], 'adults', $c$Swami Ananta Giri$c$, null, $c$Suitability for deeper practices is considered according to the programme level.$c$,
        'published', 3, $c$Swarayoga at Raamattva Vidya Peeth: Breath Awareness as a Doorway to Inner Understanding$c$)
on conflict (slug) do update set
  title_en = excluded.title_en, title_hi = excluded.title_hi, summary_en = excluded.summary_en,
  overview_en = excluded.overview_en, suitable_for = excluded.suitable_for, outcomes = excluded.outcomes,
  facilitator = excluded.facilitator, duration_text = excluded.duration_text, prerequisites = excluded.prerequisites,
  status = 'published', sort_order = excluded.sort_order, seo_description = excluded.seo_description;

delete from course_modules where course_id = (select id from courses where slug = $c$swarayoga$c$);

insert into courses (slug, title_en, title_hi, summary_en, overview_en, suitable_for, outcomes, audience,
                     facilitator, duration_text, prerequisites, status, sort_order, seo_description)
values ($c$essentials-of-meditation$c$, $c$Essentials of Meditation$c$, $c$ध्यान के मूल तत्व$c$, $c$A Five-Day Foundation for a Meaningful Meditation Practice$c$, $c$Essentials of Meditation is a five-day introductory programme designed to help you understand meditation and begin practising with greater clarity.

Many people wish to meditate but are unsure how to start, how to work with distraction, or how to make practice a regular part of life. This course combines foundational understanding with guided experiences, allowing participants to explore different approaches to stillness and attention.

The programme also considers the preparation that supports meditation: daily habits, breath awareness, ethical living, and the principles of Yam and Niyam.

## Purpose of the course

To give participants a clear foundation in meditation and help them begin a manageable, consistent personal practice.

## Why take up this course?

This programme is for you if you have wanted to meditate but have not known where to begin - or if you have tried and struggled to remain consistent.

By exploring several guided practices, you can begin to understand how to approach meditation with patience, prepare yourself for practice, and build a foundation for continued learning.$c$,
        array[$c$Beginners, people returning to meditation after a break, and seekers who would like a structured introduction to its principles and practices.$c$]::text[], array[$c$Meditation and prayer$c$, $c$Breathwork$c$, $c$Mantra$c$, $c$Lifestyle and dietary considerations$c$, $c$Creating time for regular practice$c$]::text[], 'adults', $c$Swami Ananta Giri$c$, $c$5 days$c$, null,
        'published', 4, $c$Essentials of Meditation at Raamattva Vidya Peeth: A Five-Day Foundation for a Meaningful Meditation Practice$c$)
on conflict (slug) do update set
  title_en = excluded.title_en, title_hi = excluded.title_hi, summary_en = excluded.summary_en,
  overview_en = excluded.overview_en, suitable_for = excluded.suitable_for, outcomes = excluded.outcomes,
  facilitator = excluded.facilitator, duration_text = excluded.duration_text, prerequisites = excluded.prerequisites,
  status = 'published', sort_order = excluded.sort_order, seo_description = excluded.seo_description;

delete from course_modules where course_id = (select id from courses where slug = $c$essentials-of-meditation$c$);
insert into course_modules (course_id, position, title_en, description) select id, 1, $c$Day 1 · Kāya Sthairyam$c$, $c$Exploring steadiness of the body as a foundation for meditation.$c$ from courses where slug = $c$essentials-of-meditation$c$;
insert into course_modules (course_id, position, title_en, description) select id, 2, $c$Day 2 · Chakra Meditation$c$, $c$A guided introduction to contemplation of the subtle centres within the yogic tradition.$c$ from courses where slug = $c$essentials-of-meditation$c$;
insert into course_modules (course_id, position, title_en, description) select id, 3, $c$Day 3 · Meditation on the Breath$c$, $c$Using breath awareness to develop attention and presence.$c$ from courses where slug = $c$essentials-of-meditation$c$;
insert into course_modules (course_id, position, title_en, description) select id, 4, $c$Day 4 · Trāṭaka$c$, $c$Exploring a guided practice of steady gazing and concentration.$c$ from courses where slug = $c$essentials-of-meditation$c$;
insert into course_modules (course_id, position, title_en, description) select id, 5, $c$Day 5 · Yoga Nidra$c$, $c$Experiencing guided relaxation with awareness.$c$ from courses where slug = $c$essentials-of-meditation$c$;

insert into courses (slug, title_en, title_hi, summary_en, overview_en, suitable_for, outcomes, audience,
                     facilitator, duration_text, prerequisites, status, sort_order, seo_description)
values ($c$panchamukhi-hanuman-saadhna$c$, $c$Panchamukhi Hanuman Saadhna$c$, $c$पंचमुखी हनुमान साधना$c$, $c$Contemplating the Fivefold Form of Hanumanji. Planned programme - register your interest.$c$, $c$Panchamukhi Hanuman Saadhna is envisioned as a dedicated exploration of the five-faced form of Hanumanji: Hanuman, Narasimha, Garuḍa, Varāha, and Hayagrīva.

Drawing on Swami Ananta Giri's developing teachings, the programme will explore this sacred form as a contemplative map for spiritual growth. Its emphasis will be on understanding the devotional significance of the five faces and approaching their deeper symbolism with reverence.

## Purpose of the course

To deepen devotion to Panchamukhi Hanumanji and introduce seekers to the fivefold spiritual framework explored in these teachings.

## Why take up this course?

If you feel drawn to Panchamukhi Hanumanji and wish to understand the meaning behind this sacred form, the programme will offer an opportunity for focused study and contemplation.

It is intended for seekers who wish to deepen their devotional understanding and explore how the fivefold symbolism can inform their spiritual journey.$c$,
        array[$c$Devotees interested in Panchamukhi Hanumanji and seekers wishing to explore these teachings.$c$]::text[], array[$c$The five faces and their devotional significance.$c$, $c$Their contemplative relationship with the five elements within the course's teaching framework.$c$, $c$The place of prayer, dhyāna, and sacred recitation in devotional practice.$c$, $c$Reflection on courage, discernment, steadiness, and surrender.$c$, $c$Preparing for deeper saadhna through sincerity, discipline, and guidance.$c$]::text[], 'adults', $c$Swami Ananta Giri$c$, null, $c$The detailed curriculum and entry requirements will be announced with the programme.$c$,
        'published', 5, $c$Panchamukhi Hanuman Saadhna at Raamattva Vidya Peeth: Contemplating the Fivefold Form of Hanumanji. Planned programme - register your interest.$c$)
on conflict (slug) do update set
  title_en = excluded.title_en, title_hi = excluded.title_hi, summary_en = excluded.summary_en,
  overview_en = excluded.overview_en, suitable_for = excluded.suitable_for, outcomes = excluded.outcomes,
  facilitator = excluded.facilitator, duration_text = excluded.duration_text, prerequisites = excluded.prerequisites,
  status = 'published', sort_order = excluded.sort_order, seo_description = excluded.seo_description;

delete from course_modules where course_id = (select id from courses where slug = $c$panchamukhi-hanuman-saadhna$c$);

update products set title_en = 'Raam Saadhna Course Kit' where slug = 'ram-saadhna-kit';

-- ---------- Rudraksha (prices per mukhi from the catalogue) ----------
update products set title_en = $c$Rudraksha Japa Mala$c$, category = 'rudraksha', status = 'published', sort_order = 0,
  description = $c$A rudraksha mala for mantra japa, prayer and daily remembrance of the Divine. Choose the mukhi (number of faces) below.

## Traditional associations

- 2 Mukhi · Ardhanarishvara: Harmony, togetherness and balance in relationships.
- 3 Mukhi · Agni: Inner purification, renewal and letting go of the past.
- 4 Mukhi · Lord Brahma: Learning, clarity of thought and thoughtful expression.
- 5 Mukhi · Rudra: Inner calm, steady spiritual practice and daily mantra japa.
- 6 Mukhi · Lord Kartikeya: Patience, steadiness and disciplined practice.
- 7 Mukhi · Goddess Lakshmi: Prayers for prosperity, contentment and well-being.
- 8 Mukhi · Lord Ganesha: Prayers for removal of obstacles and auspicious beginnings.
- 9 Mukhi · Goddess Durga: Courage, inner strength and devotion to Divine Shakti.
- 10 Mukhi · Lord Vishnu: Prayers for divine protection and freedom from fear.

These are commonly followed devotional associations; interpretations may vary between traditions. Spiritual benefits described are based on traditional beliefs. These products are companions to sincere practice and do not guarantee health, financial or relationship outcomes.$c$ where slug = $c$rudraksha-japa-mala$c$;
delete from product_variants where product_id = (select id from products where slug = $c$rudraksha-japa-mala$c$);
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$2 Mukhi$c$, 321000, 0, true, 0 from products where slug = $c$rudraksha-japa-mala$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$3 Mukhi$c$, 321000, 0, true, 1 from products where slug = $c$rudraksha-japa-mala$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$4 Mukhi$c$, 321000, 0, true, 2 from products where slug = $c$rudraksha-japa-mala$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$5 Mukhi$c$, 51000, 0, true, 3 from products where slug = $c$rudraksha-japa-mala$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$6 Mukhi$c$, 222000, 0, true, 4 from products where slug = $c$rudraksha-japa-mala$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$7 Mukhi$c$, 456000, 0, true, 5 from products where slug = $c$rudraksha-japa-mala$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$8 Mukhi$c$, 258000, 0, true, 6 from products where slug = $c$rudraksha-japa-mala$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$9 Mukhi$c$, 258000, 0, true, 7 from products where slug = $c$rudraksha-japa-mala$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$10 Mukhi$c$, 258000, 0, true, 8 from products where slug = $c$rudraksha-japa-mala$c$;

update products set title_en = $c$Single Rudraksha Bead$c$, category = 'rudraksha', status = 'published', sort_order = 1,
  description = $c$A single rudraksha bead, a sacred companion for prayer and daily remembrance of the Divine. Choose the mukhi (number of faces) below.

## Traditional associations

- 1 Mukhi · Lord Shiva: Single-pointed awareness, meditation and deepening devotion to Shiva.
- 2 Mukhi · Ardhanarishvara: Harmony, togetherness and balance in relationships.
- 3 Mukhi · Agni: Inner purification, renewal and letting go of the past.
- 4 Mukhi · Lord Brahma: Learning, clarity of thought and thoughtful expression.
- 5 Mukhi · Rudra: Inner calm, steady spiritual practice and daily mantra japa.
- 6 Mukhi · Lord Kartikeya: Patience, steadiness and disciplined practice.
- 7 Mukhi · Goddess Lakshmi: Prayers for prosperity, contentment and well-being.
- 8 Mukhi · Lord Ganesha: Prayers for removal of obstacles and auspicious beginnings.
- 9 Mukhi · Goddess Durga: Courage, inner strength and devotion to Divine Shakti.
- 10 Mukhi · Lord Vishnu: Prayers for divine protection and freedom from fear.

These are commonly followed devotional associations; interpretations may vary between traditions. Spiritual benefits described are based on traditional beliefs. These products are companions to sincere practice and do not guarantee health, financial or relationship outcomes.$c$ where slug = $c$single-rudraksha$c$;
delete from product_variants where product_id = (select id from products where slug = $c$single-rudraksha$c$);
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$1 Mukhi (Kaju Dana)$c$, 310000, 0, true, 0 from products where slug = $c$single-rudraksha$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$2 Mukhi$c$, 510000, 0, true, 1 from products where slug = $c$single-rudraksha$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$3 Mukhi$c$, 510000, 0, true, 2 from products where slug = $c$single-rudraksha$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$4 Mukhi$c$, 123000, 0, true, 3 from products where slug = $c$single-rudraksha$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$5 Mukhi$c$, 25800, 0, true, 4 from products where slug = $c$single-rudraksha$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$6 Mukhi$c$, 70000, 0, true, 5 from products where slug = $c$single-rudraksha$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$7 Mukhi$c$, 105000, 0, true, 6 from products where slug = $c$single-rudraksha$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$8 Mukhi$c$, 213000, 0, true, 7 from products where slug = $c$single-rudraksha$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$9 Mukhi$c$, 321000, 0, true, 8 from products where slug = $c$single-rudraksha$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$10 Mukhi$c$, 321000, 0, true, 9 from products where slug = $c$single-rudraksha$c$;

update products set title_en = $c$Rudraksha Bracelet$c$, category = 'rudraksha', status = 'published', sort_order = 2,
  description = $c$Rudraksha beads strung as a bracelet for daily wear, a reminder of your practice through the day. Choose the mukhi (number of faces) below.

## Traditional associations

- 2 Mukhi · Ardhanarishvara: Harmony, togetherness and balance in relationships.
- 3 Mukhi · Agni: Inner purification, renewal and letting go of the past.
- 4 Mukhi · Lord Brahma: Learning, clarity of thought and thoughtful expression.
- 5 Mukhi · Rudra: Inner calm, steady spiritual practice and daily mantra japa.
- 6 Mukhi · Lord Kartikeya: Patience, steadiness and disciplined practice.
- 7 Mukhi · Goddess Lakshmi: Prayers for prosperity, contentment and well-being.
- 8 Mukhi · Lord Ganesha: Prayers for removal of obstacles and auspicious beginnings.
- 9 Mukhi · Goddess Durga: Courage, inner strength and devotion to Divine Shakti.
- 10 Mukhi · Lord Vishnu: Prayers for divine protection and freedom from fear.

These are commonly followed devotional associations; interpretations may vary between traditions. Spiritual benefits described are based on traditional beliefs. These products are companions to sincere practice and do not guarantee health, financial or relationship outcomes.$c$ where slug = $c$rudraksha-bracelet$c$;
delete from product_variants where product_id = (select id from products where slug = $c$rudraksha-bracelet$c$);
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$2 Mukhi$c$, 213000, 0, true, 0 from products where slug = $c$rudraksha-bracelet$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$3 Mukhi$c$, 231000, 0, true, 1 from products where slug = $c$rudraksha-bracelet$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$4 Mukhi$c$, 123000, 0, true, 2 from products where slug = $c$rudraksha-bracelet$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$5 Mukhi$c$, 51000, 0, true, 3 from products where slug = $c$rudraksha-bracelet$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$6 Mukhi$c$, 100000, 0, true, 4 from products where slug = $c$rudraksha-bracelet$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$7 Mukhi$c$, 105000, 0, true, 5 from products where slug = $c$rudraksha-bracelet$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$8 Mukhi$c$, 213000, 0, true, 6 from products where slug = $c$rudraksha-bracelet$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$9 Mukhi$c$, 213000, 0, true, 7 from products where slug = $c$rudraksha-bracelet$c$;
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, $c$10 Mukhi$c$, 213000, 0, true, 8 from products where slug = $c$rudraksha-bracelet$c$;

-- ---------- Malas & bracelets ----------
insert into products (slug, category, title_en, description, status, sort_order)
values ($c$karungali-mala$c$, 'mala', $c$Karungali Mala$c$, $c$Traditionally associated with prayers for protection; a companion for japa.

Spiritual benefits described are based on traditional beliefs. These products are companions to sincere practice and do not guarantee health, financial or relationship outcomes.$c$, 'published', 20)
on conflict (slug) do update set category = 'mala', title_en = excluded.title_en, description = excluded.description,
  status = 'published', sort_order = excluded.sort_order;
delete from product_variants where product_id = (select id from products where slug = $c$karungali-mala$c$);
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, 'Standard', 87000, 0, true, 0 from products where slug = $c$karungali-mala$c$;

insert into products (slug, category, title_en, description, status, sort_order)
values ($c$karungali-bracelet$c$, 'mala', $c$Karungali Bracelet$c$, $c$A wearable reminder of faith and the intention of spiritual protection.

Spiritual benefits described are based on traditional beliefs. These products are companions to sincere practice and do not guarantee health, financial or relationship outcomes.$c$, 'published', 21)
on conflict (slug) do update set category = 'mala', title_en = excluded.title_en, description = excluded.description,
  status = 'published', sort_order = excluded.sort_order;
delete from product_variants where product_id = (select id from products where slug = $c$karungali-bracelet$c$);
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, 'Standard', 33000, 0, true, 0 from products where slug = $c$karungali-bracelet$c$;

insert into products (slug, category, title_en, description, status, sort_order)
values ($c$black-hakik-mala$c$, 'mala', $c$Black Hakik Mala$c$, $c$Traditionally used in Shani-related worship and prayers for protection.

Spiritual benefits described are based on traditional beliefs. These products are companions to sincere practice and do not guarantee health, financial or relationship outcomes.$c$, 'published', 22)
on conflict (slug) do update set category = 'mala', title_en = excluded.title_en, description = excluded.description,
  status = 'published', sort_order = excluded.sort_order;
delete from product_variants where product_id = (select id from products where slug = $c$black-hakik-mala$c$);
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, 'Standard', 213000, 0, true, 0 from products where slug = $c$black-hakik-mala$c$;

insert into products (slug, category, title_en, description, status, sort_order)
values ($c$black-hakik-bracelet$c$, 'mala', $c$Black Hakik Bracelet$c$, $c$The traditional associations of Black Hakik in a form for daily wear.

Spiritual benefits described are based on traditional beliefs. These products are companions to sincere practice and do not guarantee health, financial or relationship outcomes.$c$, 'published', 23)
on conflict (slug) do update set category = 'mala', title_en = excluded.title_en, description = excluded.description,
  status = 'published', sort_order = excluded.sort_order;
delete from product_variants where product_id = (select id from products where slug = $c$black-hakik-bracelet$c$);
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, 'Standard', 78000, 0, true, 0 from products where slug = $c$black-hakik-bracelet$c$;

insert into products (slug, category, title_en, description, status, sort_order)
values ($c$haldi-mala$c$, 'mala', $c$Haldi Mala$c$, $c$Traditionally used for Maa Baglamukhi japa and practices associated with Brihaspati.

Spiritual benefits described are based on traditional beliefs. These products are companions to sincere practice and do not guarantee health, financial or relationship outcomes.$c$, 'published', 24)
on conflict (slug) do update set category = 'mala', title_en = excluded.title_en, description = excluded.description,
  status = 'published', sort_order = excluded.sort_order;
delete from product_variants where product_id = (select id from products where slug = $c$haldi-mala$c$);
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, 'Standard', 51000, 0, true, 0 from products where slug = $c$haldi-mala$c$;

insert into products (slug, category, title_en, description, status, sort_order)
values ($c$sphatik-mala$c$, 'mala', $c$Sphatik Mala$c$, $c$Associated with peace of mind; used for Lakshmi and Saraswati mantra japa.

Spiritual benefits described are based on traditional beliefs. These products are companions to sincere practice and do not guarantee health, financial or relationship outcomes.$c$, 'published', 25)
on conflict (slug) do update set category = 'mala', title_en = excluded.title_en, description = excluded.description,
  status = 'published', sort_order = excluded.sort_order;
delete from product_variants where product_id = (select id from products where slug = $c$sphatik-mala$c$);
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, 'Standard', 330000, 0, true, 0 from products where slug = $c$sphatik-mala$c$;

insert into products (slug, category, title_en, description, status, sort_order)
values ($c$sphatik-mala-diamond-cut$c$, 'mala', $c$Sphatik Mala - Diamond Cut$c$, $c$The traditional uses of Sphatik with a faceted finish for added sparkle.

Spiritual benefits described are based on traditional beliefs. These products are companions to sincere practice and do not guarantee health, financial or relationship outcomes.$c$, 'published', 26)
on conflict (slug) do update set category = 'mala', title_en = excluded.title_en, description = excluded.description,
  status = 'published', sort_order = excluded.sort_order;
delete from product_variants where product_id = (select id from products where slug = $c$sphatik-mala-diamond-cut$c$);
insert into product_variants (product_id, label, price_paise, stock, is_active, position) select id, 'Standard', 510000, 0, true, 0 from products where slug = $c$sphatik-mala-diamond-cut$c$;

-- ---------- Rudraksha consultation (a bookable service, listed under Sessions) ----------
insert into sessions (slug, title_en, description, kind, audience, format, recurrence_text, is_free, fee_paise, status)
values ('rudraksha-consultation', 'Rudraksha Consultation as per Horoscope',
        $c$Personalised rudraksha guidance based on your horoscope. Book and pay here; the team will contact you to arrange the consultation.$c$,
        'one_time', 'adults', 'online', 'By appointment', false, 110000, 'published')
on conflict (slug) do update set title_en = excluded.title_en, description = excluded.description,
  recurrence_text = excluded.recurrence_text, is_free = false, fee_paise = 110000, status = 'published';

-- ---------- Contact, vision and founder ----------
insert into site_content (key, value_en, is_confirmed) values
  ('contact.whatsapp', '+91 98881 52345', true),
  ('about.vision', $c$At Raamattva Vidya Peeth, spiritual learning is an invitation to discover a deeper relationship with yourself, with the Divine, and with the world around you.

Founded by Swami Ananta Giri, our programmes bring together spiritual understanding, devotion, meditation, self-discipline, and selfless service. Each course offers a particular doorway into saadhna, while sharing one purpose: helping seekers bring spiritual wisdom into everyday living.

Whether you are beginning your journey, seeking greater consistency in practice, or wishing to deepen an existing devotional connection, these programmes offer an opportunity to learn with sincerity and practise with understanding.$c$, true),
  ('founder.bio', $c$Swami Ananta Giri, founder of Raamattva Vidya Peeth, is a sannyasi associated with Juna Akhara, a Swarayoga Āchārya, author, and spiritual guide.

His approach brings together devotion, contemplative understanding, disciplined practice, and nishkaam seva. Through Raamattva Vidya Peeth, he seeks to make spiritual wisdom meaningful in everyday life, nurturing responsibility towards family, society, nature, and all living beings.$c$, true)
on conflict (key) do update set value_en = excluded.value_en, is_confirmed = true, updated_at = now();

commit;

-- ---------------------------------------------------------------------
-- Stock: every option starts at 0 ("Out of stock") because the catalogue
-- gives no quantities. Set real stock per option in Admin -> Products, or,
-- to put everything on sale with the same quantity, remove the two dashes
-- in front of the next line, change 10 to your number, and run just that line:
-- update product_variants set stock = 10 where stock = 0;
-- ---------------------------------------------------------------------
