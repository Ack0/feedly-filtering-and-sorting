// ==UserScript==
// @name        Feedly filtering and sorting
// @namespace   https://github.com/soufianesakhi/feedly-filtering-and-sorting
// @description Enhance the feedly website with advanced filtering and sorting capabilities
// @author      Soufiane Sakhi
// @license     MIT licensed, Copyright (c) 2016 Soufiane Sakhi (https://opensource.org/licenses/MIT)
// @homepage    https://github.com/soufianesakhi/feedly-filtering-and-sorting
// @supportURL  https://github.com/soufianesakhi/feedly-filtering-and-sorting/issues
// @icon        http://s3.feedly.com/img/feedly-512.png
// @require     http://code.jquery.com/jquery.min.js
// @require     https://openuserjs.org/src/libs/soufianesakhi/node-creation-observer.min.js
// @include     *://feedly.com/*
// @version     1.0.0
// @grant       GM_setValue
// @grant       GM_getValue
// ==/UserScript==

var cst = {
    "filterIconLink": "https://cdn2.iconfinder.com/data/icons/windows-8-metro-style/128/empty_filter.png",
    "plusIconLink": "https://cdn0.iconfinder.com/data/icons/social-messaging-ui-color-shapes/128/add-circle-blue-128.png",
    "eraseIconLink": "https://cdn2.iconfinder.com/data/icons/large-glossy-svg-icons/512/erase_delete_remove_wipe_out-128.png",
    "closeIconLink": "https://cdn2.iconfinder.com/data/icons/social-productivity-line-art-1/128/close-cancel-128.png",
    "settingsDivPredecessorSelector": "#feedlyPageHeader",
    "settingsBtnPredecessorSelector": "#pageActionCustomize",
    "topicSelector": "#section0_column0 > div",
    "topicTitleAttribute": "data-title",
    "nbrRecommendationsSelector": ".nbrRecommendations",
    "keywordTagStyle": "vertical-align: middle; background-color: #35A5E2; border-radius: 20px; color: #FFF; cursor: pointer;",
    "iconStyle": "vertical-align: middle; height: 20px; width: 20px; cursor: pointer;",
    "settingsDivSpanStyle": "style='display: inline; vertical-align: middle;'",
    "profileNameId": "profileName",
    "profileListId": "profileList",
    "restrictedOnKeywordsId": "restrictedOnKeywords",
    "filteredOutKeywordsId": "filteredOutKeywords",
    "filteringEnabledId": "filteringEnabled",
    "restrictingEnabledId": "restrictingEnabled",
    "sortingEnabledId": "sortingEnabled",
    "sortingTypeId": "sortingType",
    "toggleSrcAttr": "toggle-src"
};

