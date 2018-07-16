# Now
- API: remove the start?? Should be able to start by sending an INIT event, but that would be the 
responsibility of the library user?? Yes, I should do that, so only one `yield` method is exposed
  - but the API is configured to enforce an INIT event... mmmm maybe leave in that version, not 
  worth fighting for, now. The init was to make for statechart but this is no statechart anymore...
- try rollup once again, see if I can get ramda to be tree shaken, and fast-json-patch
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
- automatic layout with cytoscape ?? or just elkjs directly : try elk first
  - or plantUML ?? ask mogsie, seems to be already done !! g.gravizo alrady does it, only has to 
  do json to json translation !!! do that first!!

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



