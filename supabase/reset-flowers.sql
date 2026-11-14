-- Deletes all flowers and adds 20 new ones with full info:
-- main image + 3 gallery images (image2-4) + longer "details" text.
-- Run in Supabase -> SQL Editor. Ids restart from 1. Safe to run again.
--
-- Uses DELETE, not TRUNCATE: cart and order_items point to "Flowers", and Postgres
-- refuses to truncate a table that others reference. DELETE follows their rules:
--   cart rows for these flowers are removed (on delete cascade);
--   past orders stay, their items just lose the link (on delete set null) -
--   names and prices were copied into order_items when the order was placed.
-- All images are Unsplash photos (free to use), each link checked to load.

begin;

-- New columns (does nothing if they already exist)
alter table "Flowers"
  add column if not exists image2  text,
  add column if not exists image3  text,
  add column if not exists image4  text,
  add column if not exists details text;

delete from "Flowers";

-- Restart ids from 1 (works whether id is "identity" or "serial")
select setval(pg_get_serial_sequence('public."Flowers"', 'id'), 1, false);

insert into "Flowers" (name, description, discount, price, "newPrice", image, image2, image3, image4, details)
select v.name, v.description, v.discount, v.price, v.new_price,
       'https://images.unsplash.com/photo-' || v.p1 || '?w=800&h=1000&fit=crop&q=80&auto=format',
       'https://images.unsplash.com/photo-' || v.p2 || '?w=800&h=1000&fit=crop&q=80&auto=format',
       'https://images.unsplash.com/photo-' || v.p3 || '?w=800&h=1000&fit=crop&q=80&auto=format',
       'https://images.unsplash.com/photo-' || v.p4 || '?w=800&h=1000&fit=crop&q=80&auto=format',
       v.details
