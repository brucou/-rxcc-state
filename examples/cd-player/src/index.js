import { App } from "./app"
import { createHashHistory, createHistory } from "history"
import { makeRouterDriver, supportsHistory } from 'cyclic-router'
import defaultModules from "cycle-snabbdom/lib/modules"
import * as localForage from "localforage";
// drivers
import { makeDOMDriver } from "cycle-snabbdom"
import { run } from "@cycle/core"
import { makeDomainActionDriver, makeDomainQueryDriver } from '@rxcc/drivers';
import { defaultUser, loadTestData } from '../fixtures';
// domain
import { domainActionsConfig, domainObjectsQueryMap } from './domain/index';
// utils
import { convertVNodesToHTML, DOM_SINK } from "@rxcc/utils"

const history = supportsHistory() ? createHistory() : createHashHistory();
const repository = localForage;
const modules = defaultModules;

// Helpers
function documentDriver(_) {
  void _; // unused sink, this is a read-only driver

  return document
}

// TODO : cd player APP
const { sources, sinks } = run(App, {
  [DOM_SINK]: makeDOMDriver('#app', { transposition: false, modules }),
  router: makeRouterDriver(history, { capture: true }),
  user$: makeFakeUserDriver(defaultUser),
  domainQuery: makeDomainQueryDriver(repository, domainObjectsQueryMap),
  domainAction$: makeDomainActionDriver(repository, domainActionsConfig),
  document: documentDriver
});

// Webpack specific code
if (module.hot) {
  module.hot.accept();

  module.hot.dispose(() => {
    sinks.dispose()
    sources.dispose()
  });
}

// NOTE : convert html to snabbdom online to http://html-to-hyperscript.paqmind.com/
// ~~ attributes -> attrs
