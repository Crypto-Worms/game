const baseUrl = window.location.origin;
const payloadTTLMS = 1000 * 60 * 20;
const localstorageAccessTokenKey = 'worms-online-dapp-auth-token';

let interval;

document.querySelector('#ton-connect').style.display = 'none';

const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: 'https://cryptoworms.online/tonconnect-manifest.json',
  buttonRootId: 'ton-connect',
});

tonConnectUI.uiOptions = {
  twaReturnUrl: 'https://cryptoworms.online/',
};

tonConnectUI.connectionRestored.then(() => initTonConnect());

async function initTonConnect() {
  accessTokenHandler.handleAccessTokenChange(localStorage.getItem(localstorageAccessTokenKey));

  if (!accessTokenHandler.getAccessToken() && tonConnectUI.wallet) {
    await tonConnectUI.disconnect();
  }

  if (!tonConnectUI.wallet) {
    console.log('no wallet');
    accessTokenHandler.handleAccessTokenChange(null);

    await refreshTonProofPayload();
    interval = setInterval(() => refreshTonProofPayload(), payloadTTLMS);
  }

  tonConnectUI.onStatusChange(async wallet => {
    clearInterval(interval);

    if (!wallet) {
      accessTokenHandler.handleAccessTokenChange(null);
      await refreshTonProofPayload();
      interval = setInterval(() => refreshTonProofPayload(), payloadTTLMS);
    } else {
      if (wallet.connectItems?.tonProof && !('error' in wallet.connectItems.tonProof)) {
        await checkProof(wallet.connectItems.tonProof, wallet);
      } else {
        console.log('no connectItems');
        await tonConnectUI.disconnect();
      }
    }
  });
}

async function refreshTonProofPayload() {
  tonConnectUI.setConnectRequestParameters({ state: 'loading' });

  const value = await generatePayload();
  if (!value) {
    tonConnectUI.setConnectRequestParameters(null);
  } else {
    tonConnectUI.setConnectRequestParameters({
      state: 'ready',
      value: { tonProof: value },
    });
  }
}

async function generatePayload() {
  const body = {
    user_id: app.initDataUnsafe?.user?.id,
  };

  const response = await (
    await fetch(`${baseUrl}/generatePayload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    })
  ).json();

  return response?.payload || null;
}

async function checkProof(proof, wallet) {
  const body = {
    user_id: app.initDataUnsafe?.user?.id,
    proof,
    wallet,
  };

  const response = await (
    await fetch(`${baseUrl}/check-proof`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  ).json();

  if (response?.token) {
    accessTokenHandler.handleAccessTokenChange(response.token);
  }
}

function setAccessToken(value) {
  let _accessToken = value;
  let onAccessTokenChange = null;

  function setOnAccessTokenChange(callback) {
    onAccessTokenChange = callback;
  }

  function getAccessToken() {
    return _accessToken;
  }

  function handleAccessTokenChange(newToken) {
    _accessToken = newToken;
    if (onAccessTokenChange) {
      onAccessTokenChange(_accessToken);
    }
    if (_accessToken) {
      localStorage.setItem(localstorageAccessTokenKey, _accessToken);
    } else {
      localStorage.removeItem(localstorageAccessTokenKey);
    }
  }

  return {
    setOnAccessTokenChange,
    getAccessToken,
    handleAccessTokenChange,
  };
}

const accessTokenHandler = setAccessToken();
