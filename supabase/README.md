# Database Management

This directory contains all the database-related files for the Win of the Day application.

## Directory Structure

```
supabase/
├── migrations/     # Database schema changes
├── storage/       # Storage bucket and policy setup
└── seeds/         # Initial and test data
```

## Migration Strategy

We follow these principles for database changes:

1. **Never drop tables** in production. Instead, use migrations to alter existing tables.
2. **Idempotent changes** - All scripts can be run multiple times safely
3. **Version control** - All database changes are tracked in git

### Making Database Changes

1. For new features requiring schema changes:
   - Create a new migration file in `migrations/` with format `NNNN_feature_name.sql`
   - Use `create table if not exists` for new tables
   - Use `alter table if exists` for modifying tables
   - Always use idempotent commands (check if changes exist before applying)

2. For storage changes:
   - Add new buckets and policies to `storage/setup.sql`
   - Use `if not exists` checks for all changes

3. For data changes:
   - Add to `seeds/` directory
   - Use `where not exists` for inserts

### Example Migration

```sql
-- Add new column
do $$
begin
    if not exists (
        select 1
        from information_schema.columns
        where table_name = 'my_table'
        and column_name = 'new_column'
    ) then
        alter table my_table add column new_column text;
    end if;
end
$$;
```

## Running Migrations

1. Run initial setup (only once):
   ```sql
   \i migrations/0001_initial_schema.sql
   \i storage/setup.sql
   \i seeds/initial_data.sql
   ```

2. For subsequent changes:
   - Run only the new migration files
   - Storage and seed files are safe to re-run
