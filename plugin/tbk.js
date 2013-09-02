﻿(function() {
    var loadjQuery = function(callback) 
    {
        if(typeof(jQuery) == "undefined") {
    		var script = document.createElement("script");
    		script.type = "text/javascript";
    		script.src = "http://code.jquery.com/jquery-1.8.2.js";
    		
			var cb = document.createElement("script");
			cb.type = "text/javascript";
			cb.textContent = "jQuery.noConflict();(" + callback.toString() + ")(jQuery);";
			script.addEventListener('load', function() {
				document.head.appendChild(cb);
			});
			
    		document.head.appendChild(script);
    	} else {
    		callback(jQuery);
    	}
    };
    loadjQuery(function ($) {
        Rebate = {
            start: function() 
            {
                url = document.location.href;
                var res = Rebate.checkURL(url);
                if(res === false) {
                    return;
                }
                if ('ju' != res && 'spu' != res && 'a.m' != res) {
                    res = 'item';
                }
                var item_id = Rebate.getItemId(url, res);
                //alert(item_id);
                if(item_id === false) {
                    return;
                }
                $.ajax({
                    url:"http://127.0.0.1/tbk?item_id="+item_id,
                    type:"get",
                    success: function(data){
                        //alert(data);
                        var obj = $.parseJSON(data)
                        //if(obj.commission_rate)
                        Rebate.initEasyDarg($.parseJSON(data));
                    }
                });
            },
            initEasyDarg: function(obj) 
            {
                var width = document.body.clientWidth - 200;
                var div = document.createElement('div');
                div.id = 'dragbox';
                try {
                    document.body.appendChild(div);
                } catch (e) {
                    document.appendChild(div);
                }
                var c_url = obj.click_url == null ? '#' : obj.click_url;
                var c_rate = obj.commission_rate == null ? '0' :(obj.commission_rate/100).toFixed(2);
                var html = '<a href="' + c_url + '"> 返利' + c_rate + '%</a>';
                $('#dragbox').html(html);
                $('#dragbox').attr('style','background-color: yellow; padding: 15px; border: 2px solid orange; width: 180px; cursor: move; position: absolute; z-index: 10000; top: 250px; left: ' + width + 'px;');
                $.getScript("http://code.jquery.com/ui/1.9.1/jquery-ui.js", function(){
                    $("#dragbox").draggable();
                });
            },
            getItemId: function(url, key)
            {
                var itemIDPattern = {
                    "ju": ["item_id\\=\\d+", "itemId\\=\\d+"],
                    "spu": ["default_item_id=\d+", {
                        "pattern": "spu-\d+-\d+",
                        "delimiter": "-",
                        "offset": "2"
                    }],
                    "item": ["id=\\d+", "item_num=\\d+", "item_num_id=\\d+", "item_id=\\d+"],
                    "a.m": ["i\\d+"]
                };
                var patterns = itemIDPattern[key];
                for (var i = 0; i < patterns.length; i++) {
                    var pattern = patterns[i];
                    var offset = 1;
                    var delimiter = '=';
                    if (Object == typeof(pattern)) {
                        pattern = pattern.pattern;
                        offset = pattern.offset;
                        delimiter = pattern.delimiter;
                    }
                    var matches = url.match(pattern);
                    if (matches) {
                        if ('a.m' == key) {
                            return matches[0].replace("i", "");
                        } else {
                            return matches[0].split(delimiter)[offset];
                        }
                    }
                }
                return false;
            },
            checkURL: function(url) 
            {
                var pattern = "^(http|https)://(item|item\\.beta|item\\.lp|ju|detail|chaoshi|spu|a.m)\\.(taobao|tmall)\\.com/";
                var matches = url.match(new RegExp(pattern, 'i'));
                if(matches) {
                    if(url.indexOf('ali_trackid=') != -1) {
                        return false;
                    }
                    return matches[2];
                }
                return false;
            }  
        };
        Rebate.start();
    });
})();