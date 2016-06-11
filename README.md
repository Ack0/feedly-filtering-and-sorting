# Feedly filtering and sorting

When this script is enabled, a filter icon will appear next to the settings icon that toggles the filtering and sorting menu.

![Toggle button](https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/screenshots/toggle%20button.PNG)

![Menu](https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/screenshots/menu.PNG)

## Installation

This script relies on the user scripts extensions like Greasemonkey or Tampermonkey.

After installing the appropriate user scripts extension, the script will be installed after opening it in the navigator (the extension will ask you to confirm).

### Firefox

The [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) extension should be installed.

###  Google Chrome

The [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en) extension should be installed.

## Dev Installation
Install NodeJS & NPM (https://nodejs.org/en/download).

```
npm install
npm install -g grunt
npm install -g typings
typings install

To build manually:
grunt

To automatically build on source code change:
grunt watch
```