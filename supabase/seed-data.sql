-- ============================================================
-- SEED DATA para CLK BI Dashboard
-- Solo INSERT en main_dashboard (tabla existente, 0 filas)
-- NO toca policies, users, vehicles
-- Pegar en SQL Editor de Supabase → Run
-- ============================================================

-- Datos basados en el Power BI original de Click Seguros
-- Periodo 202602 = Febrero 2026

INSERT INTO main_dashboard (l_business, gerencia_nombre, ejecut_nombre, prima_neta, descuento, f_liquidacion, cia_abreviatura, sub_ramo, grupo, tc_pago, id_cia, id_ejecut, id_s_ramo, id_despacho, documento, deptos_noi)
VALUES
-- ═══════════════════════════════════════
-- CLICK FRANQUICIAS
-- ═══════════════════════════════════════

-- Anzures CDMX
('Click Franquicias', 'Anzures CDMX', 'Martínez López Juan', 348465, 0, '2026-02-15', 'GNP', 'Autos', 'Grupo A', 1, 1, 101, 1, 1, 'POL-001', 'Ventas'),
('Click Franquicias', 'Anzures CDMX', 'Rivera Sánchez María', 348466, 0, '2026-02-18', 'AXA', 'Daños', 'Grupo B', 1, 2, 102, 2, 1, 'POL-002', 'Ventas'),

-- Benito Juárez CDMX
('Click Franquicias', 'Benito Juárez CDMX', 'García Torres Pedro', 365225, 0, '2026-02-10', 'Qualitas', 'Autos', 'Grupo C', 1, 3, 103, 1, 2, 'POL-003', 'Ventas'),
('Click Franquicias', 'Benito Juárez CDMX', 'Hernández Ruiz Ana', 365224, 0, '2026-02-12', 'Chubb', 'Vida', 'Grupo D', 1, 4, 104, 3, 2, 'POL-004', 'Ventas'),

-- Business
('Click Franquicias', 'Business', 'Díaz Morales Carlos', 801478, 0, '2026-02-08', 'Zurich', 'GMM', 'Grupo E', 1, 5, 105, 4, 3, 'POL-005', 'Corporativo'),
('Click Franquicias', 'Business', 'Ortega Vega Laura', 801477, 0, '2026-02-20', 'AIG', 'RC', 'Grupo F', 1, 6, 106, 5, 3, 'POL-006', 'Corporativo'),

-- Cancún QROO
('Click Franquicias', 'Cancún QROO', 'Reyes Flores Diego', 376690, 0, '2026-02-14', 'HDI', 'Autos', 'Grupo G', 1, 7, 107, 1, 4, 'POL-007', 'Ventas'),

-- Chihuahua CHH
('Click Franquicias', 'Chihuahua CHH', 'Mendoza Ríos Eduardo', 492695, 0, '2026-02-11', 'Mapfre', 'Autos', 'Grupo H', 1, 8, 108, 1, 5, 'POL-008', 'Ventas'),
('Click Franquicias', 'Chihuahua CHH', 'Salazar Castro Felipe', 492695, 0, '2026-02-19', 'ANA', 'Daños', 'Grupo I', 1, 9, 109, 2, 5, 'POL-009', 'Ventas'),

-- Cuautitlán Izcalli MEX
('Click Franquicias', 'Cuautitlán Izcalli MEX', 'Torres Guzmán Gloria', 972706, 0, '2026-02-09', 'GNP', 'Autos', 'Grupo J', 1, 1, 110, 1, 6, 'POL-010', 'Ventas'),
('Click Franquicias', 'Cuautitlán Izcalli MEX', 'Vargas Peña Hugo', 972705, 0, '2026-02-16', 'Qualitas', 'Autos', 'Grupo K', 1, 3, 111, 1, 6, 'POL-011', 'Ventas'),

