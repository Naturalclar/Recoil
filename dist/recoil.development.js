'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var react = _interopDefault(require('react'));
var reactNative = _interopDefault(require('react-native'));

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Utilities for working with built-in Maps and Sets without mutating them.
 *
 * @emails oncall+perf_viz
 * 
 * @format
 */

function setByAddingToSet(set, v) {
  const next = new Set(set);
  next.add(v);
  return next;
}

function setByDeletingFromSet(set, v) {
  const next = new Set(set);
  next.delete(v);
  return next;
}

function mapBySettingInMap(map, k, v) {
  const next = new Map(map);
  next.set(k, v);
  return next;
}

function mapByUpdatingInMap(map, k, updater) {
  const next = new Map(map);
  next.set(k, updater(next.get(k)));
  return next;
}

function mapByDeletingFromMap(map, k) {
  const next = new Map(map);
  next.delete(k);
  return next;
}

var Recoil_CopyOnWrite = {
  setByAddingToSet,
  setByDeletingFromSet,
  mapBySettingInMap,
  mapByUpdatingInMap,
  mapByDeletingFromMap
};

/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * 
 * @format
 */

function isNode(object) {
  var _ownerDocument, _doc$defaultView;

  if (typeof window === 'undefined') {
    return false;
  }

  const doc = object != null ? (_ownerDocument = object.ownerDocument) !== null && _ownerDocument !== void 0 ? _ownerDocument : object : document;
  const defaultView = (_doc$defaultView = doc.defaultView) !== null && _doc$defaultView !== void 0 ? _doc$defaultView : window;
  return !!(object != null && (typeof defaultView.Node === 'function' ? object instanceof defaultView.Node : typeof object === 'object' && typeof object.nodeType === 'number' && typeof object.nodeName === 'string'));
}

var Recoil_isNode = isNode;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * 
 * @format
 */

// Split declaration and implementation to allow this function to pretend to
// check for actual instance of Promise instead of something with a `then`
// method.
// eslint-disable-next-line no-redeclare
function isPromise(p) {
  return !!p && typeof p.then === 'function';
}

var Recoil_isPromise = isPromise;

function shouldNotBeFrozen(value) {
  // Primitives and functions:
  if (value === null || typeof value !== 'object') {
    return true;
  } // React elements:


  switch (typeof value.$$typeof) {
    case 'symbol':
      return true;

    case 'number':
      return true;
  } // Immutable structures:


  if (value['@@__IMMUTABLE_ITERABLE__@@'] != null || value['@@__IMMUTABLE_KEYED__@@'] != null || value['@@__IMMUTABLE_INDEXED__@@'] != null || value['@@__IMMUTABLE_ORDERED__@@'] != null || value['@@__IMMUTABLE_RECORD__@@'] != null) {
    return true;
  } // DOM nodes:


  if (Recoil_isNode(value)) {
    return true;
  }

  if (Recoil_isPromise(value)) {
    return true;
  }

  return false;
} // Recursively freeze a value to enforce it is read-only.
// This may also have minimal performance improvements for enumerating
// objects (based on browser implementations, of course)


function deepFreezeValue(value) {
  if (typeof value !== 'object' || shouldNotBeFrozen(value)) {
    return;
  }

  Object.freeze(value); // Make all properties read-only

  for (const prop in value) {
    if (value.hasOwnProperty(prop)) {
      deepFreezeValue(value[prop]);
    }
  }

  Object.seal(value); // This also makes existing properties non-configurable.
}

var Recoil_deepFreezeValue = deepFreezeValue;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * 
 * @format
 */

function nullthrows(x, message) {
  if (x != null) {
    return x;
  }

  throw new Error(message !== null && message !== void 0 ? message : 'Got unexpected null or undefined');
}

var Recoil_nullthrows = nullthrows;

// TODO Convert Loadable to a Class to allow for runtime type detection.
// Containing static factories of withValue(), withError(), withPromise(), and all()


const loadableAccessors = {
  getValue() {
    if (this.state !== 'hasValue') {
      throw this.contents; // Throw Error, or Promise for the loading state
    }

    return this.contents;
  },

  toPromise() {
    return this.state === 'hasValue' ? Promise.resolve(this.contents) : this.state === 'hasError' ? Promise.reject(this.contents) : this.contents;
  },

  valueMaybe() {
    return this.state === 'hasValue' ? this.contents : undefined;
  },

  valueOrThrow() {
    if (this.state !== 'hasValue') {
      throw new Error(`Loadable expected value, but in "${this.state}" state`);
    }

    return this.contents;
  },

  errorMaybe() {
    return this.state === 'hasError' ? this.contents : undefined;
  },

  errorOrThrow() {
    if (this.state !== 'hasError') {
      throw new Error(`Loadable expected error, but in "${this.state}" state`);
    }

    return this.contents;
  },

  promiseMaybe() {
    return this.state === 'loading' ? this.contents : undefined;
  },

  promiseOrThrow() {
    if (this.state !== 'loading') {
      throw new Error(`Loadable expected promise, but in "${this.state}" state`);
    }

    return this.contents;
  },

  // TODO Unit tests
  // TODO Convert Loadable to a Class to better support chaining
  //      by returning a Loadable from a map function
  map(map) {
    if (this.state === 'hasError') {
      return this;
    }

    if (this.state === 'hasValue') {
      try {
        const next = map(this.contents); // TODO if next instanceof Loadable, then return next

        return Recoil_isPromise(next) ? loadableWithPromise(next) : loadableWithValue(next);
      } catch (e) {
        return Recoil_isPromise(e) ? // If we "suspended", then try again.
        // errors and subsequent retries will be handeled in 'loading' case
        loadableWithPromise(e.next(() => map(this.contents))) : loadableWithError(e);
      }
    }

    if (this.state === 'loading') {
      return loadableWithPromise(this.contents // TODO if map returns a loadable, then return the value or promise or throw the error
      .then(map).catch(e => {
        if (Recoil_isPromise(e)) {
          // we were "suspended," try again
          return e.then(() => map(this.contents));
        }

        throw e;
      }));
    }

    throw new Error('Invalid Loadable state');
  }

};

function loadableWithValue(value) {
  // Build objects this way since Flow doesn't support disjoint unions for class properties
  return Object.freeze({
    state: 'hasValue',
    contents: value,
    ...loadableAccessors
  });
}

function loadableWithError(error) {
  return Object.freeze({
    state: 'hasError',
    contents: error,
    ...loadableAccessors
  });
}

function loadableWithPromise(promise) {
  return Object.freeze({
    state: 'loading',
    contents: promise,
    ...loadableAccessors
  });
}

function loadableLoading() {
  return loadableWithPromise(new Promise(() => {}));
}

function loadableAll(inputs) {
  return inputs.every(i => i.state === 'hasValue') ? loadableWithValue(inputs.map(i => i.contents)) : inputs.some(i => i.state === 'hasError') ? loadableWithError( // $FlowIssue #44070740 Array.find should refine parameter
  Recoil_nullthrows(inputs.find(i => i.state === 'hasError'), 'Invalid loadable passed to loadableAll').contents) : loadableWithPromise( Promise.all(inputs.map(i => i.contents)));
}

var Recoil_Loadable = {
  loadableWithValue,
  loadableWithError,
  loadableWithPromise,
  loadableLoading,
  loadableAll
};

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+perf_viz
 * 
 * @format
 */

// eslint-disable-next-line no-unused-vars
class AbstractRecoilValue {
  constructor(newKey) {
    this.key = newKey;
  }

}

class RecoilState extends AbstractRecoilValue {}

class RecoilValueReadOnly extends AbstractRecoilValue {}

var Recoil_RecoilValueClasses = {
  AbstractRecoilValue,
  RecoilState,
  RecoilValueReadOnly
};

class DefaultValue {}

const DEFAULT_VALUE = new DefaultValue();

class RecoilValueNotReady extends Error {
  constructor(key) {
    super(`Tried to set the value of Recoil selector ${key} using an updater function, but it is an async selector in a pending or error state; this is not supported.`);
  }

}

// flowlint-next-line unclear-type:off
const nodes = new Map();
/* eslint-disable no-redeclare */

function registerNode(node) {
  if (nodes.has(node.key)) {
    const message = `Duplicate atom key "${node.key}". This is a FATAL ERROR in
      production. But it is safe to ignore this warning if it occured because of
      hot module replacement.`; // if (__DEV__) {
  }

  nodes.set(node.key, node);
  return node.set == null ? new Recoil_RecoilValueClasses.RecoilValueReadOnly(node.key) : new Recoil_RecoilValueClasses.RecoilState(node.key);
}
/* eslint-enable no-redeclare */


