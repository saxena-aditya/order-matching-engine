const crypto = require('crypto');
const { ORDER_TYPE } = require('../constants');
class Order {
    constructor(type, coin, quantity, price, exchangeId) {
        this.validateOrder(type);

        this.id = crypto.randomInt(100);
        this.type = type;
        this.coin = coin;
        this.price = price;
        this.quantity = quantity;
        this.originalQuantity = quantity;
        this.filledQuantity = 0;
        this.matchedOrders = [];

        // exchange-id where the order was placed.
        this.exchangeId = exchangeId;
    }

    validateOrder(type) {
        if(!(type in ORDER_TYPE))
            throw `Order type: ${type} is not supported by the Exchange`;
    }
}

module.exports = Order;