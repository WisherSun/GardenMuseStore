-- High-quality product photos from Unsplash (free to use, no attribution required).
-- 800x1000 matches the 4:5 product cards. Run in Supabase -> SQL Editor.

update "Flowers" as f
set image = v.image
from (values
  (1,  'https://images.unsplash.com/photo-1775591649052-bd0778172751?w=800&h=1000&fit=crop&q=80&auto=format'), -- Red Rose
  (2,  'https://images.unsplash.com/photo-1631407779166-86952be9dbd7?w=800&h=1000&fit=crop&q=80&auto=format'), -- White Lily
  (3,  'https://images.unsplash.com/photo-1575178094668-132dc931ad35?w=800&h=1000&fit=crop&q=80&auto=format'), -- Pink Peony
  (4,  'https://images.unsplash.com/photo-1715611782188-32b659b3b39d?w=800&h=1000&fit=crop&q=80&auto=format'), -- Yellow Tulip
  (5,  'https://images.unsplash.com/photo-1470509037663-253afd7f0f51?w=800&h=1000&fit=crop&q=80&auto=format'), -- Sunflower
  (6,  'https://images.unsplash.com/photo-1634304387535-e9b7ed3180d4?w=800&h=1000&fit=crop&q=80&auto=format'), -- Lavender Bunch
  (7,  'https://images.unsplash.com/photo-1605996370592-b6f7a81e382e?w=800&h=1000&fit=crop&q=80&auto=format'), -- Purple Orchid
  (8,  'https://images.unsplash.com/photo-1592339078319-1f8cc9d67888?w=800&h=1000&fit=crop&q=80&auto=format'), -- White Daisy
  (9,  'https://images.unsplash.com/photo-1775836771120-5d060fcb15ed?w=800&h=1000&fit=crop&q=80&auto=format'), -- Blue Hydrangea
  (10, 'https://images.unsplash.com/photo-1588785256845-8bc7505ecb88?w=800&h=1000&fit=crop&q=80&auto=format'), -- Pink Carnation
  (11, 'https://images.unsplash.com/photo-1611276973481-9abf4c2c7784?w=800&h=1000&fit=crop&q=80&auto=format'), -- Red Tulip
  (12, 'https://images.unsplash.com/photo-1569731030828-ba3bb70923ff?w=800&h=1000&fit=crop&q=80&auto=format'), -- Gerbera Mix
  (13, 'https://images.unsplash.com/photo-1646757340995-fa48a4a69002?w=800&h=1000&fit=crop&q=80&auto=format'), -- Freesia
  (14, 'https://images.unsplash.com/photo-1651592279151-f84dea81a03d?w=800&h=1000&fit=crop&q=80&auto=format'), -- Peach Ranunculus
  (15, 'https://images.unsplash.com/photo-1776579347497-5d080d61c52e?w=800&h=1000&fit=crop&q=80&auto=format'), -- Lilac Branch
  (16, 'https://images.unsplash.com/photo-1615671524971-4fac0891f7d3?w=800&h=1000&fit=crop&q=80&auto=format'), -- Anemone
  (17, 'https://images.unsplash.com/photo-1666469948591-f792c6ab29c9?w=800&h=1000&fit=crop&q=80&auto=format'), -- Chrysanthemum
  (18, 'https://images.unsplash.com/photo-1776372294959-e78a71c2af84?w=800&h=1000&fit=crop&q=80&auto=format'), -- Iris
  (19, 'https://images.unsplash.com/photo-1620062317671-ef6441546d7d?w=800&h=1000&fit=crop&q=80&auto=format'), -- Dahlia
  (20, 'https://images.unsplash.com/photo-1608153917926-c467b4e23b6f?w=800&h=1000&fit=crop&q=80&auto=format')  -- Gypsophila
) as v(id, image)
where f.id = v.id;

-- Undo (restore the old picsum placeholders):
-- update "Flowers" set image = 'https://picsum.photos/seed/' || case id
--   when 1 then 'red-rose' when 2 then 'white-lily' when 3 then 'pink-peony' when 4 then 'yellow-tulip'
--   when 5 then 'sunflower' when 6 then 'lavender' when 7 then 'purple-orchid' when 8 then 'white-daisy'
--   when 9 then 'blue-hydrangea' when 10 then 'pink-carnation' when 11 then 'red-tulip' when 12 then 'gerbera'
--   when 13 then 'freesia' when 14 then 'ranunculus' when 15 then 'lilac' when 16 then 'anemone'
--   when 17 then 'chrysanthemum' when 18 then 'iris' when 19 then 'dahlia' when 20 then 'gypsophila'
-- end || '/600/600';
