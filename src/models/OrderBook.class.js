const searchOrderByOrderId = require('../util');
const { ORDER_TYPE } = require('../constants');

class OrderBook {
    constructor() {
        this.buyOrders = {};
        this.sellOrders = {}; 
        this.filledOrderList = [];
        this.matchedOrdersQueue = {};
    }

    addOrder(order) {
        console.log("Adding order:", order);
        if(!(order.type in this.buyOrders)) {
            this.buyOrders[order.coin] = [];
            this.sellOrders[order.coin] = [];
        }

        if(order.type === ORDER_TYPE.BUY) {
            this.buyOrders[order.coin].push(order);
            this.buyOrders[order.coin].sort((a, b) => b.price - a.price);
        } else if (order.type === ORDER_TYPE.SELL) {
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

    /**
     * Mathes orders with present orders in the current exchange.
     * @param order
     * @returns un-filled order or undefined in case of complete match
     */
    matchOrder(order) {
        console.log('Executing order match for OrderId: ', order.id);
        const {id, type, coin} = order;
        while(this.buyOrders[coin].length > 0 && this.sellOrders[coin].length > 0) {
            const buyOrder = this.buyOrders[coin][0];
            const sellOrder = this.sellOrders[coin][0];

            if(buyOrder.price >= sellOrder.price) {
                console.log('Order matched: ', buyOrder.id, sellOrder.id);
                const quantityTraded = Math.min(buyOrder.quantity, sellOrder.quantity);
                
                buyOrder.quantity -= quantityTraded;
                buyOrder.filledQuantity += quantityTraded;
                buyOrder.matchedOrderList.push({
                    ...sellOrder,
                    quantity: quantityTraded
                });

                sellOrder.quantity -= quantityTraded;
                sellOrder.filledQuantity += quantityTraded;
                sellOrder.matchedOrderList.push({
                    ...buyOrder,
                    quantity: quantityTraded
                });

                if(buyOrder.quantity === 0) {
                    this.filledOrderList.push(this.buyOrders[coin].shift());
                }

                if(sellOrder.quantity === 0) {
                    this.filledOrderList.push(this.sellOrders[coin].shift());

                }
            } else {
                // no orders can be match right now.
                break;
            }
        }
        
        // return pending order state after matching.
        return type === ORDER_TYPE.BUY ? 
            this.buyOrders[coin].find(o => o.id === id) :
            this.sellOrders[coin].find(o => o.id === id);
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