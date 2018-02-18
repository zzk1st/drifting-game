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
    constructor(baguetteVM, storylineData) {
        this.storylineData = storylineData;
        this._baguetteVM = baguetteVM;
        this._storylinesToSelect = [];
    }

    getStoryline(storylineId) {
        return this.storylineData.storylines[storylineId];
    }

    getEvent(storylineId, eventId) {
        return this.storylineData.storylines[storylineId].events[eventId];
    }

    // This function is deprecated
    //pickStoryline() {
    //    if (this._storylinesToSelect.length == 0) {
    //        this._storylinesToSelect = this.storylineData.activeStorylines.slice();
    //    }

    //    let index = getRandomInt(0, this._storylinesToSelect.length - 1);
    //    let storylineId = this._storylinesToSelect[index];
    //    this._storylinesToSelect.splice(index, 1);
    //    return storylineId;
    //}

    pickEvent(storylineId) {
        //let storylineId = this.pickStoryline();
        let storyline = this.getStoryline(storylineId);
        let eventIds = Object.keys(storyline.events);
        let eventCandidates = {};
        let totalProbability = 0.0;

        for (let eventIndex = 0; eventIndex < eventIds.length; eventIndex++) {
            let eventId = eventIds[eventIndex];
            let event = this.getEvent(storylineId, eventId);

            if (!event.repeatable && event.done) continue;

            let eventProbabilityFuncName = [storylineId, eventId, 'probability'].join('.');
            let probability = this._baguetteVM.runFunc(eventProbabilityFuncName);
            if (probability > 0.0) {
                eventCandidates[eventId] = probability;
                totalProbability += probability;
            }
        }

        // For DEBUG
        console.log(eventCandidates);

        let dice = getRandomArbitrary(0.0, totalProbability);
        let eventCandidateIds = Object.keys(eventCandidates);
        let currentMinProbability = 0.0;
        for (let eventIndex = 0; eventIndex < eventCandidateIds.length; eventIndex++) {
            let eventId = eventCandidateIds[eventIndex];
            // For DEBUG
            console.log(`current event=${eventId}, probability_internal=[${currentMinProbability}, ${currentMinProbability+eventCandidates[eventId]})`);
            if (dice >= currentMinProbability && dice < currentMinProbability + eventCandidates[eventId]) {
                let result = {'storylineId': storylineId, 'eventId': eventId};
                // For DEBUG
                console.log(`event picked, result=${result}, dice=${dice}`);
                return result;
            }
            currentMinProbability += eventCandidates[eventId];
        }
    }

    runEvent(eventParam) {
        let event = this.getEvent(eventParam.storylineId, eventParam.eventId);
        event.done = true;
        let eventFuncName = [eventParam.storylineId, eventParam.eventId, 'run'].join('.');
        this._baguetteVM.runFunc(eventFuncName);

    }
}

module.exports = StorylineManager;