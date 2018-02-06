// Learn cc.Class:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/class/index.html
// Learn Attribute:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/reference/attributes/index.html
// Learn life-cycle callbacks:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/life-cycle-callbacks/index.html

const BaguetteVM = require('./baguette-vm').BaguetteVM;
const StorylineManager = require('./StorylineManager');

var baguetteVM = {};
var gameStats = {
    a: 1,
    b: 2,
    c: 3,
};
var gameFuncs = {
    showText: {
        pauseAfterComplete: true,
        funcImp: {},
    },
    select: {
        pauseAfterComplete: true,
        funcImp: {},
    },
};
var storylineManager;

cc.Class({
    extends: cc.Component,

    properties: {
        curMainText: '',
        curMainTextPos: 0,
        background: {
            default: null,
            type: cc.Node
        },
        buttonPanel: {
            default: null,
            type: cc.Node
        },
        nextTurnPanel: {
            default: null,
            type: cc.Node
        },
        mainText: {
            default: null,
            type: cc.Label
        },
        leftText: {
            default: null,
            type: cc.Label
        },
        rightText: {
            default: null,
            type: cc.Label
        },
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },
    },

    // LIFE-CYCLE CALLBACKS:

    loadVM (content) {
        baguetteVM = new BaguetteVM(content, gameStats, gameFuncs);
    },
    initStorylineManager() {
        storylineManager = new StorylineManager(baguetteVM);
    },

    incMainText () {
        this.mainText.string += this.curMainText[this.curMainTextPos++];
    },

    showText (text) {
        this.curMainText = text;
        this.curMainTextPos = 0;
        this.mainText.string = '';
        this.schedule(this.incMainText, 0.05, this.curMainText.length - 1);
    },

    select (leftText, rightText) {
        this.buttonPanel.active = true;

        this.leftText.string = leftText;
        this.rightText.string = rightText;
    },

    continueScript() {
        // if displaying text is not finished, we finish the text first
        if (this.curMainTextPos < this.curMainText.length - 1) {
            this.unschedule(this.incMainText);
            this.curMainTextPos = this.curMainText.length - 1;
            this.mainText.string = this.curMainText;
        } else {
            if (!this.buttonPanel.active) {
                baguetteVM.continue();
                if (baguetteVM.state == BaguetteVM.State.Complete) {
                    this.nextTurnPanel.active = true;
                }
            }
        }
    },

    onLoad () {
        // bind 'this' pointer of the two funcs to current object
        gameFuncs.showText.funcImp = this.showText.bind(this);
        gameFuncs.select.funcImp = this.select.bind(this);

        cc.loader.loadRes('game', (err, content) => {  
            if (err) {  
                cc.log(err);  
            } else {  
                this.loadVM(content);
                this.initStorylineManager();
            }  
        });

        // Hide the node first
        this.buttonPanel.active = false;

        // let background listen to touch event
        this.background.on('touchstart', this.continueScript.bind(this));
    },

    onSelectButtonPressed (event, customEventData) {
        this.buttonPanel.active = false;
        baguetteVM.continue(customEventData);
    },

    onNextTurnButtonPressed (event, customEventData) {
        this.nextTurnPanel.active = false;
        let eventParams = storylineManager.pickEvent();
        storylineManager.runEvent(eventParams);
    },

    start () {

    },

    // update (dt) {},
});
