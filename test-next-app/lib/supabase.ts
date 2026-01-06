// This file is deprecated. Use 'lib/supabaseClient' for client components and 'lib/supabaseServer' for server components or API routes.

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createSupabaseClient = () => createClientComponentClient()

export const createSupabaseServerClient = () => 
  createRouteHandlerClient({ cookies })