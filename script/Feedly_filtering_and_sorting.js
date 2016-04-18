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
    "filteringEnabledId": "filteringEnabled",
    "restrictingEnabledId": "restrictingEnabled",
    "sortingEnabledId": "sortingEnabled",
    "sortingTypeId": "sortingType",
    "toggleSrcAttr": "toggle-src"
};

var exported = {};
function callbackBind(thisArg) {
    return (function (callback) {
        return callback.bind(this);
    }).bind(thisArg);
}
function $id(id) {
    return $('#' + id);
}
function insertIndex(element, i) {
    // The elemen0t we want to swap with
    var $target = element.parent().children().eq(i);
    // Determine the direction of the appended index so we know what side to place it on
    if (element.index() > i) {
        $target.before(element);
    }
    else {
        $target.after(element);
    }
}

(function (FilteringType) {
    FilteringType[FilteringType["RestrictedOn"] = 0] = "RestrictedOn";
    FilteringType[FilteringType["FilteredOut"] = 1] = "FilteredOut";
})(exported.FilteringType || (exported.FilteringType = {}));
var FilteringType = exported.FilteringType;
(function (SortingType) {
    SortingType[SortingType["PopularityDesc"] = 0] = "PopularityDesc";
    SortingType[SortingType["PopularityAsc"] = 1] = "PopularityAsc";
    SortingType[SortingType["TitleDesc"] = 2] = "TitleDesc";
    SortingType[SortingType["TitleAsc"] = 3] = "TitleAsc";
})(exported.SortingType || (exported.SortingType = {}));
var SortingType = exported.SortingType;
var FilteringTypeIds = (function () {
    function FilteringTypeIds() {
    }
    return FilteringTypeIds;
}());
var Subscription = (function () {
    function Subscription(path) {
        var _this = this;
        this.filteringIdsByType = {};
        this.filteringListsByType = {};
        this.dao = new DAO(path);
        this.filteringEnabled = this.dao.getValue(cst.filteringEnabledId, false);
        this.restrictingEnabled = this.dao.getValue(cst.restrictingEnabledId, false);
        this.sortingEnabled = this.dao.getValue(cst.sortingEnabledId, false);
        this.sortingType = this.dao.getValue(cst.sortingTypeId, SortingType.PopularityDesc);
        this.filteringIdsByType[FilteringType.RestrictedOn] = {
            typeId: "restrictedOnKeywords",
            plusBtnId: "AddRestrictedOnKeyword",
            eraseBtnId: "DeleteAllRestrictedOnKeyword"
        };
        this.filteringIdsByType[FilteringType.FilteredOut] = {
            typeId: "filteredOutKeywords",
            plusBtnId: "AddFilteredOutKeyword",
            eraseBtnId: "DeleteAllFilteredOutKeyword"
        };
        this.forEachFilteringType(function (type) {
            var ids = _this.filteringIdsByType[type];
            _this.filteringListsByType[type] = _this.dao.getValue(ids.typeId, []);
        }, this);
    }
    Subscription.prototype.isFilteringEnabled = function () {
        return this.filteringEnabled;
    };
    Subscription.prototype.setFilteringEnabled = function (filteringEnabled) {
        this.filteringEnabled = filteringEnabled;
        this.dao.setValue(cst.filteringEnabledId, this.filteringEnabled);
    };
    Subscription.prototype.isRestrictingEnabled = function () {
        return this.restrictingEnabled;
    };
    Subscription.prototype.setRestrictingEnabled = function (restrictingEnabled) {
        this.restrictingEnabled = restrictingEnabled;
        this.dao.setValue(cst.restrictingEnabledId, this.restrictingEnabled);
    };
    Subscription.prototype.isSortingEnabled = function () {
        return this.sortingEnabled;
    };
    Subscription.prototype.setSortingEnabled = function (sortingEnabled) {
        this.sortingEnabled = sortingEnabled;
        this.dao.setValue(cst.sortingEnabledId, this.sortingEnabled);
    };
    Subscription.prototype.getSortingType = function () {
        return this.sortingType;
    };
    Subscription.prototype.setSortingType = function (sortingType) {
        this.sortingType = sortingType;
        this.dao.setValue(cst.sortingTypeId, this.sortingType);
    };
    Subscription.prototype.getFilteringList = function (type) {
        return this.filteringListsByType[type];
    };
    Subscription.prototype.getIds = function (type) {
        return this.filteringIdsByType[type];
    };
    Subscription.prototype.forEachFilteringType = function (callback, thisArg) {
        Object.keys(this.filteringIdsByType).forEach(function (type) {
            callback.call(thisArg, type);
        });
    };
    Subscription.prototype.save = function (type) {
        this.dao.setValue(this.getIds(type).typeId, this.getFilteringList(type));
    };
    return Subscription;
}());