class NodeMissingError extends Error {} // flowlint-next-line unclear-type:off


function getNode(key) {
  const node = nodes.get(key);

  if (node == null) {
    throw new NodeMissingError(`Missing definition for RecoilValue: "${key}""`);
  }

  return node;
}

var Recoil_Node = {
  nodes,
  registerNode,
  getNode,
  NodeMissingError,
  DefaultValue,
  DEFAULT_VALUE,
  RecoilValueNotReady
};

// flowlint-line untyped-import:off


function trace(message, node, fn) {
  // if (__DEV__) {
  //   if (
  //     SchedulerTracing.unstable_trace !== undefined &&
  //     window.performance !== undefined
  //   ) {
  //     return SchedulerTracing.unstable_trace(
  //       `Recoil: ${message} for node: ${
  //         typeof node === 'string' ? node : node.key
  //       }`,
  //       window.performance.now(),
  //       fn,
  //     );
  //   }
  // }
  return fn();
}

function wrap(fn) {
  // if (__DEV__) {
  //   if (SchedulerTracing.unstable_wrap !== undefined) {
  //     return SchedulerTracing.unstable_wrap(fn);
  //   }
  // }
  return fn;
}

var Recoil_Tracing = {
  trace,
  wrap
};

const {
  mapByDeletingFromMap: mapByDeletingFromMap$1,
  mapBySettingInMap: mapBySettingInMap$1,
  mapByUpdatingInMap: mapByUpdatingInMap$1,
  setByAddingToSet: setByAddingToSet$1
} = Recoil_CopyOnWrite;

const {
  getNode: getNode$1
} = Recoil_Node;

 // flowlint-next-line unclear-type:off


const emptyMap = Object.freeze(new Map()); // flowlint-next-line unclear-type:off

const emptySet = Object.freeze(new Set());

class ReadOnlyRecoilValueError extends Error {} // Get the current value loadable of a node and update the state.
// Update dependencies and subscriptions for selectors.
// Update saved value validation for atoms.


function getNodeLoadable(store, state, key) {
  return getNode$1(key).get(store, state);
} // Peek at the current value loadable for a node.
// NOTE: This will ignore updating the state for subscriptions so use sparingly!!


function peekNodeLoadable(store, state, key) {
  return getNodeLoadable(store, state, key)[1];
} // Write value directly to state bypassing the Node interface as the node
// definitions may not have been loaded yet when processing the initial snapshot.


function setUnvalidatedAtomValue(state, key, newValue) {
  return { ...state,
    atomValues: mapByDeletingFromMap$1(state.atomValues, key),
    nonvalidatedAtoms: mapBySettingInMap$1(state.nonvalidatedAtoms, key, newValue),
    dirtyAtoms: setByAddingToSet$1(state.dirtyAtoms, key)
  };
} // Set a node value and return the set of nodes that were actually written.
// That does not include any downstream nodes which are dependent on them.


function setNodeValue(store, state, key, newValue) {
  const node = getNode$1(key);

  if (node.set == null) {
    throw new ReadOnlyRecoilValueError(`Attempt to set read-only RecoilValue: ${key}`);
  }

  const [newState, writtenNodes] = node.set(store, state, newValue);
  return [newState, writtenNodes];
} // Find all of the recursively dependent nodes


function getDownstreamNodes(state, keys) {
  const dependentNodes = new Set();
  const visitedNodes = new Set();
  const visitingNodes = Array.from(keys);

  for (let key = visitingNodes.pop(); key; key = visitingNodes.pop()) {
    var _state$nodeToNodeSubs;

    dependentNodes.add(key);
    visitedNodes.add(key);
    const subscribedNodes = (_state$nodeToNodeSubs = state.nodeToNodeSubscriptions.get(key)) !== null && _state$nodeToNodeSubs !== void 0 ? _state$nodeToNodeSubs : emptySet;

    for (const downstreamNode of subscribedNodes) {
      if (!visitedNodes.has(downstreamNode)) {
        visitingNodes.push(downstreamNode);
      }
    }
  }

  return dependentNodes;
}

let subscriptionID = 0;

function subscribeComponentToNode(state, key, callback) {
  const subID = subscriptionID++;
  const newState = { ...state,
    nodeToComponentSubscriptions: mapByUpdatingInMap$1(state.nodeToComponentSubscriptions, key, subsForAtom => mapBySettingInMap$1(subsForAtom !== null && subsForAtom !== void 0 ? subsForAtom : emptyMap, subID, ['TODO debug name', callback]))
  };

  function release(state) {
    const newState = { ...state,
      nodeToComponentSubscriptions: mapByUpdatingInMap$1(state.nodeToComponentSubscriptions, key, subsForAtom => mapByDeletingFromMap$1(subsForAtom !== null && subsForAtom !== void 0 ? subsForAtom : emptyMap, subID))
    };
    return newState;
  }

  return [newState, release];
} // Fire or enqueue callbacks to rerender components that are subscribed to
// nodes affected by the updatedNodes


function fireNodeSubscriptions(store, updatedNodes, when) {
  var _store$getState$nextT;

  /*
  This is called in two conditions: When an atom is set (with 'enqueue') and
  when an async selector resolves (with 'now'). When an atom is set, we want
  to use the latest dependencies that may have become dependencies due to
  earlier changes in a batch. But if an async selector happens to resolve during
  a batch, it should use the currently rendered output, and then the end of the
  batch will trigger any further subscriptions due to new deps in the new state.
  */
  const state = when === 'enqueue' ? (_store$getState$nextT = store.getState().nextTree) !== null && _store$getState$nextT !== void 0 ? _store$getState$nextT : store.getState().currentTree : store.getState().currentTree;
  const dependentNodes = getDownstreamNodes(state, updatedNodes);

  for (const key of dependentNodes) {
    var _state$nodeToComponen;

    ((_state$nodeToComponen = state.nodeToComponentSubscriptions.get(key)) !== null && _state$nodeToComponen !== void 0 ? _state$nodeToComponen : []).forEach(([debugName, cb]) => {
      when === 'enqueue' ? store.getState().queuedComponentCallbacks.push(cb) : cb(state);
    });
  } // Wake all suspended components so the right one(s) can try to re-render.
  // We need to wake up components not just when some asynchronous selector
  // resolved (when === 'now'), but also when changing synchronous values because
  // they may cause a selector to change from asynchronous to synchronous, in
  // which case there would be no follow-up asynchronous resolution to wake us up.
  // TODO OPTIMIZATION Only wake up related downstream components


  Recoil_Tracing.trace('value became available, waking components', Array.from(updatedNodes).join(', '), () => {
    const resolvers = store.getState().suspendedComponentResolvers;
    resolvers.forEach(r => r());
    resolvers.clear();
  });
}

function detectCircularDependencies(state, stack) {
  if (!stack.length) {
    return;
  }

  const leaf = stack[stack.length - 1];
  const downstream = state.nodeToNodeSubscriptions.get(leaf);

  if (!(downstream === null || downstream === void 0 ? void 0 : downstream.size)) {
    return;
  }

  const root = stack[0];

  if (downstream.has(root)) {
    throw new Error(`Recoil selector has circular dependencies: ${[...stack, root].reverse().join(' \u2192 ')}`);
  }

  for (const next of downstream) {
    detectCircularDependencies(state, [...stack, next]);
  }
}

var Recoil_FunctionalCore = {
  getNodeLoadable,
  peekNodeLoadable,
  setNodeValue,
  setUnvalidatedAtomValue,
  subscribeComponentToNode,
  fireNodeSubscriptions,
  detectCircularDependencies
};

const {
  getNodeLoadable: getNodeLoadable$1,
  peekNodeLoadable: peekNodeLoadable$1,
  setNodeValue: setNodeValue$1,
  setUnvalidatedAtomValue: setUnvalidatedAtomValue$1,
  subscribeComponentToNode: subscribeComponentToNode$1
} = Recoil_FunctionalCore;



const {
  RecoilValue,
  AbstractRecoilValue: AbstractRecoilValue$1,
  RecoilValueReadOnly: RecoilValueReadOnly$1,
  RecoilState: RecoilState$1
} = Recoil_RecoilValueClasses;

