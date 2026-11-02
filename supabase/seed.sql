-- =====================================================================
-- Starting content. Run once after the migrations.
-- Only confirmed facts are filled in. Everything else is left empty and
-- shows as "To be confirmed" on the site until the team fills it in
-- from the admin area.
-- =====================================================================

insert into site_content (key, value_en, value_hi, is_confirmed) values
  ('home.headline', 'A Sacred Space to Learn, Practise, and Grow', 'सीखने, साधना करने और विकसित होने का एक पवित्र स्थान', true),
  ('home.tagline',  'Rooted in Wisdom. Growing in Awareness.', 'ज्ञान में निहित। जागरूकता में विकसित।', true),
  ('home.intro',    'Raamattva Vidya Peeth is a Gurukul and centre for spiritual learning, where wisdom becomes part of everyday life through learning, devotion, meditation and practice. Children, families, beginners and sincere seekers are all welcome.',
                    'रामत्त्व विद्या पीठ एक गुरुकुल और आध्यात्मिक शिक्षा का केंद्र है, जहाँ अध्ययन, भक्ति, ध्यान और साधना के माध्यम से आध्यात्मिक ज्ञान दैनिक जीवन का अंग बनता है। बच्चे, परिवार, नए साधक और सच्चे जिज्ञासु, सभी का स्वागत है।', true),
  ('about.vision',  null, null, false),
  ('founder.bio',   null, null, false),
  ('founder.portrait_path', null, null, false),
  ('contact.whatsapp', null, null, false),
  ('contact.email',    null, null, false),
  ('contact.address',  null, null, false),
  ('contact.map_url',  null, null, false),
  ('social.instagram', null, null, false),
  ('social.youtube',   null, null, false),
  ('social.facebook',  null, null, false),
  ('gurukul.age_groups', null, null, false),
  ('gurukul.language',   null, null, false),
  ('shop.shipping_paise', null, null, false),
  ('shop.ships_to',       null, null, false),
  ('billing.legal_name',  null, null, false),
  ('billing.gstin',       null, null, false),
  ('billing.address',     null, null, false),
  ('policy.privacy', null, null, false),
  ('policy.terms',   null, null, false),
  ('policy.shipping', null, null, false),
  ('policy.refunds', null, null, false)
on conflict (key) do nothing;

insert into courses (slug, title_en, title_hi, summary_en, overview_en, suitable_for, audience, status, sort_order, seo_description) values
  ('hanuman-saadhna', 'Hanuman Saadhna', 'हनुमान साधना',
   'A guided devotional practice inspired by Shri Hanuman''s service, strength, humility and faith.',
   'Hanuman Saadhna is a guided practice of devotion to Shri Hanuman, who embodies selfless service, strength, humility and unwavering faith. The course helps participants bring these qualities into daily life through steady, regular practice.',
   array['Sincere seekers who wish to begin or deepen a devotional practice'], 'adults', 'published', 1,
   'Hanuman Saadhna at Raamattva Vidya Peeth: a guided devotional practice.'),
  ('ram-saadhna', 'Ram Saadhna', 'राम साधना',
   'A guided practice centred on Shri Ram as the ideal of dharma, truth and compassion.',
   'Ram Saadhna is a guided practice centred on Shri Ram as the ideal of dharma, truth and compassion. The course invites participants to bring devotion and right conduct into the way they live each day.',
   array['Seekers drawn to the path of devotion to Shri Ram'], 'adults', 'published', 2,
   'Ram Saadhna at Raamattva Vidya Peeth: a guided devotional practice.'),
  ('essentials-of-meditation', 'Essentials of Meditation', 'ध्यान के मूल तत्व',
   'The foundations of a steady meditation practice: posture, breath, attention and inner attitude.',
   'Essentials of Meditation introduces the foundations of a steady meditation practice: posture, breath, attention and the inner attitude that supports stillness. It is designed to help participants build a practice they can continue on their own.',
   array['Newcomers to meditation','Those wishing to re-establish a regular practice'], 'adults', 'published', 3,
   'Essentials of Meditation at Raamattva Vidya Peeth.')
