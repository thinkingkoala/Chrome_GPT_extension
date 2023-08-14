// Display the banner at the top of the page
function displayBanner(text) {
    // Create or update the existing banner
    let banner = document.getElementById('gptSummary');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'gptSummary';
        banner.style.backgroundColor = '#3d507b';
        banner.style.color = 'white';
        banner.style.padding = '10px';
        banner.style.position = 'fixed';
        banner.style.top = '0px';
        banner.style.left = '0px';
        banner.style.width = '100%';
        banner.style.zIndex = '9999';
        banner.style.textAlign = 'center';
        banner.style.display = 'flex';
        banner.style.flexFlow = 'row-reverse';

        // Close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;'; // Using the "×" character
        closeButton.style.backgroundColor = 'transparent';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '30px';
        closeButton.style.color = 'white';
        closeButton.style.cursor = 'pointer';
        closeButton.style.float = 'right';
        closeButton.style.marginRight = '20px';
        closeButton.style.borderRadius = '25px';
        closeButton.style.fontSize = '20px';
        closeButton.style.height = '20px';
        closeButton.addEventListener('click', () => {
            banner.remove();
        });

        banner.appendChild(closeButton);
    }

    // Set the banner text
    const bannerText = document.createElement('p');
    bannerText.textContent = text;
    bannerText.style.padding = '0px 20px';
    bannerText.style.fontSize = 'medium';
    bannerText.style.textAlign = 'justify';
    bannerText.style.fontFamily = 'PT Sans, sans-serif';
    bannerText.style.whiteSpace = 'pre-line'; // Preserve line breaks
    banner.appendChild(bannerText);

    // Insert or update the banner
    const body = document.body;
    if (body) {
        body.insertBefore(banner, body.firstChild);
    }
}

// Fetch the summary for the given text and display it
async function summarize(text) {
    return new Promise((resolve, reject) => {
    // Use the user's stored API key
        chrome.storage.sync.get('openAIApiKey', async (key) => {
            try {
                // Set up the request to send to the endpoint
                options = {
                    "method": "POST",
                    "headers": {
                        "accept": "application/json",
                        "content-type": "application/json",
                        "authorization": "Bearer " + key.openAIApiKey
                    },
                    // Chat completion API
                    // Reference: https://platform.openai.com/docs/api-reference/making-requests
                    "body": JSON.stringify({
                        "model": "gpt-3.5-turbo-16k",
                        "messages": [{"role": "system", "content": systemPrompt}, {"role": "user", "content": text}],
                        "temperature": 0.4,
                        "max_tokens": 256
                    })
                };

                const response = await (await fetch('https://api.openai.com/v1/chat/completions', options)).json();

                if (response.error !== undefined) {
                    // If there's no message in the endpoint's response,
                    // display whatever error message it returned
                    displayBanner("There was an error: " + response.error.message);
                    resolve();
                } else {
                    // Otherwise, display the summary
                    displayBanner("tl;dr: " + response.choices[0].message.content);
                    resolve();
                }
            } catch(error){
                reject('An error occurred: ' + error.message);
            }
        });
    });
}

// Returns text from the page
function extractTextFromNode(node) {
    // Exclude style, script, and link tags
    if (node.nodeName === 'STYLE' || node.nodeName === 'SCRIPT' || node.nodeName === 'LINK') {
        return '';
    }

    if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent.trim();
    }

    let text = '';
    for (const childNode of node.childNodes) {
        text += extractTextFromNode(childNode);
    }
    return text + '\n';
}

async function run() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('openAIApiKey', async key => {
            if (key.openAIApiKey === undefined) {
                // If there's no saved API key, tell the user how to add one
                displayBanner("Please set an API key in GPT Extension >> Options");
                resolve();
            } else {
                // If there is a key, we can use it to summarize the page
                var textContent = extractTextFromNode(document.body);
                //take only charLimit first symbols
                textContent = textContent.slice(0, charLimit);
                try {
                    await summarize(textContent);
                } catch (error) {
                    displayBanner(error);
                }
                resolve();
            }
        });
    });
}

//when using gpt-3.5-turbo the limit is 4k tokens, 250 of which will be used for output, so the text must be 15k symbols max
//for gpt-3.5-turbo-16k the text limit would be around 60k symbols
//don't forget to let some tokens for the system prompt
const charLimit = 59000;
const systemPrompt = `You are a Webpage Digest Creator. Your task is to condense and distill the essential information from a given content and provide a concise and easily digestible summary. 

The summary should capture the main takeaways and key points while eliminating unnecessary details. 

Format the output in a clear and organized manner, using bullet points for the main points. Include any important details or quotes if applicable. 

The goal is to save readers' time and provide a quick understanding of the webpage's content.`;