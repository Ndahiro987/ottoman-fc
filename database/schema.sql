-- OTTOMAN FC CONNECT Database Schema
-- PostgreSQL 18
-- Timezone: Africa/Kampala

SET timezone = 'Africa/Kampala';

-- 1. roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. permissions
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'player',
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

-- 4. user_roles
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    assigned_by UUID REFERENCES users(id),
    UNIQUE(user_id, role_id)
);

-- 5. role_permissions (many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

-- 6. players
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id VARCHAR(50) NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(200) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    nationality VARCHAR(100),
    national_id VARCHAR(100),
    passport_number VARCHAR(100),
    phone VARCHAR(50),
    alternative_phone VARCHAR(50),
    email VARCHAR(255),
    residential_address TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_number VARCHAR(100),
    photograph_url TEXT,
    primary_position VARCHAR(50),
    secondary_position VARCHAR(50),
    preferred_foot VARCHAR(20),
    jersey_number INTEGER,
    previous_club VARCHAR(200),
    football_experience TEXT,
    player_category VARCHAR(50),
    registration_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    kyc_status VARCHAR(50) NOT NULL DEFAULT 'not_submitted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

-- 7. player_profiles (extended profile data)
CREATE TABLE IF NOT EXISTS player_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    height_cm INTEGER,
    weight_kg INTEGER,
    blood_group VARCHAR(10),
    medical_conditions TEXT,
    allergies TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(player_id)
);

-- 8. player_documents
CREATE TABLE IF NOT EXISTS player_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    document_reference VARCHAR(255),
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    upload_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    expiry_date DATE,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'not_submitted',
    reviewing_administrator UUID REFERENCES users(id),
    review_date TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. player_approvals (registration approval history)
CREATE TABLE IF NOT EXISTS player_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    reviewed_by UUID REFERENCES users(id),
    review_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. contracts
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id VARCHAR(50) NOT NULL UNIQUE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    contract_type VARCHAR(100) NOT NULL,
    commencement_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    agreed_remuneration NUMERIC(15,2),
    currency VARCHAR(10) NOT NULL DEFAULT 'UGX',
    payment_frequency VARCHAR(50),
    contract_conditions TEXT,
    additional_clauses TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    supporting_documents TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

-- 11. contract_documents
CREATE TABLE IF NOT EXISTS contract_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    document_type VARCHAR(100),
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    uploaded_by UUID REFERENCES users(id)
);

-- 12. contract_amendments
CREATE TABLE IF NOT EXISTS contract_amendments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    amendment_type VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    changed_by UUID REFERENCES users(id),
    reason TEXT
);

-- 13. payment_requests
CREATE TABLE IF NOT EXISTS payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(100) NOT NULL UNIQUE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    payment_category VARCHAR(100) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'UGX',
    payment_description TEXT,
    requested_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    requested_by UUID REFERENCES users(id),
    supporting_evidence TEXT,
    approval_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id UUID NOT NULL REFERENCES payment_requests(id) ON DELETE CASCADE,
    transaction_reference VARCHAR(255) UNIQUE,
    amount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'UGX',
    payment_method VARCHAR(50),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_by UUID REFERENCES users(id),
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. payment_approvals
CREATE TABLE IF NOT EXISTS payment_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id UUID NOT NULL REFERENCES payment_requests(id) ON DELETE CASCADE,
    approver_id UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. coaches
CREATE TABLE IF NOT EXISTS coaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(100),
    specialization VARCHAR(100),
    years_experience INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- 17. teams
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    coach_id UUID REFERENCES coaches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. player_positions
CREATE TABLE IF NOT EXISTS player_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    abbreviation VARCHAR(10)
);

-- 19. formations
CREATE TABLE IF NOT EXISTS formations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_custom BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 20. lineups
CREATE TABLE IF NOT EXISTS lineups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    formation_id UUID REFERENCES formations(id),
    match_id UUID REFERENCES matches(id),
    coach_id UUID REFERENCES coaches(id),
    selection_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 21. lineup_players
