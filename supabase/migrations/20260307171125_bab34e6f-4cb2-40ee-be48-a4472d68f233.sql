UPDATE site_settings 
SET offerwall_settings = jsonb_set(
  offerwall_settings,
  '{offerwalls}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN elem->>'name' = 'PlaytimeAds' 
        THEN jsonb_set(elem, '{iframeUrl}', '"https://web.playtimeads.com/index.php?app_id=FL9354DO7CI3DGK&user_id={user_id}"')
        ELSE elem
      END
    )
    FROM jsonb_array_elements(offerwall_settings->'offerwalls') AS elem
  )
)
WHERE id = 'default'