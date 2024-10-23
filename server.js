const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// Port will be assigned by Vercel, or fallback to 3000 for local development
const port = process.env.PORT || 3000;

// Middleware to serve static files (your frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Sample API route to get geolocation data
async function getContinentFromIP(ip) {
  try {
    const GEOLOCATION_API_KEY = process.env.GEOLOCATION_API_KEY || 'f8c27ade7edd414192944a9a8b2f4818';
    
    // Handle localhost IP issue (::1)
    const realIP = ip === '::1' ? '8.8.8.8' : ip;

    const response = await axios.get(`https://api.ipgeolocation.io/ipgeo?apiKey=${GEOLOCATION_API_KEY}&ip=${realIP}`);
    return response.data.continent_name;
  } catch (error) {
    console.error('Error fetching IP data:', error);
    return null;
  }
}

// Example route to serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API route to get continent based on user's IP
app.get('/continent', async (req, res) => {
  const ip = req.ip;
  const continent = await getContinentFromIP(ip);
  if (continent) {
    res.json({ continent });
  } else {
    res.status(500).json({ error: 'Could not fetch continent information' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
