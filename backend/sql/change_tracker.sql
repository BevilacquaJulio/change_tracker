-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 19/06/2026 às 05:25
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `change_tracker`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `attachments`
--

CREATE TABLE `attachments` (
  `id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_path` varchar(512) NOT NULL,
  `mime_type` varchar(64) NOT NULL,
  `file_size` int(11) NOT NULL,
  `sort_order` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `projects`
--

CREATE TABLE `projects` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `projects`
--

INSERT INTO `projects` (`id`, `name`, `created_at`) VALUES
(1, 'Portal Corporativo', '2026-06-19 00:18:27'),
(2, 'App Mobile SaaS', '2026-06-19 00:18:27');

-- --------------------------------------------------------

--
-- Estrutura para tabela `tickets`
--

CREATE TABLE `tickets` (
  `id` int(11) NOT NULL,
  `code` varchar(64) NOT NULL,
  `user_id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `type` varchar(32) NOT NULL,
  `affected_url` text DEFAULT NULL,
  `found_description` text DEFAULT NULL,
  `expected_action` text DEFAULT NULL,
  `urgency` varchar(16) NOT NULL,
  `status` varchar(32) NOT NULL,
  `effort` varchar(32) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `responsible_name` varchar(120) DEFAULT NULL,
  `discovered_at` date DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `tickets`
--

INSERT INTO `tickets` (`id`, `code`, `user_id`, `project_id`, `title`, `type`, `affected_url`, `found_description`, `expected_action`, `urgency`, `status`, `effort`, `notes`, `responsible_name`, `discovered_at`, `completed_at`, `archived_at`, `created_at`, `updated_at`) VALUES
(2, 'CT-20250601-001', 2, 1, 'Link quebrado no menu principal', 'Correção', 'https://exemplo.com/sobre', 'O item \"Sobre nós\" retorna erro 404 em produção.', 'Corrigir rota ou atualizar slug da página no CMS.', 'Alta', 'Em desenvolvimento', 'Rápido (<1h)', NULL, 'Maria Silva', '2026-05-28', NULL, NULL, '2026-06-19 00:18:31', '2026-06-19 00:18:31'),
(3, 'CT-20250602-002', 4, 1, 'Imagens da galeria sem lazy loading', 'Melhoria', 'https://exemplo.com/galeria', 'Página carrega todas as imagens de uma vez, impactando LCP.', 'Implementar lazy loading e formatos WebP nos thumbnails.', 'Média', 'Backlog', 'Médio (1–4h)', NULL, 'Ana Costa', '2026-06-02', NULL, NULL, '2026-06-19 00:18:31', '2026-06-19 00:18:31'),
(4, 'CT-20250603-003', 2, 1, 'Formulário de contato sem validação de e-mail', 'Correção', 'https://exemplo.com/contato', 'Usuários conseguem enviar e-mails inválidos; mensagens se perdem.', 'Adicionar validação front e back + mensagem de confirmação.', 'Crítica', 'Aguardando validação', 'Médio (1–4h)', NULL, 'Maria Silva', '2026-06-05', NULL, NULL, '2026-06-19 00:18:31', '2026-06-19 00:18:31'),
(5, 'CT-20250604-004', 1, 1, 'Meta tags Open Graph ausentes', 'Melhoria', 'https://exemplo.com/', 'Compartilhamentos no WhatsApp não exibem preview com imagem.', 'Inserir og:title, og:description e og:image nas páginas principais.', 'Baixa', 'Concluído', 'Rápido (<1h)', NULL, 'Administrador', '2026-05-20', '2026-05-25 14:30:00', NULL, '2026-06-19 00:18:31', '2026-06-19 00:18:31'),
(6, 'CT-20250605-005', 4, 1, 'Contraste insuficiente no rodapé', 'Correção', 'https://exemplo.com/', 'Texto cinza sobre fundo escuro não atinge WCAG AA (ratio 3.2:1).', 'Ajustar cor do texto para #CBD5E1 ou clarear o fundo do rodapé.', 'Média', 'Em análise', 'Rápido (<1h)', NULL, 'Ana Costa', '2026-06-10', NULL, NULL, '2026-06-19 00:18:31', '2026-06-19 00:18:31'),
(7, 'CT-20250606-006', 2, 1, 'Banner da home desalinhado no mobile', 'Correção', 'https://exemplo.com/', 'Em viewports < 375px o botão CTA fica cortado na lateral direita.', 'Revisar breakpoints e padding do hero section.', 'Alta', 'Backlog', 'Médio (1–4h)', NULL, 'Maria Silva', '2026-06-12', NULL, NULL, '2026-06-19 00:18:31', '2026-06-19 00:18:31'),
(8, 'CT-20250607-007', 3, 2, 'Push notification não dispara no Android 14', 'Correção', 'app://notificacoes', 'Usuários com Android 14 não recebem alertas de fatura vencida e atualizações do plano.', 'Verificar canal de notificação e permissões POST_NOTIFICATIONS.', 'Crítica', 'Em desenvolvimento', 'Alto (4–8h)', NULL, 'Carlos Mendes', '2026-06-01', NULL, NULL, '2026-06-19 00:18:31', '2026-06-19 00:22:07'),
(9, 'CT-20250608-008', 3, 2, 'Tela de login sem opção \"lembrar-me\"', 'Melhoria', 'app://login', 'Usuários precisam autenticar a cada abertura do app.', 'Persistir token seguro com opção de biometria.', 'Média', 'Backlog', 'Alto (4–8h)', NULL, 'Carlos Mendes', '2026-06-03', NULL, NULL, '2026-06-19 00:18:31', '2026-06-19 00:18:31'),
(10, 'CT-20250609-009', 4, 2, 'Calendário de eventos exibe datas erradas', 'Correção', 'app://calendario', 'Webinars e reuniões de junho aparecem deslocados um dia (fuso horário UTC).', 'Normalizar datas para America/Sao_Paulo no backend e no app.', 'Alta', 'Em análise', 'Médio (1–4h)', NULL, 'Ana Costa', '2026-06-06', NULL, NULL, '2026-06-19 00:18:31', '2026-06-19 00:22:08'),
(11, 'CT-20250610-010', 3, 2, 'Crash ao abrir PDF de relatório mensal', 'Correção', 'app://relatorios/42', 'App fecha ao tentar visualizar PDFs de analytics maiores que 5 MB.', 'Implementar visualizador nativo com paginação ou abrir via WebView.', 'Crítica', 'Aguardando validação', 'Complexo (>8h)', NULL, 'Carlos Mendes', '2026-06-08', NULL, NULL, '2026-06-19 00:18:31', '2026-06-19 00:22:09'),
(12, 'CT-20250611-011', 1, 2, 'Ícones do tab bar inconsistentes com design system', 'Melhoria', 'app://home', 'Tab bar usa ícones de biblioteca diferente do protótipo Figma.', 'Substituir por Lucide conforme guia de UI v2.', 'Baixa', 'Concluído', 'Médio (1–4h)', NULL, 'Administrador', '2026-05-15', '2026-05-22 10:00:00', NULL, '2026-06-19 00:18:31', '2026-06-19 00:18:31'),
(13, 'CT-20250612-012', 3, 2, 'Versão antiga do onboarding ainda visível', 'Implementação', 'app://onboarding', 'Fluxo de boas-vindas não reflete a identidade visual 2026.', 'Redesenhar 3 telas de onboarding com ilustrações atualizadas.', 'Média', 'Backlog', 'Alto (4–8h)', NULL, 'Carlos Mendes', '2026-06-14', NULL, NULL, '2026-06-19 00:18:31', '2026-06-19 00:18:31');

-- --------------------------------------------------------

--
-- Estrutura para tabela `ticket_history`
--

CREATE TABLE `ticket_history` (
  `id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `action` varchar(40) NOT NULL,
  `description` text DEFAULT NULL,
  `performed_by` varchar(180) DEFAULT NULL,
  `from_status` varchar(32) DEFAULT NULL,
  `to_status` varchar(32) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `ticket_history`
--

INSERT INTO `ticket_history` (`id`, `ticket_id`, `action`, `description`, `performed_by`, `from_status`, `to_status`, `created_at`) VALUES
(14, 2, 'status_changed', 'Status alterado de \'Backlog\' para \'Em desenvolvimento\'.', 'maria@ct.com', 'Backlog', 'Em desenvolvimento', '2026-06-19 00:19:27'),
(15, 2, 'created', 'Ticket criado.', 'maria@ct.com', NULL, 'Backlog', '2026-06-19 00:19:27'),
(16, 4, 'status_changed', 'Status alterado de \'Em desenvolvimento\' para \'Aguardando validação\'.', 'maria@ct.com', 'Em desenvolvimento', 'Aguardando validação', '2026-06-19 00:19:27'),
(17, 4, 'created', 'Ticket criado.', 'maria@ct.com', NULL, 'Backlog', '2026-06-19 00:19:27'),
(18, 5, 'completed', 'Status alterado de \'Em análise\' para \'Concluído\'.', 'admin@ct.com', 'Em análise', 'Concluído', '2026-06-19 00:19:27'),
(19, 5, 'created', 'Ticket criado.', 'admin@ct.com', NULL, 'Backlog', '2026-06-19 00:19:27'),
(20, 8, 'status_changed', 'Status alterado de \'Backlog\' para \'Em desenvolvimento\'.', 'carlos@ct.com', 'Backlog', 'Em desenvolvimento', '2026-06-19 00:19:27'),
(21, 8, 'created', 'Ticket criado.', 'carlos@ct.com', NULL, 'Backlog', '2026-06-19 00:19:27'),
(22, 11, 'status_changed', 'Status alterado de \'Em desenvolvimento\' para \'Aguardando validação\'.', 'carlos@ct.com', 'Em desenvolvimento', 'Aguardando validação', '2026-06-19 00:19:27'),
(23, 11, 'created', 'Ticket criado.', 'carlos@ct.com', NULL, 'Backlog', '2026-06-19 00:19:27'),
(24, 12, 'completed', 'Status alterado de \'Em desenvolvimento\' para \'Concluído\'.', 'admin@ct.com', 'Em desenvolvimento', 'Concluído', '2026-06-19 00:19:27'),
(25, 12, 'created', 'Ticket criado.', 'admin@ct.com', NULL, 'Backlog', '2026-06-19 00:19:27');

-- --------------------------------------------------------

--
-- Estrutura para tabela `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(180) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(32) NOT NULL DEFAULT 'user',
  `project_name` varchar(120) NOT NULL DEFAULT '',
  `active_project_id` int(11) DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `project_name`, `active_project_id`, `status`, `created_at`) VALUES
(1, 'Administrador', 'admin@ct.com', '$2b$12$GdWbCcGEtbMOZQaNPiTPzu8QG0k8EQrGF337//mrSf.QRvrwaOGYu', 'admin', 'Portal Corporativo', 1, 'active', '2026-06-18 23:13:32'),
(2, 'Maria Silva', 'maria@ct.com', '$2b$12$YRy8bzQE.uKF71loQ503eOVp10HDf1fgJeQa5gJVngmZfKg95jffu', 'user', 'Portal Corporativo', 1, 'active', '2026-06-19 00:18:30'),
(3, 'Carlos Mendes', 'carlos@ct.com', '$2b$12$YRy8bzQE.uKF71loQ503eOVp10HDf1fgJeQa5gJVngmZfKg95jffu', 'user', 'App Mobile SaaS', 2, 'active', '2026-06-19 00:18:30'),
(4, 'Ana Costa', 'ana@ct.com', '$2b$12$YRy8bzQE.uKF71loQ503eOVp10HDf1fgJeQa5gJVngmZfKg95jffu', 'user', 'Portal Corporativo', 1, 'active', '2026-06-19 00:18:30');

-- --------------------------------------------------------

--
-- Estrutura para tabela `user_projects`
--

CREATE TABLE `user_projects` (
  `user_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `user_projects`
--

INSERT INTO `user_projects` (`user_id`, `project_id`) VALUES
(1, 1),
(1, 2),
(2, 1),
(3, 2),
(4, 1),
(4, 2);

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `attachments`
--
ALTER TABLE `attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_attachments_ticket_id` (`ticket_id`);

--
-- Índices de tabela `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_projects_name` (`name`);

--
-- Índices de tabela `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_tickets_code` (`code`),
  ADD KEY `ix_tickets_user_id` (`user_id`),
  ADD KEY `ix_tickets_status` (`status`),
  ADD KEY `ix_tickets_project_id` (`project_id`);

--
-- Índices de tabela `ticket_history`
--
ALTER TABLE `ticket_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_ticket_history_ticket_id` (`ticket_id`);

--
-- Índices de tabela `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_users_email` (`email`),
  ADD KEY `ix_users_status` (`status`),
  ADD KEY `ix_users_role` (`role`),
  ADD KEY `ix_users_active_project_id` (`active_project_id`);

--
-- Índices de tabela `user_projects`
--
ALTER TABLE `user_projects`
  ADD PRIMARY KEY (`user_id`,`project_id`),
  ADD KEY `ix_user_projects_project_id` (`project_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `attachments`
--
ALTER TABLE `attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `tickets`
--
ALTER TABLE `tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de tabela `ticket_history`
--
ALTER TABLE `ticket_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT de tabela `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `attachments`
--
ALTER TABLE `attachments`
  ADD CONSTRAINT `fk_attachments_ticket_id` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `tickets`
--
ALTER TABLE `tickets`
  ADD CONSTRAINT `fk_tickets_project_id` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_tickets_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `ticket_history`
--
ALTER TABLE `ticket_history`
  ADD CONSTRAINT `fk_ticket_history_ticket_id` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_active_project_id` FOREIGN KEY (`active_project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `user_projects`
--
ALTER TABLE `user_projects`
  ADD CONSTRAINT `fk_user_projects_project_id` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user_projects_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
