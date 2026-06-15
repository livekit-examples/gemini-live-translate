import assert from "node:assert/strict";
import test from "node:test";

import {
  applyDesiredSubscription,
  getTranslationTrackSubscription,
  needsSubscriptionUpdate,
  parseTranslationTrackName,
} from "../src/app/session/[id]/room/translationRoutingCore.ts";

test("parses translation track names whose identity contains colons", () => {
  assert.deepEqual(parseTranslationTrackName("tx:peer:with:colon:zh"), {
    sourceIdentity: "peer:with:colon",
    targetLang: "zh",
  });
});

test("subscribes only to translation tracks targeting my language from a different-language peer", () => {
  const peerLangs = new Map([["alice", "zh"]]);

  assert.equal(
    getTranslationTrackSubscription("tx:alice:en", "en", peerLangs, "none"),
    true,
  );
  assert.equal(
    getTranslationTrackSubscription("tx:bob:zh", "en", peerLangs, "none"),
    false,
  );
  assert.equal(
    getTranslationTrackSubscription("camera", "en", peerLangs, "none"),
    null,
  );
});

test("never subscribes to a translation track sourced from the local participant", () => {
  const peerLangs = new Map();

  assert.equal(
    getTranslationTrackSubscription(
      "tx:local-user:zh",
      "zh",
      peerLangs,
      "none",
      "local-user",
    ),
    false,
  );
});

test("forces unsubscribe when LiveKit autoSubscribe still desires an unready track", () => {
  const pub = {
    isSubscribed: false,
    isDesired: true,
    calls: [],
    setSubscribed(desired) {
      this.calls.push(desired);
      this.isDesired = desired;
    },
  };

  assert.equal(needsSubscriptionUpdate(pub, false), true);
  applyDesiredSubscription(pub, false);
  assert.deepEqual(pub.calls, [false]);
});

test("does not repeat an unsubscribe after desired state is already false", () => {
  const pub = {
    isSubscribed: false,
    isDesired: false,
    calls: [],
    setSubscribed(desired) {
      this.calls.push(desired);
    },
  };

  assert.equal(needsSubscriptionUpdate(pub, false), false);
  applyDesiredSubscription(pub, false);
  assert.deepEqual(pub.calls, []);
});
