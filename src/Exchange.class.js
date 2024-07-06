const crypto = require('crypto');
const Order = require('./models/Order.class');
const OrderBook = require('./models/OrderBook.class');
const { PeerRPCServer, PeerRPCClient } = require('grenache-nodejs-http');
const { debugPrint } = require('./util');
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
        console.log("unfilledOrder: ", unfilledOrder)
    }

    onRequest(rid, key, payload, handler) {
        console.log("Got request", {rid, key, payload});
        handler.reply(null, {});
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