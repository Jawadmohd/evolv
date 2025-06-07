create index if not exists idx_todos_owner_completed on todos (upper(username), completed);
create index if not exists idx_challenges_owner_completed on challenges (upper(username), completed);
create index if not exists idx_todo_tags_todo_id on todo_tags (todo_id);
create index if not exists idx_challenge_applauded_by_challenge_id on challenge_applauded_by (challenge_id);
create index if not exists idx_challenge_proof_images_challenge_id on challenge_proof_images (challenge_id);
