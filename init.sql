-- Inizializzazione database Amoruso Pass Dashboard

-- Crea il database se non esiste
CREATE DATABASE IF NOT EXISTS amoruso_pass_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Assicurati di usare il database corretto
USE amoruso_pass_db;

-- Configurazione ottimale per MySQL
SET GLOBAL innodb_buffer_pool_size = 128M;
SET GLOBAL query_cache_size = 32M;
SET GLOBAL query_cache_type = ON;

-- Log delle operazioni
SELECT 'Database amoruso_pass_db inizializzato con successo' as status;
