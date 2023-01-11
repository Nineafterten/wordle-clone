// store these as a config we could replace if needed
const config = {
    answerLength: 5, 
    rounds: 6,
    letters: document.querySelectorAll('.box'),
    loader: document.querySelector('.info-container')
};
// the initial load method
async function init() {
    console.log('javascript controller initialized');
    // store values we need to depend on
    let currentRow = 0;
    let currentGuess = '';
    let isLoading = true;
    let finishedGame = false;
    // start with the loader showing
    handleLoadingDisplay(true);
    // fetch the word from the api
    const apiResult = await fetch('https://words.dev-apis.com/word-of-the-day');
    const wordAnswer = await apiResult.json();
    console.log('wordAnswer', wordAnswer);
    // stop the loading spinner after we get the response
    handleLoadingDisplay(false);

    // listen for keypresses
    document.addEventListener('keydown', function handleKeyPress(event) {
        let character = event.key
        console.log('handle this key:', character);
        // don't do anything if we are loading or if the game is done
        if (isLoading || finishedGame) {
            return;
        }
        // check for keys that aren't a letter which we should support
        switch(character) {
            case 'Enter':
                handleGuess();
            break;
            case 'Backspace':
                hanldleBackspaceKey();
            break;
        }
        // if valid letter then we can enter it
        if (isLetter(character)) {
            addLetter(character.toUpperCase());
        }
    });
    
    // add the letter to the next open box
    function addLetter(letter) {
        // add the letter to the current guess string
        if (currentGuess.length < config.answerLength) {
            currentGuess += letter;
        } else {
            currentGuess = currentGuess.substring(0, currentGuess.length - 1) + letter;
        }
        // update the new box with the letter
        let index = currentRow * config.answerLength + currentGuess.length - 1;
        config.letters[index].innerText = letter;
    }

    // let the user know this word wasn't a real one (doesn't count)
    function markInvalidWord() {
        for (let i = 0; i < config.answerLength; i++) {
            config.letters[currentRow * config.answerLength + i].classList.remove("invalid");
            // long enough for the browser to update the DOM and re-add the class
            setTimeout(() => config.letters[currentRow * config.answerLength + i].classList.add('invalid'), 0);
          }
    }

    // handle the backspace key when we need to delete a letter
    function hanldleBackspaceKey() {
        let index = currentRow * config.answerLength + currentGuess.length;
        currentGuess = currentGuess.substring(0, currentGuess.length - 1);
        config.letters[index].innerText = '';
    }

    // handle a letter guess for a box
    function handleGuess() {
        // if the word is not filled out yet, don't do anything
        if (currentGuess.length !== config.answerLength) {
            return;
        }
        // turn on loading to do the check against the API
        handleLoadingDisplay(true);
        // if it's a valid word, we can run validation checks to update the styling
        if (isValidWord()) {

        }
        handleLoadingDisplay(false);
    }

    // handle the hide/show of the loading message
    function handleLoadingDisplay(activeLoading) {
        isLoading = activeLoading;
        config.loader.classList.toggle('hidden', !activeLoading);
    }

    // check if the character is a letter and not something weird
    function isLetter(letter) {
        return /^[a-zA-Z]$/.test(letter);
    }

    // go check the word to see if it's valid
    async function isValidWord() {
        const checkResponse = await fetch('https://words.dev-apis.com/validate-word', {
            method: 'POST',
            body: JSON.stringify({ word: currentGuess })
        });
        const checkResult = await checkResponse.json();
        console.log('validWord', checkResult.validWord);
        // if it's invalid, do the styling updates
        if (!checkResult.validWord) {
            markInvalidWord();
            return;
        }
    }

} 
// go get started
init();