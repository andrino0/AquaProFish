import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vpacdfqsntrbpknoitbi.supabase.co';
const supabasePublishableKey = 'sb_publishable_smpJtG_-O0P6F30xaJJH-Q_NhXwCcJl';

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
