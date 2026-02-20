-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         8.4.3 - MySQL Community Server - GPL
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Volcando datos para la tabla telecom_db.audit_logs: ~153 rows (aproximadamente)
INSERT IGNORE INTO `audit_logs` (`id`, `user_id`, `action`, `details`, `ip_address`, `created_at`, `updated_at`) VALUES
	(1, 1, 'Descarga', 'Descarga individual: 1000414.mp3', '127.0.0.1', '2026-02-05 00:51:56', '2026-02-05 00:51:56'),
	(2, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-05 00:52:13', '2026-02-05 00:52:13'),
	(3, 8, 'Login', 'Inicio de sesión exitoso: carlosdlemus13@gmail.com', '127.0.0.1', '2026-02-05 00:52:24', '2026-02-05 00:52:24'),
	(4, 8, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-05 00:52:29', '2026-02-05 00:52:29'),
	(5, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-05 00:52:46', '2026-02-05 00:52:46'),
	(6, 1, 'Indexación', 'Indexada ruta: C:/Users/carlo/Music. Nuevos: 557. Saltados: 0.', '127.0.0.1', '2026-02-05 01:21:58', '2026-02-05 01:21:58'),
	(7, 1, 'Descarga ZIP Folder', 'Carpeta descargada: Importación 2026-02-04 20:21 (557 archivos)', '127.0.0.1', '2026-02-05 01:29:04', '2026-02-05 01:29:04'),
	(8, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-05 01:29:09', '2026-02-05 01:29:09'),
	(9, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-05 01:29:36', '2026-02-05 01:29:36'),
	(10, 1, 'Descarga ZIP Folder', 'Carpeta descargada: Importación 2026-02-04 20:21 (557 archivos)', '127.0.0.1', '2026-02-05 01:31:33', '2026-02-05 01:31:33'),
	(11, 1, 'Descarga ZIP Folder', 'Carpeta descargada: Importación 2026-02-04 20:21 (557 archivos)', '127.0.0.1', '2026-02-05 01:34:04', '2026-02-05 01:34:04'),
	(12, 1, 'Descarga', 'Descarga individual: 70.mp3', '127.0.0.1', '2026-02-05 01:38:39', '2026-02-05 01:38:39'),
	(13, 1, 'Descarga ZIP Folder', 'Carpeta descargada: Importación 2026-02-04 20:21 (557 archivos)', '127.0.0.1', '2026-02-05 01:47:52', '2026-02-05 01:47:52'),
	(14, 1, 'Descarga ZIP', 'Descarga masiva de 15 grabaciones.', '127.0.0.1', '2026-02-05 01:48:18', '2026-02-05 01:48:18'),
	(15, 8, 'Login', 'Inicio de sesión exitoso: carlosdlemus13@gmail.com', '127.0.0.1', '2026-02-05 01:58:12', '2026-02-05 01:58:12'),
	(16, 8, 'Descarga ZIP Folder', 'Carpeta descargada: Importación 2026-02-04 20:21 (557 archivos)', '127.0.0.1', '2026-02-05 02:00:04', '2026-02-05 02:00:04'),
	(17, 8, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-05 02:07:20', '2026-02-05 02:07:20'),
	(18, 8, 'Login', 'Inicio de sesión exitoso: carlosdlemus13@gmail.com', '127.0.0.1', '2026-02-05 02:07:54', '2026-02-05 02:07:54'),
	(19, 8, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-05 02:08:09', '2026-02-05 02:08:09'),
	(20, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-05 02:50:58', '2026-02-05 02:50:58'),
	(21, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-05 18:20:20', '2026-02-05 18:20:20'),
	(22, 1, 'Descarga', 'Descarga individual: 100012954Movistar320245867.mp3', '127.0.0.1', '2026-02-05 21:02:07', '2026-02-05 21:02:07'),
	(23, 1, 'Descarga ZIP', 'Descarga masiva de 5 grabaciones.', '127.0.0.1', '2026-02-05 21:02:33', '2026-02-05 21:02:33'),
	(24, 1, 'Descarga', 'Descarga individual: Claro_1000129354_3221022356.mp3', '127.0.0.1', '2026-02-05 21:02:37', '2026-02-05 21:02:37'),
	(25, 1, 'Descarga', 'Descarga individual: 350267891_claro39667213.mp3', '127.0.0.1', '2026-02-05 21:02:40', '2026-02-05 21:02:40'),
	(26, 1, 'Descarga ZIP', 'Descarga masiva de 5 grabaciones.', '127.0.0.1', '2026-02-05 21:02:55', '2026-02-05 21:02:55'),
	(27, 1, 'Descarga', 'Descarga individual: 100012954ETB3202212526.mp3', '127.0.0.1', '2026-02-05 21:03:00', '2026-02-05 21:03:00'),
	(28, 1, 'Descarga', 'Descarga individual: Etb_3501231425.mp3', '127.0.0.1', '2026-02-05 21:03:02', '2026-02-05 21:03:02'),
	(29, 1, 'Descarga', 'Descarga individual: 3508645623_ETB1000125789.mp3', '127.0.0.1', '2026-02-05 21:03:04', '2026-02-05 21:03:04'),
	(30, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-05 21:05:00', '2026-02-05 21:05:00'),
	(31, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-05 21:05:10', '2026-02-05 21:05:10'),
	(32, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-05 21:32:40', '2026-02-05 21:32:40'),
	(33, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-05 21:33:15', '2026-02-05 21:33:15'),
	(34, 1, 'Indexación', 'Indexada ruta: C:/pruebaTelecom4. Nuevos: 540. Saltados: 0.', '127.0.0.1', '2026-02-05 21:45:42', '2026-02-05 21:45:42'),
	(35, 1, 'Descarga ZIP', 'Descarga masiva de 15 grabaciones.', '127.0.0.1', '2026-02-05 21:47:08', '2026-02-05 21:47:08'),
	(36, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-06 19:05:59', '2026-02-06 19:05:59'),
	(37, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-06 19:06:16', '2026-02-06 19:06:16'),
	(38, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-06 19:06:26', '2026-02-06 19:06:26'),
	(39, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-06 19:07:15', '2026-02-06 19:07:15'),
	(40, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-06 19:07:35', '2026-02-06 19:07:35'),
	(41, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-06 19:17:42', '2026-02-06 19:17:42'),
	(42, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-06 20:57:07', '2026-02-06 20:57:07'),
	(43, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-06 20:57:50', '2026-02-06 20:57:50'),
	(44, 1, 'Descarga', 'Descarga individual: 3505612426_etb39668524.mp3', '127.0.0.1', '2026-02-06 21:12:42', '2026-02-06 21:12:42'),
	(45, 1, 'Descarga', 'Descarga individual: Etb_3505612426_1000159753.mp3', '127.0.0.1', '2026-02-06 21:12:44', '2026-02-06 21:12:44'),
	(46, 1, 'Descarga', 'Descarga individual: Etb_3501231425.mp3', '127.0.0.1', '2026-02-06 21:12:46', '2026-02-06 21:12:46'),
	(47, 1, 'Descarga', 'Descarga individual: Claro_1000129354_3221022356.mp3', '127.0.0.1', '2026-02-06 21:13:00', '2026-02-06 21:13:00'),
	(48, 1, 'Descarga', 'Descarga individual: 3502678910_claro39668524.mp3', '127.0.0.1', '2026-02-06 21:13:01', '2026-02-06 21:13:01'),
	(49, 1, 'Descarga', 'Descarga individual: 350267891_claro39667213.mp3', '127.0.0.1', '2026-02-06 21:13:02', '2026-02-06 21:13:02'),
	(50, 1, 'Descarga', 'Descarga individual: 3142675856Claro1000123789.mp3', '127.0.0.1', '2026-02-06 21:13:03', '2026-02-06 21:13:03'),
	(51, 1, 'Descarga', 'Descarga individual: 3112854956Claro1000123789.mp3', '127.0.0.1', '2026-02-06 21:13:04', '2026-02-06 21:13:04'),
	(52, 1, 'Descarga', 'Descarga individual: 100012954Movistar320245867.mp3', '127.0.0.1', '2026-02-06 21:13:13', '2026-02-06 21:13:13'),
	(53, 1, 'Descarga', 'Descarga individual: 1000414.mp3', '127.0.0.1', '2026-02-06 21:24:52', '2026-02-06 21:24:52'),
	(54, 1, 'Indexación', 'Indexada ruta: C:/Users/carlo/Music. Nuevos: 5. Saltados: 557.', '127.0.0.1', '2026-02-06 21:30:20', '2026-02-06 21:30:20'),
	(55, 1, 'Descarga', 'Descarga individual: 3105482315_WOM_1000127834 (1).mp3', '127.0.0.1', '2026-02-06 21:30:39', '2026-02-06 21:30:39'),
	(56, 1, 'Descarga', 'Descarga individual: 3105482315_WOM_1000127834 (3).mp3', '127.0.0.1', '2026-02-06 21:30:40', '2026-02-06 21:30:40'),
	(57, 1, 'Descarga', 'Descarga individual: 1015268265_Tigo_3202231425.mp3', '127.0.0.1', '2026-02-06 21:30:49', '2026-02-06 21:30:49'),
	(58, 1, 'Descarga', 'Descarga individual: 3105482315_Tigo_1000127812.mp3', '127.0.0.1', '2026-02-06 21:30:50', '2026-02-06 21:30:50'),
	(59, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-07 01:55:30', '2026-02-07 01:55:30'),
	(60, 8, 'Login', 'Inicio de sesión exitoso: carlosdlemus13@gmail.com', '127.0.0.1', '2026-02-07 02:00:45', '2026-02-07 02:00:45'),
	(61, 8, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-07 02:00:57', '2026-02-07 02:00:57'),
	(62, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-07 02:01:13', '2026-02-07 02:01:13'),
	(63, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-07 02:16:53', '2026-02-07 02:16:53'),
	(64, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-07 02:17:09', '2026-02-07 02:17:09'),
	(65, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-07 03:01:31', '2026-02-07 03:01:31'),
	(66, 8, 'Login', 'Inicio de sesión exitoso: carlosdlemus13@gmail.com', '127.0.0.1', '2026-02-09 18:05:39', '2026-02-09 18:05:39'),
	(67, 8, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-09 18:05:58', '2026-02-09 18:05:58'),
	(68, 8, 'Login', 'Inicio de sesión exitoso: carlosdlemus13@gmail.com', '127.0.0.1', '2026-02-09 18:08:29', '2026-02-09 18:08:29'),
	(69, 8, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-09 18:08:34', '2026-02-09 18:08:34'),
	(70, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 18:08:53', '2026-02-09 18:08:53'),
	(71, 1, 'Indexación', 'Indexada ruta: C:/Users/carlo/Music/aña. Nuevos: 0. Saltados: 5.', '127.0.0.1', '2026-02-09 18:09:48', '2026-02-09 18:09:48'),
	(72, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-09 18:26:54', '2026-02-09 18:26:54'),
	(73, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 18:39:48', '2026-02-09 18:39:48'),
	(74, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-09 18:39:51', '2026-02-09 18:39:51'),
	(75, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 18:40:19', '2026-02-09 18:40:19'),
	(76, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 18:43:31', '2026-02-09 18:43:31'),
	(77, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 18:48:06', '2026-02-09 18:48:06'),
	(78, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 18:48:57', '2026-02-09 18:48:57'),
	(79, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 18:53:21', '2026-02-09 18:53:21'),
	(80, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 18:53:24', '2026-02-09 18:53:24'),
	(81, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 18:53:38', '2026-02-09 18:53:38'),
	(82, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 18:56:41', '2026-02-09 18:56:41'),
	(83, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 18:56:44', '2026-02-09 18:56:44'),
	(84, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-09 18:56:45', '2026-02-09 18:56:45'),
	(85, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 18:57:01', '2026-02-09 18:57:01'),
	(86, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 18:59:41', '2026-02-09 18:59:41'),
	(87, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-09 18:59:42', '2026-02-09 18:59:42'),
	(88, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 19:00:34', '2026-02-09 19:00:34'),
	(89, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 19:00:37', '2026-02-09 19:00:37'),
	(90, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-09 19:00:38', '2026-02-09 19:00:38'),
	(91, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 19:00:42', '2026-02-09 19:00:42'),
	(92, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 19:18:26', '2026-02-09 19:18:26'),
	(93, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 19:18:30', '2026-02-09 19:18:30'),
	(94, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 19:18:35', '2026-02-09 19:18:35'),
	(95, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 19:18:38', '2026-02-09 19:18:38'),
	(96, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-09 19:18:39', '2026-02-09 19:18:39'),
	(97, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 19:18:44', '2026-02-09 19:18:44'),
	(98, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 19:23:05', '2026-02-09 19:23:05'),
	(99, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 19:23:10', '2026-02-09 19:23:10'),
	(100, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 19:23:15', '2026-02-09 19:23:15'),
	(101, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 19:23:18', '2026-02-09 19:23:18'),
	(102, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-09 19:23:19', '2026-02-09 19:23:19'),
	(103, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 19:23:25', '2026-02-09 19:23:25'),
	(104, 1, 'Descarga ZIP', 'Descarga masiva de 15 grabaciones.', '127.0.0.1', '2026-02-09 20:04:28', '2026-02-09 20:04:28'),
	(105, 1, 'Descarga ZIP', 'Descarga masiva de 5 grabaciones.', '127.0.0.1', '2026-02-09 20:04:56', '2026-02-09 20:04:56'),
	(106, 1, 'Descarga ZIP', 'Descarga masiva de 5 grabaciones.', '127.0.0.1', '2026-02-09 20:09:13', '2026-02-09 20:09:13'),
	(107, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-09 20:29:00', '2026-02-09 20:29:00'),
	(108, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 20:29:13', '2026-02-09 20:29:13'),
	(109, 1, 'Descarga', 'Descarga individual: 3105482315_Tigo_1000127812.mp3. Campaña: Tigo', '127.0.0.1', '2026-02-09 20:47:53', '2026-02-09 20:47:53'),
	(110, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-09 20:54:01', '2026-02-09 20:54:01'),
	(111, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 20:54:36', '2026-02-09 20:54:36'),
	(112, 1, 'Descarga', 'Descarga individual: 100012954Movistar320245867.mp3. Campaña: Movistar', '127.0.0.1', '2026-02-09 20:57:20', '2026-02-09 20:57:20'),
	(113, 1, 'Descarga', 'Descarga individual: 3505612426_etb39668524.mp3. Campaña: ETB', '127.0.0.1', '2026-02-09 21:00:02', '2026-02-09 21:00:02'),
	(114, 1, 'Descarga', 'Descarga individual: 3508645623_ETB1000125789.mp3. Campaña: ETB', '127.0.0.1', '2026-02-09 21:02:56', '2026-02-09 21:02:56'),
	(115, 1, 'Descarga', 'Descarga individual: 3105482315_WOM_1000127834 (1).mp3. Campaña: WOM', '127.0.0.1', '2026-02-09 21:09:21', '2026-02-09 21:09:21'),
	(116, 1, 'Descarga', 'Descarga individual: 3142675856Claro1000123789.mp3. Campaña: Claro', '127.0.0.1', '2026-02-09 21:10:12', '2026-02-09 21:10:12'),
	(117, 1, 'Descarga', 'Descarga individual: Claro_1000129354_3221022356.mp3. Campaña: Claro', '127.0.0.1', '2026-02-09 21:10:55', '2026-02-09 21:10:55'),
	(118, 1, 'Descarga', 'Descarga individual: 3502678910_claro39668524.mp3. Campaña: Claro', '127.0.0.1', '2026-02-09 21:10:58', '2026-02-09 21:10:58'),
	(119, 1, 'Descarga', 'Descarga individual: 350267891_claro39667213.mp3. Campaña: Claro', '127.0.0.1', '2026-02-09 21:10:59', '2026-02-09 21:10:59'),
	(120, 1, 'Descarga', 'Descarga individual: 100012954ETB3202212526.mp3. Campaña: ETB', '127.0.0.1', '2026-02-09 21:11:32', '2026-02-09 21:11:32'),
	(121, 1, 'Descarga', 'Descarga individual: 3508645623_ETB1000125789.mp3. Campaña: ETB', '127.0.0.1', '2026-02-09 21:12:01', '2026-02-09 21:12:01'),
	(122, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-09 21:26:04', '2026-02-09 21:26:04'),
	(123, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 21:26:20', '2026-02-09 21:26:20'),
	(124, 1, 'Descarga', 'Descarga individual: 3105482317_WOM_1000127835.mp3. Campaña: WOM', '127.0.0.1', '2026-02-09 21:28:25', '2026-02-09 21:28:25'),
	(125, 1, 'Descarga', 'Descarga individual: 3105482317_WOM_1000127835.mp3. Campaña: WOM', '127.0.0.1', '2026-02-09 21:28:42', '2026-02-09 21:28:42'),
	(126, 1, 'Descarga', 'Descarga individual: 3112854956Claro1000123789.mp3. Campaña: Claro', '127.0.0.1', '2026-02-09 21:29:59', '2026-02-09 21:29:59'),
	(127, 1, 'Descarga', 'Descarga individual: 3112854956Claro1000123789.mp3. Campaña: Claro', '127.0.0.1', '2026-02-09 21:30:01', '2026-02-09 21:30:01'),
	(128, 1, 'Descarga', 'Descarga individual: 3112854956Claro1000123789.mp3. Campaña: Claro', '127.0.0.1', '2026-02-09 21:30:44', '2026-02-09 21:30:44'),
	(129, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 21:32:59', '2026-02-09 21:32:59'),
	(130, 1, 'Descarga', 'Descarga individual: 3112854956Claro1000123789.mp3. Campaña: Claro', '127.0.0.1', '2026-02-09 21:33:14', '2026-02-09 21:33:14'),
	(131, 1, 'Descarga', 'Descarga individual: Claro_1000129354_3221022356.mp3. Campaña: Claro', '127.0.0.1', '2026-02-09 21:33:17', '2026-02-09 21:33:17'),
	(132, 1, 'Descarga', 'Descarga individual: 3142675856Claro1000123789.mp3. Campaña: Claro', '127.0.0.1', '2026-02-09 21:33:18', '2026-02-09 21:33:18'),
	(133, 1, 'Descarga', 'Descarga individual: 100012954Movistar320245867.mp3. Campaña: Movistar', '127.0.0.1', '2026-02-09 21:33:29', '2026-02-09 21:33:29'),
	(134, 1, 'Descarga', 'Descarga individual: 100012954Movistar320245867.mp3. Campaña: Movistar', '127.0.0.1', '2026-02-09 21:33:31', '2026-02-09 21:33:31'),
	(135, 1, 'Descarga', 'Descarga individual: 100012954Movistar320245867.mp3. Campaña: Movistar', '127.0.0.1', '2026-02-09 21:33:54', '2026-02-09 21:33:54'),
	(136, 1, 'Descarga', 'Descarga individual: 3105482315_WOM_1000127834 (1).mp3. Campaña: WOM', '127.0.0.1', '2026-02-09 21:47:42', '2026-02-09 21:47:42'),
	(137, 1, 'Descarga', 'Descarga individual: 3105482315_WOM_1000127834 (1).mp3. Campaña: WOM', '127.0.0.1', '2026-02-09 21:47:44', '2026-02-09 21:47:44'),
	(138, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-09 22:11:09', '2026-02-09 22:11:09'),
	(139, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 22:11:23', '2026-02-09 22:11:23'),
	(140, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-09 22:40:52', '2026-02-09 22:40:52'),
	(141, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 22:41:00', '2026-02-09 22:41:00'),
	(142, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-09 22:50:46', '2026-02-09 22:50:46'),
	(143, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-09 22:51:19', '2026-02-09 22:51:19'),
	(144, 1, 'Descarga', 'Descarga individual: 3142675856Claro1000123789.mp3. Campaña: Claro', '127.0.0.1', '2026-02-09 22:51:31', '2026-02-09 22:51:31'),
	(145, 1, 'Descarga', 'Descarga individual: Claro_1000129354_3221022356.mp3. Campaña: Claro', '127.0.0.1', '2026-02-09 22:51:34', '2026-02-09 22:51:34'),
	(146, 1, 'Descarga', 'Descarga individual: 3142675856Claro1000123789.mp3. Campaña: Claro', '127.0.0.1', '2026-02-09 22:51:37', '2026-02-09 22:51:37'),
	(147, 1, 'Descarga', 'Descarga individual: 3142675856Claro1000123789.mp3. Campaña: Claro', '127.0.0.1', '2026-02-09 22:51:58', '2026-02-09 22:51:58'),
	(148, 1, 'Descarga', 'Descarga individual: 3142675856Claro1000123789.mp3. Campaña: Claro', '127.0.0.1', '2026-02-09 22:51:59', '2026-02-09 22:51:59'),
	(149, 1, 'Descarga ZIP', 'Descarga masiva de 15 grabaciones. Campañas: [Varias]', '127.0.0.1', '2026-02-10 00:05:10', '2026-02-10 00:05:10'),
	(150, 1, 'Descarga ZIP', 'Descarga masiva de 2 grabaciones. Campañas: [Tigo]', '127.0.0.1', '2026-02-10 00:05:47', '2026-02-10 00:05:47'),
	(151, 1, 'Descarga ZIP', 'Descarga masiva de 3 grabaciones. Campañas: {WOM:3}', '127.0.0.1', '2026-02-10 00:19:40', '2026-02-10 00:19:40'),
	(152, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-10 00:29:10', '2026-02-10 00:29:10'),
	(153, 8, 'Login', 'Inicio de sesión exitoso: carlosdlemus13@gmail.com', '127.0.0.1', '2026-02-10 00:30:59', '2026-02-10 00:30:59'),
	(154, 8, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-10 00:31:08', '2026-02-10 00:31:08'),
	(155, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-10 00:31:51', '2026-02-10 00:31:51'),
	(156, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-10 00:33:34', '2026-02-10 00:33:34'),
	(157, 9, 'Login', 'Inicio de sesión exitoso: carlosdlemus13@gmail.com', '127.0.0.1', '2026-02-10 00:34:31', '2026-02-10 00:34:31'),
	(158, 9, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-10 00:34:48', '2026-02-10 00:34:48'),
	(159, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-10 00:35:05', '2026-02-10 00:35:05'),
	(160, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-10 21:43:58', '2026-02-10 21:43:58'),
	(161, 1, 'Indexación', 'Indexada ruta: C:/Users/carlo/Music/aña. Nuevos: 0. Saltados: 5.', '127.0.0.1', '2026-02-10 21:45:31', '2026-02-10 21:45:31'),
	(162, 1, 'Logout', 'Cierre de sesión', '127.0.0.1', '2026-02-11 21:16:59', '2026-02-11 21:16:59'),
	(163, 1, 'Login', 'Inicio de sesión exitoso: carlosaad75@gmail.com', '127.0.0.1', '2026-02-11 21:41:08', '2026-02-11 21:41:08');

-- Volcando datos para la tabla telecom_db.cache: ~1 rows (aproximadamente)

-- Volcando datos para la tabla telecom_db.cache_locks: ~0 rows (aproximadamente)

-- Volcando datos para la tabla telecom_db.failed_jobs: ~0 rows (aproximadamente)

-- Volcando datos para la tabla telecom_db.jobs: ~0 rows (aproximadamente)

-- Volcando datos para la tabla telecom_db.job_batches: ~0 rows (aproximadamente)

-- Volcando datos para la tabla telecom_db.migrations: ~13 rows (aproximadamente)
INSERT IGNORE INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(1, '0001_01_01_000000_create_users_table', 1),
	(2, '0001_01_01_000001_create_cache_table', 1),
	(3, '0001_01_01_000002_create_jobs_table', 1),
	(4, '2026_01_26_135448_create_personal_access_tokens_table', 1),
	(5, '2026_01_26_153246_add_fields_to_users_table', 1),
	(6, '2026_01_26_164106_create_roles_table', 1),
	(7, '2026_01_28_130952_add_permissions_to_roles_table', 1),
	(8, '2026_01_28_135225_add_role_id_to_users_table', 1),
	(9, '2026_01_29_133718_create_storage_locations_table', 1),
	(10, '2026_01_29_141646_create_settings_table', 1),
	(11, '2026_01_29_193244_create_recordings_table', 1),
	(12, '2026_01_30_135505_remove_role_column_from_users_table', 2),
	(13, '2026_01_30_192230_add_details_to_recordings_table', 3),
	(14, '2026_02_04_193237_create_audit_logs_table', 4);

-- Volcando datos para la tabla telecom_db.password_reset_tokens: ~3 rows (aproximadamente)
INSERT IGNORE INTO `password_reset_tokens` (`email`, `token`, `created_at`) VALUES
	('carlosaad75@gmail.com', '$2y$12$bZzcWXm3CcsBSqr/wW64EOryzl4RNF94kheRj0EhyMAHZGDB0a4Zm', '2026-02-02 21:11:14'),
	('carlosdlemus12@gmail.com', '$2y$12$3VfyMZ4PFlSWrBM7tmnFRex7teD82JbA8f/tBNRFa1ZyJ/qiw/R4i', '2026-02-02 20:16:29'),
	('duartelcarlosa@gmail.com', '$2y$12$00AcG1PhIiKIC4R4OonmH.PP.rf96Ffj2TzDJYF4dcIR6gUDI.rBa', '2026-02-10 00:32:25');

-- Volcando datos para la tabla telecom_db.personal_access_tokens: ~29 rows (aproximadamente)
INSERT IGNORE INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
	(3, 'App\\Models\\User', 1, 'auth_token', '6fff4c220839bb27ef1cb8e66f9445a4202259884c19415135d1d622749d8f59', '["*"]', NULL, NULL, '2026-01-30 01:30:00', '2026-01-30 01:30:00'),
	(4, 'App\\Models\\User', 1, 'auth_token', '7b16f0a623370ab84f8ec37698f0b1adad31606d9a4a47187aa2e0c422bf092b', '["*"]', '2026-01-30 02:45:34', NULL, '2026-01-30 01:51:21', '2026-01-30 02:45:34'),
	(10, 'App\\Models\\User', 1, 'auth_token', '5d6f896d70a61ac78369be33a23af2e4dc6f72fb399aca502ab684e6bbcfe170', '["*"]', '2026-01-30 19:32:05', NULL, '2026-01-30 19:24:44', '2026-01-30 19:32:05'),
	(11, 'App\\Models\\User', 1, 'auth_token', '8eabeef4189ec91f21841487a4933f78146e913b7e71443f885c41e3f5764bf1', '["*"]', '2026-01-30 19:33:21', NULL, '2026-01-30 19:33:18', '2026-01-30 19:33:21'),
	(30, 'App\\Models\\User', 1, 'auth_token', 'd7e67907929200d81a6b81702946df5ba6faeedc0b6ff5aa434c13f3d3c65e9f', '["*"]', '2026-02-02 21:03:03', NULL, '2026-02-02 20:52:52', '2026-02-02 21:03:03'),
	(36, 'App\\Models\\User', 1, 'auth_token', 'e470f8d9a49c5c317a5f7a79f387357c5eb64cb04f6346ad88e90a18d25f81a0', '["*"]', '2026-02-04 18:11:57', NULL, '2026-02-04 18:07:58', '2026-02-04 18:11:57'),
	(48, 'App\\Models\\User', 1, 'auth_token', 'b6da5a3dce829e25ac4fec0b99d1b4c9e46a3531f497004d3736d61d5b46b1c8', '["*"]', '2026-02-06 18:42:14', NULL, '2026-02-05 21:33:15', '2026-02-06 18:42:14'),
	(51, 'App\\Models\\User', 1, 'auth_token', 'e550dd1e03fabdda52e4517c4a931fb01235bc07570d9ce2e4efe7064fb3cb4b', '["*"]', '2026-02-06 21:22:12', NULL, '2026-02-06 19:07:35', '2026-02-06 21:22:12'),
	(61, 'App\\Models\\User', 1, 'auth_token', '2e83f46d2f1df7cbb16484b51d48f0546033b83e14c47ec53360eecd4c01e037', '["*"]', '2026-02-09 18:40:19', NULL, '2026-02-09 18:40:19', '2026-02-09 18:40:19'),
	(62, 'App\\Models\\User', 1, 'auth_token', '712bde5c82c2a1aac7df58f96ec4d53c7f30ef9a41613dd980fab896f0c30059', '["*"]', NULL, NULL, '2026-02-09 18:43:31', '2026-02-09 18:43:31'),
	(64, 'App\\Models\\User', 1, 'auth_token', 'f9e815becdd10b38e3495cd94facc4a209c68e98133db327b122d16ded2001e6', '["*"]', NULL, NULL, '2026-02-09 18:48:57', '2026-02-09 18:48:57'),
	(65, 'App\\Models\\User', 1, 'auth_token', 'e5548215f8d5e3eeb9b09998d251e4e719bd8eb2cd19f8e1a643ca00ce77fe96', '["*"]', NULL, NULL, '2026-02-09 18:53:21', '2026-02-09 18:53:21'),
	(66, 'App\\Models\\User', 1, 'auth_token', '9f2ebc2ad28cca7927dd58a323cf12782a96de0c1538f93ceffd2d54845c1d7c', '["*"]', '2026-02-09 18:53:25', NULL, '2026-02-09 18:53:24', '2026-02-09 18:53:25'),
	(67, 'App\\Models\\User', 1, 'auth_token', 'b2be59dc6b180012fbf3f9c7c6ddf156943c604c45c61f4aa11bb9b1e25b00af', '["*"]', '2026-02-09 18:53:40', NULL, '2026-02-09 18:53:38', '2026-02-09 18:53:40'),
	(68, 'App\\Models\\User', 1, 'auth_token', 'c11c7feba23feaa3edb9b2cefa051f7a779639423fa2bd1e0a5f3655333dbb4a', '["*"]', NULL, NULL, '2026-02-09 18:56:41', '2026-02-09 18:56:41'),
	(70, 'App\\Models\\User', 1, 'auth_token', 'f8105cf9e9830cab627f5510227203da3f4c0431ae9e133886b6406052a22dad', '["*"]', '2026-02-09 18:57:04', NULL, '2026-02-09 18:57:01', '2026-02-09 18:57:04'),
	(72, 'App\\Models\\User', 1, 'auth_token', '298ca615dc1f787e1f4159767d66f1084ef57ca62000cbbf450130d30d12e07a', '["*"]', NULL, NULL, '2026-02-09 19:00:34', '2026-02-09 19:00:34'),
	(74, 'App\\Models\\User', 1, 'auth_token', '5b8eaa64279c329977e07f8e7e594a1d6fb9aa025ce531562766e3a3dfdad899', '["*"]', '2026-02-09 19:00:45', NULL, '2026-02-09 19:00:42', '2026-02-09 19:00:45'),
	(75, 'App\\Models\\User', 1, 'auth_token', 'e64bb21cfe6d903fe7ef6fd4e084daf692845f1e5cf60f408de61d840ed7f789', '["*"]', '2026-02-09 19:18:27', NULL, '2026-02-09 19:18:26', '2026-02-09 19:18:27'),
	(76, 'App\\Models\\User', 1, 'auth_token', 'f4139eebfe8d3cc6671ea96e1116da8e1ed33c03cc434d59f8cffbb7cb6f5ca9', '["*"]', '2026-02-09 19:18:31', NULL, '2026-02-09 19:18:30', '2026-02-09 19:18:31'),
	(77, 'App\\Models\\User', 1, 'auth_token', '746f6ea5d9f8668c7e1a2aae2027b730041b5d5ed3b4a8dffc7e115efb381ca8', '["*"]', NULL, NULL, '2026-02-09 19:18:35', '2026-02-09 19:18:35'),
	(79, 'App\\Models\\User', 1, 'auth_token', '296b02acef1ae237a87fabfaa9609d2733167d2a974fe25626a425c68da742cb', '["*"]', '2026-02-09 19:18:46', NULL, '2026-02-09 19:18:44', '2026-02-09 19:18:46'),
	(80, 'App\\Models\\User', 1, 'auth_token', 'c24afdec661924aa16f4711df5718fe46749cf8f3029f8de56ad762ba8abfb0c', '["*"]', '2026-02-09 19:23:06', NULL, '2026-02-09 19:23:05', '2026-02-09 19:23:06'),
	(81, 'App\\Models\\User', 1, 'auth_token', '0fb91c4def407757337e264b07899f658e133efd109e5dfa6435699d6573a466', '["*"]', '2026-02-09 19:23:12', NULL, '2026-02-09 19:23:10', '2026-02-09 19:23:12'),
	(82, 'App\\Models\\User', 1, 'auth_token', 'ece25496003f9f60fa869b7ecf4a8ef0c24ff98438d22ab89129de40dc18ea00', '["*"]', NULL, NULL, '2026-02-09 19:23:15', '2026-02-09 19:23:15'),
	(84, 'App\\Models\\User', 1, 'auth_token', '0d36859a0f21e64e5ee963030b588fa5cb72ffe81c7d20e97effbd20e6564299', '["*"]', '2026-02-09 19:23:27', NULL, '2026-02-09 19:23:25', '2026-02-09 19:23:27'),
	(88, 'App\\Models\\User', 1, 'auth_token', '187c1346e83aece7b7131c726ca2c9b5c597d8cade6302d8282fa23e480f5ec2', '["*"]', '2026-02-09 21:33:58', NULL, '2026-02-09 21:32:59', '2026-02-09 21:33:58'),
	(95, 'App\\Models\\User', 1, 'auth_token', '76b2b80e608ab1a5e1f4bd94f78727cf1d0acdc9430f46b80cd5683712f2f100', '["*"]', '2026-02-10 00:35:45', NULL, '2026-02-10 00:35:05', '2026-02-10 00:35:45'),
	(97, 'App\\Models\\User', 1, 'auth_token', '233717beee6c12aaed0f6769c9f8c68d7b99d0526bad3fcbe5daf30a41b9d6b5', '["*"]', '2026-02-11 22:44:10', NULL, '2026-02-11 21:41:09', '2026-02-11 22:44:10');

-- Volcando datos para la tabla telecom_db.roles: ~4 rows (aproximadamente)
INSERT IGNORE INTO `roles` (`id`, `name`, `display_name`, `description`, `permissions`, `created_at`, `updated_at`) VALUES
	(1, 'admin', 'Administrador', 'Control total del sistema', '["*", "Dashboard", "Búsqueda de Grabaciones", "Gestor de Carpetas", "Indexación", "Auditorías", "Reportes", "Gestión de Usuarios"]', '2026-01-30 01:28:41', '2026-01-30 18:51:59'),
	(3, 'junior', 'Junior', 'Acceso a todos los módulos a excepción de Auditorias', '["Dashboard", "Búsqueda de Grabaciones", "Gestor de Carpetas", "Indexación", "Reportes"]', '2026-01-30 01:52:04', '2026-01-30 19:27:49'),
	(4, 'senior', 'Senior', 'Acceso a todos los módulos a excepción de Auditorias', '["Dashboard", "Búsqueda de Grabaciones", "Gestor de Carpetas", "Indexación", "Reportes"]', '2026-01-30 02:11:47', '2026-01-30 19:29:35'),
	(5, 'analista', 'Analista', 'Solo acceso a los módulos de Gestor de carpetas, Búsqueda de grabaciones e indexación', '["Dashboard", "Búsqueda de Grabaciones", "Gestor de Carpetas", "Indexación"]', '2026-01-30 02:11:47', '2026-01-30 19:29:25'),
	(7, 'practicante_sena', 'Practicante SENA', 'Acesso Limitado', '["Búsqueda de Grabaciones", "Gestor de Carpetas"]', '2026-01-30 19:31:16', '2026-01-30 19:31:16');

-- Volcando datos para la tabla telecom_db.sessions: ~5 rows (aproximadamente)
INSERT IGNORE INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
	('1RFS6zdOBxvmsXQoxFDAXDYnEC0D88kUwlEVT0YS', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 OPR/126.0.0.0', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoieUh2RzBxOVRId3JhalFKaktvUThjcEVtREdTZnpJRzA1blc3Nm5QTiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9kYXNoYm9hcmQiO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=', 1770758507),
	('4BJU95utLuaYTcKv7QrWYGxoN9A0jIWehcCYmfcQ', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 OPR/127.0.0.0', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiRndLdjFxN1NxOUdDejFOeldrRW1BeXhFODYzSUNhR0NrSFRGUkl5UCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9kYXNoYm9hcmQiO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=', 1770836902),
	('jKnYEwnpbX1e28wgG6suWTHtXCfDmAyyQZa1PZTN', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 OPR/126.0.0.0', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiODRaRW8xNEkxZEtFbW5SZzFRRGsxckJwR2pMZjhWeXpCTUhKM2NWQiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjc6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9sb2dpbiI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1770665688),
	('Kg4SiV2jOJLWJnInMSqAIQdxiFFzjxUWMTerWexA', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 OPR/126.0.0.0', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiUkVHRm5tZ0Nya1NEaEtKcmdROFVuYTVhbUhTZEd1eDN3UmxxNmdiQiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1770741768),
	('XwcaDLuauAFZmYJjEVPV6yLBKdCgvc00MT9CD0wx', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 OPR/126.0.0.0', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiSUFUdXA4OWIxMUxUaXh5eHZtb1Fsb3JwaHVSem5JRzlMRE8xbHhsWiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9kYXNoYm9hcmQiO3M6NToicm91dGUiO047fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=', 1770751044);

-- Volcando datos para la tabla telecom_db.settings: ~6 rows (aproximadamente)
INSERT IGNORE INTO `settings` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES
	(1, 'download_format', 'original', '2026-01-30 19:41:26', '2026-02-09 18:12:57'),
	(2, 'hide_broken_links', '1', '2026-01-30 19:41:26', '2026-02-04 22:14:46'),
	(3, 'scan_frequency', '30', '2026-01-30 19:41:26', '2026-02-09 18:13:09'),
	(4, 'admin_email', NULL, '2026-01-30 19:41:26', '2026-01-30 19:41:26'),
	(5, 'alert_disk_full', '1', '2026-01-30 19:41:26', '2026-01-30 19:41:26'),
	(6, 'alert_service_down', '1', '2026-01-30 19:41:26', '2026-01-30 19:41:26');

-- Volcando datos para la tabla telecom_db.storage_locations: ~0 rows (aproximadamente)
INSERT IGNORE INTO `storage_locations` (`id`, `name`, `path`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
	(23, 'Importación 2026-02-04 20:21', 'C:/Users/carlo/Music/', NULL, 1, '2026-02-05 01:21:55', '2026-02-05 01:21:55'),
	(25, 'Importación 2026-02-09 13:09', 'C:/Users/carlo/Music/aña/', NULL, 1, '2026-02-09 18:09:48', '2026-02-09 18:09:48');

-- Volcando datos para la tabla telecom_db.users: ~3 rows (aproximadamente)
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `cedula`, `is_active`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`, `role_id`) VALUES
	(1, 'Carlos Admin', 'carlosaad75@gmail.com', '1000145233', 1, '2026-01-30 01:20:21', '$2y$12$zuofukQQuliOWAZY1zvRHu0Gh.MUVU0i3qDjjJ1iRorQKPUWeVcea', 'xTbC0IMxy9mP5JvkrOzOQ3tsHTVSIJ0H98Hx00DPb2LuUwvXpNMGBwtZRpLp', '2026-01-30 01:18:10', '2026-01-30 19:46:31', 1),
	(8, 'Carlos Duarte', 'duartelcarlosa@gmail.com', '1000127834', 1, NULL, '$2y$12$DQkJ7rzbE0JgmDE6Qd.3l.QguArNr46rm1DIbGMfCtXflSMAQpkMG', 'EVizKMAAtt8xxBKJWqHjWNEU9m412VWSpkUQU13WaXsXsNjdFjZ1gc2NXzcP', '2026-02-04 18:11:37', '2026-02-10 00:32:24', 7),
	(9, 'Juan Rodriguez', 'carlosdlemus13@gmail.com', '1000127839', 1, '2026-02-10 00:34:17', '$2y$12$.Qwq197LyQElyKI5FhYq5uhPRqAwXDjW5dWElSwclr./A55KpQ3pi', 'tihEH90QvVzOuW7Ip9SrLNAoG9mYoAyqWrtDSHuPq0i4WHZSpsmqtuZlpGt2', '2026-02-10 00:33:23', '2026-02-10 00:34:17', 3);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
