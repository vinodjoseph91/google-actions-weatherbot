module.exports = function (app, CONSTANTS, messages) {
    const googleAssistant = require('../utils/googleUtils.js');
    const ActionsSdkApp = require('actions-on-google').ActionsSdkApp;
    app.locals.taskList = {};
    const weatherUtils = new (require('../utils/weatherUtils.js'));
    app.post(CONST_KEY_ACTIONS_WEBHOOK, (req, res) => {
        let sdkApp = new ActionsSdkApp({ request: req, response: res });
        handleAPIRequest(req, res, sdkApp)
    })


    function sendThanksResponse(googleClient, messageText, isThanks) {
        let _buttons = [];
        if (!isThanks)
            _buttons.push("Thanks");

        _buttons.push(CONST_MSG_GET_WEATHER2);
        _buttons.push(CONST_MSG_CREATE_TASK1);
        _buttons.push(CONST_MSG_SHOW_TASK3);
        googleClient.sendSuggestionChips(messageText, _buttons);
    }


    function handleAPIRequest(req, res, sdkApp) {
        let intent = sdkApp.getIntent(),
            googleClient = new googleAssistant(sdkApp),
            messageText = sdkApp.getRawInput() || '';
        messageText = messageText.toLowerCase();
        let conversationId = req.body.conversation.conversationId;
        let isNewConversation = req.body.conversation.type == CONST_KEY_NEW_CONVERSATION ? true : false;
        let messageType = decideMessageType(messageText);
        switch (messageType) {
            case CONST_MSG_CREATE_TASK1:
                createNewTask(googleClient, conversationId, "task");
                break;
            case CONST_MSG_SHOW_TASK1:
                showAllTasks(googleClient, conversationId);
                break;
            case CONST_MSG_GET_WEATHER1:
                createNewTask(googleClient, conversationId, "weather");
                break;
            case CONST_MSG_THANKS:
                sendThanksResponse(googleClient, CONST_MSG_THANKS_RESP,true);
                break;
            default:
                if (isNewConversation) {
                    createNewConversation(conversationId);
                    let _buttons = [CONST_MSG_CREATE_TASK1, CONST_MSG_GET_WEATHER1];
                    googleClient.sendSuggestionChips(CONST_MSG_WELCOME_MESSAGE, _buttons);
                    // googleClient.postMessage(CONST_MSG_WELCOME_MESSAGE);
                }
                else {
                    processValueForOldconversation(googleClient, conversationId, messageText);
                }
        }

    }

    function decideMessageType(messageText) {
        if (messageText == CONST_MSG_CREATE_TASK1 || messageText == CONST_MSG_CREATE_TASK2 || messageText == CONST_MSG_CREATE_TASK3 || messageText == CONST_MSG_CREATE_TASK4) {
            return CONST_MSG_CREATE_TASK1;
        }
        else if (messageText == CONST_MSG_SHOW_TASK1 || messageText == CONST_MSG_SHOW_TASK2 || messageText == CONST_MSG_SHOW_TASK3 || messageText == CONST_MSG_SHOW_TASK4) {
            return CONST_MSG_SHOW_TASK1;
        }
        else if (messageText == CONST_MSG_GET_WEATHER1 || messageText == CONST_MSG_GET_WEATHER2) {
            return CONST_MSG_GET_WEATHER1;
        }
        else if (messageText == CONST_MSG_THANKS) {
            return CONST_MSG_THANKS;
        }
        else {
            return messageText;

        }
    }

    function createNewConversation(convId) {
        app.locals.taskList[convId] = {
            tasks: []
        };
    }


    function createNewTask(googleClient, convId, type) {
        let conversationObj = app.locals.taskList[convId];
        if (conversationObj.tasks) {
            let taskObj = {};
            taskObj.taskId = conversationObj.tasks.length + 1;
            taskObj.type = type == "task" ? "task" : "weather";
            conversationObj.tasks.push(taskObj);
            app.locals.taskList[convId] = conversationObj;
            if (type == "task")
                askForParameters(googleClient, CONST_KEY_TASK_NAME, convId);
            else
                askForParameters(googleClient, CONST_MSG_ASK_LOCATION_NAME, convId);
        }
        else {
            sendDefaultMessage(googleClient);
        }

    }

    function getTaskData(convId, taskId) {
        let conversationObj = app.locals.taskList[convId];
        if (conversationObj.tasks.length > 0) {
            let flag = false;
            for (let i = 0; i < conversationObj.tasks.length; i++) {
                if (conversationObj.tasks[i][CONST_KEY_TASK_ID] == taskId) {
                    flag = true;
                    return conversationObj.tasks[i];
                }
            }
            if (!flag) {
                return null;
            }
        }
        else return null;
    }


    function sendDefaultMessage(googleClient) {
        googleClient.postMessage(CONST_MSG_WELCOME_MESSAGE);
    }


    function askForParameters(googleClient, parameterName, convId) {
        let conversationObj = app.locals.taskList[convId];
        let promptMessage;
        switch (parameterName) {
            case CONST_KEY_TASK_NAME:
                promptMessage = CONST_MSG_ASK_TASK_NAME;
                break;
            case CONST_KEY_TASK_DESCRIPTION:
                promptMessage = CONST_MSG_ASK_TASK_DESC;
                break;
            case CONST_KEY_TASK_ASSIGNEE:
                promptMessage = CONST_MSG_ASK_TASK_ASSIGNEE;
                break;
            case CONST_KEY_TASK_DURATION:
                promptMessage = CONST_MSG_ASK_TASK_DURATION;
                break;
            case CONST_MSG_ASK_LOCATION_NAME:
                promptMessage = CONST_MSG_ASK_LOCATION_NAME;
                break;
            default:
                return sendDefaultMessage(googleClient);
        }
        conversationObj[CONST_KEY_LAST_ASKED_PARAMETER] = parameterName;
        app.locals.taskList[convId] = conversationObj;
        googleClient.postMessage(promptMessage);
    }


    function processValueForOldconversation(googleClient, convId, messageText) {
        let conversationObj = app.locals.taskList[convId];
        let currentTaskId = conversationObj.tasks.length;
        let taskObj = getTaskData(convId, currentTaskId);
        let lastQuestion = conversationObj[CONST_KEY_LAST_ASKED_PARAMETER],
            currentAnswer,
            nextQuestion;
        switch (lastQuestion) {
            case CONST_KEY_TASK_NAME:
                nextQuestion = CONST_MSG_ASK_TASK_DESC;
                conversationObj[CONST_KEY_LAST_ASKED_PARAMETER] = CONST_KEY_TASK_DESCRIPTION;
                currentAnswer = CONST_KEY_TASK_NAME;
                break;
            case CONST_KEY_TASK_DESCRIPTION:
                nextQuestion = CONST_MSG_ASK_TASK_ASSIGNEE;
                conversationObj[CONST_KEY_LAST_ASKED_PARAMETER] = CONST_KEY_TASK_ASSIGNEE;
                currentAnswer = CONST_KEY_TASK_DESCRIPTION;
                break;
            case CONST_KEY_TASK_ASSIGNEE:
                nextQuestion = CONST_MSG_ASK_TASK_DURATION;
                conversationObj[CONST_KEY_LAST_ASKED_PARAMETER] = CONST_KEY_TASK_DURATION;
                currentAnswer = CONST_KEY_TASK_ASSIGNEE;
                break;
            case CONST_KEY_TASK_DURATION:
                nextQuestion = CONST_MSG_TASK_CREATED;
                delete conversationObj[CONST_KEY_LAST_ASKED_PARAMETER];
                currentAnswer = CONST_KEY_TASK_DURATION;
                break;
            case CONST_MSG_ASK_LOCATION_NAME:
                nextQuestion = CONST_MSG_WEATHER;
                delete conversationObj[CONST_KEY_LAST_ASKED_PARAMETER];
                currentAnswer = CONST_MSG_ASK_LOCATION_NAME;
                break;
            default:
                return sendDefaultMessage(googleClient);

        }

        if (nextQuestion == CONST_MSG_WEATHER) {
            weatherUtils.getWeather(messageText, (err, data) => {
                if (err) {
                    console.log("processValueForOldconversation - error - " + err);
                    googleClient.postMessage(err);
                }
                else if (data) {
                    let weatherResp = "The temperature at " + messageText + " is " + data.temp + " degree Celsius";
                    sendThanksResponse(googleClient, weatherResp);
                    // googleClient.postMessage("The temperature at "+messageText+" is "+data.temp+" degree Celsius");
                }
            })
        }
        else {
            for (let i = 0; i < conversationObj.tasks.length; i++) {
                if (conversationObj.tasks[i][CONST_KEY_TASK_ID] == currentTaskId) {
                    conversationObj.tasks[i][currentAnswer] = messageText;
                    break;
                }
            }
            app.locals.taskList[convId] = conversationObj;
            if (nextQuestion == CONST_MSG_TASK_CREATED) {
                let _buttons = [];
                _buttons.push(CONST_MSG_THANKS);
                _buttons.push(CONST_MSG_SHOW_TASK1);
                _buttons.push(CONST_MSG_CREATE_TASK1);
                googleClient.sendSuggestionChips(nextQuestion, _buttons);
            }
            else {
                googleClient.postMessage(nextQuestion);
            }
        }

    }

    function showAllTasks(googleClient, convId) {

        let conversationObj = app.locals.taskList[convId];
        if (conversationObj && conversationObj.tasks && conversationObj.tasks.length > 0) {
            let tasks = conversationObj.tasks,
                _buttons = [];
            for (let i = 0; i < tasks.length; i++) {
                if (tasks[i].type != 'weather')
                    _buttons.push(tasks[i][CONST_KEY_TASK_NAME]);
            }
            if (_buttons.length > 0)
                googleClient.sendSuggestionChips(CONST_MSG_USER_TASK_LIST, _buttons);
            else {
                _buttons.push(CONST_MSG_CREATE_TASK1);
                googleClient.sendSuggestionChips(CONST_MSG_NO_TASKS_FOUND, _buttons);
            }
        }
        else {
            let _buttons = [];
            _buttons.push(CONST_MSG_CREATE_TASK1);
            googleClient.sendSuggestionChips(CONST_MSG_NO_TASKS_FOUND, _buttons);
        }
    }
}