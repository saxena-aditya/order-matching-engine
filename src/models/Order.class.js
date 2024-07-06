const crypto = require('crypto');
class Order {
    constructor(type, coin, quantity, price, exchangeId) {
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
}

module.exports = Order;