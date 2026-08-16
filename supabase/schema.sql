-- Product foundation schema.
-- Run in the Supabase SQL editor before using the app.
-- Clients never write readiness_screening directly:
-- complete_onboarding derives `cleared`.

create extension if not exists "pgcrypto";


-- =========================================================
-- PROFILES
-- =========================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text check (name is null or char_length(trim(name)) between 1 and 80),
  age int check (age is null or age between 13 and 120),
  height_cm numeric check (height_cm is null or height_cm between 50 and 300),
  weight_kg numeric check (weight_kg is null or weight_kg between 20 and 500),
  sex text check (sex is null or char_length(trim(sex)) between 1 and 40),
  experience_level text check (
    experience_level in ('beginner','intermediate','advanced')
  ),
  units text not null default 'metric' check (
    units in ('metric','imperial')
  ),
  created_at timestamptz not null default now()
);


-- =========================================================
-- TRAINING PREFERENCES
-- =========================================================

create table if not exists training_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  goal text not null check (
    goal in (
      'build_muscle',
      'lose_fat',
      'improve_strength',
      'improve_endurance',
      'general_fitness',
      'mobility'
    )
  ),
  equipment text[] not null check (
    cardinality(equipment) between 1 and 6
  ),
  workout_location text not null check (
    workout_location in ('gym','home','outdoor')
  ),
  days_per_week int not null check (
    days_per_week between 1 and 7
  ),
  session_duration_minutes int not null check (
    session_duration_minutes between 10 and 180
  ),
  updated_at timestamptz not null default now()
);


-- =========================================================
-- READINESS SCREENING
-- =========================================================

create table if not exists readiness_screening (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parq_answers jsonb not null,
  cleared boolean not null default false,
  professional_clearance_ack boolean not null default false,
  created_at timestamptz not null default now(),

  check (
    jsonb_typeof(parq_answers) = 'object'
  ),

  check (
    cleared = (
      not (
        parq_answers @> '{"chestPain": true}'::jsonb
        or parq_answers @> '{"dizziness": true}'::jsonb
        or parq_answers @> '{"jointProblem": true}'::jsonb
        or parq_answers @> '{"cardiacMedication": true}'::jsonb
        or parq_answers @> '{"doctorRestriction": true}'::jsonb
        or parq_answers @> '{"pregnancy": true}'::jsonb
        or parq_answers @> '{"otherReason": true}'::jsonb
      )
      or professional_clearance_ack
    )
  )
);


-- =========================================================
-- CONTRAINDICATIONS
-- =========================================================

create table if not exists contraindications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body_part text not null check (
    char_length(trim(body_part)) between 1 and 80
  ),
  severity text not null check (
    severity in ('avoid_entirely','manage_around')
  ),
  note text check (
    note is null or char_length(note) <= 1000
  ),
  created_at timestamptz not null default now()
);


-- =========================================================
-- EXERCISES
-- =========================================================

create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  primary_muscle text,
  secondary_muscles text[],
  equipment text[],
  body_parts_loaded text[],
  difficulty text check (
    difficulty in ('beginner','intermediate','advanced')
  ),
  instructions text,
  common_mistakes text,
  animation_url text,
  video_url text,
  thumbnail_url text,
  tags text[]
);

alter table exercises
  add column if not exists movement_pattern text
  check (
    movement_pattern in (
      'squat',
      'hinge',
      'horizontal_push',
      'horizontal_pull',
      'vertical_push',
      'vertical_pull',
      'lunge',
      'carry',
      'core',
      'mobility'
    )
  );

alter table exercises
  add column if not exists is_compound boolean
  not null default false;

alter table exercises
  add column if not exists estimated_minutes int
  not null default 5
  check (estimated_minutes between 1 and 30);


-- =========================================================
-- WORKOUT PLANS
-- =========================================================

create table if not exists workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal text,
  days_per_week int check (
    days_per_week between 1 and 7
  ),
  created_at timestamptz not null default now()
);

alter table workout_plans
  add column if not exists experience_level text
  check (
    experience_level in ('beginner','intermediate','advanced')
  );

alter table workout_plans
  add column if not exists equipment_snapshot text[];

alter table workout_plans
  add column if not exists session_duration_minutes int
  check (
    session_duration_minutes between 10 and 180
  );