// NOTE: This will not update state with node subscriptions, so use sparingly!!!
function peekRecoilValueAsLoadable(store, {
  key
}) {
  const state = store.getState().currentTree; // TODO with useMutableSource should use the tree from the individual component

  return peekNodeLoadable$1(store, state, key);
}

function getRecoilValueAsLoadable(store, {
  key
}) {
  let result; // Save any state changes during read, such as validating atoms,
  // updated selector subscriptions/dependencies, &c.

  Recoil_Tracing.trace('get RecoilValue', key, () => store.replaceState(Recoil_Tracing.wrap(state => {
    const [newState, loadable] = getNodeLoadable$1(store, state, key);
    result = loadable;
    return newState;
  })));
  return result; // flowlint-line unclear-type:off
}

function setRecoilValue(store, {
  key
}, newValue) {
  Recoil_Tracing.trace('set RecoilValue', key, () => store.replaceState(Recoil_Tracing.wrap(state => {
    const [newState, writtenNodes] = setNodeValue$1(store, state, key, newValue);
    store.fireNodeSubscriptions(writtenNodes, 'enqueue');
    return newState;
  })));
}

function setUnvalidatedRecoilValue(store, {
  key
}, newValue) {
  Recoil_Tracing.trace('set unvalidated persisted atom', key, () => store.replaceState(Recoil_Tracing.wrap(state => {
    const newState = setUnvalidatedAtomValue$1(state, key, newValue);
    store.fireNodeSubscriptions(new Set([key]), 'enqueue');
    return newState;
  })));
}

function subscribeToRecoilValue(store, {
  key
}, callback) {
  let newState, releaseFn;
  Recoil_Tracing.trace('subscribe component to RecoilValue', key, () => store.replaceState(Recoil_Tracing.wrap(state => {
    [newState, releaseFn] = subscribeComponentToNode$1(state, key, callback);
    return newState;
  })));
  return {
    release: store => store.replaceState(releaseFn)
  };
}

function isRecoilValue(x) {
  return x instanceof RecoilState$1 || x instanceof RecoilValueReadOnly$1;
}

var Recoil_RecoilValue = {
  AbstractRecoilValue: AbstractRecoilValue$1,
  RecoilState: RecoilState$1,
  peekRecoilValueAsLoadable,
  getRecoilValueAsLoadable,
  setRecoilValue,
  setUnvalidatedRecoilValue,
  subscribeToRecoilValue,
  isRecoilValue
};

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Implements (a subset of) the interface of built-in Map but supports arrays as
 * keys. Two keys are equal if corresponding elements are equal according to the
 * equality semantics of built-in Map. Operations are at worst O(n*b) where n is
 * the array length and b is the complexity of the built-in operation.
 *
 * @emails oncall+perf_viz
 * 
 * @format
 */

const LEAF = Symbol('ArrayKeyedMap');
const emptyMap$1 = new Map();

class ArrayKeyedMap {
  // _base: Map<any, any> = new Map();
  constructor(existing) {
    this._base = new Map();

    if (existing instanceof ArrayKeyedMap) {
      for (const [k, v] of existing.entries()) {
        this.set(k, v);
      }
    } else if (existing) {
      for (const [k, v] of existing) {
        this.set(k, v);
      }
    }

    return this;
  }

  get(key) {
    const ks = Array.isArray(key) ? key : [key];
    let map = this._base;
    ks.forEach(k => {
      var _map$get;

      map = (_map$get = map.get(k)) !== null && _map$get !== void 0 ? _map$get : emptyMap$1;
    });
    return map === undefined ? undefined : map.get(LEAF);
  }

  set(key, value) {
    const ks = Array.isArray(key) ? key : [key];
    let map = this._base;
    let next = map;
    ks.forEach(k => {
      next = map.get(k);

      if (!next) {
        next = new Map();
        map.set(k, next);
      }

      map = next;
    });
    next.set(LEAF, value);
    return this;
  }

  delete(key) {
    const ks = Array.isArray(key) ? key : [key];
    let map = this._base;
    let next = map;
    ks.forEach(k => {
      next = map.get(k);

      if (!next) {
        next = new Map();
        map.set(k, next);
      }

      map = next;
    });
    next.delete(LEAF); // TODO We could cleanup empty maps

    return this;
  }

  entries() {
    const answer = [];

    function recurse(level, prefix) {
      level.forEach((v, k) => {
        if (k === LEAF) {
          answer.push([prefix, v]);
        } else {
          recurse(v, prefix.concat(k));
        }
      });
    }

    recurse(this._base, []);
    return answer.values();
  }

  toBuiltInMap() {
    return new Map(this.entries());
  }

}

var Recoil_ArrayKeyedMap = ArrayKeyedMap;

function cacheWithReferenceEquality() {
  return new Recoil_ArrayKeyedMap();
}

var Recoil_cacheWithReferenceEquality = cacheWithReferenceEquality;

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * This is a stub for some integration into FB internal stuff
 */
function startPerfBlock(id) {
  return () => {};
}

var Recoil_PerformanceTimings = {
  startPerfBlock
};

/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * 
 * @format
 */
/**
 * Returns a set containing all of the values from the first set that are not
 * present in any of the subsequent sets.
 *
 * Note: this is written procedurally (i.e., without filterSet) for performant
 * use in tight loops.
 */

function differenceSets(set, ...setsWithValuesToRemove) {
  const ret = new Set();

  FIRST: for (const value of set) {
    for (const otherSet of setsWithValuesToRemove) {
      if (otherSet.has(value)) {
        continue FIRST;
      }
    }

    ret.add(value);
  }

  return ret;
}

var Recoil_differenceSets = differenceSets;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * 
 * @format
 */
/**
 * The everySet() method tests whether all elements in the given Set pass the
 * test implemented by the provided function.
 */

function everySet(set, callback, context) {
  const iterator = set.entries();
  let current = iterator.next();

  while (!current.done) {
    const entry = current.value;

    if (!callback.call(context, entry[1], entry[0], set)) {
      return false;
    }

    current = iterator.next();
  }

  return true;
}

var Recoil_everySet = everySet;

/**
 * Checks if two sets are equal
 */


function equalsSet(one, two) {
  if (one.size !== two.size) {
    return false;
  }

  return Recoil_everySet(one, value => two.has(value));
}

var Recoil_equalsSet = equalsSet;

const emptySet$1 = Object.freeze(new Set());

const {
  mapBySettingInMap: mapBySettingInMap$2,
  mapByUpdatingInMap: mapByUpdatingInMap$2,
  setByAddingToSet: setByAddingToSet$2,
  setByDeletingFromSet: setByDeletingFromSet$1
} = Recoil_CopyOnWrite;



const {
  detectCircularDependencies: detectCircularDependencies$1,
  getNodeLoadable: getNodeLoadable$2,
  setNodeValue: setNodeValue$2
} = Recoil_FunctionalCore;

const {
  loadableWithError: loadableWithError$1,
  loadableWithPromise: loadableWithPromise$1,
  loadableWithValue: loadableWithValue$1
} = Recoil_Loadable;

const {
  DEFAULT_VALUE: DEFAULT_VALUE$1,
  RecoilValueNotReady: RecoilValueNotReady$1,
  registerNode: registerNode$1
} = Recoil_Node;

const {
  startPerfBlock: startPerfBlock$1
} = Recoil_PerformanceTimings;

const {
  isRecoilValue: isRecoilValue$1
} = Recoil_RecoilValue;









// flowlint-next-line unclear-type:off
const emptySet$2 = Object.freeze(new Set());

function cacheKeyFromDepValues(depValues) {
  const answer = [];

  for (const key of Array.from(depValues.keys()).sort()) {
    const loadable = Recoil_nullthrows(depValues.get(key));
    answer.push(key);
    answer.push(loadable.contents);
  }

  return answer;
}
/* eslint-disable no-redeclare */


