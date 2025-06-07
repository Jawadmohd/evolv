create table if not exists todos (
    id uuid primary key default gen_random_uuid(),
    username varchar(50) not null,
    title varchar(255) not null,
    period varchar(20) not null,
    deadline timestamp with time zone,
    completed boolean not null default false,
    completed_at timestamp with time zone
);

create table if not exists todo_tags (
    todo_id uuid not null references todos(id) on delete cascade,
    tag varchar(50) not null
);

create table if not exists challenges (
    id uuid primary key default gen_random_uuid(),
    username varchar(50) not null,
    challenge_text varchar(500) not null,
    duration varchar(50) not null,
    applause integer not null default 0,
    completed boolean not null default false,
    created_at timestamp with time zone not null default now(),
    progress_entries jsonb not null default '[]'::jsonb
);

create table if not exists challenge_applauded_by (
    challenge_id uuid not null references challenges(id) on delete cascade,
    username varchar(50) not null
);

create table if not exists challenge_proof_images (
    challenge_id uuid not null references challenges(id) on delete cascade,
    image_url text not null
);
