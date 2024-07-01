function CEndPanel(oSpriteBg) {
  var _oBg;
  var _oMsgText;
  var _oMsgTextBack;
  var _oGroup;
  var _oButRestart;
  var _oButMenu;
  var _oFade;

  this._init = function (oSpriteBg) {
    _oFade = new createjs.Shape();
    _oFade.graphics.beginFill('black').drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    _oFade.alpha = 0.5;
    _oFade.on('click', function () {});

    _oBg = createBitmap(oSpriteBg);
    _oBg.x = CANVAS_WIDTH_HALF;
    _oBg.y = CANVAS_HEIGHT_HALF;
    _oBg.regX = oSpriteBg.width * 0.5;
    _oBg.regY = oSpriteBg.height * 0.5;
    _oBg.scaleX = 0.45;
    _oBg.scaleY = 0.45;

    _oMsgTextBack = new createjs.Text('', '30px ' + FONT_GAME, '#000');
    _oMsgTextBack.x = CANVAS_WIDTH / 2;
    _oMsgTextBack.y = CANVAS_HEIGHT_HALF - 65;
    _oMsgTextBack.textAlign = 'center';
    _oMsgTextBack.outline = 4;

    _oMsgText = new createjs.Text('', '30px ' + FONT_GAME, '#ff6c00');
    _oMsgText.x = CANVAS_WIDTH / 2;
    _oMsgText.y = CANVAS_HEIGHT_HALF - 65;
    _oMsgText.textAlign = 'center';

    _oGroup = new createjs.Container();
    _oGroup.alpha = 0;
    _oGroup.visible = false;
    _oGroup.addChild(_oFade, _oBg, _oMsgTextBack, _oMsgText);

    s_oStage.addChild(_oGroup);
  };

  this.show = function (iScore) {
    _oMsgTextBack.text = TEXT_GAMEOVER;
    _oMsgText.text = TEXT_GAMEOVER;

    _oGroup.visible = true;

    var oParent = this;

    var oSpriteButRestart = s_oSpriteLibrary.getSprite('but_restart');

    _oButRestart = new CGfxButton(
      CANVAS_WIDTH * 0.5 + 100,
      CANVAS_HEIGHT * 0.5 + 20,
      oSpriteButRestart,
      _oGroup
    );

    _oButRestart.addEventListener(ON_MOUSE_DOWN, oParent._onRestart, this);

    var oSpriteButHome = s_oSpriteLibrary.getSprite('but_home');
    _oButMenu = new CGfxButton(
      CANVAS_WIDTH * 0.5 - 100,
      CANVAS_HEIGHT * 0.5 + 20,
      oSpriteButHome,
      _oGroup
    );
    _oButMenu.addEventListener(ON_MOUSE_DOWN, oParent._onExit, this);

    createjs.Tween.get(_oGroup, { ignoreGlobalPause: true }).to(
      { alpha: 1 },
      1000,
      createjs.Ease.cubicOut
    );

    $(s_oMain).trigger('save_score', iScore);
    $(s_oMain).trigger('share_event', iScore);
  };

  this._onExit = function () {
    s_oStage.removeChild(_oGroup);

    this.unload();

    $(s_oMain).trigger('show_interlevel_ad');

    s_oGame.onExit();
  };

  this.unload = function () {
    _oButMenu.unload();
    _oButMenu = null;

    _oButRestart.unload();
    _oButRestart = null;

    _oFade.removeAllEventListeners();
  };

  this._onRestart = function () {
    createjs.Tween.get(_oGroup, { ignoreGlobalPause: true })
      .to({ alpha: 0 }, 300)
      .call(function () {
        s_oStage.removeChild(_oGroup);
      });

    s_oGame.onRestart();

    $(s_oMain).trigger('show_interlevel_ad');
  };

  this._init(oSpriteBg);

  return this;
}
