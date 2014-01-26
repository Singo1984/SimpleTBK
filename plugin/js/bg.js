if (!chrome.runtime) {
    chrome.runtime = chrome.extension;
} else if(!chrome.runtime.onMessage) {
    chrome.runtime.onMessage = chrome.extension.onMessage;
    chrome.runtime.sendMessage = chrome.extension.sendMessage;
    chrome.runtime.onConnect = chrome.extension.onConnect;
    chrome.runtime.connect = chrome.extension.connect;
}

localStorage['ServerIP'] = "162.243.140.80";

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "getServerIP") {
        var serverIP = localStorage['ServerIP'];
        sendResponse(serverIP);
    } else if (request.method == "serverError") {
        if (window.webkitNotifications) {
            console.log("Notifications are supported!");
            var notification = webkitNotifications.createNotification(
                '',
                'SimpleTBK Server Error!',
                'Please check your service in ' + localStorage['ServerIP'] + '...'
            );
            notification.show();
            window.setTimeout(function(){ notification.cancel(); }, 3000);
        }
        else {
            console.log("Notifications are not supported for this Browser/OS version yet.");
        }
    }
});