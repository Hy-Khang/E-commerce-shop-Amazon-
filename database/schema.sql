-- ============================================================
-- E-Commerce Platform — Full Database Schema
-- Database: SQL Server 2022
-- Generated from: PROJECT_MODULES.md + DATABASE.md
-- Tables: 34 | Modules: 22
-- ============================================================

-- ============================================================
-- PHASE 1 — NỀN TẢNG (Auth, Profile, Image Upload)
-- ============================================================

-- [Module 1] Auth & Security
-- ------------------------------------------------------------

CREATE TABLE roles (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    name        NVARCHAR(50)  NOT NULL,
    is_system   BIT           NOT NULL DEFAULT 0,

    CONSTRAINT uq_roles_name UNIQUE (name)
);

CREATE TABLE permissions (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    name        NVARCHAR(100) NOT NULL,
    resource    NVARCHAR(50)  NOT NULL,
    action      NVARCHAR(50)  NOT NULL,
    description NVARCHAR(255) NULL,
    created_at  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT uq_permissions_resource_action UNIQUE (resource, action)
);

CREATE INDEX idx_permissions_resource ON permissions (resource);

CREATE TABLE role_permissions (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    role_id       INT NOT NULL,
    permission_id INT NOT NULL,

    CONSTRAINT fk_role_permissions_role       FOREIGN KEY (role_id)       REFERENCES roles(id)       ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    CONSTRAINT uq_role_permissions_role_permission UNIQUE (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role_id       ON role_permissions (role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions (permission_id);

CREATE TABLE users (
    id                         INT IDENTITY(1,1) PRIMARY KEY,
    role_id                    INT           NOT NULL,
    email                      NVARCHAR(255) NOT NULL,
    password_hash              NVARCHAR(255) NULL,
    full_name                  NVARCHAR(100) NOT NULL,
    phone                      NVARCHAR(20)  NULL,
    email_verified             BIT           NOT NULL DEFAULT 0,
    email_verify_token         NVARCHAR(255) NULL,
    email_verify_expires       DATETIME2     NULL,
    email_verify_count         INT           NOT NULL DEFAULT 0,
    email_verify_count_reset   DATETIME2     NULL,
    email_verify_attempts      INT           NOT NULL DEFAULT 0,
    password_reset_token_hash  NVARCHAR(255) NULL,
    password_reset_expires_at  DATETIME2     NULL,
    is_active                  BIT           NOT NULL DEFAULT 1,
    created_at                 DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at                 DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE INDEX idx_users_email_verify_token
    ON users (email_verify_token)
    WHERE email_verify_token IS NOT NULL;

CREATE INDEX idx_users_password_reset_token_hash
    ON users (password_reset_token_hash)
    WHERE password_reset_token_hash IS NOT NULL;

-- OAuth: multi-provider support (replaces single provider/provider_id on users)
CREATE TABLE user_auth_providers (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    user_id     INT           NOT NULL,
    provider    NVARCHAR(20)  NOT NULL,
    provider_id NVARCHAR(255) NOT NULL,
    created_at  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_user_auth_providers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_auth_providers_provider_provider_id UNIQUE (provider, provider_id),
    CONSTRAINT uq_user_auth_providers_user_provider UNIQUE (user_id, provider)
);

-- OAuth: one-time authorization codes for secure callback exchange
CREATE TABLE oauth_codes (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    code_hash  NVARCHAR(255) NOT NULL,
    user_id    INT           NOT NULL,
    expires_at DATETIME2     NOT NULL,
    created_at DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_oauth_codes_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_oauth_codes_code_hash ON oauth_codes (code_hash);

CREATE TABLE refresh_tokens (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    user_id     INT           NOT NULL,
    token_hash  NVARCHAR(255) NOT NULL,
    expires_at  DATETIME2     NOT NULL,
    created_at  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    is_revoked  BIT           NOT NULL DEFAULT 0,
    ip_address  NVARCHAR(45)  NULL,
    user_agent  NVARCHAR(500) NULL,
    device_name NVARCHAR(100) NULL,

    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX idx_refresh_tokens_user_id    ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);

-- [Module 2] User Profile & Addresses
-- ------------------------------------------------------------

CREATE TABLE addresses (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    user_id      INT           NOT NULL,
    full_name    NVARCHAR(100) NOT NULL,
    phone        NVARCHAR(20)  NOT NULL,
    address_line NVARCHAR(255) NOT NULL,
    city         NVARCHAR(100) NOT NULL,
    is_default   BIT           NOT NULL DEFAULT 0,

    CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- PHASE 2 — SẢN PHẨM & CỬA HÀNG
-- ============================================================

-- [Module 4] Shop Management
-- ------------------------------------------------------------

CREATE TABLE shops (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    user_id      INT            NOT NULL,
    name         NVARCHAR(100)  NOT NULL,
    slug         NVARCHAR(100)  NOT NULL,
    description  NVARCHAR(MAX)  NULL,
    logo_url     NVARCHAR(500)  NULL,
    banner_url   NVARCHAR(500)  NULL,
    status       NVARCHAR(30)   NOT NULL DEFAULT 'pending_verification',
    verified_at  DATETIME2      NULL,
    verified_by  INT            NULL,
    suspended_at DATETIME2      NULL,
    banned_at    DATETIME2      NULL,
    created_at   DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at   DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_shops_user        FOREIGN KEY (user_id)     REFERENCES users(id),
    CONSTRAINT fk_shops_verified_by FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uq_shops_user_id UNIQUE (user_id),
    CONSTRAINT uq_shops_slug    UNIQUE (slug),
    CONSTRAINT chk_shops_status CHECK (status IN ('pending_verification', 'active', 'suspended', 'banned'))
);

CREATE INDEX idx_shops_user_id ON shops (user_id);
CREATE INDEX idx_shops_status  ON shops (status);

-- [Module 5] Product Catalog
-- ------------------------------------------------------------

CREATE TABLE categories (
    id        INT IDENTITY(1,1) PRIMARY KEY,
    parent_id INT           NULL,
    name      NVARCHAR(100) NOT NULL,
    slug      NVARCHAR(100) NOT NULL,

    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id),
    CONSTRAINT uq_categories_slug UNIQUE (slug)
);

CREATE TABLE products (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    category_id    INT           NOT NULL,
    shop_id        INT           NULL,
    name           NVARCHAR(255) NOT NULL,
    slug           NVARCHAR(255) NOT NULL,
    description    NVARCHAR(MAX) NULL,
    thumbnail_url  NVARCHAR(500) NULL,
    option1_label  NVARCHAR(50)  NULL,
    option2_label  NVARCHAR(50)  NULL,
    is_active      BIT           NOT NULL DEFAULT 1,
    created_at     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_products_shop     FOREIGN KEY (shop_id)     REFERENCES shops(id),
    CONSTRAINT uq_products_slug UNIQUE (slug)
);

CREATE INDEX idx_products_category_id ON products (category_id);
CREATE INDEX idx_products_shop_id     ON products (shop_id);

CREATE TABLE product_variants (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    product_id     INT            NOT NULL,
    sku            NVARCHAR(50)   NOT NULL,
    option1        NVARCHAR(50)   NULL,
    option2        NVARCHAR(50)   NULL,
    price          DECIMAL(10,2)  NOT NULL,
    sale_price     DECIMAL(10,2)  NULL,
    stock_quantity INT            NOT NULL DEFAULT 0,

    CONSTRAINT fk_product_variants_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT uq_product_variants_sku UNIQUE (sku)
);

CREATE INDEX idx_product_variants_product_options ON product_variants (product_id, option1, option2);

-- Filtered unique indexes (prevent duplicate option combos per product)
CREATE UNIQUE INDEX uq_pv_both_options
    ON product_variants (product_id, option1, option2)
    WHERE option1 IS NOT NULL AND option2 IS NOT NULL;

CREATE UNIQUE INDEX uq_pv_option1_only
    ON product_variants (product_id, option1)
    WHERE option1 IS NOT NULL AND option2 IS NULL;

CREATE UNIQUE INDEX uq_pv_no_options
    ON product_variants (product_id)
    WHERE option1 IS NULL AND option2 IS NULL;

CREATE TABLE product_images (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT           NOT NULL,
    image_url  NVARCHAR(500) NOT NULL,
    sort_order INT           NOT NULL DEFAULT 0,

    CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ============================================================
-- PHASE 3 — LUỒNG MUA HÀNG
-- ============================================================

-- [Module 6] Cart & Checkout
-- ------------------------------------------------------------

CREATE TABLE carts (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    user_id    INT           NULL,
    session_id NVARCHAR(100) NULL,
    created_at DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE cart_items (
    id                 INT IDENTITY(1,1) PRIMARY KEY,
    cart_id            INT NOT NULL,
    product_variant_id INT NOT NULL,
    quantity           INT NOT NULL,

    CONSTRAINT fk_cart_items_cart    FOREIGN KEY (cart_id)            REFERENCES carts(id),
    CONSTRAINT fk_cart_items_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    CONSTRAINT uq_cart_items_cart_variant UNIQUE (cart_id, product_variant_id),
    CONSTRAINT chk_cart_items_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items (cart_id);

-- [Module 7] Order Management
-- ------------------------------------------------------------

CREATE TABLE orders (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    user_id          INT            NOT NULL,
    status           NVARCHAR(20)   NOT NULL DEFAULT 'pending',
    payment_method   NVARCHAR(20)   NOT NULL,
    payment_status   NVARCHAR(20)   NOT NULL DEFAULT 'unpaid',
    shipping_fee     DECIMAL(10,2)  NOT NULL DEFAULT 0,
    total_amount     DECIMAL(10,2)  NOT NULL,
    shipping_address NVARCHAR(MAX)  NOT NULL,
    coupon_code      NVARCHAR(50)   NULL,
    discount_amount  DECIMAL(10,2)  NOT NULL DEFAULT 0,
    delivered_at     DATETIME2      NULL,
    created_at       DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT chk_orders_status CHECK (status IN ('pending','confirmed','shipping','delivered','completed','return_requested','cancelled')),
    CONSTRAINT chk_orders_payment_method CHECK (payment_method IN ('cod','vnpay','momo')),
    CONSTRAINT chk_orders_payment_status CHECK (payment_status IN ('unpaid','paid','refunded'))
);

CREATE INDEX idx_orders_user_id      ON orders (user_id);
CREATE INDEX idx_orders_status       ON orders (status);
CREATE INDEX idx_orders_created_at   ON orders (created_at);
CREATE INDEX idx_orders_delivered_at ON orders (delivered_at);

CREATE TABLE order_items (
    id                    INT IDENTITY(1,1) PRIMARY KEY,
    order_id              INT            NOT NULL,
    product_variant_id    INT            NULL,
    shop_id               INT            NULL,
    shop_name             NVARCHAR(100)  NULL,
    product_name          NVARCHAR(255)  NOT NULL,
    sku                   NVARCHAR(50)   NOT NULL,
    price                 DECIMAL(10,2)  NOT NULL,
    quantity              INT            NOT NULL,
    thumbnail_url         NVARCHAR(500)  NULL,
    variant_option1_label NVARCHAR(50)   NULL,
    variant_option1_value NVARCHAR(50)   NULL,
    variant_option2_label NVARCHAR(50)   NULL,
    variant_option2_value NVARCHAR(50)   NULL,

    CONSTRAINT fk_order_items_order   FOREIGN KEY (order_id)           REFERENCES orders(id),
    CONSTRAINT fk_order_items_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    CONSTRAINT chk_order_items_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_order_items_shop_id  ON order_items (shop_id);

-- [Module 8] Payment Gateway
-- ------------------------------------------------------------

CREATE TABLE payment_transactions (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    order_id         INT            NOT NULL,
    payment_method   NVARCHAR(20)   NOT NULL,
    transaction_ref  NVARCHAR(100)  NOT NULL,
    gateway_trans_id NVARCHAR(100)  NULL,
    amount           DECIMAL(10,2)  NOT NULL,
    status           NVARCHAR(20)   NOT NULL DEFAULT 'pending',
    response_data    NVARCHAR(MAX)  NULL,
    paid_at          DATETIME2      NULL,
    created_at       DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at       DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_payment_transactions_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT uq_payment_transactions_ref UNIQUE (transaction_ref),
    CONSTRAINT chk_payment_trans_method CHECK (payment_method IN ('vnpay','momo')),
    CONSTRAINT chk_payment_trans_status CHECK (status IN ('pending','completed','failed','refunded'))
);

CREATE INDEX idx_payment_transactions_order_id ON payment_transactions (order_id);
CREATE INDEX idx_payment_transactions_status   ON payment_transactions (status);

-- [Module 9] Coupons
-- ------------------------------------------------------------

CREATE TABLE coupons (
    id                 INT IDENTITY(1,1) PRIMARY KEY,
    code               NVARCHAR(50)   NOT NULL,
    description        NVARCHAR(255)  NULL,
    discount_type      NVARCHAR(20)   NOT NULL,
    discount_value     DECIMAL(10,2)  NOT NULL,
    scope              NVARCHAR(20)   NOT NULL DEFAULT 'all',
    min_order_amount   DECIMAL(10,2)  NULL,
    max_discount_amount DECIMAL(10,2) NULL,
    max_uses           INT            NULL,
    max_uses_per_user  INT            NOT NULL DEFAULT 1,
    current_uses       INT            NOT NULL DEFAULT 0,
    starts_at          DATETIME2      NOT NULL,
    expires_at         DATETIME2      NOT NULL,
    is_active          BIT            NOT NULL DEFAULT 1,
    created_at         DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at         DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT uq_coupons_code UNIQUE (code),
    CONSTRAINT chk_coupons_discount_type CHECK (discount_type IN ('fixed','percentage')),
    CONSTRAINT chk_coupons_scope CHECK (scope IN ('all','categories','products'))
);

CREATE INDEX idx_coupons_is_active  ON coupons (is_active);
CREATE INDEX idx_coupons_expires_at ON coupons (expires_at);

CREATE TABLE coupon_categories (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    coupon_id   INT NOT NULL,
    category_id INT NOT NULL,

    CONSTRAINT fk_coupon_categories_coupon   FOREIGN KEY (coupon_id)   REFERENCES coupons(id)    ON DELETE CASCADE,
    CONSTRAINT fk_coupon_categories_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT uq_coupon_categories UNIQUE (coupon_id, category_id)
);

CREATE TABLE coupon_products (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    coupon_id  INT NOT NULL,
    product_id INT NOT NULL,

    CONSTRAINT fk_coupon_products_coupon  FOREIGN KEY (coupon_id)  REFERENCES coupons(id)  ON DELETE CASCADE,
    CONSTRAINT fk_coupon_products_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT uq_coupon_products UNIQUE (coupon_id, product_id)
);

CREATE TABLE coupon_usages (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    coupon_id       INT            NOT NULL,
    user_id         INT            NOT NULL,
    order_id        INT            NOT NULL,
    discount_amount DECIMAL(10,2)  NOT NULL,
    status          NVARCHAR(20)   NOT NULL DEFAULT 'applied',
    created_at      DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_coupon_usages_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id),
    CONSTRAINT fk_coupon_usages_user   FOREIGN KEY (user_id)   REFERENCES users(id),
    CONSTRAINT fk_coupon_usages_order  FOREIGN KEY (order_id)  REFERENCES orders(id),
    CONSTRAINT chk_coupon_usages_status CHECK (status IN ('applied','reversed'))
);

CREATE INDEX idx_coupon_usages_coupon_id          ON coupon_usages (coupon_id);
CREATE INDEX idx_coupon_usages_user_id_coupon_id  ON coupon_usages (user_id, coupon_id);
CREATE INDEX idx_coupon_usages_order_id           ON coupon_usages (order_id);

-- ============================================================
-- PHASE 4 — TƯƠNG TÁC & THÔNG BÁO
-- ============================================================

-- [Module 10] Wishlist & Reviews
-- ------------------------------------------------------------

CREATE TABLE reviews (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    user_id    INT           NOT NULL,
    product_id INT           NOT NULL,
    order_id   INT           NOT NULL,
    rating     INT           NOT NULL,
    comment    NVARCHAR(MAX) NULL,
    created_at DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_reviews_user    FOREIGN KEY (user_id)    REFERENCES users(id),
    CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_reviews_order   FOREIGN KEY (order_id)   REFERENCES orders(id),
    CONSTRAINT chk_reviews_rating CHECK (rating >= 1 AND rating <= 5)
);

CREATE INDEX idx_reviews_product_id ON reviews (product_id);

CREATE TABLE wishlist_items (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    user_id    INT       NOT NULL,
    product_id INT       NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_wishlist_items_user    FOREIGN KEY (user_id)    REFERENCES users(id),
    CONSTRAINT fk_wishlist_items_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT uq_wishlist_items_user_product UNIQUE (user_id, product_id)
);

CREATE INDEX idx_wishlist_items_user_id    ON wishlist_items (user_id);
CREATE INDEX idx_wishlist_items_product_id ON wishlist_items (product_id);

-- [Module 11] Notifications
-- ------------------------------------------------------------

CREATE TABLE notifications (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    user_id    INT           NOT NULL,
    type       NVARCHAR(50)  NOT NULL,
    title      NVARCHAR(255) NOT NULL,
    message    NVARCHAR(500) NOT NULL,
    data       NVARCHAR(MAX) NULL,
    is_read    BIT           NOT NULL DEFAULT 0,
    created_at DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_id_is_read ON notifications (user_id, is_read);
CREATE INDEX idx_notifications_created_at      ON notifications (created_at);

-- ============================================================
-- PHASE 5 — DASHBOARD & TRACKING
-- ============================================================

-- [Module 13] Admin Panel — Settings (AI Chatbox toggle)
-- ------------------------------------------------------------

CREATE TABLE settings (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    key        NVARCHAR(100) NOT NULL,
    value      NVARCHAR(MAX) NOT NULL,
    updated_at DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT uq_settings_key UNIQUE ([key])
);

-- [Module 16] Order Tracking
-- ------------------------------------------------------------

CREATE TABLE order_status_history (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    order_id   INT           NOT NULL,
    status     NVARCHAR(20)  NOT NULL,
    changed_by INT           NULL,
    note       NVARCHAR(255) NULL,
    created_at DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_order_status_history_order FOREIGN KEY (order_id)   REFERENCES orders(id),
    CONSTRAINT fk_order_status_history_user  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_order_status_history_order_id ON order_status_history (order_id);

CREATE TABLE order_tracking (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    order_id   INT            NOT NULL,
    latitude   DECIMAL(10,7)  NOT NULL,
    longitude  DECIMAL(10,7)  NOT NULL,
    updated_at DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_order_tracking_order FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX idx_order_tracking_order_id ON order_tracking (order_id);

-- ============================================================
-- PHASE 6 — TÍNH NĂNG NÂNG CAO
-- ============================================================

-- [Module 17] Flash Sale
-- ------------------------------------------------------------

CREATE TABLE flash_sales (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    name       NVARCHAR(255) NOT NULL,
    starts_at  DATETIME2     NOT NULL,
    ends_at    DATETIME2     NOT NULL,
    status     NVARCHAR(20)  NOT NULL DEFAULT 'scheduled',
    created_at DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT chk_flash_sales_status CHECK (status IN ('scheduled','active','ended'))
);

CREATE INDEX idx_flash_sales_status    ON flash_sales (status);
CREATE INDEX idx_flash_sales_starts_at ON flash_sales (starts_at);

CREATE TABLE flash_sale_items (
    id                 INT IDENTITY(1,1) PRIMARY KEY,
    flash_sale_id      INT           NOT NULL,
    product_variant_id INT           NOT NULL,
    flash_price        DECIMAL(10,2) NOT NULL,
    flash_quantity     INT           NOT NULL,
    sold_quantity      INT           NOT NULL DEFAULT 0,
    version            INT           NOT NULL DEFAULT 0,

    CONSTRAINT fk_flash_sale_items_sale    FOREIGN KEY (flash_sale_id)      REFERENCES flash_sales(id) ON DELETE CASCADE,
    CONSTRAINT fk_flash_sale_items_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id),
    CONSTRAINT uq_flash_sale_items UNIQUE (flash_sale_id, product_variant_id),
    CONSTRAINT chk_flash_sale_items_qty CHECK (flash_quantity > 0)
);

-- [Module 18] Recently Viewed
-- ------------------------------------------------------------

CREATE TABLE recently_viewed (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    user_id    INT       NOT NULL,
    product_id INT       NOT NULL,
    viewed_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_recently_viewed_user    FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_recently_viewed_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT uq_recently_viewed_user_product UNIQUE (user_id, product_id)
);

CREATE INDEX idx_recently_viewed_user_id ON recently_viewed (user_id, viewed_at DESC);

-- [Module 19] Product Comparison
-- Không cần bảng — lưu ở frontend state (Zustand store)

-- [Module 20] Chat Realtime
-- ------------------------------------------------------------

CREATE TABLE conversations (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    customer_id     INT       NOT NULL,
    shop_id         INT       NOT NULL,
    last_message_at DATETIME2 NULL,
    created_at      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_conversations_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_conversations_shop     FOREIGN KEY (shop_id)     REFERENCES shops(id),
    CONSTRAINT uq_conversations_customer_shop UNIQUE (customer_id, shop_id)
);

CREATE INDEX idx_conversations_customer_id ON conversations (customer_id);
CREATE INDEX idx_conversations_shop_id     ON conversations (shop_id);

CREATE TABLE messages (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    conversation_id INT           NOT NULL,
    sender_id       INT           NOT NULL,
    content         NVARCHAR(MAX) NOT NULL,
    status          NVARCHAR(20)  NOT NULL DEFAULT 'sent',
    created_at      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender       FOREIGN KEY (sender_id)       REFERENCES users(id),
    CONSTRAINT chk_messages_status CHECK (status IN ('sent','delivered','read'))
);

CREATE INDEX idx_messages_conversation_id ON messages (conversation_id, created_at);

-- [Module 21] AI Chatbox
-- ------------------------------------------------------------

CREATE TABLE ai_conversations (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    user_id    INT       NULL,
    session_id NVARCHAR(100) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_ai_conversations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_ai_conversations_user_id ON ai_conversations (user_id);

CREATE TABLE ai_messages (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    ai_conversation_id  INT          NOT NULL,
    role                NVARCHAR(20) NOT NULL,
    content             NVARCHAR(MAX) NOT NULL,
    created_at          DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_ai_messages_conversation FOREIGN KEY (ai_conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE,
    CONSTRAINT chk_ai_messages_role CHECK (role IN ('user','assistant'))
);

CREATE INDEX idx_ai_messages_conversation_id ON ai_messages (ai_conversation_id);

-- [Module 22] Smart Recommendations — Activity Log
-- ------------------------------------------------------------

CREATE TABLE user_activity_log (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    user_id     INT           NULL,
    session_id  NVARCHAR(100) NULL,
    action      NVARCHAR(30)  NOT NULL,
    target_type NVARCHAR(20)  NOT NULL,
    target_id   INT           NULL,
    metadata    NVARCHAR(MAX) NULL,
    created_at  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_activity_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_activity_action CHECK (action IN ('VIEW_PRODUCT','VIEW_CATEGORY','SEARCH','ADD_TO_CART','ADD_TO_WISHLIST','PURCHASE')),
    CONSTRAINT chk_activity_target_type CHECK (target_type IN ('product','category','search'))
);

CREATE INDEX idx_activity_log_user_id    ON user_activity_log (user_id, created_at DESC);
CREATE INDEX idx_activity_log_session_id ON user_activity_log (session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_activity_log_action     ON user_activity_log (action, target_type);
CREATE INDEX idx_activity_log_created_at ON user_activity_log (created_at);

-- ============================================================
-- SEED DATA — Default roles, permissions, settings
-- ============================================================

-- Default roles
INSERT INTO roles (name, is_system) VALUES
    (N'customer', 1),
    (N'admin',    1),
    (N'seller',   1),
    (N'shipper',  1);

-- Default permissions
INSERT INTO permissions (name, resource, action) VALUES
    -- Products
    (N'Create Product',    'products',    'create'),
    (N'Read Product',      'products',    'read'),
    (N'Update Product',    'products',    'update'),
    (N'Delete Product',    'products',    'delete'),
    -- Categories
    (N'Create Category',   'categories',  'create'),
    (N'Read Category',     'categories',  'read'),
    (N'Update Category',   'categories',  'update'),
    (N'Delete Category',   'categories',  'delete'),
    -- Orders
    (N'Create Order',      'orders',      'create'),
    (N'Read Order',        'orders',      'read'),
    (N'Update Order',      'orders',      'update'),
    (N'Delete Order',      'orders',      'delete'),
    -- Users
    (N'Create User',       'users',       'create'),
    (N'Read User',         'users',       'read'),
    (N'Update User',       'users',       'update'),
    (N'Delete User',       'users',       'delete'),
    -- Roles
    (N'Create Role',       'roles',       'create'),
    (N'Read Role',         'roles',       'read'),
    (N'Update Role',       'roles',       'update'),
    (N'Delete Role',       'roles',       'delete'),
    -- Permissions
    (N'Create Permission', 'permissions', 'create'),
    (N'Read Permission',   'permissions', 'read'),
    (N'Update Permission', 'permissions', 'update'),
    (N'Delete Permission', 'permissions', 'delete'),
    -- Dashboard
    (N'Read Dashboard',    'dashboard',   'read'),
    -- Uploads
    (N'Create Upload',     'uploads',     'create'),
    -- Reviews
    (N'Read Review',       'reviews',     'read'),
    (N'Delete Review',     'reviews',     'delete'),
    -- Coupons
    (N'Create Coupon',     'coupons',     'create'),
    (N'Read Coupon',       'coupons',     'read'),
    (N'Update Coupon',     'coupons',     'update'),
    (N'Delete Coupon',     'coupons',     'delete'),
    -- Shops
    (N'Create Shop',       'shops',       'create'),
    (N'Read Shop',         'shops',       'read'),
    (N'Update Shop',       'shops',       'update'),
    (N'Delete Shop',       'shops',       'delete'),
    -- Wishlist (admin analytics)
    (N'Read Wishlist',     'wishlist',    'read'),
    -- Flash Sales
    (N'Create Flash Sale', 'flash_sales', 'create'),
    (N'Read Flash Sale',   'flash_sales', 'read'),
    (N'Update Flash Sale', 'flash_sales', 'update'),
    (N'Delete Flash Sale', 'flash_sales', 'delete'),
    -- Payments
    (N'Read Payment',      'payments',    'read');

-- Admin gets ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'admin'),
    id
FROM permissions;

-- Seller permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'seller'),
    id
FROM permissions
WHERE (resource = 'products')
   OR (resource = 'categories' AND action = 'read')
   OR (resource = 'orders'     AND action IN ('read', 'update'))
   OR (resource = 'uploads'    AND action = 'create')
   OR (resource = 'dashboard'  AND action = 'read')
   OR (resource = 'shops'      AND action IN ('create', 'read', 'update'));

-- Shipper permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'shipper'),
    id
FROM permissions
WHERE (resource = 'orders'    AND action IN ('read', 'update'))
   OR (resource = 'dashboard' AND action = 'read');

-- Default settings
INSERT INTO settings ([key], value) VALUES
    (N'ai_chatbox_enabled', N'true');