CREATE TABLE IF NOT EXISTS lineup_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lineup_id UUID NOT NULL REFERENCES lineups(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    position VARCHAR(50),
    jersey_number INTEGER,
    is_captain BOOLEAN NOT NULL DEFAULT false,
    is_substitute BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 22. matches
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opponent VARCHAR(200) NOT NULL,
    competition VARCHAR(200),
    match_date TIMESTAMPTZ NOT NULL,
    venue VARCHAR(200),
    home_or_away VARCHAR(20),
    home_score INTEGER,
    away_score INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    coach_comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 23. match_events
CREATE TABLE IF NOT EXISTS match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    minute INTEGER,
    event_type VARCHAR(50),
    player_id UUID REFERENCES players(id),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 24. player_match_statistics
CREATE TABLE IF NOT EXISTS player_match_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    starter BOOLEAN NOT NULL DEFAULT false,
    minutes_played INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    shots INTEGER DEFAULT 0,
    shots_on_target INTEGER DEFAULT 0,
    passes_completed INTEGER DEFAULT 0,
    pass_accuracy NUMERIC(5,2),
    chances_created INTEGER DEFAULT 0,
    tackles INTEGER DEFAULT 0,
    interceptions INTEGER DEFAULT 0,
    clearances INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    clean_sheets BOOLEAN DEFAULT false,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(match_id, player_id)
);

-- 25. player_performance_scores
CREATE TABLE IF NOT EXISTS player_performance_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    technical_score NUMERIC(5,2),
    tactical_score NUMERIC(5,2),
    physical_score NUMERIC(5,2),
    attacking_score NUMERIC(5,2),
    defensive_score NUMERIC(5,2),
    teamwork_score NUMERIC(5,2),
    discipline_score NUMERIC(5,2),
    overall_score NUMERIC(5,2),
    coach_rating NUMERIC(5,2),
    coach_notes TEXT,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    calculated_by UUID REFERENCES users(id)
);

-- 26. player_evaluations
CREATE TABLE IF NOT EXISTS player_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES users(id),
    evaluation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    category VARCHAR(100),
    rating NUMERIC(5,2),
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 27. training_sessions
CREATE TABLE IF NOT EXISTS training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    session_type VARCHAR(100),
    session_date TIMESTAMPTZ NOT NULL,
    venue VARCHAR(200),
    responsible_coach UUID REFERENCES coaches(id),
    description TEXT,
    squad_ids UUID[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 28. training_attendance
CREATE TABLE IF NOT EXISTS training_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    recorded_by UUID REFERENCES users(id),
    UNIQUE(training_session_id, player_id)
);

-- 29. tactical_plans
CREATE TABLE IF NOT EXISTS tactical_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    formation VARCHAR(50),
    match_or_training VARCHAR(100),
    coaching_notes TEXT,
    created_by UUID REFERENCES coaches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 30. tactical_players
CREATE TABLE IF NOT EXISTS tactical_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tactical_plan_id UUID NOT NULL REFERENCES tactical_plans(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id),
    position_x NUMERIC(6,2),
    position_y NUMERIC(6,2),
    jersey_number INTEGER,
    role VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 31. tactical_movements
CREATE TABLE IF NOT EXISTS tactical_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tactical_plan_id UUID NOT NULL REFERENCES tactical_plans(id) ON DELETE CASCADE,
    from_player_id UUID REFERENCES players(id),
    to_player_id UUID REFERENCES players(id),
    movement_type VARCHAR(100),
    path_data TEXT,
    sequence_order INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 32. notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    type VARCHAR(50),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    link VARCHAR(500)
);

-- 33. announcements
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    audience VARCHAR(50) NOT NULL DEFAULT 'all',
    published_by UUID REFERENCES users(id),
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ
);

