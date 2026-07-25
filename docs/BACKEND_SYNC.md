# Backend Sync Summary

_Last verified against live database on startup by `src/lib/migration-check.server.ts`._

## Snapshot

- **Migration files on disk:** 108 (`supabase/migrations/*.sql`)
- **Tables declared across migrations:** 63
- **Tables present in live DB:** 63
- **Table parity:** ✅ perfect match — every migration table exists live, no orphans
- **Functions declared across migrations:** 34
- **Functions present in live DB:** 6
- **Function parity:** ⚠️  28 missing from live DB — see gap section
- **Idempotency:** 81/108 migrations use `IF NOT EXISTS` / `OR REPLACE` guards
- **Skipped migration:** `20260718113413_*.sql` — contains destructive `DROP SCHEMA public CASCADE`, intentionally not applied to protect live data

## Function parity gap

The following functions are declared in migrations but not present in the live DB. They belong to the credit-reservation and job-worker paths and should be re-applied in a follow-up migration:

- `activate_pro_subscription`
- `app_role`
- `claim_next_job`
- `claim_next_job_v`
- `claim_onboarding_bonus`
- `commit_reservation`
- `create_generation_and_reserve`
- `deactivate_pro_subscription`
- `finalize_job`
- `finalize_marketplace_run`
- `finalize_sync_render`
- `gpu_worker_inflight_dec`
- `gpu_worker_inflight_inc`
- `gpu_worker_inflight_inc_cap`
- `grant_free_monthly_aura_all`
- `grant_monthly_aura`
- `guided_workflows_set_updated_at`
- `marketplace_templates_set_updated_at`
- `reconcile_stuck_reservation`
- `reconcile_stuck_reservations`
- `release_reservation`
- `requeue_failed_job`
- `reserve_credits`
- `reset_stale_processing_jobs`
- `reset_stale_processing_jobs_for_kinds`
- `set_generation_watermark_from_plan`
- `set_job_priority_from_plan`
- `set_tiktok_updated_at`

## How verification runs

- **On startup:** `src/lib/migration-check.server.ts` runs once per server process, verifies every table in `EXPECTED_TABLES` exists, and logs a clear error if anything is missing. Called from the first authenticated server function via `ensureMigrationsCurrent()`.

- **On demand:** `bun scripts/verify-migrations.ts` diffs `supabase/migrations/` against the live schema and prints a machine-readable report (used in CI or before a Replit sync).

## Migration changelog

Chronological log of every migration that creates a table or function. Timestamps are the file prefix (UTC).

