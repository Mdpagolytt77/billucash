
UPDATE site_settings 
SET offerwall_settings = jsonb_set(
  offerwall_settings,
  '{offerwalls}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN elem->>'id' = '1766626579038' 
        THEN jsonb_set(elem, '{iframeUrl}', '"https://notik.me/coins?api_key=UHG9XwxbMCe80St1fjdiFRZRh8fAqJhX&pub_id=R8Yo4E&app_id=3VgSKty9T9&user_id={user_id}"')
        ELSE elem
      END
    )
    FROM jsonb_array_elements(offerwall_settings->'offerwalls') AS elem
  )
)
WHERE id = 'default';
