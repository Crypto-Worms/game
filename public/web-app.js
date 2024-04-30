async function getUserScore() {
  fetch(`/player?user_id=${app.initDataUnsafe.user.id}`)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Network response was not ok.');
    })
    .then(data => {
      window.gameData = JSON.parse(data.score);
    })
    .catch(error => console.error('There was a problem with your fetch operation:', error));
}

async function setUserScore() {
  fetch('/update-score', {
    method: 'POST',
    body: JSON.stringify({
      user: app.initData,
      hit: true,
    }),
  })
    .then(response => response.json())
    .then(async () => {
      await getUserScore();
    })
    .catch(error => console.error('There was an error:', error));
}