-- Cuernavaca MOR
('Click Franquicias', 'Cuernavaca MOR', 'Luna Paredes Isabel', 560962, 0, '2026-02-13', 'AXA', 'Vida', 'Grupo L', 1, 2, 112, 3, 7, 'POL-012', 'Ventas'),
('Click Franquicias', 'Cuernavaca MOR', 'Ramos Delgado Jorge', 560962, 0, '2026-02-17', 'Chubb', 'GMM', 'Grupo M', 1, 4, 113, 4, 7, 'POL-013', 'Ventas'),

-- Diamond
('Click Franquicias', 'Diamond', 'Herrera Luna Gabriela', 1539967, 0, '2026-02-07', 'Zurich', 'RC', 'Grupo N', 1, 5, 114, 5, 8, 'POL-014', 'Premium'),
('Click Franquicias', 'Diamond', 'Castro Mendez Hugo', 1539967, 0, '2026-02-14', 'AIG', 'GMM', 'Grupo O', 1, 6, 115, 4, 8, 'POL-015', 'Premium'),
('Click Franquicias', 'Diamond', 'Navarro Ibarra Karen', 1539968, 0, '2026-02-21', 'Chubb', 'Vida', 'Grupo P', 17.22, 4, 116, 3, 8, 'POL-016', 'Premium'),

-- Financieras/Plataformas
('Click Franquicias', 'Financieras/Plataformas', 'Aguilar Mora Luis', 1032236, 0, '2026-02-10', 'HDI', 'Autos', 'Grupo Q', 1, 7, 117, 1, 9, 'POL-017', 'Digital'),
('Click Franquicias', 'Financieras/Plataformas', 'Jiménez Soto Martha', 1032236, 0, '2026-02-18', 'Mapfre', 'Autos', 'Grupo R', 1, 8, 118, 1, 9, 'POL-018', 'Digital'),

-- Funcionarios y Colaboradores
('Click Franquicias', 'Funcionarios y Colaboradores', 'Domínguez Vera Norma', 261732, 0, '2026-02-12', 'GNP', 'Vida', 'Interno', 1, 1, 119, 3, 10, 'POL-019', 'RRHH'),
('Click Franquicias', 'Funcionarios y Colaboradores', 'Pacheco Ríos Oscar', 261731, 0, '2026-02-22', 'AXA', 'GMM', 'Interno', 1, 2, 120, 4, 10, 'POL-020', 'RRHH'),

-- Guadalajara JAL
('Click Franquicias', 'Guadalajara JAL', 'González Pérez Ana María', 2092615, 0, '2026-02-08', 'Qualitas', 'Autos', 'Grupo S', 1, 3, 121, 1, 11, 'POL-021', 'Ventas'),
('Click Franquicias', 'Guadalajara JAL', 'Ramírez Torres Carlos', 2092614, 0, '2026-02-15', 'GNP', 'Daños', 'Grupo T', 1, 1, 122, 2, 11, 'POL-022', 'Ventas'),
('Click Franquicias', 'Guadalajara JAL', 'López Vega Diana', 2092615, 0, '2026-02-19', 'Chubb', 'Vida', 'Grupo U', 1, 4, 123, 3, 11, 'POL-023', 'Ventas'),

-- ═══════════════════════════════════════
-- CLICK PROMOTORAS
-- ═══════════════════════════════════════
('Click Promotoras', 'Querétaro QRO', 'Mendoza Ríos Eduardo', 3295346, 0, '2026-02-09', 'AXA', 'Autos', 'Grupo V', 1, 2, 124, 1, 12, 'POL-024', 'Ventas'),
('Click Promotoras', 'Querétaro QRO', 'Salazar Mora Fernando', 3295346, 0, '2026-02-16', 'Zurich', 'GMM', 'Grupo W', 1, 5, 125, 4, 12, 'POL-025', 'Ventas'),
('Click Promotoras', 'Polanco CDMX', 'Herrera Luna Gabriela', 3356673, 0, '2026-02-11', 'AIG', 'RC', 'Grupo X', 1, 6, 126, 5, 13, 'POL-026', 'Ventas'),
('Click Promotoras', 'Polanco CDMX', 'Castro Mendez Hugo', 3356673, 0, '2026-02-20', 'Chubb', 'Vida', 'Grupo Y', 1, 4, 127, 3, 13, 'POL-027', 'Ventas'),
('Click Promotoras', 'Monterrey NLE', 'Navarro Ibarra Karen', 3356672, 0, '2026-02-13', 'GNP', 'Daños', 'Grupo Z', 1, 1, 128, 2, 14, 'POL-028', 'Ventas'),
('Click Promotoras', 'Monterrey NLE', 'Aguilar Mora Luis', 3356673, 0, '2026-02-18', 'HDI', 'Autos', 'Grupo AA', 1, 7, 129, 1, 14, 'POL-029', 'Ventas'),