alter table workout_plans
  add column if not exists generator_version text;


-- =========================================================
-- WORKOUT DAYS
-- =========================================================

create table if not exists workout_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references workout_plans(id) on delete cascade,
  day_number int not null check (
    day_number >= 1
  ),
  focus text
);

alter table workout_days
  add column if not exists estimated_duration_minutes int
  check (
    estimated_duration_minutes between 1 and 180
  );


-- =========================================================
-- WORKOUT EXERCISES
-- =========================================================

create table if not exists workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_day_id uuid not null references workout_days(id) on delete cascade,
  exercise_id uuid references exercises(id),
  exercise_name_snapshot text,
  instructions_snapshot text,
  sets int check (
    sets is null or sets >= 0
  ),
  rep_min int check (
    rep_min is null or rep_min >= 0
  ),
  rep_max int check (
    rep_max is null or rep_max >= 0
  ),
  rest_seconds int check (
    rest_seconds is null or rest_seconds >= 0
  ),
  order_index int check (
    order_index is null or order_index >= 0
  ),
  check (
    rep_min is null
    or rep_max is null
    or rep_max >= rep_min
  )
);


-- =========================================================
-- WORKOUT SESSIONS
-- =========================================================

create table if not exists workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_day_id uuid references workout_days(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text,

  check (
    completed_at is null
    or completed_at >= started_at
  )
);

alter table workout_sessions
  add column if not exists status text
  not null default 'in_progress'
  check (
    status in ('in_progress','completed','abandoned')
  );

alter table workout_sessions
  add column if not exists skipped_exercise_ids uuid[]
  not null default '{}';


-- =========================================================
-- EXERCISE SETS
-- =========================================================

create table if not exists exercise_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workout_sessions(id) on delete cascade,
  workout_exercise_id uuid references workout_exercises(id),
  set_number int check (
    set_number is null or set_number >= 1
  ),
  weight_kg numeric check (
    weight_kg is null or weight_kg >= 0
  ),
  reps int check (
    reps is null or reps >= 0
  ),
  rpe numeric check (
    rpe is null or rpe between 0 and 10
  )
);

alter table exercise_sets
  add column if not exists target_reps int
  check (
    target_reps is null or target_reps >= 0
  );

alter table exercise_sets
  add column if not exists status text
  not null default 'completed'
  check (
    status in ('completed','skipped')
  );

alter table exercise_sets
  add column if not exists completed_at timestamptz
  not null default now();


-- =========================================================
-- AI USAGE
-- =========================================================

create table if not exists ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  message_count int not null default 0 check (
    message_count >= 0
  ),
  token_count int not null default 0 check (
    token_count >= 0
  ),
  unique (user_id, usage_date)
);


-- =========================================================
-- COACH ESCALATIONS
-- =========================================================

create table if not exists coach_escalations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trigger_type text not null,
  user_message_excerpt text,
  created_at timestamptz not null default now()
);


-- =========================================================
-- COACH CONVERSATIONS
-- =========================================================

create table if not exists coach_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================================
-- COACH MESSAGES
-- =========================================================

create table if not exists coach_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references coach_conversations(id) on delete cascade,
  role text not null check (
    role in ('user','assistant','system')
  ),
  message text not null check (
    char_length(message) between 1 and 2000
  ),
  created_at timestamptz not null default now()
);


-- =========================================================
-- INDEXES
-- =========================================================

create index if not exists readiness_screening_user_created_idx
  on readiness_screening (user_id, created_at desc);

create index if not exists contraindications_user_idx
  on contraindications (user_id);

create index if not exists workout_plans_user_idx
  on workout_plans (user_id);

create index if not exists workout_days_plan_idx
  on workout_days (plan_id);

create index if not exists workout_exercises_day_idx
  on workout_exercises (workout_day_id);

create index if not exists workout_sessions_user_idx
  on workout_sessions (user_id);

create index if not exists exercise_sets_session_idx
  on exercise_sets (session_id);

create index if not exists ai_usage_user_date_idx
  on ai_usage (user_id, usage_date);

create index if not exists coach_escalations_user_created_idx
  on coach_escalations (user_id, created_at desc);

create index if not exists coach_conversations_user_updated_idx
  on coach_conversations (user_id, updated_at desc);