on conflict (slug) do nothing;

insert into sessions (slug, title_en, title_hi, description, kind, audience, format, recurrence_text, duration_minutes, status) values
  ('weekend-gurukul', 'Weekend Gurukul Workshop', 'साप्ताहिक गुरुकुल कार्यशाला',
   'A two-hour live online workshop for children every weekend: mantra and shloka, devotional stories, bhajans, meditation and values.',
   'recurring', 'children', 'online', 'Every weekend', 120, 'published'),
  ('offline-gurukul', 'Offline Gurukul Workshop', 'गुरुकुल कार्यशाला (ऑफ़लाइन)',
   'In-person Gurukul workshops held from time to time in different cities. Registered families hear about new cities first.',
   'workshop', 'children', 'in_person', null, null, 'published')
on conflict (slug) do nothing;

insert into products (slug, category, title_en, description, care_instructions, status, sort_order) values
  ('rudraksha-japa-mala', 'rudraksha', 'Rudraksha Japa Mala',
   'A rudraksha mala of 108 beads with a guru bead, traditionally used to count mantra repetitions during japa.',
   'Keep rudraksha dry and away from soap, perfume and chemicals. Wipe gently with a soft dry cloth and store in a cloth pouch when not in use.', 'published', 1),
  ('single-rudraksha', 'rudraksha', 'Single Rudraksha Bead',
   'A single rudraksha bead. Each option lists its mukhi (number of faces), size and origin once verified.',
   'Keep rudraksha dry and away from soap, perfume and chemicals. Wipe gently with a soft dry cloth and store in a cloth pouch when not in use.', 'published', 2),
  ('rudraksha-bracelet', 'rudraksha', 'Rudraksha Bracelet',
   'Rudraksha beads strung as a bracelet for everyday wear.',
   'Keep rudraksha dry and away from soap, perfume and chemicals. Wipe gently with a soft dry cloth and store in a cloth pouch when not in use.', 'published', 3)
on conflict (slug) do nothing;

insert into products (slug, category, title_en, description, related_course_id, status, sort_order)
select 'hanuman-saadhna-kit', 'course_kit', 'Hanuman Saadhna Course Kit',
       'The materials used during the Hanuman Saadhna course, packed together in one kit.', id, 'published', 10
  from courses where slug = 'hanuman-saadhna'
on conflict (slug) do nothing;
insert into products (slug, category, title_en, description, related_course_id, status, sort_order)
select 'ram-saadhna-kit', 'course_kit', 'Ram Saadhna Course Kit',
       'The materials used during the Ram Saadhna course, packed together in one kit.', id, 'published', 11
  from courses where slug = 'ram-saadhna'
on conflict (slug) do nothing;

update courses c set kit_product_id = p.id from products p
 where (c.slug, p.slug) in (('hanuman-saadhna','hanuman-saadhna-kit'), ('ram-saadhna','ram-saadhna-kit'));

-- Scripture (public domain). Reflections stay empty until Swamiji writes and approves them.
insert into verses (topic, text_original, translation, source, status, sort_order) values
  ('hanuman', E'श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि।\nबरनउँ रघुबर बिमल जसु जो दायकु फल चारि॥',
   'Cleansing the mirror of my mind with the dust of the Guru''s lotus feet, I sing the pure glory of Shri Raghubar, which bestows the four fruits of life.',
   'Hanuman Chalisa, opening doha · Goswami Tulsidas', 'published', 1),
  ('ram', 'श्रीरामचन्द्र कृपालु भजु मन हरण भवभय दारुणम्।',
   'O mind, worship the compassionate Shri Ramachandra, who removes the grave fear of worldly existence.',
   'Shri Ram Stuti · Goswami Tulsidas', 'published', 2),
  ('meditation', E'यथा दीपो निवातस्थो नेङ्गते सोपमा स्मृता।\nयोगिनो यतचित्तस्य युञ्जतो योगमात्मनः॥',
   'As a lamp in a windless place does not flicker, so is the disciplined mind of a yogi absorbed in meditation on the Self.',
   'Bhagavad Gita 6.19', 'published', 3);
