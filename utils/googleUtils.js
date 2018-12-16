const NO_INPUTS = [
    'I didn\'t hear that.',
    'If you\'re still there, say that again.',
    'We can stop here. See you soon.'
];


function googleAssistant(sdkApp) {
    this.sdkApp = sdkApp;
};


googleAssistant.prototype.postMessage = function(text, messageId) {
    let _self = this,
        ssml = '<speak>' + text + '</speak>',
        inputPrompt = _self.sdkApp.buildInputPrompt(true, ssml, NO_INPUTS);

    _self.sdkApp.ask(inputPrompt);
};
googleAssistant.prototype.sendSuggestionChips = function(speech, chips) {
    let _self = this;
    _self.sdkApp.ask(_self.sdkApp.buildRichResponse()
        .addSimpleResponse({
            speech: speech,
            displayText: speech
        })
        .addSuggestions(chips)
    );
};


module.exports = googleAssistant;