-- ═══════════════════════════════════════
-- CORPORATE
-- ═══════════════════════════════════════
('Corporate', 'Polanco CDMX', 'Jiménez Soto Martha', 4236235, 0, '2026-02-10', 'Zurich', 'RC', 'Corp A', 1, 5, 130, 5, 15, 'POL-030', 'Corporativo'),
('Corporate', 'Miguel Hidalgo CDMX', 'Domínguez Vera Norma', 4236235, 0, '2026-02-14', 'AIG', 'GMM', 'Corp B', 1, 6, 131, 4, 16, 'POL-031', 'Corporativo'),
('Corporate', 'Miguel Hidalgo CDMX', 'Pacheco Ríos Oscar', 4236235, 0, '2026-02-21', 'Chubb', 'Vida', 'Corp C', 17.22, 4, 132, 3, 16, 'POL-032', 'Corporativo'),

-- ═══════════════════════════════════════
-- CARTERA TRADICIONAL
-- ═══════════════════════════════════════
('Cartera Tradicional', 'Intermediarios ACM', 'Comunidad Sefaradi AC', 0, 0, '2026-02-08', 'GNP', 'Autos', 'Trad A', 1, 1, 133, 1, 17, 'POL-033', 'Ventas'),
('Cartera Tradicional', 'Intermediarios ACM', 'Kuri Benabib Victoria', 0, 0, '2026-02-12', 'AXA', 'Vida', 'Trad B', 1, 2, 134, 3, 17, 'POL-034', 'Ventas'),
('Cartera Tradicional', 'Intermediarios ACM', 'Mitrani Victoria', 315811, 0, '2026-02-15', 'Qualitas', 'Autos', 'Trad C', 1, 3, 135, 1, 17, 'POL-035', 'Ventas'),
('Cartera Tradicional', 'Intermediarios ACM', 'Perez Pineda Luis Gerardo', 98855, 0, '2026-02-19', 'Chubb', 'Daños', 'Trad D', 1, 4, 136, 2, 17, 'POL-036', 'Ventas'),
('Cartera Tradicional', 'Benito Juárez CDMX', 'González Torres Raúl', 3405787, 0, '2026-02-09', 'GNP', 'Autos', 'Trad E', 1, 1, 137, 1, 18, 'POL-037', 'Ventas'),
('Cartera Tradicional', 'Benito Juárez CDMX', 'Sánchez Mora Patricia', 3405787, 0, '2026-02-17', 'Mapfre', 'GMM', 'Trad F', 1, 8, 138, 4, 18, 'POL-038', 'Ventas'),
('Cartera Tradicional', 'Puebla PUE', 'Vega Ruiz Sergio', 3405788, 0, '2026-02-22', 'HDI', 'Autos', 'Trad G', 1, 7, 139, 1, 19, 'POL-039', 'Ventas'),

