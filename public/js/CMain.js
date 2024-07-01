function CMain(oData) {
  var _bUpdate;
  var _iCurResource = 0;
  var RESOURCE_TO_LOAD = 0;
  var _iState = STATE_LOADING;
  var _oData;
  var _oPreloader;
  var _oMenu;
  var _oGame;

  this.initContainer = async function () {
    const canvasElm = document.createElement('canvas');

    canvasElm.width = window.innerWidth;
    canvasElm.height = window.innerHeight;
    canvasElm.id = 'canvas';

    document.querySelector('#app').append(canvasElm);

    var canvas = document.getElementById('canvas');
    s_oStage = new createjs.Stage(canvas);
    createjs.Touch.enable(s_oStage);
    s_oStage.preventSelection = false;

    s_bMobile = jQuery.browser.mobile;
    if (s_bMobile === false) {
      s_oStage.enableMouseOver(20);
      $('body').on('contextmenu', '#canvas', function (e) {
        return false;
      });
    }

    s_iPrevTime = new Date().getTime();
    createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
    createjs.Ticker.addEventListener('tick', this._update);
    createjs.Ticker.framerate = FPS;

    s_oSpriteLibrary = new CSpriteLibrary();

    _oPreloader = new CPreloader();

    _bUpdate = true;
  };

  this._loadImages = function () {
    s_oSpriteLibrary.init(this._onImagesLoaded, this._onAllImagesLoaded, this);

    s_oSpriteLibrary.addSprite('but_play', './sprites/but_play.png');
    s_oSpriteLibrary.addSprite('but_exit', './sprites/but_exit.png');
    s_oSpriteLibrary.addSprite('msg_box', './sprites/msg_box.png');
    s_oSpriteLibrary.addSprite('arrow', './sprites/arrow.png');
    s_oSpriteLibrary.addSprite('but_home', './sprites/but_home.png');
    s_oSpriteLibrary.addSprite('but_restart', './sprites/but_restart.png');
    s_oSpriteLibrary.addSprite('bg_game', './sprites/bg_game.jpg');
    s_oSpriteLibrary.addSprite('bg_game_boost', './sprites/bg_game_boost.png');
    s_oSpriteLibrary.addSprite('food_0', './sprites/food_0.png');
    s_oSpriteLibrary.addSprite('but_pause', './sprites/but_pause.png');
    s_oSpriteLibrary.addSprite('but_continue', './sprites/but_continue.png');
    s_oSpriteLibrary.addSprite('but_yes', './sprites/but_yes.png');
    s_oSpriteLibrary.addSprite('but_not', './sprites/but_not.png');
    s_oSpriteLibrary.addSprite('but_info', './sprites/but_info.png');
    s_oSpriteLibrary.addSprite('arrow_key', './sprites/arrow_key.png');
    s_oSpriteLibrary.addSprite('edge_side_lr', './sprites/edge_side_lr.png');
    s_oSpriteLibrary.addSprite('edge_side_ud', './sprites/edge_side_ud.png');
    s_oSpriteLibrary.addSprite('logo', './sprites/logo.png');

    for (var i = 0; i < SNAKE_TYPES; i++) {
      s_oSpriteLibrary.addSprite(
        'snake_head_' + i,
        './sprites/snake_head_' + i + '.png'
      );
      s_oSpriteLibrary.addSprite(
        'snake_parts_' + i,
        './sprites/snake_parts_' + i + '.png'
      );
      s_oSpriteLibrary.addSprite(
        'snake_boost_head_' + i,
        './sprites/snake_boost_head_' + i + '.png'
      );
      s_oSpriteLibrary.addSprite(
        'snake_boost_parts_' + i,
        './sprites/snake_boost_parts_' + i + '.png'
      );
    }
    RESOURCE_TO_LOAD += s_oSpriteLibrary.getNumSprites();
    s_oSpriteLibrary.loadSprites();
  };

  this._onImagesLoaded = function () {
    _iCurResource++;
    var iPerc = Math.floor((_iCurResource / RESOURCE_TO_LOAD) * 100);
    _oPreloader.refreshLoader(iPerc);
  };

  this._onAllImagesLoaded = function () {};

  this.preloaderReady = function () {
    this._loadImages();
    _bUpdate = true;
  };

  this._onRemovePreloader = function () {
    _oPreloader.unload();
    this.gotoMenu();
  };

  this.gotoMenu = async function () {
    _oMenu = new CMenu();
    _iState = STATE_MENU;
  };

  this.gotoGame = function () {
    _oGame = new CGame(_oData);

    _iState = STATE_GAME;
  };

  this.stopUpdate = function () {
    _bUpdate = false;
    createjs.Ticker.paused = true;
    $('#block_game').css('display', 'block');
  };

  this.startUpdate = function () {
    s_iPrevTime = new Date().getTime();
    _bUpdate = true;
    createjs.Ticker.paused = false;
    $('#block_game').css('display', 'none');
  };

  this._update = function (event) {
    if (_bUpdate === false) {
      return;
    }
    var iCurTime = new Date().getTime();
    s_iTimeElaps = iCurTime - s_iPrevTime;
    s_iCntTime += s_iTimeElaps;
    s_iCntFps++;
    s_iPrevTime = iCurTime;

    if (s_iCntTime >= 1000) {
      s_iCurFps = s_iCntFps;
      s_iCntTime -= 1000;
      s_iCntFps = 0;
    }

    if (_iState === STATE_GAME) {
      _oGame.update();
    } else if (_iState === STATE_MENU) {
      _oMenu.update();
    }

    s_oStage.update(event);
  };

  s_oMain = this;

  _oData = oData;

  this.initContainer();
}
var s_iCntTime = 0;
var s_iTimeElaps = 0;
var s_iPrevTime = 0;
var s_iCntFps = 0;
var s_iCurFps = 0;
var s_iSpeedBlock;

var s_oDrawLayer;
var s_oStage;
var s_oScrollStage;
var s_oMain;
var s_oSpriteLibrary;
