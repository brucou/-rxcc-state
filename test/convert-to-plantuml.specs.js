import * as QUnit from "qunitjs"
import * as Rx from "rx"
import { clone, F, merge, T } from "ramda"
import {
  create_state_machine, INIT_EVENT, INITIAL_STATE_NAME, NO_OUTPUT, toPlantUml
} from "../src/synchronous_fsm"

function always_true() {return true}
function always_false() {return false}
const default_settings = {
  subject_factory: function () {return new Rx.Subject()},
  merge : Rx.Observable.merge
};
const FALSE_GUARD = function always_false(action) {return [{predicate:always_false, to : undefined, action}]};
const TRUE_GUARD = function always_true(to, action) { return [{predicate:always_true, to, action}]};

const NO_ACTION = null;
const EVENT1 = 'event1';
const EVENT1_DATA = {
  event1_data_key1: 'event1_data_value1'
}
const a_value = "some value";
const another_value = "another value";
const an_object_value = {
  objKey1: 'objValue1',
  objKey2: 'objValue2',
  objKey3: 'objValue3',
};
const an_output = {
  outputKey1: 'outputValue1'
};
const another_output = {
  anotherOutputKey1: 'anotherOutputValue1'
};
const model_initial = {
  a_key: a_value,
  another_key: another_value
};
const dummy_action_result = {
  model_update: [],
  output: an_output
};
const another_dummy_action_result = {
  model_update: [],
  output: another_output
};
const replaced_model_property = {
  new_model_key: 'new_model_value'
}
const update_model_ops_1 = [
  { op: "add", path: '/new_model_key_1', value: 'new_model_value_1' },
  { op: "replace", path: '/a_key', value: replaced_model_property },
  { op: "remove", path: '/another_key' },
];
const update_model_ops_2 = [
  { op: "add", path: '/new_model_key_2', value: 'new_model_value_2' },
];
const dummy_action_result_with_update = {
  model_update: update_model_ops_1,
  output: an_output
};
const another_dummy_action_result_with_update = {
  model_update: update_model_ops_2,
  output: another_output
};

function dummy_action(model, event_data, settings) {
  return dummy_action_result
}
function another_dummy_action(model, event_data, settings) {
  return another_dummy_action_result
}
function dummy_action_with_update(model, event_data, settings) {
  return merge(dummy_action_result_with_update, {
    output: {
      // NOTE : ! this is the model before update!!
      model: clone(model),
      event_data: clone(event_data),
      settings: JSON.parse(JSON.stringify(settings))
    }
  })
}
function another_dummy_action_with_update(model, event_data, settings) {
  return merge(another_dummy_action_result_with_update, {
      output: {
        // NOTE : ! this is the model before update!!
        model: clone(model),
        event_data: clone(event_data),
        settings: JSON.parse(JSON.stringify(settings))
      }
    }
  )
}

QUnit.module("Testing plant UML graph specs conversion", {});

QUnit.test("transition labelling with guards and actions, but no events", function exec_test(assert) {
  const fsmDef = {
    states: { A: '' },
    events: [],
    transitions: [
      {
        from: INITIAL_STATE_NAME, event: INIT_EVENT, guards: [
          { predicate: always_true, to: 'A', action: dummy_action },
          { predicate: always_false, to: 'A', action: another_dummy_action }
        ]
      }
    ],
    initial_extended_state: model_initial
  };
  const translation = toPlantUml(fsmDef, {});
  assert.deepEqual(translation, `state "A" as A <<NoContent>> {
}

[*] --> A :  [always_true] / dummy_action
[*] --> A :  [always_false] / another_dummy_action`,
    `works`);
});