-- ═══════════════════════════════════════
-- CALL CENTER
-- ═══════════════════════════════════════
('Call Center', 'CDMX Centro', 'Flores García Teresa', 867455, 0, '2026-02-10', 'Qualitas', 'Autos', 'CC A', 1, 3, 140, 1, 20, 'POL-040', 'Call Center'),
('Call Center', 'CDMX Centro', 'Morales López Ulises', 867455, 0, '2026-02-16', 'GNP', 'Autos', 'CC B', 1, 1, 141, 1, 20, 'POL-041', 'Call Center'),
('Call Center', 'CDMX Centro', 'Cruz Martínez Verónica', 867454, 0, '2026-02-20', 'AXA', 'Daños', 'CC C', 1, 2, 142, 2, 20, 'POL-042', 'Call Center');

-- ============================================================
-- DATOS AÑO ANTERIOR (2025) para comparación YoY
-- Periodo implícito por f_liquidacion en 2025
-- ============================================================

INSERT INTO main_dashboard (l_business, gerencia_nombre, ejecut_nombre, prima_neta, descuento, f_liquidacion, cia_abreviatura, sub_ramo, grupo, tc_pago, id_cia, id_ejecut, id_s_ramo, id_despacho, documento, deptos_noi)
VALUES
-- Click Franquicias año anterior
('Click Franquicias', 'Anzures CDMX', 'Martínez López Juan', 39867, 0, '2025-02-15', 'GNP', 'Autos', 'Grupo A', 1, 1, 101, 1, 1, 'POL-A01', 'Ventas'),
('Click Franquicias', 'Anzures CDMX', 'Rivera Sánchez María', 39866, 0, '2025-02-18', 'AXA', 'Daños', 'Grupo B', 1, 2, 102, 2, 1, 'POL-A02', 'Ventas'),
('Click Franquicias', 'Benito Juárez CDMX', 'García Torres Pedro', 355363, 0, '2025-02-10', 'Qualitas', 'Autos', 'Grupo C', 1, 3, 103, 1, 2, 'POL-A03', 'Ventas'),
('Click Franquicias', 'Benito Juárez CDMX', 'Hernández Ruiz Ana', 355362, 0, '2025-02-12', 'Chubb', 'Vida', 'Grupo D', 1, 4, 104, 3, 2, 'POL-A04', 'Ventas'),
('Click Franquicias', 'Business', 'Díaz Morales Carlos', 1653237, 0, '2025-02-08', 'Zurich', 'GMM', 'Grupo E', 1, 5, 105, 4, 3, 'POL-A05', 'Corporativo'),
('Click Franquicias', 'Business', 'Ortega Vega Laura', 1653236, 0, '2025-02-20', 'AIG', 'RC', 'Grupo F', 1, 6, 106, 5, 3, 'POL-A06', 'Corporativo'),
('Click Franquicias', 'Chihuahua CHH', 'Mendoza Ríos Eduardo', 603730, 0, '2025-02-11', 'Mapfre', 'Autos', 'Grupo H', 1, 8, 108, 1, 5, 'POL-A08', 'Ventas'),
('Click Franquicias', 'Chihuahua CHH', 'Salazar Castro Felipe', 603729, 0, '2025-02-19', 'ANA', 'Daños', 'Grupo I', 1, 9, 109, 2, 5, 'POL-A09', 'Ventas'),
('Click Franquicias', 'Cuautitlán Izcalli MEX', 'Torres Guzmán Gloria', 1174482, 0, '2025-02-09', 'GNP', 'Autos', 'Grupo J', 1, 1, 110, 1, 6, 'POL-A10', 'Ventas'),
('Click Franquicias', 'Cuautitlán Izcalli MEX', 'Vargas Peña Hugo', 1174481, 0, '2025-02-16', 'Qualitas', 'Autos', 'Grupo K', 1, 3, 111, 1, 6, 'POL-A11', 'Ventas'),
('Click Franquicias', 'Cuernavaca MOR', 'Luna Paredes Isabel', 335972, 0, '2025-02-13', 'AXA', 'Vida', 'Grupo L', 1, 2, 112, 3, 7, 'POL-A12', 'Ventas'),
('Click Franquicias', 'Cuernavaca MOR', 'Ramos Delgado Jorge', 335971, 0, '2025-02-17', 'Chubb', 'GMM', 'Grupo M', 1, 4, 113, 4, 7, 'POL-A13', 'Ventas'),
('Click Franquicias', 'Diamond', 'Herrera Luna Gabriela', 2549179, 0, '2025-02-07', 'Zurich', 'RC', 'Grupo N', 1, 5, 114, 5, 8, 'POL-A14', 'Premium'),
('Click Franquicias', 'Diamond', 'Castro Mendez Hugo', 2549179, 0, '2025-02-14', 'AIG', 'GMM', 'Grupo O', 1, 6, 115, 4, 8, 'POL-A15', 'Premium'),
('Click Franquicias', 'Diamond', 'Navarro Ibarra Karen', 2549180, 0, '2025-02-21', 'Chubb', 'Vida', 'Grupo P', 1, 4, 116, 3, 8, 'POL-A16', 'Premium'),
('Click Franquicias', 'Financieras/Plataformas', 'Aguilar Mora Luis', 383636, 0, '2025-02-10', 'HDI', 'Autos', 'Grupo Q', 1, 7, 117, 1, 9, 'POL-A17', 'Digital'),
('Click Franquicias', 'Financieras/Plataformas', 'Jiménez Soto Martha', 383636, 0, '2025-02-18', 'Mapfre', 'Autos', 'Grupo R', 1, 8, 118, 1, 9, 'POL-A18', 'Digital'),
('Click Franquicias', 'Funcionarios y Colaboradores', 'Domínguez Vera Norma', 194895, 0, '2025-02-12', 'GNP', 'Vida', 'Interno', 1, 1, 119, 3, 10, 'POL-A19', 'RRHH'),
('Click Franquicias', 'Funcionarios y Colaboradores', 'Pacheco Ríos Oscar', 194894, 0, '2025-02-22', 'AXA', 'GMM', 'Interno', 1, 2, 120, 4, 10, 'POL-A20', 'RRHH'),
('Click Franquicias', 'Guadalajara JAL', 'González Pérez Ana María', 2160997, 0, '2025-02-08', 'Qualitas', 'Autos', 'Grupo S', 1, 3, 121, 1, 11, 'POL-A21', 'Ventas'),
('Click Franquicias', 'Guadalajara JAL', 'Ramírez Torres Carlos', 2160997, 0, '2025-02-15', 'GNP', 'Daños', 'Grupo T', 1, 1, 122, 2, 11, 'POL-A22', 'Ventas'),
('Click Franquicias', 'Guadalajara JAL', 'López Vega Diana', 2160996, 0, '2025-02-19', 'Chubb', 'Vida', 'Grupo U', 1, 4, 123, 3, 11, 'POL-A23', 'Ventas'),

