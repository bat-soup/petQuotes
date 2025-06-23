// ==UserScript==
// @name         Custom Pet-Quotes PET-BASED -TEST
// @namespace    http://tampermonkey.net/
// @version      2025-05-11
// @description  provide new-age pet quotes for the revamped neopet's pages, specific to pet lore
// @author       bat_soup
// @match        https://www.neopets.com/*
// @exclude      https://www.neopets.com/trudydaily/game.phtml
// @exclude      https://www.neopets.com/trudys_surprise.phtml
// @exclude      https://www.neopets.com/ntimes/*
// @exclude      https://www.neopets.com/~*
// @run-at       document-start
// ==/UserScript==


(function() {
	'use strict';

	const userData = {
		username: '',
		activePet: '',
		petList: []
	};

	const quotes = [];

	//specific url and key for fallback quotes
	const FALLBACK_QUOTE_URL = 'https://raw.githubusercontent.com/bat-soup/petQuotes/refs/heads/customToPets/petQuotes.json';
	const FALLBACK_KEY = 'petQuotes';

	let setUpData = (async () => {
		//different links for each pet for speed and edge cases
		const QUOTES_TIME = 60 * 60 ; //one week
		const USER_URL = 'https://www.neopets.com/quickref.phtml';

		//if logged out, abort and clear all neopetsquote cache keys
		let isLoggedIn = document.cookie.includes('neologin');
		if(!isLoggedIn) {
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && key.includes("neopetsQuotesCache")) {
					localStorage.removeItem(key);
					i--;
				}
			}
			console.warn("User not logged in, not running quotes on this page.");
			return false;
		}

		await getPetListAndActivePet(USER_URL);

		//normalize names
		const normalizedActivePet = userData.activePet?.replace(/_/g, "").toLowerCase() || '';
		//not sure if normalized petlist is necessary
		const normalizedPets = userData.petList?.map(pet => pet.replace(/_/g, "").toLowerCase()) || [];

		//setting up cache key and url for active pet
		let QUOTES_CACHE_KEY = `neopetsQuotesCache_${normalizedActivePet}`;
		let QUOTES_URL = `https://raw.githubusercontent.com/bat-soup/petQuotes/refs/heads/customToPets/${normalizedActivePet}Quotes.json`;
		await fetchCachedItemsAndPushQuotes(QUOTES_URL, QUOTES_CACHE_KEY, QUOTES_TIME, normalizedActivePet);


})();

