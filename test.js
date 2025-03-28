const sql = require('mssql');

const config = {
  server: 'localhost',
  port: 1433,
  user: 'sa',
  password: 'Makoto1209',
  database: 'xranking',
  options: {
    trustServerCertificate: true,
  },
};

sql.connect(config).then(() => {
  console.log('✅ Connected successfully!');
  sql.close();
}).catch(err => {
  console.error('❌ Connection failed:', err);
});
