/*
# Tabella venditori con promemoria automatici

1. Nuova tabella `sellers`
- id (uuid, pk)
- user_id (uuid, proprietario, default auth.uid())
- first_name (text, nome)
- last_name (text, cognome)
- phone (text, telefono)
- email (text, email opzionale)
- property_type (text, tipo di immobile da vendere: casa, garage, capannone, hotel, appartamento, ecc.)
- property_address (text, indirizzo dell'immobile)
- property_city (text, città)
- property_sqm (numeric, metri quadrati)
- asking_price (numeric, prezzo richiesto)
- notes (text, note)
- status (text: da_contattare, contattato, in_valutazione, non_interessato, concluso)
- reminder_interval_days (integer, intervallo promemoria in giorni: 3, 7, 14, ecc.)
- reminder_enabled (boolean, promemoria attivo o no)
- last_contacted_at (timestamptz, ultima volta contattato)
- next_reminder_date (timestamptz, data prossimo promemoria)
- created_at (timestamptz)

2. Sicurezza
- RLS abilitato
- Politiche owner-scoped per SELECT/INSERT/UPDATE/DELETE
*/

CREATE TABLE IF NOT EXISTS sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  email text,
  property_type text,
  property_address text,
  property_city text,
  property_sqm numeric,
  asking_price numeric,
  notes text,
  status text DEFAULT 'da_contattare',
  reminder_interval_days integer,
  reminder_enabled boolean DEFAULT false,
  last_contacted_at timestamptz,
  next_reminder_date timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_sellers_next_reminder ON sellers(next_reminder_date);

ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sellers" ON sellers;
CREATE POLICY "select_own_sellers" ON sellers FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_sellers" ON sellers;
CREATE POLICY "insert_own_sellers" ON sellers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_sellers" ON sellers;
CREATE POLICY "update_own_sellers" ON sellers FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_sellers" ON sellers;
CREATE POLICY "delete_own_sellers" ON sellers FOR DELETE
  TO authenticated USING (auth.uid() = user_id);