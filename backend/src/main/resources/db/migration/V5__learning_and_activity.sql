create table video_interests (
    user_id uuid not null references users(id) on delete cascade,
    topic varchar(80) not null,
    primary key (user_id, topic)
);

create table quiz_scores (
    profession varchar(80) not null,
    user_id uuid not null references users(id) on delete cascade,
    score integer not null check (score between 0 and 100),
    primary key (profession, user_id)
);

create index idx_quiz_scores_ranking on quiz_scores (profession, score desc, user_id);
create index idx_todos_completion_date on todos (upper(username), completed_at) where completed;
create index idx_todos_deadline on todos (upper(username), deadline) where deadline is not null;

alter table challenges add column published boolean not null default false;
alter table challenges add column expires_at timestamp without time zone;
alter table challenges alter column created_at type timestamp without time zone
    using created_at at time zone 'UTC';
alter table challenges alter column created_at set default (current_timestamp at time zone 'UTC');
create index idx_challenges_feed on challenges (created_at desc, id desc) where published;
create index idx_challenge_applause_viewer on challenge_applauded_by (challenge_id, upper(username));
