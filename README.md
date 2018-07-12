# Motivation
Time and again we have to implement computations which, while they cannot be modelized by pure 
functions, however have the following properties :

- they transform an input into an output, depending only on the present and past inputs
- they do not perform any effects
- the algorithm for the computation involves a finite, parameterizable set of rules, coalescing  
around a finite, fixed set of control states

These computations can often be modelized advantageouly[^1] by a class of state machines called 
hierarchical extended state producer. This library offers a way to define, and use such class of
 state machines.

The major motivation for this library has been the specification and implementation of user 
interfaces. As a matter of fact, to [every user interface can be associated a computation](https://brucou.github.io/posts/user-interfaces-as-reactive-systems/#reactive-systems-as-automata) 
relating a user input to an action to be performed on the interfaced systems. That computation 
often has a logic organized around a limited set of control states. For instance, a train 
ticket booking system will have a window with a `book now` button which will be associated to a 
search result screen, **or alternatively** to a request to the user to enter missing data. The 
same input thus produces different outputs. However the rules discriminating the output to 
produce are simple enough to be described by a finite set of rules, parametrizable by relevant 
variables specific to the booking logic (if the user already entered his loyalty number, the search 
will also include the cost of tickets in loyalty points, etc.).

However, it is a very general tool, that have found miscellaneous applications in different 
contexts :

- user interface specification and implementation for embedded systems
- [model-based testing, and test input generation](https://pdfs.semanticscholar.org/f8e6/b3019c0d5422f35d2d98c242f149184992a3.pdf)
- AI's decision making in games

Concretely, we have so far successfully used this library :

- in [multi-steps workflows](https://github.com/brucou/component-combinators/tree/master/examples/volunteerApplication), a constant feature of enterprise software today
- for ['smart' synchronous streams](https://github.com/brucou/partial-synchronous-streams), which
 avoid useless (re-)computations
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
machines it corresponds a standard state machine. An extended state machine allows however to 
describe succintly a class of standard state machines, parameterized by its set of variables.

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

Note that if we add concurrency and messaging (broadcast) to extended hierarchical state machines,
 we get a statechart. We made the decision to discard any concurrency mechanism and broadcast mechanism for
 two reasons :
 
 - these are arguably the weak point of statecharts, specially when it comes to readability, and 
 coherent semantics 
 - we want to give the library user the possibility to choose its own concurrency and 
 messaging semantics (sync/async, deterministic/non-deterministic, queued/unqueued, 
 peer-to-peer/publish-subscribe, preemption/cooperation, etc.)

# Install

# API
## API design
The key objectives for the API was :

- generality and reusability (there is no provision made to accommodate specific use cases or 
frameworks)
  - it must be possible to add a concurrency and/or communication mechanism on top of the 
  current design 
  - it must be possible to integrate smoothly into React, Angular and your popular framework
- complete encapsulation of the state of the state transducer
- no effects performed by the machine
- parallel and sequential composability of transducers
- support for both interactive and reactive programming

As a result of this, the following choices were made :

- functional interface : the transducer is a function, not an object with publicly exposed 
properties. As such the transducer is a black-box, and only its computed outputs can be observed
- no exit and entry actions, or activities as in other state machine formalisms
- every computation performed is synchronous (asynchrony is an effect)
- action factories return the **updates** to the extended state (JSON patch format) to avoid any 
unwanted direct modification of the extended state
- no restriction is made on output of transducers, but inputs must follow some conventions (if a
 machine's output match those conventions, two such machines can be composed by function 
 composition)
- reactive programming is enabled by exposing a pure function of an input stream, which run the 
transducer for each incoming input, thus generating a sequence of outputs

Concretely, our state transducer will be created by the factory function `create_state_machine`, 
which returns a state transducer which :

- must be started manually (with `.start()`), and configured with an initial event and transition 
- will compute an output for any input that is sent to it (with `.yield(input)`)

The state transducer is not, in general, a pure function of its inputs. However a given output of
 the transducer depends exclusively on the sequence of inputs it has received so far. This means 
 that it is possible to associate to a state transducer another function which takes a sequence of
  inputs into a sequence of outputs, in a way that that function is pure. 
  
We provide a way to construct such a function with the `makeStreamingStateMachine` factory to 
create a stream transducer, which translates an input stream into an output stream.

## General concepts
To help illustrate the concepts, and the terminology, we will use two examples, featuring 
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
information, and navigate through the application process up to completion, by clicking on 
buttons corresponding to the user decision. 

That application process concretely consists of 5 screens whose flow is defined by the UX team as
 follows :
 
![User flow](https://github.com/brucou/component-combinators/raw/master/examples/volunteerApplication/assets/volunteerApplication/application%20process.png) 

This in turn was turned into a non-trivial state machine (6 states, 17 transitions) orchestrating 
the screens to display in function of the user inputs. The machine does not display the screen 
itself (it performs no effects), it computes which screen to display according to the sequence of
 inputs performed by the user and its extended state (which includes here the state of the 
 application process) :
 
![illustration of basic terminology](https://i.imgur.com/byRSrGH.png)

### CD drawer example
This example is taken from Ian Horrock's seminal book on statecharts and is the specification of
 a CD player. It features advanced characteristics of hierarchical state machines, including 
 history states, composite states, transient states, automatic transitions, and entry points.
 
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
- **TODO**

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

# References

# Possible improvements
- any ideas? Post an issue!

# Definitions
DEFINITION 2.1 A sequential machine M is an algebraic system
defined as follows: $M = (I, S, O, ~, ~)$, where:

- $I$ - a finite non-empty set of inputs,
- $S$ - a finite non-empty set of internal states,
- $O$ - a finite set of outputs,
- $\delta$ - the next-state function: $\delta : SxI \rightarrow S$,
- $\lambda$ - the output function, ~: SxI -7 0 (a Mea~y machine), or ~: S -7 0 (a Moore machine).

When an output set 0 and the output function ~ are not defined,
the sequential machine M = (I, S, ~) is called a state machine. 
