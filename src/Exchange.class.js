const crypto = require('crypto');
const Order = require('./models/Order.class');
const OrderBook = require('./models/OrderBook.class');
const { PeerRPCServer, PeerRPCClient } = require('grenache-nodejs-http');
const { debugPrint } = require('./util');
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

            console.log("Matched order queue: ", this.orderBook.matchedOrdersQueue);

        });
    }

    onRequest(rid, key, payload, handler) {
        console.log("request recieved", rid, key, this.exchangeId);

        switch (key) {
            case BROADCAST_SIGNAL:
                this.handleBroadcastMessage(payload, handler);
                break;
            default:
            break;
        }
    }

    handleBroadcastMessage({messageType, order}, handler) {
        // TODO: add handle for ORDER_CANCELED or other events
        switch(messageType) {
            case MESSAGE_TYPE.ORDER_PLACED:
                const matchingOrders = this.orderBook.findMatchingOrders(order)
                handler.reply(null, matchingOrders);
                break;
            default:
                break;
        }
       
    }

    broadcast() {
        console.log("broadcasting");
        this.client.map(BROADCAST_SIGNAL, this.exchangeId, {}, (err, result) => {
            if(err) throw err;
            console.log("result: ", result);
        });
    }
}

module.exports = Exchange;