-- 0003 — a shop category for malas and bracelets that are not rudraksha
-- (Karungali, Black Hakik, Haldi, Sphatik). Run on its own, before the content file.
alter type product_category add value if not exists 'mala';
