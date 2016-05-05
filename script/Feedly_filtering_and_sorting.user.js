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
// @require     https://raw.githubusercontent.com/soufianesakhi/node-creation-observer-js/master/release/node-creation-observer-latest.js
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
    "settingsBtnPredecessorSelector": "#pageActionCustomize, #floatingPageActionCustomize",
    "topicSelector": "#section0_column0 > div",
    "pageChangeSelector": "h1#feedlyTitleBar > .hhint",
    "topicTitleAttribute": "data-title",
    "nbrRecommendationsSelector": ".nbrRecommendations",
};

var exported = {};
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
function callbackBind(thisArg) {
    return (function (callback) {
        return callback.bind(this);
    }).bind(thisArg);
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
        this.filteringEnabledId = "filteringEnabled";
        this.restrictingEnabledId = "restrictingEnabled";
        this.sortingEnabledId = "sortingEnabled";
        this.sortingTypeId = "sortingType";
        this.dao = new DAO(path);
        this.filteringEnabled = this.dao.getValue(this.filteringEnabledId, false);
        this.restrictingEnabled = this.dao.getValue(this.restrictingEnabledId, false);
        this.sortingEnabled = this.dao.getValue(this.sortingEnabledId, false);
        this.sortingType = this.dao.getValue(this.sortingTypeId, SortingType.PopularityDesc);
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
        this.dao.setValue(this.filteringEnabledId, this.filteringEnabled);
    };
    Subscription.prototype.isRestrictingEnabled = function () {
        return this.restrictingEnabled;
    };
    Subscription.prototype.setRestrictingEnabled = function (restrictingEnabled) {
        this.restrictingEnabled = restrictingEnabled;
        this.dao.setValue(this.restrictingEnabledId, this.restrictingEnabled);
    };
    Subscription.prototype.isSortingEnabled = function () {
        return this.sortingEnabled;
    };
    Subscription.prototype.setSortingEnabled = function (sortingEnabled) {
        this.sortingEnabled = sortingEnabled;
        this.dao.setValue(this.sortingEnabledId, this.sortingEnabled);
    };
    Subscription.prototype.getSortingType = function () {
        return this.sortingType;
    };
    Subscription.prototype.setSortingType = function (sortingType) {
        this.sortingType = sortingType;
        this.dao.setValue(this.sortingTypeId, this.sortingType);
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
        this.keywordToId = {};
        this.idCount = 1;
        this.settingsDivId = this.getHTMLId("settingsDiv");
        this.settingsBtnId = this.getHTMLId("settingsBtn");
        this.settingsDivContainerId = this.getHTMLId("settingsDivContainer");
        this.closeBtnId = this.getHTMLId("CloseSettingsBtn");
        this.enableFilteringCheckId = this.getHTMLId("enableFiltering");
        this.enableRestrictingCheckId = this.getHTMLId("enableRestricting");
        this.sortingTypeId = this.getHTMLId("sortingType");
        this.sortingEnabledId = this.getHTMLId("sortingEnabled");
    }
    UIManager.prototype.setUpSettingsMenu = function () {
        this.initSettingsMenu();
        this.initSettingsBtns();
        this.setUpSettingsMenuEvents();
    };
    UIManager.prototype.initSettingsMenu = function () {
        var marginElementClass = this.getHTMLId("margin_element");
        var tabsMenuId = this.getHTMLId("tabs_menu");
        var tabsContentContainerId = this.getHTMLId("tabs_content");
        var settingsDiv = '<div id="' + this.settingsDivContainerId + '" >' +
            '<div id="' + this.settingsDivId + '" >' +
            // Close btn
            '<img id="' + this.closeBtnId + '" src="' + cst.closeIconLink + '" style="float:right;display:inline-block;width: 24px; height: 24px;" class="pageAction requiresLogin"/>' +
            // Checkbox to enable filtering
            '<span>' +
            '<span class="FFnS_settings_span">Filtering enabled</span>' +
            '<input id="' + this.enableFilteringCheckId + '" type="checkbox" style="vertical-align: middle;">' +
            '</span>' +
            // Checkbox to enable restricting
            '<span class="' + marginElementClass + '">' +
            '<span class="FFnS_settings_span">Restricting enabled</span>' +
            '<input id="' + this.enableRestrictingCheckId + '" type="checkbox" style="vertical-align: middle;">' +
            '</span>' +
            // Checkbox to enable sorting
            '<span class="' + marginElementClass + '">' +
            '<span class="FFnS_settings_span">Sorting enabled</span>' +
            '<input id="' + this.sortingEnabledId + '" type="checkbox" style="vertical-align: middle;">' +
            // Combo box sorting type
            '<select id=' + this.sortingTypeId + ' class="' + marginElementClass + '" style="vertical-align: middle; font-size:12px;">' +
            '<option value="' + SortingType.PopularityDesc + '">Sort by number of recommendations (highest to lowest)</option>' +
            '<option value="' + SortingType.TitleAsc + '">Sort by title (a -> z)</option>' +
            '<option value="' + SortingType.PopularityAsc + '">Sort by number of recommendations (lowest to highest)</option>' +
            '<option value="' + SortingType.TitleDesc + '">Sort by title (z -> a)</option>' +
            '</select>' +
            '</span>' +
            // Filtering tabs
            '<ul id="' + tabsMenuId + '">' +
            '<li class="current"><a href="#' + this.getFilteringTypeTabId(FilteringType.FilteredOut) + '">Filtering (Keywords the feeds must not contain)</a></li>' +
            '<li><a href="#' + this.getFilteringTypeTabId(FilteringType.RestrictedOn) + '">Restricting (Keywords the the feeds must contain)</a></li>' +
            '</ul>' +
            '<div id="' + tabsContentContainerId + '">' +
            this.getFilteringListHTML(FilteringType.FilteredOut) +
            this.getFilteringListHTML(FilteringType.RestrictedOn) +
            '</div>' +
            '</div>' +
            '</div>';
        $("body").prepend(settingsDiv);
        // set up tabs
        $("#" + tabsMenuId + " a").click(function (event) {
            event.preventDefault();
            $(this).parent().addClass("current");
            $(this).parent().siblings().removeClass("current");
            var tab = $(this).attr("href");
            $("#" + tabsContentContainerId + " > div").not(tab).css("display", "none");
            $(tab).show();
        });
        var firstDiv = $("#" + tabsContentContainerId + " > div").first().show();
    };
    UIManager.prototype.getFilteringListHTML = function (type) {
        var ids = this.subscription.getIds(type);
        var filteringList = this.subscription.getFilteringList(type);
        // plus button
        var result = '<div id="' + this.getFilteringTypeTabId(type) + '" class="FFnS_FilteringList">' +
            '<span id="' + this.getHTMLId(ids.plusBtnId) + '" > <img src="' + cst.plusIconLink + '" class="FFnS_icon" /></span>';
        // Erase button
        result += '<span id="' + this.getHTMLId(ids.eraseBtnId) + '" > <img src="' + cst.eraseIconLink + '" class="FFnS_icon" /></span>';
        // keyword list
        for (var i = 0; i < filteringList.length; i++) {
            var keyword = filteringList[i];
            var keywordId = this.getKeywordId(ids.typeId, keyword);
            result += '<button id="' + keywordId + '" type="button" class="FFnS_keyword">' + keyword + '</button>';
        }
        result += "</div>";
        return result;
    };
    UIManager.prototype.initSettingsBtns = function () {
        var this_ = this;
        $(cst.settingsBtnPredecessorSelector).each(function (i, element) {
            var clone = $(element).clone();
            $(clone).attr('id', this_.getBtnId(element.id));
            $(clone).attr('src', cst.filterIconLink);
            $(clone).attr('alt', 'icon');
            $(clone).attr('data-page-action', '');
            $(element).after(clone);
            $(clone).click(function () {
                $id(this_.settingsDivContainerId).toggle();
            });
        });
    };
    UIManager.prototype.setUpSettingsMenuEvents = function () {
        var this_ = this;
        // Set checkbox & select boxes correct state
        var filteringCheck = $id(this.enableFilteringCheckId);
        var restrictingCheck = $id(this.enableRestrictingCheckId);
        var sortingCheck = $id(this.sortingEnabledId);
        var sortingTypeSelect = $id(this.sortingTypeId);
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
        $id(this.closeBtnId).click(function () {
            $id(this_.settingsDivContainerId).toggle();
        });
        this.setUpFilteringListEvents();
    };
    UIManager.prototype.refreshFilteringList = function (type) {
        var keywordListHtml = this.getFilteringListHTML(type);
        var keywordListId = this.subscription.getIds(type).typeId;
        $id(this.getFilteringTypeTabId(type)).replaceWith(keywordListHtml);
        $id(this.getFilteringTypeTabId(type)).show();
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
        $id(this.getHTMLId(ids.plusBtnId)).click(function () {
            var keyword = prompt("Add keyword", "");
            if (keyword !== null) {
                keywordList.push(keyword);
                _this.refreshFilteringList(type);
            }
        });
        // Erase button event
        $id(this.getHTMLId(ids.eraseBtnId)).click(function () {
            if (confirm("Erase all the keyword of this list ?")) {
                keywordList.length = 0;
                _this.refreshFilteringList(type);
            }
        });
        // Keyword buttons events
        var t = this;
        for (var i = 0; i < keywordList.length; i++) {
            var keywordId = this.getKeywordId(ids.typeId, keywordList[i]);
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
    UIManager.prototype.getHTMLId = function (id) {
        return "FFnS_" + id;
    };
    UIManager.prototype.getKeywordId = function (keywordListId, keyword) {
        if (!(keyword in this.keywordToId)) {
            var id = this.idCount++;
            this.keywordToId[keyword] = id;
        }
        return this.getHTMLId(keywordListId + "_" + this.keywordToId[keyword]);
    };
    UIManager.prototype.getBtnId = function (elementId) {
        return this.getHTMLId(this.settingsBtnId + "_" + elementId);
    };
    UIManager.prototype.getFilteringTypeTabId = function (filteringType) {
        return this.getHTMLId("tab_" + FilteringType[filteringType]);
    };
    UIManager.prototype.refreshPage = function () {
        this.refreshSubscription();
        this.resetSorting();
    };
    UIManager.prototype.refreshSubscription = function () {
        var url = document.URL;
        console.log("url changed: " + url);
        this.subscription = new Subscription("");
        this.topicManager.setSubscription(this.subscription);
    };
    UIManager.prototype.resetSorting = function () {
        this.topicManager.resetSorting();
    };
    UIManager.prototype.refreshTopic = function (topicNode) {
        this.topicManager.refreshTopic(topicNode);
    };
    return UIManager;
}());