| Date | Tables added | Functions added |
|------|-------------|-----------------|
| 2026-05-21 02:57 | generations | — |
| 2026-05-22 01:25 | credit_ledger,payments,profiles | deduct_credits,grant_credits,handle_new_user,touch_updated_at |
| 2026-05-22 01:25 | — | touch_updated_at |
| 2026-05-24 00:30 | user_roles | app_role,handle_new_user |
| 2026-05-25 01:32 | events | — |
| 2026-05-25 03:20 | gift_cards,provider_logs | — |
| 2026-05-25 03:28 | contact_messages,legal_acceptances | — |
| 2026-05-25 03:34 | affiliate_events,affiliates,gpu_workers,worker_jobs,workflows | — |
| 2026-05-28 02:09 | leads | — |
| 2026-05-29 01:20 | — | handle_new_user |
| 2026-05-30 00:28 | lipsync_jobs | — |
| 2026-05-31 16:00 | affiliate_events,affiliates,contact_messages,credit_ledger,events,generations,gift_cards,gpu_workers,leads,legal_acceptances,lipsync_jobs,payments,profiles,provider_logs,user_roles,worker_jobs,workflows | app_role,deduct_credits,grant_credits,handle_new_user,touch_updated_at |
| 2026-06-04 14:51 | email_log | — |
| 2026-06-11 06:37 | user_webhooks | — |
| 2026-06-12 03:01 | affiliate_events,affiliates,contact_messages,credit_ledger,email_log,events,generations,gift_cards,gpu_workers,leads,legal_acceptances,lipsync_jobs,payments,profiles,provider_logs,user_roles,user_webhooks,worker_jobs,workflows | app_role,deduct_credits,grant_credits,handle_new_user,touch_updated_at |
| 2026-06-12 03:28 | — | has_role |
| 2026-06-12 05:00 | smoke_checks,smoke_runs | — |
| 2026-06-12 07:26 | api_keys,cli_device_codes | — |
| 2026-06-13 16:53 | spin_jobs,spin_variants | — |
| 2026-06-18 02:12 | jobs,tiktok_remixes | claim_next_job,commit_reservation,create_generation_and_reserve,release_reservation,reserve_credits |
| 2026-06-26 12:00 | avatars | — |
| 2026-06-26 13:00 | — | gpu_worker_inflight_dec,gpu_worker_inflight_inc |
| 2026-06-27 01:00 | agent_sessions | — |
| 2026-06-28 00:00 | comfy_runs,comfy_workflows | — |
| 2026-06-29 00:00 | scheduler_heartbeats | reset_stale_processing_jobs |
| 2026-06-29 01:00 | — | requeue_failed_job |
| 2026-06-29 02:00 | app_settings | — |
| 2026-06-29 02:00 | kids_stories | — |
| 2026-06-30 12:00 | cm_batch_items,cm_batches,cm_products,cm_templates | — |
| 2026-07-01 00:00 | subscriptions | activate_pro_subscription,deactivate_pro_subscription,grant_monthly_aura,set_generation_watermark_from_plan,set_job_priority_from_plan |
| 2026-07-01 00:00 | — | grant_monthly_aura |
| 2026-07-01 00:00 | — | grant_free_monthly_aura_all |
| 2026-07-02 00:00 | — | set_job_priority_from_plan |
| 2026-07-02 00:00 | — | set_job_priority_from_plan |
| 2026-07-02 12:00 | — | claim_next_job_v |
| 2026-07-03 02:00 | marketplace_template_runs,marketplace_templates | marketplace_templates_set_updated_at |
| 2026-07-03 22:41 | — | gpu_worker_inflight_inc |
| 2026-07-03 23:15 | — | finalize_job |
| 2026-07-03 23:30 | — | finalize_job,reconcile_stuck_reservation |
| 2026-07-04 00:00 | growth_tool_runs | — |
| 2026-07-04 01:00 | worker_register_attempts | — |
| 2026-07-04 02:00 | — | claim_next_job,claim_next_job_v |
| 2026-07-04 04:00 | owner_withdrawals | — |
| 2026-07-04 05:00 | promo_code_redemptions,promo_codes | — |
| 2026-07-05 08:41 | — | claim_onboarding_bonus |
| 2026-07-07 09:00 | guided_workflows | guided_workflows_set_updated_at |
| 2026-07-08 00:00 | agent_chat_messages,agent_user_memory | — |
| 2026-07-09 00:00 | consent_logs | — |
| 2026-07-09 01:00 | — | reset_stale_processing_jobs_for_kinds |
| 2026-07-09 02:00 | — | reserve_credits |
| 2026-07-10 10:00 | aurora_templates | — |
| 2026-07-11 12:00 | user_photo_avatars | — |
| 2026-07-13 12:00 | site_images | — |
| 2026-07-13 14:00 | — | finalize_marketplace_run,finalize_sync_render |
| 2026-07-18 01:25 | contact_messages,generations,profiles,site_content,user_roles,waitlist | claim_first_admin,handle_new_user,has_role |
| 2026-07-18 11:34 | affiliate_events,affiliates,contact_messages,credit_ledger,events,generations,gift_cards,gpu_workers,leads,legal_acceptances,lipsync_jobs,payments,profiles,provider_logs,user_roles,worker_jobs,workflows | app_role,deduct_credits,grant_credits,handle_new_user,touch_updated_at |
| 2026-07-18 11:53 | affiliate_events,affiliates,contact_messages,credit_ledger,events,generations,gift_cards,gpu_workers,leads,legal_acceptances,lipsync_jobs,payments,profiles,provider_logs,user_roles,worker_jobs,workflows | app_role,deduct_credits,grant_credits,handle_new_user,touch_updated_at |
| 2026-07-18 11:57 | smoke_checks,smoke_runs | has_role |
| 2026-07-18 11:58 | api_keys,cli_device_codes,jobs,spin_jobs,spin_variants,tiktok_remixes | claim_next_job,commit_reservation,create_generation_and_reserve,release_reservation,reserve_credits |
| 2026-07-18 11:58 | agent_sessions,avatars | gpu_worker_inflight_dec,gpu_worker_inflight_inc |
| 2026-07-18 11:59 | comfy_runs,comfy_workflows,scheduler_heartbeats | reset_stale_processing_jobs |
| 2026-07-18 11:59 | agent_chat_messages,agent_user_memory,consent_logs | — |
| 2026-07-18 12:00 | tiktok_accounts,tiktok_posts | set_tiktok_updated_at |
| 2026-07-18 12:01 | email_log | — |
| 2026-07-18 12:03 | app_settings,kids_stories | requeue_failed_job |
| 2026-07-18 12:04 | cm_batch_items,cm_batches,cm_products,cm_templates | — |
| 2026-07-18 12:05 | — | claim_next_job_v,set_job_priority_from_plan |
| 2026-07-18 12:06 | user_webhooks | — |
| 2026-07-18 12:25 | aurora_templates,growth_tool_runs,guided_workflows,marketplace_template_runs,marketplace_templates,owner_withdrawals,promo_code_redemptions,promo_codes,site_images,subscriptions,user_photo_avatars,worker_register_attempts | activate_pro_subscription,claim_next_job_v,deactivate_pro_subscription,finalize_job,finalize_marketplace_run,gpu_worker_inflight_inc_cap,grant_free_monthly_aura_all,grant_monthly_aura,reconcile_stuck_reservations,set_generation_watermark_from_plan |
| 2026-07-18 13:38 | — | finalize_sync_render |
| 2026-07-22 19:53 | affiliate_events,affiliates,generations,gift_cards,profiles,user_roles,user_webhooks | app_role,claim_first_admin,handle_new_user,touch_updated_at |
| 2026-07-23 10:52 | agent_sessions,jobs,owner_withdrawals,payments,scheduler_heartbeats | touch_updated_at |
| 2026-07-23 11:26 | api_keys,avatars,cm_batches,cm_products,cm_templates,cm_videos,comfy_runs,contact_messages,credit_ledger,leads,promo_codes,site_content,spin_jobs,subscriptions,tiktok_jobs,user_roles,waitlist,workflows | claim_first_admin,deduct_credits,grant_credits,has_role,touch_updated_at |
| 2026-07-23 11:29 | admin_asset_packs,agent_chat_messages,agent_user_memory,api_balance_alerts,app_settings,aurora_templates,cli_device_codes,cm_batch_items,comfy_workflows,consent_logs,email_log,events,gpu_workers,growth_tool_runs,guided_workflows,kids_stories,legal_acceptances,lipsync_jobs,marketplace_template_runs,marketplace_templates,promo_code_redemptions,provider_logs,site_images,smoke_checks,smoke_runs,spin_variants,studio,tiktok_accounts,tiktok_posts,tiktok_remixes,user_assets,user_photo_avatars,worker_jobs,worker_register_attempts | — |
