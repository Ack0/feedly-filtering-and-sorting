/// <reference path="./_references.d.ts" />

import * as cst from "constants";
import {Subscription} from "./Subscription";
import {UIManager} from "./UIManager";
import {callbackBind} from "./Utils";

$(document).ready(function () {
    var uiManager = new UIManager();
    var uiManagerBind = callbackBind(uiManager);

    NodeCreationObserver.onCreation(cst.pageChangeSelector, function() {
        console.log("Feedly page fully loaded");
        uiManager.refreshPage();
        uiManager.setUpSettingsMenu();

        // New topics listener
        NodeCreationObserver.onCreation(cst.topicSelector, uiManagerBind(uiManager.refreshTopic));

        // Reset titles array when changing page
        NodeCreationObserver.onCreation(cst.pageChangeSelector, uiManagerBind(uiManager.refreshPage));
    }, true);
});
