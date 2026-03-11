UPDATE site_settings 
SET offerwall_settings = jsonb_set(
  offerwall_settings,
  '{offerwalls}',
  (offerwall_settings->'offerwalls') || '[{
    "id": "playtimeads_001",
    "name": "PlaytimeAds",
    "color": "#4CAF50",
    "apiKey": "FL9354DO7CI3DGK",
    "offers": [],
    "enabled": true,
    "provider": "custom",
    "iframeUrl": "https://web.playtimeads.com/index.php?app_id=FL9354DO7CI3DGK&user_id={user_id}",
    "secretKey": "QOAOLYH4OR37WFNXTRLQ3FFTE",
    "popupWidth": "3xl",
    "subIdParam": "user_id",
    "popupHeight": "80vh",
    "profitMargin": 50,
    "minimumPayout": 0,
    "popupAnimation": "scale",
    "popupBorderColor": "#ffffff",
    "popupBorderWidth": "1",
    "pointsConversionRate": 1000
  }]'::jsonb
),
updated_at = now()
WHERE id = 'default';