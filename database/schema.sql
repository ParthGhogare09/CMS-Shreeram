CREATE DATABASE IF NOT EXISTS construction_cms;
USE construction_cms;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    budget DECIMAL(15,2) DEFAULT 0,
    status ENUM('Planning', 'Active', 'Completed', 'On Hold') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    daily_wage DECIMAL(10,2) NOT NULL,
    contact_info VARCHAR(255),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS worker_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    worker_id INT NOT NULL,
    project_id INT NOT NULL,
    log_date DATE NOT NULL,
    role_at_time VARCHAR(100),
    wage_at_time DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    total_quantity DECIMAL(15,2) DEFAULT 0,
    stock_remaining DECIMAL(15,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS material_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    material_id INT NOT NULL,
    project_id INT NOT NULL,
    quantity DECIMAL(15,2) NOT NULL,
    usage_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS finances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    type ENUM('Income', 'Expense') NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    record_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- DUMMY DATA FOR DEMONSTRATION --
INSERT IGNORE INTO users (username, password_hash, role) VALUES ('admin', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGGa.PDC', 'admin'); -- password: admin

INSERT INTO projects (name, client_name, budget, status) VALUES 
('Skyline Tower', 'Apex Builders Inc', 5000000.00, 'Active'),
('Riverside Condos', 'Grand Lakes Realty', 2500000.00, 'Planning'),
('Downtown Mall Renovation', 'City Properties', 850000.00, 'Completed');

INSERT INTO workers (name, role, daily_wage, contact_info) VALUES 
('John Doe', 'Foreman', 250.00, '555-0101'),
('Mike Smith', 'Electrician', 200.00, '555-0102'),
('Sarah Connor', 'Crane Operator', 220.00, '555-0103'),
('Tom Hardy', 'Mason', 180.00, '555-0104'),
('Jake Peralta', 'General Laborer', 150.00, '555-0105');

INSERT INTO worker_logs (worker_id, project_id, log_date, role_at_time, wage_at_time) VALUES 
(1, 1, CURDATE() - INTERVAL 1 DAY, 'Foreman', 250.00),
(2, 1, CURDATE() - INTERVAL 1 DAY, 'Electrician', 200.00),
(3, 1, CURDATE() - INTERVAL 1 DAY, 'Crane Operator', 220.00),
(4, 2, CURDATE() - INTERVAL 1 DAY, 'Mason', 180.00),
(5, 2, CURDATE(), 'General Laborer', 150.00),
(1, 1, CURDATE(), 'Foreman', 250.00),
(2, 1, CURDATE(), 'Electrician', 200.00);

INSERT INTO materials (name, unit, total_quantity, stock_remaining) VALUES 
('Concrete', 'Cubic Yards', 1000.00, 450.00),
('Steel Rebar', 'Tons', 500.00, 200.00),
('Bricks', 'Pallets', 300.00, 150.00),
('Copper Wire', 'Spoils', 100.00, 80.00);

INSERT INTO material_usage (material_id, project_id, quantity, usage_date) VALUES 
(1, 1, 550.00, CURDATE() - INTERVAL 5 DAY),
(2, 1, 300.00, CURDATE() - INTERVAL 4 DAY),
(3, 2, 150.00, CURDATE() - INTERVAL 2 DAY),
(4, 1, 20.00, CURDATE() - INTERVAL 1 DAY);

INSERT INTO finances (project_id, amount, type, category, description, record_date) VALUES 
(1, 1500000.00, 'Income', 'Payment Phase 1', 'Initial deposit for Skyline Tower', CURDATE() - INTERVAL 20 DAY),
(1, 200000.00, 'Expense', 'Materials', 'Concrete and Steel purchase', CURDATE() - INTERVAL 15 DAY),
(1, 50000.00, 'Expense', 'Labor', 'Weekly Labor Payout', CURDATE() - INTERVAL 7 DAY),
(2, 500000.00, 'Income', 'Payment Phase 1', 'Initial deposit for Riverside Condos', CURDATE() - INTERVAL 10 DAY),
(2, 80000.00, 'Expense', 'Materials', 'Bricks purchase', CURDATE() - INTERVAL 5 DAY),
(3, 850000.00, 'Income', 'Final Payment', 'Complete payment for Mall Renovation', CURDATE() - INTERVAL 30 DAY);
