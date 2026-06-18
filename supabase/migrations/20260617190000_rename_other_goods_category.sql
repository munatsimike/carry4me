-- Rename goods category display label from Other to Miscellaneous.
update public.goods_categories
set name = 'Miscellaneous'
where slug = 'other';
