/**
 * New node file
 */
var sdk = require('../src/sdk.js');
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

// 实时设备数
//sdk.queryDeviceNumByTag('A',function(err,res){
//    if(err){
//        console.dir(err.stack);
//    }
//    console.log(arguments);
//});

// 根据msgId查询消息发送数
//sdk.reportMsgStatus(974679,function(err,res){
//    if(err){
//        console.dir(err.stack);
//    }
//    console.log(arguments);
//});

// 根据timer_id查询消息发送数
sdk.reportTimerStatus(323,function(err,res){
    if(err){
        console.dir(err.stack);
    }
    console.log(arguments);
    console.dir(res.response_params);
});

//
//// 广播
//sdk.pushAll({
//    title:'SDK_FOR_NODEJS_PUSH_ALL',
//    description:'send message from push sdk for nodejs',
//    customContent:['中文测试!~~~~~']
//},{
//    msgType : 1,
////    deviceType : 4
//},function(){
//    commoneCallback.apply({"apiName":"push/all"},arguments);
//});
//
//// 向android单播
//sdk.pushSingleDevice({
//    title:'SDK_FOR_NODEJS_PUSH_SINGLE_DEVICE',
//    description:'send message from push sdk for nodejs',
//    customContent:['中文测试!~~~~~']
//},{
//    msgType:1,
//    channelId:privateInfo.androidChannelId
//},function(){
//    commoneCallback.apply({"apiName":"push/single_device:toAndroid"},arguments);
//});
//
//// 向ios单播
//sdk.pushSingleDevice({
//    title:'SDK_FOR_NODEJS_PUSH_SINGLE_DEVICE',
//    description:'send message from push sdk for nodejs',
//    customContent:['中文测试!~~~~~']
//},{
//    msgType:1,
//    deployStatus:1,
//    channelId:privateInfo.iosChannelId
//},function(){
//    commoneCallback.apply({"apiName":"push/single_device:toIOS"},arguments);
//});