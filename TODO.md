# Now
- package.json
- pass the tests again
  - normal library
  - makeStream library
- then document
- then use it
- webpack config ?? the best I still have Rx, keep it for now
- contracts etc. ? remove dep. only used once!!
- isArrayUpdateOperations can be inlined : remove dep
- CONTRACT_MODEL_UPDATE_FN_RETURN_VALUE to inline too
- so only dep left is json patch

# Later
- at some point, write more serious tests
  - specially with hierarchical part
- at some point investigate MBT
- rollup ?? when I get read of Rx subject for pub/sub


#Code
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



