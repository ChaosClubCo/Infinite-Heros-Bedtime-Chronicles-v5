'use strict';

/**
 * jest-expo 55 still does `require('react-native/jest-preset')`.
 * React Native 0.87 removed that package export (`ERR_PACKAGE_PATH_NOT_EXPORTED`)
 * and ships the preset as `@react-native/jest-preset` instead.
 *
 * Load this file before jest-expo evaluates so component tests can run.
 * Do not skip or weaken `npm run test:components`.
 */
const Module = require('module');

const LEGACY_RN_JEST_PRESET = 'react-native/jest-preset';
const RN_JEST_PRESET_PACKAGE = '@react-native/jest-preset';

let shimInstalled = false;

/**
 * Rewrites the removed React Native Jest preset path onto the published package.
 * Idempotent so Jest workers / repeated config loads do not stack wrappers.
 */
function installReactNativeJestPresetShim() {
  if (shimInstalled) {
    return;
  }

  const originalLoad = Module._load;
  Module._load = function infinityHeroesRnJestPresetShim(request, parent, isMain) {
    if (request === LEGACY_RN_JEST_PRESET) {
      request = RN_JEST_PRESET_PACKAGE;
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  shimInstalled = true;
}

installReactNativeJestPresetShim();

module.exports = {
  installReactNativeJestPresetShim,
  LEGACY_RN_JEST_PRESET,
  RN_JEST_PRESET_PACKAGE,
};
