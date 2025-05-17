# How to use quotes for Neopets Custom Quotes Script

Neopets Custom Quote Script is a userscript that will allow your neopets to say things while browsing the new-style pages! This userscript also replaces the old-style page's quotes with the custom quotes.

I have a basic custom quotes page if you just want to get started/test the script for yourself, but this script also allows for customizable quotes for you to make yourself!


## Basic Custom Quotes, straight from the userscript
Simply download or copy the userscript "Neopets Custom Quotes", it will retrieve quote data from the JSON files here. Your basic quote script is ready to go!
After you download or copy the contents of the userscript, go to your userscript manager (usually TamperMonkey or GreaseMonkey) and put the script there.

## How to make your own custom quotes
You can also write your own JSON object for the userscript to reference!

1. The most simple way to host your JSON text is to put it on github, so I will explain it here.
2. You can copy the text from my two JSON files to get the formatting correct.
3. On a text editor, paste and replace all of the quotes with your own, following the formatting (i.e, keep all quotes inside double quotations, put a comma after the quote, and KEEP the variable names "petQuotes" and "randomPetQuotes" and "petQuotesUser").
DO NOT change anything but what's inside the quotes!
4. To host on github, make an account and create a repository, name it something meaningful but otherwise whatever you like, and upload the files. The file names can be whatever you want. Click "commit changes." After uploading
5. After the files are uploaded, get their direct links by clicking the "raw" button shown above their filename.
6. Copy the URL that it takes you to, and edit the userscript so that WUOTES_URL points to the URL you just copied.
Replace the URLs only.

**IMPORTANT**
Changes in the GitHub may take a while to reflect in the raw URL. You may need to manually delete cache data from this program if you have errors while trying to customize it. If you are not comfortable manually deleting cache, simply log-out of neopets and the program will delete it for you. You can safely log back in. The web page's console will print out errors if the program is struggling to run. To check the console, right click any page on neopets, click "inspect", and then navigate to "console."

On firefox: https://firefox-source-docs.mozilla.org/devtools-user/web_console/index.html

**Download userscripts at your own risk. Always run a userscript through a virus checker. Userscripts can easily be used maliciously, if someone customizes this script and resubmits it elsewhere, run that new
script through a virus checker, too!**

Happy Quoting!?... Phrasing? Enjoy the userscript!
