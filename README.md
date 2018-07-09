# Motivation
There are numerous computations which can be described by a fixed set of 
 rules coalescing around a fixed set of control states, and matching an output to an input, 
 depending on past inputs : 

- An user interface [can be seen as a state transducer](https://brucou.github
.io/posts/user-interfaces-as-reactive-systems/#reactive-systems-as-automata), translating a user input into a user action,
 while modifying its internal state according to a predefined set of rules. 
- A particularly interesting field of application is [model-based testing, and test input 
generation](https://pdfs.semanticscholar.org/f8e6/b3019c0d5422f35d2d98c242f149184992a3.pdf).

# What is an Extended Hierarchical State Transducer ? 
An [automaton](https://en.wikipedia.org/wiki/Automata_theory) is a construct made of states designed to determine if the input should be accepted 
or rejected. It looks a lot like a basic board game where each space on the board represents a state. Each state has information about what to do when an input is received by the machine (again, rather like what to do when you land on the Jail spot in a popular board game). As the machine receives a new input, it looks at the state and picks a new spot based on the information on what to do when it receives that input at that state. When there are no more inputs, the automaton stops and the space it is on when it completes determines whether the automaton accepts or rejects that particular set of inputs.

State machines and automata are essentially interchangeable terms. Automata is the favored terms 
when connoting automata theory, while state machines is more often used in the context of the 
actual or practical usage of automata.

An extended state machine is a state machine endowed with a set of variables, predicates (guards)
and instructions governing the update of the mentiond set of variables. To any extended state 
machines it corresponds a standard state machine. An extended state machine allows however to 
describe succintly a class of standard state machines, parameterized by its set of variables.

A hierarchical state machine is a state machine whose states can be themselves state machines.

A [state transducer](https://en.wikipedia.org/wiki/Finite-state_transducer) is a category of 
state machine, which in addition to accepting inputs, and modifying its state accordingly, also 
generate outputs.

We propose here a library dealing with extended hierarchical state transducers, i.e. a state machine
whose states can be other state machines (hierarchical part), which associate an output to an 
input (transducer part), and whose input/output relation follows a logic guided by 
predefined control states (state machine part), and which encapsulates a memory which can be 
modified through predicates, and actions (extended part).

Note that if we add concurrency and messaging to extended hierarchical state machines, we get a 
statechart. We made the decision to discard any concurrency mechanism and broadcast mechanism for
 two reasons :
 
 - this is the weak point of statecharts, specially when it comes to readability, and semantics 
 - we want to give the library user the possibility to choose its own concurrency and 
 messaging semantics (sync/async, queued/unqueued, peer-to-peer/publish-subscribe, 
 preemption/cooperation, etc.)

# Install

# API

# Example

# Tests

# References

# Possible improvements
- Rxjs is a dependency... only needed for pub/sub, it could possibly be switched out to a minimal
 pub/sub mechanism. To think about.
- Ramda could easily be removed as a dependency - only using always, clone, keys 
- any ideas? Post an issue!