function selector(options) {
  const {
    key,
    get,
    cacheImplementation_UNSTABLE: cacheImplementation
  } = options;
  const set = options.set != null ? options.set : undefined; // flow

  let cache = cacheImplementation !== null && cacheImplementation !== void 0 ? cacheImplementation : Recoil_cacheWithReferenceEquality();

  function putIntoCache(store, cacheKey, loadable) {
    if (loadable.state !== 'loading') {
      // Synchronous result
      if (!options.dangerouslyAllowMutability === true) {
        Recoil_deepFreezeValue(loadable.contents);
      }
    } else {
      // Asynchronous result
      // When the promise resolves, we need to replace the loading state in the
      // cache and fire any external subscriptions to re-render with the new value.
      loadable.contents.then(result => {
        // If the value is now resolved, then update the cache with the new value
        if (!options.dangerouslyAllowMutability === true) {
          Recoil_deepFreezeValue(result);
        }

        cache = cache.set(cacheKey, loadableWithValue$1(result)); // TODO Potential optimization: I think this is updating the cache
        // with a cacheKey of the dep when it wasn't ready yet.  We could also
        // theoretically put the result in the cache for a cacheKey with the
        // dep resolved.  If we had some way of figuring out what that cacheKey was..
        // Note that this optimization would change the user visible behavior slightly,
        // see the unit test "useRecoilState - selector catching promise 2".
        // If the user catches and handles pending async dependencies, then returns
        // a promise that resolves when they are available there is a question if
        // the result of that promise should be the value of the selector, or if
        // the selector should re-evaluate when the dependency is available.
        // If the promise returned and the pending dependency resolve at different
        // times, then the behaviour is better defined, as in the unit test,
        // "useRecoilState - selector catching promise and resolving asynchronously"
        // Fire subscriptions to re-render any subscribed components with the new value.
        // The store uses the CURRENT state, not the old state from which
        // this was called.  That state likely doesn't have the subscriptions saved yet.

        store.fireNodeSubscriptions(new Set([key]), 'now');
        return result;
      }).catch(error => {
        // TODO Figure out why we are catching promises here versus evaluateSelectorFunction
        // OH, I see why.  Ok, work on this.
        if (Recoil_isPromise(error)) {
          return error;
        } // The async value was rejected with an error.  Update the cache with
        // the error and fire subscriptions to re-render.


        if (!options.dangerouslyAllowMutability === true) {
          Recoil_deepFreezeValue(error);
        }

        cache = cache.set(cacheKey, loadableWithError$1(error));
        store.fireNodeSubscriptions(new Set([key]), 'now');
        return error;
      });
    }

    cache = cache.set(cacheKey, loadable);
  }

  function getFromCache(store, state) {
    var _state$nodeDeps$get;

    let newState = state; // First, get the current deps for this selector

    const currentDeps = (_state$nodeDeps$get = state.nodeDeps.get(key)) !== null && _state$nodeDeps$get !== void 0 ? _state$nodeDeps$get : emptySet$2;
    const depValues = new Map(Array.from(currentDeps).sort().map(depKey => {
      const [nextState, loadable] = getNodeLoadable$2(store, newState, depKey);
      newState = nextState;
      return [depKey, loadable];
    })); // Always cache and evaluate a selector
    // It may provide a result even when not all deps are available.

    const cacheKey = cacheKeyFromDepValues(depValues);
    const cached = cache.get(cacheKey);

    if (cached != null) {
      return [newState, cached];
    } // Cache miss, compute the value


    const [nextState, loadable, newDepValues] = computeAndSubscribeSelector(store, newState);
    newState = nextState; // Save result in cache

    const newCacheKey = cacheKeyFromDepValues(newDepValues);
    putIntoCache(store, newCacheKey, loadable);
    return [newState, loadable];
  }

  function evaluateSelectorFunction(store, state) {
    const endPerfBlock = startPerfBlock$1(key);
    let newState = state;
    const depValues = new Map();

    function getRecoilValue({
      key
    }) {
      let loadable;
      [newState, loadable] = getNodeLoadable$2(store, state, key);
      depValues.set(key, loadable);

      if (loadable.state === 'hasValue') {
        return loadable.contents;
      } else {
        throw loadable.contents; // Promise or error
      }
    }

    try {
      // The big moment!
      const output = get({
        get: getRecoilValue
      });
      const result = isRecoilValue$1(output) ? getRecoilValue(output) : output; // TODO Allow user to also return Loadables for improved composability

      const loadable = !Recoil_isPromise(result) ? ( // The selector returned a simple synchronous value, so let's use it!
      endPerfBlock(), loadableWithValue$1(result)) : // The user returned a promise for an asynchronous selector.  This will
      // resolve to the proper value of the selector when available.
      loadableWithPromise$1(result.finally(endPerfBlock));
      return [newState, loadable, depValues];
    } catch (errorOrDepPromise) {
      const loadable = !Recoil_isPromise(errorOrDepPromise) ? ( // There was a synchronous error in the evaluation
      endPerfBlock(), loadableWithError$1(errorOrDepPromise)) : // If an asynchronous dependency was not ready, then return a promise that
      // will resolve when we finally do have a real value or error for the selector.
      loadableWithPromise$1(errorOrDepPromise.then(() => {
        // The dependency we were waiting on is now available.
        // So, let's try to evaluate the selector again and return that value.
        let loadable = loadableWithError$1(new Error('Internal Recoil Selector Error') // To make Flow happy
        ); // This is done asynchronously, so we need to make sure to save the state

        store.replaceState(asyncState => {
          let newAsyncState;
          [newAsyncState, loadable] = getFromCache(store, asyncState);
          return newAsyncState;
        });

        if (loadable.state === 'hasError') {
          throw loadable.contents;
        } // Either the re-try provided a value, which we will use, or it
        // got blocked again.  In that case this is a promise and we'll try again.


        return loadable.contents;
      }).finally(endPerfBlock));
      return [newState, loadable, depValues];
    }
  }

  function computeAndSubscribeSelector(store, state) {
    var _state$nodeDeps$get2;

    // Call the selector get evaluation function to get the new value
    const [newStateFromEvaluate, loadable, newDepValues] = evaluateSelectorFunction(store, state);
    let newState = newStateFromEvaluate; // Update state with new upsteram dependencies

    const oldDeps = (_state$nodeDeps$get2 = state.nodeDeps.get(key)) !== null && _state$nodeDeps$get2 !== void 0 ? _state$nodeDeps$get2 : emptySet$2;
    const newDeps = new Set(newDepValues.keys());
    newState = Recoil_equalsSet(oldDeps, newDeps) ? newState : { ...newState,
      nodeDeps: mapBySettingInMap$2(newState.nodeDeps, key, newDeps)
    }; // Update state with new downstream subscriptions

    const addedDeps = Recoil_differenceSets(newDeps, oldDeps);
    const removedDeps = Recoil_differenceSets(oldDeps, newDeps);

    for (const upstreamNode of addedDeps) {
      newState = { ...newState,
        nodeToNodeSubscriptions: mapByUpdatingInMap$2(newState.nodeToNodeSubscriptions, upstreamNode, subs => setByAddingToSet$2(subs !== null && subs !== void 0 ? subs : emptySet$2, key))
      };
    }

    for (const upstreamNode of removedDeps) {
      newState = { ...newState,
        nodeToNodeSubscriptions: mapByUpdatingInMap$2(newState.nodeToNodeSubscriptions, upstreamNode, subs => setByDeletingFromSet$1(subs !== null && subs !== void 0 ? subs : emptySet$2, key))
      };
    } // if (__DEV__) {
    //   detectCircularDependencies(newState, [key]);
    // }


    return [newState, loadable, newDepValues];
  }

  function myGet(store, state) {
    // TODO memoize a value if no deps have changed to avoid a cache lookup
    // Lookup the node value in the cache.  If not there, then compute
    // the value and update the state with any changed node subscriptions.
    return getFromCache(store, state);
  }

  if (set != null) {
    function mySet(store, state, newValue) {
      let newState = state;
      const writtenNodes = new Set();

      function getRecoilValue({
        key
      }) {
        const [nextState, loadable] = getNodeLoadable$2(store, newState, key);
        newState = nextState;

        if (loadable.state === 'hasValue') {
          return loadable.contents;
        } else if (loadable.state === 'loading') {
          throw new RecoilValueNotReady$1(key);
        } else {
          throw loadable.contents;
        }
      }

      function setRecoilState(recoilState, valueOrUpdater) {
        const newValue = typeof valueOrUpdater === 'function' ? // cast to any because we can't restrict type S from being a function itself without losing support for opaque types
        // flowlint-next-line unclear-type:off
        valueOrUpdater(getRecoilValue(recoilState)) : valueOrUpdater;
        let written;
        [newState, written] = setNodeValue$2(store, newState, recoilState.key, newValue);
        written.forEach(atom => writtenNodes.add(atom));
      }

      function resetRecoilState(recoilState) {
        setRecoilState(recoilState, DEFAULT_VALUE$1);
      }

      set({
        set: setRecoilState,
        get: getRecoilValue,
        reset: resetRecoilState
      }, newValue);
      return [newState, writtenNodes];
    }

    return registerNode$1({
      key,
      options,
      get: myGet,
      set: mySet
    });
  } else {
    return registerNode$1({
      key,
      options,
      get: myGet
    });
  }
}
/* eslint-enable no-redeclare */


