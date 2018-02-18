const GameManager = require('GameManager');

cc.Class({
    extends: cc.Component,

    properties: {
        storylineId: null,
        storyline: null,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        if (this.storylineId == null) {
            throw new Error('undefined storylineId!');
        }

        this.name = 'Storyline Item ' + this.storylineId;
        this.storyline = GameManager.instance.storylineManager.getStoryline(this.storylineId);
        if (this.storyline == undefined) {
            throw new Error(`undefined storyline, storylineId=${this.storylineId}`);
        }

        this.node.getChildByName('Label').getComponent(cc.Label).string = this.storyline.title;
    },

    onStorylineSelected (event, customEventData) {
        GameManager.instance.pickStoryline(this.storylineId);
    }
    // update (dt) {},
});