-- 34. audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 35. club_settings
CREATE TABLE IF NOT EXISTS club_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_name VARCHAR(200) NOT NULL DEFAULT 'OTTOMAN FC',
    platform_name VARCHAR(200) NOT NULL DEFAULT 'OTTOMAN FC CONNECT',
    club_logo_url TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    club_address TEXT,
    default_currency VARCHAR(10) NOT NULL DEFAULT 'UGX',
    timezone VARCHAR(100) NOT NULL DEFAULT 'Africa/Kampala',
    player_id_format VARCHAR(100) NOT NULL DEFAULT 'OTF-YYYY-NNNN',
    contract_reminder_intervals JSONB NOT NULL DEFAULT '[90, 60, 30, 7]',
    notification_preferences JSONB NOT NULL DEFAULT '{}',
    security_policies JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_players_player_id ON players(player_id);
CREATE INDEX IF NOT EXISTS idx_players_status ON players(status);
CREATE INDEX IF NOT EXISTS idx_players_kyc_status ON players(kyc_status);
CREATE INDEX IF NOT EXISTS idx_players_category ON players(player_category);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_contracts_player_id ON contracts(player_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_expiry ON contracts(expiry_date);
CREATE INDEX IF NOT EXISTS idx_payment_requests_player_id ON payment_requests(player_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(approval_status);
CREATE INDEX IF NOT EXISTS idx_payments_request_id ON payments(payment_request_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_match ON player_match_statistics(match_id);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_player ON player_match_statistics(player_id);
CREATE INDEX IF NOT EXISTS idx_performance_scores_player ON player_performance_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_training_attendance_session ON training_attendance(training_session_id);
CREATE INDEX IF NOT EXISTS idx_lineup_players_lineup ON lineup_players(lineup_id);

-- Default roles
INSERT INTO roles (name, description) VALUES
    ('administrator', 'Full system access'),
    ('coach', 'Coaching and team management'),
    ('player', 'Player portal access')
ON CONFLICT (name) DO NOTHING;

-- Default permissions
INSERT INTO permissions (code, description) VALUES
    ('players.view', 'View player records'),
    ('players.create', 'Create player registrations'),
    ('players.edit', 'Edit player records'),
    ('players.approve', 'Approve/reject player registrations'),
    ('kyc.view', 'View KYC documents'),
    ('kyc.review', 'Review and verify KYC documents'),
    ('contracts.view', 'View contracts'),
    ('contracts.create', 'Create contracts'),
    ('contracts.edit', 'Edit contracts'),
    ('contracts.approve', 'Approve/terminate contracts'),
    ('payments.view', 'View payment records'),
    ('payments.create', 'Create payment requests'),
    ('payments.approve', 'Approve/reject payments'),
    ('payments.confirm', 'Confirm payments as paid'),
    ('teams.manage', 'Manage teams'),
    ('lineups.create', 'Create lineups'),
    ('matches.manage', 'Manage matches'),
    ('training.manage', 'Manage training sessions'),
    ('tactical.create', 'Create tactical plans'),
    ('performance.view', 'View performance scores'),
    ('reports.view', 'View reports'),
    ('reports.export', 'Export reports'),
    ('notifications.manage', 'Manage notifications'),
    ('users.manage', 'Manage user accounts'),
    ('settings.manage', 'Manage platform settings'),
    ('audit.view', 'View audit logs')
ON CONFLICT (code) DO NOTHING;

-- Administrator gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'administrator'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Coach permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'coach' AND p.code IN (
    'players.view', 'kyc.view', 'contracts.view', 'payments.view',
    'teams.manage', 'lineups.create', 'matches.manage', 'training.manage',
    'tactical.create', 'performance.view', 'reports.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Player permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'player' AND p.code IN (
    'players.view', 'contracts.view', 'payments.view', 'performance.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Default club settings
INSERT INTO club_settings (club_name, platform_name, default_currency, timezone)
VALUES ('OTTOMAN FC', 'OTTOMAN FC CONNECT', 'UGX', 'Africa/Kampala')
ON CONFLICT (id) DO NOTHING;
