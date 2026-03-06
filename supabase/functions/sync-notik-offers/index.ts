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
    const apiSecret = Deno.env.get('NOTIK_SECRET_KEY');
    
    if (!apiKey) {
      console.error('NOTIK_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pubId = 'R8Yo4E';
    const appId = '3VgSKty9T9';

    // Try with api_key first, if 401 try with app_secret
    const apiUrls = [
      `https://notik.me/api/v2/get-offers/all?api_key=${apiKey}&pub_id=${pubId}&app_id=${appId}`,
      apiSecret ? `https://notik.me/api/v2/get-offers/all?api_key=${apiSecret}&pub_id=${pubId}&app_id=${appId}` : null,
    ].filter(Boolean) as string[];

    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    };

    console.log('=== Syncing Notik Offers ===');

    let allOffers: any[] = [];
    let workingUrl: string | null = null;

    // Try each API URL until one works
    for (const tryUrl of apiUrls) {
      const testRes = await fetch(tryUrl);
      const testText = await testRes.text();
      
      try {
        const testData = JSON.parse(testText);
        if (testData.status === 'error') {
          console.log(`URL failed: ${testData.message}`);
          continue;
        }
        workingUrl = tryUrl;
        
        // Parse the first page
        if (testData.offers && Array.isArray(testData.offers)) {
          allOffers = testData.offers;
        } else if (testData.data && Array.isArray(testData.data)) {
          allOffers = testData.data;
        } else if (Array.isArray(testData)) {
          allOffers = testData;
        } else {
          for (const key of Object.keys(testData)) {
            if (Array.isArray(testData[key]) && testData[key].length > 0) {
              allOffers = testData[key];
              break;
            }
          }
        }

        // Handle pagination
        let nextPageUrl = testData.next_page_url || null;
        let pageCount = 1;
        while (nextPageUrl && pageCount < 10) {
          pageCount++;
          const pageRes = await fetch(nextPageUrl);
          if (!pageRes.ok) break;
          const pageData = await pageRes.json();
          
          if (pageData.offers && Array.isArray(pageData.offers)) {
            allOffers = allOffers.concat(pageData.offers);
          } else if (pageData.data && Array.isArray(pageData.data)) {
            allOffers = allOffers.concat(pageData.data);
          } else {
            for (const key of Object.keys(pageData)) {
              if (Array.isArray(pageData[key]) && pageData[key].length > 0) {
                allOffers = allOffers.concat(pageData[key]);
                break;
              }
            }
          }
          nextPageUrl = pageData.next_page_url || null;
        }

        break; // Found working URL
      } catch (e) {
        // If first page has offers in raw format
        if (allOffers.length === 0) {
          return new Response(JSON.stringify({ error: 'Parse failed', raw: testText.substring(0, 2000) }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    if (!workingUrl && allOffers.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'All API URLs failed - invalid credentials',
        tried: apiUrls.length,
        hint: 'Check api_key, pub_id, app_id in Notik App Details',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let pageCount = 1;

    // Old pagination loop removed - handled above

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
