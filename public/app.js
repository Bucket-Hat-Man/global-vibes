document.addEventListener('DOMContentLoaded', function () {
    // Fetch global mood statistics
    function fetchGlobalStats() {
      fetch('/globalStats')
        .then((response) => response.json())
        .then((data) => {
          // Update your frontend with the stats
          document.getElementById('global-mood').innerText = `Happy: ${data.happy}%`;
          // Handle the other moods similarly
        })
        .catch((error) => {
          console.error('Error fetching global stats:', error);
        });
    }
  
    // Fetch continent-based mood stats
    function fetchContinentStats() {
      fetch('/continent')
        .then((response) => response.json())
        .then((data) => {
          // Update your frontend with the continent stats
          const continent = data.continent || 'Unknown';
          document.getElementById('continent-mood').innerText = `Continent: ${continent}`;
        })
        .catch((error) => {
          console.error('Error fetching continent stats:', error);
        });
    }
  
    // Call the fetch functions when the page loads
    fetchGlobalStats();
    fetchContinentStats();
  
    // Event listeners for mood buttons
    document.querySelectorAll('.mood-button').forEach((button) => {
      button.addEventListener('click', function () {
        const mood = this.getAttribute('data-mood');
        fetch(`/submitMood?mood=${mood}`, { method: 'POST' })
          .then((response) => response.json())
          .then((data) => {
            alert(`Your mood was recorded as ${mood}`);
            fetchGlobalStats(); // Update stats after submission
          })
          .catch((error) => {
            console.error('Error submitting mood:', error);
          });
      });
    });
  });
  