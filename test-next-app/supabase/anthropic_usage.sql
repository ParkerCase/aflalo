-- Table to track Anthropic API usage and cost
create table if not exists anthropic_usage (
  id serial primary key,
  total_input_tokens bigint default 0,
  total_output_tokens bigint default 0,
  total_cost numeric(10,4) default 0,
  updated_at timestamptz default now()
); 