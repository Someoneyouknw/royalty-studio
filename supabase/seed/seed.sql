-- ============================================================================
-- Royalty Studio — development seed data
-- Everything here is DEMO / PLACEHOLDER content, safe to delete. It contains
-- no real client names, no real awards, and no real business address.
-- Demo imagery is loaded from Unsplash (free stock) purely for preview; replace
-- it by uploading your own photos in the admin dashboard.
-- Idempotent: safe to run more than once.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Site settings (single row) — placeholders; edit in /admin/settings.
-- ---------------------------------------------------------------------------
insert into public.site_settings (
  id, studio_name, tagline, phone, whatsapp, whatsapp_default_message,
  email, address, opening_hours,
  instagram_url, facebook_url, tiktok_url,
  hero_title, about_text, seo_title, seo_description
) values (
  1,
  'Royalty Studio',
  'Capturing Moments. Creating Memories.',
  '+234 000 000 0000',
  '2340000000000',
  'Hello Royalty Studio, I would like to make an inquiry about a photography session.',
  'hello@royaltystudio.example',
  'Your studio address here',
  'Mon–Sat: 9:00 AM – 6:00 PM',
  'https://www.instagram.com/',
  'https://www.facebook.com/',
  'https://www.tiktok.com/',
  'Royalty Studio',
  'Royalty Studio is a photography practice devoted to preserving the moments that matter — from weddings and portraits to the quiet in-between. Update this introduction, along with all contact details and social links, in the admin Settings.',
  'Royalty Studio — Premium Photography',
  'Royalty Studio is a premium photography studio capturing weddings, portraits, events and more.'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
insert into public.categories (name, slug, description, cover_image_url, display_order, is_active) values
  ('Outdoor',            'outdoor',   'Natural light, open spaces and golden-hour sessions.',                 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80', 1, true),
  ('Weddings',           'weddings',  'The full story of the day, from first look to last dance.',            'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80', 2, true),
  ('Burials / Memorials','burials',   'Dignified, respectful coverage of memorial services.',                 'https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=1200&q=80', 3, true),
  ('Picnics',            'picnics',   'Relaxed group and lifestyle sessions outdoors.',                        'https://images.unsplash.com/photo-1526401485004-46910ecc8e51?w=1200&q=80', 4, true),
  ('Studio',             'studio',    'Controlled lighting portraits in the studio.',                          'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=1200&q=80', 5, true),
  ('Kids',               'kids',      'Playful, patient sessions for children and families.',                  'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1200&q=80', 6, true),
  ('Frames',             'frames',    'Printed frames and fine-art products of your favourite images.',        'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=1200&q=80', 7, true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------
insert into public.services (title, slug, description, image_url, price, price_type, display_order, is_active) values
  ('Wedding Photography',        'wedding-photography',  'Full-day coverage, a second shooter on request, and a curated online gallery.', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&q=80', 250000, 'starting_from', 1, true),
  ('Outdoor Photography',        'outdoor-photography',  'Golden-hour portraits on location of your choosing.',                            'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1000&q=80', 60000, 'starting_from', 2, true),
  ('Studio Photography',         'studio-photography',   'Professionally lit studio portraits with wardrobe changes.',                     'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=1000&q=80', 45000, 'starting_from', 3, true),
  ('Family Photography',         'family-photography',   'Relaxed family sessions, indoors or out.',                                       'https://images.unsplash.com/photo-1543342384-1f1350e27861?w=1000&q=80', 50000, 'starting_from', 4, true),
  ('Kids Photography',           'kids-photography',     'Patient, playful sessions built around your child.',                             'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1000&q=80', 40000, 'starting_from', 5, true),
  ('Picnic Photography',         'picnic-photography',   'Lifestyle coverage of picnics and group hangouts.',                              'https://images.unsplash.com/photo-1526401485004-46910ecc8e51?w=1000&q=80', 55000, 'starting_from', 6, true),
  ('Memorial / Burial Coverage', 'memorial-coverage',    'Respectful, discreet coverage of memorial services.',                            'https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=1000&q=80', null, 'custom', 7, true),
  ('Event Photography',          'event-photography',    'Corporate events, launches, birthdays and celebrations.',                        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1000&q=80', 80000, 'starting_from', 8, true),
  ('Photo Frames / Prints',      'frames-prints',        'Fine-art prints and framed products of your favourite images.',                  'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=1000&q=80', 15000, 'starting_from', 9, true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Testimonials  (DEMO / PLACEHOLDER — replace with real client words)
-- ---------------------------------------------------------------------------
insert into public.testimonials (client_name, client_role, testimonial, rating, is_featured, is_published, display_order)
select * from (values
  ('[DEMO] Amaka O.',  'Wedding client',  'The team made our day feel effortless, and the photos brought us right back to every moment. Absolutely worth it.', 5, true, true, 1),
  ('[DEMO] Tunde A.',  'Portrait client', 'Professional from the first message to the final gallery. The studio portraits exceeded what I imagined.', 5, true, true, 2),
  ('[DEMO] Chiamaka N.','Family session', 'They were so patient with our kids and still captured the most natural, beautiful frames.', 5, false, true, 3)
) as t(client_name, client_role, testimonial, rating, is_featured, is_published, display_order)
where not exists (select 1 from public.testimonials);

-- ---------------------------------------------------------------------------
-- Demo photographs  (DEMO — stock imagery for preview only; replace by
-- uploading your own in the admin Portfolio. storage_path is prefixed 'demo/'.)
-- ---------------------------------------------------------------------------
insert into public.photos (category_id, title, alt_text, image_url, thumbnail_url, storage_path, width, height, is_featured, is_published, display_order)
select c.id, v.title, v.alt_text, v.image_url, v.image_url, v.storage_path, 1600, 1067, v.is_featured, true, v.display_order
from (values
  ('weddings', 'First Dance',     'Couple sharing their first dance',     'https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80', 'demo/weddings-1.jpg', true,  1),
  ('weddings', 'The Vows',        'Bride and groom exchanging vows',      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1600&q=80', 'demo/weddings-2.jpg', true,  2),
  ('outdoor',  'Golden Hour',     'Portrait during golden hour outdoors', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1600&q=80', 'demo/outdoor-1.jpg',  true,  3),
  ('outdoor',  'Open Fields',     'Subject walking through open fields',  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1600&q=80', 'demo/outdoor-2.jpg',  false, 4),
  ('studio',   'Studio Portrait', 'Studio portrait with soft lighting',   'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=1600&q=80', 'demo/studio-1.jpg',   true,  5),
  ('studio',   'Beauty Light',    'Close-up studio beauty portrait',      'https://images.unsplash.com/photo-1503104834685-7205e8607eb9?w=1600&q=80', 'demo/studio-2.jpg',   false, 6),
  ('kids',     'Little Explorer', 'Child playing outdoors',               'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1600&q=80', 'demo/kids-1.jpg',     true,  7),
  ('picnics',  'Afternoon Picnic','Friends enjoying a picnic',            'https://images.unsplash.com/photo-1526401485004-46910ecc8e51?w=1600&q=80', 'demo/picnics-1.jpg',  false, 8),
  ('frames',   'Framed Print',    'A framed fine-art print on a wall',    'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=1600&q=80', 'demo/frames-1.jpg',   false, 9),
  ('burials',  'In Remembrance',  'White flowers at a memorial service',  'https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=1600&q=80', 'demo/burials-1.jpg',  false, 10)
) as v(cat_slug, title, alt_text, image_url, storage_path, is_featured, display_order)
join public.categories c on c.slug = v.cat_slug
where not exists (select 1 from public.photos);
