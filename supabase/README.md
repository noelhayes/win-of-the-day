# Win of the Day - Supabase Schema

This directory contains the database schema and migrations for the Win of the Day application. The schema is designed to be simple, maintainable, and focused on the core features of sharing and celebrating daily wins.

## Schema Structure

The database schema is organized into logical files, each handling a specific aspect of the application:

1. `01_profiles.sql`: User profiles and authentication
   - Profiles table with basic user information
   - Automatic profile creation on user signup
   - RLS policies for profile access

2. `02_social.sql`: Social relationships
   - Follows system for connecting users
   - One-way follow relationships (like Twitter/Instagram)
   - RLS policies for follow management

3. `03_posts.sql`: Posts and interactions
   - Posts table for sharing wins
   - Likes for engaging with posts
   - Post images support
   - RLS policies for post privacy

4. `04_categories.sql`: Win categorization
   - Predefined win categories
   - Post categorization system
   - Default categories (Health, Work, etc.)
   - RLS policies for categories

5. `05_habits.sql`: Habits and tracking
   - Habits table for recurring wins
   - Habit completion tracking
   - RLS policies for habit privacy

6. `06_storage.sql`: File storage
   - Storage bucket for post images
   - Security policies for file access

## Security Model

- Row Level Security (RLS) is enabled on all tables
- Each table has specific policies for:
  - SELECT: Who can view the data
  - INSERT: Who can create new records
  - UPDATE: Who can modify existing records
  - DELETE: Who can remove records

## Making Schema Changes

When making changes to the schema, follow these guidelines:

1. Create a new migration file in the `examples/` directory
2. Name it following the pattern: `YYYYMMDD_XX_description.sql`
3. Include both `up.sql` (changes) and `down.sql` (rollback)
4. Test migrations locally before applying to production
5. Document changes in this README

## Common Operations

### Adding a New Table
```sql
-- Create the table
create table if not exists public.new_table (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc', now()) not null
);

-- Enable RLS
alter table public.new_table enable row level security;

-- Create policies
create policy "Policy name"
    on new_table for select
    using (true);
```

### Modifying an Existing Table
```sql
-- Add a column
alter table public.existing_table
add column if not exists new_column text;

-- Add a constraint
alter table public.existing_table
add constraint constraint_name check (condition);

-- Create an index
create index if not exists idx_name
on public.existing_table(column_name);
```

### Adding RLS Policies
```sql
-- Basic select policy
create policy "Select policy"
    on table_name for select
    using (true);

-- Owner-only policy
create policy "Owner only"
    on table_name for all
    using (auth.uid() = user_id);
```

## Development Workflow

1. Make changes in a development environment first
2. Test thoroughly with sample data
3. Create migration files in `examples/`
4. Apply migrations to staging
5. Test in staging environment
6. Apply to production during low-traffic periods

## Best Practices

1. Always enable RLS on new tables
2. Include appropriate indexes for foreign keys
3. Add appropriate constraints to ensure data integrity
4. Document all changes in migration files
5. Keep migrations atomic and focused
6. Include rollback instructions in `down.sql`
7. Test both applying and rolling back migrations
