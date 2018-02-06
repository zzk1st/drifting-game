/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class StorylineManager {
    constructor(baguetteVM) {
        this.storylineFilename = 'storylines';
        cc.loader.loadRes(this.storylineFilename, (err, content) => {  
            if (err) {  
                cc.log(err);  
            } else {  
                this.storylineData = content;
            }  
        });

        this._baguetteVM = baguetteVM;
        this._storylinesToSelect = [];
    }

    getStoryline(storylineName) {
        return this.storylineData.storylines[storylineName];
    }

    getEvent(storylineName, eventName) {
        return this.storylineData.storylines[storylineName].events[eventName];
    }

    pickStoryline() {
        if (this._storylinesToSelect.length == 0) {
            this._storylinesToSelect = this.storylineData.activeStorylines.slice();
        }

        let index = getRandomInt(0, this._storylinesToSelect.length - 1);
        let storylineName = this._storylinesToSelect[index];
        this._storylinesToSelect.splice(index, 1);
        return storylineName;
    }

    pickEvent() {
        let storylineName = this.pickStoryline();
        let storyline = this.storylineData.storylines[storylineName];
        let eventNames = Object.keys(storyline.events);
        let eventCandidates = {};
        let totalProbability = 0.0;

        for (let eventIndex = 0; eventIndex < eventNames.length; eventIndex++) {
            let eventName = eventNames[eventIndex];
            let event = this.getEvent(storylineName, eventName);

            if (!event.repeatable && event.done) continue;

            let eventProbabilityFuncName = [storylineName, eventName, 'probability'].join('.');
            let probability = this._baguetteVM.runFunc(eventProbabilityFuncName);
            if (probability > 0.0) {
                eventCandidates[eventName] = probability;
                totalProbability += probability;
            }
        }

        // For DEBUG
        console.log(eventCandidates);

        let dice = getRandomArbitrary(0.0, totalProbability);
        let eventCandidateNames = Object.keys(eventCandidates);
        let currentMinProbability = 0.0;
        for (let eventIndex = 0; eventIndex < eventCandidateNames.length; eventIndex++) {
            let eventName = eventCandidateNames[eventIndex];
            // For DEBUG
            console.log(`current event=${eventName}, probability_internal=[${currentMinProbability}, ${currentMinProbability+eventCandidates[eventName]})`);
            if (dice >= currentMinProbability && dice < currentMinProbability + eventCandidates[eventName]) {
                let result = {'storylineName': storylineName, 'eventName': eventName};
                // For DEBUG
                console.log(`event picked, result=${result}, dice=${dice}`);
                return result;
            }
            currentMinProbability += eventCandidates[eventName];
        }
    }

    runEvent(eventParam) {
        let event = this.getEvent(eventParam.storylineName, eventParam.eventName);
        event.done = true;
        let eventFuncName = [eventParam.storylineName, eventParam.eventName, 'run'].join('.');
        this._baguetteVM.runFunc(eventFuncName);

    }
}

module.exports = StorylineManager;