from (values
  (1, 'Velvet Rose Bouquet', 'Twelve deep red garden roses wrapped in kraft paper.', false, 65.00, null::numeric,
   '1775591649052-bd0778172751', '1578439231583-9eca0a363860', '1494972308805-463bc619d34e', '1760373071432-441e011d1e0a',
   'The red rose has stood for love and devotion for centuries, and a dozen is the classic way to say it. Our garden roses have large, velvety heads and a soft, old-fashioned scent. Care: trim 2 cm off the stems at an angle, remove leaves below the waterline and change the water every two days.'),
  (2, 'Casablanca Lily Stems', 'Fragrant white lilies that open over a week.', true, 48.00, 39.00,
   '1631407779166-86952be9dbd7', '1486102515046-44130769cb25', '1567428051128-5f09a0200655', '1776372447943-c348355bc7f7',
   'Casablanca is the queen of oriental lilies: pure white, star-shaped blooms with a rich, sweet perfume that fills a room. The stems arrive in bud, so you can watch them open one by one. Care: gently pull off the orange pollen tips as flowers open to avoid stains, and keep the vase away from fruit.'),
  (3, 'Blush Peony Cloud', 'Soft pink peonies at their fullest, lush bloom.', false, 72.00, null,
   '1575178094668-132dc931ad35', '1780498802979-3d75e2b87ff2', '1780498803005-fb52f0ab0226', '1511201173873-c327e63eb6c4',
   'Peonies are a short early-summer treat and a favourite for weddings and romantic gifts. Their tight buds open into huge, ruffled blooms with a light rose-like scent. Care: use cool water, recut the stems every few days, and if buds are slow to open, place the vase somewhere a little warmer.'),
  (4, 'Morning Sun Tulips', 'A bright bunch of fifteen buttery yellow tulips.', true, 34.00, 27.50,
   '1715611782188-32b659b3b39d', '1715611918585-b320a0574fed', '1525549609721-d0197337efa8', '1559593532-5184c8292468',
   'Yellow tulips are a symbol of cheerful thoughts and sunshine, perfect for brightening a kitchen or desk. Tulips keep growing in the vase and gently bend toward the light, which gives every bunch its own shape. Care: use only a little cold water and turn the vase each day to keep the stems straighter.'),
  (5, 'Golden Field Sunflowers', 'Five tall sunflowers that bring summer indoors.', false, 29.00, null,
   '1470509037663-253afd7f0f51', '1757681843238-dd02aee97906', '1551945326-df678a97c3af', '1597848212624-a19eb35e2651',
   'Sunflowers follow the sun while they grow and stand for warmth, loyalty and happiness. Five tall stems make a bold, joyful arrangement on their own. Care: choose a heavy, tall vase, keep the water level high because sunflowers drink a lot, and remove leaves that sit in the water.'),
  (6, 'Provence Lavender', 'Dried lavender bundle with a calming scent.', false, 22.00, null,
   '1634304387535-e9b7ed3180d4', '1634304387394-a8153f6684aa', '1720379469378-6401659beef1', '1787786505957-2419ba70b097',
   'Lavender has been loved in Provence for its calming scent for hundreds of years. This dried bundle keeps its colour and fragrance for months and needs no water at all. Care: keep it out of strong sunlight and away from damp; give it a gentle squeeze now and then to release the scent.'),
  (7, 'Royal Phalaenopsis', 'Potted purple orchid in a ceramic planter.', true, 58.00, 49.00,
   '1605996370592-b6f7a81e382e', '1605996358353-af5bef7b4cfd', '1618080578815-335456280012', '1610397648930-477b8c7f0943',
   'The Phalaenopsis, or moth orchid, is named for its wide petals that look like moths in flight. Planted in a ceramic pot, it is an easy, long-lasting houseplant that can flower again year after year. Care: bright but indirect light, and water about once a week, letting the roots dry out in between.'),
  (8, 'Meadow Daisy Posy', 'Cheerful white daisies tied with linen ribbon.', false, 24.00, null,
   '1592339078319-1f8cc9d67888', '1559406994-913e66cdc5ad', '1566146991394-b09a95e80d17', '1508784411316-02b8cd4d3a3a',
   'Daisies stand for innocence and new beginnings, and their simple white petals with sunny centres always feel fresh. Tied with a linen ribbon, this posy suits a bedside table, a thank-you or a little "just because". Care: recut the stems and change the water every two days.'),
  (9, 'Ocean Hydrangea', 'Three big heads of blue hydrangea in a glass vase.', false, 55.00, null,
   '1775836771120-5d060fcb15ed', '1781889507466-7deb49983f35', '1780124643022-a275c0304d31', '1786379870681-b124cebfac39',
   'Hydrangea heads are made of many small flowers, and their blue colour comes from the soil they grow in. Three big heads fill a vase on their own and look calm and elegant. Care: hydrangeas drink through their petals too, so mist them now and then; if a head wilts, submerge it in cool water for an hour.'),
  (10, 'Sweetheart Carnations', 'Long-lasting pink carnations, perfect for gifting.', true, 26.00, 19.90,
   '1588785256845-8bc7505ecb88', '1773746407652-2a6de252231a', '1773746407673-81a2c1ea8d7e', '1764813824206-079529856156',
   'Pink carnations are a traditional sign of gratitude and a mother''s love. They are one of the longest-lasting cut flowers, with ruffled petals and a faint clove-like scent. Care: cut the stems just above a node (the small bump on the stem) and refresh the water every few days.'),
  (11, 'Crimson Tulip Bunch', 'Classic red tulips straight from Dutch growers.', false, 32.00, null,
   '1611276973481-9abf4c2c7784', '1649892231169-8c54be4b9a79', '1559153938-5a828158d753', '1556721768-86927a0d3106',
   'Red tulips are the tulip of declared love and the classic flower of Dutch spring. Their smooth, glossy petals open wide on warm days and close again in the evening. Care: keep them in shallow cold water, away from heaters and fruit, and trim the stems if they start to droop.'),
  (12, 'Rainbow Gerbera Mix', 'Playful gerberas in orange, pink and yellow.', false, 28.50, null,
   '1569731030828-ba3bb70923ff', '1762543788164-41efce6428c2', '1778409445285-2c63c0c2ecca', '1775118532340-7483acb1957c',
   'Gerberas come from South Africa and are loved for their big, round, cheerful faces. This mix of orange, pink and yellow brings instant colour to any room. Care: use only a few centimetres of water, because gerbera stems rot easily, and recut them every couple of days.'),
  (13, 'Spring Freesia', 'Delicate freesia with a sweet citrus fragrance.', true, 31.00, 25.00,
   '1646757340995-fa48a4a69002', '1758960811639-c298327c5436', '1781768651703-97ffd155ab47', '1646757231876-53cb365f0ceb',
   'Freesia is one of the most fragrant cut flowers, with a sweet, citrusy scent that perfumers love. The buds sit along one side of each stem and open in turn. Care: pinch off faded flowers to help the next buds open, and keep the vase in a cool spot.'),
  (14, 'Apricot Ranunculus', 'Layered peach ranunculus with paper-thin petals.', false, 44.00, null,
   '1651592279151-f84dea81a03d', '1767552659473-9a541393de94', '1712135596996-3dda241aa9bc', '1712135596908-2d990f87ad43',
   'Ranunculus are known as the "Persian buttercup" and have dozens of paper-thin petals wrapped in tight layers. The apricot shade is soft and romantic, popular for spring weddings. Care: use cool, shallow water, change it often, and enjoy how the blooms open wider each day.'),
  (15, 'Lilac Garden Branch', 'Seasonal lilac branches for a tall statement vase.', false, 39.00, null,
   '1776579347497-5d080d61c52e', '1778670717010-4b356f8854f9', '1780580818926-1932ef5f39b0', '1776363204433-9ca6948722af',
   'Lilac blooms for only a few weeks in spring, which makes these branches a true seasonal treat. The clusters of tiny flowers carry a sweet, nostalgic scent. Care: cut the woody stems at a sharp angle, remove most of the leaves, and place them in deep, fresh water straight away.'),
  (16, 'Panda Anemone', 'White anemones with striking dark centers.', true, 36.00, 29.00,
   '1615671524971-4fac0891f7d3', '1558726546-2aac72f04ae2', '1707401132047-03f41440c904', '1558726546-26d2f87944ba',
   'The "Panda" anemone gets its name from its pure white petals and striking dark centre. Its graphic look makes it a florist favourite for modern bouquets. Care: anemones keep growing and turn toward the light, so give them plenty of fresh water and a bright spot away from direct sun.'),
  (17, 'Autumn Chrysanthemum', 'Hardy chrysanthemums that stay fresh for two weeks.', false, 23.00, null,
   '1666469948591-f792c6ab29c9', '1768239150981-bb0913be497f', '1762075109492-75495d91642b', '1742700026596-ce2460f96bda',
   'Chrysanthemums are the flower of autumn and, in Japan, a symbol of long life and joy. They are among the toughest cut flowers, with rich warm colours and many layers of petals. Care: strip leaves below the waterline and change the water every few days.'),
  (18, 'Midnight Iris', 'Elegant violet irises with golden accents.', false, 33.00, null,
   '1776372294959-e78a71c2af84', '1727527248709-530e766631ec', '1589958883001-2799ce0f8425', '1595531393554-770837e2801b',
   'The iris is named after the Greek goddess of the rainbow and stands for wisdom and hope. Deep violet petals with golden markings give it an elegant, almost painted look. Care: each stem has several buds, so remove spent flowers to let the next ones open.'),
  (19, 'Café au Lait Dahlia', 'Oversized creamy dahlias, the florist favorite.', true, 52.00, 44.00,
   '1620062317671-ef6441546d7d', '1546842931-886c185b4c8c', '1541093113199-a2e9d84e903f', '1768861020377-3fdead073d13',
   'Café au Lait is a dinner-plate dahlia with huge creamy blooms blushed with pink, a favourite of florists and brides. Each flower can be as big as a hand. Care: dahlias do not open further once cut, so enjoy them at their peak; keep the water clean and change it daily.'),
  (20, 'Baby''s Breath Cloud', 'Airy gypsophila bundle, lovely alone or as filler.', false, 18.00, null,
   '1608153917926-c467b4e23b6f', '1608153918613-9c2be8d9f11f', '1648170037882-dbc37e0789e4', '1650805073031-e7991f380253',
   'Baby''s breath (gypsophila) is a cloud of tiny white flowers that stands for everlasting love. It looks lovely on its own in a simple jar or as a soft filler around other blooms. Care: keep it in fresh water, or hang it upside down in a dry place to dry it for keeps.')
) as v(sort, name, description, discount, price, new_price, p1, p2, p3, p4, details)
order by v.sort;

commit;

-- Check:  select id, name, price, "newPrice", image2, left(details, 50) from "Flowers" order by id;
