/**
 * New node file
 */
var sdk = require('../src/sdk.js')();
var privateInfo = require("./_private.js");

sdk.init(privateInfo);

var commoneCallback = function(err,res){
    if(err){
        console.log(this.apiName, err.stack);
        return;
    }
    var resparam = res.response_params || {};
    console.log("[ %s ]send message ok! request_id : %s, msg_id : %s, sendTime : %s; ", this.apiName, res.request_id, resparam.msg_id, new Date(resparam.send_time * 1000));
};

function queryDeviceNumByTag (target) {
    // 实时设备数
    sdk.queryDeviceNumByTag(target, {
        deviceType : 3
    }, function (err, res) {
        
        if (err) {
            console.dir(err.stack);
        }
        
        console.log(arguments);
    });
}

function reportMsgStatus (id) {
    // 根据msgId查询消息发送数
    sdk.reportMsgStatus(id, {
        deviceType : 3
    }, function (err, res) {
        if (err) {
            console.dir(err.stack);
        }
        console.log(arguments);
    });
}

function pushAll(){
    // 广播
    sdk.pushAll({
        title:'SDK_FOR_NODEJS_PUSH_ALL',
        description:'send message from push sdk for nodejs',
        customContent:['中文测试!~~~~~']
    },{
        msgType : 1,
        deviceType : 3
    },function(){
        commoneCallback.apply({"apiName":"push/all"},arguments);
    });
}


function pushSingleDeviceToAndroid () {
    // 向android单播
    sdk.pushSingleDevice({
        title : 'SDK_FOR_NODEJS_PUSH_SINGLE_DEVICE',
        description : 'send message from push sdk for nodejs',
        customContent : ['中文测试!~~~~~']
    }, {
        msgType : 1,
        deviceType : 3,
        channelId : privateInfo.androidChannelId
    }, function () {
        commoneCallback.apply({
            "apiName" : "push/single_device:toAndroid"
        }, arguments);
    });
}

function pushSingleDeviceToIos(){
    // 向ios单播
    sdk.pushSingleDevice({
        title:'SDK_FOR_NODEJS_PUSH_SINGLE_DEVICE',
        description:'send message from push sdk for nodejs',
        customContent:['中文测试!~~~~~']
    },{
        msgType:1,
        deployStatus:1,
        deviceType:4,
        channelId:privateInfo.iosChannelId
    },function(){
        commoneCallback.apply({"apiName":"push/single_device:toIOS"},arguments);
    });
}

function reportTimerRecords(id,cb){
    // 查询timerId发送记录
    sdk.reportTimerRecords(id,{
        rangeStart:0,
        rangeEnd:Date.now() / 1000,
        deviceType:3,
    },function (err, res) {
        if (err) {
            console.dir(err.stack);
        }
        
        if(res && res.response_params && res.response_params.result){
            cb && cb(res.response_params.result);
            console.dir(res.response_params.result);
        }
    });
}

function reportTopicRecords(id, cb){
    // 查询timerId发送记录
    sdk.reportTopicRecords(id,{
        rangeStart:0,
        rangeEnd:Date.now() / 1000,
        deviceType:3,
    },function (err, res) {
        if (err) {
            console.dir(err.stack);
        }
        
        if(res && res.response_params && res.response_params.result){
            cb && cb(res.response_params.result);
            console.dir(res.response_params.result);
        }
    });
}

function callbackRecordsWithReportMsgStatus (msglist) {
    var msg = null;
    for (var i = 0, len = Math.min(msglist.length, 10); i < len; i++) {
        msg = msglist[i];
        console.log('query status : %s', msg.msg_id);
        reportMsgStatus(msg.msg_id);
    }
}

//pushAll();
pushSingleDeviceToAndroid();
//pushSingleDeviceToIos();
//queryDeviceNumByTag('A');
//reportMsgStatus('5060266789274074107');
//reportTimerRecords('3698005',callbackRecordsWithReportMsgStatus);
//reportTopicRecords('aaa',callbackRecordsWithReportMsgStatus);