create index if not exists coach_messages_conversation_created_idx
  on coach_messages (conversation_id, created_at);


-- =========================================================
-- AUTH USER PROFILE TRIGGER
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  insert into public.profiles (
    id,
    name
  )
  values (
    new.id,
    nullif(
      trim(
        coalesce(
          new.raw_user_meta_data ->> 'name',
          ''
        )
      ),
      ''
    )
  )
  on conflict (id) do nothing;

  return new;

end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();


-- =========================================================
-- COMPLETE ONBOARDING
-- =========================================================

-- Self-attested clearance is not medical verification.
-- This function is the only client path that can write readiness results.

create or replace function public.complete_onboarding(
  p_name text,
  p_age int,
  p_height_cm numeric,
  p_weight_kg numeric,
  p_sex text,
  p_units text,
  p_goal text,
  p_experience_level text,
  p_equipment text[],
  p_workout_location text,
  p_days_per_week int,
  p_session_duration_minutes int,
  p_parq_answers jsonb,
  p_professional_clearance_ack boolean,
  p_contraindications jsonb default '[]'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare

  v_user_id uuid := auth.uid();

  v_flagged boolean;

  v_item jsonb;

  v_required_keys text[] := array[
    'chestPain',
    'dizziness',
    'jointProblem',
    'cardiacMedication',
    'doctorRestriction',
    'pregnancy',
    'otherReason'
  ];

begin

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;


  if p_name is null
     or char_length(trim(p_name)) not between 1 and 80 then
    raise exception 'Invalid name';
  end if;


  if p_age is null
     or p_age not between 13 and 120 then
    raise exception 'Invalid age';
  end if;


  if p_height_cm is null
     or p_height_cm not between 50 and 300
     or p_weight_kg is null
     or p_weight_kg not between 20 and 500 then
    raise exception 'Invalid measurements';
  end if;


  if p_units not in ('metric','imperial')
     or p_experience_level not in (
       'beginner',
       'intermediate',
       'advanced'
     ) then
    raise exception 'Invalid profile options';
  end if;


  if p_goal not in (
    'build_muscle',
    'lose_fat',
    'improve_strength',
    'improve_endurance',
    'general_fitness',
    'mobility'
  ) then
    raise exception 'Invalid goal';
  end if;


  if p_workout_location not in (
       'gym',
       'home',
       'outdoor'
     )
     or p_days_per_week not between 1 and 7
     or p_session_duration_minutes not between 10 and 180 then
    raise exception 'Invalid training preferences';
  end if;


  if p_equipment is null
     or cardinality(p_equipment) not between 1 and 6
     or exists (
       select 1
       from unnest(p_equipment) e
       where e not in (
         'full_gym',
         'dumbbells',
         'barbell',
         'resistance_bands',
         'bodyweight',
         'home_gym'
       )
     ) then
    raise exception 'Invalid equipment';
  end if;


  if jsonb_typeof(p_parq_answers) <> 'object'
     or (
       select array_agg(key order by key)
       from jsonb_object_keys(p_parq_answers) key
     ) <> (
       select array_agg(key order by key)
       from unnest(v_required_keys) key
     ) then
    raise exception 'All readiness answers are required';
  end if;


  if exists (
    select 1
    from jsonb_each(p_parq_answers) x
    where jsonb_typeof(x.value) <> 'boolean'
  ) then
    raise exception 'Readiness answers must be boolean';
  end if;


  if jsonb_typeof(p_contraindications) <> 'array' then
    raise exception 'Invalid contraindications';
  end if;


  for v_item in
    select value
    from jsonb_array_elements(p_contraindications)
  loop

    if jsonb_typeof(v_item) <> 'object'
       or coalesce(
            char_length(
              trim(v_item ->> 'body_part')
            ),
            0
          ) not between 1 and 80
       or v_item ->> 'severity'
          not in (
            'avoid_entirely',
            'manage_around'
          )
       or char_length(
            coalesce(
              v_item ->> 'note',
              ''
            )
          ) > 1000 then

      raise exception 'Invalid contraindication';

    end if;

  end loop;


  v_flagged :=
       p_parq_answers @> '{"chestPain": true}'::jsonb
    or p_parq_answers @> '{"dizziness": true}'::jsonb
    or p_parq_answers @> '{"jointProblem": true}'::jsonb
    or p_parq_answers @> '{"cardiacMedication": true}'::jsonb
    or p_parq_answers @> '{"doctorRestriction": true}'::jsonb
    or p_parq_answers @> '{"pregnancy": true}'::jsonb
    or p_parq_answers @> '{"otherReason": true}'::jsonb;


  insert into public.profiles (
    id,
    name,
    age,
    height_cm,
    weight_kg,
    sex,
    experience_level,
    units
  )
  values (
    v_user_id,
    trim(p_name),
    p_age,
    p_height_cm,
    p_weight_kg,
    nullif(trim(p_sex), ''),
    p_experience_level,
    p_units
  )
  on conflict (id)
  do update set
    name = excluded.name,
    age = excluded.age,
    height_cm = excluded.height_cm,
    weight_kg = excluded.weight_kg,
    sex = excluded.sex,
    experience_level = excluded.experience_level,
    units = excluded.units;


  insert into public.training_preferences (
    user_id,
    goal,
    equipment,
    workout_location,
    days_per_week,
    session_duration_minutes
  )
  values (
    v_user_id,
    p_goal,
    p_equipment,
    p_workout_location,
    p_days_per_week,
    p_session_duration_minutes
  )
  on conflict (user_id)
  do update set
    goal = excluded.goal,
    equipment = excluded.equipment,
    workout_location = excluded.workout_location,
    days_per_week = excluded.days_per_week,
    session_duration_minutes = excluded.session_duration_minutes,
    updated_at = now();


  delete from public.contraindications
  where user_id = v_user_id;


  insert into public.contraindications (
    user_id,
    body_part,
    severity,
    note
  )
  select
    v_user_id,
    trim(value ->> 'body_part'),
    value ->> 'severity',
    nullif(
      trim(value ->> 'note'),
      ''
    )
  from jsonb_array_elements(
    p_contraindications
  );


  insert into public.readiness_screening (
    user_id,
    parq_answers,
    cleared,
    professional_clearance_ack
  )
  values (
    v_user_id,
    p_parq_answers,
    not v_flagged
      or p_professional_clearance_ack,
    v_flagged
      and p_professional_clearance_ack
  );


  return not v_flagged
    or p_professional_clearance_ack;

end;
$$;


-- IMPORTANT:
-- 15 parameters, including p_experience_level.

revoke all on function public.complete_onboarding(
  text,
  int,
  numeric,
  numeric,
  text,
  text,
  text,
  text,
  text[],
  text,
  int,
  int,
  jsonb,
  boolean,
  jsonb
) from public;

grant execute on function public.complete_onboarding(
  text,
  int,
  numeric,
  numeric,
  text,
  text,
  text,
  text,
  text[],
  text,
  int,
  int,
  jsonb,
  boolean,
  jsonb
) to authenticated;


-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table profiles enable row level security;

alter table training_preferences enable row level security;

alter table readiness_screening enable row level security;

alter table contraindications enable row level security;

alter table exercises enable row level security;

alter table workout_plans enable row level security;

alter table workout_days enable row level security;

alter table workout_exercises enable row level security;

alter table workout_sessions enable row level security;

alter table exercise_sets enable row level security;

alter table ai_usage enable row level security;

alter table coach_escalations enable row level security;

alter table coach_conversations enable row level security;

alter table coach_messages enable row level security;


-- Remove old policies

drop policy if exists "own profile"
on profiles;

drop policy if exists "own preferences"
on training_preferences;

drop policy if exists "own readiness"
on readiness_screening;

drop policy if exists "read own readiness"
on readiness_screening;

drop policy if exists "own contraindications"
on contraindications;

drop policy if exists "read exercises"
on exercises;

drop policy if exists "own plans"
on workout_plans;

drop policy if exists "own workout days"
on workout_days;

drop policy if exists "own workout exercises"
on workout_exercises;

drop policy if exists "own sessions"
on workout_sessions;

drop policy if exists "own exercise sets"
on exercise_sets;

drop policy if exists "own ai usage"
on ai_usage;

drop policy if exists "own escalations"
on coach_escalations;


-- Profile

create policy "own profile"
on profiles
for all
using (
  auth.uid() = id
)
with check (
  auth.uid() = id
);


-- Training preferences

create policy "own preferences"
on training_preferences
for all
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);


