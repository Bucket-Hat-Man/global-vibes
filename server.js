const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const app = express();
const PORT = process.env.PORT || 3000;

const GEOLOCATION_API_KEY = 'f8c27ade7edd414192944a9a8b2f4818'; // Your valid geolocation API key

app.use(express.json());
app.use(express.static('public')); // Serve frontend files

// Mood data with continents and total responses
let moodData = {
    happy: 0,
    sad: 0,
    excited: 0,
    angry: 0,
    total: 0,
    continents: {
        Africa: { happy: 0, sad: 0, excited: 0, angry: 0, total: 0 },
        Asia: { happy: 0, sad: 0, excited: 0, angry: 0, total: 0 },
        Europe: { happy: 0, sad: 0, excited: 0, angry: 0, total: 0 },
        NorthAmerica: { happy: 0, sad: 0, excited: 0, angry: 0, total: 0 },
        SouthAmerica: { happy: 0, sad: 0, excited: 0, angry: 0, total: 0 },
        Oceania: { happy: 0, sad: 0, excited: 0, angry: 0, total: 0 }
    },
    trendData: {} // Store rolling averages for trend tracking
};

// Store rolling mood data for each continent over the past 30 days
let rollingMoodData = {
    Africa: [], Asia: [], Europe: [], NorthAmerica: [], SouthAmerica: [], Oceania: []
};

// Helper function to calculate rolling averages
function calculateRollingAverages(continent) {
    const recentData = rollingMoodData[continent].slice(-30); // Get the last 30 days of data
    const totals = recentData.reduce(
        (acc, day) => {
            acc.happy += day.happy;
            acc.sad += day.sad;
            acc.excited += day.excited;
            acc.angry += day.angry;
            acc.total += day.total;
            return acc;
        },
        { happy: 0, sad: 0, excited: 0, angry: 0, total: 0 }
    );
    
    // Avoid division by zero
    if (totals.total > 0) {
        return {
            happy: Math.round((totals.happy / totals.total) * 100),
            sad: Math.round((totals.sad / totals.total) * 100),
            excited: Math.round((totals.excited / totals.total) * 100),
            angry: Math.round((totals.angry / totals.total) * 100)
        };
    } else {
        return { happy: 0, sad: 0, excited: 0, angry: 0 };
    }
}

// Function to get continent from IP
async function getContinentFromIP(ip) {
    if (ip === '::1' || ip === '127.0.0.1') {
        return 'NorthAmerica'; // Placeholder for local development
    }

    try {
        const response = await axios.get(`https://api.ipgeolocation.io/ipgeo?apiKey=${GEOLOCATION_API_KEY}&ip=${ip}`);
        return response.data.continent_name; // Return continent name
    } catch (error) {
        console.error('Error fetching IP data:', error.message);
        return null;
    }
}

// Route to handle mood submissions
app.post('/submitMood', async (req, res) => {
    const { mood } = req.body;
    const userIP = req.ip; // Get user’s IP address
    const continent = await getContinentFromIP(userIP);

    if (moodData[mood] !== undefined && continent) {
        // Update mood data and track rolling mood stats
        moodData[mood]++;
        moodData.total++;
        moodData.continents[continent][mood]++;
        moodData.continents[continent].total++;

        // Update rolling data for trends
        const currentDayData = { ...moodData.continents[continent] };
        rollingMoodData[continent].push(currentDayData);

        res.json({ success: true, message: `Mood submitted for ${continent}!` });
    } else {
        res.status(400).json({ success: false, message: 'Invalid mood or continent!' });
    }
});

// Route to send global mood statistics
app.get('/globalStats', (req, res) => {
    const totalResponses = moodData.total;

    // Prepare mood data
    const moodShare = {
        happy: totalResponses > 0 ? Math.round((moodData.happy / totalResponses) * 100) : 0,
        sad: totalResponses > 0 ? Math.round((moodData.sad / totalResponses) * 100) : 0,
        excited: totalResponses > 0 ? Math.round((moodData.excited / totalResponses) * 100) : 0,
        angry: totalResponses > 0 ? Math.round((moodData.angry / totalResponses) * 100) : 0,
        total: totalResponses,
        happyVotes: moodData.happy,
        sadVotes: moodData.sad,
        excitedVotes: moodData.excited,
        angryVotes: moodData.angry
    };

    res.json(moodShare);
});

// Route to send continent-specific stats and trends
app.get('/continentStats', (req, res) => {
    const continentStats = {};
    Object.keys(moodData.continents).forEach(continent => {
        const continentMood = moodData.continents[continent];
        const rollingAvg = calculateRollingAverages(continent);
        
        let trend = 'No changes observed over time'; // Default placeholder
        if (rollingMoodData[continent].length >= 30) {
            // Only calculate trends if we have at least 30 days of data
            if (rollingAvg.sad > continentMood.sad) {
                trend = 'Getting sadder';
            } else if (rollingAvg.happy > continentMood.happy) {
                trend = 'Getting happier';
            }
            if (rollingAvg.excited > continentMood.excited) {
                trend += ' and more excited';
            } else if (rollingAvg.angry > continentMood.angry) {
                trend += ' and angrier';
            }
        }

        // Remove "Total: undefined" and format the percentages
        continentStats[continent] = {
            happy: continentMood.total > 0 ? Math.round((continentMood.happy / continentMood.total) * 100) + '%' : '0%',
            sad: continentMood.total > 0 ? Math.round((continentMood.sad / continentMood.total) * 100) + '%' : '0%',
            excited: continentMood.total > 0 ? Math.round((continentMood.excited / continentMood.total) * 100) + '%' : '0%',
            angry: continentMood.total > 0 ? Math.round((continentMood.angry / continentMood.total) * 100) + '%' : '0%',
            trend: trend
        };
    });

    res.json(continentStats);
});

// Reset stats at midnight GMT
cron.schedule('0 0 * * *', () => {
    previousDayStats = { ...moodData }; // Save today's stats
    moodData = {
        happy: 0,
        sad: 0,
        excited: 0,
        angry: 0,
        total: 0,
        continents: {
            Africa: { happy: 0, sad: 0, excited: 0, angry: 0, total: 0 },
            Asia: { happy: 0, sad: 0, excited: 0, angry: 0, total: 0 },
            Europe: { happy: 0, sad: 0, excited: 0, angry: 0, total: 0 },
            NorthAmerica: { happy: 0, sad: 0, excited: 0, angry: 0, total: 0 },
            SouthAmerica: { happy: 0, sad: 0, excited: 0, angry: 0, total: 0 },
            Oceania: { happy: 0, sad: 0, excited: 0, angry: 0, total: 0 }
        }
    };

    console.log('Statistics reset for the new day!');
}, {
    timezone: 'GMT'
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
