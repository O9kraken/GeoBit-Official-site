/** Города: границы поиска [юг, запад, север, восток] */
export const CITIES: Record<string, { label: string; bbox: [number, number, number, number] }> = {
  sevastopol: { label: 'Севастополь', bbox: [44.38, 33.37, 44.83, 33.95] },
  simferopol: { label: 'Симферополь', bbox: [44.9, 34.03, 45.01, 34.18] },
  yalta: { label: 'Ялта и Большая Ялта', bbox: [44.38, 33.95, 44.57, 34.4] },
  alushta: { label: 'Алушта', bbox: [44.63, 34.33, 44.72, 34.43] },
  evpatoriya: { label: 'Евпатория', bbox: [45.15, 33.28, 45.23, 33.45] },
  feodosiya: { label: 'Феодосия', bbox: [44.99, 35.31, 45.08, 35.42] },
  kerch: { label: 'Керчь', bbox: [45.27, 36.37, 45.42, 36.56] },
  sudak: { label: 'Судак', bbox: [44.82, 34.92, 44.88, 35.02] },
}

/**
 * Сферы бизнеса: OSM-теги (ключ → регулярка значений) и запрос для 2ГИС.
 * Подобраны под отраслевые страницы сайта — по ним проще продавать.
 */
export const NICHES: Record<string, { label: string; osm: [string, string][]; q: string }> = {
  cafe: { label: 'Кафе, рестораны, бары', osm: [['amenity', 'cafe|restaurant|fast_food|bar|pub']], q: 'кафе ресторан' },
  hotel: { label: 'Гостиницы, гостевые дома, базы отдыха', osm: [['tourism', 'hotel|guest_house|hostel|motel|apartment|chalet|camp_site']], q: 'гостиница гостевой дом' },
  dentist: { label: 'Стоматологии', osm: [['amenity', 'dentist'], ['healthcare', 'dentist']], q: 'стоматология' },
  clinic: { label: 'Медцентры и клиники', osm: [['amenity', 'clinic|doctors'], ['healthcare', 'clinic|doctor|centre']], q: 'медицинский центр' },
  beauty: { label: 'Салоны красоты, барбершопы', osm: [['shop', 'beauty|hairdresser|cosmetics|massage']], q: 'салон красоты' },
  auto: { label: 'Автосервисы, шиномонтаж, мойки', osm: [['shop', 'car_repair|tyres|car_parts|car'], ['amenity', 'car_wash']], q: 'автосервис' },
  fitness: { label: 'Фитнес и спорт', osm: [['leisure', 'fitness_centre|sports_centre|dance']], q: 'фитнес клуб' },
  tour: { label: 'Турагентства и экскурсии', osm: [['shop', 'travel_agency'], ['office', 'travel_agent|guide']], q: 'турагентство экскурсии' },
  legal: { label: 'Юристы и нотариусы', osm: [['office', 'lawyer|notary|accountant|tax_advisor']], q: 'юридические услуги' },
  build: { label: 'Строительство и ремонт', osm: [['craft', 'builder|carpenter|electrician|plumber|roofer|window_construction|tiler'], ['shop', 'doityourself|hardware|trade|bathroom_furnishing|kitchen|doors|windows']], q: 'строительная компания ремонт' },
  edu: { label: 'Курсы, школы, автошколы', osm: [['amenity', 'language_school|driving_school|music_school|prep_school|training']], q: 'курсы обучение' },
  photo: { label: 'Фотографы и фотостудии', osm: [['craft', 'photographer|photographic_laboratory'], ['shop', 'photo|photo_studio']], q: 'фотостудия' },
  vet: { label: 'Ветклиники и зоотовары', osm: [['amenity', 'veterinary'], ['shop', 'pet|pet_grooming']], q: 'ветеринарная клиника' },
  shop: { label: 'Магазины (одежда, цветы, мебель)', osm: [['shop', 'clothes|florist|furniture|shoes|jewelry|gift|boutique']], q: 'магазин' },
}
