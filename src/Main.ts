/// <reference path="./_references.d.ts" />

import * as cst from "constants";
import {Subscription} from "./Subscription";
import {UIManager} from "./UIManager";
import {callbackBind} from "./Utils";

$(document).ready(function () {
    var uiManager = new UIManager();
    var uiManagerBind = callbackBind(uiManager);

    // Adding filtering configuration
    NodeCreationObserver.onCreation(cst.settingsDivPredecessorSelector, function (element) {
        console.log("Feedly page fully loaded");

        // Set up first page
        NodeCreationObserver.onCreation(cst.pageChangeSelector, function() {
            uiManager.refreshPage();
            uiManager.setUpSettingsMenu(element);

            // Reset titles array when changing page
            NodeCreationObserver.onCreation(cst.pageChangeSelector, uiManagerBind(uiManager.refreshPage));
        }, true);

        // New topics listener
        NodeCreationObserver.onCreation(cst.topicSelector, uiManagerBind(uiManager.refreshTopic));
    }, true);
});
