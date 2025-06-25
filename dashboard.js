document.addEventListener('DOMContentLoaded', async () => {
  const ctx = document.getElementById('timeChart').getContext('2d');
  const sessionsList = document.getElementById('sessions');

  // Fetch session data
  const { sessions } = await chrome.storage.local.get('sessions');

  // Prepare data for the chart
  const labels = [];
  const productiveData = [];
  const unproductiveData = [];

  sessions.forEach(session => {
    const date = new Date(session.startTime).toLocaleDateString();
    labels.push(date);
    productiveData.push(session.classification === 'productive' ? session.duration : 0);
    unproductiveData.push(session.classification === 'unproductive' ? session.duration : 0);
  });

  // Create the chart
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Productive Time (s)',
          data: productiveData,
          backgroundColor: '#10B981',
        },
        {
          label: 'Unproductive Time (s)',
          data: unproductiveData,
          backgroundColor: '#EF4444',
        }
      ]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  // Populate sessions list
  sessions.forEach(session => {
    const li = document.createElement('li');
    li.textContent = `${session.url} - ${session.duration}s (${session.classification})`;
    sessionsList.appendChild(li);
  });
});
