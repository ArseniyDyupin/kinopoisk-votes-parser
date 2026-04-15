# Kinopoisk Votes Parser

CLI-утилита для экспорта ваших оценок с [Кинопоиска](https://www.kinopoisk.ru/) в **JSON**, **CSV** или **XML**. Открывает реальный браузер через Playwright — вы можете авторизоваться и пройти капчу вручную, после чего утилита автоматически выгрузит все страницы с оценками.

## Требования

- **Node.js >= 18** (протестировано на 22)
- **npm**

## Установка

```bash
git clone https://github.com/ArseniyDyupin/kinopoisk-votes-parser.git
cd kinopoisk-votes-parser
npm install
```

`npm install` автоматически скачает браузер Chromium, необходимый для Playwright.

## Использование

```bash
npx tsx src/index.ts --user-id <ВАШ_USER_ID> [опции]
```

### Как узнать свой User ID

Откройте свой профиль на Кинопоиске в браузере. URL выглядит так:

```
https://www.kinopoisk.ru/user/129356/
                              ^^^^^^ это ваш user ID
```

### Опции

| Флаг | По умолчанию | Описание |
|------|-------------|----------|
| `--user-id <id>` | **(обязательный)** | ID пользователя Кинопоиска |
| `--format <fmt>` | `json` | Формат вывода: `json`, `csv`, `xml` |
| `--fields <список>` | все поля | Список полей через запятую |
| `--output <путь>` | `ratings_<userId>.<формат>` | Путь к выходному файлу |
| `--help` | | Показать справку |

### Доступные поля

| Поле | Пример |
|------|--------|
| `title` | Зомболодка! (сериал, 2019) |
| `originalTitle` | Zomboat! |
| `year` | 2019 |
| `rating` | 7 |
| `ratedAt` | 15.04.2026, 11:49 |
| `kpRating` | 7.275 |
| `votesCount` | 22468 |
| `duration` | 24 |
| `kpUrl` | https://www.kinopoisk.ru/film/1234/ |

### Примеры

Экспорт всех полей в JSON (по умолчанию):

```bash
npx tsx src/index.ts --user-id 129356
```

Экспорт только названия, оценки и даты в CSV:

```bash
npx tsx src/index.ts --user-id 129356 --format csv --fields title,rating,ratedAt
```

Экспорт в XML в конкретный файл:

```bash
npx tsx src/index.ts --user-id 129356 --format xml --output my-export.xml
```

## Как это работает

1. Открывается окно браузера Chromium и переходит на страницу ваших оценок.
2. **Вы авторизуетесь** на Кинопоиске, если необходимо (или проходите капчу) прямо в браузере.
3. Нажимаете **Enter** в терминале, когда список оценок виден на странице.
4. Утилита автоматически проходит по всем страницам (с задержкой 1.5 сек между страницами, чтобы не превышать лимиты).
5. Выходной файл сохраняется, браузер закрывается.

## Примеры вывода

### JSON

```json
[
  {
    "title": "Зомболодка! (сериал, 2019)",
    "originalTitle": "Zomboat!",
    "year": "2019",
    "rating": 7,
    "ratedAt": "15.04.2026, 11:49",
    "kpRating": "7.275",
    "votesCount": "22468",
    "duration": "24",
    "kpUrl": "https://www.kinopoisk.ru/film/1234/"
  }
]
```

### CSV

```csv
"title","rating","ratedAt"
"Зомболодка! (сериал, 2019)","7","15.04.2026, 11:49"
```

### XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ratings>
  <rating>
    <title>Зомболодка! (сериал, 2019)</title>
    <rating>7</rating>
    <ratedAt>15.04.2026, 11:49</ratedAt>
  </rating>
</ratings>
```

## Тесты

```bash
npm test
```

Покрыты:
- Форматирование вывода (JSON / CSV / XML) и фильтрация полей
- Парсинг аргументов CLI
- Парсинг HTML-страницы с оценками (интеграционный тест с mock HTML через Playwright)

## Лицензия

MIT
