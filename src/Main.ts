/// <reference path="./_references.d.ts" />

import {UIManager} from "./UIManager";
import {callbackBindedTo} from "./Utils";

$(document).ready(function () {
    var uiManager = new UIManager();
    var uiManagerBind = callbackBindedTo(uiManager);
    $("head").append("<style>" + templates.styleCSS + "</style>");

    NodeCreationObserver.onCreation(ext.pageChangeSelector, function() {
        console.log("Feedly page fully loaded");
        uiManager.init();
        NodeCreationObserver.onCreation(ext.articleSelector, uiManagerBind(uiManager.addArticle));
        NodeCreationObserver.onCreation(ext.pageChangeSelector, uiManagerBind(uiManager.updatePage));
    }, true);
});
