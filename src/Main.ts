/// <reference path="./_references.d.ts" />

import * as cst from "constants";
import * as $ from "jquery";
import * as NodeCreationObserver from "node-creation-observer";
import {TopicManager} from "./TopicManager";
import {Subscription} from "./Subscription";
import {FilteringType} from "./Subscription";
import {callbackBind} from "./Utils";
import {$id} from "./Utils";
import {DAO} from "./DAO";

var subscription = new Subscription("");
var topicManager = new TopicManager(subscription);
var tmBind = callbackBind(topicManager);

$(document).ready(function() {
    var enableFilteringCheckId = "enableFiltering";
    var enableRestrictingCheckId = "enableRestricting";
    var settingsDivId = "settingsDiv";
    var settingsBtnId = "settingsBtn";

    // Adding filtering configuration
    NodeCreationObserver.onCreation(cst.settingsDivPredecessorSelector, function() {
        console.log("Feedly page fully loaded");
        // Settings Button
        var settingsBtn = '<img id="' + settingsBtnId + '" class="pageAction requiresLogin" style="display: inline; width: 24px; height: 24px;" src="' + cst.filterIconLink + '" ' + cst.toggleSrcAttr + '="' + cst.closeIconLink + '" alt="icon"/>';
        $(cst.settingsBtnPredecessorSelector).after(settingsBtn);

        // Settings Div
        var settingsDiv =
            '<div id="' + settingsDivId + '" >' +

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
            topicManager.filteringListHTML(FilteringType.RestrictedOn) +
            '</div>' +

            // Filtered out keyword list
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Filtered out keyword list: </span>' +
            topicManager.filteringListHTML(FilteringType.FilteredOut) +
            '</div>' +

            '</div>';
        $(this).after(settingsDiv);

        // Set checkbox & select boxes correct state
        var filteringCheck = $id(enableFilteringCheckId);
        filteringCheck.prop('checked', subscription.filteringEnabled);
        var restrictingCheck = $id(enableRestrictingCheckId);
        restrictingCheck.prop('checked', subscription.restrictingEnabled);
        var sortingCheck = $id(cst.sortingEnabledId);
        sortingCheck.prop('checked', subscription.sortingEnabled);
        var sortingTypeSelect = $id(cst.sortingTypeId);
        sortingTypeSelect.val(subscription.sortingType);
        var dao: DAO = subscription.getDAO();
        // Checkbox & select boxes events
        filteringCheck.change(function() {
            subscription.filteringEnabled = $(this).is(':checked');
            dao.setValue(cst.filteringEnabledId, subscription.filteringEnabled);
            topicManager.refreshTopics();
        });
        restrictingCheck.change(function() {
            subscription.restrictingEnabled = $(this).is(':checked');
            dao.setValue(cst.restrictingEnabledId, subscription.restrictingEnabled);
            topicManager.refreshTopics();
        });
        sortingCheck.change(function() {
            subscription.sortingEnabled = $(this).is(':checked');
            dao.setValue(cst.sortingEnabledId, subscription.sortingEnabled);
            topicManager.refreshTopics();
        });
        sortingTypeSelect.change(function() {
            subscription.sortingType = sortingTypeSelect.val();
            dao.setValue(cst.sortingTypeId, subscription.sortingType);
            topicManager.refreshTopics();
        });

        // Setting button events
        $id(settingsBtnId).click(function() {
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
        topicManager.setUpFilteringListEvents();
    }, true);

    // Reset titles array when changing page
    NodeCreationObserver.onCreation(".feedUnreadCountHint, .categoryUnreadCountHint", tmBind(topicManager.resetSorting));

    // New topics listener
    NodeCreationObserver.onCreation(cst.topicSelector, tmBind(topicManager.refreshTopic));

});
