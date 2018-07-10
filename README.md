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

- is economical (complexity of the transducer proportional to complexity of the 
computation)
- is easy to reason about (he transducer can be visually represented, supporting both 
internal and external communication, and design specification and documentation)
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
machine, which in addition to accepting inputs, and modifying its state accordingly, also 
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

# Example

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