$(document).ready(function () {
    var uiManager = new UIManager();
    var uiManagerBind = callbackBind(uiManager);
    NodeCreationObserver.onCreation(cst.pageChangeSelector, function () {
        console.log("Feedly page fully loaded");
        uiManager.refreshPage();
        uiManager.setUpSettingsMenu();
        // New topics listener
        NodeCreationObserver.onCreation(cst.topicSelector, uiManagerBind(uiManager.refreshTopic));
        // Reset titles array when changing page
        NodeCreationObserver.onCreation(cst.pageChangeSelector, uiManagerBind(uiManager.refreshPage));
    }, true);
});
$("head").append("<style>#FFnS_settingsDivContainer { display: none; background: rgba(0,0,0,0.9); width: 100%; height: 100%; z-index: 500; top: 0; left: 0; position: fixed; } #FFnS_settingsDiv { max-height: 200px; margin-top: 1%; margin-left: 15%; margin-right: 1%; border-radius: 25px; border: 2px solid #336699; background: #E0F5FF; padding: 2%; opacity: 1; } #FFnS_tabs_menu { height: 30px; clear: both; margin: 0px; padding: 0px; } #FFnS_tabs_menu li { height: 30px; line-height: 30px; display: inline-block; border: 1px solid #d4d4d1; } #FFnS_tabs_menu li.current { background-color: #B9E0ED; } #FFnS_tabs_menu li a { padding: 10px; color: #2A687D; } #FFnS_tabs_content { padding: 1%; } .FFnS_margin_element { margin-left: 2% } .FFnS_FilteringList { display: none; width: 100%; max-height: 140px; overflow-y: auto; overflow-x: hidden; } .FFnS_settings_span { display: inline; vertical-align: middle; } .FFnS_icon { vertical-align: middle; height: 20px; width: 20px; cursor: pointer; } .FFnS_keyword { vertical-align: middle; background-color: #35A5E2; border-radius: 20px; color: #FFF; cursor: pointer; } </style>");