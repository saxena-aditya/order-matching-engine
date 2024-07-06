const MESSAGE_TYPE = Object.freeze({
    ORDER_PLACED: 'order_placed',
    ORDER_FILLED: 'order_filled',
    FILL_ORDER: 'fill_order'
});

const ORDER_TYPE = Object.freeze({
    BUY: 'BUY',
    SELL: 'SELL'
});

module.exports = {
    MESSAGE_TYPE,
    ORDER_TYPE
}