var Recoil_selector_OLD = selector;

const selector$1 =  Recoil_selector_OLD;
var Recoil_selector = selector$1;

// @fb-only: import type {ScopeRules} from './Recoil_ScopedAtom';
const {
  mapByDeletingFromMap: mapByDeletingFromMap$2,
  mapBySettingInMap: mapBySettingInMap$3,
  setByAddingToSet: setByAddingToSet$3
} = Recoil_CopyOnWrite;



const {
  loadableWithValue: loadableWithValue$2
} = Recoil_Loadable;

const {
  DEFAULT_VALUE: DEFAULT_VALUE$2,
  DefaultValue: DefaultValue$1,
  registerNode: registerNode$2
} = Recoil_Node;

const {
  isRecoilValue: isRecoilValue$2
} = Recoil_RecoilValue; // @fb-only: const {scopedAtom} = require('./Recoil_ScopedAtom');








 // It would be nice if this didn't have to be defined at the Recoil level, but I don't want to make
// the api cumbersome. One way to do this would be to have a selector mark the atom as persisted.
// Note that this should also allow for special URL handling. (Although the persistence observer could
// have this as a separate configuration.)


function baseAtom(options) {
  const {
    key,
    persistence_UNSTABLE: persistence
  } = options;
  return registerNode$2({
    key,
    options,
    get: (_store, state) => {
      if (state.atomValues.has(key)) {
        // atom value is stored in state
        return [state, Recoil_nullthrows(state.atomValues.get(key))];
      } else if (state.nonvalidatedAtoms.has(key)) {
        if (persistence == null) {
          return [state, loadableWithValue$2(options.default)];
        }

        const nonvalidatedValue = state.nonvalidatedAtoms.get(key);
        const validatedValue = persistence.validator(nonvalidatedValue, DEFAULT_VALUE$2);
        return validatedValue instanceof DefaultValue$1 ? [{ ...state,
          nonvalidatedAtoms: mapByDeletingFromMap$2(state.nonvalidatedAtoms, key)
        }, loadableWithValue$2(options.default)] : [{ ...state,
          atomValues: mapBySettingInMap$3(state.atomValues, key, loadableWithValue$2(validatedValue)),
          nonvalidatedAtoms: mapByDeletingFromMap$2(state.nonvalidatedAtoms, key)
        }, loadableWithValue$2(validatedValue)];
      } else {
        return [state, loadableWithValue$2(options.default)];
      }
    },
    set: (_store, state, newValue) => {
      if (options.dangerouslyAllowMutability !== true) {
        Recoil_deepFreezeValue(newValue);
      }

      return [{ ...state,
        dirtyAtoms: setByAddingToSet$3(state.dirtyAtoms, key),
        atomValues: newValue instanceof DefaultValue$1 ? mapByDeletingFromMap$2(state.atomValues, key) : mapBySettingInMap$3(state.atomValues, key, loadableWithValue$2(newValue)),
        nonvalidatedAtoms: mapByDeletingFromMap$2(state.nonvalidatedAtoms, key)
      }, new Set([key])];
    }
  });
}

function atom(options) {
  const {
    default: optionsDefault,
    // @fb-only:     scopeRules_APPEND_ONLY_READ_THE_DOCS,
    ...restOptions
  } = options;

  if (isRecoilValue$2(optionsDefault) || Recoil_isPromise(optionsDefault)) {
    return atomWithFallback({ ...restOptions,
      default: optionsDefault // @fb-only:       scopeRules_APPEND_ONLY_READ_THE_DOCS,

    }); // @fb-only:   } else if (scopeRules_APPEND_ONLY_READ_THE_DOCS) {
    // @fb-only:     return scopedAtom<T>({
    // @fb-only:       ...restOptions,
    // @fb-only:       default: optionsDefault,
    // @fb-only:       scopeRules_APPEND_ONLY_READ_THE_DOCS,
    // @fb-only:     });
  } else {
    return baseAtom({ ...restOptions,
      default: optionsDefault
    });
  }
}

function atomWithFallback(options) {
  const base = atom({ ...options,
    default: DEFAULT_VALUE$2,
    persistence_UNSTABLE: options.persistence_UNSTABLE === undefined ? undefined : { ...options.persistence_UNSTABLE,
      validator: storedValue => storedValue instanceof DefaultValue$1 ? storedValue : Recoil_nullthrows(options.persistence_UNSTABLE).validator(storedValue, DEFAULT_VALUE$2)
    }
  });
  return Recoil_selector({
    key: `${options.key}__withFallback`,
    get: ({
      get
    }) => {
      const baseValue = get(base);
      return baseValue instanceof DefaultValue$1 ? options.default : baseValue;
    },
    set: ({
      set
    }, newValue) => set(base, newValue),
    dangerouslyAllowMutability: options.dangerouslyAllowMutability
  });
}

var Recoil_atom = atom;

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+comparison_view
 * 
 * @format
 */

function enqueueExecution(s, f) {
  f();
}

var Recoil_Queue = {
  enqueueExecution
};

const {
  useContext,
  useEffect,
  useRef,
  useState
} = react;

const {
  fireNodeSubscriptions: fireNodeSubscriptions$1,
  setNodeValue: setNodeValue$3,
  setUnvalidatedAtomValue: setUnvalidatedAtomValue$2
} = Recoil_FunctionalCore;





function notInAContext() {
  throw new Error('This component must be used inside a <RecoilRoot> component.');
}

const defaultStore = Object.freeze({
  getState: notInAContext,
  replaceState: notInAContext,
  subscribeToTransactions: notInAContext,
  addTransactionMetadata: notInAContext,
  fireNodeSubscriptions: notInAContext
});

function startNextTreeIfNeeded(storeState) {
  if (storeState.nextTree === null) {
    storeState.nextTree = { ...storeState.currentTree,
      dirtyAtoms: new Set(),
      transactionMetadata: {}
    };
  }
}

const AppContext = react.createContext({
  current: defaultStore
});

const useStoreRef = () => useContext(AppContext);
/*
 * The purpose of the Batcher is to observe when React batches end so that
 * Recoil state changes can be batched. Whenever Recoil state changes, we call
 * setState on the batcher. Then we wait for that change to be committed, which
 * signifies the end of the batch. That's when we respond to the Recoil change.
 */


function Batcher(props) {
  const storeRef = useStoreRef();
  const [_, setState] = useState([]);
  props.setNotifyBatcherOfChange(() => setState({}));
  useEffect(() => {
    // enqueueExecution runs this function immediately; it is only used to
    // manipulate the order of useEffects during tests, since React seems to
    // call useEffect in an unpredictable order sometimes.
    Recoil_Queue.enqueueExecution('Batcher', () => {
      const storeState = storeRef.current.getState();
      const {
        currentTree,
        nextTree
      } = storeState; // Ignore commits that are not because of Recoil transactions -- namely,
      // because something above RecoilRoot re-rendered:

      if (nextTree === null) {
        return;
      } // Inform transaction subscribers of the transaction:


      const dirtyAtoms = nextTree.dirtyAtoms;

      if (dirtyAtoms.size) {
        // NOTE that this passes the committed (current, aka previous) tree,
        // whereas the nextTree is retrieved from storeRef by the transaction subscriber.
        // (This interface can be cleaned up, TODO)
        storeState.transactionSubscriptions.forEach(sub => sub(storeRef.current, currentTree));
      } // Inform components that depend on dirty atoms of the transaction:
      // FIXME why is this StoreState but dirtyAtoms is TreeState? Seems like they should be the same.


      storeState.queuedComponentCallbacks.forEach(cb => cb(nextTree));
      storeState.queuedComponentCallbacks.splice(0, storeState.queuedComponentCallbacks.length); // nextTree is now committed -- note that copying and reset occurs when
      // a transaction begins, in startNextTreeIfNeeded:

      storeState.currentTree = nextTree;
      storeState.nextTree = null;
    });
  });
  return null;
} // if (__DEV__) {
//   if (!window.$recoilDebugStates) {
//     window.$recoilDebugStates = [];
//   }
// }


