'use strict'

const crypto = require('crypto');
const Order = require('./models/Order.class');
const OrderBook = require('./models/OrderBook.class');
const { PeerRPCServer, PeerRPCClient } = require('grenache-nodejs-http');
const { MESSAGE_TYPE } = require('./constants');
const BROADCAST_SIGNAL = "broadcast";

class Exchange {
    constructor(link, port) {
        this.link = link;
        this.port = port;
        this.exchangeId = `exc-${crypto.randomInt(100)}`;
        this.orderBook = new OrderBook();
    }

    init() {
        this.server = new PeerRPCServer(this.link, {});
        this.server.init();

        this.service = this.server.transport('server');
        this.service.listen(this.port);
        this.service.on('request', this.onRequest.bind(this));

        this.client = new PeerRPCClient(this.link, {});
        this.client.init();

        this.link.startAnnouncing(BROADCAST_SIGNAL, this.port, {});
        this.link.startAnnouncing(this.exchangeId, this.port, {})
        setInterval(() => {
            this.processMatchedOrderQueue();
        }, 1000);
        console.log("Exchange running: ", this.exchangeId);
    }

    placeOrder({type, coin, quantity, price}) {
        const order = new Order(type, coin, quantity, price, this.exchangeId);
        this.orderBook.addOrder(order);

        const unfilledOrder = this.orderBook.matchOrder(order);
        
        if(!unfilledOrder) {
            console.log("Order has been filled", order);
            return;
        }

        // broadcast unfilled order to other Exchanges
        const broadcastPayload = {
            messageType: MESSAGE_TYPE.ORDER_PLACED,
            order: unfilledOrder,
        }
        this.client.map(BROADCAST_SIGNAL, broadcastPayload, {}, (err, result) => {
            if(err) throw err;
            // Process results from all Exchanges and put the matched orders in queue to process.
            result.map(exchangeResponse => exchangeResponse
                .map(matchedOrder => {
                    unfilledOrder.id in this.orderBook.matchedOrdersQueue ?
                        this.orderBook.matchedOrdersQueue[unfilledOrder.id].push(matchedOrder) :
                        this.orderBook.matchedOrdersQueue[unfilledOrder.id] = [matchedOrder];
                }
            ));
        });
    }

    onRequest(rid, key, payload, handler) {
        switch (key) {
            case BROADCAST_SIGNAL:
                this.handleBroadcastMessage(payload, handler);
                break;
            case this.exchangeId:
                this.handleExchangeMessage(payload, handler);
                break;
            default:
            break;
        }
    }

    handleBroadcastMessage(payload, handler) {
        // TODO: add handle for ORDER_CANCELED or other events
        switch(payload.messageType) {
            case MESSAGE_TYPE.ORDER_PLACED:
                const matchingOrders = this.orderBook.findMatchingOrders(payload.order)
                handler.reply(null, matchingOrders);
                break;
            default:
                break;
        }  
    }

    handleExchangeMessage(payload, handler) {
        switch (payload.messageType) {
            case MESSAGE_TYPE.FILL_ORDER:
                const order = this.orderBook.getOrderById(payload.fillOrder.id);
                if(!order) {
                    handler.reply(null, false);
                    return;
                }
                order.quantity -= payload.fillOrder.quantity;
                order.filledQuantity += payload.fillOrder.quantity;
                order.matchedOrderList.push(payload.matchedOrder);
                this.orderBook.filledOrderList.push({
                    ...order,
                    quantity: payload.fillOrder.quantity
                });
                if(order.quantity === 0) {
                    // order is completely filled so remove it
                    this.orderBook.removeOrder(payload.fillOrder);
                }

                console.log("Order:", order.id, " filling complete");
                handler.reply(null, true);
                break;
            default:
                break;
        }
        return;
    }

    async processMatchedOrderQueue() {
        if(Object.keys(this.orderBook.matchedOrdersQueue).length === 0) return;

        for (const unfulfilledOrderId of Object.keys(this.orderBook.matchedOrdersQueue)) {
            const matchedOrderList = this.orderBook.matchedOrdersQueue[unfulfilledOrderId];
            const unfulfilledOrder = this.orderBook.getOrderById(unfulfilledOrderId);
            if(!unfulfilledOrder) {
                delete this.orderBook.matchedOrdersQueue[unfulfilledOrderId];
            }
            for(const matchedOrder of matchedOrderList) {
                if(unfulfilledOrder.quantity === 0) {
                    delete this.orderBook.matchedOrdersQueue[unfulfilledOrderId];
                    break;
                }

                // When order is matched, make client call to Exchange to update their orderbook here
                // Once call is success update this exchange's order book and order status
                const quantityTraded = Math.min(unfulfilledOrder.quantity, matchedOrder.quantity);

                try {
                    const resp = await this.messageSourceExchange(matchedOrder.exchangeId, {
                        messageType: MESSAGE_TYPE.FILL_ORDER,
                        fillOrder: {
                            ...matchedOrder,
                            quantity: quantityTraded
                        },
                        matchedOrder: unfulfilledOrder
                    });
    
                    if(resp) {
                        unfulfilledOrder.quantity -= quantityTraded;
                        unfulfilledOrder.filledQuantity += quantityTraded;
                        unfulfilledOrder.matchedOrderList.push(matchedOrder);
                        this.orderBook.filledOrderList.push({
                            ...unfulfilledOrder,
                            quantity: quantityTraded
                        });
    
                        if(unfulfilledOrder.quantity === 0) {
                            delete this.orderBook.matchedOrdersQueue[unfulfilledOrderId];
                            this.orderBook.removeOrder(unfulfilledOrder);
                            console.log("ORDER_FILLED:", unfulfilledOrder);
                        }
                    }
                } catch (err) {
                    console.log(err);
                }
                
            }
        }
    }

    messageSourceExchange(exchangeId, payload) {
        return new Promise((resolve, reject) => {
            this.client.request(exchangeId, payload, {},(err, result) => {
               if(err) {
                   reject(err);
                   return;
               }
               resolve(result);
            });
        });
    }

    broadcast() {
        this.client.map(BROADCAST_SIGNAL, this.exchangeId, {}, (err, result) => {
            if(err) throw err;
            console.log("result: ", result);
        });
    }
}

module.exports = Exchange;