/**
 * New node file
 */
var result = {
    request_id : 0, // uint,
    response_params : {
        result : [{
            msg_id : 0,         // 消息id
            status : 0,         // 发送状态, 0:已发送, 1:待发送, 2:正在发送, 3:已删除
            send_time : 0,      // unix timestamp
            success : 1,        // ack消息数
            total : 1           // 总计需堆送数
        },
        ]
    }
}
