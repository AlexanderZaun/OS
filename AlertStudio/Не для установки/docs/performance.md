# Производительность: что измерено

[Русский](<performance.md>) · [English](<en/performance.md>) · [Оглавление](<README.md>)

Исторический storage microbenchmark: Windows, AMD Ryzen 9 5900X, 63.9 GiB RAM, Node 24.19.0; сцены 1920×1080 с 1/50/200 text-объектами. Каждый объект хранит metadata и отдельные значения. Команда node tools/performance.mjs; результаты локальны в artifacts/performance.json.

| Text objects | Save, ms | Open, ms | RSS, MiB |
|---|---:|---:|---:|
| 1 | 28.66 | 12.41 | 51.1 |
| 50 | 541.07 | 141.86 | 56.4 |
| 200 | 1787.77 | 525.42 | 56.6 |

Это checkpoint с sync каждого JSON и backup index: один запуск, тёплый/неочищенный filesystem cache, без доверительных интервалов. RSS — выборка, не peak. Исторический вариант без sync/backup был быстрее, но не является строгим A/B. CPU evaluate microbenchmark не включает Canvas raster и не показывает UI FPS.

Fog/stars/network harness измеряет синхронные evaluate/render после прогрева без React, vsync и encoding. Ограниченные кеши, dispose, paused redraw и density/mask budgets проверены функционально. Дополнительный Canvas стоит отдельной работы; число слоёв не бесплатно.

Не измерены полные p95/p99 edit latency, длительная нагрузка/peak memory, GPU comparison и export throughput/cancel. Ревизии пока не чистятся автоматически. Не выводите универсальную производительность из этих чисел.