function makeEmptyTreeState() {
  return {
    isSnapshot: false,
    transactionMetadata: {},
    atomValues: new Map(),
    nonvalidatedAtoms: new Map(),
    dirtyAtoms: new Set(),
    nodeDeps: new Map(),
    nodeToNodeSubscriptions: new Map(),
    nodeToComponentSubscriptions: new Map()
  };
}

function makeEmptyStoreState() {
  return {
    currentTree: makeEmptyTreeState(),
    nextTree: null,
    transactionSubscriptions: new Map(),
    queuedComponentCallbacks: [],
    suspendedComponentResolvers: new Set()
  };
}

function initialStoreState(store, initializeState) {
  const initial = makeEmptyStoreState();

  if (initializeState) {
    initializeState({
      set: (atom, value) => {
        initial.currentTree = setNodeValue$3(store, initial.currentTree, atom.key, value)[0];
      },
      setUnvalidatedAtomValues: atomValues => {
        atomValues.forEach((v, k) => {
          initial.currentTree = setUnvalidatedAtomValue$2(initial.currentTree, k, v);
        });
      }
    });
  }

  return initial;
}

let nextID = 0;

function RecoilRoot({
  initializeState,
  children
}) {
  let storeState; // eslint-disable-line prefer-const

  const subscribeToTransactions = callback => {
    const id = nextID++;
    storeRef.current.getState().transactionSubscriptions.set(id, callback);
    return {
      release: () => {
        storeRef.current.getState().transactionSubscriptions.delete(id);
      }
    };
  };

  const addTransactionMetadata = metadata => {
    startNextTreeIfNeeded(storeRef.current.getState());

    for (const k of Object.keys(metadata)) {
      Recoil_nullthrows(storeRef.current.getState().nextTree).transactionMetadata[k] = metadata[k];
    }
  };

  function fireNodeSubscriptionsForStore(updatedNodes, when) {
    fireNodeSubscriptions$1(storeRef.current, updatedNodes, when);
  }

  const replaceState = replacer => {
    const storeState = storeRef.current.getState();
    startNextTreeIfNeeded(storeState); // Use replacer to get the next state:

    const nextTree = Recoil_nullthrows(storeState.nextTree);
    const replaced = replacer(nextTree);

    if (replaced === nextTree) {
      return;
    } // Save changes to nextTree and schedule a React update:
    // if (__DEV__) {
    //   window.$recoilDebugStates.push(replaced); // TODO this shouldn't happen here because it's not batched
    // }


    storeState.nextTree = replaced;
    Recoil_nullthrows(notifyBatcherOfChange.current)();
  };

  const notifyBatcherOfChange = useRef(null);

  function setNotifyBatcherOfChange(x) {
    notifyBatcherOfChange.current = x;
  }

  const store = {
    getState: () => storeState.current,
    replaceState,
    subscribeToTransactions,
    addTransactionMetadata,
    fireNodeSubscriptions: fireNodeSubscriptionsForStore
  };
  const storeRef = useRef(store);
  storeState = useRef(initialStoreState(store, initializeState));
  return /*#__PURE__*/react.createElement(AppContext.Provider, {
    value: storeRef
  }, /*#__PURE__*/react.createElement(Batcher, {
    setNotifyBatcherOfChange: setNotifyBatcherOfChange
  }), children);
}

var Recoil_RecoilRoot_react = {
  useStoreRef,
  RecoilRoot
};

/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * 
 * @format
 */
/**
 * Returns a map containing all of the keys + values from the original map where
 * the given callback returned true.
 */

function filterMap(map, callback) {
  const result = new Map();

  for (const [key, value] of map) {
    if (callback(value, key)) {
      result.set(key, value);
    }
  }

  return result;
}

var Recoil_filterMap = filterMap;

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Returns the set of values that are present in all the given sets, preserving
 * the order of the first set.
 *
 * Note: this is written procedurally (i.e., without filterSet) for performant
 * use in tight loops.
 *
 * 
 * @format
 */

function intersectSets(first, ...rest) {
  const ret = new Set();

  FIRST: for (const value of first) {
    for (const otherSet of rest) {
      if (!otherSet.has(value)) {
        continue FIRST;
      }
    }

    ret.add(value);
  }

  return ret;
}

var Recoil_intersectSets = intersectSets;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * 
 * @format
 */

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

var Recoil_invariant = invariant;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * 
 * @format
 */
/**
 * Returns a new Map object with the same keys as the original, but with the
 * values replaced with the output of the given callback function.
 */

function mapMap(map, callback) {
  const result = new Map();
  map.forEach((value, key) => {
    result.set(key, callback(value, key));
  });
  return result;
}

var Recoil_mapMap = mapMap;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * 
 * @format
 */

function mergeMaps(...maps) {
  const result = new Map();

  for (let i = 0; i < maps.length; i++) {
    const iterator = maps[i].keys();
    let nextKey;

    while (!(nextKey = iterator.next()).done) {
      // $FlowFixMe - map/iterator knows nothing about flow types
      result.set(nextKey.value, maps[i].get(nextKey.value));
    }
  }
  /* $FlowFixMe(>=0.66.0 site=www,mobile) This comment suppresses an error
   * found when Flow v0.66 was deployed. To see the error delete this comment
   * and run Flow. */


  return result;
}

var Recoil_mergeMaps = mergeMaps;

const {
  useCallback,
  useEffect: useEffect$1,
  useMemo,
  useRef: useRef$1,
  useState: useState$1
} = react;



const {
  setByAddingToSet: setByAddingToSet$4
} = Recoil_CopyOnWrite;

const {
  getNodeLoadable: getNodeLoadable$3,
  peekNodeLoadable: peekNodeLoadable$2,
  setNodeValue: setNodeValue$4
} = Recoil_FunctionalCore;

const {
  DEFAULT_VALUE: DEFAULT_VALUE$3,
  RecoilValueNotReady: RecoilValueNotReady$2,
  getNode: getNode$2,
  nodes: nodes$1
} = Recoil_Node;

const {
  useStoreRef: useStoreRef$1
} = Recoil_RecoilRoot_react;

const {
  AbstractRecoilValue: AbstractRecoilValue$2,
  getRecoilValueAsLoadable: getRecoilValueAsLoadable$1,
  setRecoilValue: setRecoilValue$1,
  setUnvalidatedRecoilValue: setUnvalidatedRecoilValue$1,
  subscribeToRecoilValue: subscribeToRecoilValue$1
} = Recoil_RecoilValue;





















function cloneState(state, opts) {
  return {
    isSnapshot: opts.isSnapshot,
    transactionMetadata: { ...state.transactionMetadata
    },
    atomValues: new Map(state.atomValues),
    nonvalidatedAtoms: new Map(state.nonvalidatedAtoms),
    dirtyAtoms: new Set(state.dirtyAtoms),
    nodeDeps: new Map(state.nodeDeps),
    nodeToNodeSubscriptions: Recoil_mapMap(state.nodeToNodeSubscriptions, keys => new Set(keys)),
    nodeToComponentSubscriptions: Recoil_mapMap(state.nodeToComponentSubscriptions, subsByAtom => new Map(subsByAtom))
  };
}

function handleLoadable(loadable, atom, storeRef) {
  // We can't just throw the promise we are waiting on to Suspense.  If the
  // upstream dependencies change it may produce a state in which the component
  // can render, but it would still be suspended on a Promise that may never resolve.
  if (loadable.state === 'hasValue') {
    return loadable.contents;
  } else if (loadable.state === 'loading') {
    const promise = new Promise(resolve => {
      storeRef.current.getState().suspendedComponentResolvers.add(resolve);
    });
    throw promise;
  } else if (loadable.state === 'hasError') {
    throw loadable.contents;
  } else {
    throw new Error(`Invalid value of loadable atom "${atom.key}"`);
  }
}

function valueFromValueOrUpdater(store, state, recoilValue, valueOrUpdater) {
  if (typeof valueOrUpdater === 'function') {
    // Updater form: pass in the current value. Throw if the current value
    // is unavailable (namely when updating an async selector that's
    // pending or errored):
    const current = peekNodeLoadable$2(store, state, recoilValue.key);

    if (current.state === 'loading') {
      throw new RecoilValueNotReady$2(recoilValue.key);
    } else if (current.state === 'hasError') {
      throw current.contents;
    } // T itself may be a function, so our refinement is not sufficient:


    return valueOrUpdater(current.contents); // flowlint-line unclear-type:off
  } else {
    return valueOrUpdater;
  }
}

