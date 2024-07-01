function CMenu() {
  var _pStartPosPlay;
  var _oBg;
  var _oButPlay;
  var _oFade;
  var _oAnimMenu;
  var _oContainerMenuGUI;

  this._init = function () {
    _oBg = CBackground(s_oStage);

    _oContainerMenuGUI = new createjs.Container();
    _oContainerMenuGUI.alpha = 0;
    s_oStage.addChild(_oContainerMenuGUI);

    if (accessTokenHandler.getAccessToken()) {
      this.accessedMenu();
      document.querySelector('#ton-connect').style.display = 'none';
    } else {
      document.querySelector('#ton-connect').style.display = 'block';
    }

    accessTokenHandler.setOnAccessTokenChange(async token => {
      if (token) {
        // await this.getPlayerData();
        this.accessedMenu();
        document.querySelector('#ton-connect').style.display = 'none';
      } else {
        s_oMenu.unload();
        document.querySelector('#ton-connect').style.display = 'block';
      }
    });

    _oAnimMenu = new CAnimMenu(s_oStage);

    _oFade = new createjs.Shape();
    _oFade.graphics
      .beginFill('black')
      .drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    s_oStage.addChild(_oFade);

    createjs.Tween.get(_oFade)
      .to({ alpha: 0 }, MS_FADE_TIME, createjs.Ease.cubicOut)
      .call(function () {
        _oFade.visible = false;
      });
  };

  this.animContainerGUI = function () {
    createjs.Tween.get(_oContainerMenuGUI).to(
      { alpha: 1 },
      500,
      createjs.Ease.cubicOut
    );
  };

  this.unload = function () {
    _oButPlay.unload();
    _oButPlay = null;

    document
      .querySelector('#invite-button')
      .removeEventListener('click', this.setInviteButtonHandler);
    document.querySelector('#invite-button').remove();
    s_oStage.removeAllChildren();

    s_oMenu = null;
  };

  this._onButPlayRelease = function () {
    _oFade.visible = true;

    createjs.Tween.get(_oFade)
      .to({ alpha: 1 }, MS_FADE_TIME, createjs.Ease.cubicOut)
      .call(function () {
        s_oMenu.unload();
        s_oMain.gotoGame();
        $(s_oMain).trigger('start_session');
      });
  };

  this.update = function () {
    _oAnimMenu.update();
  };

  this.accessedMenu = async function () {
    if (!window.gameData) await this.getPlayerData();

    const score = window.gameData?.score || 0;

    var oSprite = s_oSpriteLibrary.getSprite('but_play');
    _pStartPosPlay = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 200 };

    _oButPlay = new CGfxButton(
      _pStartPosPlay.x,
      _pStartPosPlay.y,
      oSprite,
      _oContainerMenuGUI
    );
    _oButPlay.addEventListener(ON_MOUSE_UP, this._onButPlayRelease, this);
    _oButPlay.pulseAnimation();

    _pStartPosBest = { x: 20, y: 20 };
    _oBestScoreTextCircleContainer = new createjs.Container();
    _oBestScoreTextCircleContainer.x = _pStartPosBest.x;
    _oBestScoreTextCircleContainer.y = _pStartPosBest.y;

    _oContainerMenuGUI.addChild(_oBestScoreTextCircleContainer);

    // _oBestScoreTextCircle = new createjs.Shape();

    // _oBestScoreTextCircle.graphics
    //   .beginLinearGradientFill(
    //     ['rgb(194, 149, 0)', 'rgba(255, 236, 69, 1)'],
    //     [0, 1],
    //     0,
    //     0,
    //     0,
    //     90
    //   )
    //   .beginStroke('rgba(37, 28, 0, 1)')
    //   .setStrokeStyle(2)
    //   .drawCircle(20, 15, 25)
    //   .endFill();

    // _oBestScoreTextCircle.shadow = new createjs.Shadow('#242424', 1, 1, 2);

    // _oBestScoreTextCircleContainer.addChild(_oBestScoreTextCircle);

    _oBestScoreTextPrefix = new createjs.Text(
      '$W',
      '26pt ' + FONT_GAME,
      'rgb(255, 236, 69, 1)'
    );

    _oBestScoreTextPrefix.textAlign = 'left';
    _oBestScoreTextPrefix.shadow = new createjs.Shadow('#242424', 2, 2, 5);
    _oBestScoreTextCircleContainer.addChild(_oBestScoreTextPrefix);

    _oBestScoreText = new createjs.Text(
      score,
      '26pt ' + FONT_GAME,
      'rgb(185, 141, 0)'
    );

    _oBestScoreText.x = 60;

    _oBestScoreText.textAlign = 'left';
    _oBestScoreText.shadow = new createjs.Shadow('#242424', 2, 2, 5);
    _oBestScoreTextCircleContainer.addChild(_oBestScoreText);

    const invite = document.createElement('div');
    invite.innerHTML = 'Invite Friends';
    invite.classList.add('invite-button');
    invite.id = 'invite-button';

    invite.addEventListener('click', this.setInviteButtonHandler);

    s_oStage.addChild(_oContainerMenuGUI);
    document.body.appendChild(invite);
    setTimeout(() => {
      invite.style.bottom = '10vw';
    }, 500);
  };

  this.getPlayerData = async function () {
    return await getUser();
  };

  this.setInviteButtonHandler = function () {
    const botUsername = 'cryptowormbot';
    const startParameter = window.gameData?.referral_id;
    const messageText = `Hey! Let's play with me a CryptoWorms! 🚀`;
    const encodedMessageText = encodeURIComponent(messageText);

    const telegramBotLink = `https://t.me/${botUsername}?start=r_${startParameter}`;
    const telegramShareLink = `https://t.me/share/url?url=${encodeURIComponent(
      telegramBotLink
    )}&text=${encodedMessageText}`;

    app.openTelegramLink(telegramShareLink);
  };

  s_oMenu = this;

  this._init();
}

var s_oMenu = null;