-- Click Promotoras año anterior
('Click Promotoras', 'Querétaro QRO', 'Mendoza Ríos Eduardo', 3237060, 0, '2025-02-09', 'AXA', 'Autos', 'Grupo V', 1, 2, 124, 1, 12, 'POL-A24', 'Ventas'),
('Click Promotoras', 'Querétaro QRO', 'Salazar Mora Fernando', 3237060, 0, '2025-02-16', 'Zurich', 'GMM', 'Grupo W', 1, 5, 125, 4, 12, 'POL-A25', 'Ventas'),
('Click Promotoras', 'Polanco CDMX', 'Herrera Luna Gabriela', 3237060, 0, '2025-02-11', 'AIG', 'RC', 'Grupo X', 1, 6, 126, 5, 13, 'POL-A26', 'Ventas'),
('Click Promotoras', 'Polanco CDMX', 'Castro Mendez Hugo', 3237060, 0, '2025-02-20', 'Chubb', 'Vida', 'Grupo Y', 1, 4, 127, 3, 13, 'POL-A27', 'Ventas'),
('Click Promotoras', 'Monterrey NLE', 'Navarro Ibarra Karen', 3237060, 0, '2025-02-13', 'GNP', 'Daños', 'Grupo Z', 1, 1, 128, 2, 14, 'POL-A28', 'Ventas'),
('Click Promotoras', 'Monterrey NLE', 'Aguilar Mora Luis', 3237059, 0, '2025-02-18', 'HDI', 'Autos', 'Grupo AA', 1, 7, 129, 1, 14, 'POL-A29', 'Ventas'),

