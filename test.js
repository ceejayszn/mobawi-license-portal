async function test() {
  try {
    const res = await fetch('https://mllclicence.vercel.app/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'root', password: 'kali' }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const text = await res.text();
    console.log('STATUS:', res.status);
    console.log('BODY:', text);
  } catch (e) {
    console.error(e);
  }
}
test();
