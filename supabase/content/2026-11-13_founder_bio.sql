-- Swami Ananta Giri: approved biography and titles (13 Nov 2026). Safe to run again.
insert into site_content (key, value_en, is_confirmed) values
  ('founder.titles', $c$Sannyasi · Swarayoga Āchārya · Author · Spiritual Guide · Environmentalist · Founder, Raamattva Vidya Peeth$c$, true),
  ('founder.bio', $c$Swami Ananta Giri is a sannyasi associated with Juna Akhara, a spiritual teacher, and the founder of Raamattva Vidya Peeth. With more than seventeen years devoted to spiritual practice, she is dedicated to making sacred wisdom accessible, meaningful, and relevant to everyday life.

Rooted in devotion and guided by the teachings of her revered Guru, Swami Charnāśrit Giri ji Maharaj, her spiritual journey embraces Swarayoga, meditation, mantra sādhana, and the inward exploration of the Ramayana. Her background also includes more than fifteen years of Arhatic Yoga practice.

At the heart of her teaching is an invitation to move beyond reading sacred texts towards living their wisdom. She approaches the Ramayana as an inner journey—one that leads from separation and searching to awakening, purification, and union with the Divine. In her teachings, Shri Hanuman embodies devotion, awakened prāṇa, courage, surrender, and selfless service.

As the author of “PAWANPUTRA… The Hidden Immortal,” Swami Ananta Giri invites readers to discover the deeper spiritual significance of Hanuman and its relevance to their own sādhana. Her approach brings together reflection, disciplined practice, and nishkām sevā—service offered without expectation of personal reward.

Through Raamattva Vidya Peeth, she seeks to nurture spiritual understanding across generations. Her vision includes helping children grow in emotional security, moral values, compassion, and awareness, while guiding adults towards a more conscious and purposeful life.

Her devotion finds practical expression in service to all forms of life. As an environmentalist, she has been an instrument in planting thousands of trees across Punjab. She is also working on large-scale initiatives to feed insects, birds, and animals, extending care to living beings whose needs are often overlooked. These efforts reflect her conviction that compassion must find expression in action and that caring for nature is an integral part of spiritual living.

For Swami Ananta Giri, sādhana and sevā are deeply connected: inner practice nurtures the heart, while selfless service brings that awakening into the world. Her purpose is to share spiritual knowledge and inspire a life rooted in devotion, discernment, humility, and compassion.$c$, true)
on conflict (key) do update set value_en = excluded.value_en, is_confirmed = true, updated_at = now();
