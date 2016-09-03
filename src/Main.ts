/// <reference path="./_references.d.ts" />

import {UIManager} from "./UIManager";
import {callbackBindedTo} from "./Utils";

$(document).ready(function () {
    var uiManager = new UIManager();
    var uiManagerBind = callbackBindedTo(uiManager);
    $("head").append("<style>" + templates.styleCSS + "</style>");

    NodeCreationObserver.onCreation(ext.subscriptionChangeSelector, function() {
        console.log("Feedly page fully loaded");
        uiManager.init();
        NodeCreationObserver.onCreation(ext.articleSelector, uiManagerBind(uiManager.addArticle));
        NodeCreationObserver.onCreation(ext.magazineTopEntrySelector, uiManagerBind(uiManager.addMagazineTopEntry));
        NodeCreationObserver.onCreation(ext.sectionSelector, uiManagerBind(uiManager.addSection));
        NodeCreationObserver.onCreation(ext.subscriptionChangeSelector, uiManagerBind(uiManager.updatePage));
    }, true);
});
