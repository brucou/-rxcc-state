# Now
- include learning from `http://sismic.readthedocs.io/en/master/communication.html` in README
- test with new object lenses that it still works
- write the reactive part of the API (makeStream library)
- document
- API: keep the start for now. In another version should be able to start by sending an INIT event, 
but that would be the responsibility of the library user?? Yes, I should do that, so only one `yield` method is exposed
  - The init was to make for statechart but this is no statechart anymore...
- build
  - try rollup once again, see if I can get ramda to be tree shaken, and fast-json-patch
  - webpack config ?? the best I still have Rx, keep it for now
- pass the tests again
  - normal library

# Later
- at some point, write more serious tests
  - specially with hierarchical part

# Later later
- at some point investigate MBT
- rollup ?? when I get read of Rx subject for pub/sub


#Code (old)
// TODO : the latest version of synchronous_fsm should go back to rx-component-combinators!!
// TODO : document code with jsdoc, in particular @modify tags for side-effectful functions
// TODO : document the library

// TODO : entry and exit actions??
// TODO : Add termination connector (T)?
// TODO : DSL TODO : write program which takes a transition specifications and draw a nice graph
// out of it with yed or else
// TODO : think about the concurrent states (AND states)
// TODO : cd player demo
// - TEST CASE no history (last seen state is null...)
// - add the view (template + enabling disabling of buttons in function of state)
// - add the tooltips

# Didactic
- implement auto-complete field with state machines
  - will use history states and pre-emption (cancelling tasks)
- implement a page with two autocomplete fields, and which returns availability of, say, seats, 
provided the autocomplete fields fulfill some validity rules (part of a given list) orig-dest
  - shows how to reuse a graph into another one?? to check
  - that will show benefits of hierarchical state machines
- then move to multi-step workflow full example
- could show auto-complete example in react with same library
- could show auto-complete example in angular with same library
LOTS OF WORK
do the design on spare time but work rather on the dev tool!!! that is the killing thing
