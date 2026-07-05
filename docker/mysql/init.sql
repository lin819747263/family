-- 创建数据库
CREATE DATABASE IF NOT EXISTS family_home CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE family_home;

-- 预设记账分类（支出）
INSERT INTO categories (name, icon, type, parent_id, sort, built_in, created_at, updated_at) VALUES
('餐饮', 'utensils', 'expense', NULL, 1, TRUE, NOW(), NOW()),
('交通', 'car', 'expense', NULL, 2, TRUE, NOW(), NOW()),
('教育', 'book', 'expense', NULL, 3, TRUE, NOW(), NOW()),
('医疗', 'heart-pulse', 'expense', NULL, 4, TRUE, NOW(), NOW()),
('住房', 'home', 'expense', NULL, 5, TRUE, NOW(), NOW()),
('人情', 'users', 'expense', NULL, 6, TRUE, NOW(), NOW()),
('购物', 'shopping-bag', 'expense', NULL, 7, TRUE, NOW(), NOW()),
('娱乐', 'gamepad-2', 'expense', NULL, 8, TRUE, NOW(), NOW()),
('通讯', 'smartphone', 'expense', NULL, 9, TRUE, NOW(), NOW()),
('其他', 'ellipsis', 'expense', NULL, 99, TRUE, NOW(), NOW());

-- 预设收入分类
INSERT INTO categories (name, icon, type, parent_id, sort, built_in, created_at, updated_at) VALUES
('工资', 'wallet', 'income', NULL, 1, TRUE, NOW(), NOW()),
('奖金', 'gift', 'income', NULL, 2, TRUE, NOW(), NOW()),
('投资收益', 'trending-up', 'income', NULL, 3, TRUE, NOW(), NOW()),
('其他收入', 'plus-circle', 'income', NULL, 99, TRUE, NOW(), NOW());

-- 餐饮二级分类
INSERT INTO categories (name, icon, type, parent_id, sort, built_in, created_at, updated_at)
SELECT '早餐', 'coffee', 'expense', id, 1, TRUE, NOW(), NOW() FROM categories WHERE name='餐饮' LIMIT 1;
INSERT INTO categories (name, icon, type, parent_id, sort, built_in, created_at, updated_at)
SELECT '午餐', 'sun', 'expense', id, 2, TRUE, NOW(), NOW() FROM categories WHERE name='餐饮' LIMIT 1;
INSERT INTO categories (name, icon, type, parent_id, sort, built_in, created_at, updated_at)
SELECT '晚餐', 'moon', 'expense', id, 3, TRUE, NOW(), NOW() FROM categories WHERE name='餐饮' LIMIT 1;
INSERT INTO categories (name, icon, type, parent_id, sort, built_in, created_at, updated_at)
SELECT '零食饮品', 'cup-soda', 'expense', id, 4, TRUE, NOW(), NOW() FROM categories WHERE name='餐饮' LIMIT 1;
INSERT INTO categories (name, icon, type, parent_id, sort, built_in, created_at, updated_at)
SELECT '外卖', 'package', 'expense', id, 5, TRUE, NOW(), NOW() FROM categories WHERE name='餐饮' LIMIT 1;
