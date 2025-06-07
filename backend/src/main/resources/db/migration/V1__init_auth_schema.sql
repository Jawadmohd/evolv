create extension if not exists "pgcrypto";

create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    email varchar(100) not null unique,
    firstname varchar(100),
    lastname varchar(100),
    username varchar(50) not null unique,
    profession varchar(100),
    dob varchar(20),
    password_hash varchar(255) not null,
    role varchar(20) not null,
    created_at timestamp with time zone not null default now()
);

create table if not exists refresh_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    token varchar(128) not null unique,
    expires_at timestamp with time zone not null,
    revoked boolean not null default false,
    created_at timestamp with time zone not null default now()
);

create index if not exists idx_refresh_tokens_user_id on refresh_tokens(user_id);