-- Readiness

create policy "read own readiness"
on readiness_screening
for select
using (
  auth.uid() = user_id
);


-- Contraindications

create policy "own contraindications"
on contraindications
for all
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);


-- Exercises are readable by authenticated users

create policy "read exercises"
on exercises
for select
using (
  true
);


-- Workout plans

create policy "own plans"
on workout_plans
for all
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);


-- Workout days

create policy "own workout days"
on workout_days
for all
using (
  exists (
    select 1
    from workout_plans p
    where p.id = plan_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from workout_plans p
    where p.id = plan_id
      and p.user_id = auth.uid()
  )
);


-- Workout exercises

create policy "own workout exercises"
on workout_exercises
for all
using (
  exists (
    select 1
    from workout_days d
    join workout_plans p
      on p.id = d.plan_id
    where d.id = workout_day_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from workout_days d
    join workout_plans p
      on p.id = d.plan_id
    where d.id = workout_day_id
      and p.user_id = auth.uid()
  )
);


-- Workout sessions

create policy "own sessions"
on workout_sessions
for all
using (
  auth.uid() = user_id
  and (
    workout_day_id is null
    or exists (
      select 1
      from workout_days d
      join workout_plans p
        on p.id = d.plan_id
      where d.id = workout_day_id
        and p.user_id = auth.uid()
    )
  )
)
with check (
  auth.uid() = user_id
  and (
    workout_day_id is null
    or exists (
      select 1
      from workout_days d
      join workout_plans p
        on p.id = d.plan_id
      where d.id = workout_day_id
        and p.user_id = auth.uid()
    )
  )
);


