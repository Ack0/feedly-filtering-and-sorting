/// <reference path="./_references.d.ts" />

import * as cst from "constants";
import * as $ from "jquery";
import * as NodeCreationObserver from "node-creation-observer";
import {Subscription} from "./Subscription";
import {UIManager} from "./UIManager";
import {callbackBind} from "./Utils";

$(document).ready(function () {
    var subscription = new Subscription("");
    var uiManager = new UIManager();
    var uiBind = callbackBind(uiManager);
    uiManager.setSubscription(subscription)

    // Adding filtering configuration
    NodeCreationObserver.onCreation(cst.settingsDivPredecessorSelector, function (element) {
        console.log("Feedly page fully loaded");
        uiManager.setUpSettingsMenu(element);
    }, true);

    // Reset titles array when changing page
    NodeCreationObserver.onCreation(".feedUnreadCountHint, .categoryUnreadCountHint", uiBind(uiManager.resetSorting));

    // New topics listener
    NodeCreationObserver.onCreation(cst.topicSelector, uiBind(uiManager.refreshTopic));
});
