import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apiKey = Deno.env.get('NOTIK_API_KEY');
    
    if (!apiKey) {
      console.error('NOTIK_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pubId = 'R8Yo4E';
    const appId = '3VgSKty9T9';

    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    };

    console.log('=== Syncing Notik Offers ===');

    let allOffers: any[] = [];
    let nextPageUrl: string | null = `https://notik.me/api/v2/get-offers/all?api_key=${apiKey}&pub_id=${pubId}&app_id=${appId}`;
    let pageCount = 0;
    const maxPages = 10; // Safety limit

    // Paginate through all offers
    while (nextPageUrl && pageCount < maxPages) {
      pageCount++;
      console.log(`Fetching page ${pageCount}: ${nextPageUrl}`);

      let res;
      try {
        res = await fetch(nextPageUrl);
      } catch (fetchErr) {
        console.error('Fetch error:', fetchErr);
        return new Response(JSON.stringify({ error: 'Fetch failed', detail: String(fetchErr), url: nextPageUrl }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log(`Response status: ${res.status}`);
      if (!res.ok) {
        const errText = await res.text();
        console.error(`Notik API error: ${res.status} ${errText}`);
        return new Response(JSON.stringify({ error: 'API error', status: res.status, body: errText.substring(0, 500) }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const rawText = await res.text();
      console.log(`Raw response length: ${rawText.length}`);
      console.log(`Raw response preview: ${rawText.substring(0, 500)}`);
      
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        break;
      }

      // Log all top-level keys to understand the structure
      console.log('Response keys:', Object.keys(data));
      
      if (data.offers && Array.isArray(data.offers)) {
        allOffers = allOffers.concat(data.offers);
      } else if (data.data && Array.isArray(data.data)) {
        allOffers = allOffers.concat(data.data);
      } else if (Array.isArray(data)) {
        allOffers = allOffers.concat(data);
      } else {
        // Try to find any array in the response
        for (const key of Object.keys(data)) {
          if (Array.isArray(data[key]) && data[key].length > 0) {
            console.log(`Found offer array in key: ${key}, count: ${data[key].length}`);
            allOffers = allOffers.concat(data[key]);
            break;
          }
        }
      }

      nextPageUrl = data.next_page_url || null;
    }

    console.log(`Total offers fetched: ${allOffers.length}`);

    if (allOffers.length === 0) {
      return new Response(JSON.stringify({ success: true, synced: 0, message: 'No offers found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark all existing offers as inactive first
    await fetch(
      `${supabaseUrl}/rest/v1/notik_offers?is_active=eq.true`,
      {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ is_active: false, updated_at: new Date().toISOString() }),
      }
    );

    // Upsert offers in batches of 50
    const batchSize = 50;
    let syncedCount = 0;

    for (let i = 0; i < allOffers.length; i += batchSize) {
      const batch = allOffers.slice(i, i + batchSize);
      
      const records = batch.map((offer: any) => {
        const offerId = String(offer.offer_id || offer.id || `notik_${Date.now()}_${Math.random()}`);
        const payoutUsd = parseFloat(offer.payout || offer.amount || '0') || 0;
        const coins = Math.round(payoutUsd * 500); // 500 coins = 1 USD

        return {
          id: offerId,
          name: offer.offer_name || offer.name || 'Notik Offer',
          description: offer.offer_desc || offer.description || '',
          image_url: offer.image_url || offer.icon_url || offer.thumbnail || null,
          click_url: offer.click_url || offer.tracking_url || offer.link || null,
          payout: payoutUsd,
          coins: coins,
          country: offer.country || offer.countries || null,
          platform: offer.platform || offer.os || offer.device || null,
          category: offer.category || offer.offer_type || null,
          is_active: true,
          updated_at: new Date().toISOString(),
        };
      });

      const upsertRes = await fetch(
        `${supabaseUrl}/rest/v1/notik_offers`,
        {
          method: 'POST',
          headers: { 
            ...headers, 
            'Prefer': 'return=minimal,resolution=merge-duplicates',
          },
          body: JSON.stringify(records),
        }
      );

      if (!upsertRes.ok) {
        const errText = await upsertRes.text();
        console.error(`Upsert batch failed: ${errText}`);
      } else {
        syncedCount += records.length;
        await upsertRes.text();
      }
    }

    console.log(`Synced ${syncedCount} offers successfully`);

    return new Response(JSON.stringify({ 
      success: true, 
      synced: syncedCount,
      total_fetched: allOffers.length,
      pages: pageCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
