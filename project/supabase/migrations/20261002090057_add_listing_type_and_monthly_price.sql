/*
# Aggiunta tipologia vendita/affitto e prezzo mensile

1. Modifiche a `properties`
- Aggiunta colonna `listing_type` (text): 'vendita' o 'affitto', default 'vendita'
- Aggiunta colonna `monthly_price` (numeric): prezzo mensile per affitto, null per vendita
2. Note
- Nessuna perdita di dati: solo nuove colonne con valori predefiniti
*/

ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_type text DEFAULT 'vendita';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS monthly_price numeric;