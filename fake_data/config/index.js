export default {
  port: 3000,
  databaseUrl: 'mysql://root:123456@localhost:3306/ai_news?charset=utf8mb4_unicode_ci&connectionLimit=10&flags=-FOUND_ROWS',
  redisUrl: 'redis://localhost:6379/0',
  elasticSearchUrl: 'http://localhost:9200',
};

// export default {
//   port: 3000,
//   databaseUrl: 'mysql://root:zgP1OR50el1WaVYW@10.148.0.9:3306/ai_news?charset=utf8mb4_unicode_ci&connectionLimit=10&flags=-FOUND_ROWS',
//   redisUrl: 'redis://10.148.0.5:6379/0',
//   elasticSearchUrl: 'http://10.148.0.7:9200',
// };
