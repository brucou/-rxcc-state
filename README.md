# Motivation
There are numerous computations which can be described advantageously[^1] by a parameterizable set
 of rules, coalescing around a fixed set of control states, and matching an output to an input 
 depending on current and past inputs : 

- An user interface [can be seen as a state transducer](https://brucou.github.io/posts/user-interfaces-as-reactive-systems/#reactive-systems-as-automata), translating a user 
input into a user action on the interfaced systems, while modifying the user interface's 
internal state according to a predefined set of rules. 
- Another particularly interesting field of application is [model-based testing, and test input 
generation](https://pdfs.semanticscholar.org/f8e6/b3019c0d5422f35d2d98c242f149184992a3.pdf).
- Decision-making in game's AI is amenable to modelization by a fixed logic encompassing a fixed 
set of conditions and game agents' state

Such computations can often enough be modelized through an Extended Hierarchical State Transducer 
in a way that :

- is economical (complexity of the transducer proportional to complexity of the computation)
- is reasonably easy to reason about and communicate up to an intermediate scale (the transducer can
 be visually represented, supporting both internal and external communication, and design 
 specification and documentation)
- supports step-wise refinement and iterative development (control states can be refined into a 
hierarchy of substates)

Concretely, we have so far successfully used this library :

- in [multi-steps workflows](https://github.com/brucou/component-combinators/tree/master/examples/volunteerApplication), a constant feature of enterprise software today
- for ['smart' synchronous streams](https://github.com/brucou/partial-synchronous-streams), which
 avoid useless (re-)computations
- to implement ad-hoc cross-domain communication protocols

[^1]: In fact, a computation can be understood as [precisely the result of a machine run](https://en.wikipedia.org/wiki/Computability_theory). Some formalization of the matching 
computing machine however can be useless in practice, which is why we use the term advantageously
 to indicate those computations where a formalization of the computing machine brings desired 
 benefits.

# So what is an Extended Hierarchical State Transducer ? 
Let's build the concept progressively.

An [automaton](https://en.wikipedia.org/wiki/Automata_theory) is a construct made of states designed to determine if the input should be accepted or rejected. It looks a lot like a basic board game where each space on the board represents a state. Each state has information about what to do when an input is received by the machine (again, rather like what to do when you land on the Jail spot in a popular board game). As the machine receives a new input, it looks at the state and picks a new spot based on the information on what to do when it receives that input at that state. When there are no more inputs, the automaton stops and the space it is on when it completes determines whether the automaton accepts or rejects that particular set of inputs.

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
## API summary
Our state transducer will be created by the factory function `create_state_machine`, which 
returns a state transducer which :

- must be started manually (with `.start()`), and configured with an initial state 
- will compute an output for any input that is sent to it (with `.yield(input)`)

The state transducer is not, in general, a pure function of its inputs. However a given output of
 the transducer depends exclusively on the sequence of inputs it has received so far. This means 
 that it is possible to associate to a state transducer another function which takes a sequence of
  inputs into a sequence of outputs, in a way that that function is pure. 
  
  We provide a way to 
  construct such a function with the `makeStreamingStateMachine` factory to create a stream 
  transducer, which translates an input stream into an output stream.

## General concepts
To help illustrate the concepts, and the terminology, we will use two examples, featuring 
basic and advanced features on the hierarchical state transducer model : 

- a real use case of state machine applied to a web application user interface
- the specification of the behaviour for a cd player

We will subsequently precise here the vocabulary which will be used throughout the documentation.
  We then describe how the behaviour of a transducer relates to its configuration. In particular
  we detail the concepts and semantics associated to hierarchical states. Finally we present our
   API whose documentation relies on all previously introduced concepts.

mmmm the progression logic is somewhat deficient...

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
 history states, composite states, and entry points.
 
![cd player state chart](http://i.imgur.com/ygsOVi9.jpg)


### Terminology
In this section, we seek to define quickly the meaning of the key terms which will be commonly 
used when referring to state machines.

**TODO** : add references to the cd player graph to illustrate advanced terminology

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
   library is user interface implementation, inputs will often to events generatd by a user. We 
   thus conflate both terms in the context of this documentation.
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
  forbid this case by conract, as failing to satisfy any such guard would mean that 
   the machine never progress to another state!
  </dd>
  <dt>self transition</dt>
  <dd>Transitions can also occur with origin and destination the same conrol state. When 
  that happens, the transition is called a self transition.
  </dd>
  <dt>transition evaluation</dt>
  <dd>Goven a machine in a given control state, and an external event occuring, the transitions 
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
  a composite state.
  </dd>
  <dt>compound state</dt>
  <dd>exact synonim of *composite state*
  </dd>
  <dt>nested state</dt>
  <dd>A control state which is part of a composite state
  </dd>
  <dt>atomic state</dt>
  <dd>An atomic state is a control state which is not itself a state machine. In other words, it 
  is a control state like in any standard state machine.
  </dd>
  <dt>transient state</dt>
  <dd>transient states are control states which are ephemeral. They are meant to be immediately 
  transitioned from. Transient state thus feature no external triggering event (but necessitates 
  of internal automatic event), and may have associated guards. By contract, one of these guards,
   if any, must be fulfilled to prevent the machine for eternally remain in the same control state  
  </dd>
  <dt>terminal state</dt>
  <dd>the terminal state is a control state from which the machine is not meant to transition 
  from. This corresponds to a designed or anticipated end of run of the state machine.
  <dt>history state</dt>
  <dd>Semantics for the history state may vary according to the intended application of 
  hierarchical automata. In our restrictive context, the history state allows to transition back 
  to the previous control state that was previously transitioned away from. This makes sense 
  mostly in the context of composite states, which are themselves state machines and hence can be
   in one of several control states. A picture is worth many words, but the picture is still in 
   the works. **TODO : only shallow history for us, deep history is hard to reason about**
  </dd>
  <dt>entry point</dt>
  <dd>Entry points are transitions which are taken when entering a given composite state. This 
  naturally only applies to transitions from states which are enclosed in the composite state 
  towards the mentioned composite state. An history state can also be used as an entry point.
  </dd>
  <dt>exit point</dt>
  <dd>Exit points are transitions which are taken when leaving a given composite state. They are 
  less useful in our context. **TODO : example??**
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
. This is turn means :
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
