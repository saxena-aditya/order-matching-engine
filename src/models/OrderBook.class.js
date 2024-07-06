const searchOrderByOrderId = require('../util');
const ORDER_TYPE = require('../constants');

class OrderBook {
    constructor() {
        this.buyOrders = {};
        this.sellOrders = {}; 
        this.filledOrder = [];
        this.matchedOrdersQueue = {};
    }

    addOrder(order) {
        console.log("Adding order:", order);
        if(!(order.orderType in this.buyOrders)) {
            this.buyOrders[order.coin] = [];
            this.sellOrders[order.coin] = [];
        }

        if(order.orderType === ORDER_TYPE.BUY) {
            this.buyOrders[order.coin].push(order);
            this.buyOrders[order.coin].sort((a, b) => b.price - a.price);
        } else if (order.orderType === ORDER_TYPE.SELL) {
            this.sellOrders[order.coin].push(order)
            this.sellOrders[order.coin].sort((a, b) => a.price - b.price);
        }
    }

    getOrderById(orderId) {
        const buyOrder = searchOrderByOrderId(this.buyOrders, orderId);
        const sellOrder = searchOrderByOrderId(this.sellOrders, orderId);
        return buyOrder ? buyOrder : sellOrder;
    }

    removeOrder(order) {
        if(order.orderType === ORDER_TYPE.BUY) {
            this.buyOrders[order.coin] = this.buyOrders[order.coin].filter(o => o.orderId !== order.orderId);
        } else {
            this.sellOrders[order.coin] = this.sellOrders[order.coin].filter(o => o.orderId !== order.orderId);
        }
    }

    matchOrder(order) {

    }

    getOrderBook() {
        return {
            buyOrders: this.buyOrders,
            sellOrders: this.sellOrders,
            filledOrders: this.filledOrder,
            matchedOrderQueue: this.matchedOrdersQueue
        };
    }
}

module.exports = OrderBook;