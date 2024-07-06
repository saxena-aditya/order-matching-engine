# The BFX challenge

Hi and congratulations to your progress with Bitfinex!

Your task is to create a simplified P2P distributed exchange

* Each client will have its own instance of the orderbook.
* Clients submit orders to their own instance of orderbook. The order is distributed to other instances, too.
* If a client's order matches with another order, any remainer is added to the orderbook, too.

Requirement:
* Code in Javascript
* Use Grenache for communication between nodes
* Simple order matching engine
* You don't need to create a UI or HTTP API

You should not spend more time than 6-8 hours on the task. We know that its probably not possible to complete the task 100% in the given time.


If you don't get to the end, just write up what is missing for a complete implementation of the task. Also, if your implementation has limitation and issues, that's no big deal. Just write everything down and indicate how you could solve them, given there was more time.

Good luck!

## Tips

 - you don't need to store state in a DB or filesystem
 - it is possible to solve the task with the node std lib, async and grenache libraries
 - beware of race conditions!
 - no need for express or any other http api layers
