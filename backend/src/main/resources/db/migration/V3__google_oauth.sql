alter table users
    alter column password_hash drop not null;

alter table users
    add column if not exists auth_provider varchar(20) not null default 'LOCAL';

alter table users
    add column if not exists google_sub varchar(255);

create unique index if not exists idx_users_google_sub on users(google_sub) where google_sub is not null;
