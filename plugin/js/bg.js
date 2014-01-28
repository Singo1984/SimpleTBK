if (!chrome.runtime) {
    chrome.runtime = chrome.extension;
} else if(!chrome.runtime.onMessage) {
    chrome.runtime.onMessage = chrome.extension.onMessage;
    chrome.runtime.sendMessage = chrome.extension.sendMessage;
    chrome.runtime.onConnect = chrome.extension.onConnect;
    chrome.runtime.connect = chrome.extension.connect;
}

localStorage['ServerIP'] = "162.243.140.80";
localStorage['adzoneid'] = "15964722";
localStorage['siteid'] = "5312357";

// decorate a function with more argument
function funcCreator() {
    var func = arguments[0];
    var args = [].slice.call(arguments, 1);
    var newFunc = function () {
        return func.apply(null, args);
    };
    return newFunc;
}

function getAuctionCode() {
    var xhr = arguments[0];
    var _searchAuctionList = arguments[1];
    var _sendResponse = arguments[2];
    var _request = arguments[3];
    if (xhr.readyState == 4) {
        if (xhr.status == 200) {
            console.log(xhr.responseText);
            try {
                var auctionCodeObj = JSON.parse(xhr.responseText);
            } catch (err) {
                var auctionCodeObj = null;
            }
            if (auctionCodeObj) {
                _searchAuctionList(auctionCodeObj, _sendResponse, _request);
            } else {
                genNotify('', 'Get Auction Code Error', 'Please login alimama and try again');
            }
        }
    }
}

function genNotify(icon, body, msg) {
    console.log("Notifications are supported!");
    var notification = webkitNotifications.createNotification(icon, body, msg);
    notification.show();
    window.setTimeout(function(){ notification.cancel(); }, 3000);
}

function getAuctionList() {
    var xhr = arguments[0];
    var _sendResponse = arguments[1];
    var _request = arguments[2];
    var _auctionCodeObj = arguments[3];
    if (xhr.readyState == 4) {
        if (xhr.status == 200) {
            console.log(xhr.responseText);
            try {
                var auctionListObj = JSON.parse(xhr.responseText);
            } catch(err) {
                var auctionListObj = null;
            }
            var respObj = {}
            if (auctionListObj &&
                    auctionListObj.data && 
                    auctionListObj.data.pagelist && 
                    auctionListObj.data.pagelist.length == 1) {
                var commissionRatePercent = auctionListObj.data.pagelist[0].commissionRatePercent;
                if (_auctionCodeObj.data && _auctionCodeObj.data.clickUrl) {
                    var clickUrl = _auctionCodeObj.data.clickUrl;
                    respObj.click_url = clickUrl;
                    respObj.commission_rate = commissionRatePercent * 100;
                    _sendResponse(respObj);
                } else {
                    genNotify('', 'Auction Code Format Error', 'Please notify plugin author to fix it');
                }
            } else {
                genNotify('', 'Get Auction List Error', 'Please login alimama and try again');
            }
        }
    }
}

function searchAuctionList(auctionCodeObj, _sendResponse, _request) {
    var xhr = new XMLHttpRequest();
    var URL = "http://pub.alimama.com/pubauc/searchAuctionList.json?q=id%3D15988853025&t=1390899401306&_tb_token_=gdLKWePePym";
    xhr.open("GET", URL, true);
    xhr.onreadystatechange = funcCreator(getAuctionList, xhr, _sendResponse, _request, auctionCodeObj);
    xhr.send()
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "alimamaLogin") {
        
    } else if (request.method == "getAuction") {
        var xhr = new XMLHttpRequest();
        var itemid = request.itemid;
        var URL = "http://pub.alimama.com/common/code/getAuctionCode.json?auctionid=15988853025&adzoneid=15964722&siteid=5312357&t=1390899401306&_tb_token_=2D8FYgYaPym";
        xhr.open("GET", URL, true);
        xhr.onreadystatechange = funcCreator(getAuctionCode, xhr, searchAuctionList, sendResponse, request);
        xhr.send();
    }
});