-- Exercise sets

create policy "own exercise sets"
on exercise_sets
for all
using (
  exists (
    select 1
    from workout_sessions s
    where s.id = session_id
      and s.user_id = auth.uid()
  )
  and (
    workout_exercise_id is null
    or exists (
      select 1
      from workout_exercises we
      join workout_days d
        on d.id = we.workout_day_id
      join workout_plans p
        on p.id = d.plan_id
      where we.id = workout_exercise_id
        and p.user_id = auth.uid()
    )
  )
)
with check (
  exists (
    select 1
    from workout_sessions s
    where s.id = session_id
      and s.user_id = auth.uid()
  )
  and (
    workout_exercise_id is null
    or exists (
      select 1
      from workout_exercises we
      join workout_days d
        on d.id = we.workout_day_id
      join workout_plans p
        on p.id = d.plan_id
      where we.id = workout_exercise_id
        and p.user_id = auth.uid()
    )
  )
);


-- AI usage is read-only to the browser

create policy "read own ai usage"
on ai_usage
for select
using (
  auth.uid() = user_id
);


-- Coach escalations are read-only to the browser

create policy "read own escalations"
on coach_escalations
for select
using (
  auth.uid() = user_id
);


-- Coach conversations

create policy "own conversations"
on coach_conversations
for all
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);


-- Coach messages

create policy "own messages"
on coach_messages
for all
using (
  exists (
    select 1
    from coach_conversations c
    where c.id = conversation_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from coach_conversations c
    where c.id = conversation_id
      and c.user_id = auth.uid()
  )
);


-- =========================================================
-- SECURITY DEFINER FUNCTION PERMISSIONS
-- =========================================================

revoke all on function public.handle_new_user()
from public;


-- =========================================================
-- ATOMIC WORKOUT PLAN PERSISTENCE
-- =========================================================

-- Atomic, authenticated persistence for deterministic plans.
-- PostgreSQL rolls back every nested insert if any validation
-- or insert fails.

