// store these as a config we could replace if needed
const config = {
    answerLength: 5, 
    rounds: 6,
    letters: document.querySelectorAll('.box'),
    loader: document.querySelector('.loader')
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
    const wordResponse = await apiResult.json();
    const wordAnswer = wordResponse.word.toUpperCase();
    //console.info('wordResponse', wordResponse);
    const wordParts = wordAnswer.split('');
    // stop the loading spinner after we get the response
    handleLoadingDisplay(false);

    // listen for keypresses
    document.addEventListener('keydown', function handleKeyPress(event) {
        let character = event.key
        //console.info('handle this key:', character);
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
        // update the "cursor box"
        if (document.getElementsByClassName('pulse').length) {
            document.getElementsByClassName('pulse')[0].classList.remove('pulse');
        }
        // TODO: make the 'backspace' and 'enter' keys respond better to where we "should be"
        // TODO: make clear on "win/loss" states
        if (document.getElementById('box-'+(index+1)).nextElementSibling) {
            document.getElementById('box-'+(index+1)).nextElementSibling.classList.add('pulse');
        }
    }

    // create an array of letters so we can keep track of which letters will be
    // used more than once (to avoid "close" styling on more than one)
    function buildMap(array) {
        const obj = {};
        for (let i = 0; i < array.length; i++) {
            if (obj[array[i]]) {
                obj[array[i]]++;
            } else {
                obj[array[i]] = 1;
            }
        }
        return obj;
    }

    // handle the backspace key when we need to delete a letter
    function hanldleBackspaceKey() {
        let index = currentRow * config.answerLength + currentGuess.length;
        currentGuess = currentGuess.substring(0, currentGuess.length - 1);
        config.letters[index].innerText = '';
    }

    // handle a letter guess for a box
    async function handleGuess() {
        // if the word is not filled out yet, don't do anything
        if (currentGuess.length !== config.answerLength) {
            return;
        }
        // turn on loading to do the check against the API
        handleLoadingDisplay(true);
        // if it's not a valid word we are done here
        const checkResponse = await fetch('https://words.dev-apis.com/validate-word', {
            method: 'POST',
            body: JSON.stringify({ word: currentGuess })
        });
        const checkResult = await checkResponse.json();
        handleLoadingDisplay(false);
        // flag to know if the user won
        let allCorrect;
        // if a valid word, we can do styling for guesses
        if (checkResult.validWord) {
            allCorrect = true;
            // start checking the guess
            const guessLetters = currentGuess.split('');
            const guessMap = buildMap(wordParts);
            // first pass - find the correct letters
            for (let i = 0; i < config.answerLength; i++) {
                if (guessLetters[i] === wordParts[i]) {
                    config.letters[currentRow * config.answerLength + i].classList.add('correct');
                    guessMap[guessLetters[i]]--;
                }
            }
            // second pass - find the close and wrong letters
            for (let i = 0; i < config.answerLength; i++) {
                let index = currentRow * config.answerLength + i;
                if (guessLetters[i] === wordParts[i]) {
                    // do nothing
                } else if (guessMap[guessLetters[i]] && guessMap[guessLetters[i]] > 0) {
                    allCorrect = false;
                    config.letters[index].classList.add('close');
                    guessMap[guessLetters[i]]--;
                } else {
                    allCorrect = false;
                    config.letters[index].classList.add('wrong');
                }
            }
        } else {
             // if it's invalid, do the styling updates
            for (let i = 0; i < config.answerLength; i++) {
                config.letters[currentRow * config.answerLength + i].classList.add('invalid');
            }
        }
        // next row, new guess
        currentRow++;
        currentGuess = '';
        // the win/lose flow
        if (allCorrect) {
            document.querySelector('.info-message').innerText = `You win. Congrats!`;
            document.querySelector('.info-message').classList.add('win-message');
            finishedGame = true;
        } else if (currentRow === config.rounds) {
            document.querySelector('.info-message').innerText = `You lose. \n The word was ${ wordAnswer }.`;
            document.querySelector('.info-message').classList.add('lose-message');
            finishedGame = true;
        }
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

} 
// go get started
init();