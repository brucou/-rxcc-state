import * as QUnit from "qunitjs"
import * as Rx from "rx"
// TODO : review tests - also tests that the initial model is never modified
// TODO : add merge function when testing streaming library
import { clone, merge } from "ramda"
import { INIT_EVENT, INITIAL_STATE_NAME, toDagreVisualizerFormat } from "../src/synchronous_fsm"

function spy_on_args(fn, spy_fn) {
  return function spied_on(...args) {
    spy_fn(...args);

    return fn(...args);
  }
}

const default_settings = {
  event_emitter_factory: function () {return new Rx.Subject()}
};

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

QUnit.module("Testing conversion from fsm specs to online visualizer format", {});

QUnit.test("History states, entry states, standard states, and all transitions : CD player", function exec_test(assert) {
  function identity() {}

  function fsm_initialize_model() {}

  function open_drawer() {}

  function close_drawer() {}

  function play() {}

  function stop() {}

  function eject() {}

  function go_next_track() {}

  function go_track_1() {}

  function go_previous_track() {}

  function pause_playing_cd() {}

  function resume_paused_cd() {}

  function go_forward_1_s() {}

  function go_backward_1_s() {}

  function create_pause_timer() {}

  function stop_forward_timer() {}

  function stop_backward_timer() {}

  function is_not_cd_in_drawer() {}

  function is_cd_in_drawer() {}

  function is_last_track() {}

  function is_not_last_track() {}

  function is_track_gt_1() {}

  function is_track_eq_1() {}

  function is_not_end_of_cd() {}

  function is_end_of_cd() {}

  const states = {
    no_cd_loaded: {
      cd_drawer_closed: '', cd_drawer_open: '', closing_cd_drawer: ''
    },
    cd_loaded: {
      cd_loaded_group: {
        cd_paused_group: {
          time_and_track_fields_not_blank: '', time_and_track_fields_blank: ''
        },
        cd_playing: '',
        cd_stopped: ''
      },
      stepping_forwards: '',
      stepping_backwards: ''
    }
  };
  const transitions = [
    { from: INITIAL_STATE_NAME, to: "no_cd_loaded", event: INIT_EVENT, action: fsm_initialize_model },
    { from: "no_cd_loaded", to: "cd_drawer_closed", event: INIT_EVENT, action: identity },
    { from: "cd_drawer_closed", to: "cd_drawer_open", event: "EJECT", action: open_drawer },
    { from: "cd_drawer_open", to: "closing_cd_drawer", event: "EJECT", action: close_drawer },
    {
      from: "closing_cd_drawer", guards: [
        { predicate: is_not_cd_in_drawer, to: "cd_drawer_closed", action: identity },
        { predicate: is_cd_in_drawer, to: "cd_loaded", action: identity }
      ]
    },
    { from: "cd_loaded", to: "cd_loaded_group", event: INIT_EVENT, action: identity },
    { from: "cd_playing", to: "cd_paused_group", event: "PAUSE", action: pause_playing_cd },
    { from: "cd_paused_group", to: "cd_playing", event: "PAUSE", action: resume_paused_cd },
    { from: "cd_paused_group", to: "cd_playing", event: "PLAY", action: resume_paused_cd },
    { from: "cd_paused_group", to: "time_and_track_fields_not_blank", event: INIT_EVENT, action: identity },
    {
      from: "time_and_track_fields_not_blank",
      to: "time_and_track_fields_blank",
      event: "TIMER_EXPIRED",
      action: create_pause_timer
    },
    {
      from: "time_and_track_fields_blank",
      to: "time_and_track_fields_not_blank",
      event: "TIMER_EXPIRED",
      action: create_pause_timer
    },
    { from: "cd_paused_group", to: "cd_stopped", event: "STOP", action: stop },
    { from: "cd_stopped", to: "cd_playing", event: "PLAY", action: play },
    { from: "cd_playing", to: "cd_stopped", event: "STOP", action: stop },
    { from: "cd_loaded_group", to: "cd_stopped", event: INIT_EVENT, action: stop },
    {
      from: "cd_loaded_group", event: "NEXT_TRACK", guards: [
        { predicate: is_last_track, to: "cd_stopped", action: stop },
        { predicate: is_not_last_track, to: "history.cd_loaded_group", action: go_next_track }
      ]
    },
    {
      from: "cd_loaded_group", event: "PREVIOUS_TRACK", guards: [
        { predicate: is_track_gt_1, to: "history.cd_loaded_group", action: go_previous_track },
        { predicate: is_track_eq_1, to: "history.cd_loaded_group", action: go_track_1 }
      ]
    },
    { from: "cd_loaded", to: "cd_drawer_open", event: "EJECT", action: eject },
    {
      from: "stepping_forwards", event: "TIMER_EXPIRED", guards: [
        { predicate: is_not_end_of_cd, to: "stepping_forwards", action: go_forward_1_s },
        { predicate: is_end_of_cd, to: "cd_stopped", action: stop }
      ]
    },
    { from: "stepping_forwards", to: "history.cd_loaded_group", event: "FORWARD_UP", action: stop_forward_timer },
    { from: "cd_loaded_group", to: "stepping_forwards", event: "FORWARD_DOWN", action: go_forward_1_s },
    { from: "stepping_backwards", to: "stepping_backwards", event: "TIMER_EXPIRED", action: go_backward_1_s },
    { from: "stepping_backwards", to: "history.cd_loaded_group", event: "REVERSE_UP", action: stop_backward_timer },
    { from: "cd_loaded_group", to: "stepping_backwards", event: "REVERSE_DOWN", action: go_backward_1_s }
  ];

  const fsmDef = {
    states,
    transitions,
  };
  const translation = toDagreVisualizerFormat(fsmDef, {});
  const expectedTranslation = {
    "states": ["nok", [["no_cd_loaded", ["cd_drawer_closed", "cd_drawer_open", "closing_cd_drawer"]], ["cd_loaded", [["cd_loaded_group", [["cd_paused_group", ["time_and_track_fields_not_blank", "time_and_track_fields_blank"]], "cd_playing", "cd_stopped"]], "stepping_forwards", "stepping_backwards"]]]],
    "transitions": [{
      "from": "nok",
      "to": "no_cd_loaded",
      "event": "init",
      "action": "fsm_initialize_model"
    }, {
      "from": "no_cd_loaded",
      "to": "cd_drawer_closed",
      "event": "init",
      "action": "identity"
    }, {
      "from": "cd_drawer_closed",
      "to": "cd_drawer_open",
      "event": "EJECT",
      "action": "open_drawer"
    }, {
      "from": "cd_drawer_open",
      "to": "closing_cd_drawer",
      "event": "EJECT",
      "action": "close_drawer"
    }, {
      "from": "closing_cd_drawer",
      "guards": [{
        "predicate": "is_not_cd_in_drawer",
        "to": "cd_drawer_closed",
        "action": "identity"
      }, { "predicate": "is_cd_in_drawer", "to": "cd_loaded", "action": "identity" }]
    }, {
      "from": "cd_loaded",
      "to": "cd_loaded_group",
      "event": "init",
      "action": "identity"
    }, {
      "from": "cd_playing",
      "to": "cd_paused_group",
      "event": "PAUSE",
      "action": "pause_playing_cd"
    }, {
      "from": "cd_paused_group",
      "to": "cd_playing",
      "event": "PAUSE",
      "action": "resume_paused_cd"
    }, {
      "from": "cd_paused_group",
      "to": "cd_playing",
      "event": "PLAY",
      "action": "resume_paused_cd"
    }, {
      "from": "cd_paused_group",
      "to": "time_and_track_fields_not_blank",
      "event": "init",
      "action": "identity"
    }, {
      "from": "time_and_track_fields_not_blank",
      "to": "time_and_track_fields_blank",
      "event": "TIMER_EXPIRED",
      "action": "create_pause_timer"
    }, {
      "from": "time_and_track_fields_blank",
      "to": "time_and_track_fields_not_blank",
      "event": "TIMER_EXPIRED",
      "action": "create_pause_timer"
    }, { "from": "cd_paused_group", "to": "cd_stopped", "event": "STOP", "action": "stop" }, {
      "from": "cd_stopped",
      "to": "cd_playing",
      "event": "PLAY",
      "action": "play"
    }, { "from": "cd_playing", "to": "cd_stopped", "event": "STOP", "action": "stop" }, {
      "from": "cd_loaded_group",
      "to": "cd_stopped",
      "event": "init",
      "action": "stop"
    }, {
      "from": "cd_loaded_group",
      "event": "NEXT_TRACK",
      "guards": [{
        "predicate": "is_last_track",
        "to": "cd_stopped",
        "action": "stop"
      }, { "predicate": "is_not_last_track", "to": "history.cd_loaded_group", "action": "go_next_track" }]
    }, {
      "from": "cd_loaded_group",
      "event": "PREVIOUS_TRACK",
      "guards": [{
        "predicate": "is_track_gt_1",
        "to": "history.cd_loaded_group",
        "action": "go_previous_track"
      }, { "predicate": "is_track_eq_1", "to": "history.cd_loaded_group", "action": "go_track_1" }]
    }, {
      "from": "cd_loaded",
      "to": "cd_drawer_open",
      "event": "EJECT",
      "action": "eject"
    }, {
      "from": "stepping_forwards",
      "event": "TIMER_EXPIRED",
      "guards": [{
        "predicate": "is_not_end_of_cd",
        "to": "stepping_forwards",
        "action": "go_forward_1_s"
      }, { "predicate": "is_end_of_cd", "to": "cd_stopped", "action": "stop" }]
    }, {
      "from": "stepping_forwards",
      "to": "history.cd_loaded_group",
      "event": "FORWARD_UP",
      "action": "stop_forward_timer"
    }, {
      "from": "cd_loaded_group",
      "to": "stepping_forwards",
      "event": "FORWARD_DOWN",
      "action": "go_forward_1_s"
    }, {
      "from": "stepping_backwards",
      "to": "stepping_backwards",
      "event": "TIMER_EXPIRED",
      "action": "go_backward_1_s"
    }, {
      "from": "stepping_backwards",
      "to": "history.cd_loaded_group",
      "event": "REVERSE_UP",
      "action": "stop_backward_timer"
    }, {
      "from": "cd_loaded_group",
      "to": "stepping_backwards",
      "event": "REVERSE_DOWN",
      "action": "go_backward_1_s"
    }]
  };

  assert.deepEqual(JSON.parse(translation), expectedTranslation, `works`);
});


