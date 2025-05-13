// ==UserScript==
// @name         Custom Pet-Quotes
// @namespace    http://tampermonkey.net/
// @version      2025-05-11
// @description  provide new-age pet quotes for the revamped neopet's pages
// @author       bat_soup
// @match        https://www.neopets.com/*
// @grant        GM_getResourceText
// @resource     quoteData https://raw.githubusercontent.com/bat-soup/petQuotes/refs/heads/main/petQuotes.json
// @resource     randomPetQuoteData https://raw.githubusercontent.com/bat-soup/petQuotes/refs/heads/main/randomPetQuotes.json
// ==/UserScript==

(function() {
    'use strict';
//====== GLOBAL VARIABLES======
    //read quoteData from raw json, insert into global "quotes"
    const jsonText = GM_getResourceText("quoteData");
    const quotes = JSON.parse(jsonText).petQuotes; //tested
    //read optional quoteData for multiple pets
    const rawQuotes = JSON.parse(GM_getResourceText("randomPetQuoteData")).randomPetQuotes; //tested
    //to replace {pet} with randomPetGrab later

//======START ASYNC======

    async function fetchUserandPetNames() {
        //test func
        console.log("inside async");
     try {
         const response = await fetch('https://www.neopets.com/quickref.phtml');
         const html = await response.text();

         const parser = new DOMParser();
         const doc = parser.parseFromString(html, 'text/html');

         //grabbing username
         const userName = doc.querySelector('.user a')?.textContent.trim();
         //grabbing pet names from image titles
         const petImgs = doc.querySelectorAll('.pet_toggler img');
         const petNames = [...petImgs].map(img => img.title.trim()).filter(Boolean);
         //grabbing current active pet
         const activePetImg = doc.querySelector('.active_pet .pet_toggler img');
         const activePet = activePetImg.title.trim();

         return { userName, petNames, activePet };
     } catch (e) {
      console.error("Failed to get user or pet names", e);
     }
    }

//=======END ASYNC=======

    window.addEventListener('load', async () => {
        //variable
        var randomPetGrab = '';

        //retrieve pet list and username from async
        const { userName, petNames, activePet} = await fetchUserandPetNames();

        //append quotes from optional if more than one pet
        if(petNames.length > 1) {
           do {
               randomPetGrab = petNames[Math.floor(Math.random() * petNames.length)]
           }while (randomPetGrab == activePet) //make sure randompet isn't same as active pet

           quotes.push(...rawQuotes.map(q => q.replace("{pet}", randomPetGrab)))
        }

        appendQuote(activePet);


    })
//=====END EVENT LISTENER======

//=====helper functions=========

    function appendQuote(activePet) {
        //check if on old page
        const onOldPage = document.querySelector('#neobdy') //id neobdy on old pages
        const existingQuote = document.querySelector('.neopetPhrase');

        //if on old page don't use randomizer on it, new page needs randomizer
        if(!onOldPage){
            const showQuote = Math.random() < .9; //30% chance to show TODO RESET
            if(!showQuote) return;
        }


        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

        //style pet's name
        const petNameSpan = document.createElement('span');
        petNameSpan.textContent = `${activePet} says: `;
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

        if (existingQuote) {
            existingQuote.innerHTML =
                `<b>${activePet} says: </b>
                 <br> ${randomQuote}`;
        }
        else if (!onOldPage) {document.body.appendChild(quoteBox);}
    }
})();