// ------------------- Variables -------------------
var profileName = GM_getValue(cst.profileNameId, "");
var profileList = deserializeDirectly(cst.profileListId, []);
var restrictedOnKeywords = deserialize(cst.restrictedOnKeywordsId, []);
var filteredOutKeywords = deserialize(cst.filteredOutKeywordsId, []);
var filteringEnabled = getValue(cst.filteringEnabledId, false);
var restrictingEnabled = getValue(cst.restrictingEnabledId, false);
var sortingEnabled = getValue(cst.sortingEnabledId, false);
var sortingType = getValue(cst.sortingTypeId, 'nbRecommendationsDesc');
var titles = [];
var nbrRecommendationsArray = [];
var keywords = {};
keywords[cst.restrictedOnKeywordsId] = {
    list: restrictedOnKeywords,
    plusBtnId: "AddRestrictedOnKeyword",
    eraseBtnId: "DeleteAllRestrictedOnKeyword"
};
keywords[cst.filteredOutKeywordsId] = {
    list: filteredOutKeywords,
    plusBtnId: "AddFilteredOutKeyword",
    eraseBtnId: "DeleteAllFilteredOutKeyword"
};
// ------------------- Utilities -------------------
function profile(id) {
    return profileName + "" + id;
}
function deserializeDirectly(id, def) {
    return eval(GM_getValue(id, (def || '({})')));
}
function serializeDirectly(id, val) {
    GM_setValue(id, uneval(val));
}
function deserialize(id, def) {
    return eval(getValue(id, (def || '({})')));
}
function serialize(id, val) {
    setValue(id, uneval(val));
}
function getValue(id, value) {
    return GM_getValue(profile(id), value);
}
function setValue(id, value) {
    GM_setValue(profile(id), value);
}
function $id(id) {
    return $('#' + id);
}
function getId(keywordListId, keyword) {
    return keywordListId + "_" + keyword;
}
$.fn.insertIndex = function (i) {
    // The element we want to swap with
    var $target = this.parent().children().eq(i);
    // Determine the direction of the appended index so we know what side to place it on
    if (this.index() > i) {
        $target.before(this);
    }
    else {
        $target.after(this);
    }
    return this;
};
// ------------------- Main functions -------------------
function resetSorting() {
    titles = [];
    nbrRecommendationsArray = [];
}
function refreshTopics() {
    resetSorting();
    $(cst.topicSelector).each(function () {
        refreshTopic($(this));
    });
}
function refreshTopic(topic) {
    var title = topic.attr(cst.topicTitleAttribute).toLowerCase();
    if (filteringEnabled || restrictingEnabled) {
        var keep = false;
        var restrictedCount = restrictedOnKeywords.length;
        if (restrictingEnabled && restrictedCount > 0) {
            keep = true;
            for (var i = 0; i < restrictedCount && keep; i++) {
                if (title.indexOf(restrictedOnKeywords[i].toLowerCase()) != -1) {
                    keep = false;
                }
            }
        }
        if (filteringEnabled) {
            for (var i = 0; i < filteredOutKeywords.length && !keep; i++) {
                if (title.indexOf(filteredOutKeywords[i].toLowerCase()) != -1) {
                    keep = true;
                }
            }
        }
        if (keep) {
            topic.css("display", "none");
        }
        else {
            topic.css("display", "");
        }
    }
    else {
        topic.css("display", "");
    }
    if (sortingEnabled) {
        sortTopic(topic);
    }
}
function sortTopic(topic) {
    if (sortingType == 'titleAsc' || sortingType == 'titleDesc') {
        var title = topic.attr(cst.topicTitleAttribute).toLowerCase();
        titles.push(title);
        titles.sort();
        if (sortingType == 'titleDesc') {
            titles.reverse();
        }
        var index = jQuery.inArray(title, titles);
        topic.insertIndex(index);
    }
    else if (sortingType == 'nbRecommendationsAsc' || sortingType == 'nbRecommendationsDesc') {
        var nbrRecommendationsStr = topic.find(cst.nbrRecommendationsSelector).text().trim();
        nbrRecommendationsStr = nbrRecommendationsStr.replace("+", "");
        if (nbrRecommendationsStr.indexOf("K") > -1) {
            nbrRecommendationsStr = nbrRecommendationsStr.replace("K", "");
            nbrRecommendationsStr += "000";
        }
        var nbrRecommendations = Number(nbrRecommendationsStr);
        if (nbrRecommendations < 100) {
            nbrRecommendations = 1;
        }
        nbrRecommendationsArray.push(nbrRecommendations);
        nbrRecommendationsArray.sort(function (a, b) {
            var i = (sortingType == 'nbRecommendationsAsc' ? -1 : 1);
            return (b - a) * i;
        });
        index = nbrRecommendationsArray.lastIndexOf(nbrRecommendations);
        topic.insertIndex(index);
    }
}
function getKeywordList(keywordList, keywordListId) {
    var result = "<span id=" + keywordListId + ">";
    // keyword list
    for (var i = 0; i < keywordList.length; i++) {
        var keyword = keywordList[i];
        var keywordId = getId(keywordListId, keyword);
        result += '<button id="' + keywordId + '" type="button" style="' + cst.keywordTagStyle + '">' + keyword + '</button>';
    }
    // plus button
    var plusBtnId = keywords[keywordListId].plusBtnId;
    result += '<span id="' + plusBtnId + '" > <img src="' + cst.plusIconLink + '" style="' + cst.iconStyle + '" /></span>';
    // Erase button
    var eraseBtnId = keywords[keywordListId].eraseBtnId;
    result += '<span id="' + eraseBtnId + '" > <img src="' + cst.eraseIconLink + '" style="' + cst.iconStyle + '" /></span>';
    result += "</span>";
    return result;
}
function getProfileList() {
    return "";
}
function setKeywordListEvents(keywordList, keywordListId) {
    // Plus button event
    var plusBtnId = keywords[keywordListId].plusBtnId;
    $id(plusBtnId).click(function () {
        var keyword = prompt("Add keyword", "");
        if (keyword !== null) {
            keywordList.push(keyword);
            refreshKeywordList(keywordList, keywordListId);
        }
    });
    // Erase button event
    var eraseBtnId = keywords[keywordListId].eraseBtnId;
    $id(eraseBtnId).click(function () {
        if (confirm("Erase all the keyword of this list ?")) {
            keywords[keywordListId].list.length = 0;
            refreshKeywordList(keywordList, keywordListId);
        }
    });
    // Keyword buttons events
    for (var i = 0; i < keywordList.length; i++) {
        var keywordId = getId(keywordListId, keywordList[i]);
        $id(keywordId).click(function () {
            var keyword = $(this).text();
            if (confirm("Delete the keyword ?")) {
                var index = keywordList.indexOf(keyword);
                if (index > -1) {
                    keywordList.splice(index, 1);
                    refreshKeywordList(keywordList, keywordListId);
                }
            }
        });
    }
}
function refreshKeywordList(keywordList, keywordListId) {
    var keywordListHtml = getKeywordList(keywordList, keywordListId);
    $id(keywordListId).replaceWith(keywordListHtml);
    refreshTopics();
    serialize(keywordListId, keywordList);
    setKeywordListEvents(keywordList, keywordListId);
}
// ------------------- Start -------------------
$(document).ready(function () {
    var enableFilteringCheckId = "enableFiltering";
    var enableRestrictingCheckId = "enableRestricting";
    var settingsDivId = "settingsDiv";
    var settingsBtnId = "settingsBtn";
    // Adding filtering configuration
    NodeCreationObserver.onCreation(cst.settingsDivPredecessorSelector, function () {
        console.log("Node Created: " + cst.settingsDivPredecessorSelector);
        // Settings Button
        var settingsBtn = '<img id="' + settingsBtnId + '" class="pageAction requiresLogin" style="display: inline; width: 24px; height: 24px;" src="' + cst.filterIconLink + '" ' + cst.toggleSrcAttr + '="' + cst.closeIconLink + '" alt="icon"/>';
        $(cst.settingsBtnPredecessorSelector).after(settingsBtn);
        // Settings Div
        var settingsDiv = '<div id="' + settingsDivId + '" >' +
            // Profile selector
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Profile</span>' +
            getProfileList() +
            '</div>' +
            // Checkbox to enable filtering
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Filtering enabled</span>' +
            '<input id="' + enableFilteringCheckId + '" type="checkbox" style="vertical-align: middle;">' +
            '</div>' +
            // Checkbox to enable restricting
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Restricting enabled</span>' +
            '<input id="' + enableRestrictingCheckId + '" type="checkbox" style="vertical-align: middle;">' +
            '</div>' +
            // Checkbox to enable sorting
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Sorting enabled</span>' +
            '<input id="' + cst.sortingEnabledId + '" type="checkbox" style="vertical-align: middle;">' +
            '<select id=' + cst.sortingTypeId + '>' +
            '<option value="nbRecommendationsDesc">Sort by number of recommendations (highest to lowest)</option>' +
            '<option value="titleAsc">Sort by title (a -> z)</option>' +
            '<option value="nbRecommendationsAsc">Sort by number of recommendations (lowest to highest)</option>' +
            '<option value="titleDesc">Sort by title (z -> a)</option>' +
            '</select>' +
            '</div>' +
            // Restricted on keyword list
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Restricted on keyword list: </span>' +
            getKeywordList(restrictedOnKeywords, cst.restrictedOnKeywordsId) +
            '</div>' +
            // Filtered out keyword list
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Filtered out keyword list: </span>' +
            getKeywordList(filteredOutKeywords, cst.filteredOutKeywordsId) +
            '</div>' +
            '</div>';
        $(this).after(settingsDiv);
        // Set checkbox & select boxes correct state
        var filteringCheck = $id(enableFilteringCheckId);
        filteringCheck.prop('checked', filteringEnabled);
        var restrictingCheck = $id(enableRestrictingCheckId);
        restrictingCheck.prop('checked', restrictingEnabled);
        var sortingCheck = $id(cst.sortingEnabledId);
        sortingCheck.prop('checked', sortingEnabled);
        var sortingTypeSelect = $id(cst.sortingTypeId);
        sortingTypeSelect.val(sortingType);
        // Checkbox & select boxes events
        filteringCheck.change(function () {
            filteringEnabled = $(this).is(':checked');
            setValue(cst.filteringEnabledId, filteringEnabled);
            refreshTopics();
        });
        restrictingCheck.change(function () {
            restrictingEnabled = $(this).is(':checked');
            setValue(cst.restrictingEnabledId, restrictingEnabled);
            refreshTopics();
        });
        sortingCheck.change(function () {
            sortingEnabled = $(this).is(':checked');
            setValue(cst.sortingEnabledId, sortingEnabled);
            refreshTopics();
        });
        sortingTypeSelect.change(function () {
            sortingType = sortingTypeSelect.val();
            setValue(cst.sortingTypeId, sortingType);
            refreshTopics();
        });
        // Setting button events
        $id(settingsBtnId).click(function () {
            var _this = $(this);
            var current = _this.attr("src");
            var swap = _this.attr(cst.toggleSrcAttr);
            _this.attr('src', swap).attr(cst.toggleSrcAttr, current);
            $id(settingsDivId).toggle();
        });
        // Settings Div Style
        $id(settingsDivId).css("display", "none")
            .css('margin', '25px')
            .css('border-radius', '25px')
            .css('border', '2px solid #336699')
            .css('background', '#E0F5FF')
            .css('padding', '20px');
        // Events on keyword lists
        setKeywordListEvents(restrictedOnKeywords, cst.restrictedOnKeywordsId);
        setKeywordListEvents(filteredOutKeywords, cst.filteredOutKeywordsId);
    }, true);
    // Reset titles array when changing page
    NodeCreationObserver.onCreation(".feedUnreadCountHint, .categoryUnreadCountHint", resetSorting);
    // New topics listener
    NodeCreationObserver.onCreation(cst.topicSelector, function () {
        refreshTopic($(this));
    });
});
