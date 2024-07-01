function CInterface() {
  var _pStartPosExit;
  var _pStartPosScore;
  var _pStartPosBest;
  var _pStartPosPause;
  var _pStartPosArrowLeft;
  var _pStartPosArrowRight;
  var _oButExit;
  var _oButPause;
  var _oScoreText;
  var _oBestScoreText;
  var _oArrowLeft;
  var _oArrowRight;
  var _oPause;
  var _oEndPanel;

  this._init = function () {
    _pStartPosBest = { x: 20, y: 30 };
    _oBestScoreText = new createjs.Text(TEXT_BEST_SCORE + ':0', '24px ' + FONT_GAME, '#ffffff');
    _oBestScoreText.x = _pStartPosBest.x;
    _oBestScoreText.y = _pStartPosBest.y;
    _oBestScoreText.textAlign = 'left';
    s_oStage.addChild(_oBestScoreText);

    var oSprite = s_oSpriteLibrary.getSprite('but_exit');
    _pStartPosExit = { x: CANVAS_WIDTH - oSprite.height / 2 - 20, y: oSprite.height / 2 + 20 };
    _oButExit = new CGfxButton(_pStartPosExit.x, _pStartPosExit.y, oSprite, s_oStage);
    _oButExit.addEventListener(ON_MOUSE_UP, this._onExit, this);

    var oSprite = s_oSpriteLibrary.getSprite('but_pause');
    _pStartPosPause = { x: _pStartPosExit.x, y: _pStartPosExit.y + oSprite.height };
    _oButPause = new CGfxButton(_pStartPosPause.x, _pStartPosPause.y, oSprite, s_oStage);
    _oButPause.addEventListener(ON_MOUSE_UP, this._onPause, this);
  };

  this.refreshButtonPos = function (iNewX, iNewY) {
    _oButExit.setPosition(_pStartPosExit.x - iNewX, iNewY + _pStartPosExit.y);
    _oButPause.setPosition(_pStartPosPause.x - iNewX, iNewY + _pStartPosPause.y);

    _oBestScoreText.x = _pStartPosBest.x + iNewX;
    _oBestScoreText.y = _pStartPosBest.y + iNewY;

    s_oGame.updateScrollLimit(iNewX, iNewY);
  };

  this.unload = function () {
    _oButExit.unload();
    _oButExit = null;

    s_oInterface = null;
  };

  this.refreshBestScore = function (iScore, bAnim) {
    _oBestScoreText.text = TEXT_BEST_SCORE + ': ' + iScore;
    if (bAnim) {
      _oBestScoreText.color = '#ffff00';
      createjs.Tween.get(_oBestScoreText, { override: true })
        .to({ scaleX: 1.1, scaleY: 1.1 }, 500, createjs.Ease.cubicOut)
        .to({ scaleX: 1, scaleY: 1 }, 500, createjs.Ease.cubicIn)
        .set({ color: '#fff' });
    }
  };

  this._onPause = function () {
    s_oGame.unpause(false);
    this.createPauseInterface();
  };

  this.createPauseInterface = function () {
    _oPause = new CPause();
  };

  this.createEndPanel = function (iScore) {
    _oEndPanel = new CEndPanel(s_oSpriteLibrary.getSprite('msg_box'));
    _oEndPanel.show(iScore);
  };

  this.unloadPause = function () {
    _oPause.unload();
    _oPause = null;
  };

  this._onExit = function () {
    var _oAreYouSure = new CAreYouSurePanel(s_oStage);
    _oAreYouSure.show();
  };

  s_oInterface = this;

  this._init();

  return this;
}

var s_oInterface = null;