-- Corporate año anterior
('Corporate', 'Polanco CDMX', 'Jiménez Soto Martha', 4513208, 0, '2025-02-10', 'Zurich', 'RC', 'Corp A', 1, 5, 130, 5, 15, 'POL-A30', 'Corporativo'),
('Corporate', 'Miguel Hidalgo CDMX', 'Domínguez Vera Norma', 4513209, 0, '2025-02-14', 'AIG', 'GMM', 'Corp B', 1, 6, 131, 4, 16, 'POL-A31', 'Corporativo'),
('Corporate', 'Miguel Hidalgo CDMX', 'Pacheco Ríos Oscar', 4513208, 0, '2025-02-21', 'Chubb', 'Vida', 'Corp C', 1, 4, 132, 3, 16, 'POL-A32', 'Corporativo'),

-- Cartera Tradicional año anterior
('Cartera Tradicional', 'Intermediarios ACM', 'Comunidad Sefaradi AC', 604, 0, '2025-02-08', 'GNP', 'Autos', 'Trad A', 1, 1, 133, 1, 17, 'POL-A33', 'Ventas'),
('Cartera Tradicional', 'Intermediarios ACM', 'Kuri Benabib Victoria', 109779, 0, '2025-02-12', 'AXA', 'Vida', 'Trad B', 1, 2, 134, 3, 17, 'POL-A34', 'Ventas'),
('Cartera Tradicional', 'Intermediarios ACM', 'Perez Pineda Luis Gerardo', 208297, 0, '2025-02-19', 'Chubb', 'Daños', 'Trad D', 1, 4, 136, 2, 17, 'POL-A36', 'Ventas'),
('Cartera Tradicional', 'Benito Juárez CDMX', 'González Torres Raúl', 3243248, 0, '2025-02-09', 'GNP', 'Autos', 'Trad E', 1, 1, 137, 1, 18, 'POL-A37', 'Ventas'),
('Cartera Tradicional', 'Benito Juárez CDMX', 'Sánchez Mora Patricia', 3243249, 0, '2025-02-17', 'Mapfre', 'GMM', 'Trad F', 1, 8, 138, 4, 18, 'POL-A38', 'Ventas'),
('Cartera Tradicional', 'Puebla PUE', 'Vega Ruiz Sergio', 3252248, 0, '2025-02-22', 'HDI', 'Autos', 'Trad G', 1, 7, 139, 1, 19, 'POL-A39', 'Ventas'),

-- Call Center año anterior
('Call Center', 'CDMX Centro', 'Flores García Teresa', 284562, 0, '2025-02-10', 'Qualitas', 'Autos', 'CC A', 1, 3, 140, 1, 20, 'POL-A40', 'Call Center'),
('Call Center', 'CDMX Centro', 'Morales López Ulises', 284562, 0, '2025-02-16', 'GNP', 'Autos', 'CC B', 1, 1, 141, 1, 20, 'POL-A41', 'Call Center'),
('Call Center', 'CDMX Centro', 'Cruz Martínez Verónica', 284561, 0, '2025-02-20', 'AXA', 'Daños', 'CC C', 1, 2, 142, 2, 20, 'POL-A42', 'Call Center');

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Después de ejecutar, verifica con:
-- SELECT l_business, 
--        EXTRACT(YEAR FROM f_liquidacion) as año,
--        COUNT(*) as registros, 
--        SUM(prima_neta) as total_prima
-- FROM main_dashboard 
-- GROUP BY l_business, EXTRACT(YEAR FROM f_liquidacion)
-- ORDER BY año, l_business;
