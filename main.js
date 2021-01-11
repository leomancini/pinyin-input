async function getCharacterCandidates(params) {
    const settings = {
        numResults: 5
    };

    let request = await fetch(`https://www.google.com/inputtools/request?ime=pinyin&ie=utf-8&oe=utf-8&app=translate&num=${settings.numResults}&text=${params.pinyin}`);
    let response = await request.json();

    // TODO: Clean this up to make it more readable
    if (response && response[1] && response[1][0] && response[1][0][1]) {
        return response[1][0][1];
    } else {
        return null;
    }
}

function createNewPinyinInput() {
    const newPinyinInput = document.createElement('div');
    newPinyinInput.classList = 'pinyinInput';
    newPinyinInput.innerText = '';
    enablePinyinInput(newPinyinInput);

    return newPinyinInput;
}


function createNewPinyinInputContainer() {
    const newPinyinInputContainer = document.createElement('div');
    newPinyinInputContainer.classList = 'pinyinInputContainer';

    newPinyinInputContainer.onmousedown = function (e) {
        if (e.target.classList.contains('pinyinInputContainer')) {
            e.preventDefault();
            // If an existing input is not clicked, focus the last field
            this.lastChild.querySelector('.textField').focus();
        }
    };
    
    const existingTextContainer = document.createElement('span');
    existingTextContainer.classList = 'existingTextContainer';
    existingTextContainer.setAttribute('role', 'textbox');
    existingTextContainer.setAttribute('contenteditable', true);
    existingTextContainer.setAttribute('spellcheck', false);
    newPinyinInputContainer.appendChild(existingTextContainer);

    const newPinyinInput = createNewPinyinInput();
    newPinyinInputContainer.appendChild(newPinyinInput);

    existingTextContainer.onmouseup = function (e) {
        let selection = getSelectionCharacterOffsetWithin(this);
        
        if (!e.target.classList.contains('existingTextContainer') && selection.end === this.innerText.length) {
            console.log('end');
            this.blur();
            this.parentNode.querySelector('.pinyinInput .textField').focus();
        }

        // TODO: Do something with selection (mark as correct, incorrect, etc)
        if (selection.start !== selection.end) {
            console.log(selection);
        }
    };

    existingTextContainer.onkeypress = function (e) {
        let selection = getSelectionCharacterOffsetWithin(this);
        
        if (selection.end === this.innerText.length) {
            // When typing at the end of existing text, focus pinyin input at the end of the existing text
            this.blur();
            this.parentNode.querySelector('.pinyinInput .textField').focus();
        } else {
            // TODO: Add new pinyin input when typing within existing text
            console.log('typing in the middle');
        }
    }

    return newPinyinInputContainer;
}

function enablePinyinInput(element) {
    const textField = document.createElement('span');
    textField.classList = 'textField';
    textField.setAttribute('role', 'textbox');
    textField.setAttribute('contenteditable', true);
    textField.setAttribute('spellcheck', false);
    element.appendChild(textField);

    textField.onkeyup = async function(keypress) {
        if (textField.innerText == '') {
            if (keypress.key === 'Backspace') {
                textField.blur();
                const existingTextContainer = element.parentNode.querySelector('.existingTextContainer');
                existingTextContainer.focus();
                existingTextContainer.innerText = existingTextContainer.innerText.slice(0, -1);

                moveCaretToEnd(existingTextContainer);
            }
            hideCharacterCandidatesContainer(element);
        } else if (keypress.key >= 'a' && keypress.key <= 'z' && keypress.key !== 'Enter') { // If input is not a number
            renderCharacterCandidates({ element, inputText: textField.innerText });
        }
    }
    
    textField.onkeypress = function(keypress) {
        if (!isNaN(parseInt(keypress.key))) { // If input is a number
            const number = parseInt(keypress.key);
            keypress.preventDefault();
        
            if (window.characterCandidates && window.characterCandidates[number-1]) {
                addCharacterToInput(element, { index: number-1 });
            }
    
            return false;
        } else if (keypress.key == 'Enter') {
            keypress.preventDefault();

            if (window.characterCandidates && window.characterCandidates[0]) {
                addCharacterToInput(element, { index: 0 });
            }

            return false;
        }
    }
}

function addCharacterToInput(element, params) {
    const existingTextContainer = element.parentNode.querySelector('.existingTextContainer');
    existingTextContainer.innerText += window.characterCandidates[params.index];

    const textField = element.querySelector('.textField');
    textField.remove();

    const newPinyinInput = createNewPinyinInput();

    element.parentNode.insertBefore(newPinyinInput, element.nextSibling);
    newPinyinInput.querySelector('.textField').focus();

    hideCharacterCandidatesContainer(element);
    window.characterCandidates = [];

    element.remove();
}

function hideCharacterCandidatesContainer(element) {
    if (element.querySelector('.characterCandidatesContainer')) {
        element.querySelector('.characterCandidatesContainer').remove();
    }
}

async function renderCharacterCandidates(params) {
    window.characterCandidates = await getCharacterCandidates({ pinyin: params.inputText });

    if (characterCandidates) {
        hideCharacterCandidatesContainer(params.element);

        const characterCandidatesContainer = document.createElement('div');
        characterCandidatesContainer.classList = 'characterCandidatesContainer';
        params.element.appendChild(characterCandidatesContainer);

        window.characterCandidates.map((characterCandidate, index) => {
            const labelContainer = document.createElement('label');

            const numberContainer = document.createElement('span');
            numberContainer.classList = 'number';
            numberContainer.innerText = index + 1;
            labelContainer.appendChild(numberContainer);

            const textContainer = document.createElement('span');
            textContainer.classList = 'text';
            textContainer.innerText = characterCandidate;
            labelContainer.appendChild(textContainer);

            labelContainer.onclick = function() {
                addCharacterToInput(params.element, { index });
            };
        
            characterCandidatesContainer.appendChild(labelContainer);
        });
    }
}

window.onload = function () {
    const inputsContainer = document.querySelector('#inputsContainer');

    if (inputsContainer.dataset.characterInputType === 'pinyin') {
        const firstPinyinInput = createNewPinyinInputContainer();
        inputsContainer.appendChild(firstPinyinInput);
        firstPinyinInput.querySelector('.textField').focus();

        inputsContainer.onclick = function (e) {
            if (e.target.id === 'inputsContainer') {
                this.querySelector('.existingTextContainer').blur();
                this.lastChild.querySelector('.textField').focus();
            }
        }
    }
}