function useInterface() {
  const storeRef = useStoreRef$1();
  const [_, forceUpdate] = useState$1([]);
  const recoilValuesUsed = useRef$1(new Set());
  recoilValuesUsed.current = new Set(); // Track the RecoilValues used just during this render

  const previousSubscriptions = useRef$1(new Set());
  const subscriptions = useRef$1(new Map());
  const unsubscribeFrom = useCallback(key => {
    const sub = subscriptions.current.get(key);

    if (sub) {
      sub.release(storeRef.current);
      subscriptions.current.delete(key);
    }
  }, [storeRef, subscriptions]);
  useEffect$1(() => {
    const store = storeRef.current;

    function updateState(_state, key) {
      if (!subscriptions.current.has(key)) {
        return;
      }

      forceUpdate([]);
    }

    Recoil_differenceSets(recoilValuesUsed.current, previousSubscriptions.current).forEach(key => {
      if (subscriptions.current.has(key)) {
        return;
      }

      const sub = subscribeToRecoilValue$1(store, new AbstractRecoilValue$2(key), state => {
        Recoil_Tracing.trace('RecoilValue subscription fired', key, () => {
          updateState(state, key);
        });
      });
      subscriptions.current.set(key, sub);
      Recoil_Tracing.trace('initial update on subscribing', key, () => {
        updateState(store.getState(), key);
      });
    });
    Recoil_differenceSets(previousSubscriptions.current, recoilValuesUsed.current).forEach(key => {
      unsubscribeFrom(key);
    });
    previousSubscriptions.current = recoilValuesUsed.current;
  });
  useEffect$1(() => {
    const subs = subscriptions.current;
    return () => subs.forEach((_, key) => unsubscribeFrom(key));
  }, [unsubscribeFrom]);
  return useMemo(() => {
    function useSetRecoilState(recoilState) {
      return newValueOrUpdater => {
        var _storeState$nextTree;

        const storeState = storeRef.current.getState();
        const newValue = valueFromValueOrUpdater(storeRef.current, (_storeState$nextTree = storeState.nextTree) !== null && _storeState$nextTree !== void 0 ? _storeState$nextTree : storeState.currentTree, recoilState, newValueOrUpdater);
        setRecoilValue$1(storeRef.current, recoilState, newValue);
      };
    }

    function useResetRecoilState(recoilState) {
      return () => setRecoilValue$1(storeRef.current, recoilState, DEFAULT_VALUE$3);
    }

    function useRecoilValueLoadable(recoilValue) {
      if (!recoilValuesUsed.current.has(recoilValue.key)) {
        recoilValuesUsed.current = setByAddingToSet$4(recoilValuesUsed.current, recoilValue.key);
      } // TODO Restore optimization to memoize lookup


      return getRecoilValueAsLoadable$1(storeRef.current, recoilValue);
    }

    function useRecoilValue(recoilValue) {
      const loadable = useRecoilValueLoadable(recoilValue);
      return handleLoadable(loadable, recoilValue, storeRef);
    }

    function useRecoilState(recoilState) {
      return [useRecoilValue(recoilState), useSetRecoilState(recoilState)];
    }

    function useRecoilStateLoadable(recoilState) {
      return [useRecoilValueLoadable(recoilState), useSetRecoilState(recoilState)];
    }

    return {
      getRecoilValue: useRecoilValue,
      getRecoilValueLoadable: useRecoilValueLoadable,
      getRecoilState: useRecoilState,
      getRecoilStateLoadable: useRecoilStateLoadable,
      getSetRecoilState: useSetRecoilState,
      getResetRecoilState: useResetRecoilState
    };
  }, [recoilValuesUsed, storeRef]);
}
/**
  Returns the value represented by the RecoilValue.
  If the value is pending, it will throw a Promise to suspend the component,
  if the value is an error it will throw it for the nearest React error boundary.
  This will also subscribe the component for any updates in the value.
  */


function useRecoilValue(recoilValue) {
  return useInterface().getRecoilValue(recoilValue);
}
/**
  Like useRecoilValue(), but either returns the value if available or
  just undefined if not available for any reason, such as pending or error.
*/


function useRecoilValueLoadable(recoilValue) {
  return useInterface().getRecoilValueLoadable(recoilValue);
}
/**
  Returns a function that allows the value of a RecoilState to be updated, but does
  not subscribe the compoment to changes to that RecoilState.
*/


function useSetRecoilState(recoilState) {
  return useCallback(useInterface().getSetRecoilState(recoilState), [recoilState]);
}
/**
  Returns a function that will reset the value of a RecoilState to its default
*/


function useResetRecoilState(recoilState) {
  return useCallback(useInterface().getResetRecoilState(recoilState), [recoilState]);
}
/**
  Equivalent to useState(). Allows the value of the RecoilState to be read and written.
  Subsequent updates to the RecoilState will cause the component to re-render. If the
  RecoilState is pending, this will suspend the compoment and initiate the
  retrieval of the value. If evaluating the RecoilState resulted in an error, this will
  throw the error so that the nearest React error boundary can catch it.
*/


function useRecoilState(recoilState) {
  const recoilInterface = useInterface();
  const [value] = recoilInterface.getRecoilState(recoilState);
  const setValue = useCallback(recoilInterface.getSetRecoilState(recoilState), [recoilState]);
  return [value, setValue];
}
/**
  Like useRecoilState(), but does not cause Suspense or React error handling. Returns
  an object that indicates whether the RecoilState is available, pending, or
  unavailable due to an error.
*/


function useRecoilStateLoadable(recoilState) {
  const recoilInterface = useInterface();
  const [value] = recoilInterface.getRecoilStateLoadable(recoilState);
  const setValue = useCallback(recoilInterface.getSetRecoilState(recoilState), [recoilState]);
  return [value, setValue];
}

function useTransactionSubscription(callback) {
  const storeRef = useStoreRef$1();
  useEffect$1(() => {
    const sub = storeRef.current.subscribeToTransactions(callback);
    return sub.release;
  }, [callback, storeRef]);
} // TODO instead of force update can put snapshot into local state


function useTreeStateClone() {
  const [_, setState] = useState$1(0);
  const forceUpdate = useCallback(() => setState(x => x + 1), []);
  useTransactionSubscription(forceUpdate);
  const storeRef = useStoreRef$1();
  return cloneState(storeRef.current.getState().currentTree, {
    isSnapshot: true
  });
}

function useSnapshotWithStateChange(transaction) {
  const storeRef = useStoreRef$1();
  let snapshot = useTreeStateClone();

  const update = ({
    key
  }, updater) => {
    [snapshot] = setNodeValue$4(storeRef.current, snapshot, key, peekNodeLoadable$2(storeRef.current, snapshot, key).map(updater));
  };

  transaction(update);
  const atomValues = Recoil_mapMap(snapshot.atomValues, v => v.contents); // Only report atoms, not selectors

  const updatedAtoms = Recoil_intersectSets(snapshot.dirtyAtoms, new Set(atomValues.keys()));
  return {
    atomValues,
    updatedAtoms
  };
}

function externallyVisibleAtomValuesInState(state) {
  const atomValues = state.atomValues;
  const persistedAtomContentsValues = Recoil_mapMap(Recoil_filterMap(atomValues, (v, k) => {
    var _node$options;

    const node = getNode$2(k);
    const persistence = (_node$options = node.options) === null || _node$options === void 0 ? void 0 : _node$options.persistence_UNSTABLE;
    return persistence != null && persistence.type !== 'none' && v.state === 'hasValue';
  }), v => v.contents); // Merge in nonvalidated atoms; we may not have defs for them but they will
  // all have persistence on or they wouldn't be there in the first place.

  return Recoil_mergeMaps(state.nonvalidatedAtoms, persistedAtomContentsValues);
}

