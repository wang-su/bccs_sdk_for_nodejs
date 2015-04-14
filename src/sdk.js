/**
 * baidu push sdk
 */


var log4js, logger;

try{
    log4js = require('log4js');
    logger = log4js.getLogger('bccs_sdk');
}catch(e){
    logger = console;
}

var http = require('http');
var querystring = require('querystring');

var pushUtils = require('./utils.js');
var url = require('url');

var os = require('os');
var pkg = require('../package.json');

var singKey = pushUtils.singKey;

var makeUserAgentStr = function () {
    var systemInfo = os.type() + " Version" + os.release() + ": " + os.arch();
    var versionKeys = Object.keys(process.versions);
    
    var nodeInfo = '';
    
    versionKeys.forEach(function (key) {
        if (key === 'node') {
            nodeInfo += "NodeJS/" + process.versions[key] + ' (BccsSDK v' + pkg.version + ')';
        }else{
            nodeInfo += key + "/" + process.versions[key] + " ";
        }
    });
    
    return 'BCCS_SDK/3.0 (' + systemInfo + ') ' + nodeInfo;
};

var UA_STRING = makeUserAgentStr();

var processResponse = function (res, cb) {
    
    var err = null, resContent = "", resObj = null;

    
    if (res.statusCode !== 200) {
        logger.info('STATUS: %s; HEADERS: %s;', res.statusCode, JSON.stringify(res.headers));
        err = new Error("http status " + res.headers);
    }
    
    res.setEncoding('utf8');
    
    res.on('data', function (chunk) {
        // console.log('receive chunk: ' + chunk);
        resContent += chunk;
    });
    
    res.on('end', function () {
        if (err) {
            err.message = resContent;
        } else {
            
            try {
                resObj = JSON.parse(resContent);
            } catch (e) {
                err = new Error("parse error, response not a JSON String, " + resContent);
                resObj = null;
            }
        }
        
        if (resObj && resObj.err_code) {
            err = new Error(resObj.error_msg);
            err.code = resObj.err_code;
        }
        
        cb(err, resObj);
    });
};


