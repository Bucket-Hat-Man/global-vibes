document.addEventListener('DOMContentLoaded', () => {
  const moodButtons = document.querySelectorAll('.mood-btn');

  // Add event listener for each mood button
  moodButtons.forEach(button => {
      button.addEventListener('click', () => {
          const mood = button.getAttribute('data-mood');
          submitMood(mood);
      });
  });

  // Fetch stats when the page loads
  fetchGlobalStats();
  fetchContinentStats();
  fetchPreviousDayStats();
});

// Function to submit mood to the backend
function submitMood(mood) {
  fetch('/submitMood', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ mood: mood })
  })
  .then(response => response.json())
  .then(data => {
      alert('Your mood has been recorded!');
      fetchGlobalStats(); // Update global stats after submission
      fetchContinentStats(); // Update continent stats after submission
  })
  .catch(error => {
      console.error('Error:', error);
  });
}

// Function to fetch global mood stats
function fetchGlobalStats() {
  fetch('/globalStats')
      .then(response => response.json())
      .then(data => {
          const statsElement = document.getElementById('global-stats');
          const totalResponses = data.total;

          if (totalResponses > 0) {
              statsElement.textContent = `
                  Total Responses: ${totalResponses}
                  😊 Happy: ${(data.happy || 0)}% (${data.happyVotes || 0} votes),
                  😢 Sad: ${(data.sad || 0)}% (${data.sadVotes || 0} votes),
                  🤩 Excited: ${(data.excited || 0)}% (${data.excitedVotes || 0} votes),
                  😠 Angry: ${(data.angry || 0)}% (${data.angryVotes || 0} votes)
              `;
          } else {
              statsElement.textContent = "No responses yet!";
          }
      })
      .catch(error => {
          console.error('Error:', error);
      });
}

// Function to fetch mood stats by continent
function fetchContinentStats() {
  fetch('/continentStats')
    .then((response) => response.json())
    .then((data) => {
      const continentsContainer = document.getElementById('continent-stats');
      continentsContainer.innerHTML = ''; // Clear existing stats

      // Loop through each continent's stats and display them
      Object.keys(data).forEach((continent) => {
        const continentStats = data[continent];
        const continentStatsText = `${continent}: Happy: ${continentStats.happy}, Sad: ${continentStats.sad}, Excited: ${continentStats.excited}, Angry: ${continentStats.angry}, Trend: ${continentStats.trend}`;
        const continentStatDiv = document.createElement('div');
        continentStatDiv.innerText = continentStatsText;
        continentsContainer.appendChild(continentStatDiv);
      });
    })
    .catch((error) => {
      console.error('Error fetching continent stats:', error);
    });
}


// Function to fetch previous day's mood stats
function fetchPreviousDayStats() {
  fetch('/previousDayStats')
      .then(response => response.json())
      .then(data => {
          const previousStatsElement = document.getElementById('previous-day-stats');
          const formattedData = Object.keys(data).map(continent => {
              const continentData = data[continent];
              return `${continent}: Happy: ${continentData.happy}, Sad: ${continentData.sad}, Excited: ${continentData.excited}, Angry: ${continentData.angry}, Total: ${continentData.total}`;
          }).join("<br>");

          previousStatsElement.innerHTML = formattedData;
      })
      .catch(error => {
          console.error('Error:', error);
      });
}
