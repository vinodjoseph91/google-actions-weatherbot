module.exports = function (app, CONSTANTS, messages) {
    
    var welcomeApis = new(require('./welcomeApis'))(app, CONSTANTS, messages); 
    var actionApis = new(require('./googleActionApis'))(app, CONSTANTS, messages);
    
}
