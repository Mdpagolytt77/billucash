import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const OfferyPostbackProxy = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing postback...');

  useEffect(() => {
    const forwardToSupabase = async () => {
      try {
        // Build the query string from all URL parameters
        const queryString = searchParams.toString();
        
        // Get Supabase URL from environment
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const targetUrl = `${supabaseUrl}/functions/v1/offery-postback?${queryString}`;
        
        console.log('Forwarding postback to:', targetUrl);
        
        const response = await fetch(targetUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Postback processed successfully');
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to process postback');
        }
      } catch (error) {
        console.error('Proxy error:', error);
        setStatus('error');
        setMessage('Failed to forward postback');
      }
    };

    forwardToSupabase();
  }, [searchParams]);

  // Return plain text response for server-to-server compatibility
  return (
    <div style={{ fontFamily: 'monospace', padding: '20px' }}>
      <pre>
        {status === 'processing' && 'Processing...'}
        {status === 'success' && '1'}
        {status === 'error' && '0'}
      </pre>
      <p>{message}</p>
    </div>
  );
};

export default OfferyPostbackProxy;