//======START EVENT LISTENER=======
    window.addEventListener('load', async () => {
            await setUpData;
            //check for data
            if(!quotes.length || !userData.username || !userData.petList.length || !userData.activePet){
                console.warn("Required data missing. Aborting execution.");
                return;
            }

            //generate random quote
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            console.log(randomQuote);
            appendQuote(randomQuote);

        });

    //======HELPER FUNCTIONS======

    async function fetchCachedItemsAndPushQuotes(url, cacheKey, expiresTime, activePet) {
    	const expireKey = `${cacheKey}_expiresAt`
    	const now = Date.now();
    	const expireAt = Number(localStorage.getItem(expireKey) || '0');
    	const isExpired = now > expireAt;
    	const existData = localStorage.getItem(cacheKey);

    	//mini helper: push quotes from cache into global quotes array
    	//data: MUST ALWAYS BE FROM CACHE AT THIS POINT
    	function pushQuotesFromCache(data){
    		const petQuotes = data?.[`${activePet}Quotes`];
    		if (Array.isArray(petQuotes)) {
    			quotes.push(...petQuotes);
    			console.log(`Successfully loaded ${petQuotes.length} quotes for ${activePet}`);
    		}else {
    			console.warn(`No valid quotes found for ${activePet} in data.`, data);
    		}
    	}

    	//normalizeDataKey
    	// data: object from JSON response
    	//objective: normalize JSON response into one key/value only with the key named as "{activePet}Quotes"
    	function normalizeDataKeyAndPushToCache(data) {
    		//check if data is in valid format
    		let firstValue = data[Object.keys(data)[0]];
    		if(!Array.isArray(firstValue)){
    			console.warn("Expected an array for first object key in JSON response. Please check your JSON.");
    			return null;
    		}
    		let normalizedData = {
    			[`${activePet}Quotes`] : data[Object.keys(data)[0]] //just grab first key
    		};
    		localStorage.setItem(cacheKey, JSON.stringify(normalizedData));
    		localStorage.setItem(expireKey, (now + expiresTime).toString());
    	}
    	//end mini helper

    	if(isExpired || !existData){
    		console.log("Cache expired or missing: ", cacheKey, ". Fetching fresh data.");
    		try {
    			const response = await fetch(url);
    			if(!response.ok) throw new Error(`Fetch failed for ${url} with status ${response.status}`);

    			const data = await response.json();
    			normalizeDataKeyAndPushToCache(data);
    		}catch (fetchError) {
    			console.warn("Attempting fallback URL.", fetchError);
    				//attempt fallback fetch first, then try cache
    				try {
    					console.log("Fetching fallback quotes from: ", FALLBACK_QUOTE_URL);
    					const fallbackResp = await fetch(FALLBACK_QUOTE_URL);
    					if(!fallbackResp.ok) throw new Error(`Fallback fetch failed with status ${fallbackResp.status}`);

    					const fallBackData = await fallbackResp.json();
    					normalizeDataKeyAndPushToCache(fallBackData);
    				} catch(fallbackError){
    					console.warn("Fallback fetch failed, ", fallbackError);
    					if(existData){ //if cachekey exists after all
    						normalizeDataKeyAndPushToCache(JSON.parse(existData))
    					}else return;
    				}
    			}
    		}
    	else { //not expired or missing
    		console.log("Cache valid. Loading quotes from cache: ", cacheKey);

    		normalizeDataKeyAndPushToCache(JSON.parse(existData)) //still should normalize just in case
    	}
    	const finalCachedData = localStorage.getItem(cacheKey);
    	if (finalCachedData){
    		pushQuotesFromCache(JSON.parse(finalCachedData));
    	}

    }

    //GET PET LIST AND ACTIVE PET FROM QUICKREF

    	async function getPetListAndActivePet(url) {

		try {

			//fetching quickref and creating dom parser
			const response = await fetch(url);
			const html = await response.text();

			const parser = new DOMParser();
			const doc = parser.parseFromString(html, 'text/html');

            //grabbing username
			const userName = doc.querySelector('.user a')?.textContent.trim();
			userData.username = userName;

			//grabbing pet list
			const petImgs = doc.querySelectorAll('.pet_toggler img');
			userData.petList = [...petImgs].map(img => img.title.trim()).filter(Boolean);

			//grabbing current active pet
			const activePetImg = doc.querySelector('.active_pet .pet_toggler img');
			userData.activePet = activePetImg?.title.trim();

		} catch(e) {
			console.error("Failed to get list of pets or active pet.");
		}
		return;
	}

	//APPEND QUOTE ONTO DOC

	function appendQuote(randomQuote) {

		//check for existingquote, the case for old pages
        const existingQuote = document.querySelector('.neopetPhrase');
        const oldPage = document.querySelector('#neobdy'); //found on old pages
        const validPage = document.body.querySelector('div'); //for edge cases like coconut shy process, training school course completion.

        if (existingQuote) {
        	existingQuote.innerHTML =
                `<b>${userData.activePet} says: </b>
                 <br> ${randomQuote}`;
                 return ;
        }

        const showQuote = oldPage ? false : !validPage ? false : Math.random() < .9; //20% chance to show TODO RESET
        if(!showQuote) return;

        //style pet's name
        const petNameSpan = document.createElement('span');
        petNameSpan.textContent = `${userData.activePet} says: `;
        petNameSpan.style.fontWeight = 'bold';
        petNameSpan.style.color = '#333';
        //style quote
        const petQuoteSpan = document.createElement('span');
        petQuoteSpan.textContent = `"${randomQuote}"`;
        petQuoteSpan.style.color = '#5A5A5A';
        //create quotebox
        const quoteBox = document.createElement('div');
        quoteBox.appendChild(petNameSpan);
        quoteBox.appendChild(petQuoteSpan);

        // Style the box
        Object.assign(quoteBox.style, {
            position: 'fixed',
            top: '65px', // adjust this if needed to match header spacing
            left: '40px', // adjust to align near pet icon
            width: '140px',
            border: '1px solid #999',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '18px',
            fontFamily: 'Cafeteria, "Arial Bold", sans-serif',
            zIndex: '9999',
            boxShadow: '0 0 6px rgba(0,0,0,0.2)',
            pointerEvents: 'none' // prevents blocking clicks
         });
        quoteBox.style.setProperty('background-color', '#f2f7f9', 'important');

        document.body.appendChild(quoteBox);
    }
})();
