# SemperFit V3 Full Tracker

This version wires the core tracker tabs to Supabase:

- Dashboard
- Workouts
- Macros
- Weigh-Ins + photo uploads
- Timeline

## Before deploying
Keep using the same Vercel environment variables:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

## Buckets / tables expected
- progress-photos bucket
- workouts
- nutrition_logs
- weigh_ins
- progress_photos
- timeline_events view

## Update flow
1. Unzip this package.
2. Open `semperfit_cloud_starter`.
3. Replace the files inside your GitHub repo's `semperfit_cloud_starter` folder.
4. Commit the changes.
5. Vercel will redeploy automatically.
