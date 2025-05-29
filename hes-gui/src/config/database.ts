export const dbConfig = {
  host: 'localhost',
  port: 5433,
  database: 'hes_db',
  user: 'hes_user',
  password: 'hes_password',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
}; 