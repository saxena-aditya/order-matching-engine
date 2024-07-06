const util = require('util');

const debugPrint = (data) => {
    util.inspect(data, {showHidden: false, colors: true});
}

const searchOrderByOrderId = (orderData, orderId) => {
    for(const [coin, orderList] of Object.entries(orderData)) {
        const order = orderList.find((o) => o.id == orderId);
        return order;
    }

    return undefined;
}

module.exports = {
    debugPrint,
    searchOrderByOrderId
};