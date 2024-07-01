const app = window.Telegram.WebApp;

app.ready();
app.expand();
app.enableClosingConfirmation();

async function getUser() {
  try {
    if (accessTokenHandler.getAccessToken()) {
      const response = await fetch('/player', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessTokenHandler.getAccessToken()}`,
        },
        body: JSON.stringify(app.initDataUnsafe),
      });

      const data = await response.json();
      window.gameData = data;
    }
  } catch (error) {
    console.error(error);
  }
}

async function setUserScore() {
  try {
    if (accessTokenHandler.getAccessToken()) {
      const requestBody = {
        user: app?.initData,
        is_referral: window.gameData?.is_referral,
        boost: isBoost ? 1 : 0,
      };

      const response = await fetch('/update-score', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessTokenHandler.getAccessToken()}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      return JSON.parse(data.score);
    }
  } catch (error) {
    console.error(error);
  }
}

async function activateBoost() {
  try {
    if (accessTokenHandler.getAccessToken()) {
      const response = await fetch('/activate-boost', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessTokenHandler.getAccessToken()}`,
        },
      });

      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error(error);
  }
}
