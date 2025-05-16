// ==UserScript==
// @name         Custom Pet-Quotes
// @namespace    http://tampermonkey.net/
// @version      2025-05-11
// @description  provide new-age pet quotes for the revamped neopet's pages
// @author       bat_soup
// @match        https://www.neopets.com/*
// ==/UserScript==


//TODO
//https://itemdb.com.br/api/v1/search?type[]=!nc&rarity[]=0&rarity[]=85&status[]=active&category=grooming&category=plushies&category=toy&category=spooky%20food&category=food
//work on more categories to grab from itemdb

(function() {
	'use strict';
	console.log("inside IIFE");

	//GLOBAL VARIABLES
	const userData = {
		username : '',
		activePet : '',
		petList : '',
	};
	const quotes = [];

	//neopetsquotesache	===contains array of quotes
	//pet list gathered on page load for edge cases
	//active pet gathered on page load because changes frequently
    //user gathered on page load because might as well since I'm on quickref anyway

	let setUpData = (async () => {
		const QUOTES_CACHE_KEY = 'neopetsQuotesCache';
		const QUOTES_URL = 'https://raw.githubusercontent.com/bat-soup/petQuotes/refs/heads/updated/petQuotes.json';
		const QUOTES_TIME = 12 * 1000; //short for testing

		const USER_URL = 'https://www.neopets.com/quickref.phtml'


		console.log("inside anon function");
		let isLoggedIn = document.cookie.includes('neologin');
		if(!isLoggedIn) {
			localStorage.removeItem(QUOTES_CACHE_KEY);
			localStorage.removeItem(`${QUOTES_CACHE_KEY}_expiresAt`);
			console.warn("User not logged in, not running quotes this page.");
			return false;
		}

		//get user and pet list/active pet first
		await getPetListAndActivePet(USER_URL);
		//grab random pet
		const randomPetGrab = userData.petList[Math.floor(Math.random() * userData.petList.length)];

        console.log(userData.username, userData.petList, userData.activePet);

		//get quotes
		const quoteObject = await fetchCachedItems(QUOTES_URL, QUOTES_CACHE_KEY, QUOTES_TIME);
		quotes.push(...(quoteObject?.petQuotes ?? []); // initial quote load
        quotes.push(...(quoteObject.petQuotesUser?.map(q => q.replace("{user}", userData.username)) ?? []));

		//if user has multiple pets
		if(userData.petList.length > 1) {
			let randomPetGrab = '';
			do{
				randomPetGrab = userData.petList[Math.floor(Math.random() * userData.petList.length)];
                console.log(randomPetGrab);
			}while (randomPetGrab == userData.activePet) //make sure active pet isn't selected

			quotes.push(...quoteObject.randomPetQuotes.map(q => q.replace("{pet}", randomPetGrab))); //load in quotes if user has more than one pet
		}
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
	async function fetchCachedItems(url, cacheKey, expiresTime){
		const expireKey = `${cacheKey}_expiresAt`;

		const expireAt = Number(localStorage.getItem(expireKey) || '0');
		const now = Date.now();

		const isExpired = now > expireAt;
        console.log(isExpired, now, expireAt);

		if(isExpired) { //will go off if cacheKey is missing too
			console.log("Data from cache ", cacheKey, " is stale or missing. Fetching new data.");
			try {
				const response = await fetch(url);
				if(!response.ok) { throw new Error("Unable to fetch data from ", url);}

				const data = await (response.json());
				localStorage.setItem(cacheKey, JSON.stringify(data));
				localStorage.setItem(expireKey, (Date.now() + expiresTime).toString());
				console.log("Fetched and cached data to key: ", cacheKey);
				return data;
			} catch (e) {
				console.warn("Fetch failed. Cache not updated at ", cacheKey, e);
				const cachedData = JSON.parse(localStorage.getItem(cacheKey));
				if(!cachedData){
					console.warn("Cache key ", cacheKey, " does not exist.");
					return null;
				}

			}
		}
		else {
			console.log("Cache is fresh. No fetch needed.")
			const cachedData = JSON.parse(localStorage.getItem(cacheKey));
            console.log(cachedData);
			return cachedData;
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