var createSdk = function () {

    var apiKey = '';
    var secretKey = '';
    var baseUrl = 'http://api.tuisong.baidu.com/rest/3.0/';
    
    var sdk = {
        init : function (opt) {
            apiKey = opt.apiKey || null;
            secretKey = opt.secretKey || null;
            baseUrl = opt.baseUrl || baseUrl;
        },
        sendOrigin : function (urlMethod, postContent, cb) {

            var sign, postStr;

            // 接口url解析出请求req对像
            var queryParam = url.parse(baseUrl + urlMethod);
            // set the http method to 'post' is required
            queryParam.method = 'post';

            queryParam.headers = {
                'user-agent' : UA_STRING,
                'content-type' : "application/x-www-form-urlencoded;charset=utf-8" // 强制要求content-type及charset
            };

            sign = singKey(queryParam, postContent, secretKey);

            postContent.sign = sign;

            console.dir(postContent);
            postStr = querystring.stringify(postContent);

            queryParam.headers['content-length'] = postStr.length;
            var req = http.request(queryParam, function (res) {
                processResponse(res, cb);
            });

            // send request;
            req.write(postStr);
        },
        checkMessage : function (msg) {

            if (!msg.title) {
                throw new Error('Message.title is null');
            }

            if (!msg.description) {
                throw new Error('Message.description is null');
            }

            if (!msg.customContent) {
                throw new Error('Message.customContent is null');
            }

            // check type and rename the customContent
            if (!Array.isArray(msg.customContent) && 'object' !== typeof (msg.customContent)) {
                // 认为是字符串
                msg.custom_content = [msg.customContent];
            } else {
                msg.custom_content = msg.customContent;
            }

            delete msg.customContent;

            return msg;
        },
        /**
         * create the post body what include common param;
         * 
         * @param opts
         * @returns {___anonymous3398_3530}
         */
        getCommonPostBody : function (opts) {

            var timestamp = ~~(Date.now() / 1000);
            var expires = timestamp + ((~~ opts.expires) || 60);  // 默认为 timestamp

            var postBody = {
                apikey : apiKey,
                timestamp : timestamp,
            // expires : expires,
            };

            if (opts.deviceType !== undefined) {
                postBody.device_type = (opts.deviceType === 4) ? 4 : 3;
            }

            if ('number' === typeof opts.rangeStart) {
                postBody.range_start = ~~opts.rangeStart;
            }

            if ('number' === typeof opts.rangeEnd) {
                postBody.range_end = ~~opts.rangeEnd;
            }

            if ('number' === typeof opts.start) {
                postBody.start = ~~opts.start;
            }

            if ('number' === typeof opts.limit) {
                postBody.limit = ~~opts.limit || 100;
            }

            return postBody;
        },
        /**
         * msg
         * 
         * @param msg
         * @param {CommonParmas}
         *            opts 请求通用参数
         */
        pushAll : function (msg, opts, cb) {

            cb = cb || opts;
            opts = (opts === cb) ? {} : opts;

            if (!(cb instanceof Function)) {
                throw new Error("callback is not a function");
            }

            try {
                msg = this.checkMessage(msg);
            } catch (e) {
                return cb(e), null;
            }

            var postBody = this.getCommonPostBody(opts);

            postBody.msg = JSON.stringify(msg);
            postBody.msg_type = (opts.msgType === 1 ? 1 : 0); // 0通知 , 1透传

            this.sendOrigin('push/all', postBody, cb);
            
        },
        /**
         * 推送消息到指定设备
         * 
         * @param msg
         *            消息内容, 参见消息体说明
         * @param opts
         *            推送参数,
         * @param cb
         *            推送完成后的callback, 包含一个可能的错误对像及返回值.
         */
        pushSingleDevice : function (msg, opts, cb) {
            cb = cb || opts;
            opts = (opts === cb) ? {} : opts;

            if (!(cb instanceof Function)) {
                throw new Error("callback is not a function");
            }

            try {
                msg = this.checkMessage(msg);
            } catch (e) {
                return cb(e), null;
            }

            if (!opts.channelId) {
                return cb(new Error("opts.channelId is require")), null;
            }

            var postBody = this.getCommonPostBody(opts);

            postBody.msg = JSON.stringify(msg);
            postBody.channel_id = opts.channelId;

            if (opts.msgType !== undefined) {
                postBody.msg_type = (opts.msgType === 1 ? 1 : 0); // 0通知 , 1透传
            }

            if (opts.msgTopic !== undefined) {
                postBody.msg_topic = opts.msg_topic;
            }

            if (opts.msgExpires !== undefined) {
                postBody.msg_expires = ~~opts.msgExpires;
            }

            if (opts.deployStatus !== undefined) {
                postBody.deploy_status = (opts.deployStatus === 1 ? 1 : 2);
            }

            if (opts.crontab !== undefined) {
                postBody.crontab = opts.crontab;
            }

            if (opts.periodic !== undefined) {
                postBody.periodic = opts.periodic;
            }

            this.sendOrigin('push/single_device', postBody, cb);

        },
        /**
         * 查询一组tag所包含的设备数量.
         * 
         * @param {array
         *            <string>} tags 将查询的tag
         * @param {Map}
         *            opts query param
         * @param {function}
         *            cb 推送完成后的callback, 包含一个可能的错误对像及返回值.
         */
        queryDeviceNumByTag : function (tag, opts, cb) {
            cb = cb || opts;
            opts = (opts === cb) ? {} : opts;

            if (!(cb instanceof Function)) {
                throw new Error("callback is not a function");
            }

            if ('string' !== typeof tag) {
                cb(new Error("tag must be a String"));
                return;
            }

            var postBody = this.getCommonPostBody(opts);

            if (opts.deviceType !== undefined) {
                postBody.device_type = opts.deviceType;
            }

            postBody.tag = tag;

            this.sendOrigin('tag/device_num', postBody, cb);
        },
        /**
         * 取消尚未执行的定时推送任务
         * 
         * @param {number}
         *            timerId
         * @param {Map}
         *            opts query param
         * @param {function}
         *            cb 推送完成后的callback, 包含一个可能的错误对像及返回值.
         */
        cleanTimer : function (timerId, opts, cb) {
            cb = cb || opts;
            opts = (opts === cb) ? {} : opts;

            if (!(cb instanceof Function)) {
                throw new Error("callback is not a function");
            }

            if (~~timerId === 0) {
                cb(new Error("timerId must be a int value!"));
                return;
            }

            var postBody = this.getCommonPostBody(opts);

            postBody.timer_id = timerId;

            if (opts.deviceType !== undefined) {
                postBody.device_type = opts.deviceType;
            }

            this.sendOrigin('timer/cancel', postBody, cb);
        },
        reportMsgStatus : function (msgId, opts, cb) {
            cb = cb || opts;
            opts = (opts === cb) ? {} : opts;

            if (!(cb instanceof Function)) {
                throw new Error("callback is not a function");
            }

            if (!msgId) {
                cb(new Error("msgId must be a int value!"));
                return;
            }

            var postBody = this.getCommonPostBody(opts);

            postBody.msg_id = msgId;

            this.sendOrigin('report/query_msg_status', postBody, cb);
        },
        reportTimerRecords : function (timerId, opts, cb) {
            cb = cb || opts;
            opts = (opts === cb) ? {} : opts;

            opts.start = opts.start || 0;
            opts.limit = opts.limit || 100;

            if (!(cb instanceof Function)) {
                throw new Error("callback is not a function");
            }

            if (!timerId) {
                cb(new Error("timerId must be a int value!"));
                return;
            }

            var postBody = this.getCommonPostBody(opts);

            postBody.timer_id = timerId;

            this.sendOrigin('report/query_timer_records', postBody, cb);
        },
        reportTopicRecords : function (topic, opts, cb) {
            cb = cb || opts;
            opts = (opts === cb) ? {} : opts;

            opts.start = opts.start || 0;
            opts.limit = opts.limit || 100;

            if (!(cb instanceof Function)) {
                throw new Error("callback is not a function");
            }

            if (!topic || 'string' !== typeof topic) {
                cb(new Error("topic must be a string value!"));
                return;
            }

            var postBody = this.getCommonPostBody(opts);

            postBody.topic_id = topic;
            debugger;
            this.sendOrigin('report/query_topic_records', postBody, cb);
        }
    };

    return sdk;
};

module.exports = createSdk;