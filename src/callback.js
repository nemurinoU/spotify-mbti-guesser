const code = new URLSearchParams(window.location.search).get('code');

fetch(`http://localhost:5173/callback?code=${code}`)
  .then(res => res.json())
  .then(data => {
    console.log('Tokens:', data);
    // TODO: redirect to your personality page
  });
