const BaguetteVM = require('baguette-vm').BaguetteVM;
const StorylineManager = require('StorylineManager');

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
    addStoryline: {
        pauseAfterComplete: false,
        funcImp: {},
    },
    removeStoryline: {
        pauseAfterComplete: false,
        funcImp: {},
    },
};

const ModName = 'beijing-drifting';

class ResourceLoader {
    constructor () {
        this.bicLoadingComplete = false;
        this.storylineDataLoadingComplete = false;

        cc.loader.loadRes('mods/' + ModName + '/game', (err, bicData) => {
            if (err) {
                throw new Error(`loading resource err: ${err}!`);
            }
            this.bicLoadingComplete = true;
            this.bicData = bicData;
            this.onResLoadingComplete();
        });

        cc.loader.loadRes('mods/' + ModName + '/storylines', (err, storylineData) => {
            if (err) {
                throw new Error(`loading resource err: ${err}!`);
            }
            this.storylineDataLoadingComplete = true;
            this.storylineData = storylineData;
            this.onResLoadingComplete();
        });
    }

    onResLoadingComplete () {
        if (this.bicLoadingComplete && this.storylineDataLoadingComplete) {
            GameManager.instance.resLoadingComplete();
        }
    }
}

var GameManager = cc.Class({
    extends: cc.Component,
    statics: {
        instance: null,
    },
    properties: {
        storylineManager: {
            default: null,
            visible: false,
        },
        baguetteVM: {
            default: null,
            visible: false,
        },
        resLoader: {
            default: null,
            visible: false,
        },
        // Event Panel Nodes
        curMainText: '',
        curMainTextPos: 0,
        eventPanel: {
            default: null,
            type: cc.Node
        },
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
        // Storyline Picker Panel Nodes
        storylinePickerPanel: {
            default: null,
            type: cc.Node
        },
        storylinePickerContent: {
            default: null,
            type: cc.Node
        },
        storylineItemPrefab: {
            default: null,
            type: cc.Prefab
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

    /////////////////////////////////////////////
    // Public Functions 
    /////////////////////////////////////////////
    pickStoryline (storylineId) {
        // ask storyline manager to pick a event from a storyline
        let eventParams = this.storylineManager.pickEvent(storylineId);
        // shut down storyline picker panel, enable event panel
        this.storylinePickerPanel.active = false;
        this.eventPanel.active = true;
        // start running the selected event (script)
        this.storylineManager.runEvent(eventParams);
    },

    /////////////////////////////////////////////
    // Init Functions
    /////////////////////////////////////////////
    initStorylinePanel () {
        let activeStorylines = this.storylineManager.storylineData.activeStorylines;
        if (activeStorylines.length == 0) {
            throw new Error('No storyline to select!');
        }
        for (let i = 0; i < activeStorylines.length; i++) {
            let storylineId = activeStorylines[i];
            this.addStoryline(storylineId);
        }
    },

    /////////////////////////////////////////////
    // Virtual Machine Used Functions 
    /////////////////////////////////////////////
    addStoryline (storylineId) {
       let storylineItem = cc.instantiate(this.storylineItemPrefab);
       storylineItem.getComponent('StorylineItem').storylineId = storylineId;
       this.storylinePickerContent.addChild(storylineItem);
    },

    removeStoryline (storylineId) {
        let storylineItem = this.storylinePickerContent.getChildByName('Storyline Item ' + storylineId);
        if (storylineId == undefined) {
            throw new Error(`Cannot find storyline ${storylineId}!`);
        }

        storylineItem.destroy();
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

    continueScript () {
        // if displaying text is not finished, we finish the text first
        if (this.curMainTextPos < this.curMainText.length - 1) {
            this.unschedule(this.incMainText);
            this.curMainTextPos = this.curMainText.length - 1;
            this.mainText.string = this.curMainText;
        } else {
            if (!this.buttonPanel.active) {
                this.baguetteVM.continue();
                if (this.baguetteVM.state == BaguetteVM.State.Complete) {
                    this.nextTurnPanel.active = true;
                }
            }
        }
    },

    resLoadingComplete () {
        this.baguetteVM = new BaguetteVM(this.resLoader.bicData, gameStats, gameFuncs);
        this.storylineManager = new StorylineManager(this.baguetteVM, this.resLoader.storylineData);
        this.initStorylinePanel();
    },

    /////////////////////////////////////////////
    //  Cocos Callbacks and UI Events
    /////////////////////////////////////////////
    onLoad () {
        GameManager.instance = this;

        // bind 'this' pointer of the two funcs to current object
        gameFuncs.showText.funcImp = this.showText.bind(this);
        gameFuncs.select.funcImp = this.select.bind(this);
        gameFuncs.addStoryline.funcImp = this.addStoryline.bind(this);
        gameFuncs.removeStoryline.funcImp = this.removeStoryline.bind(this);

        // let background listen to touch event
        this.background.on('touchstart', this.continueScript.bind(this));

        // start loading resources
        this.resLoader = new ResourceLoader();
    },

    onSelectButtonPressed (event, customEventData) {
        this.buttonPanel.active = false;
        this.baguetteVM.continue(customEventData);
    },

    onNextTurnButtonPressed (event, customEventData) {
        this.nextTurnPanel.active = false;
        this.eventPanel.active = false;
        this.storylinePickerPanel.active = true;
    },

    start () {

    },

    // update (dt) {},
});

//module.exports = GameManager;