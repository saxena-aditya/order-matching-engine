const MESSAGE_TYPE = Object.freeze({
    ORDER_PLACES: 'order_placed',
    ORDER_FILLED: 'order_filled',
    FILL_ORDER: 'fill_order'
});

const ORDER_TYPE = Object.freeze({
    BUY: 'buy',
    SELL: 'sell'
});

module.exports = {
    MESSAGE_TYPE,
    ORDER_TYPE
}