/**
  Calls the given callback after any atoms have been modified and the consequent
  component re-renders have been committed. This is intended for persisting
  the values of the atoms to storage. The stored values can then be restored
  using the useSetUnvalidatedAtomValues hook.

  The callback receives the following info:

  atomValues: The current value of every atom that is both persistable (persistence
              type not set to 'none') and whose value is available (not in an
              error or loading state).

  previousAtomValues: The value of every persistable and available atom before
               the transaction began.

  atomInfo: A map containing the persistence settings for each atom. Every key
            that exists in atomValues will also exist in atomInfo.

  modifiedAtoms: The set of atoms that were written to during the transaction.

  transactionMetadata: Arbitrary information that was added via the
          useSetUnvalidatedAtomValues hook. Useful for ignoring the useSetUnvalidatedAtomValues
          transaction, to avoid loops.
*/
function useTransactionObservation(callback) {
  useTransactionSubscription(useCallback((store, previousState) => {
    let nextTree = store.getState().nextTree;

    if (!nextTree) {
      nextTree = store.getState().currentTree; // attempt to trundle on
    }

    const atomValues = externallyVisibleAtomValuesInState(nextTree);
    const previousAtomValues = externallyVisibleAtomValuesInState(previousState);
    const atomInfo = Recoil_mapMap(nodes$1, node => {
      var _node$options$persist, _node$options2, _node$options2$persis, _node$options$persist2, _node$options3, _node$options3$persis;

      return {
        persistence_UNSTABLE: {
          type: (_node$options$persist = (_node$options2 = node.options) === null || _node$options2 === void 0 ? void 0 : (_node$options2$persis = _node$options2.persistence_UNSTABLE) === null || _node$options2$persis === void 0 ? void 0 : _node$options2$persis.type) !== null && _node$options$persist !== void 0 ? _node$options$persist : 'none',
          backButton: (_node$options$persist2 = (_node$options3 = node.options) === null || _node$options3 === void 0 ? void 0 : (_node$options3$persis = _node$options3.persistence_UNSTABLE) === null || _node$options3$persis === void 0 ? void 0 : _node$options3$persis.backButton) !== null && _node$options$persist2 !== void 0 ? _node$options$persist2 : false
        }
      };
    });
    const modifiedAtoms = new Set(nextTree.dirtyAtoms);
    callback({
      atomValues,
      previousAtomValues,
      atomInfo,
      modifiedAtoms,
      transactionMetadata: { ...nextTree.transactionMetadata
      }
    });
  }, [callback]));
}

function useGoToSnapshot() {
  const storeRef = useStoreRef$1();
  return snapshot => {
    reactNative.unstable_batchedUpdates(() => {
      snapshot.updatedAtoms.forEach(key => {
        setRecoilValue$1(storeRef.current, new AbstractRecoilValue$2(key), snapshot.atomValues.get(key));
      });
    });
  };
}

function useSetUnvalidatedAtomValues() {
  const storeRef = useStoreRef$1();
  return (values, transactionMetadata = {}) => {
    reactNative.unstable_batchedUpdates(() => {
      storeRef.current.addTransactionMetadata(transactionMetadata);
      values.forEach((value, key) => setUnvalidatedRecoilValue$1(storeRef.current, new AbstractRecoilValue$2(key), value));
    });
  };
}

class Sentinel {}

const SENTINEL = new Sentinel();

function useRecoilCallback(fn, deps) {
  const storeRef = useStoreRef$1();
  return useCallback((...args) => {
    let snapshot = cloneState(storeRef.current.getState().currentTree, {
      isSnapshot: true
    });

    function getLoadable(recoilValue) {
      let result;
      [snapshot, result] = getNodeLoadable$3(storeRef.current, snapshot, recoilValue.key);
      return result;
    }

    function getPromise(recoilValue) {
      {
        return getLoadable(recoilValue).toPromise();
      }
    }

    function set(recoilState, newValueOrUpdater) {
      const newValue = valueFromValueOrUpdater(storeRef.current, snapshot, recoilState, newValueOrUpdater);
      setRecoilValue$1(storeRef.current, recoilState, newValue);
    }

    function reset(recoilState) {
      setRecoilValue$1(storeRef.current, recoilState, DEFAULT_VALUE$3);
    }

    let ret = SENTINEL;
    reactNative.unstable_batchedUpdates(() => {
      // flowlint-next-line unclear-type:off
      ret = fn({
        getPromise,
        getLoadable,
        set,
        reset
      }, ...args);
    });
    Recoil_invariant(!(ret instanceof Sentinel), 'unstable_batchedUpdates should return immediately');
    return ret;
  }, deps != null ? [...deps, storeRef] : undefined // eslint-disable-line fb-www/react-hooks-deps
  );
}

var Recoil_Hooks = {
  useRecoilCallback,
  useRecoilValue,
  useRecoilValueLoadable,
  useRecoilState,
  useRecoilStateLoadable,
  useSetRecoilState,
  useResetRecoilState,
  useRecoilInterface: useInterface,
  useTransactionSubscription,
  useSnapshotWithStateChange,
  useTransactionObservation,
  useGoToSnapshot,
  useSetUnvalidatedAtomValues
};

const {
  useRecoilCallback: useRecoilCallback$1,
  useRecoilState: useRecoilState$1,
  useRecoilStateLoadable: useRecoilStateLoadable$1,
  useRecoilValue: useRecoilValue$1,
  useRecoilValueLoadable: useRecoilValueLoadable$1,
  useResetRecoilState: useResetRecoilState$1,
  useSetRecoilState: useSetRecoilState$1,
  useSetUnvalidatedAtomValues: useSetUnvalidatedAtomValues$1,
  useTransactionObservation: useTransactionObservation$1,
  useTransactionSubscription: useTransactionSubscription$1
} = Recoil_Hooks;

const {
  DefaultValue: DefaultValue$2
} = Recoil_Node;

const {
  RecoilRoot: RecoilRoot$1
} = Recoil_RecoilRoot_react;

const {
  isRecoilValue: isRecoilValue$3
} = Recoil_RecoilValue;



var Recoil = {
  // Types
  DefaultValue: DefaultValue$2,
  // Components
  RecoilRoot: RecoilRoot$1,
  // RecoilValues
  atom: Recoil_atom,
  selector: Recoil_selector,
  // Hooks that accept RecoilValues
  useRecoilValue: useRecoilValue$1,
  useRecoilValueLoadable: useRecoilValueLoadable$1,
  useRecoilState: useRecoilState$1,
  useRecoilStateLoadable: useRecoilStateLoadable$1,
  useSetRecoilState: useSetRecoilState$1,
  useResetRecoilState: useResetRecoilState$1,
  // Hooks for asynchronous Recoil
  useRecoilCallback: useRecoilCallback$1,
  // Hooks for Persistence/Debugging
  useTransactionObservation_UNSTABLE: useTransactionObservation$1,
  useTransactionSubscription_UNSTABLE: useTransactionSubscription$1,
  useSetUnvalidatedAtomValues_UNSTABLE: useSetUnvalidatedAtomValues$1,
  // Other functions
  isRecoilValue: isRecoilValue$3
};
var Recoil_1 = Recoil.DefaultValue;
var Recoil_2 = Recoil.RecoilRoot;
var Recoil_3 = Recoil.atom;
var Recoil_4 = Recoil.selector;
var Recoil_5 = Recoil.useRecoilValue;
var Recoil_6 = Recoil.useRecoilValueLoadable;
var Recoil_7 = Recoil.useRecoilState;
var Recoil_8 = Recoil.useRecoilStateLoadable;
var Recoil_9 = Recoil.useSetRecoilState;
var Recoil_10 = Recoil.useResetRecoilState;
var Recoil_11 = Recoil.useRecoilCallback;
var Recoil_12 = Recoil.useTransactionObservation_UNSTABLE;
var Recoil_13 = Recoil.useTransactionSubscription_UNSTABLE;
var Recoil_14 = Recoil.useSetUnvalidatedAtomValues_UNSTABLE;
var Recoil_15 = Recoil.isRecoilValue;

exports.DefaultValue = Recoil_1;
exports.RecoilRoot = Recoil_2;
exports.atom = Recoil_3;
exports.default = Recoil;
exports.isRecoilValue = Recoil_15;
exports.selector = Recoil_4;
exports.useRecoilCallback = Recoil_11;
exports.useRecoilState = Recoil_7;
exports.useRecoilStateLoadable = Recoil_8;
exports.useRecoilValue = Recoil_5;
exports.useRecoilValueLoadable = Recoil_6;
exports.useResetRecoilState = Recoil_10;
exports.useSetRecoilState = Recoil_9;
exports.useSetUnvalidatedAtomValues_UNSTABLE = Recoil_14;
exports.useTransactionObservation_UNSTABLE = Recoil_12;
exports.useTransactionSubscription_UNSTABLE = Recoil_13;
