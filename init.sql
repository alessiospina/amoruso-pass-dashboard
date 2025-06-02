-- ============================================
-- AMORUSO PASS DASHBOARD - DATABASE INITIALIZATION
-- ============================================

-- Imposta il charset per supportare caratteri italiani
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Crea il database se non esiste
CREATE DATABASE IF NOT EXISTS amoruso_pass_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Usa il database
USE amoruso_pass_db;

-- ============================================
-- CONFIGURAZIONI DATABASE
-- ============================================

-- Imposta timezone
SET time_zone = '+01:00';

-- Ottimizzazioni per performance
SET innodb_buffer_pool_size = 128M;
SET max_connections = 200;

-- ============================================
-- UTENTE AMMINISTRATORE DEFAULT
-- ============================================
-- Nota: La password sarà hashata dall'applicazione
-- Password di default: "admin123" 
-- CAMBIA IMMEDIATAMENTE dopo il primo login!

-- La tabella users verrà creata da Prisma migrate
-- Questo script inserirà l'admin dopo che Prisma ha creato le tabelle

-- ============================================
-- STORED PROCEDURES PER STATISTICHE
-- ============================================

DELIMITER //

-- Procedura per statistiche rapide
CREATE PROCEDURE IF NOT EXISTS GetDashboardStats()
BEGIN
    DECLARE total_ingressi INT DEFAULT 0;
    DECLARE total_importi DECIMAL(10,2) DEFAULT 0.00;
    DECLARE today_ingressi INT DEFAULT 0;
    DECLARE today_importi DECIMAL(10,2) DEFAULT 0.00;
    
    -- Controlla se la tabella esiste
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ingressi' AND table_schema = DATABASE()) THEN
        -- Totali
        SELECT COUNT(*), IFNULL(SUM(importo), 0) 
        INTO total_ingressi, total_importi 
        FROM ingressi;
        
        -- Oggi
        SELECT COUNT(*), IFNULL(SUM(importo), 0)
        INTO today_ingressi, today_importi
        FROM ingressi 
        WHERE DATE(created_at) = CURDATE();
        
        -- Risultato
        SELECT 
            total_ingressi as total_entries,
            total_importi as total_revenue,
            today_ingressi as today_entries,
            today_importi as today_revenue,
            NOW() as generated_at;
    ELSE
        -- Tabella non esiste ancora
        SELECT 
            0 as total_entries,
            0.00 as total_revenue,
            0 as today_entries,
            0.00 as today_revenue,
            NOW() as generated_at;
    END IF;
END //

DELIMITER ;

-- ============================================
-- FUNZIONI UTILITY
-- ============================================

DELIMITER //

-- Funzione per validare Partita IVA italiana
CREATE FUNCTION IF NOT EXISTS ValidatePartitaIVA(piva VARCHAR(11))
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE is_valid BOOLEAN DEFAULT FALSE;
    DECLARE i INT DEFAULT 1;
    DECLARE sum_odd INT DEFAULT 0;
    DECLARE sum_even INT DEFAULT 0;
    DECLARE check_digit INT;
    DECLARE calculated_check INT;
    
    -- Controlla lunghezza
    IF CHAR_LENGTH(piva) != 11 THEN
        RETURN FALSE;
    END IF;
    
    -- Controlla che sia solo numeri
    IF piva REGEXP '^[0-9]{11}$' = 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Algoritmo di validazione Partita IVA
    WHILE i <= 10 DO
        IF i % 2 = 1 THEN
            SET sum_odd = sum_odd + CAST(SUBSTR(piva, i, 1) AS UNSIGNED);
        ELSE
            SET sum_even = sum_even + CAST(SUBSTR(piva, i, 1) AS UNSIGNED);
        END IF;
        SET i = i + 1;
    END WHILE;
    
    SET sum_even = sum_even * 2;
    SET calculated_check = (10 - ((sum_odd + sum_even) % 10)) % 10;
    SET check_digit = CAST(SUBSTR(piva, 11, 1) AS UNSIGNED);
    
    IF calculated_check = check_digit THEN
        SET is_valid = TRUE;
    END IF;
    
    RETURN is_valid;
END //

-- Funzione per formattare targa italiana
CREATE FUNCTION IF NOT EXISTS FormatTarga(targa VARCHAR(10))
RETURNS VARCHAR(10)
DETERMINISTIC
BEGIN
    DECLARE formatted_targa VARCHAR(10);
    
    -- Rimuove spazi e converte in maiuscolo
    SET formatted_targa = UPPER(REPLACE(targa, ' ', ''));
    
    -- Validazione formato targa italiana (2 lettere + 3 numeri + 2 lettere)
    IF formatted_targa REGEXP '^[A-Z]{2}[0-9]{3}[A-Z]{2}$' THEN
        RETURN formatted_targa;
    END IF;
    
    RETURN targa; -- Ritorna originale se non valida
END //

DELIMITER ;

-- ============================================
-- CONFIGURAZIONI FINALI
-- ============================================

-- Log delle operazioni
CREATE TABLE IF NOT EXISTS init_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO init_log (message) VALUES ('Database initialization completed successfully');

-- ============================================
-- INFORMAZIONI FINALI
-- ============================================

SELECT 
    'Database inizializzato correttamente' as status,
    DATABASE() as database_name,
    USER() as current_user,
    NOW() as initialized_at;
