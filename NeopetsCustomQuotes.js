// ==UserScript==
// @name         Custom Pet-Quotes PET-BASED
// @namespace    http://tampermonkey.net/
// @version      2025-05-11
// @description  provide new-age pet quotes for the revamped neopet's pages, specific to pet lore
// @author       bat_soup
// @match        https://www.neopets.com/*
// ==/UserScript==

//TODO MAKE AN EDGE CASE FOR PET NOT HAVING A SPECIFIC QUOTE DOCUMENT



(function() {
	'use strict';

	//GLOBAL VARIABLES
	const userData = {
		username : '',
		activePet : '',
		petList : '',
	};
	const quotes = [];

	//falback URL if specific pet doesn't have custom quotes
	const FALLBACK_QUOTE_URL = 'https://raw.githubusercontent.com/bat-soup/petQuotes/refs/heads/customToPets/petQuotes.json';
	const FALLBACK_KEY = 'neopetsQuotesCache'
	const FALLBACK_OBJ_KEY = 'petQuotes'

	//neopetsquotesache	===contains array of quotes
	//pet list gathered on page load for edge cases
	//active pet gathered on page load because changes frequently
    //user gathered on page load because might as well since I'm on quickref anyway

	let setUpData = (async () => {
		//different links for each pet for speed
		//upload to cache in separate keys, only parse to array if that pet is active
		const QUOTES_TIME = 60 * 60 * 1000 * 24 * 7; //one week
		const USER_URL = 'https://www.neopets.com/quickref.phtml'

		let isLoggedIn = document.cookie.includes('neologin');
		if(!isLoggedIn) {
			for (let i = 0; i < localStorage.length; i++) {
    			const key = localStorage.key(i);
    			if (key && key.includes("neopetsQuotesCache")) {
      				localStorage.removeItem(key);
      				i--;
    			}
    		}
			console.warn("User not logged in, not running quotes this page.");
			return false;
		}
		//randomPetGrab not necessary, remove
		//get user and pet list/active pet first
		await getPetListAndActivePet(USER_URL);

		//normalize names
		const normalizedActivePet = userData?.activePet?.replace(/_/g, "").toLowerCase() || '';

		const normalizedPets = userData?.petList?.map(pet => pet.replace(/_/g, "").toLowerCase()) || [];
		if(normalizedPets.length){
			for(const petName of normalizedPets) {
				let QUOTES_CACHE_KEY = `neopetsQuotesCache_${petName}`;
				let QUOTES_URL = `https://raw.githubusercontent.com/bat-soup/petQuotes/refs/heads/customToPets/${petName}Quotes.json`;
				await fetchCachedItemsAndPushQuotes(QUOTES_URL, QUOTES_CACHE_KEY, QUOTES_TIME, normalizedActivePet);
			}
		}

        console.log(userData.username, userData.petList, userData.activePet);

	})();

 //=====START EVENT LISTENER=====
    window.addEventListener('load', async () => {
            await setUpData;

            console.log("inside event listener");
            //check for data
            if(!quotes.length || !userData.username || !userData.petList || !userData.activePet){
                console.warn("Required data missing. Aborting execution.");
                return;
            }

            //generate random quote
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            console.log(randomQuote);
            appendQuote(randomQuote);

        });
//====HELPER FUNCTIONS======
	async function fetchCachedItemsAndPushQuotes(url, cacheKey, expiresTime, activePet){
		const expireKey = `${cacheKey}_expiresAt`;
		const expireAt = Number(localStorage.getItem(expireKey) || '0');
		const now = Date.now();
		const isExpired = now > expireAt;

		if(isExpired) { //will go off if cacheKey is missing too
			console.log("Data from cache ", cacheKey, " is stale or missing. Fetching new data.");
			try {
				const response = await fetch(url);
				if(!response.ok) { throw new Error("Unable to fetch data from ", url);}

				const data = await response.json();

				localStorage.setItem(cacheKey, JSON.stringify(data));
				localStorage.setItem(expireKey, (now + expiresTime).toString());
				console.log("Fetched and cached data to key: ", cacheKey);

				if(cacheKey.includes(activePet)){
                    if(!data[`${activePet}Quotes`]) throw new Error(`Expected ${activePet}Quotes as JSON key. Double check syntax.`);
					quotes.push(...data[`${activePet}Quotes`] ?? []);
				}

			} catch (e) {
				console.warn("Fetch failed. Cache not updated at ", cacheKey, e);

				const fallbackExpireKey = `${FALLBACK_KEY}_expiresAt`;
				const fallbackExpireAt = Number(localStorage.getItem(fallbackExpireKey) || '0');
				const fallbackIsExpires = now > fallbackExpireAt;

				const cachedData = JSON.parse(localStorage.getItem(cacheKey));
				if(!cachedData){
					console.warn("Cache key ", cacheKey, " does not exist. Falling back to basic quotes");

					let fallbackData = JSON.parse(localStorage.getItem(FALLBACK_KEY));
					if(!fallbackData || isExpired) {
						console.warn("Fallback key not found or stale, fetching from fallback url.");
						try {
							const response = await fetch(FALLBACK_QUOTE_URL)
							if(!response.ok) throw new Error("Unable to fetch data from ", FALLBACK_QUOTE_URL);

							const data = await response.json();
							localStorage.setItem(FALLBACK_KEY, JSON.stringify(data));
							localStorage.setItem(`${FALLBACK_KEY}_expiresAt`, (now + expiresTime).toString());

							console.log("Successfully fetched from fallback.")
								if(cacheKey.includes(activePet)){
									quotes.push(...data[FALLBACK_OBJ_KEY]);
								}
						} catch (e) {
							console.error("Could not cache quotes at ", FALLBACK_KEY, e);
							return;
						}
					}

				}

			}
			return;
		}else {
           console.log("Data fresh. No fetch required");
           if (cacheKey.includes(activePet)) {
               let cacheData = JSON.parse(localStorage.getItem(cacheKey));
               if(!cacheData[`${activePet}Quotes`]) throw new Error(`Expected ${activePet}Quotes as JSON key. Double check syntax.`);
               quotes.push(...cacheData[`${activePet}Quotes`] ?? []);
            }
        }

	}

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
			userData.activePet = activePetImg.title.trim();

		} catch(e) {
			console.error("Failed to get list of pets or active pet.");
		}
		return;
	}

	function appendQuote(randomQuote) {

		//check for existingquote, the case for old pages
        const existingQuote = document.querySelector('.neopetPhrase');
        const oldPage = document.querySelector('#neobdy'); //found on old pages
        console.log(oldPage);

        if (existingQuote) {
            console.log("Quote already exists");
        	existingQuote.innerHTML =
                `<b>${userData.activePet} says: </b>
                 <br> ${randomQuote}`;
                 return ;
        }

        const showQuote = oldPage ? false : Math.random() < .9; //30% chance to show TODO RESET
        console.log(showQuote);
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
            backgroundColor: 'f2f7f9',
            border: '1px solid #999',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '18px',
            fontFamily: 'Cafeteria, "Arial Bold", sans-serif',
            zIndex: '9999',
            boxShadow: '0 0 6px rgba(0,0,0,0.2)',
            pointerEvents: 'none' // prevents blocking clicks
         });
        //for random old quotes on old pages, append custom quote instead
        //check if on old page, if old quote showed up


        document.body.appendChild(quoteBox);
    }
})();