var TopicManager = (function () {
    function TopicManager() {
        this.titles = [];
        this.nbrRecommendationsArray = [];
    }
    TopicManager.prototype.setSubscription = function (subscription) {
        this.subscription = subscription;
    };
    TopicManager.prototype.resetSorting = function () {
        this.titles = [];
        this.nbrRecommendationsArray = [];
    };
    TopicManager.prototype.refreshTopic = function (topicNode) {
        var topic = $(topicNode);
        var title = topic.attr(cst.topicTitleAttribute).toLowerCase();
        if (this.subscription.isFilteringEnabled() || this.subscription.isRestrictingEnabled()) {
            var restrictedOnKeywords = this.subscription.getFilteringList(FilteringType.RestrictedOn);
            var filteredOutKeywords = this.subscription.getFilteringList(FilteringType.FilteredOut);
            var keep = false;
            var restrictedCount = restrictedOnKeywords.length;
            if (this.subscription.isRestrictingEnabled() && restrictedCount > 0) {
                keep = true;
                for (var i = 0; i < restrictedCount && keep; i++) {
                    if (title.indexOf(restrictedOnKeywords[i].toLowerCase()) != -1) {
                        keep = false;
                    }
                }
            }
            if (this.subscription.isFilteringEnabled()) {
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
        if (this.subscription.isSortingEnabled()) {
            this.sortTopic(topic);
        }
    };
    TopicManager.prototype.sortTopic = function (topic) {
        var sortingType = this.subscription.getSortingType();
        if (sortingType == SortingType.TitleAsc || sortingType == SortingType.TitleDesc) {
            var title = topic.attr(cst.topicTitleAttribute).toLowerCase();
            this.titles.push(title);
            this.titles.sort();
            if (sortingType == SortingType.TitleDesc) {
                this.titles.reverse();
            }
            var index = jQuery.inArray(title, this.titles);
            insertIndex(topic, index);
        }
        else if (sortingType == SortingType.PopularityAsc || sortingType == SortingType.PopularityDesc) {
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
            this.nbrRecommendationsArray.push(nbrRecommendations);
            this.nbrRecommendationsArray.sort(function (a, b) {
                var i = ((sortingType == SortingType.PopularityAsc) ? -1 : 1);
                return (b - a) * i;
            });
            index = this.nbrRecommendationsArray.lastIndexOf(nbrRecommendations);
            insertIndex(topic, index);
        }
    };
    return TopicManager;
}());

var DAO = (function () {
    function DAO(path) {
        this.path = path;
    }
    DAO.prototype.getValue = function (id, defaultValue) {
        return JSON.parse(GM_getValue(id, JSON.stringify(defaultValue)));
    };
    DAO.prototype.setValue = function (id, value) {
        GM_setValue(id, JSON.stringify(value));
    };
    return DAO;
}());

var UIManager = (function () {
    function UIManager() {
        this.topicManager = new TopicManager();
        this.settingsBtnId = "settingsBtn";
        this.settingsDivId = "settingsDiv";
        this.enableFilteringCheckId = "enableFiltering";
        this.enableRestrictingCheckId = "enableRestricting";
        this.keywordToId = {};
        this.idCount = 1;
    }
    UIManager.prototype.setSubscription = function (subscription) {
        this.subscription = subscription;
        this.topicManager.setSubscription(subscription);
    };
    UIManager.prototype.setUpSettingsMenu = function (settingsDivPredecessor) {
        var settingsDiv = this.getSettingsMenuHTML();
        var settingsBtn = this.getSettingsBtnHTML();
        $(settingsDivPredecessor).after(settingsDiv);
        $(cst.settingsBtnPredecessorSelector).after(settingsBtn);
        $id(this.settingsDivId).css("display", "none")
            .css('margin', '25px')
            .css('border-radius', '25px')
            .css('border', '2px solid #336699')
            .css('background', '#E0F5FF')
            .css('padding', '20px');
        this.setUpSettingsMenuEvents();
    };
    UIManager.prototype.getSettingsMenuHTML = function () {
        var settingsDiv = '<div id="' + this.settingsDivId + '" >' +
            // Checkbox to enable filtering
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Filtering enabled</span>' +
            '<input id="' + this.enableFilteringCheckId + '" type="checkbox" style="vertical-align: middle;">' +
            '</div>' +
            // Checkbox to enable restricting
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Restricting enabled</span>' +
            '<input id="' + this.enableRestrictingCheckId + '" type="checkbox" style="vertical-align: middle;">' +
            '</div>' +
            // Checkbox to enable sorting
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Sorting enabled</span>' +
            '<input id="' + cst.sortingEnabledId + '" type="checkbox" style="vertical-align: middle;">' +
            '<select id=' + cst.sortingTypeId + '>' +
            '<option value="' + SortingType.PopularityDesc + '">Sort by number of recommendations (highest to lowest)</option>' +
            '<option value="' + SortingType.TitleAsc + '">Sort by title (a -> z)</option>' +
            '<option value="' + SortingType.PopularityAsc + '">Sort by number of recommendations (lowest to highest)</option>' +
            '<option value="' + SortingType.TitleDesc + '">Sort by title (z -> a)</option>' +
            '</select>' +
            '</div>' +
            // Restricted on keyword list
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Restricted on keyword list: </span>' +
            this.getFilteringListHTML(FilteringType.RestrictedOn) +
            '</div>' +
            // Filtered out keyword list
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Filtered out keyword list: </span>' +
            this.getFilteringListHTML(FilteringType.FilteredOut) +
            '</div>' +
            '</div>';
        return settingsDiv;
    };
    UIManager.prototype.getFilteringListHTML = function (type) {
        var ids = this.subscription.getIds(type);
        var filteringList = this.subscription.getFilteringList(type);
        var result = "<span id=" + ids.typeId + ">";
        // keyword list
        for (var i = 0; i < filteringList.length; i++) {
            var keyword = filteringList[i];
            var keywordId = this.getId(ids.typeId, keyword);
            result += '<button id="' + keywordId + '" type="button" style="' + cst.keywordTagStyle + '">' + keyword + '</button>';
        }
        // plus button
        result += '<span id="' + ids.plusBtnId + '" > <img src="' + cst.plusIconLink + '" style="' + cst.iconStyle + '" /></span>';
        // Erase button
        result += '<span id="' + ids.eraseBtnId + '" > <img src="' + cst.eraseIconLink + '" style="' + cst.iconStyle + '" /></span>';
        result += "</span>";
        return result;
    };
    UIManager.prototype.getSettingsBtnHTML = function () {
        var settingsBtn = '<img id="' + this.settingsBtnId + '" class="pageAction requiresLogin" style="display: inline; width: 24px; height: 24px;" src="' + cst.filterIconLink + '" ' + cst.toggleSrcAttr + '="' + cst.closeIconLink + '" alt="icon"/>';
        return settingsBtn;
    };
    UIManager.prototype.setUpSettingsMenuEvents = function () {
        var this_ = this;
        // Set checkbox & select boxes correct state
        var filteringCheck = $id(this.enableFilteringCheckId);
        var restrictingCheck = $id(this.enableRestrictingCheckId);
        var sortingCheck = $id(cst.sortingEnabledId);
        var sortingTypeSelect = $id(cst.sortingTypeId);
        filteringCheck.prop('checked', this.subscription.isFilteringEnabled());
        restrictingCheck.prop('checked', this.subscription.isRestrictingEnabled());
        sortingCheck.prop('checked', this.subscription.isSortingEnabled());
        sortingTypeSelect.val(this.subscription.getSortingType());
        // Checkbox & select boxes events
        filteringCheck.change(function () {
            this_.subscription.setFilteringEnabled($(this).is(':checked'));
            this_.refreshTopics();
        });
        restrictingCheck.change(function () {
            this_.subscription.setRestrictingEnabled($(this).is(':checked'));
            this_.refreshTopics();
        });
        sortingCheck.change(function () {
            this_.subscription.setSortingEnabled($(this).is(':checked'));
            this_.refreshTopics();
        });
        sortingTypeSelect.change(function () {
            this_.subscription.setSortingType(sortingTypeSelect.val());
            this_.refreshTopics();
        });
        // Setting button events
        $id(this.settingsBtnId).click(function () {
            var current = $(this).attr("src");
            var swap = $(this).attr(cst.toggleSrcAttr);
            $(this).attr('src', swap).attr(cst.toggleSrcAttr, current);
            $id(this_.settingsDivId).toggle();
        });
        this.setUpFilteringListEvents();
    };
    UIManager.prototype.refreshFilteringList = function (type) {
        var keywordListHtml = this.getFilteringListHTML(type);
        var keywordListId = this.subscription.getIds(type).typeId;
        $id(keywordListId).replaceWith(keywordListHtml);
        this.refreshTopics();
        this.subscription.save(type);
        this.setUpFilteringListEvents();
    };
    UIManager.prototype.setUpFilteringListEvents = function () {
        this.subscription.forEachFilteringType(this.setUpFilteringListTypeEvents, this);
    };
    UIManager.prototype.setUpFilteringListTypeEvents = function (type) {
        var _this = this;
        var ids = this.subscription.getIds(type);
        var keywordList = this.subscription.getFilteringList(type);
        $id(ids.plusBtnId).click(function () {
            var keyword = prompt("Add keyword", "");
            if (keyword !== null) {
                keywordList.push(keyword);
                _this.refreshFilteringList(type);
            }
        });
        // Erase button event
        $id(ids.eraseBtnId).click(function () {
            if (confirm("Erase all the keyword of this list ?")) {
                keywordList.length = 0;
                _this.refreshFilteringList(type);
            }
        });
        // Keyword buttons events
        var t = this;
        for (var i = 0; i < keywordList.length; i++) {
            var keywordId = this.getId(ids.typeId, keywordList[i]);
            $id(keywordId).click(function () {
                var keyword = $(this).text();
                if (confirm("Delete the keyword ?")) {
                    var index = keywordList.indexOf(keyword);
                    if (index > -1) {
                        keywordList.splice(index, 1);
                        t.refreshFilteringList(type);
                    }
                }
            });
        }
    };
    UIManager.prototype.refreshTopics = function () {
        this.topicManager.resetSorting();
        $(cst.topicSelector).toArray().forEach(this.topicManager.refreshTopic, this.topicManager);
    };
    UIManager.prototype.getId = function (keywordListId, keyword) {
        if (!(keyword in this.keywordToId)) {
            var id = this.idCount++;
            this.keywordToId[keyword] = id;
        }
        return keywordListId + "_" + this.keywordToId[keyword];
    };
    UIManager.prototype.refreshTopic = function (topicNode) {
        this.topicManager.refreshTopic(topicNode);
    };
    UIManager.prototype.resetSorting = function () {
        this.topicManager.resetSorting();
    };
    return UIManager;
}());

$(document).ready(function () {
    var subscription = new Subscription("");
    var uiManager = new UIManager();
    var uiBind = callbackBind(uiManager);
    uiManager.setSubscription(subscription);
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
