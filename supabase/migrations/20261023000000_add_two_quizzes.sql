-- Add two student quizzes while keeping correct answers in the private schema.

insert into public.quizzes (
  id, slug, title, summary, instructions, duration_minutes, is_published
) values
  (
    '10000000-0000-4000-8000-000000000002',
    'everyday-mathematics',
    'Everyday Mathematics',
    'Practice number sense, fractions, measurement, and simple problem solving.',
    'Choose one answer for each question. You can move between questions before you submit. Your score is calculated after submission.',
    12,
    true
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'science-essentials',
    'Science Essentials',
    'Explore basic ideas about living things, matter, energy, and our planet.',
    'Choose one answer for each question. You can move between questions before you submit. Your score is calculated after submission.',
    12,
    true
  );

insert into public.questions (id, quiz_id, position, prompt, options) values
  ('20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000002', 1, 'What is 3/4 written as a percentage?', $$[{"id":"A","text":"25%"},{"id":"B","text":"50%"},{"id":"C","text":"75%"},{"id":"D","text":"90%"}]$$::jsonb),
  ('20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000002', 2, 'A notebook costs ₦450. How much do 3 notebooks cost?', $$[{"id":"A","text":"₦900"},{"id":"B","text":"₦1,250"},{"id":"C","text":"₦1,350"},{"id":"D","text":"₦1,450"}]$$::jsonb),
  ('20000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000002', 3, 'Which number is the largest?', $$[{"id":"A","text":"0.62"},{"id":"B","text":"0.7"},{"id":"C","text":"0.068"},{"id":"D","text":"0.602"}]$$::jsonb),
  ('20000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000002', 4, 'A lesson begins at 9:35 a.m. and lasts 50 minutes. When does it end?', $$[{"id":"A","text":"10:15 a.m."},{"id":"B","text":"10:25 a.m."},{"id":"C","text":"10:35 a.m."},{"id":"D","text":"11:25 a.m."}]$$::jsonb),
  ('20000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000002', 5, 'A rectangular garden is 8 metres long and 5 metres wide. What is its area?', $$[{"id":"A","text":"13 m²"},{"id":"B","text":"26 m²"},{"id":"C","text":"40 m²"},{"id":"D","text":"80 m²"}]$$::jsonb),
  ('20000000-0000-4000-8000-000000000016', '10000000-0000-4000-8000-000000000002', 6, 'What is 2/5 + 1/5?', $$[{"id":"A","text":"3/10"},{"id":"B","text":"3/5"},{"id":"C","text":"2/10"},{"id":"D","text":"1/5"}]$$::jsonb),
  ('20000000-0000-4000-8000-000000000017', '10000000-0000-4000-8000-000000000002', 7, 'A bus travels 120 kilometres in 2 hours at a steady speed. What is its speed?', $$[{"id":"A","text":"40 km/h"},{"id":"B","text":"50 km/h"},{"id":"C","text":"60 km/h"},{"id":"D","text":"240 km/h"}]$$::jsonb),
  ('20000000-0000-4000-8000-000000000018', '10000000-0000-4000-8000-000000000002', 8, 'What is the perimeter of a square with sides of 6 centimetres?', $$[{"id":"A","text":"12 cm"},{"id":"B","text":"18 cm"},{"id":"C","text":"24 cm"},{"id":"D","text":"36 cm"}]$$::jsonb),
  ('20000000-0000-4000-8000-000000000019', '10000000-0000-4000-8000-000000000002', 9, 'Which fraction is equivalent to 2/3?', $$[{"id":"A","text":"4/6"},{"id":"B","text":"3/5"},{"id":"C","text":"5/8"},{"id":"D","text":"6/12"}]$$::jsonb),
  ('20000000-0000-4000-8000-000000000020', '10000000-0000-4000-8000-000000000002', 10, 'A water tank holds 200 litres and is 1/4 full. How many litres of water are in it?', $$[{"id":"A","text":"25 litres"},{"id":"B","text":"40 litres"},{"id":"C","text":"50 litres"},{"id":"D","text":"100 litres"}]$$::jsonb),
  ('20000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000003', 1, 'Which part of a plant absorbs most water from the soil?', $$[{"id":"A","text":"Flower"},{"id":"B","text":"Root"},{"id":"C","text":"Fruit"},{"id":"D","text":"Leaf"}]$$::jsonb),
  ('20000000-0000-4000-8000-000000000022', '10000000-0000-4000-8000-000000000003', 2, 'Which state of matter has a fixed shape and a fixed volume?', $$[{"id":"A","text":"Gas"},{"id":"B","text":"Liquid"},{"id":"C","text":"Solid"},{"id":"D","text":"Vapour"}]$$::jsonb),
  ('20000000-0000-4000-8000-000000000023', '10000000-0000-4000-8000-000000000003', 3, 'What is the main source of energy for Earth’s weather and living systems?', $$[{"id":"A","text":"The Moon"},{"id":"B","text":"The Sun"},{"id":"C","text":"The ocean floor"},{"id":"D","text":"Earth’s magnetic field"}]$$::jsonb),
  ('20000000-0000-4000-8000-000000000024', '10000000-0000-4000-8000-000000000003', 4, 'Which organ pumps blood around the human body?', $$[{"id":"A","text":"Lung"},{"id":"B","text":"Stomach"},{"id":"C","text":"Heart"},{"id":"D","text":"Kidney"}]$$::jsonb),
  ('20000000-0000-4000-8000-000000000025', '10000000-0000-4000-8000-000000000003', 5, 'Water changing from a liquid into a gas at the surface is called what?', $$[{"id":"A","text":"Freezing"},{"id":"B","text":"Condensation"},{"id":"C","text":"Evaporation"},{"id":"D","text":"Melting"}]$$::jsonb),
  ('20000000-0000-4000-8000-000000000026', '10000000-0000-4000-8000-000000000003', 6, 'Which action helps reduce the spread of many infectious diseases?', $$[{"id":"A","text":"Washing hands with soap"},{"id":"B","text":"Sharing drinking cups"},{"id":"C","text":"Leaving food uncovered"},{"id":"D","text":"Avoiding clean water"}]$$::jsonb),
  ('20000000-0000-4000-8000-000000000027', '10000000-0000-4000-8000-000000000003', 7, 'What force pulls objects toward Earth?', $$[{"id":"A","text":"Friction"},{"id":"B","text":"Gravity"},{"id":"C","text":"Magnetism"},{"id":"D","text":"Electricity"}]$$::jsonb),
  ('20000000-0000-4000-8000-000000000028', '10000000-0000-4000-8000-000000000003', 8, 'Which gas do green plants take in from the air during photosynthesis?', $$[{"id":"A","text":"Oxygen"},{"id":"B","text":"Nitrogen"},{"id":"C","text":"Carbon dioxide"},{"id":"D","text":"Helium"}]$$::jsonb),
  ('20000000-0000-4000-8000-000000000029', '10000000-0000-4000-8000-000000000003', 9, 'Which material is usually attracted to a magnet?', $$[{"id":"A","text":"Iron"},{"id":"B","text":"Wood"},{"id":"C","text":"Glass"},{"id":"D","text":"Paper"}]$$::jsonb),
  ('20000000-0000-4000-8000-000000000030', '10000000-0000-4000-8000-000000000003', 10, 'What is the process by which green plants make food using light?', $$[{"id":"A","text":"Digestion"},{"id":"B","text":"Respiration"},{"id":"C","text":"Photosynthesis"},{"id":"D","text":"Germination"}]$$::jsonb);

