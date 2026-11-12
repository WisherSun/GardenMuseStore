-- Empties the "Flowers" table and fills it with 20 new flowers.
-- Run in Supabase -> SQL Editor. Ids restart from 1.
-- Images are the same verified Unsplash photos used in update-flower-images.sql.

begin;

truncate table "Flowers" restart identity;

insert into "Flowers" (name, description, discount, price, "newPrice", image) values
  ('Velvet Rose Bouquet',      'Twelve deep red garden roses wrapped in kraft paper.',            false, 65.00, null,  'https://images.unsplash.com/photo-1775591649052-bd0778172751?w=800&h=1000&fit=crop&q=80&auto=format'),
  ('Casablanca Lily Stems',    'Fragrant white lilies that open over a week.',                     true,  48.00, 39.00, 'https://images.unsplash.com/photo-1631407779166-86952be9dbd7?w=800&h=1000&fit=crop&q=80&auto=format'),
  ('Blush Peony Cloud',        'Soft pink peonies at their fullest, lush bloom.',                  false, 72.00, null,  'https://images.unsplash.com/photo-1575178094668-132dc931ad35?w=800&h=1000&fit=crop&q=80&auto=format'),
  ('Morning Sun Tulips',       'A bright bunch of fifteen buttery yellow tulips.',                 true,  34.00, 27.50, 'https://images.unsplash.com/photo-1715611782188-32b659b3b39d?w=800&h=1000&fit=crop&q=80&auto=format'),
  ('Golden Field Sunflowers',  'Five tall sunflowers that bring summer indoors.',                  false, 29.00, null,  'https://images.unsplash.com/photo-1470509037663-253afd7f0f51?w=800&h=1000&fit=crop&q=80&auto=format'),
  ('Provence Lavender',        'Dried lavender bundle with a calming scent.',                      false, 22.00, null,  'https://images.unsplash.com/photo-1634304387535-e9b7ed3180d4?w=800&h=1000&fit=crop&q=80&auto=format'),
  ('Royal Phalaenopsis',       'Potted purple orchid in a ceramic planter.',                       true,  58.00, 49.00, 'https://images.unsplash.com/photo-1605996370592-b6f7a81e382e?w=800&h=1000&fit=crop&q=80&auto=format'),
  ('Meadow Daisy Posy',        'Cheerful white daisies tied with linen ribbon.',                   false, 24.00, null,  'https://images.unsplash.com/photo-1592339078319-1f8cc9d67888?w=800&h=1000&fit=crop&q=80&auto=format'),
  ('Ocean Hydrangea',          'Three big heads of blue hydrangea in a glass vase.',               false, 55.00, null,  'https://images.unsplash.com/photo-1775836771120-5d060fcb15ed?w=800&h=1000&fit=crop&q=80&auto=format'),
  ('Sweetheart Carnations',    'Long-lasting pink carnations, perfect for gifting.',               true,  26.00, 19.90, 'https://images.unsplash.com/photo-1588785256845-8bc7505ecb88?w=800&h=1000&fit=crop&q=80&auto=format'),
  ('Crimson Tulip Bunch',      'Classic red tulips straight from Dutch growers.',                  false, 32.00, null,  'https://images.unsplash.com/photo-1611276973481-9abf4c2c7784?w=800&h=1000&fit=crop&q=80&auto=format'),
  ('Rainbow Gerbera Mix',      'Playful gerberas in orange, pink and yellow.',                     false, 28.50, null,  'https://images.unsplash.com/photo-1569731030828-ba3bb70923ff?w=800&h=1000&fit=crop&q=80&auto=format'),
  ('Spring Freesia',           'Delicate freesia with a sweet citrus fragrance.',                  true,  31.00, 25.00, 'https://images.unsplash.com/photo-1646757340995-fa48a4a69002?w=800&h=1000&fit=crop&q=80&auto=format'),
  ('Apricot Ranunculus',       'Layered peach ranunculus with paper-thin petals.',                 false, 44.00, null,  'https://images.unsplash.com/photo-1651592279151-f84dea81a03d?w=800&h=1000&fit=crop&q=80&auto=format'),
  ('Lilac Garden Branch',      'Seasonal lilac branches for a tall statement vase.',               false, 39.00, null,  'https://images.unsplash.com/photo-1776579347497-5d080d61c52e?w=800&h=1000&fit=crop&q=80&auto=format'),
  ('Panda Anemone',            'White anemones with striking dark centers.',                       true,  36.00, 29.00, 'https://images.unsplash.com/photo-1615671524971-4fac0891f7d3?w=800&h=1000&fit=crop&q=80&auto=format'),
  ('Autumn Chrysanthemum',     'Hardy chrysanthemums that stay fresh for two weeks.',              false, 23.00, null,  'https://images.unsplash.com/photo-1666469948591-f792c6ab29c9?w=800&h=1000&fit=crop&q=80&auto=format'),
  ('Midnight Iris',            'Elegant violet irises with golden accents.',                       false, 33.00, null,  'https://images.unsplash.com/photo-1776372294959-e78a71c2af84?w=800&h=1000&fit=crop&q=80&auto=format'),
  ('Café au Lait Dahlia',      'Oversized creamy dahlias, the florist favorite.',                  true,  52.00, 44.00, 'https://images.unsplash.com/photo-1620062317671-ef6441546d7d?w=800&h=1000&fit=crop&q=80&auto=format'),
  ('Baby''s Breath Cloud',     'Airy gypsophila bundle, lovely alone or as filler.',               false, 18.00, null,  'https://images.unsplash.com/photo-1608153917926-c467b4e23b6f?w=800&h=1000&fit=crop&q=80&auto=format');

commit;