create or replace function public.persist_generated_workout_plan(
  p_generator_version text,
  p_days jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare

  v_user uuid := auth.uid();

  v_plan uuid;

  v_day jsonb;

  v_exercise jsonb;

  v_day_id uuid;

  v_goal text;

  v_days_per_week int;

  v_duration int;

  v_experience text;

  v_equipment text[];

begin

  if v_user is null then
    raise exception 'Authentication required';
  end if;


  select
    goal,
    days_per_week,
    session_duration_minutes,
    equipment
  into
    v_goal,
    v_days_per_week,
    v_duration,
    v_equipment
  from public.training_preferences
  where user_id = v_user;


  select experience_level
  into v_experience
  from public.profiles
  where id = v_user;


  if v_goal is null
     or v_experience is null then
    raise exception 'Complete onboarding first';
  end if;


  if (
    select r.cleared
    from public.readiness_screening r
    where r.user_id = v_user
    order by r.created_at desc
    limit 1
  ) is not true then
    raise exception 'Readiness clearance required';
  end if;


  if jsonb_typeof(p_days) <> 'array'
     or jsonb_array_length(p_days) <> v_days_per_week then
    raise exception 'Invalid workout days';
  end if;


  insert into public.workout_plans (
    user_id,
    goal,
    days_per_week,
    experience_level,
    equipment_snapshot,
    session_duration_minutes,
    generator_version
  )
  values (
    v_user,
    v_goal,
    v_days_per_week,
    v_experience,
    v_equipment,
    v_duration,
    p_generator_version
  )
  returning id into v_plan;


  for v_day in
    select value
    from jsonb_array_elements(p_days)
  loop

    if coalesce(
         (v_day ->> 'estimated_duration_minutes')::int,
         0
       ) not between 1 and v_duration then

      raise exception 'Invalid day duration';

    end if;


    insert into public.workout_days (
      plan_id,
      day_number,
      focus,
      estimated_duration_minutes
    )
    values (
      v_plan,
      (v_day ->> 'day_number')::int,
      v_day ->> 'focus',
      (v_day ->> 'estimated_duration_minutes')::int
    )
    returning id into v_day_id;


    for v_exercise in
      select value
      from jsonb_array_elements(
        v_day -> 'exercises'
      )
    loop

      if not exists (
        select 1
        from public.exercises e
        where e.id = (
          v_exercise ->> 'exercise_id'
        )::uuid

        and case v_experience
          when 'beginner'
            then e.difficulty = 'beginner'

          when 'intermediate'
            then e.difficulty in (
              'beginner',
              'intermediate'
            )

          else
            e.difficulty in (
              'beginner',
              'intermediate',
              'advanced'
            )
        end

        and not exists (
          select 1
          from public.contraindications c
          where c.user_id = v_user
            and c.body_part = any(
              e.body_parts_loaded
            )
        )
      ) then

        raise exception 'Unsafe or unavailable exercise';

      end if;


      insert into public.workout_exercises (
        workout_day_id,
        exercise_id,
        exercise_name_snapshot,
        instructions_snapshot,
        sets,
        rep_min,
        rep_max,
        rest_seconds,
        order_index
      )
      values (
        v_day_id,
        (v_exercise ->> 'exercise_id')::uuid,
        v_exercise ->> 'name',
        v_exercise ->> 'instructions',
        (v_exercise ->> 'sets')::int,
        (v_exercise ->> 'rep_min')::int,
        (v_exercise ->> 'rep_max')::int,
        (v_exercise ->> 'rest_seconds')::int,
        (v_exercise ->> 'order_index')::int
      );

    end loop;

  end loop;


  return v_plan;

end;
$$;


revoke all on function public.persist_generated_workout_plan(
  text,
  jsonb
)
from public;

grant execute on function public.persist_generated_workout_plan(
  text,
  jsonb
)
to authenticated;


-- =========================================================
-- AI USAGE CONTROL
-- =========================================================

-- Server routes use these authenticated, user-scoped functions.
-- The limit is fixed in database code and is never supplied
-- by the browser.

create or replace function public.can_use_ai(
  p_limit int default 20
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select
    coalesce(
      (
        select message_count < p_limit
        from public.ai_usage
        where user_id = auth.uid()
          and usage_date = current_date
      ),
      true
    )
    and auth.uid() is not null;
$$;


create or replace function public.record_ai_usage()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin

  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;


  insert into public.ai_usage (
    user_id,
    usage_date,
    message_count,
    token_count
  )
  values (
    auth.uid(),
    current_date,
    1,
    0
  )
  on conflict (
    user_id,
    usage_date
  )
  do update set
    message_count =
      public.ai_usage.message_count + 1;

end;
$$;


revoke all on function public.can_use_ai(int)
from public;

grant execute on function public.can_use_ai(int)
to authenticated;


revoke all on function public.record_ai_usage()
from public;

grant execute on function public.record_ai_usage()
to authenticated;