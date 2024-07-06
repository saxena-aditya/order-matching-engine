const Link = require("grenache-nodejs-link");
const Exchange = require("./src/Exchange.class");

const port = process.argv[2] | 1337;
const link = new Link({
    grape: 'http://127.0.0.1:30001',
    requestTimeout: 10000
}).start();

const exchange = new Exchange(link, port);
exchange.init();

if(process.argv[3] == 1) {
    exchange.broadcast();
}
