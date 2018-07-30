# Motivation
Time and again we have to implement computations which, while they cannot be modelized by pure 
functions, however have the following interesting properties :

- they transform an input into an output, depending only on the present and past inputs
- they do not perform any effects
- the algorithm for the computation involves a finite, parameterizable set of rules, coalescing  
around a finite, fixed set of control states

These computations can often be modelized advantageously[^1] by a class of state machines called 
hierarchical extended state transducer. This library offers a way to define, and use such class of
 state machines. We will come back on the meaning of the fancy name, but in short a [state 
 transducer](https://en.wikipedia.org/wiki/Finite-state_transducer) is a state machine which may 
 produce outputs.

The major motivation for this library has been the specification and implementation of user 
interfaces. As a matter of fact, to [every user interface can be associated a computation](https://brucou.github.io/posts/user-interfaces-as-reactive-systems/#reactive-systems-as-automata) 
relating a user input to an action to be performed on the interfaced systems. That computation 
often has a logic [organized around a limited set of control states](#base-example).

If user interfaces is also your key center of interest, you can directly [jump to the examples]
(https://github.com/brucou/state-transducer#general-concepts).

However, state machines are a very general tool, that have found miscellaneous applications in 
unrelated contexts :

- ES6 generators are transpiled to ES5 state transducers when there is no native support
 in browser (cf. facebook's [`regenerator`](https://github.com/facebook/regenerator))
- user interface specification and implementation for embedded systems
- [model-based testing, and test input generation](https://pdfs.semanticscholar.org/f8e6/b3019c0d5422f35d2d98c242f149184992a3.pdf)
- AI's decision making in games

Concretely, we have so far successfully used this library :

- in [multi-steps workflows](https://github.com/brucou/component-combinators/tree/master/examples/volunteerApplication), a constant feature of enterprise software today
- for ['smart' synchronous streams](https://github.com/brucou/partial-synchronous-streams), which
 tracks computation state to avoid useless re-computations
- to implement cross-domain communication protocols

In such cases, we were able to modelize our computation with an Extended Hierarchical State Transducer 
in a way that :

- is economical (complexity of the transducer proportional to complexity of the computation)
- is reasonably easy to reason about and communicate up to an intermediate scale (the transducer can
 be visually represented, supporting both internal and external communication, and design 
 specification and documentation)
- supports step-wise refinement and iterative development (control states can be refined into a 
hierarchy of nested states)

[^1]: In fact, [computability theory]((https://en.wikipedia.org/wiki/Computability_theory)) links
 the feasability of a computation to the existence of a machine whose run produces the 
 desired results. Some formalizations of the matching computing machine however can be useless 
  in practice, which is why we use the term advantageously to indicate those computations where 
  a formalization of the computing machine brings desired benefits.

# So what is an Extended Hierarchical State Transducer ? 
Let's build the concept progressively.

An [automaton](https://en.wikipedia.org/wiki/Automata_theory) is a construct made of states 
designed to determine if a sequence of inputs should be accepted or rejected. It looks a lot like a 
basic board game where each space on the board represents a state. Each state has information about what to do when an input is received by the machine (again, rather like what to do when you land on the Jail spot in a popular board game). As the machine receives a new input, it looks at the state and picks a new spot based on the information on what to do when it receives that input at that state. When there are no more inputs, the automaton stops and the space it is on when it completes determines whether the automaton accepts or rejects that particular set of inputs.

State machines and automata are essentially interchangeable terms. Automata is the favored term 
when connoting automata theory, while state machines is more often used in the context of the 
actual or practical usage of automata.

An extended state machine is a state machine endowed with a set of variables, predicates (guards)
and instructions governing the update of the mentioned set of variables. To any extended state 
machines it corresponds a standard state machine ()albeit often one with a far greater number of 
states) with the same semantics.

A hierarchical state machine is a state machine whose states can be themselves state machines. 
Thus instead of having a set of states as in standard state machines, we have a hierarchy (tree) of 
states describing the system under study.

A [state transducer](https://en.wikipedia.org/wiki/Finite-state_transducer) is a state 
machine, which in addition to accepting inputs, and modifying its state accordingly, may also 
generate outputs.

We propose here a library dealing with extended hierarchical state transducers, i.e. a state machine
whose states can be other state machines (hierarchical part), which (may) associate an output to an 
input (transducer part), and whose input/output relation follows a logic guided by 
predefined control states (state machine part), and an encapsulated memory which can be 
modified through actions guarded by predicates (extended part).

Note that if we add concurrency and messaging to extended hierarchical state transducers, we get
 a statechart. We made the design decision to remain at the present level, and not to incorporate 
 any concurrency mechanism.[^2]

[^2]: Our rationale is as follows :  
 - if there are no parallel regions, a statechart can be turned into a hierarchical state 
 transducer. That is often enough!
 - statecharts include activities and actions which may produce effects, and concurrency. We are 
 seeking an purely computational approach (i.e effect-less) to facilitate composition, reuse and 
  testing.  Any concurrent model can be added on top as necessary.
 - we estimate the concurrency semantics of statecharts to be unduely complicated vs. alternative
  concurrency models[^3]. That makes it difficult for programmers to elaborate a mental model of 
  the statecharts (in the presence of concurrency) and that makes it difficult for other users to
   reason based solely on the visualization of concurrent statecharts. Those issues are 
   unavoidable passed a given scale or complexity of the modelized system
 - some [statecharts practitioners](http://sismic.readthedocs.io/en/master/communication.html#) 
 favor having separate state charts communicating in an ad-hoc way rather than an integrated 
 statechart model where concurrent state charts are gathered in nested states of a single 
 statechart. We agree.
 
[^3]: As a matter of fact, more than 20 different semantics have been proposed to define 
precisely the concurrency model for statecharts, e.g Rhapsody, Statemate, VisualMate, StateFlow, 
UML, etc. do not share a single concurrency model.
 
# Install
**TODO**

# API
## API design
The key objectives for the API was :

- generality and reusability (there is no provision made to accommodate specific use cases or 
frameworks)
  - it must be possible to add a concurrency and/or communication mechanism on top of the 
  current design 
  - it must be possible to integrate smoothly into React, Angular and your popular framework
  - support for both interactive and reactive programming
- parallel and sequential composability of transducers

As a result of this, the following choices were made :

- complete encapsulation of the state of the transducer
- no effects performed by the machine
- functional interface : the transducer is used through a sole `yield` function. While two 
syntactic sugars are provided (`start` for sending the mandatory INIT event, `yield` is attached 
to the state machine object). As such, the transducer is a black-box, and only its computed outputs
  can be observed
- no exit and entry actions, or activities as in other state machine formalisms
  - there is no loss of generality as both entry and exit actions can be implemented with our 
  state transducer, there is simply no API or syntactic support for it
- every computation performed is synchronous (asynchrony is an effect)
- action factories return the **updates** to the extended state (JSON patch format) to avoid any 
unwanted direct modification of the extended state
- no restriction is made on output of transducers, but inputs must follow some conventions (if a
 machine's output match those conventions, two such machines can be sequentially composed by 
 passing the output of a yield from the first machine as an input to the second machine)
- reactive programming is enabled by exposing a pure function of an input stream, which runs the 
transducer for each incoming input, thus generating a sequence of outputs

Concretely, our state transducer will be created by the factory function `create_state_machine`, 
which returns a state transducer which :

- must be started manually (with `.start()`), and configured with an initial event and transition 
- will compute an output for any input that is sent to it (with `.yield(input)`)

The state transducer is not, in general, a pure function of its inputs. However, a given output of
 the transducer depends exclusively on the sequence of inputs it has received so far ([causality 
 property](https://en.wikipedia.org/wiki/Causal_system)). This means that it is possible to  
 associate to a state transducer another function which takes a sequence of inputs into a 
 sequence of outputs, in a way that that function is pure. 

We provide a way to construct such a function with the `makeStreamingStateMachine` factory to 
create a stream transducer, which translates an input stream into an output stream.

## General concepts
Our state transducer is an object which encapsulates state, and exposes a function by which input
 is received. That function, based on the transducer's encapsulated state and configuration, and the 
received input produces two things : 

- a list of updates to apply internally to the extended state
- an external output for the consumer of the state transducer

To help illustrate further the concepts, and the terminology, we will use two examples, featuring 
basic and advanced features on the hierarchical state transducer model : 

- a real use case of non-hierarchical extended state machine applied to a web application user 
interface
- the specification of the behaviour for a cd player as a hierarchical extended state machine

We will subsequently precise here the vocabulary which will be used throughout the documentation.
  We then describe how the behaviour of a transducer relates to its configuration. In particular
  we detail the concepts and semantics associated to hierarchical states. Finally we present our
   API whose documentation relies on all previously introduced concepts.

### Base example
This example is taken from an actual project in which this library was used. It will be used in 
this paragraph to illustrate the core terminology defined in subsequent sections, and illustrate 
somewhat abstract notions. It does not feature hierarchical states, and as such can be seen as a 
regular extended state machine.

This example deals with a typical multi-step application process, whose user interface is made of a 
sequence of screens. In each screen, the user is required to introduce or review some 
information, and navigate through the application process up to completion.

That application process concretely consists of 5 screens whose flow is defined by the UX team as
 follows :
 
![User flow](https://github.com/brucou/component-combinators/raw/master/examples/volunteerApplication/assets/volunteerApplication/application%20process.png) 

This in turn was turned into a non-trivial state machine (6 states, ~20 transitions) orchestrating 
the screens to display in function of the user inputs. The machine **does not display the screen 
itself** (it performs no effects), **it computes which screen to display** according to the 
sequence of inputs performed by the user and its encapsulated state (user-entered data, data 
validation, etc.). The action `display screen` must be understood as a regular piece of data whose 
meaning is to be interpreted down the road by the portion of the program in charge of realizing 
effcts. The state machine can be visualized as follows :
 
![illustration of basic terminology](https://i.imgur.com/byRSrGH.png)

In our example, the encapsulated state has the following shape :

```javascript
{
  user,
  opportunity,
  project,
  userApplication,
  teams,
  errorMessage: null,
  validationMessages: {}
}
```

### CD drawer example
This example is taken from Ian Horrock's seminal book on statecharts and is the specification of
 a CD player. The behaviour of the CD player is pretty straight forward and understandable 
 immediately from the visualization. From a didactical point of view, the example serve to feature 
 advanced characteristics of hierarchical state machines,  including history states, composite states, 
 transient states, automatic transitions, and entry points.
 
![cd player state chart](http://i.imgur.com/ygsOVi9.jpg)

### Terminology
In this section, we seek to define quickly the meaning of the key terms which will be commonly 
used when referring to state machines.

<dl>
  <dt>control state</dt>
  <dd>Control states, in the context of an extended state machine is a piece of the internal state
   of the state machine, which serves to determine the transitions to trigger in response to 
   events. Transitions only occur between control states. Cf. base example illustration. </dd>
  <dt>extended state</dt>
  <dd>We refer by extended state the piece of internal state of the state machine which can be 
  modified on transitioning to another state. That piece of internal state **must** be 
  initialized upon creating the state machine. In this context, the extended state will simply 
  take the form of a regular object. The shape of the extended state is largely 
  application-specific. In the context of our multi-steps workflow, extended state could for 
  instance be the current application data, which varies in function of the state of the 
  application.</dd>
  <dt>input</dt>
  <dd>In the context of our library, we will use interchangeable input for events. An automata 
  receives inputs and generated outputs. However, as a key intended use case for this
   library is user interface implementation, inputs will often correspond to events generated by a 
   user. We thus conflate both terms in the context of this documentation.
  </dd>
  <dt>external event</dt>
  <dd>External events are events which are external and uncoupled to the state machine at hand. 
  Such events could be, in the context of an user interface, a user click on a button.
  </dd>
  <dt>internal event</dt>
  <dd>Internal events are events coupled to a specific state machine. Depending on the semantics 
  of a particular state machine, internal events may be generated to realize those semantics. In 
  the context of our library, we only generate automatic events to trigger automatic transitions 
  ; INIT events to jump start a state machine
  </dd>
  <dt>initial event</dt>
  <dd>In the context of our library, the initial event (<b>INIT</b> in the base example 
  illustration) is fired automatically and only upon starting a state machine. The initial event 
  can be used to configure the initial machine transition, out from the initial control state.
  </dd>
  <dt>automatic event</dt>
  <dd>This is an internally triggered event which serves to triggers transitions from control 
  states for which no triggering events are configured. Such transitions are called automatic 
  transitions. Not firing an automatic event would mean that the state machine would be forever  
  stuck in the current control state.
  </dd>
  <dt>transition</dt>
  <dd>Transitions are changes in tne control state of the state machine under study. Transitions 
  can be configured to be taken only when predefined conditions are fulfilled (guards). 
  Transitions can be triggered by an event, or be automatic when no triggering event is specified.
  </dd>
  <dt>automatic transition</dt>
  <dd>Transitions between control states can be automatically evaluated if there are no 
  triggering events configured. The term is a bit confusing however, as it is possible in theory 
  that no transition is actually executed, if none of the configured guard is fulfilled. We 
  forbid this case by contract, as failing to satisfy any such guard would mean that 
   the machine never progress to another state! In our CD player example, an automatic transition
    is defined for control state 3 (`Closing CD drawer`). According to the extended state of our 
    machine, the transition can have as target either the `CD Drawer Closed` or `CD Loaded` 
    control states.
  </dd>
  <dt>self transition</dt>
  <dd>Transitions can also occur with origin and destination the same conrol state. When 
  that happens, the transition is called a self transition. In our base example, the `Team Detail
   Screen` control state features 2 self-transitions.
  </dd>
  <dt>transition evaluation</dt>
  <dd>Given a machine in a given control state, and an external event occuring, the transitions 
  configured for that event are evaluated. This evaluation ends up in identifying a valid 
  transition, which is executed (e.g. taken) leading to a change in the current control state ; 
  or with no satisfying transition in which case the machine remains in the same control state, 
  with the same extended state.
  </dd>
  <dt>guards</dt>
  <dd>Guards associated to a transition are predicates which must be fulfilled for that 
  transition to be executed. Guards play an important role in connecting extended state to the  
  control flow for the computation under specification. As a matter of fact, in our context, guards 
  are pure functions of both the occurring event and extended state.
  </dd>
  <dt>action factory</dt>
  <dd>This is a notion linked to our implementation. An action factory is a function which 
  produces information about two actions to be performed upon executing a transition : update the
   encapsulated extended state for the state transducer, and possibly generate an output to its 
   caller. 
  </dd>
  <dt>output</dt>
  <dd>An output of the transducer is simply the value returned by the transducer upon receiving 
  an input (e.g. event). We will sometimes use the term *action* for output, as in the context of
   user interface specification, the output generated by our transducers will be actions on the 
   interfaced systems. Actions is quite the overloaded and polysemic terms though, so we will try
    as much as possible to use output when necessary to avoid confusion.
  </dd>
  <dt>composite state</dt>
  <dd>As previously presented, an hierarchical state machine may feature control states which may 
  themselves be hierarchical state machines. When that occurs, such control state will be called 
  a composite state. In our CD player example, the control state `CD loaded` is a composite state.
  </dd>
  <dt>compound state</dt>
  <dd>exact synonim of *composite state*
  </dd>
  <dt>nested state</dt>
  <dd>A control state which is part of a composite state
  </dd>
  <dt>atomic state</dt>
  <dd>An atomic state is a control state which is not itself a state machine. In other words, it 
  is a control state like in any standard state machine. In our base example, all states are 
  atomic states. In our CD player example, the control state 5 is an atomic state. The `CD 
  loaded` control state is not.
  </dd>
  <dt>transient state</dt>
  <dd>transient states are control states which are ephemeral. They are meant to be immediately 
  transitioned from. Transient state thus feature no external triggering event (but necessitates 
  of internal automatic event), and may have associated guards. By contract, one of these guards,
   if any, must be fulfilled to prevent the machine for eternally remain in the same control 
   state.   In our CD player example, the control state 3 is a transient state. Upon entering 
   that state, the machine will immediately transition to either control state 1, or composite 
   state `CD loaded`.
  </dd>
  <dt>terminal state</dt>
  <dd>the terminal state is a control state from which the machine is not meant to transition 
  from. This corresponds to a designed or anticipated end of run of the state machine.
  <dt>history state</dt>
  <dd>Semantics for the history state may vary according to the intended application of 
  hierarchical automata. In our restrictive context, the history state allows to transition back 
  to the previous control state that was previously transitioned away from. This makes sense 
  mostly in the context of composite states, which are themselves state machines and hence can be
   in one of several control states. In our CD player example, there are a few examples of 
   history states in the `CD loaded` composite state. For instance, if while being paused 
   (atomic control state 6), the user request the previous CD track, then the machine will 
   transition to... the same control state 6. The same is true if prior to the user request the 
   machine was in control state 4, 5, or 7. History state avoids having to write individual 
   transitions to each of those states from their parent composite state.
  </dd>
  <dt>entry point</dt>
  <dd>Entry points are the target of transitions which are taken when entering a given composite 
  state. This naturally only applies to transitions with origin a control state not included in the 
  composite state and destination a control state part of the composite state. An history state  
  can also be used as an entry point. In our CD player example, control state 1 is an entry point
   for the composite state `No CD loaded`. The same stands for `H` (history state) in `CD Loaded`
    composite state. Similarly a transition from `No CD loaded` to `CD loaded` will result in the
     machine ending in control state 4 (`CD stopped`) by virtue of a chain of entry points 
     leading to that control state.
  </dd>
</dl>

### Transducer behaviour
We give here a quick summary of the operational semantics for the state transducer :

- the machine is configured with a set of states, an initial extended state, transitions, guards, action factories, and user settings
- the machine has a fixed initial control state prior to starting
- starting the machine (`.start()`) triggers the internal INIT event which advances the state 
machine out of the initial control state towards the relevant user-configured control state.
- **TODO** also semantics of history states

### Example run
To illustrate the previously described transducer semantics, let's run the CD drawer example.

**TODO**
 
### Contracts
- The machine cannot stay blocked in the initial control state. This means that at least one 
transition must be configured and be executed between the initial control state and another state
.  This is turn means :
  - at least one non-reserved control state must be configured
  - at least one transition out of the initial control state must be configured
  - of all guards for such transitions, if any, at least one must be fulfilled to enable a 
  transition away from the initial control state
- **TODO**

## `create_state_machine :: FSM_Def -> FSM`
- **TODO**

# Tests
Automated tests are so far incomplete. Most tests have been run manually. To run the 
current automated test, type in a terminal : `npm run test`

# Visualization tools
We have included two helpers for visualization of the state transducer :

- conversion to plantUML : `toPlantUml :: FSM_Def -> PlantUml`.
  - the resulting chain of characters can be pasted in [plantText](`https://www.planttext.com/`) 
  or [planUML previewer](http://sujoyu.github.io/plantuml-previewer/) to get an automated graph 
  representation. Both will produce the exact same visual representation.
- conversion to [online visualizer](https://github.com/brucou/state-transducer-visualizer) format 
(dagre layout engine) : for instructions, cf. github directory : `toDagreVisualizerFormat :: 
FSM_Def -> JSON`

Automated visualization works well with simple graphs, but seems to encounter trouble to generate
 optimally satisfying complex graphs. The Dagre layout seems to be a relatively good option. The 
 [`yed`](https://www.yworks.com/products/yed) orthogonal layout also seems to give pretty good results. 

# References
[comonadic user interfaces](https://functorial.com/the-future-is-comonadic/main.pdf)

# Possible improvements
- any ideas? Post an issue!
