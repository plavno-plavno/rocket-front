/** Cities used by the seed: name, region (subject of RF), ISO 3166-2 code, lat/lng, weight (share of locations). */
export interface SeedCity {
  city: string;
  region: string;
  region_code: string;
  lat: number;
  lng: number;
  weight: number;
  tz: string;
}

export const CITIES: SeedCity[] = [
  {
    city: 'Москва',
    region: 'Москва',
    region_code: 'RU-MOW',
    lat: 55.7558,
    lng: 37.6173,
    weight: 22,
    tz: 'Europe/Moscow'
  },
  {
    city: 'Санкт-Петербург',
    region: 'Санкт-Петербург',
    region_code: 'RU-SPE',
    lat: 59.9343,
    lng: 30.3351,
    weight: 14,
    tz: 'Europe/Moscow'
  },
  {
    city: 'Новосибирск',
    region: 'Новосибирская область',
    region_code: 'RU-NVS',
    lat: 55.0084,
    lng: 82.9357,
    weight: 6,
    tz: 'Asia/Novosibirsk'
  },
  {
    city: 'Екатеринбург',
    region: 'Свердловская область',
    region_code: 'RU-SVE',
    lat: 56.8389,
    lng: 60.6057,
    weight: 6,
    tz: 'Asia/Yekaterinburg'
  },
  {
    city: 'Казань',
    region: 'Республика Татарстан',
    region_code: 'RU-TA',
    lat: 55.7963,
    lng: 49.1088,
    weight: 5,
    tz: 'Europe/Moscow'
  },
  {
    city: 'Нижний Новгород',
    region: 'Нижегородская область',
    region_code: 'RU-NIZ',
    lat: 56.2965,
    lng: 43.9361,
    weight: 4,
    tz: 'Europe/Moscow'
  },
  {
    city: 'Челябинск',
    region: 'Челябинская область',
    region_code: 'RU-CHE',
    lat: 55.1644,
    lng: 61.4368,
    weight: 3,
    tz: 'Asia/Yekaterinburg'
  },
  {
    city: 'Самара',
    region: 'Самарская область',
    region_code: 'RU-SAM',
    lat: 53.1959,
    lng: 50.1002,
    weight: 3,
    tz: 'Europe/Samara'
  },
  {
    city: 'Омск',
    region: 'Омская область',
    region_code: 'RU-OMS',
    lat: 54.9885,
    lng: 73.3242,
    weight: 3,
    tz: 'Asia/Omsk'
  },
  {
    city: 'Ростов-на-Дону',
    region: 'Ростовская область',
    region_code: 'RU-ROS',
    lat: 47.2357,
    lng: 39.7015,
    weight: 4,
    tz: 'Europe/Moscow'
  },
  {
    city: 'Уфа',
    region: 'Республика Башкортостан',
    region_code: 'RU-BA',
    lat: 54.7388,
    lng: 55.9721,
    weight: 3,
    tz: 'Asia/Yekaterinburg'
  },
  {
    city: 'Красноярск',
    region: 'Красноярский край',
    region_code: 'RU-KYA',
    lat: 56.0153,
    lng: 92.8932,
    weight: 3,
    tz: 'Asia/Krasnoyarsk'
  },
  {
    city: 'Воронеж',
    region: 'Воронежская область',
    region_code: 'RU-VOR',
    lat: 51.6608,
    lng: 39.2003,
    weight: 3,
    tz: 'Europe/Moscow'
  },
  {
    city: 'Пермь',
    region: 'Пермский край',
    region_code: 'RU-PER',
    lat: 58.0105,
    lng: 56.2502,
    weight: 3,
    tz: 'Asia/Yekaterinburg'
  },
  {
    city: 'Волгоград',
    region: 'Волгоградская область',
    region_code: 'RU-VGG',
    lat: 48.708,
    lng: 44.5133,
    weight: 3,
    tz: 'Europe/Volgograd'
  },
  {
    city: 'Краснодар',
    region: 'Краснодарский край',
    region_code: 'RU-KDA',
    lat: 45.0355,
    lng: 38.975,
    weight: 5,
    tz: 'Europe/Moscow'
  },
  {
    city: 'Сочи',
    region: 'Краснодарский край',
    region_code: 'RU-KDA',
    lat: 43.6028,
    lng: 39.7342,
    weight: 2,
    tz: 'Europe/Moscow'
  },
  {
    city: 'Тюмень',
    region: 'Тюменская область',
    region_code: 'RU-TYU',
    lat: 57.153,
    lng: 65.5343,
    weight: 2,
    tz: 'Asia/Yekaterinburg'
  },
  {
    city: 'Калининград',
    region: 'Калининградская область',
    region_code: 'RU-KGD',
    lat: 54.7104,
    lng: 20.4522,
    weight: 2,
    tz: 'Europe/Kaliningrad'
  },
  {
    city: 'Владивосток',
    region: 'Приморский край',
    region_code: 'RU-PRI',
    lat: 43.1155,
    lng: 131.8855,
    weight: 2,
    tz: 'Asia/Vladivostok'
  },
  {
    city: 'Иркутск',
    region: 'Иркутская область',
    region_code: 'RU-IRK',
    lat: 52.2869,
    lng: 104.305,
    weight: 2,
    tz: 'Asia/Irkutsk'
  },
  {
    city: 'Хабаровск',
    region: 'Хабаровский край',
    region_code: 'RU-KHA',
    lat: 48.4802,
    lng: 135.0719,
    weight: 1,
    tz: 'Asia/Vladivostok'
  }
];

export const STREETS = [
  'проспект Ленина',
  'улица Пушкина',
  'улица Гагарина',
  'улица Кирова',
  'улица Советская',
  'проспект Мира',
  'улица Ленина',
  'улица Победы',
  'улица Московская',
  'улица Садовая',
  'улица Комсомольская',
  'проспект Победы',
  'улица Профсоюзная',
  'улица Адмирала Трибуца',
  'Невский проспект',
  'Тверская улица',
  'улица Красный Путь',
  'улица Малышева',
  'Большая Покровская улица'
];

export const MALLS = [
  'ТРК Жемчужная Плаза',
  'ТЦ Мега',
  'ТРЦ Галерея',
  'ТЦ Европейский',
  'ТРЦ Аура',
  'ТЦ Гринвич',
  'ТРК Планета',
  'ТЦ Кольцо',
  'ТРЦ Горки',
  'ТЦ Континент',
  'ТРЦ Сити Молл',
  'ТЦ Афимолл',
  null,
  null,
  null,
  null
];