insert into private.quiz_answer_keys (question_id, correct_option) values
  ('20000000-0000-4000-8000-000000000011', 'C'),
  ('20000000-0000-4000-8000-000000000012', 'C'),
  ('20000000-0000-4000-8000-000000000013', 'B'),
  ('20000000-0000-4000-8000-000000000014', 'B'),
  ('20000000-0000-4000-8000-000000000015', 'C'),
  ('20000000-0000-4000-8000-000000000016', 'B'),
  ('20000000-0000-4000-8000-000000000017', 'C'),
  ('20000000-0000-4000-8000-000000000018', 'C'),
  ('20000000-0000-4000-8000-000000000019', 'A'),
  ('20000000-0000-4000-8000-000000000020', 'C'),
  ('20000000-0000-4000-8000-000000000021', 'B'),
  ('20000000-0000-4000-8000-000000000022', 'C'),
  ('20000000-0000-4000-8000-000000000023', 'B'),
  ('20000000-0000-4000-8000-000000000024', 'C'),
  ('20000000-0000-4000-8000-000000000025', 'C'),
  ('20000000-0000-4000-8000-000000000026', 'A'),
  ('20000000-0000-4000-8000-000000000027', 'B'),
  ('20000000-0000-4000-8000-000000000028', 'C'),
  ('20000000-0000-4000-8000-000000000029', 'A'),
  ('20000000-0000-4000-8000-000000000030', 'C');

