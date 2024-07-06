const Link = require("grenache-nodejs-link");
const Exchange = require("./src/Exchange.class");

const port = process.argv[2] | 1337;
const link = new Link({
    grape: 'http://127.0.0.1:30001',
    requestTimeout: 10000
}).start();

const exchange = new Exchange(link, port);
exchange.init();

// sample - $node sim.js 1338 exec buy BTC 2 1000
const operations = {
    type: process.argv[4],
    coin: process.argv[5],
    quantity: parseInt(process.argv[7]),
    price: parseInt(process.argv[6]),
}

if(process.argv[3] === 'exec') {
    exchange.placeOrder(operations);
}